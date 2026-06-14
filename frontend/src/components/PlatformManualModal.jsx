import React from 'react';
import { X, BookOpen, Volume2, Mic, Star } from 'lucide-react';

const PlatformManualModal = ({ onClose, t }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">{t.manual_title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">
          {/* Section 0: Philosophy */}
          <div className="space-y-3 bg-indigo-500/10 p-5 rounded-xl border border-indigo-500/20">
            <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
              <Star className="w-5 h-5" />
              {t.manual_audience_title}
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
              {t.manual_audience_content}
            </p>
          </div>

          {/* Section 1: Listening */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              {t.manual_listen_title}
            </h3>
            <div className="pl-10">
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                {t.manual_listen_content}
              </p>
            </div>
          </div>

          {/* Section 2: Speaking */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              {t.manual_speak_title}
            </h3>
            <div className="pl-10">
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                {t.manual_speak_content}
              </p>
            </div>
          </div>

          {/* Section 3: Scoring */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-pink-400 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
              {t.manual_score_title}
            </h3>
            <div className="pl-10">
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                {t.manual_score_content}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 flex justify-end bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformManualModal;
