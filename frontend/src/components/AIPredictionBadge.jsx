import React from 'react';
import { Cpu, Sparkles, Clock, ShieldCheck, Zap } from 'lucide-react';

export default function AIPredictionBadge({ prediction }) {
  if (!prediction) return null;

  const confidencePct = Math.round((prediction.confidenceScore || 0.85) * 100);

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/30 p-5 shadow-xl space-y-3 overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-indigo-300">
          <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider font-heading">
            AI ML Wait-Time Prediction
          </span>
        </div>
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>{prediction.modelType || 'RandomForest Regressor'}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>AI Estimated Wait</span>
          </span>
          <div className="text-2xl font-extrabold font-heading text-white">
            ~{prediction.predictedWaitTimeMins} <span className="text-xs font-normal text-slate-400">mins</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Expected Turn Time</span>
          </span>
          <div className="text-lg font-bold font-heading text-emerald-300">
            {prediction.expectedCompletionTime || 'Calculating...'}
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>Model Confidence</span>
          </span>
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-200">{confidencePct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
