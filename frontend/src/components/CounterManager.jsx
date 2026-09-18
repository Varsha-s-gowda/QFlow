import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import QueueStatusBadge from './QueueStatusBadge';
import Modal from './Modal';
import {
  Monitor,
  Plus,
  Play,
  CheckCircle2,
  Building2,
  RefreshCw,
  Users,
  Settings,
  Layers,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function CounterManager({ orgs, onCounterCall }) {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCounter, setNewCounter] = useState({
    organizationId: orgs[0]?._id || '',
    counterNumber: 1,
    name: 'Counter 1',
    assignedServices: []
  });

  const fetchCounters = async () => {
    try {
      setLoading(true);
      const data = await api.get('/counters');
      setCounters(data);
    } catch (err) {
      console.error('Failed to load counters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounters();
  }, [orgs]);

  const handleCreateCounter = async (e) => {
    e.preventDefault();
    try {
      await api.post('/counters', newCounter);
      setShowAddModal(false);
      fetchCounters();
    } catch (err) {
      alert(err.message || 'Failed to create counter');
    }
  };

  const handleToggleStatus = async (counter) => {
    try {
      const nextStatus = counter.status === 'open' ? 'closed' : 'open';
      await api.patch(`/counters/${counter._id}`, { status: nextStatus });
      fetchCounters();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCallFromCounter = async (counterId) => {
    try {
      await api.post('/queue/call-next', { counterId });
      fetchCounters();
      if (onCounterCall) onCounterCall();
    } catch (err) {
      alert(err.message || 'No waiting tokens for this counter');
    }
  };

  const allServices = orgs.flatMap(o => o.services || []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">Multi-Counter Management</h2>
            <p className="text-xs text-slate-400">Configure physical counters and smart auto-allocation queues</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCounters}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Counter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : counters.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-4">
          <Monitor className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">No active counters created. Add a counter to enable multi-desk queue allocation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counters.map((c) => (
            <div
              key={c._id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 relative flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      DESK #{c.counterNumber}
                    </span>
                    <h3 className="text-base font-bold text-white">{c.name}</h3>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(c)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    {c.status === 'open' ? (
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Currently Serving</span>
                  <div className="text-lg font-bold font-heading text-emerald-400">
                    {c.currentServingToken?.tokenNumber || 'Available / Idle'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Assigned Services:</span>
                  <div className="flex flex-wrap gap-1">
                    {c.assignedServices && c.assignedServices.length > 0 ? (
                      c.assignedServices.map(s => (
                        <span key={s._id} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-800">
                          {s.prefix} - {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-amber-400 italic">All Organization Services</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Served: {c.tokensServedCount} tokens</span>

                <button
                  onClick={() => handleCallFromCounter(c._id)}
                  disabled={c.status === 'closed'}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Call to Counter</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Counter Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Service Counter">
        <form onSubmit={handleCreateCounter} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Organization</label>
            <select
              required
              value={newCounter.organizationId}
              onChange={(e) => setNewCounter({ ...newCounter, organizationId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            >
              {orgs.map(o => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Counter #</label>
              <input
                type="number"
                required
                min="1"
                value={newCounter.counterNumber}
                onChange={(e) => setNewCounter({ ...newCounter, counterNumber: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Counter Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Counter 2 - Express"
                value={newCounter.name}
                onChange={(e) => setNewCounter({ ...newCounter, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">Assign Services to Counter</label>
            <div className="space-y-2 max-h-40 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800">
              {allServices.map(s => (
                <label key={s._id} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCounter.assignedServices.includes(s._id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...newCounter.assignedServices, s._id]
                        : newCounter.assignedServices.filter(id => id !== s._id);
                      setNewCounter({ ...newCounter, assignedServices: updated });
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>[{s.prefix}] {s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              Create Counter
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
