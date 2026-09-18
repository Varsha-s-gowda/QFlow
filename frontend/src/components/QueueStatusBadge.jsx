import React from 'react';

export default function QueueStatusBadge({ status }) {
  const styles = {
    waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    called: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse',
    completed: 'bg-slate-800 text-slate-400 border-slate-700',
    skipped: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    cancelled: 'bg-slate-900 text-slate-500 border-slate-800',
    open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    closed: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  const labels = {
    waiting: 'Waiting',
    called: 'NOW CALLED / SERVING',
    completed: 'Completed',
    skipped: 'Skipped',
    cancelled: 'Cancelled',
    open: 'QUEUE OPEN',
    closed: 'QUEUE CLOSED'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
        styles[status] || 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
