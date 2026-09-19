import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Auth
  login: async (email: string, name?: string) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, name });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await axios.get(`${API_BASE}/auth/me`);
    return res.data;
  },

  // Projects
  getProjects: async () => {
    const res = await axios.get(`${API_BASE}/projects`);
    return res.data;
  },
  getProject: async (id: number) => {
    const res = await axios.get(`${API_BASE}/projects/${id}`);
    return res.data;
  },
  createProject: async (data: any) => {
    const res = await axios.post(`${API_BASE}/projects`, data);
    return res.data;
  },
  uploadDataset: async (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/projects/${projectId}/dataset`, formData);
    return res.data;
  },
  uploadDocument: async (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/projects/${projectId}/documents`, formData);
    return res.data;
  },

  // Pipeline Data
  getKnowledge: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/knowledge`);
    return res.data;
  },
  getKnowledgeGraph: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/knowledge/graph`);
    return res.data;
  },
  getHypotheses: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/hypotheses`);
    return res.data;
  },
  getTheories: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/theories`);
    return res.data;
  },
  getExperiments: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/experiments`);
    return res.data;
  },
  getValidations: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/validations`);
    return res.data;
  },
  getMemory: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/memory`);
    return res.data;
  },
  getReport: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/reports`);
    return res.data;
  },

  // Trigger Discovery Pipeline
  startDiscovery: async (projectId: number) => {
    const res = await axios.post(`${API_BASE}/projects/${projectId}/discover`);
    return res.data;
  }
};
