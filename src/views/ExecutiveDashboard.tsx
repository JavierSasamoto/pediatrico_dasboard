import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, CheckCircle, QrCode, TrendingUp, Activity, Users, Stethoscope } from 'lucide-react';
import type { Pago, Cita } from '@/lib/types';

interface KPIData {
  totalRevenue: number;
  completedConsultations: number;
  pendingQR: number;
  solidariaRatio: number;
  totalPacientes: number;
  totalMedicos: number;
  todayCitas: number;
}

export function ExecutiveDashboard() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [recentPagos, setRecentPagos] = useState<Pago[]>([]);
  const [todayCitas, setTodayCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [pagosRes, citasRes, pacientesRes, medicosRes] = await Promise.all([
      supabase.from('pagos').select('*, paciente:pacientes(*)').order('created_at', { ascending: false }).limit(10),
      supabase.from('citas').select('*, paciente:pacientes(*), medico:medicos(*)').eq('fecha', today).order('hora', { ascending: true }),
      supabase.from('pacientes').select('id', { count: 'exact', head: true }),
      supabase.from('medicos').select('id', { count: 'exact', head: true }),
    ]);

    const pagos = (pagosRes.data || []) as Pago[];
    const citas = (citasRes.data || []) as Cita[];

    const totalRevenue = pagos.filter((p) => p.estado === 'VERIFICADO').reduce((sum, p) => sum + p.monto, 0);
    const completedConsultations = citas.filter((c) => c.estado === 'COMPLETADA').length;
    const pendingQR = pagos.filter((p) => p.estado === 'PENDIENTE' && p.metodo_pago === 'QR').length;
    const solidariaCount = citas.filter((c) => c.tipo_tarifa === 'BENEFICA_SOLIDARIA').length;
    const solidariaRatio = citas.length > 0 ? (solidariaCount / citas.length) * 100 : 0;

    setKpi({
      totalRevenue,
      completedConsultations,
      pendingQR,
      solidariaRatio,
      totalPacientes: pacientesRes.count || 0,
      totalMedicos: medicosRes.count || 0,
      todayCitas: citas.length,
    });
    setRecentPagos(pagos);
    setTodayCitas(citas);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  }

  if (loading || !kpi) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel Ejecutivo</h1>
          <p className="text-slate-500 mt-1">Indicadores clave de la clínica</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Ingresos Verificados Hoy',
      value: formatCurrency(kpi.totalRevenue),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Consultas Completadas',
      value: kpi.completedConsultations.toString(),
      icon: CheckCircle,
      gradient: 'from-sky-500 to-sky-600',
    },
    {
      label: 'Pagos QR Pendientes',
      value: kpi.pendingQR.toString(),
      icon: QrCode,
      gradient: 'from-amber-400 to-amber-500',
    },
    {
      label: 'Ratio Tarifa Solidaria',
      value: `${kpi.solidariaRatio.toFixed(0)}%`,
      icon: TrendingUp,
      gradient: 'from-teal-500 to-teal-600',
    },
  ];

  const secondaryCards = [
    { label: 'Pacientes Registrados', value: kpi.totalPacientes, icon: Users, color: 'text-sky-600' },
    { label: 'Médicos Activos', value: kpi.totalMedicos, icon: Stethoscope, color: 'text-teal-600' },
    { label: 'Citas de Hoy', value: kpi.todayCitas, icon: Activity, color: 'text-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel Ejecutivo</h1>
        <p className="text-slate-500 mt-1">Indicadores clave de rendimiento de la clínica</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`bg-gradient-to-br ${card.gradient} text-white rounded-2xl p-5 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-white/80 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {secondaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                  <p className="text-sm text-slate-500">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's appointments + recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4">Citas de Hoy</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {todayCitas.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No hay citas hoy</p>
            ) : (
              todayCitas.map((cita) => (
                <div key={cita.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-mono font-semibold text-slate-600 w-12">
                    {cita.hora?.slice(0, 5)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {cita.paciente?.nombre} {cita.paciente?.apellido}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      Dr. {cita.medico?.nombre} {cita.medico?.apellido}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    cita.estado === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700' :
                    cita.estado === 'CONFIRMADA' ? 'bg-sky-100 text-sky-700' :
                    cita.estado === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {cita.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4">Pagos Recientes</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {recentPagos.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No hay pagos recientes</p>
            ) : (
              recentPagos.map((pago) => (
                <div key={pago.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {pago.paciente ? `${pago.paciente.nombre} ${pago.paciente.apellido}` : 'Sin paciente'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {pago.metodo_pago} · {pago.tipo_tarifa === 'REGULAR' ? 'Regular' : 'Solidaria'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{formatCurrency(pago.monto)}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    pago.estado === 'VERIFICADO' ? 'bg-emerald-100 text-emerald-700' :
                    pago.estado === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {pago.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
