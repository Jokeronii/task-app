import { eq } from "drizzle-orm";
import { db } from "../db";
import { tasks, workflows, workflowExecutions } from "../db/schema";

export interface ActionStep {
  type: "action";
  actionType: "update_task" | "log_message";
  fields?: {
    status?: "todo" | "in_progress" | "done";
    priority?: number;
  };
  template?: string;
}

export interface ConditionStep {
  type: "condition";
  field: "priority" | "status" | "metadata.tags";
  operator: "equals" | "greater_than_or_equal" | "contains";
  value: any;
  ifTrue: (ConditionStep | ActionStep)[];
  ifFalse: (ConditionStep | ActionStep)[];
}

export type WorkflowStep = ConditionStep | ActionStep;

function interpolateString(template: string, task: any): string {
  try {
    return template.replace(
      /\{\{\s*task\.([a-zA-Z0-9_.]+)\s*\}\}/g,
      (match, path) => {
        // Jika mendeteksi metadata.tags atau sejenisnya
        if (path.startsWith("metadata.")) {
          const subPath = path.split(".")[1];
          return task.metadata?.[subPath]
            ? JSON.stringify(task.metadata[subPath])
            : "";
        }
        return task[path] !== undefined ? String(task[path]) : "";
      },
    );
  } catch (err) {
    return template;
  }
}

function evaluateCondition(task: any, step: ConditionStep): boolean {
  let actualValue: any;

  if (step.field === "metadata.tags") {
    actualValue = task.metadata?.tags || [];
  } else {
    actualValue = task[step.field];
  }

  switch (step.operator) {
    case "equals":
      return String(actualValue) === String(step.value);
    case "greater_than_or_equal":
      return Number(actualValue) >= Number(step.value);
    case "contains":
      if (Array.isArray(actualValue)) {
        return actualValue.includes(step.value);
      }
      return String(actualValue).includes(String(step.value));
    default:
      return false;
  }
}

export async function runWorkflowEngine(
  triggerEvent: "task_created" | "task_updated",
  currentTask: any,
) {
  const activeWorkflows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.isEnabled, true));

  const filteredWorkflows = activeWorkflows.filter(
    (w) => w.triggerEvent === triggerEvent,
  );

  for (const workflow of filteredWorkflows) {
    const stepsRunLog: any[] = [];
    let isSuccess = true;

    let taskState = { ...currentTask };

    async function executeSteps(steps: WorkflowStep[]) {
      for (const step of steps) {
        try {
          if (step.type === "condition") {
            const isMatch = evaluateCondition(taskState, step);
            stepsRunLog.push({
              step: `Condition Check: ${step.field} ${step.operator} ${step.value}`,
              status: "EVALUATED",
              output: { result: isMatch },
            });

            if (isMatch) {
              await executeSteps(step.ifTrue);
            } else {
              await executeSteps(step.ifFalse);
            }
          } else if (step.type === "action") {
            if (step.actionType === "update_task" && step.fields) {
              const [updated] = await db
                .update(tasks)
                .set({
                  ...step.fields,
                  updatedAt: new Date(),
                })
                .where(eq(tasks.id, taskState.id))
                .returning();

              if (updated) {
                taskState = { ...updated };
                stepsRunLog.push({
                  step: "Action: Update Task",
                  status: "SUCCESS",
                  input: step.fields,
                  output: updated,
                });
              }
            } else if (step.actionType === "log_message" && step.template) {
              const logResult = interpolateString(step.template, taskState);
              stepsRunLog.push({
                step: "Action: Log Message",
                status: "SUCCESS",
                input: { template: step.template },
                output: { message: logResult },
              });
              console.log(`[Workflow Log][${workflow.name}]: ${logResult}`);
            }
          }
        } catch (err: any) {
          isSuccess = false;
          stepsRunLog.push({
            step: `Failed on step: ${step.type}`,
            status: "FAILED",
            error: err.message,
          });
          break;
        }
      }
    }

    const workflowConfig = workflow.config as { steps: WorkflowStep[] };

    if (workflowConfig && workflowConfig.steps) {
      await executeSteps(workflowConfig.steps);

      await db.insert(workflowExecutions).values({
        workflowId: workflow.id,
        taskId: taskState.id,
        status: isSuccess ? "success" : "failed",
        stepsRun: stepsRunLog,
      });
    }
  }
}
