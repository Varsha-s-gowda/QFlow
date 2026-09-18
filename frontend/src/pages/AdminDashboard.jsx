import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import QueueStatusBadge from '../components/QueueStatusBadge';
import Modal from '../components/Modal';
import {
  Shield,
  Plus,
  Play,
  CheckCircle2,
  SkipForward,
  Building2,
  Layers,
  Users,
  Clock,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Ticket
} from 'lucide-react';

export default function AdminDashboard() {
  const [orgs, setOrgs] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showAddService, setShowAddService] = useState(false);
  const [showAddOrg, setShowAddOrg] = useState(false);

  // New Service Form
  const [newService, setNewService] = useState({
    organizationId: '',
    name: '',
    prefix: '',
    description: '',
    estimatedTimePerUser: 5
  });

  // New Org Form
  const [newOrg, setNewOrg] = useState({
    name: '',
    code: '',
    description: '',
    address: ''
  });

  const fetchOrgs = async () => {
    try {
      const data = await api.get('/orgs');
      setOrgs(data);
      if (data.length > 0 && data[0].services.length > 0 && !selectedServiceId) {
        setSelectedServiceId(data[0].services[0]._id);
        setNewService(prev => ({ ...prev, organizationId: data[0]._id }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchQueueData = async (serviceId) => {
    if (!serviceId) return;
    try {
      setRefreshing(true);
      const data = await api.get(`/queue/service/${serviceId}`);
      setQueueData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchQueueData(selectedServiceId);
    }
  }, [selectedServiceId]);

  const handleCallNext = async () => {
    if (!selectedServiceId) return;
    try {
      await api.post('/queue/call-next', { serviceId: selectedServiceId });
      fetchQueueData(selectedServiceId);
    } catch (err) {
      alert(err.message || 'No waiting tokens to call');
    }
  };

  const handleUpdateStatus = async (tokenId, status) => {
    try {
      await api.patch(`/queue/token/${tokenId}/status`, { status });
      fetchQueueData(selectedServiceId);
    } catch (err) {
      alert(err.message || 'Failed to update token status');
    }
  };

  const handleToggleServiceStatus = async (serviceId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
      await api.patch(`/services/${serviceId}/status`, { status: nextStatus });
      fetchOrgs();
      if (selectedServiceId === serviceId) {
        fetchQueueData(serviceId);
      }
    } catch (err) {
      alert(err.message || 'Failed to update service status');
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', newService);
      setShowAddService(false);
      setNewService({
        organizationId: orgs[0]?._id || '',
        name: '',
        prefix: '',
        description: '',
        estimatedTimePerUser: 5
      });
      fetchOrgs();
    } catch (err) {
      alert(err.message || 'Failed to create service');
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      await api.post('/orgs', newOrg);
      setShowAddOrg(false);
      setNewOrg({ name: '', code: '', description: '', address: '' });
      fetchOrgs();
    } catch (err) {
      alert(err.message || 'Failed to create organization');
    }
  };

  // Find selected service metadata
  const allServices = orgs.flatMap(o => o.services || []);
  const currentService = allServices.find(s => s._id === selectedServiceId);

  // Filter tokens
  const filteredTokens = queueData?.tokens ? queueData.tokens.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  }) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-white">Queue Control Dashboard</h1>
            <p className="text-xs text-slate-400">Manage organizations, services, and live queue operations</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <button
            onClick={() => setShowAddOrg(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>+ Add Organization</span>
          </button>
          <button
            onClick={() => setShowAddService(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Service</span>
          </button>
        </div>
      </div>

      {/* Service Selector Selector Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block">
              Select Active Queue Service to Control:
            </label>
            <div className="flex items-center space-x-3">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[260px]"
              >
                {orgs.map(org => (
                  <optgroup key={org._id} label={org.name}>
                    {org.services?.map(s => (
                      <option key={s._id} value={s._id}>
                        [{s.prefix}] {s.name} ({s.status.toUpperCase()})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {currentService && (
                <button
                  onClick={() => handleToggleServiceStatus(currentService._id, currentService.status)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center space-x-2 transition-all ${
                    currentService.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {currentService.status === 'open' ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                      <span>QUEUE IS OPEN</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-rose-400" />
                      <span>QUEUE IS CLOSED</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => fetchQueueData(selectedServiceId)}
            disabled={refreshing}
            className="self-end sm:self-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {queueData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Currently Serving</span>
            <div className="text-3xl font-extrabold font-heading text-emerald-400">
              {queueData.currentServingToken || 'None'}
            </div>
            <span className="text-[11px] text-slate-500">active called token</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Waiting in Queue</span>
            <div className="text-3xl font-extrabold font-heading text-amber-400">
              {queueData.totalWaiting}
            </div>
            <span className="text-[11px] text-slate-500">tokens awaiting call</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Served Today</span>
            <div className="text-3xl font-extrabold font-heading text-white">
              {queueData.completedCount}
            </div>
            <span className="text-[11px] text-slate-500">completed tokens</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Skipped Tokens</span>
            <div className="text-3xl font-extrabold font-heading text-rose-400">
              {queueData.skippedCount}
            </div>
            <span className="text-[11px] text-slate-500">tokens skipped</span>
          </div>
        </div>
      )}

      {/* Main Queue Management Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold font-heading text-white">Live Token Queue</h2>
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {['all', 'waiting', 'called', 'completed', 'skipped'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                    statusFilter === f
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCallNext}
            disabled={!queueData || queueData.totalWaiting === 0}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>CALL NEXT TOKEN</span>
          </button>
        </div>

        {/* Tokens Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm italic">
            No tokens found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="px-4 py-3">Token #</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTokens.map((token) => (
                  <tr key={token._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sm text-indigo-300">
                      {token.tokenNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {token.customerName}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {token.customerPhone || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <QueueStatusBadge status={token.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(token.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {token.status === 'called' && (
                        <button
                          onClick={() => handleUpdateStatus(token._id, 'completed')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center space-x-1 inline-flex transition-all shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                      )}

                      {(token.status === 'waiting' || token.status === 'called') && (
                        <button
                          onClick={() => handleUpdateStatus(token._id, 'skipped')}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg font-semibold flex items-center space-x-1 inline-flex transition-all"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                          <span>Skip</span>
                        </button>
                      )}

                      {token.status === 'skipped' && (
                        <button
                          onClick={() => handleUpdateStatus(token._id, 'waiting')}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg font-semibold inline-flex transition-all"
                        >
                          Re-queue
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      <Modal isOpen={showAddService} onClose={() => setShowAddService(false)} title="Add New Queue Service">
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Organization</label>
            <select
              required
              value={newService.organizationId}
              onChange={(e) => setNewService({ ...newService, organizationId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            >
              <option value="">Select Organization</option>
              {orgs.map(o => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Service Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Cardiology OPD"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Token Prefix</label>
              <input
                type="text"
                required
                placeholder="e.g. CARD"
                maxLength="5"
                value={newService.prefix}
                onChange={(e) => setNewService({ ...newService, prefix: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white uppercase text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Est. Mins / User</label>
              <input
                type="number"
                required
                min="1"
                value={newService.estimatedTimePerUser}
                onChange={(e) => setNewService({ ...newService, estimatedTimePerUser: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Description</label>
            <textarea
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              placeholder="Service description..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm h-20"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddService(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              Create Service
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Organization Modal */}
      <Modal isOpen={showAddOrg} onClose={() => setShowAddOrg(false)} title="Add New Organization">
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. City General Hospital"
              value={newOrg.name}
              onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Code / Abbreviation</label>
            <input
              type="text"
              required
              placeholder="e.g. CGH"
              value={newOrg.code}
              onChange={(e) => setNewOrg({ ...newOrg, code: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white uppercase text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Address</label>
            <input
              type="text"
              placeholder="e.g. 123 Main Street"
              value={newOrg.address}
              onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Description</label>
            <textarea
              value={newOrg.description}
              onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
              placeholder="Organization details..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm h-20"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddOrg(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              Create Organization
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
