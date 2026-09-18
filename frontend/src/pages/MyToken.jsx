import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { subscribeToServiceQueue, subscribeToUserToken } from '../services/socket';
import QueueStatusBadge from '../components/QueueStatusBadge';
import AIPredictionBadge from '../components/AIPredictionBadge';
import {
  Ticket,
  Clock,
  Users,
  RefreshCw,
  XCircle,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Radio
} from 'lucide-react';

export default function MyToken() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchTokenData = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/queue/my-token');
      setData(res);
    } catch (err) {
      console.error('Failed to load token info:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
  }, []);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!data?.token) return;

    const serviceId = data.token.serviceId?._id || data.token.serviceId;
    const userId = data.token.userId;

    const unsubscribeQueue = subscribeToServiceQueue(serviceId, () => {
      console.log('[Socket.IO] Service queue updated event received - updating live view');
      fetchTokenData();
    });

    const unsubscribeUser = subscribeToUserToken(userId, () => {
      console.log('[Socket.IO] Token status updated event received - updating live view');
      fetchTokenData();
    });

    return () => {
      unsubscribeQueue();
      unsubscribeUser();
    };
  }, [data?.token?._id]);

  const handleCancelToken = async () => {
    if (!data?.token?._id) return;
    if (!window.confirm('Are you sure you want to cancel your queue token?')) return;

    setCancelling(true);
    try {
      await api.patch(`/queue/token/${data.token._id}/status`, { status: 'cancelled' });
      fetchTokenData();
    } catch (err) {
      alert(err.message || 'Failed to cancel token');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Services</span>
        </Link>

        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Real-time Live Sync</span>
          </div>

          <button
            onClick={fetchTokenData}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {!data?.active || !data?.token ? (
        <div className="glass-panel rounded-3xl p-10 border border-slate-800 text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-heading text-white">No Active Token</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              You are currently not waiting in any virtual queue. Browse available services to take a digital token.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Ticket className="w-4 h-4" />
            <span>Join a Queue Now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Digital Token Card */}
          <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 p-8 sm:p-10 shadow-2xl space-y-8 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Service & Org details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>{data.token.serviceId?.organizationId?.name || 'Organization'}</span>
                </div>
                <h2 className="text-xl font-bold font-heading text-white">
                  {data.token.serviceId?.name || 'Service Queue'}
                </h2>
              </div>
              <div>
                <QueueStatusBadge status={data.token.status} />
              </div>
            </div>

            {/* Token Big Display */}
            <div className="text-center py-6 space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-widest">
                YOUR DIGITAL TOKEN NUMBER
              </span>
              <div className="font-heading text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-white to-emerald-300 bg-clip-text text-transparent">
                {data.token.tokenNumber}
              </div>
              <p className="text-xs text-slate-400">
                Booked for: <span className="text-slate-200 font-medium">{data.token.customerName}</span>
              </p>
            </div>

            {/* Status Alert Banner */}
            {data.token.status === 'called' && (
              <div className="bg-emerald-500/20 border-2 border-emerald-500/40 p-4 rounded-2xl flex items-center space-x-3 text-emerald-300 animate-pulse">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div className="text-xs sm:text-sm font-semibold">
                  IT IS YOUR TURN! Please proceed to the service counter immediately.
                </div>
              </div>
            )}

            {/* AI ML Prediction Widget */}
            {data.token.status === 'waiting' && (
              <AIPredictionBadge prediction={data.aiPrediction} />
            )}

            {/* Real-time Live Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1 text-center">
                <div className="flex items-center justify-center space-x-1.5 text-indigo-400 text-xs font-medium">
                  <Users className="w-4 h-4" />
                  <span>People Ahead</span>
                </div>
                <div className="text-3xl font-extrabold font-heading text-white">
                  {data.peopleAhead}
                </div>
                <span className="text-[11px] text-slate-400">waiting in front of you</span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1 text-center">
                <div className="flex items-center justify-center space-x-1.5 text-emerald-400 text-xs font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Est. Wait Time</span>
                </div>
                <div className="text-3xl font-extrabold font-heading text-white">
                  ~{data.estimatedWaitTimeMins} <span className="text-sm font-normal text-slate-400">mins</span>
                </div>
                <span className="text-[11px] text-slate-400">AI dynamic prediction</span>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1 text-center">
                <div className="flex items-center justify-center space-x-1.5 text-amber-400 text-xs font-medium">
                  <Ticket className="w-4 h-4" />
                  <span>Now Serving</span>
                </div>
                <div className="text-3xl font-extrabold font-heading text-amber-300">
                  {data.currentServingToken}
                </div>
                <span className="text-[11px] text-slate-400">counter active token</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Token Created: {new Date(data.token.createdAt).toLocaleTimeString()}</span>

              {data.token.status === 'waiting' && (
                <button
                  onClick={handleCancelToken}
                  disabled={cancelling}
                  className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 font-semibold hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Token</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
