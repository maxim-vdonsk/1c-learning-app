import axios from "axios";
import { useAuthStore } from "./store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — logout
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

// Auth
export const auth = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post("/api/v1/auth/register", data),
  loginJson: (data: { email: string; password: string }) =>
    api.post("/api/v1/auth/login/json", data),
  forgotPassword: (email: string) =>
    api.post("/api/v1/auth/forgot-password", { email }),
  me: () => api.get("/api/v1/auth/me"),
};

// Lessons
export const lessons = {
  getCourse: () => api.get("/api/v1/lessons/course"),
  getTheory: (id: number, regenerate = false) =>
    api.get(`/api/v1/lessons/${id}/theory`, { params: { regenerate } }),
  initialize: () => api.post("/api/v1/lessons/initialize"),
};

// Tasks
export const tasks = {
  list: (params?: Record<string, unknown>) => api.get("/api/v1/tasks/", { params }),
  get: (id: number) => api.get(`/api/v1/tasks/${id}`),
  getLessonTask: (lessonId: number) => api.get(`/api/v1/tasks/lesson/${lessonId}`),
  generate: (data: { topic: string; difficulty: string; lesson_id?: number }) =>
    api.post("/api/v1/tasks/generate", data),
};

// Submissions
export const submissions = {
  submit: (data: { task_id: number; code: string }) =>
    api.post("/api/v1/submissions/", data),
  mySubmissions: (taskId?: number) =>
    api.get("/api/v1/submissions/my", { params: taskId ? { task_id: taskId } : {} }),
};

// Progress
export const progress = {
  dashboard: () => api.get("/api/v1/progress/dashboard"),
};

// Achievements
export const achievements = {
  mine: () => api.get("/api/v1/achievements/"),
  all: () => api.get("/api/v1/achievements/all"),
  seed: () => api.post("/api/v1/achievements/seed"),
};

export default api;
