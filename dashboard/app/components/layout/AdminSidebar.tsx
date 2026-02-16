import { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import { Icon } from '@iconify/react';

interface NavItem {
  label: string;
  icon: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'solar:widget-linear', to: '/' },
  { label: 'User Management', icon: 'solar:users-group-rounded-linear', to: '/users' },
  { label: 'Project Management', icon: 'solar:folder-linear', to: '/projects' },
  { label: 'System Configuration', icon: 'solar:settings-linear', to: '/settings' },
];

const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  return (
    <aside
      className={`bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0 h-screen fixed left-0 top-0 z-50 overflow-hidden transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-[64px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div
        className={`h-[64px] flex items-center transition-all duration-300 ${
          collapsed ? 'justify-center px-0' : 'px-6'
        }`}
      >
        <div className={`flex items-center transition-all duration-300 ${collapsed ? 'gap-0' : 'gap-2'}`}>
          <div className="w-6 h-6 bg-[#4A90D9] rounded-md flex items-center justify-center text-white font-bold text-xs tracking-tighter flex-shrink-0">
            TB
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-[#1E293B] whitespace-nowrap">
              TaskBoard
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `h-[48px] flex items-center border-l-[3px] transition-colors duration-200 ${
                collapsed
                  ? 'justify-center pl-0 gap-0'
                  : `gap-3 ${isActive ? 'pl-[13px]' : 'pl-4'}`
              } ${
                isActive
                  ? 'bg-[#4A90D9]/10 border-[#4A90D9] text-[#4A90D9]'
                  : 'border-transparent text-[#64748B] hover:bg-gray-50 group'
              }`
            }
          >
            <Icon
              icon={item.icon}
              width={20}
              height={20}
              className="flex-shrink-0 group-hover:text-[#1E293B] transition-colors"
            />
            {!collapsed && (
              <span className="text-sm font-medium group-hover:text-[#1E293B] transition-colors whitespace-nowrap">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-[#E5E7EB]">
        <button
          onClick={onToggle}
          className={`flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors w-full ${
            collapsed ? 'justify-center gap-0' : 'gap-3'
          }`}
        >
          <Icon
            icon="solar:double-alt-arrow-left-linear"
            width={20}
            height={20}
            className={`transition-transform duration-300 flex-shrink-0 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
          {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export { SIDEBAR_STORAGE_KEY };
