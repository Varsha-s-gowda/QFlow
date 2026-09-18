import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Users,
  Calendar,
  RefreshCw
} from 'lucide-react';

export default function AnalyticsCharts() {
  const [timeframe, setTimeframe] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/overview?timeframe=${timeframe}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const peakData = data?.peakHoursData || [];
  const maxPeak = Math.max(...peakData.map(d => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold font-heading text-white">Queue Analytics & Performance Metrics</h2>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Range:</span>
          </span>
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                timeframe === t.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={fetchAnalytics}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tokens Served
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-heading text-white">
            {summary.totalCompleted || 0}
          </div>
          <span className="text-[11px] text-slate-400 block">
            out of {summary.totalGenerated || 0} total generated
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avg. Wait Duration
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-heading text-white">
            ~{summary.avgWaitTimeMins || 0} <span className="text-sm font-normal text-slate-400">mins</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            from ticket generation to call
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avg. Service Duration
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-heading text-white">
            ~{summary.avgServiceTimeMins || 0} <span className="text-sm font-normal text-slate-400">mins</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            in-person counter handling time
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              No-Show & Skip Rate
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-heading text-rose-400">
            {summary.noShowRatePct || 0}%
          </div>
          <span className="text-[11px] text-slate-400 block">
            {summary.totalSkipped || 0} skipped / {summary.totalCancelled || 0} cancelled
          </span>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Peak Hours Traffic Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold font-heading text-white flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Peak Hours Queue Traffic</span>
              </h3>
              <p className="text-xs text-slate-400">Hourly token volume distribution (08:00 AM - 06:00 PM)</p>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2">
            {peakData.map((d) => {
              const heightPct = Math.max(8, Math.round((d.count / maxPeak) * 100));
              return (
                <div key={d.hour} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-indigo-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </span>
                  <div className="w-full bg-slate-900 rounded-t-lg h-44 flex items-end p-1 border border-slate-800/80">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-emerald-400 rounded-md transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Busiest Services List */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold font-heading text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Busiest Services</span>
              </h3>
              <p className="text-xs text-slate-400">Ranked by token volume</p>
            </div>

            <div className="space-y-3">
              {data?.busiestServices && data.busiestServices.length > 0 ? (
                data.busiestServices.map((s, idx) => {
                  const maxVal = data.busiestServices[0].count || 1;
                  const barWidth = Math.round((s.count / maxVal) * 100);
                  return (
                    <div key={s.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                          <span className="w-4 text-slate-500 font-mono">#{idx + 1}</span>
                          <span className="truncate max-w-[160px]">{s.name}</span>
                        </span>
                        <span className="font-mono font-bold text-indigo-400">{s.count} tokens</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">
                  No service telemetry data recorded for selected timeframe.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
