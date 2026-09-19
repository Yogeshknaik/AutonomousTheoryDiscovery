import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileText, Download, CheckCircle2, Award } from 'lucide-react';

export const Reports: React.FC<{ projectId: number }> = ({ projectId }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [projectId]);

  const loadReport = async () => {
    try {
      const data = await api.getReport(projectId);
      setReport(data);
    } catch (e) {
      console.error('Failed to load report', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Generating Autonomous Discovery Report...</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
      {/* Report Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-mono font-bold mb-2">
            <Award className="w-3.5 h-3.5" />
            Official Autonomous Research Discovery Record
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{report?.title}</h1>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4" />
          Export / Print Report
        </button>
      </div>

      {/* Problem & Objective */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Research Question</h3>
          <p className="text-slate-800 text-xs sm:text-sm leading-relaxed">{report?.research_question}</p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Research Objective</h3>
          <p className="text-slate-800 text-xs sm:text-sm leading-relaxed">{report?.objective}</p>
        </div>
      </div>

      {/* Validated Candidate Highlights */}
      <div className="bg-purple-50/60 p-6 rounded-2xl border border-purple-200">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Validated Candidate Discovery Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Candidate Theory</span>
            <span className="text-xs font-bold text-slate-900">{report?.validated_candidate?.theory_title}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Baseline vs Proposed F1</span>
            <span className="text-xs font-bold text-purple-700">
              {report?.validated_candidate?.baseline_f1} → {report?.validated_candidate?.proposed_f1} ({report?.validated_candidate?.improvement})
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Composite Validation Score</span>
            <span className="text-xs font-bold text-emerald-700">{report?.validated_candidate?.validation_score}% ({report?.validated_candidate?.decision})</span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-purple-300">
          <span className="text-[10px] text-slate-400 block mb-1">// Mathematical Formulation</span>
          {report?.validated_candidate?.mathematical_expression}
        </div>
      </div>

      {/* Discovery History */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Discovery Loop Iteration History</h3>
        <div className="space-y-3">
          {report?.discovery_history?.map((h: any, i: number) => (
            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start justify-between text-xs">
              <div>
                <span className="font-mono text-purple-700 font-bold block mb-1">Iteration {h.iteration} • {h.memory_type}</span>
                <p className="text-slate-700">{h.content}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{h.created_at}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conclusion */}
      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Scientific Conclusion</h3>
        <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{report?.conclusion}</p>
      </div>
    </div>
  );
};
