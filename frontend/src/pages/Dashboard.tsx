import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, waitForDiscovery } from '../services/api';
import {
  Sparkles,
  Paperclip,
  ChevronDown,
  ArrowUp,
  Cpu,
  Database,
  FlaskConical,
  Plus,
  ArrowRight,
  Bot,
  Lightbulb,
  CheckCircle2,
  Activity,
  Layers,
  BookOpen,
  ShieldCheck,
  History,
  FileText,
  BarChart3,
  PieChart,
  RefreshCw,
  Binary,
  Code,
  Search,
  X,
  Play,
  ArrowDown,
  Check,
  HelpCircle,
  TrendingUp,
  GitBranch,
  Network
} from 'lucide-react';

interface DashboardProps {
  selectedModel?: string;
  activeView?: string;
  setActiveView?: (view: string) => void;
  searchOpen?: boolean;
  setSearchOpen?: (open: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedModel = 'GPT-4o (Scientific)',
  activeView = 'home',
  setActiveView,
  searchOpen = false,
  setSearchOpen
}) => {
  const navigate = useNavigate();

  // Inputs & Controls
  const [promptText, setPromptText] = useState('');
  const [citationActive, setCitationActive] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('Machine Learning');
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Backend Data
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Live Selected Workspace for Module Views
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [viewKnowledge, setViewKnowledge] = useState<any[]>([]);
  const [viewGraph, setViewGraph] = useState<any>({ nodes: [], links: [] });
  const [viewHypotheses, setViewHypotheses] = useState<any[]>([]);
  const [viewExperiments, setViewExperiments] = useState<any[]>([]);
  const [viewValidations, setViewValidations] = useState<any[]>([]);
  const [viewMemories, setViewMemories] = useState<any[]>([]);
  const [loadingViewData, setLoadingViewData] = useState<boolean>(false);

  // Live End-to-End Pipeline Execution State
  const [runningDiscovery, setRunningDiscovery] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activeDiscoveryLog, setActiveDiscoveryLog] = useState<any>(null);

  // File attachment & Alerts
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const datasetFile = attachedFiles.find((f) => f.name.toLowerCase().endsWith('.csv')) || null;
  const literatureFiles = attachedFiles.filter((f) => f !== datasetFile);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [pipelineSuccess, setPipelineSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && selectedProjectId === null) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const fetchViewData = async (targetProjId?: number, targetView?: string) => {
    const pId = targetProjId || selectedProjectId;
    const v = targetView || activeView;
    if (!pId) return;

    setLoadingViewData(true);
    try {
      if (v === 'knowledge' || v === 'flowchart' || v === 'pipeline') {
        const [kRes, gRes] = await Promise.allSettled([
          api.getKnowledge(pId),
          api.getKnowledgeGraph(pId)
        ]);
        if (kRes.status === 'fulfilled') setViewKnowledge(kRes.value || []);
        if (gRes.status === 'fulfilled') setViewGraph(gRes.value || { nodes: [], links: [] });
      }
      if (v === 'hypotheses' || v === 'flowchart' || v === 'pipeline') {
        const h = await api.getHypotheses(pId).catch(() => []);
        setViewHypotheses(h || []);
      }
      if (v === 'experiments' || v === 'flowchart' || v === 'pipeline') {
        const exp = await api.getExperiments(pId).catch(() => []);
        setViewExperiments(exp || []);
      }
      if (v === 'validation' || v === 'flowchart' || v === 'pipeline') {
        const val = await api.getValidations(pId).catch(() => []);
        setViewValidations(val || []);
      }
      if (v === 'memory' || v === 'flowchart' || v === 'pipeline') {
        const m = await api.getMemory(pId).catch(() => []);
        setViewMemories(m || []);
      }
    } catch (err) {
      console.error('Error fetching view data:', err);
    } finally {
      setLoadingViewData(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchViewData(selectedProjectId, activeView);
    }
  }, [selectedProjectId, activeView]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await api.getProjects();
      setProjects(data || []);
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load projects from backend', e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleExampleClick = (text: string, domain: string) => {
    setPromptText(text);
    setSelectedDomain(domain);
  };

  // Starts the backend discovery run and follows its real stored state until it finishes
  const runDiscoveryFor = async (projectId: number, meta: { title: string; question: string; domain: string }) => {
    await api.startDiscovery(projectId);
    const outcome = await waitForDiscovery(projectId, (stage) => setCurrentStep(stage));
    setActiveDiscoveryLog({
      projectId,
      title: meta.title,
      question: meta.question,
      domain: meta.domain,
      result: { status: outcome.status, iterations_completed: outcome.project.current_iteration, error: outcome.error }
    });
    if (outcome.status !== 'completed') {
      throw new Error(outcome.error || 'Discovery pipeline failed.');
    }
    setCurrentStep(7);
  };

  const handleLaunchDiscovery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || runningDiscovery) return;
    if (!datasetFile) {
      setPipelineError('Attach a .csv dataset before running discovery (PDF/TXT/MD files are added as literature).');
      return;
    }

    setRunningDiscovery(true);
    setPipelineError(null);
    setPipelineSuccess(null);
    setCurrentStep(1);
    if (setActiveView) setActiveView('flowchart');

    let projectId: number | null = null;
    try {
      const proj = await api.createProject({
        title: promptText.slice(0, 50) + (promptText.length > 50 ? '...' : ''),
        research_question: promptText,
        domain: selectedDomain,
        objective: 'Formulate, test, and validate candidate scientific theory',
        constraints: 'Preliminary consistency checks C(h)=1 & prediction error optimization',
        evaluation_metric: selectedDomain === 'Machine Learning' ? 'F1 Score' : 'Prediction Error E_pred',
        max_iterations: 3
      });
      projectId = proj.id;
      setSelectedProjectId(proj.id);
      await api.uploadDataset(proj.id, datasetFile);
      for (const doc of literatureFiles) {
        await api.uploadDocument(proj.id, doc);
      }
      await runDiscoveryFor(proj.id, { title: proj.title, question: proj.research_question, domain: proj.domain });
      setPipelineSuccess(`Discovery completed successfully for workspace #${proj.id}!`);
    } catch (err: any) {
      console.error('Discovery execution error:', err);
      const detail = err?.response?.data?.detail || err?.message || 'Pipeline execution failed';
      setPipelineError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setRunningDiscovery(false);
      if (projectId !== null) {
        await loadProjects();
        await fetchViewData(projectId, 'flowchart');
      }
    }
  };

  // Run pipeline for the currently selected workspace from Flowchart / Pipeline views
  const handleRunSelectedProjectPipeline = async () => {
    const targetId = selectedProjectId || (projects.length > 0 ? projects[0].id : null);
    if (!targetId || runningDiscovery) return;

    const targetProj = projects.find((p) => p.id === targetId);
    setRunningDiscovery(true);
    setPipelineError(null);
    setPipelineSuccess(null);
    setCurrentStep(1);

    try {
      await runDiscoveryFor(targetId, {
        title: targetProj?.title || `Workspace #${targetId}`,
        question: targetProj?.research_question || '',
        domain: targetProj?.domain || 'Machine Learning'
      });
      setPipelineSuccess(`Pipeline completed successfully for workspace #${targetId}!`);
    } catch (err: any) {
      console.error('Pipeline execution error:', err);
      const detail = err?.response?.data?.detail || err?.message || 'Pipeline execution failed';
      setPipelineError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setRunningDiscovery(false);
      await loadProjects();
      await fetchViewData(targetId, activeView);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleLaunchDiscovery();
    }
  };

  const domainList = [
    'Machine Learning',
    'Particle Physics Invariants',
    'Symbolic Equation Discovery',
    'Materials Science Discovery'
  ];

  // Filtered projects for search modal
  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.research_question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 py-6 max-w-6xl mx-auto w-full min-h-[calc(100vh-4rem)]">
      {/* Search Modal Triggered from Topbar "Search Discoveries" */}
      {searchOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <Search className="w-4 h-4" />
                <span>Search Scientific Discoveries & Equations</span>
              </div>
              <button
                onClick={() => setSearchOpen && setSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, equation, domain, or project..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-600 mb-4"
            />

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No matching discoveries found.</div>
              ) : (
                filteredProjects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    onClick={() => setSearchOpen && setSearchOpen(false)}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {p.domain}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID #{p.id}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{p.title}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{p.research_question}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: DISCOVERY STUDIO (Matching reference image) */}
      {activeView === 'home' && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl text-center my-auto pt-2 pb-6">
          {/* 3D Glossy Floating Purple Orb matching reference image */}
          <div className="orb-3d mb-8" />

          {/* System Title */}
          <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight mb-2 font-sans">
            Autonomous Theory Discovery System
          </h1>

          {/* Headline: "What's on your mind?" with purple highlight */}
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-8">
            What's on <span className="text-[#7C3AED] font-bold font-sans">your mind?</span>
          </h2>

          {/* Pipeline Alerts */}
          {pipelineError && (
            <div className="w-full max-w-2xl mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{pipelineError}</span>
              </div>
              <button
                onClick={() => setPipelineError(null)}
                className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {pipelineSuccess && (
            <div className="w-full max-w-2xl mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pipelineSuccess}</span>
              </div>
              <button
                onClick={() => setPipelineSuccess(null)}
                className="text-emerald-500 hover:text-emerald-800 font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Prompt Box Container (Centerpiece Card matching screenshot) */}
          <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-4 prompt-card-shadow transition-all duration-200 relative mb-8">
            <div className="flex items-start gap-3 px-2 pt-1 pb-3">
              <Sparkles className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Specify scientific research question, empirical observation, or target hypothesis..."
                rows={2}
                className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm font-normal focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Bottom Controls Bar inside Prompt Box */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 px-1">
              {/* Left Controls */}
              <div className="flex items-center gap-2 relative">
                {/* Attach Literature / Dataset Button */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 text-slate-700 text-xs font-medium cursor-pointer transition-colors border border-slate-200/50">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span>{attachedFiles.length ? `${datasetFile ? '1 dataset' : 'no dataset'}${literatureFiles.length ? ` + ${literatureFiles.length} doc(s)` : ''}` : 'Attach Data / Literature'}</span>
                  <input
                    type="file"
                    accept=".csv,.pdf,.txt,.md,.docx"
                    multiple
                    onChange={(e) => setAttachedFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
                {attachedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAttachedFiles([])}
                    title="Remove attached file"
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Domain Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 text-slate-700 text-xs font-medium transition-colors border border-slate-200/50"
                  >
                    <span>{selectedDomain}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${domainDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {domainDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setDomainDropdownOpen(false)} />
                      <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-1.5 text-left animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase font-mono">
                          Target Scientific Domain
                        </div>
                        {domainList.map((domain) => (
                          <button
                            key={domain}
                            onClick={() => {
                              setSelectedDomain(domain);
                              setDomainDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                              selectedDomain === domain
                                ? 'bg-purple-50 text-purple-700 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {domain}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Controls: Citation Toggle Switch & Launch Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCitationActive(!citationActive)}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 select-none cursor-pointer"
                >
                  <div
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                      citationActive ? 'bg-[#7C3AED] justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                  </div>
                  <span>Citation S(d,q)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchDiscovery()}
                  disabled={!promptText.trim() || runningDiscovery}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    promptText.trim() && !runningDiscovery
                      ? 'bg-slate-950 hover:bg-slate-800 text-white shadow-md cursor-pointer hover:scale-105 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Run End-to-End Discovery Pipeline"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Real Scientific Benchmark Cards */}
          <div className="w-full max-w-3xl text-left">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3 font-mono">
              GET STARTED WITH A SCIENTIFIC DISCOVERY PROBLEM BELOW
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <button
                onClick={() =>
                  handleExampleClick(
                    'Can adaptive hybrid feature selection combining mutual information and tree importance improve classification F1 score?',
                    'Machine Learning'
                  )
                }
                className="bg-[#F5F6F9] hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4 text-left transition-all duration-200 min-h-[130px] flex flex-col justify-between group cursor-pointer"
              >
                <p className="text-xs font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                  Write a feature selection theory combining mutual information & tree importance
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Code className="w-4 h-4 text-purple-600 transition-colors" />
                  <span className="text-[10px] font-mono text-slate-400">ML / F1 Score</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleExampleClick(
                    'Discover particle physics electroweak mass relations and Higgs boson bounds from LEP experimental measurements.',
                    'Particle Physics Invariants'
                  )
                }
                className="bg-[#F5F6F9] hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4 text-left transition-all duration-200 min-h-[130px] flex flex-col justify-between group cursor-pointer"
              >
                <p className="text-xs font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                  Discover particle physics electroweak mass relations from LEP dataset
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Database className="w-4 h-4 text-indigo-600 transition-colors" />
                  <span className="text-[10px] font-mono text-slate-400">Physics / LEP</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleExampleClick(
                    'Distill free-form natural governing laws and symbolic equations from observed numerical timeseries measurements.',
                    'Symbolic Equation Discovery'
                  )
                }
                className="bg-[#F5F6F9] hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4 text-left transition-all duration-200 min-h-[130px] flex flex-col justify-between group cursor-pointer"
              >
                <p className="text-xs font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                  Distill free-form natural governing laws and symbolic invariant equations
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Binary className="w-4 h-4 text-cyan-600 transition-colors" />
                  <span className="text-[10px] font-mono text-slate-400">SymPy / Eq</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleExampleClick(
                    'Formulate high-throughput crystal structure stability predictions with physics-informed constraints.',
                    'Materials Science Discovery'
                  )
                }
                className="bg-[#F5F6F9] hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4 text-left transition-all duration-200 min-h-[130px] flex flex-col justify-between group cursor-pointer"
              >
                <p className="text-xs font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                  Formulate crystal structure stability theory with physical constraints
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <FlaskConical className="w-4 h-4 text-emerald-600 transition-colors" />
                  <span className="text-[10px] font-mono text-slate-400">Materials AI</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE METHODOLOGY FLOWCHART (FIG. 3 & FIG. 4 FROM PDF) */}
      {(activeView === 'flowchart' || activeView === 'pipeline') && (
        <div className="w-full max-w-4xl space-y-6 my-auto py-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-purple-600" />
                  Methodology Flowchart
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Closed-loop iterative theory discovery with active decision branching and live workspace telemetry
                </p>
              </div>

              <div className="flex items-center gap-3">
                {projects.length > 0 && (
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:border-purple-600"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => handleRunSelectedProjectPipeline()}
                  disabled={runningDiscovery}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {runningDiscovery ? 'Executing Flow...' : 'Run Pipeline'}
                </button>
              </div>
            </div>

            {/* Flowchart Alerts */}
            {pipelineError && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{pipelineError}</span>
                </div>
                <button
                  onClick={() => setPipelineError(null)}
                  className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {pipelineSuccess && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pipelineSuccess}</span>
                </div>
                <button
                  onClick={() => setPipelineSuccess(null)}
                  className="text-emerald-500 hover:text-emerald-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Live Interactive Visual Flowchart Nodes reflecting actual workspace data */}
            {(() => {
              const selectedProj = projects.find((p) => p.id === selectedProjectId) || projects[0];
              const flowStep = runningDiscovery
                ? currentStep
                : selectedProj
                ? (viewValidations.length > 0 || viewMemories.length > 0 || selectedProj.status === 'completed')
                  ? 7
                  : viewExperiments.length > 0
                  ? 5
                  : viewHypotheses.length > 0
                  ? 3
                  : (viewGraph.nodes?.length > 0 || viewKnowledge?.length > 0)
                  ? 2
                  : 1
                : 0;

              return (
                <div className="flex flex-col items-center space-y-3 py-4">
                  {/* Step 1: Problem Definition */}
                  <div
                    className={`w-80 p-3.5 rounded-2xl border text-center transition-all ${
                      flowStep >= 1
                        ? 'bg-purple-100 border-purple-300 text-purple-950 shadow-md ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-purple-700 font-bold block mb-0.5">START • STEP 1</span>
                    <strong className="text-xs block text-slate-900">Define Problem & Constraints</strong>
                    <span className="text-[11px] text-slate-600 block mt-1">
                      {selectedProj ? `${selectedProj.title.slice(0, 35)}...` : 'Research Problem Definition'}
                    </span>
                  </div>

                  <ArrowDown className="w-4 h-4 text-purple-400" />

                  {/* Step 2: Knowledge Retrieval S(d,q) */}
                  <div
                    className={`w-80 p-3.5 rounded-2xl border text-center transition-all ${
                      flowStep >= 2
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-950 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-indigo-700 font-bold block mb-0.5">STEP 2 • KNOWLEDGE S(d,q)</span>
                    <strong className="text-xs block text-slate-900">Retrieve Knowledge & Extract Entities</strong>
                    <span className="text-[11px] text-slate-600 block mt-1">
                      {(viewGraph.nodes?.length > 0 || viewKnowledge?.length > 0)
                        ? `${viewGraph.nodes.length} Graph Entities, ${viewKnowledge.length} Literature Findings`
                        : 'Ingest Literature & Extract Graph Entities'}
                    </span>
                  </div>

                  <ArrowDown className="w-4 h-4 text-indigo-400" />

                  {/* Step 3: Hypothesis Formulation h* */}
                  <div
                    className={`w-80 p-3.5 rounded-2xl border text-center transition-all ${
                      flowStep >= 3
                        ? 'bg-cyan-100 border-cyan-300 text-cyan-950 shadow-md ring-2 ring-cyan-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-cyan-700 font-bold block mb-0.5">STEP 3 • HYPOTHESIS h*</span>
                    <strong className="text-xs block text-slate-900">Generate & Rank Candidate Hypotheses</strong>
                    <span className="text-[11px] text-slate-600 block mt-1">
                      {viewHypotheses?.length > 0
                        ? `${viewHypotheses.length} Ranked Candidates (Top Score: ${((viewHypotheses[0].overall_score || 0) * 100).toFixed(1)}%)`
                        : 'Score(h) = 0.30·P + 0.20·N + 0.25·T + 0.25·C'}
                    </span>
                  </div>

                  <ArrowDown className="w-4 h-4 text-cyan-400" />

                  {/* Step 4: Decision Node C(h) = 1 */}
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-80 p-4 rounded-2xl border text-center transition-all ${
                        flowStep >= 4
                          ? 'bg-amber-100 border-amber-300 text-amber-950 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-amber-800 font-bold block mb-0.5">STEP 4 • FORMAL DECISION</span>
                      <strong className="text-xs block text-slate-900">Is Theory Consistent C(h) = 1?</strong>
                      <span className="text-[11px] text-slate-600 block mt-1 font-mono">
                        {viewValidations?.length > 0
                          ? `SymPy Status: ${viewValidations[0].consistency_score >= 0.8 ? 'C(h)=1 PASS' : 'C(h)<1 REFINED'}`
                          : 'Symbolic SymPy Verification'}
                      </span>
                    </div>

                    <div className="flex flex-col text-[11px] font-mono text-slate-500">
                      <span className="text-emerald-700 font-bold">YES → Run Experiment E_pred</span>
                      <span className="text-rose-600 font-bold">NO → Memory Feedback H_t+1</span>
                    </div>
                  </div>

                  <ArrowDown className="w-4 h-4 text-amber-400" />

                  {/* Step 5: Automated Experiment E_pred */}
                  <div
                    className={`w-80 p-3.5 rounded-2xl border text-center transition-all ${
                      flowStep >= 5
                        ? 'bg-purple-100 border-purple-300 text-purple-950 shadow-md ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-purple-700 font-bold block mb-0.5">STEP 5 • EXPERIMENT E_pred</span>
                    <strong className="text-xs block text-slate-900">Run Automated Experiment Code</strong>
                    <span className="text-[11px] text-slate-600 block mt-1">
                      {viewExperiments?.length > 0
                        ? `${viewExperiments.length} Experiments Run (Status: ${viewExperiments[0].status})`
                        : 'Isolated Python Subprocess Execution'}
                    </span>
                  </div>

                  <ArrowDown className="w-4 h-4 text-purple-400" />

                  {/* Step 6: Composite Validation V(h) */}
                  <div
                    className={`w-80 p-3.5 rounded-2xl border text-center transition-all ${
                      flowStep >= 6
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-950 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-emerald-700 font-bold block mb-0.5">STEP 6 • VALIDATION V(h)</span>
                    <strong className="text-xs block text-slate-900">Composite Validation & Decision</strong>
                    <span className="text-[11px] text-slate-600 block mt-1 font-mono">
                      {viewValidations?.length > 0
                        ? `V(h) = ${viewValidations[0].validation_score}% (${viewValidations[0].decision.toUpperCase()})`
                        : 'V(h) = α·C + β·A + γ·N + δ·R'}
                    </span>
                  </div>

                  <ArrowDown className="w-4 h-4 text-emerald-400" />

                  {/* Step 7: Memory & Output */}
                  <div
                    className={`w-80 p-3.5 rounded-2xl border text-center transition-all ${
                      flowStep >= 7
                        ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-emerald-200 font-bold block mb-0.5">STEP 7 • FINAL OUTPUT</span>
                    <strong className="text-xs block">Update Memory H_t+1 & Record Theory</strong>
                    <span className={`text-[11px] block mt-1 ${flowStep >= 7 ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {viewMemories?.length > 0
                        ? `${viewMemories.length} Iterations Stored in Discovery Memory`
                        : 'H_t+1 = F(H_t, E_t, M_t)'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW 3: SYSTEM ARCHITECTURE DIAGRAM (FIG. 1 & FIG. 5 FROM PDF) */}
      {activeView === 'architecture' && (
        <div className="w-full max-w-4xl space-y-6 my-auto py-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-600" />
              System Implementation Architecture
            </h3>
            <p className="text-xs text-slate-500 mb-6">Full end-to-end framework module connectivity</p>

            {/* Visual Architecture Interconnected Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Inputs */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase text-purple-700 block mb-2">Input Resources</span>
                <ul className="space-y-2 text-slate-700">
                  <li className="bg-white p-2 rounded-xl border border-slate-200">Scientific Literature</li>
                  <li className="bg-white p-2 rounded-xl border border-slate-200">Structured Databases</li>
                  <li className="bg-white p-2 rounded-xl border border-slate-200">Empirical Observations</li>
                  <li className="bg-white p-2 rounded-xl border border-slate-200">Computational Tools</li>
                </ul>
              </div>

              {/* Core Discovery Loop */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-purple-800 block mb-2">Core Closed-Loop Modules</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
                    <strong className="text-slate-900 block text-xs">1. Knowledge Retrieval</strong>
                    <span className="text-[11px] text-slate-500 font-normal">Relevance scoring S(d,q)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
                    <strong className="text-slate-900 block text-xs">2. Hypothesis Engine</strong>
                    <span className="text-[11px] text-slate-500 font-normal">Foundation Model h*</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
                    <strong className="text-slate-900 block text-xs">3. Theory & SymPy</strong>
                    <span className="text-[11px] text-slate-500 font-normal">Consistency C(h)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
                    <strong className="text-slate-900 block text-xs">4. Experiments</strong>
                    <span className="text-[11px] text-slate-500 font-normal">Python runner E_pred</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs col-span-2">
                    <strong className="text-slate-900 block text-xs">5. Composite Validation & Persistent Memory</strong>
                    <span className="text-[11px] text-slate-500 font-normal">Validation score V(h) & Memory update H_t+1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: KNOWLEDGE GRAPH S(d,q) (Sidebar 'BookOpen') */}
      {activeView === 'knowledge' && (
        <div className="w-full max-w-3xl space-y-5 my-auto py-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-purple-600" />
                Retrieved Scientific Knowledge & Entities S(d, q) = f_rel(d, q)
              </h3>
              {projects.length > 0 && (
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold text-slate-700"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">Extracted concepts and dependency graph for literature grounding</p>

            {loadingViewData ? (
              <div className="text-center py-8 text-xs font-mono text-purple-600">Loading extracted knowledge...</div>
            ) : (viewGraph.nodes?.length > 0 || viewKnowledge?.length > 0) ? (
              <div className="space-y-4">
                {viewGraph.nodes?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {viewGraph.nodes.map((node: any, idx: number) => (
                      <div key={idx} className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4">
                        <span className="text-[10px] font-mono font-bold uppercase bg-purple-200 text-purple-800 px-2 py-0.5 rounded">
                          {node.type || 'ENTITY'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-2 mb-1">{node.name}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{node.description || 'Extracted scientific entity'}</p>
                      </div>
                    ))}
                  </div>
                )}
                {viewKnowledge?.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <span className="text-xs font-bold text-slate-700 font-mono uppercase">Literature Findings:</span>
                    {viewKnowledge.map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                        <strong className="text-slate-900 block mb-1">{item.title}</strong>
                        <p className="text-slate-600">{item.content}</p>
                        {item.relevance_score && (
                          <span className="text-[10px] font-mono text-purple-700 font-bold mt-1 block">Relevance S(d,q): {item.relevance_score}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No extracted knowledge found for this workspace. Upload research literature in workspace settings or launch the pipeline.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: HYPOTHESIS GENERATOR h* (Sidebar 'Lightbulb') */}
      {activeView === 'hypotheses' && (
        <div className="w-full max-w-3xl space-y-5 my-auto py-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4.5 h-4.5 text-purple-600" />
                Hypothesis Formulation h* = arg max P(h | K, C)
              </h3>
              {projects.length > 0 && (
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold text-slate-700"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">Foundation model candidate generation ranked by Score(h) = 0.30·P + 0.20·N + 0.25·T + 0.25·C</p>

            {loadingViewData ? (
              <div className="text-center py-8 text-xs font-mono text-purple-600">Loading candidate hypotheses...</div>
            ) : viewHypotheses?.length > 0 ? (
              <div className="space-y-4">
                {viewHypotheses.map((h: any, idx: number) => (
                  <div key={idx} className="bg-white border border-purple-200 rounded-2xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${h.status === 'selected' || h.status === 'validated' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}`}>
                        {h.status?.toUpperCase() || 'CANDIDATE'}
                      </span>
                      <span className="text-xs font-mono font-bold text-purple-700">
                        Overall Score: {h.overall_score != null ? `${(h.overall_score * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{h.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{h.statement}</p>
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl text-center text-[11px] font-mono">
                      <div>Plausibility: <span className="font-bold text-purple-700">{h.plausibility_score != null ? `${(h.plausibility_score * 100).toFixed(0)}%` : 'N/A'}</span></div>
                      <div>Novelty: <span className="font-bold text-purple-700">{h.novelty_score != null ? `${(h.novelty_score * 100).toFixed(0)}%` : 'N/A'}</span></div>
                      <div>Testability: <span className="font-bold text-purple-700">{h.testability_score != null ? `${(h.testability_score * 100).toFixed(0)}%` : 'N/A'}</span></div>
                      <div>Consistency: <span className="font-bold text-purple-700">{h.consistency_score != null ? `${(h.consistency_score * 100).toFixed(0)}%` : 'N/A'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                <Lightbulb className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No candidate hypotheses generated yet for this workspace. Run the discovery loop to generate testable hypotheses.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 6: AUTOMATED EXPERIMENTS E_pred (Sidebar 'Cpu') */}
      {activeView === 'experiments' && (
        <div className="w-full max-w-3xl space-y-5 my-auto py-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4.5 h-4.5 text-purple-600" />
                Automated Experiment Runner & E_pred = 1/N ∑ |y_i - y^_i|
              </h3>
              {projects.length > 0 && (
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold text-slate-700"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">Autonomous code execution and prediction error evaluation</p>

            {loadingViewData ? (
              <div className="text-center py-8 text-xs font-mono text-purple-600">Loading experiment telemetry...</div>
            ) : viewExperiments?.length > 0 ? (
              <div className="space-y-4">
                {viewExperiments.map((exp: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{exp.experiment_name}</span>
                        <span className="text-[10px] font-mono text-slate-500">Dataset: {exp.dataset_name}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 uppercase">
                        {exp.status}
                      </span>
                    </div>
                    {exp.experiment_code && (
                      <div className="bg-slate-950 p-4 rounded-2xl text-slate-200 font-mono text-xs overflow-x-auto">
                        <span className="text-slate-500 block mb-2">// Executed Python Experiment Code</span>
                        <pre className="text-purple-300 leading-relaxed">{exp.experiment_code}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No computational experiments executed yet. Launch discovery on a dataset to run automated experiments.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 7: COMPOSITE VALIDATION V(h) (Sidebar 'ShieldCheck') */}
      {activeView === 'validation' && (
        <div className="w-full max-w-3xl space-y-5 my-auto py-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                Composite Validation Score V(h) = α C(h) + β A(h) + γ N(h) + δ R(h)
              </h3>
              {projects.length > 0 && (
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold text-slate-700"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">Multi-criteria validation scoring: V(h) = α·C(h) + β·A(h) + γ·N(h) + δ·R(h)</p>

            {loadingViewData ? (
              <div className="text-center py-8 text-xs font-mono text-purple-600">Loading validation results...</div>
            ) : viewValidations?.length > 0 ? (
              <div className="space-y-4">
                {viewValidations.map((val: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs">
                      <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                        <span className="text-[10px] text-slate-500 uppercase block">Consistency C(h)</span>
                        <span className="text-lg font-bold text-purple-700">{(val.consistency_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                        <span className="text-[10px] text-slate-500 uppercase block">Agreement A(h)</span>
                        <span className="text-lg font-bold text-indigo-700">{(val.agreement_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 uppercase block">Novelty N(h)</span>
                        <span className="text-lg font-bold text-amber-700">{(val.novelty_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                        <span className="text-[10px] text-slate-500 uppercase block">Validation V(h)</span>
                        <span className="text-lg font-bold text-emerald-700">{val.validation_score}%</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                          {val.decision}
                        </span>
                      </div>
                      <p className="text-slate-600">{val.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No theories validated yet for this workspace. Execute the pipeline to evaluate candidate theories against baseline evidence.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 8: DISCOVERY MEMORY H_t+1 (Sidebar 'History') */}
      {activeView === 'memory' && (
        <div className="w-full max-w-3xl space-y-5 my-auto py-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-purple-600" />
                Persistent Discovery Memory & Feedback H_t+1 = F(H_t, E_t, M_t)
              </h3>
              {projects.length > 0 && (
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold text-slate-700"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6">Persistent reflection memory bank and iterative failure refinement</p>

            {loadingViewData ? (
              <div className="text-center py-8 text-xs font-mono text-purple-600">Loading discovery memories...</div>
            ) : viewMemories?.length > 0 ? (
              <div className="space-y-3 relative border-l-2 border-purple-200 ml-3 pl-5 font-mono text-xs">
                {viewMemories.map((m: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <span className={`font-bold block mb-1 ${m.memory_type === 'successful_candidate' ? 'text-purple-700' : 'text-amber-700'}`}>
                      ITERATION {m.iteration} • {m.memory_type?.toUpperCase()}
                    </span>
                    <p className="text-slate-700 font-sans">{m.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No discovery memory recorded yet for this workspace. Memory accumulates across iterative experiment cycles.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 9: PAPER BENCHMARKS (Sidebar 'BarChart3') */}
      {activeView === 'benchmarks' && (
        <div className="w-full max-w-3xl space-y-6 my-auto py-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />
                  Table II: Performance Evaluation of Proposed Framework
                </h3>
                <p className="text-slate-500 text-xs">Empirical evaluation across multiple scientific discovery criteria</p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Framework Benchmark
              </span>
            </div>

            {/* Visual Bar Graph matching Figure 6 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 my-4">
              {[
                { criterion: 'Hypothesis Quality', score: '86%', val: 86, color: 'bg-purple-600' },
                { criterion: 'Theory Consistency', score: '91%', val: 91, color: 'bg-emerald-600' },
                { criterion: 'Prediction Agreement', score: '88%', val: 88, color: 'bg-indigo-600' },
                { criterion: 'Novelty', score: '82%', val: 82, color: 'bg-amber-600' },
                { criterion: 'Reproducibility', score: '85%', val: 85, color: 'bg-cyan-600' }
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-2">{item.criterion}</span>
                  <div className="w-full bg-slate-200 h-24 rounded-xl flex items-end p-1 mb-2">
                    <div className={`w-full rounded-lg ${item.color} transition-all duration-500`} style={{ height: `${item.val}%` }} />
                  </div>
                  <span className="text-base font-black text-slate-900">{item.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" />
                Table III: Distribution of 100 Theory Candidates
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                  <span>Validated Candidates</span>
                  <strong className="text-sm font-bold">45 (45%)</strong>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                  <span>Refined Candidates</span>
                  <strong className="text-sm font-bold">35 (35%)</strong>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
                  <span>Rejected Candidates</span>
                  <strong className="text-sm font-bold">20 (20%)</strong>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Core Scientific Findings & Validation
              </h3>
              <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Theory Consistency (91%)</strong> achieves highest score via SymPy formal checks C(h).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Prediction Agreement (88%)</strong> validates theories against ground-truth evidence E_pred.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Discovery Memory H_t+1</strong> feeds back failed attempts to eliminate unpromising strategies.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="sticky bottom-0 z-20 w-full bg-white/95 backdrop-blur border-t border-slate-200/60 py-3 px-6 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-600" />
          <span>Active Discovery Workspaces: <strong className="text-slate-800">{projects.length}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-1.5 text-purple-700 font-semibold hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            New Research Problem
          </button>
          <span>•</span>
          {projects.length > 0 && (
            <Link
              to={`/projects/${projects[0].id}`}
              className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium"
            >
              Open Latest Pipeline Workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
