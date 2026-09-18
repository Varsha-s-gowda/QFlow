import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Shield, LogOut, User as UserIcon, LayoutDashboard, Layers } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Ticket className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                SmartQ
              </span>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold -mt-1">
                Virtual Queue System
              </span>
            </div>
          </Link>

          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800/60 transition-colors"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Services</span>
                </Link>

                <Link
                  to="/my-token"
                  className="flex items-center space-x-2 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800/60 transition-colors"
                >
                  <Ticket className="w-4 h-4 text-emerald-400" />
                  <span>My Active Token</span>
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  >
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <div className="h-5 w-px bg-slate-800 my-auto" />

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">{user.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800/60 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
