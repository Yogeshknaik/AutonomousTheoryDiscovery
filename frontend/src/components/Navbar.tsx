import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Search,
  UserPlus,
  Plus,
  Check,
  X,
  Share2
} from 'lucide-react';

interface NavbarProps {
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  onNewThread?: () => void;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedModel = 'Llama 3.2 11B (NVIDIA NIM)',
  setSelectedModel,
  onNewThread,
  onSearchClick
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  const models = [
    { id: 'Llama 3.2 11B (NVIDIA NIM)', name: 'Llama 3.2 11B (NVIDIA NIM)', desc: 'Active NVIDIA NIM foundation model for scientific reasoning' },
    { id: 'Nemotron 70B (NVIDIA NIM)', name: 'Nemotron 70B (NVIDIA NIM)', desc: 'High-parameter NVIDIA scientific reasoning model' },
    { id: 'GPT-4o Mini (OpenAI Fallback)', name: 'GPT-4o Mini (OpenAI Fallback)', desc: 'OpenAI multi-domain scientific assistant fallback' },
    { id: 'Gemini 1.5 Flash (Google Fallback)', name: 'Gemini 1.5 Flash (Google Fallback)', desc: 'Google multimodal high-speed research model' }
  ];

  const handleSelectModel = (modelName: string) => {
    if (setSelectedModel) {
      setSelectedModel(modelName);
    }
    setModelDropdownOpen(false);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  return (
    <header className="h-16 px-6 border-b border-slate-100 bg-white flex items-center justify-between select-none relative z-20">
      {/* Model Dropdown Selector (Top Left) */}
      <div className="relative min-w-0 shrink">
        <button
          onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all shadow-2xs"
        >
          {/* Sparkle Icon */}
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>{selectedModel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Model Menu Dropdown */}
        {modelDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setModelDropdownOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Select Scientific Foundation Model
              </div>
              <div className="space-y-1 mt-1">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectModel(m.name)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start justify-between ${
                      selectedModel === m.name
                        ? 'bg-purple-50 text-purple-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {selectedModel === m.name && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal mt-0.5 leading-snug">
                        {m.desc}
                      </p>
                    </div>
                    {selectedModel === m.name && <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Controls (Top Right) */}
      <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
        {/* Search thread button */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Search Discoveries</span>
        </button>

        {/* Invite Researcher button */}
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all"
        >
          <UserPlus className="w-3.5 h-3.5 text-slate-500" />
          <span>Invite Team</span>
        </button>

        {/* + New Discovery Problem button */}
        <button
          onClick={onNewThread}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Problem</span>
        </button>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                Invite Research Collaborators
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Invite researchers or laboratory colleagues to collaborate on this Autonomous Theory Discovery session.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="researcher@lab.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleCopyInviteLink}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                >
                  {inviteCopied ? 'Link Copied!' : 'Copy Discovery Link'}
                </button>
                <button
                  onClick={() => {
                    setInviteModalOpen(false);
                    setInviteEmail('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
