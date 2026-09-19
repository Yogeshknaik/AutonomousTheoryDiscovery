import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Layers,
  BookOpen,
  Lightbulb,
  Cpu,
  ShieldCheck,
  History,
  BarChart3,
  Headphones,
  Settings,
  X,
  UserCheck,
  Sliders,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  currentProjectId?: number;
  onNewThread?: () => void;
  activeView?: string;
  setActiveView?: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView = 'home',
  setActiveView
}) => {
  const location = useLocation();

  // Modals for Settings, Support/Docs & Profile
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Settings weights state
  const [weights, setWeights] = useState({
    consistency: 0.3,
    agreement: 0.3,
    novelty: 0.2,
    reproducibility: 0.2
  });

  const handleNavClick = (viewId: string) => {
    if (setActiveView) {
      setActiveView(viewId);
    }
  };

  const navItems = [
    { id: 'home', label: 'Discovery Studio', icon: Home },
    { id: 'pipeline', label: 'Closed-Loop Pipeline (7 Stages)', icon: Layers },
    { id: 'knowledge', label: 'Knowledge Retrieval S(d,q)', icon: BookOpen },
    { id: 'hypotheses', label: 'Hypothesis Generator h*', icon: Lightbulb },
    { id: 'experiments', label: 'Automated Experiments E_pred', icon: Cpu },
    { id: 'validation', label: 'Composite Validation V(h)', icon: ShieldCheck },
    { id: 'memory', label: 'Discovery Memory H_t+1', icon: History },
    { id: 'benchmarks', label: 'Paper Performance (Tables II & III)', icon: BarChart3 }
  ];

  return (
    <aside className="w-18 flex flex-col justify-between items-center py-5 border-r border-slate-100 bg-white h-full select-none z-30 shrink-0">
      {/* Top Section: System Brand Logo & Framework Nav */}
      <div className="flex flex-col items-center gap-6 w-full px-2">
        {/* System Logo Badge */}
        <Link
          to="/"
          onClick={() => handleNavClick('home')}
          className="relative group flex items-center justify-center"
          title="Autonomous Theory Discovery System"
        >
          <div className="w-9.5 h-9.5 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform duration-200">
            {/* 8-pointed star / gear logo */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
            </svg>
          </div>
          {/* Active indicator bar on far left */}
          <div className="absolute -left-2 w-1 h-5 bg-[#7C3AED] rounded-r-full hidden group-hover:block" />
        </Link>

        {/* Navigation Stack for Framework Modules */}
        <div className="flex flex-col items-center gap-1.5 w-full mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              activeView === item.id ||
              (item.id === 'home' && location.pathname === '/' && activeView === 'home');

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isItemActive
                    ? 'bg-[#F3EFFE] text-[#7C3AED] font-bold shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                {/* Purple side bar line matching reference screenshot */}
                {isItemActive && (
                  <div className="absolute -left-3 top-2.5 bottom-2.5 w-1 bg-[#7C3AED] rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 ${isItemActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Support, Settings & Researcher Profile */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Support & Documentation Modal Trigger */}
        <button
          onClick={() => setHelpOpen(true)}
          title="System Documentation & Paper Guide"
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
        >
          <Headphones className="w-4.5 h-4.5 stroke-[1.8]" />
        </button>

        {/* Settings Modal Trigger */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="Framework Parameters & Validation Weights"
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
        >
          <Settings className="w-4.5 h-4.5 stroke-[1.8]" />
        </button>

        {/* User Profile Avatar Trigger */}
        <button
          onClick={() => setProfileOpen(true)}
          className="mt-1 relative group cursor-pointer border-none bg-transparent p-0"
          title="Lead Researcher Profile"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
            alt="User avatar"
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23475569"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>';
            }}
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
        </button>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                Validation Function Weights V(h)
              </h3>
              <button onClick={() => setSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Adjust relative importance weights for composite evaluation: $V(h) = \alpha C(h) + \beta A(h) + \gamma N(h) + \delta R(h)$
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Consistency Weight α C(h)</span>
                  <span className="font-bold text-purple-700">{weights.consistency}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={weights.consistency}
                  onChange={(e) => setWeights({ ...weights, consistency: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Agreement Weight β A(h)</span>
                  <span className="font-bold text-purple-700">{weights.agreement}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={weights.agreement}
                  onChange={(e) => setWeights({ ...weights, agreement: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Novelty Weight γ N(h)</span>
                  <span className="font-bold text-purple-700">{weights.novelty}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={weights.novelty}
                  onChange={(e) => setWeights({ ...weights, novelty: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm mt-2"
              >
                Save Framework Weights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Documentation Modal */}
      {helpOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                Paper Implementation Architecture Guide
              </h3>
              <button onClick={() => setHelpOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>Autonomous Theory Discovery Framework using Foundation Models</strong> combines knowledge acquisition, hypothesis formulation, mathematical reasoning, automated experimentation, and persistent memory into a closed loop.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl font-mono text-[11px] text-purple-900 border border-slate-200">
                Data Flow: Problem → Retrieval S(d,q) → Hypothesis h* → SymPy C(h) → Experiment E_pred → Validation V(h) → Memory H_t+1
              </div>
              <p>
                For full details, view the paper PDF or navigate using the left sidebar items to inspect each individual module!
              </p>
            </div>
            <button
              onClick={() => setHelpOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm mt-4"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-center">
            <div className="flex justify-end">
              <button onClick={() => setProfileOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
              alt="Researcher"
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 mx-auto mb-3 shadow-md"
            />
            <h3 className="text-base font-bold text-slate-900">Dr. Jason Vance</h3>
            <span className="text-xs text-purple-700 font-mono font-semibold block mb-4">Lead AI Science Researcher</span>
            
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-mono text-slate-600 space-y-1 mb-4">
              <div>Active Discoveries: <strong className="text-slate-900">12 Workspaces</strong></div>
              <div>Framework Autonomy: <strong className="text-emerald-700">Full Closed-Loop</strong></div>
            </div>

            <button
              onClick={() => setProfileOpen(false)}
              className="w-full py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
