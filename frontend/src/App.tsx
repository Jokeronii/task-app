import { useState } from "react";
import TasksPage from "./pages/TasksPage";
import WorkflowsPage from "./pages/WorkflowsPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<"tasks" | "workflows">("tasks");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Task Automation
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "tasks"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📋 Tasks Management
            </button>
            <button
              onClick={() => setActiveTab("workflows")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "workflows"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ⚙️ Workflow Builder
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "tasks" ? <TasksPage /> : <WorkflowsPage />}
      </main>
    </div>
  );
}
