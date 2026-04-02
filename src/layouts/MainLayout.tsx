import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, PlusCircle, MessageCircle, User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export function MainLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50">
        <NavItem to="/" icon={<Home size={24} />} label="Feed" />
        <NavItem to="/chats" icon={<MessageCircle size={24} />} label="Chats" />
        <NavItem to="/create" icon={<PlusCircle size={32} className="text-indigo-600" />} label="Post" isMain />
        <NavItem to="/ai" icon={<Sparkles size={24} />} label="AI" />
        <NavItem to="/profile" icon={<User size={24} />} label="Profile" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, isMain = false }: { to: string; icon: React.ReactNode; label: string; isMain?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
          isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600",
          isMain && "-mt-6"
        )
      }
    >
      <div className={cn(isMain && "bg-white p-2 rounded-full shadow-lg border border-gray-100")}>
        {icon}
      </div>
      {!isMain && <span className="text-[10px] font-medium">{label}</span>}
    </NavLink>
  );
}
