import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MessageSquare, LayoutGrid, Bot, Megaphone, Shield, User } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950/80 backdrop-blur-md border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30 animate-pulse">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                CloserFlow
              </h1>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                AI CRM Suite
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1">
            <NavLink
              to="/inbox"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/35 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Bandeja Entrada</span>
            </NavLink>

            <NavLink
              to="/pipeline"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/35 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Embudo CRM</span>
            </NavLink>

            <NavLink
              to="/chatbot"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/35 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Chatbots</span>
            </NavLink>

            <NavLink
              to="/broadcast"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/35 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Megaphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Difusiones WA</span>
            </NavLink>
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300">Administrador</p>
              <p className="text-[10px] text-slate-500">admin@closerflow.ai</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Page Area Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
