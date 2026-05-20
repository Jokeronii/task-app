import { useState, useEffect } from "react";
import { taskApi } from "../api/client";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: number;
  metadata: any;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getAll(
        statusFilter || undefined,
        search || undefined,
      );
      setTasks(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, search]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await taskApi.create({ title, priority, status: "todo", metadata: {} });
      setTitle("");
      setPriority(1);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "todo" | "in_progress" | "done",
  ) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
      );
      await taskApi.update(id, { status: newStatus });
      setTimeout(fetchTasks, 500);
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Pembuatan Tugas - Gaya Shadcn Card */}
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div>
            <h2 className="text-md font-semibold tracking-tight text-slate-200">
              ➕ Create Task
            </h2>
            <p className="text-xs text-slate-500">
              Add a new task to your workspace backlog.
            </p>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fix broken checkout pipeline"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Priority Weight
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition-all"
              >
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Level {lvl} {lvl === 5 ? "⚡ (Critical)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-950 font-medium py-2 rounded-lg text-sm transition-all shadow-md active:scale-[0.99]"
            >
              Confirm Deployment
            </button>
          </form>
        </div>

        {/* List Tugas - Gaya Clean Dashboard */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/40 backdrop-blur-md p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3 shadow-md">
            <input
              type="text"
              placeholder="🔍 Search tasks by signature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Lifecycle States</option>
              <option value="todo">📋 Backlog</option>
              <option value="in_progress">⚡ In Progress</option>
              <option value="done">✅ Completed</option>
            </select>
          </div>

          {loading && tasks.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 animate-pulse">
              Syncing with database instance...
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-800 text-slate-500 text-sm">
              No tasks found in this lifecycle segment.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-900/60 hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm text-slate-200 tracking-tight">
                      {task.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          task.priority >= 4
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-slate-950 text-slate-500 border border-slate-800"
                        }`}
                      >
                        P-{task.priority}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium tracking-wide ${
                          task.status === "done"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : task.status === "in_progress"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {task.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Segmented Controls Control Box */}
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80 self-end sm:self-auto shadow-inner">
                    {(["todo", "in_progress", "done"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(task.id, st)}
                        className={`text-[11px] px-3 py-1 rounded-md font-medium transition-all ${
                          task.status === st
                            ? "bg-slate-800 text-slate-100 shadow-sm font-semibold"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {st === "todo"
                          ? "Todo"
                          : st === "in_progress"
                            ? "Active"
                            : "Done"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
