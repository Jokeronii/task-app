import { useState, useEffect } from "react";
import { workflowApi } from "../api/client";

interface Workflow {
  id: string;
  name: string;
  isEnabled: boolean;
  triggerEvent: string;
}

interface Execution {
  id: string;
  status: "success" | "failed";
  stepsRun: any[];
  executedAt: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null,
  );
  const [executions, setExecutions] = useState<Execution[]>([]);

  const [name, setName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("task_created");
  const [condField, setCondField] = useState("priority");
  const [condOperator, setCondOperator] = useState("equals");
  const [condValue, setCondValue] = useState("5");
  const [actionStatus, setActionStatus] = useState("in_progress");
  const [actionTemplate, setActionTemplate] = useState(
    "Critical task started: {{task.title}}",
  );

  const fetchWorkflows = async () => {
    try {
      const data = await workflowApi.getAll();
      setWorkflows(data.items || data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExecutions = async (id: string) => {
    try {
      const data = await workflowApi.getExecutions(id);
      setExecutions(data.items || data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (selectedWorkflowId) {
      fetchExecutions(selectedWorkflowId);
      const interval = setInterval(
        () => fetchExecutions(selectedWorkflowId),
        3000,
      );
      return () => clearInterval(interval);
    }
  }, [selectedWorkflowId]);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const configTree = {
      steps: [
        {
          type: "condition",
          field: condField,
          operator: condOperator,
          value: condField === "priority" ? Number(condValue) : condValue,
          ifTrue: [
            {
              type: "action",
              actionType: "update_task",
              fields: { status: actionStatus },
            },
            {
              type: "action",
              actionType: "log_message",
              template: actionTemplate,
            },
          ],
          ifFalse: [],
        },
      ],
    };

    try {
      await workflowApi.create({
        name,
        triggerEvent,
        isEnabled: true,
        config: configTree,
      });
      setName("");
      fetchWorkflows();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {/* Visual Rule Builder Node Form */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-xl space-y-5 h-fit">
        <div>
          <h2 className="text-md font-semibold text-slate-200 tracking-tight">
            ⚙️ Logic Pipeline Builder
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Wire reactive background automations on custom criteria.
          </p>
        </div>

        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Pipeline Name
            </label>
            <input
              type="text"
              placeholder="e.g., Auto-escalation vector"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Event Trigger
            </label>
            <select
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
            >
              <option value="task_created">On Lifecycle: Created</option>
              <option value="task_updated">On Lifecycle: Mutated</option>
            </select>
          </div>

          {/* IF CONDITIONAL FRAMEWAY */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 font-bold">
              [Branch Condition Node]
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={condField}
                onChange={(e) => setCondField(e.target.value)}
                className="bg-slate-900 border border-slate-800/80 rounded-md px-2 py-1.5 text-xs text-slate-300"
              >
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="metadata.tags">Metadata.Tags</option>
              </select>

              <select
                value={condOperator}
                onChange={(e) => setCondOperator(e.target.value)}
                className="bg-slate-900 border border-slate-800/80 rounded-md px-2 py-1.5 text-xs text-slate-300"
              >
                <option value="equals">== Equals</option>
                <option value="greater_than_or_equal">&gt;= Gte</option>
                <option value="contains">Includes</option>
              </select>
            </div>
            <input
              type="text"
              value={condValue}
              onChange={(e) => setCondValue(e.target.value)}
              placeholder="Value constraint token"
              className="w-full bg-slate-900 border border-slate-800/80 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          {/* THEN CONSEQUENCE FRAMEWAY */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 font-bold">
              [Execute Execution Vectors]
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Vector A: Mutate State
              </label>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-md px-3 py-1.5 text-xs text-slate-300"
              >
                <option value="todo">Set state: Todo</option>
                <option value="in_progress">Set state: Active</option>
                <option value="done">Set state: Done</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Vector B: Broadcast Telemetry
              </label>
              <input
                type="text"
                value={actionTemplate}
                onChange={(e) => setActionTemplate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-950 font-medium py-2 rounded-lg text-sm transition-all shadow-md"
          >
            Deploy Automation Vector
          </button>
        </form>
      </div>

      {/* Active Rules Registry */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase pl-1">
          Engine Registries
        </h2>

        {workflows.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/20 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
            No active trigger vectors mapped inside engine.
          </div>
        ) : (
          <div className="space-y-2">
            {workflows.map((w) => (
              <div
                key={w.id}
                onClick={() => setSelectedWorkflowId(w.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                  selectedWorkflowId === w.id
                    ? "bg-slate-900 border-slate-600 ring-1 ring-slate-700/30"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm text-slate-200 tracking-tight">
                    {w.name}
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ONLINE
                  </span>
                </div>
                <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>Lifecycle:</span>
                  <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800">
                    {w.triggerEvent}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Path Flow History Trace */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase pl-1">
          Telemetry Monitor
        </h2>

        {!selectedWorkflowId ? (
          <div className="p-8 text-center bg-slate-900/10 border border-dashed border-slate-800 rounded-xl text-slate-600 text-xs h-64 flex flex-col justify-center items-center">
            <span>📊</span>
            <span className="mt-2">
              Select a vector system registry to trace execution blocks.
            </span>
          </div>
        ) : executions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 rounded-xl border border-slate-800 text-slate-500 text-xs">
            Registry payload vector idle. Run tasks to emit triggers.
          </div>
        ) : (
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            {executions.map((exec) => (
              <div
                key={exec.id}
                className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden shadow-md"
              >
                <div
                  className={`px-3 py-2 text-[11px] font-mono flex justify-between items-center ${
                    exec.status === "success"
                      ? "bg-emerald-500/5 text-emerald-400/90"
                      : "bg-red-500/5 text-red-400/90"
                  }`}
                >
                  <span className="font-medium">
                    ⚡ RUN::{exec.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(exec.executedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="p-4 space-y-3 bg-slate-950/40 border-t border-slate-900">
                  {exec.stepsRun.map((step: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-2.5 text-xs"
                    >
                      <div className="mt-0.5 text-[10px]">
                        {step.status === "SUCCESS" ||
                        step.status === "EVALUATED"
                          ? "✨"
                          : "❌"}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-slate-300 tracking-tight">
                          {step.step}
                        </p>
                        {step.output?.message && (
                          <p className="font-mono text-[10px] bg-slate-950 p-2 rounded text-slate-400 border border-slate-900/60 leading-relaxed">
                            {step.output.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
