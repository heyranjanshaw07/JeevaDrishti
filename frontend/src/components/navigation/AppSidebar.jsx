import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Microscope, X, LogOut } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { SIDEBAR_SECTIONS, SETTINGS_ITEM } from './sidebarConfig';

function SidebarContent({ onMobileClose, statusText, shouldReduceMotion, isMobile = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openLogoutModal } = useAppStore();

  const handleLogout = () => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
    openLogoutModal();
  };

  // Helper to accurately match active state across variants
  const isItemActive = (path, exact) => {
    if (exact || path === '/dashboard') {
      return location.pathname === path;
    }
    if (path === '/dataset') {
      return location.pathname.startsWith('/dataset') || location.pathname.startsWith('/datasets');
    }
    if (path === '/benchmark') {
      return location.pathname.startsWith('/benchmark') || location.pathname.startsWith('/experiments');
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const renderNavItem = (item) => {
    const IconComponent = item.icon;
    const active = isItemActive(item.path, item.exact);

    return (
      <motion.div
        key={item.path}
        whileHover={shouldReduceMotion ? {} : { x: 2 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <NavLink
          to={item.path}
          end={item.exact}
          onClick={handleNavClick}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2A55] ${
            active
              ? 'text-white font-semibold'
              : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          {active && (
            <motion.div
              layoutId={shouldReduceMotion ? undefined : (isMobile ? 'activeSidebarPillMobile' : 'activeSidebarPillDesktop')}
              className="absolute inset-0 rounded-xl bg-[#FF2A55]/15 border border-[#FF2A55]/40 shadow-[0_0_20px_rgba(255,42,85,0.25)] pointer-events-none"
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            />
          )}
          <IconComponent
            size={18}
            className={`relative z-10 transition-colors duration-200 ${
              active ? 'text-[#FF2A55]' : 'text-white/50 group-hover:text-white'
            }`}
          />
          <span className="relative z-10 tracking-wide text-sm">{item.label}</span>
          {active && (
            <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-[#FF2A55] shadow-[0_0_8px_#FF2A55]" />
          )}
        </NavLink>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#060205] text-white select-none">
      {/* Brand Header */}
      <NavLink
        to="/dashboard"
        onClick={handleNavClick}
        className="h-20 px-6 flex items-center gap-3 border-b border-white/[0.08] shrink-0 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2A55]"
      >
        <div className="w-10 h-10 rounded-xl bg-[#FF2A55]/15 border border-[#FF2A55]/35 flex items-center justify-center text-[#FF2A55] shadow-[0_0_15px_rgba(255,42,85,0.3)]">
          <Microscope size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-heading font-extrabold tracking-tight text-white leading-tight">
            JeevaDrishti
          </span>
          <span className="text-xs font-mono tracking-widest text-[#FF2A55] uppercase font-semibold">
            AURORA VISION LAB
          </span>
        </div>
      </NavLink>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-none">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.category} className="space-y-1.5">
            <div className="px-3 text-xs font-mono font-semibold tracking-wider text-white/50 uppercase">
              {section.category}
            </div>
            <div className="space-y-1">
              {section.items.map(renderNavItem)}
            </div>
          </div>
        ))}

        {/* Divider before Settings & Sign Out */}
        <div className="pt-2">
          <div className="border-t border-white/[0.08] mb-3" />
          <div className="space-y-1">
            {renderNavItem(SETTINGS_ITEM)}

            {/* Dedicated Logout / Sign Out Button */}
            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? {} : { x: 2 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={handleLogout}
              className="w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.08] border border-transparent hover:border-rose-500/20 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 cursor-pointer"
            >
              <LogOut
                size={18}
                className="relative z-10 text-rose-400/80 group-hover:text-rose-300 transition-colors duration-200"
              />
              <span className="relative z-10 tracking-wide font-medium text-sm">Sign Out / Logout</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="p-4 border-t border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2A55] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF2A55] shadow-[0_0_8px_#FF2A55]" />
          </span>
          <span className="text-xs font-mono font-medium tracking-wider text-white/90 uppercase truncate">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar({ mobileOpen, onMobileClose, statusText = 'SYSTEM ONLINE' }) {
  const shouldReduceMotion = useReducedMotion();

  // Close mobile drawer on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Desktop Fixed Aside */}
      <motion.aside
        initial={{ x: -25, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 border-r border-white/[0.08] z-30 flex-col pointer-events-auto bg-[#060205]"
      >
        <SidebarContent
          onMobileClose={onMobileClose}
          statusText={statusText}
          shouldReduceMotion={shouldReduceMotion}
          isMobile={false}
        />
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden pointer-events-auto"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-72 z-50 lg:hidden shadow-2xl pointer-events-auto bg-[#060205]"
            >
              <div className="relative h-full">
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="absolute top-4 right-4 z-50 p-2 text-white/50 hover:text-white"
                  aria-label="Close navigation menu"
                >
                  <X size={18} />
                </button>
                <SidebarContent
                  onMobileClose={onMobileClose}
                  statusText={statusText}
                  shouldReduceMotion={shouldReduceMotion}
                  isMobile={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
