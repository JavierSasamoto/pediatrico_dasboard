import { useState, type ReactNode } from 'react';
import {
  Stethoscope,
  LayoutDashboard,
  CalendarClock,
  QrCode,
  Wallet,
  Users,
  ClipboardList,
  FileText,
  Clock,
  Menu,
  LogOut,
  ChevronLeft,
  UserCog,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';

export type ViewKey =
  | 'dashboard'
  | 'turn-control'
  | 'payment-verification'
  | 'cash-register'
  | 'waiting-room'
  | 'clinical-history'
  | 'prescriptions'
  | 'executive-dashboard'
  | 'staff-management'
  | 'user-management';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Recepción / Caja',
    items: [
      { key: 'turn-control', label: 'Control de Turnos', icon: CalendarClock, roles: ['RECEPCIONISTA', 'ADMIN'] },
      { key: 'payment-verification', label: 'Verificación de Pagos', icon: QrCode, roles: ['RECEPCIONISTA', 'ADMIN'] },
      { key: 'cash-register', label: 'Caja / Efectivo', icon: Wallet, roles: ['RECEPCIONISTA', 'ADMIN'] },
    ],
  },
  {
    label: 'Médico / Pediatra',
    items: [
      { key: 'waiting-room', label: 'Sala de Espera', icon: Clock, roles: ['MEDICO', 'ADMIN'] },
      { key: 'clinical-history', label: 'Historia Clínica', icon: ClipboardList, roles: ['MEDICO', 'ADMIN'] },
      { key: 'prescriptions', label: 'Recetas Digitales', icon: FileText, roles: ['MEDICO', 'ADMIN'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { key: 'executive-dashboard', label: 'Panel Ejecutivo', icon: LayoutDashboard, roles: ['ADMIN'] },
      { key: 'staff-management', label: 'Personal y Horarios', icon: UserCog, roles: ['ADMIN'] },
      { key: 'user-management', label: 'Gestión de Usuarios', icon: Users, roles: ['ADMIN'] },
    ],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepción / Caja',
  MEDICO: 'Médico / Pediatra',
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-slate-700 text-white',
  RECEPCIONISTA: 'bg-sky-600 text-white',
  MEDICO: 'bg-teal-600 text-white',
};

interface DashboardLayoutProps {
  children: ReactNode;
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

export function DashboardLayout({ children, currentView, onNavigate }: DashboardLayoutProps) {
  const { profile, activeRole, setActiveRole, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(activeRole)),
  })).filter((group) => group.items.length > 0);

  function handleNav(view: ViewKey) {
    onNavigate(view);
    setMobileOpen(false);
  }

  const roleOptions: UserRole[] = ['RECEPCIONISTA', 'MEDICO', 'ADMIN'];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden lg:flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 shrink-0`}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-800 h-16">
          <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6 text-sky-400" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-white whitespace-nowrap">Clínica Pediátrica</h1>
              <p className="text-xs text-slate-400 whitespace-nowrap">Integral</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {sidebarOpen && (
                <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              <div className="space-y-1 px-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNav(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                        isActive
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-3 px-4 py-3 border-t border-slate-800 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
          {sidebarOpen && <span>Contraer</span>}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-300 flex flex-col animate-drawer-in">
            <div className="flex items-center gap-3 p-4 border-b border-slate-800 h-16">
              <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Clínica Pediátrica</h1>
                <p className="text-xs text-slate-400">Integral</p>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
              {visibleGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {group.label}
                  </p>
                  <div className="space-y-1 px-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNav(item.key)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                            isActive
                              ? 'bg-sky-600 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">
                {new Date().toLocaleDateString('es-DO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Demo Role Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeRole === role
                      ? ROLE_COLORS[role]
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {role === 'ADMIN' ? 'Admin' : role === 'RECEPCIONISTA' ? 'Recepción' : 'Médico'}
                </button>
              ))}
            </div>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">
                  {profile?.nombre_completo || 'Usuario'}
                </p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[activeRole]}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
