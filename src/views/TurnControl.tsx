import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Modal } from '@/components/ui';
import type { Cita, Paciente, Medico, CitaEstado } from '@/lib/types';

export function TurnControl() {
  const { showToast } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CitaEstado | 'ALL'>('ALL');

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('citas')
      .select(`
        *,
        paciente:pacientes(*),
        medico:medicos(*)
      `)
      .eq('fecha', today)
      .order('hora', { ascending: true });

    if (error) {
      showToast('Error al cargar citas', 'error');
      setLoading(false);
      return;
    }

    setCitas((data || []) as Cita[]);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  async function updateEstado(citaId: string, estado: CitaEstado) {
    const { error } = await supabase.from('citas').update({ estado }).eq('id', citaId);
    if (error) {
      showToast('Error al actualizar cita', 'error');
      return;
    }
    showToast(`Cita ${estado.toLowerCase()}`, 'success');
    fetchCitas();
  }

  const filteredCitas = filter === 'ALL' ? citas : citas.filter((c) => c.estado === filter);

  const estadoVariants: Record<CitaEstado, 'pendiente' | 'confirmada' | 'completada' | 'cancelada'> = {
    PENDIENTE: 'pendiente',
    CONFIRMADA: 'confirmada',
    COMPLETADA: 'completada',
    CANCELADA: 'cancelada',
  };

  const filters: { key: CitaEstado | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'Todas' },
    { key: 'PENDIENTE', label: 'Pendientes' },
    { key: 'CONFIRMADA', label: 'Confirmadas' },
    { key: 'COMPLETADA', label: 'Completadas' },
    { key: 'CANCELADA', label: 'Canceladas' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Control de Turnos del Día</h1>
        <p className="text-slate-500 mt-1">Citas programadas para hoy con información de pacientes y médicos</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-target ${
              filter === f.key
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {f.label}
            {f.key !== 'ALL' && (
              <span className="ml-2 text-xs opacity-75">
                {citas.filter((c) => c.estado === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : filteredCitas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-lg">No hay citas para mostrar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredCitas.map((cita) => (
            <div
              key={cita.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-100 rounded-xl shrink-0">
                    <span className="text-lg font-bold text-slate-700">
                      {cita.hora?.slice(0, 5)}
                    </span>
                    <span className="text-xs text-slate-400">hrs</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-lg">
                        {cita.paciente?.nombre} {cita.paciente?.apellido}
                      </h3>
                      <Badge variant={estadoVariants[cita.estado]}>{cita.estado}</Badge>
                    </div>
                    <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                      <p>
                        Tutor: {cita.paciente?.nombre_tutor || 'N/A'} ·{' '}
                        {cita.paciente?.telefono_tutor || 'Sin teléfono'}
                      </p>
                      <p>
                        Dr. {cita.medico?.nombre} {cita.medico?.apellido} ·{' '}
                        {cita.medico?.especialidad}
                      </p>
                      <p className="text-xs text-slate-400">
                        {cita.motivo_consulta} · Tarifa: {cita.tipo_tarifa === 'REGULAR' ? 'Regular' : 'Beneficia Solidaria'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {cita.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => updateEstado(cita.id, 'CONFIRMADA')}
                      className="px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors touch-target"
                    >
                      Confirmar
                    </button>
                  )}
                  {cita.estado === 'CONFIRMADA' && (
                    <button
                      onClick={() => updateEstado(cita.id, 'COMPLETADA')}
                      className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors touch-target"
                    >
                      Completar
                    </button>
                  )}
                  {(cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && (
                    <button
                      onClick={() => updateEstado(cita.id, 'CANCELADA')}
                      className="px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors touch-target"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
