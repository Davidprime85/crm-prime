import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, LayoutDashboard, FileText, Settings, Calculator, Bell, Menu, X } from 'lucide-react';
import { User, Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchNotifs = async () => {
      const notifs = await notificationService.getNotifications(user.id);
      setNotifications(notifs);
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Helper seguro para pegar nome e inicial
  const displayName = user.name || user.email || 'Usuário';
  const displayInitial = (displayName).charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-bold text-amber-500">PRIME</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          {/* Logo Area com Fallback */}
          <div className="flex flex-col items-start gap-2">
            <div className="w-full flex justify-center md:justify-start">
              <img
                src="/logo-prime-horizontal.png"
                alt="Prime Correspondente"
                className="w-44 h-auto object-contain bg-white rounded-lg px-3 py-2 shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById('logo-fallback-sidebar');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div id="logo-fallback-sidebar" style={{ display: 'none' }}>
                <h1 className="text-3xl font-bold text-amber-500 tracking-tighter leading-none">GRUPO<br /><span className="text-white">PRIME</span></h1>
              </div>
            </div>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs uppercase text-slate-500 font-semibold">Menu Principal</div>

          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-slate-800/50 text-amber-500 border border-slate-700/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/?tab=processes')}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <FileText size={20} />
            <span className="font-medium">Processos</span>
          </button>

          <a
            href="https://www8.caixa.gov.br/siopiinternet-web/simulaOperacaoInternet.do?method=inicializarCasoUso"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <Calculator size={20} />
            <span className="font-medium">Simulador Caixa</span>
          </a>

          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/settings' ? 'bg-slate-800/50 text-amber-500 border border-slate-700/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings size={20} />
              <span className="font-medium">Configurações</span>
            </button>
          )}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold shadow-lg shadow-amber-500/20">
              {displayInitial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role === 'attendant' ? 'Atendente' : user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-2 text-sm text-red-400 hover:bg-red-950/30 rounded transition-colors"
          >
            <LogOut size={16} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Header & Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center z-30">
          <h2 className="text-xl font-semibold text-slate-800">
            {user.role === 'client' ? 'Área do Cliente' : user.role === 'attendant' ? 'Painel do Atendente' : 'Painel Administrativo'}
          </h2>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-50 bg-slate-50">
                  <h4 className="text-sm font-bold text-slate-700">Notificações</h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Nenhuma notificação.</div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkRead(notif.id)}
                        className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-bold ${notif.type === 'error' ? 'text-red-600' : 'text-slate-700'}`}>{notif.title}</span>
                          <span className="text-[10px] text-slate-400">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};