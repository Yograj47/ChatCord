import React from 'react';
import { Outlet } from 'react-router-dom';
import { LogoMark } from '../components/common/LogoMark';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col justify-between items-center p-6 md:p-10 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Brand Header */}
      <header className="w-full max-w-5xl flex justify-between items-center">
        <div className="flex items-center space-x-3 group cursor-pointer">
          {/* Node Cord Logo */}
          <div className="p-1 rounded-xl bg-linear-to-tr from-indigo-600/30 to-indigo-500/10 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 transition-transform group-hover:scale-105">
            <LogoMark size={32} />
          </div>

          {/* Wordmark with Active Status Indicator */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-wider text-zinc-100 font-mono">
              CHATCORD
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          </div>
        </div>
      </header>

      {/* Main Authentication Content Slot */}
      <main className="w-full max-w-105 my-auto py-8">
        <div className="relative bg-[#111319] border border-zinc-800/80 rounded-2xl p-8 shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center py-2 text-xs text-zinc-500 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-zinc-900/80 pt-6">
        <span>&copy; {new Date().getFullYear()} ChatCord. All rights reserved.</span>
        <div className="flex space-x-5">
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};