import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Lightbulb, Microscope } from 'lucide-react';

const TABS = [
  { label: 'Research Hub', path: '/research', icon: BookOpen },
  { label: 'Research Insights', path: '/insights', icon: Lightbulb },
  { label: 'About Platform', path: '/about', icon: Microscope },
];

export default function ResearchSubnav() {
  const location = useLocation();

  return (
    <nav aria-label="Research area navigation" className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm max-w-fit">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[#FF2A55]/15 text-white border border-[#FF2A55]/40 shadow-[0_0_15px_rgba(255,42,85,0.25)]'
                : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <Icon size={14} className={isActive ? 'text-[#FF2A55]' : 'text-white/40'} />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
