import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
  deleteProject: async (id: number) => {
    const res = await axios.delete(`${API_BASE}/projects/${id}`);
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

export interface DiscoveryOutcome {
  project: any;
  status: string;
  error: string | null;
}

// Polls real backend state until the discovery run leaves "running".
// The stage (1-7) is the furthest pipeline stage that has produced stored records.
export async function waitForDiscovery(
  projectId: number,
  onStage?: (stage: number, project: any) => void,
  intervalMs = 2000
): Promise<DiscoveryOutcome> {
  for (;;) {
    const [project, graph, hypotheses, theories, experiments, validations, memories] = await Promise.all([
      api.getProject(projectId),
      api.getKnowledgeGraph(projectId),
      api.getHypotheses(projectId),
      api.getTheories(projectId),
      api.getExperiments(projectId),
      api.getValidations(projectId),
      api.getMemory(projectId),
    ]);

    let stage = 1;
    if (graph.nodes?.length) stage = 2;
    if (hypotheses.length) stage = 3;
    if (theories.length) stage = 4;
    if (experiments.length) stage = 5;
    if (validations.length) stage = 6;
    if (memories.some((m: any) => m.memory_type !== 'pipeline_error')) stage = 7;
    onStage?.(stage, project);

    if (project.status !== 'running') {
      const lastError = [...memories].reverse().find((m: any) => m.memory_type === 'pipeline_error');
      return {
        project,
        status: project.status,
        error: project.status === 'completed' ? null : (lastError?.content ?? 'Discovery pipeline failed.'),
      };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
