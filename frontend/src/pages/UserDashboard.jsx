import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import QueueStatusBadge from '../components/QueueStatusBadge';
import Modal from '../components/Modal';
import {
  Building2,
  Clock,
  Users,
  Ticket,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Phone
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('all');
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningService, setJoiningService] = useState(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const orgsData = await api.get('/orgs');
      setOrgs(orgsData);

      if (user) {
        const activeData = await api.get('/queue/my-token');
        if (activeData.active) {
          setActiveToken(activeData);
        } else {
          setActiveToken(null);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    if (!joiningService) return;
    setError('');
    setJoining(true);

    try {
      const res = await api.post('/queue/join', {
        serviceId: joiningService._id,
        customerPhone: phone
      });
      setJoiningService(null);
      navigate('/my-token');
    } catch (err) {
      setError(err.message || 'Failed to join queue');
    } finally {
      setJoining(false);
    }
  };

  const filteredOrgs = selectedOrgId === 'all'
    ? orgs
    : orgs.filter(o => o._id === selectedOrgId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-10 border border-slate-800 shadow-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Virtual Queue Management System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Skip the Line, Keep Your Time.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Select an organization and service below to generate your automatic digital token. Monitor your real-time queue position on your mobile device.
          </p>
        </div>
      </div>

      {/* Active Token Banner if user already in a queue */}
      {activeToken && activeToken.active && (
        <div className="glass-panel border-2 border-emerald-500/40 bg-emerald-950/20 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-slow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  You Have An Active Token
                </span>
                <QueueStatusBadge status={activeToken.token.status} />
              </div>
              <h3 className="text-2xl font-bold font-heading text-white">
                Token #{activeToken.token.tokenNumber}
              </h3>
              <p className="text-xs text-slate-300">
                Service: <span className="font-semibold text-white">{activeToken.token.serviceId?.name}</span>
                {activeToken.peopleAhead > 0 && ` • ${activeToken.peopleAhead} people ahead`}
              </p>
            </div>
          </div>
          <Link
            to="/my-token"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>View Live Queue Position</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Organization Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800">
        <h2 className="text-xl font-bold font-heading text-white flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <span>Available Organizations & Services</span>
        </h2>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedOrgId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedOrgId === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            All Organizations
          </button>
          {orgs.map((org) => (
            <button
              key={org._id}
              onClick={() => setSelectedOrgId(org._id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedOrgId === org._id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>
      </div>

      {/* Service Listings */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          {filteredOrgs.map((org) => (
            <div key={org._id} className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-slate-800/60 pb-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>{org.name}</span>
                    <span className="text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                      {org.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{org.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {org.services && org.services.length > 0 ? (
                  org.services.map((service) => (
                    <div
                      key={service._id}
                      className="glass-card p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between group space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                            {service.prefix}
                          </span>
                          <QueueStatusBadge status={service.status} />
                        </div>

                        <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {service.name}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {service.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/60 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>~{service.estimatedTimePerUser} mins / token</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Active Queue</span>
                          </div>
                        </div>

                        <button
                          disabled={service.status === 'closed'}
                          onClick={() => {
                            if (!user) {
                              navigate('/login');
                            } else {
                              setJoiningService(service);
                            }
                          }}
                          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2 ${
                            service.status === 'closed'
                              ? 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40'
                          }`}
                        >
                          <Ticket className="w-4 h-4" />
                          <span>{service.status === 'closed' ? 'Queue Closed' : 'Join Virtual Queue'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic col-span-full">
                    No services currently available for this organization.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Queue Modal */}
      <Modal
        isOpen={!!joiningService}
        onClose={() => setJoiningService(null)}
        title={`Join Queue - ${joiningService?.name}`}
      >
        <form onSubmit={handleJoinQueue} className="space-y-5">
          {error && (
            <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Service:</span>
              <span className="font-semibold text-white">{joiningService?.name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Token Prefix:</span>
              <span className="font-mono text-indigo-400 font-bold">{joiningService?.prefix}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Est. Time per Customer:</span>
              <span className="text-slate-200">{joiningService?.estimatedTimePerUser} minutes</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contact Phone (Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555-0142"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setJoiningService(null)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={joining}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {joining ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Generate Token</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
