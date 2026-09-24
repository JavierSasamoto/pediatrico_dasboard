import { useState } from 'react';
import { Stethoscope, Lock, Mail, Users, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';

export function Login() {
  const { signIn, signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
    }
    setLoading(false);
  }

  function handleDemo(role: UserRole) {
    signInDemo(role);
  }

  const demoRoles: { role: UserRole; label: string; icon: typeof Users; color: string }[] = [
    { role: 'ADMIN', label: 'Administrador', icon: ShieldCheck, color: 'bg-slate-700 hover:bg-slate-800' },
    { role: 'RECEPCIONISTA', label: 'Recepción / Caja', icon: Users, color: 'bg-sky-600 hover:bg-sky-700' },
    { role: 'MEDICO', label: 'Médico / Pediatra', icon: Activity, color: 'bg-teal-600 hover:bg-teal-700' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
              <Stethoscope className="w-7 h-7 text-sky-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Clínica Pediátrica</h1>
              <p className="text-sm text-sky-300">Integral</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 my-auto py-12">
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
            Panel de Control<br />para gestión clínica
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            Gestión de citas, pagos, historias clínicas y recetas digitales.
            Optimizado para tabletas y escritorio.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="w-2 h-2 bg-sky-400 rounded-full" />
              Control de turnos
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="w-2 h-2 bg-teal-400 rounded-full" />
              Pagos QR
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              Recetas digitales
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-400">
          © 2026 Clínica Pediátrica Integral
        </div>
      </div>

      {/* Right panel - login */}
      <div className="lg:w-1/2 bg-slate-50 p-8 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Iniciar Sesión</h2>
            <p className="text-slate-500">Accede al panel de control de la clínica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white"
                  placeholder="admin@clinicapi.do"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors touch-target"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-slate-50 text-slate-500 font-medium">
                Acceso Demo Rápido
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <p className="text-xs text-slate-500 text-center">
              Selecciona un rol para explorar el panel instantáneamente
            </p>
            {demoRoles.map(({ role, label, icon: Icon, color }) => (
              <button
                key={role}
                onClick={() => handleDemo(role)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-white font-semibold transition-colors touch-target ${color}`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">Entrar como {label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
