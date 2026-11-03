import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, waitForDiscovery } from '../services/api';
import {
  Cpu, CheckCircle2, Lightbulb, Code, ShieldCheck, History, FileText,
  Sparkles, Layers, BookOpen, Activity, ArrowLeft
} from 'lucide-react';
import { Reports } from './Reports';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '1');

  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'knowledge' | 'hypotheses' | 'theories' | 'experiments' | 'validation' | 'memory' | 'report'>('pipeline');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Data states
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [graph, setGraph] = useState<any>({ nodes: [], links: [] });
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [theories, setTheories] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);

  // Alert and upload states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const proj = await api.getProject(projectId);
      setProject(proj);

      const [kRes, gRes, hRes, tRes, eRes, vRes, mRes] = await Promise.allSettled([
        api.getKnowledge(projectId),
        api.getKnowledgeGraph(projectId),
        api.getHypotheses(projectId),
        api.getTheories(projectId),
        api.getExperiments(projectId),
        api.getValidations(projectId),
        api.getMemory(projectId)
      ]);

      if (kRes.status === 'fulfilled') setKnowledge(kRes.value || []);
      if (gRes.status === 'fulfilled') setGraph(gRes.value || { nodes: [], links: [] });
      if (hRes.status === 'fulfilled') setHypotheses(hRes.value || []);
      if (tRes.status === 'fulfilled') setTheories(tRes.value || []);
      if (eRes.status === 'fulfilled') setExperiments(eRes.value || []);
      if (vRes.status === 'fulfilled') setValidations(vRes.value || []);
      if (mRes.status === 'fulfilled') setMemories(mRes.value || []);
    } catch (err: any) {
      console.error('Error loading project data', err);
      setErrorMsg(err?.response?.data?.detail || 'Failed to load project workspace. Make sure backend is running.');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDiscovery = async () => {
    setRunning(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.startDiscovery(projectId);
      const outcome = await waitForDiscovery(projectId);
      if (outcome.status === 'completed') {
        setSuccessMsg('Closed-loop discovery completed. Results and records have been updated.');
      } else {
        setErrorMsg(outcome.error || 'Discovery pipeline failed.');
      }
      await loadAllData();
    } catch (e: any) {
      console.error('Discovery loop error', e);
      const detail = e?.response?.data?.detail || e?.message || 'Pipeline execution failed';
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setRunning(false);
    }
  };

  const handleDatasetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDataset(true);
    setErrorMsg(null);
    try {
      await api.uploadDataset(projectId, file);
      setSuccessMsg(`Dataset "${file.name}" uploaded successfully!`);
      await loadAllData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to upload dataset.');
    } finally {
      setUploadingDataset(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    setErrorMsg(null);
    try {
      await api.uploadDocument(projectId, file);
      setSuccessMsg(`Literature document "${file.name}" uploaded successfully!`);
      await loadAllData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4">
        <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-purple-700 font-mono text-xs font-bold uppercase tracking-wider">
            Initializing Discovery Workspace #{projectId}
          </p>
          <p className="text-slate-400 text-[11px] mt-1">Connecting telemetry and fetching closed-loop modules...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Discovery Workspace #{projectId} Not Found</h2>
        <p className="text-slate-500 text-xs mb-6">
          {errorMsg || 'The requested research project workspace could not be loaded from the backend database.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-semibold mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-800 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Workspace Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 mb-8 shadow-xl shadow-purple-500/5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {project?.domain}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Metric: <strong className="text-slate-800">{project?.evaluation_metric}</strong>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Iteration: <strong className="text-purple-600">{project?.current_iteration} / {project?.max_iterations}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                Dataset: {project?.dataset_path ? project.dataset_path.split(/[/\\]/).pop() : 'No dataset uploaded'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{project?.title}</h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl leading-relaxed">{project?.research_question}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Inline Dataset Upload */}
            <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{uploadingDataset ? 'Uploading...' : 'Upload Dataset (.csv)'}</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleDatasetUpload}
                disabled={uploadingDataset}
                className="hidden"
              />
            </label>

            {/* Inline Doc Upload */}
            <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{uploadingDoc ? 'Uploading...' : 'Attach Paper (.pdf/.txt)'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleDocUpload}
                disabled={uploadingDoc}
                className="hidden"
              />
            </label>

            <button
              onClick={handleStartDiscovery}
              disabled={running}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 font-bold text-xs uppercase tracking-wider text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer ${
                running ? 'animate-pulse opacity-90' : ''
              }`}
            >
              <Cpu className="w-4 h-4" />
              {running ? 'Running AI Pipeline...' : 'Run Discovery Pipeline'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-100 mt-6 custom-scrollbar">
          {[
            { id: 'pipeline', label: 'Discovery Pipeline', icon: Layers },
            { id: 'knowledge', label: 'Knowledge Graph', icon: BookOpen },
            { id: 'hypotheses', label: `Hypotheses (${hypotheses.length})`, icon: Lightbulb },
            { id: 'theories', label: `Theories (${theories.length})`, icon: Code },
            { id: 'experiments', label: `Experiments (${experiments.length})`, icon: Cpu },
            { id: 'validation', label: `Validation (${validations.length})`, icon: ShieldCheck },
            { id: 'memory', label: `Memory (${memories.length})`, icon: History },
            { id: 'report', label: 'Research Report', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs font-bold'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Pipeline Controller */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600 animate-pulse" />
              Closed-Loop AI Discovery Pipeline Progression
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { name: '1. Problem', status: 'completed' },
                { name: '2. Knowledge', status: knowledge.length ? 'completed' : 'pending' },
                { name: '3. Hypotheses', status: hypotheses.length ? 'completed' : 'pending' },
                { name: '4. Theory Logic', status: theories.length ? 'completed' : 'pending' },
                { name: '5. Experiment', status: experiments.length ? 'completed' : 'pending' },
                { name: '6. Validation', status: validations.length ? 'completed' : 'pending' },
                { name: '7. Memory Refine', status: memories.length ? 'completed' : 'pending' }
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all ${
                    step.status === 'completed'
                      ? 'bg-purple-50/80 border-purple-200 text-purple-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 mx-auto mb-2 ${step.status === 'completed' ? 'text-purple-600' : 'text-slate-300'}`} />
                  {step.name}
                </div>
              ))}
            </div>
          </div>

          {/* Validated Summary */}
          {validations.length > 0 && (
            <div className="bg-white border border-emerald-200 rounded-3xl p-7 shadow-sm">
              <div className="flex items-center gap-3 text-emerald-700 font-bold text-base mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Validated Scientific Candidate Discovered
              </div>
              <p className="text-slate-700 text-xs sm:text-sm mb-4 leading-relaxed">
                {validations[validations.length - 1].explanation}
              </p>
              <div className="flex items-center gap-6 text-xs font-mono text-slate-500">
                <span>Validation Score: <strong className="text-purple-700 font-bold">{validations[validations.length - 1].validation_score}%</strong></span>
                <span>Decision: <strong className="text-emerald-700 uppercase font-bold">{validations[validations.length - 1].decision}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Knowledge Graph */}
      {activeTab === 'knowledge' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            Retrieved Scientific Knowledge & Concept Entities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {graph.nodes.map((node: any) => (
              <div key={node.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                  {node.type}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2 mb-1">{node.name}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{node.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Hypotheses */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-4">
          {hypotheses.map((h) => (
            <div key={h.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                  {h.status}
                </span>
                <span className="text-xs text-purple-700 font-mono font-bold">Score: {(h.overall_score * 100).toFixed(1)}%</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{h.title}</h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">{h.statement}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center text-xs font-mono text-slate-600">
                <div>Plausibility: <span className="text-purple-700 font-bold">{(h.plausibility_score * 100).toFixed(0)}%</span></div>
                <div>Novelty: <span className="text-purple-700 font-bold">{(h.novelty_score * 100).toFixed(0)}%</span></div>
                <div>Testability: <span className="text-purple-700 font-bold">{(h.testability_score * 100).toFixed(0)}%</span></div>
                <div>Consistency: <span className="text-purple-700 font-bold">{(h.consistency_score * 100).toFixed(0)}%</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Theories */}
      {activeTab === 'theories' && (
        <div className="space-y-4">
          {theories.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">{t.theory_title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                  SymPy Check: {t.consistency_status}
                </span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl font-mono text-purple-300 text-xs mb-4">
                {t.mathematical_expression}
              </div>
              <pre className="text-slate-700 text-xs font-sans whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                {t.algorithm_description}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Experiments */}
      {activeTab === 'experiments' && (
        <div className="space-y-5">
          {experiments.map((exp) => (
            <div key={exp.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">{exp.experiment_name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-purple-50 text-purple-700">{exp.status}</span>
              </div>

              {exp.results && exp.results.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">Baseline F1</span>
                    <span className="text-xl font-bold text-slate-700">
                      {exp.results[0].baseline_f1 != null ? exp.results[0].baseline_f1.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-600 block uppercase font-mono mb-1">Theory F1</span>
                    <span className="text-xl font-bold text-purple-700 font-mono">
                      {exp.results[0].f1_score != null ? exp.results[0].f1_score.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-600 block uppercase font-mono mb-1">Accuracy</span>
                    <span className="text-xl font-bold text-indigo-700">
                      {exp.results[0].accuracy != null ? exp.results[0].accuracy.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono mb-1">Execution Speed</span>
                    <span className="text-xl font-bold text-slate-800">
                      {exp.results[0].execution_time != null ? `${exp.results[0].execution_time.toFixed(2)}s` : 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
                <span className="text-xs font-mono text-slate-500 block mb-2">// Subprocess Experiment Code</span>
                <pre className="text-xs text-purple-200 font-mono leading-relaxed">{exp.experiment_code}</pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Validation */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          {validations.map((v) => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-purple-700 font-bold">Validation Score: {v.validation_score}%</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {v.decision}
                </span>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm font-medium mb-4 leading-relaxed">{v.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 7: Memory Timeline */}
      {activeTab === 'memory' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            Failure-Guided Memory & Refinement Timeline
          </h2>
          <div className="space-y-4 relative border-l-2 border-purple-200 ml-3 pl-5">
            {memories.map((m) => (
              <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative">
                <div className="absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-white shadow-xs" />
                <span className="text-[10px] font-mono font-bold text-purple-700 block uppercase mb-1">
                  Iteration {m.iteration} • {m.memory_type}
                </span>
                <p className="text-slate-700 text-xs leading-relaxed">{m.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Final Report */}
      {activeTab === 'report' && <Reports projectId={projectId} />}
    </div>
  );
};
