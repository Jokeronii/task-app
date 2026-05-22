# Task Manager with Workflow Automation Engine Layer

A full-stack automation platform built with **Bun, Hono, React (Vite), and PostgreSQL(NeonDB)**. This application allows users to manage tasks and orchestrate dynamic, form-based structured branching workflows without writing code.

---

## 🛠️ Tech Stack & Architecture

- **Backend:** Bun v1.x, Hono Framework, Drizzle ORM, PostgreSQL.
- **Frontend:** React, Tailwind CSS v4, TypeScript, Vite.
- **Data Architecture:** Form-Based Structured Tree Configuration for nested conditional branching.

---

## 🏗️ Workflow Data Model & Execution Semantics

Instead of a complex node-graph setup that often introduces cycles and dangling references, this engine utilizes a **Structured Tree Configuration**. Workflows are evaluated sequentially based on event triggers (`ON_CREATE`, `ON_UPDATE`).

### Database Schema Core

1. **Tasks:** Stores basic task entities (`title`, `status`, `priority`, `metadata`).
2. **Workflows:** Stores automation configurations containing recursive nested JSON structures:
   - **Condition Node:** `if` (evaluates task fields/metadata), `then` (nested array of actions/conditions), `else` (nested array of fallback actions/conditions).
   - **Action Node:** `type` (`SET_STATUS`, `SET_PRIORITY`, `APPEND_LOG`), `params` (arguments, payload template).
3. **Workflow Executions:** Audit trail log mapping `workflow_id`, `task_id`, detailed execution steps payload, and final state (`SUCCESS` / `FAILURE`).

### Failure Semantics & Atomic Guarantees

- **Isolation:** If a workflow action fails midway, the specific step error is caught and explicitly written to the `Workflow Executions` audit trail so users can debug visually.
- **Task Mutation:** Task modifications are updated immediately per action step.

### Robust String Interpolation

Log messaging supports template parsing. Syntaxes like `Critical task started: {{task.title}}` dynamically extract values safely using deep path resolution, gracefully handling missing metadata keys or malformed structures.

---

## 🚀 How to Run the Project Locally

### Prerequisites

- [Bun](https://bun.sh) installed globally.

### 1. Database Setup

Create a database named `task_automation` in your PostgreSQL instance.

### 2. Backend Installation

ensure you have NeonDB account to get the connection string key and pass it to .env.example

```bash
cd backend
bun install
# Copy environment variables and adjust your DATABASE_URL
cp .env.example .env
# Run migrations
bun x drizzle-kit push
# Start development server
bun run dev
```

### 3. Frontend Installation

```bash
cd ../frontend
bun install
bun run dev --force
```
