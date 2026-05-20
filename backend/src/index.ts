import { Hono } from "hono";
import { cors } from "hono/cors";
import { tasks, workflowExecutions, workflows } from "./db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { runWorkflowEngine } from "./engine/workflow";

const app = new Hono();

app.use("/*", cors());

app.get("/", (c) => {
  return c.text("Hello Hono!, project hono bun task automaton");
});

//===========endpoint tasks============//
app.post("/tasks", async (c) => {
  try {
    //fill request body
    const body = await c.req.json();

    if (!body.title) {
      return c.json({ error: "title must be filled" }, 400);
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        title: body.title,
        priority: body.priority || 1,
        status: body.status || "todo",
        metadata: body.metadata || {},
      })
      .returning();

    runWorkflowEngine("task_created", newTask).catch((err) =>
      console.error("Engine Error:", err),
    );

    return c.json({ data: newTask }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/tasks", async (c) => {
  try {
    const statusFilter = c.req.query("status");
    const searchFilter = c.req.query("search");

    let allTasks = await db.select().from(tasks);

    if (statusFilter) {
      allTasks = allTasks.filter((t) => t.status === statusFilter);
    }
    if (searchFilter) {
      allTasks = allTasks.filter((t) =>
        t.title.toLowerCase().includes(searchFilter.toLowerCase()),
      );
    }

    return c.json({
      items: allTasks,
      total: allTasks.length,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.patch("/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = c.req.json();

  try {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    runWorkflowEngine("task_updated", updatedTask).catch((err) =>
      console.error("Engine Error:", err),
    );

    if (!updatedTask) return c.json({ error: "task not found" }, 404);
    return c.json({ data: updatedTask });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/tasks/delete/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await db.delete(tasks).where(eq(tasks.id, id));
    return c.json({ message: "task deleted success" });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

//===========endpoint workflow============//

app.post("/workflows", async (c) => {
  try {
    const body = await c.req.json();

    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        name: body.name,
        triggerEvent: body.triggerEvent,
        config: body.config,
      })
      .returning();

    return c.json({ data: newWorkflow }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/workflows", async (c) => {
  try {
    const allWorkflow = await db.select().from(workflows);
    return c.json({ items: allWorkflow, total: allWorkflow.length }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/workflows/:id", async (c) => {
  try {
    const id = await c.req.param("id");
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id));
    if (!workflow) return c.json({ error: "workflow not found" }, 400);
    return c.json({ data: workflow });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/workflows/:id/executions", async (c) => {
  try {
    const id = await c.req.param("id");
    const logs = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, id));
    return c.json({ items: logs, total: logs.length });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.patch("/workflows/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const [updatedWorkflow] = await db
      .update(workflows)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, id))
      .returning();

    return c.json({ data: updatedWorkflow });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete("/workflows/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await db.delete(workflows).where(eq(workflows.id, id));
    return c.json({ message: "Workflow deleted" });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
