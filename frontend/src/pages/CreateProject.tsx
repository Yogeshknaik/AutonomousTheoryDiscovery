import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PlusCircle, Upload, FileText, Database, ArrowLeft, Cpu, Sparkles } from 'lucide-react';

export const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    research_question: '',
    domain: 'Machine Learning',
    objective: '',
    constraints: '',
    evaluation_metric: 'F1 Score',
    max_iterations: 3
  });

  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const proj = await api.createProject(formData);
      if (datasetFile) {
        await api.uploadDataset(proj.id, datasetFile);
      }
      if (docFiles) {
        for (let i = 0; i < docFiles.length; i++) {
          await api.uploadDocument(proj.id, docFiles[i]);
        }
      }
      navigate(`/projects/${proj.id}`);
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-semibold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-purple-500/5">
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Research Workspace</h1>
            <p className="text-slate-500 text-xs">Configure scientific problem parameters, datasets, and AI theory constraints</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
              Problem Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-purple-600 text-xs font-medium"
              placeholder="e.g. Adaptive Feature Selection Optimization"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
              Research Question *
            </label>
            <textarea
              required
              rows={3}
              value={formData.research_question}
              onChange={(e) => setFormData({ ...formData, research_question: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-purple-600 text-xs"
              placeholder="Formulate precise scientific research question..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                Domain
              </label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-purple-600 text-xs font-medium"
              >
                <option value="Machine Learning">Machine Learning</option>
                <option value="Deep Learning">Deep Learning</option>
                <option value="Data Mining">Data Mining</option>
                <option value="Optimization">Optimization</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                Evaluation Metric
              </label>
              <select
                value={formData.evaluation_metric}
                onChange={(e) => setFormData({ ...formData, evaluation_metric: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-purple-600 text-xs font-medium"
              >
                <option value="F1 Score">F1 Score</option>
                <option value="Accuracy">Accuracy</option>
                <option value="ROC-AUC">ROC-AUC</option>
                <option value="RMSE">RMSE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                Maximum Iterations
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.max_iterations}
                onChange={(e) => setFormData({ ...formData, max_iterations: parseInt(e.target.value) || 4 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-purple-600 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                Research Objective
              </label>
              <textarea
                rows={2}
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-purple-600 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                Operational Constraints
              </label>
              <textarea
                rows={2}
                value={formData.constraints}
                onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-purple-600 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Dataset Upload */}
            <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-purple-300 transition-colors">
              <Database className="w-7 h-7 text-purple-600 mx-auto mb-2" />
              <span className="block text-xs font-bold text-slate-800 mb-1">CSV Tabular Dataset</span>
              <span className="block text-[11px] text-slate-500 mb-3">Upload dataset for isolated experiment execution</span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setDatasetFile(e.target.files ? e.target.files[0] : null)}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
              />
            </div>

            {/* Document Upload */}
            <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-purple-300 transition-colors">
              <FileText className="w-7 h-7 text-indigo-600 mx-auto mb-2" />
              <span className="block text-xs font-bold text-slate-800 mb-1">Scientific Papers & Docs</span>
              <span className="block text-[11px] text-slate-500 mb-3">Upload PDF/DOCX research literature for knowledge parsing</span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={(e) => setDocFiles(e.target.files)}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            {loading ? (
              <span>Initializing Workspace...</span>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Initialize Discovery Workspace
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
