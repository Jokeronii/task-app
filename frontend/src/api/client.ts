import axios from "axios";

// Membuat instance Axios terpusat yang mengarah ke backend Hono (Port 3000)
const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Kumpulan fungsi penembak API khusus untuk Tabel Tasks
export const taskApi = {
  getAll: async (status?: string, search?: string) => {
    const response = await apiClient.get("/tasks", {
      params: { status, search },
    });
    return response.data; // Mengembalikan objek { items, total } dari Hono
  },
  create: async (data: {
    title: string;
    priority: number;
    status?: string;
    metadata?: any;
  }) => {
    const response = await apiClient.post("/tasks", data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/tasks/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },
};

// Kumpulan fungsi penembak API khusus untuk Tabel Workflows & Executions
export const workflowApi = {
  getAll: async () => {
    const response = await apiClient.get("/workflows");
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/workflows/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post("/workflows", data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/workflows/${id}`);
    return response.data;
  },
  getExecutions: async (id: string) => {
    const response = await apiClient.get(`/workflows/${id}/executions`);
    return response.data;
  },
};
