import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { 
  Database, 
  Map, 
  HeartPulse, 
  Brain, 
  Dna, 
  Pill, 
  Apple, 
  Lock,
  Activity
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Data Ingestion', icon: Database, requiresData: false },
  { path: '/ancestry', label: 'Ancestry', icon: Map, requiresData: true },
  { path: '/health', label: 'Health', icon: HeartPulse, requiresData: true },
  { path: '/neurodivergence', label: 'Neurodivergence', icon: Brain, requiresData: true },
  { path: '/traits', label: 'Traits', icon: Dna, requiresData: true },
  { path: '/pgx', label: 'PGx', icon: Pill, requiresData: true },
  { path: '/nutrigenomics', label: 'Nutrigenomics', icon: Apple, requiresData: true },
];

export default function Sidebar() {
  const { hasData } = useAppStore();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-lg font-bold text-white leading-tight">
          Genomic<br />Suite
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isLocked = item.requiresData && !hasData;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={isLocked ? '#' : item.path}
              onClick={(e) => {
                if (isLocked) e.preventDefault();
              }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm group",
                isLocked 
                  ? "opacity-50 cursor-not-allowed text-slate-500 hover:bg-slate-800/50" 
                  : isActive && !isLocked
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon className={cn("w-5 h-5", isLocked ? "text-slate-600" : "")} />
              <span className="flex-1">{item.label}</span>
              {isLocked && <Lock className="w-4 h-4 text-slate-600" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-300">Status</p>
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", hasData ? "bg-emerald-500" : "bg-amber-500")} />
            {hasData ? "DNA Data Loaded" : "Awaiting Data"}
          </div>
        </div>
      </div>
    </aside>
  );
}
