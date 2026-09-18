import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sliders, Zap, TrendingDown, Clock, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export default function WhatIfSimulator() {
  const [params, setParams] = useState({
    currentWaiting: 25,
    activeCounters: 2,
    additionalCounters: 2,
    avgServiceTimeMins: 5.0,
    arrivalSurgePct: 30
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    try {
      setLoading(true);
      // Call Python AI & Queue Simulation Service via Proxy or Direct
      const res = await fetch('http://127.0.0.1:8000/simulate-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_waiting: params.currentWaiting,
          active_counters: params.activeCounters,
          additional_counters: params.additionalCounters,
          avg_service_time_mins: params.avgServiceTimeMins,
          arrival_surge_pct: params.arrivalSurgePct
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      // Fallback internal simulation if python AI service port 8000 is offline
      const total = params.activeCounters + params.additionalCounters;
      const baseWait = (params.currentWaiting * 5.0) / params.activeCounters;
      const simWait = (params.currentWaiting * (1 + params.arrivalSurgePct / 100) * 5.0) / total;
      const reduction = Math.max(0, Math.round(((baseWait - simWait) / baseWait) * 100));

      setResult({
        current_active_counters: params.activeCounters,
        proposed_total_counters: total,
        additional_counters_added: params.additionalCounters,
        simulated_queue_length: Math.round(params.currentWaiting * (1 + params.arrivalSurgePct / 100)),
        baseline_avg_wait_mins: Math.round(baseWait * 10) / 10,
        simulated_avg_wait_mins: Math.round(simWait * 10) / 10,
        time_saved_mins: Math.round(Math.max(0, baseWait - simWait) * 10) / 10,
        wait_time_reduction_pct: reduction,
        projected_throughput_per_hour: Math.round((total / 5.0) * 60),
        bottleneck_warning: simWait > 30 ? "HIGH BOTTLENECK ALERT: Wait time exceeds 30 mins." : "OPTIMAL CAPACITY"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [params]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">AI What-If Queue Scenario Simulator</h2>
            <p className="text-xs text-slate-400">Simulate counter additions & customer traffic surges to optimize wait times</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Simulation Parameters</span>
          </h3>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Current Queue Size:</span>
                <span className="text-white font-mono">{params.currentWaiting} people</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={params.currentWaiting}
                onChange={(e) => setParams({ ...params, currentWaiting: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Active Counters Currently:</span>
                <span className="text-indigo-400 font-mono font-bold">{params.activeCounters} counter(s)</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={params.activeCounters}
                onChange={(e) => setParams({ ...params, activeCounters: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Proposed Additional Counters:</span>
                <span className="text-emerald-400 font-mono font-bold">+{params.additionalCounters} counter(s)</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={params.additionalCounters}
                onChange={(e) => setParams({ ...params, additionalCounters: parseInt(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-400">Customer Arrival Surge:</span>
                <span className="text-amber-400 font-mono font-bold">+{params.arrivalSurgePct}% traffic</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="10"
                value={params.arrivalSurgePct}
                onChange={(e) => setParams({ ...params, arrivalSurgePct: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold font-heading text-white">Projected Simulation Outcomes</h3>
                  <p className="text-xs text-slate-400">Comparing baseline setup vs proposed multi-counter scaling</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {result.proposed_total_counters} Total Counters Active
                </span>
              </div>

              {result.bottleneck_warning && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{result.bottleneck_warning}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-slate-400">Baseline Wait Time</span>
                  <div className="text-3xl font-extrabold font-heading text-slate-400 line-through">
                    ~{result.baseline_avg_wait_mins}m
                  </div>
                  <span className="text-[11px] text-slate-500">without added counters</span>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 text-center space-y-1">
                  <span className="text-xs text-emerald-400 font-bold uppercase">Simulated Wait Time</span>
                  <div className="text-4xl font-extrabold font-heading text-emerald-300">
                    ~{result.simulated_avg_wait_mins}m
                  </div>
                  <span className="text-[11px] text-emerald-400">with proposed scaling</span>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-xs text-indigo-400 font-semibold">Wait Time Reduction</span>
                  <div className="text-3xl font-extrabold font-heading text-indigo-300 flex items-center justify-center space-x-1">
                    <TrendingDown className="w-6 h-6 text-indigo-400" />
                    <span>-{result.wait_time_reduction_pct}%</span>
                  </div>
                  <span className="text-[11px] text-slate-400">saves ~{result.time_saved_mins} mins / user</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Projected Throughput: <strong className="text-white font-mono">{result.projected_throughput_per_hour} customers / hr</strong></span>
                <span>Simulated Queue Length: <strong className="text-white font-mono">{result.simulated_queue_length} tokens</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
