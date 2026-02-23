import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  FileText, 
  LogOut,
  Wallet,
  User as UserIcon
} from 'lucide-react';
import { cn } from './ui';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Siswa', path: '/students' },
  { icon: ArrowLeftRight, label: 'Transaksi', path: '/transactions' },
  { icon: FileText, label: 'Laporan', path: '/reports' },
  { icon: UserIcon, label: 'Profil Saya', path: '/profile' },
];

import { User } from '../types';

export const Sidebar = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === 'student') {
      return item.path === '/' || item.path === '/profile' || item.path === '/transactions'; 
    }
    return true; // Admins see everything
  });

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-emerald-600 p-2 rounded-lg">
          <Wallet className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tabungan<span className="text-emerald-600">Siswa</span></h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-emerald-50 text-emerald-700 font-medium" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              "group-hover:text-emerald-600"
            )} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="mb-4 px-4 py-3 bg-slate-50 rounded-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">User</p>
          <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
          <p className="text-[10px] text-emerald-600 font-bold uppercase">{user?.role}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
