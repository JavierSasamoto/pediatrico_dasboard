import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Login } from '@/components/Login';
import { DashboardLayout, type ViewKey } from '@/components/DashboardLayout';
import { TurnControl } from '@/views/TurnControl';
import { PaymentVerification } from '@/views/PaymentVerification';
import { CashRegister } from '@/views/CashRegister';
import { WaitingRoom } from '@/views/WaitingRoom';
import { ClinicalHistory } from '@/views/ClinicalHistory';
import { Prescriptions } from '@/views/Prescriptions';
import { ExecutiveDashboard } from '@/views/ExecutiveDashboard';
import { StaffManagement } from '@/views/StaffManagement';
import { UserManagement } from '@/views/UserManagement';

function Dashboard() {
  const { activeRole } = useAuth();
  const [view, setView] = useState<ViewKey>('turn-control');

  // Set default view based on role
  useEffect(() => {
    if (activeRole === 'ADMIN') setView('executive-dashboard');
    else if (activeRole === 'MEDICO') setView('waiting-room');
    else setView('turn-control');
  }, [activeRole]);

  function renderView() {
    switch (view) {
      case 'turn-control': return <TurnControl />;
      case 'payment-verification': return <PaymentVerification />;
      case 'cash-register': return <CashRegister />;
      case 'waiting-room': return <WaitingRoom />;
      case 'clinical-history': return <ClinicalHistory />;
      case 'prescriptions': return <Prescriptions />;
      case 'executive-dashboard': return <ExecutiveDashboard />;
      case 'staff-management': return <StaffManagement />;
      case 'user-management': return <UserManagement />;
      default: return <TurnControl />;
    }
  }

  return (
    <DashboardLayout currentView={view} onNavigate={setView}>
      {renderView()}
    </DashboardLayout>
  );
}

function AppContent() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (!profile) return <Login />;
  return <Dashboard />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
