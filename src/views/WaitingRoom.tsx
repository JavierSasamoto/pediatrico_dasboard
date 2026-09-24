import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Drawer } from '@/components/ui';
import { Stethoscope, Thermometer, Heart, Scale, Ruler, FileText, Save, Activity } from 'lucide-react';
import type { Cita, HistoriaClinica } from '@/lib/types';

export function WaitingRoom() {
  const { showToast } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [saving, setSaving] = useState(false);

  // Clinical history form state
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [tallaCm, setTallaCm] = useState('');
  const [temperaturaC, setTemperaturaC] = useState('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState('');
  const [observaciones, setObservaciones] = useState('');

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
      .in('estado', ['CONFIRMADA', 'PENDIENTE'])
      .order('hora', { ascending: true });

    if (error) {
      showToast('Error al cargar cola de pacientes', 'error');
      setLoading(false);
      return;
    }

    setCitas((data || []) as Cita[]);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  function openDrawer(cita: Cita) {
    setSelectedCita(cita);
    setMotivoConsulta(cita.motivo_consulta || '');
    setDiagnostico('');
    setPesoKg('');
    setTallaCm('');
    setTemperaturaC('');
    setFrecuenciaCardiaca('');
    setObservaciones('');
    setDrawerOpen(true);
  }

  async function attendPatient() {
    if (!selectedCita) return;

    setSaving(true);
    const { data: historiaData, error: histError } = await supabase
      .from('historias_clinicas')
      .insert({
        cita_id: selectedCita.id,
        paciente_id: selectedCita.paciente_id,
        medico_id: selectedCita.medico_id,
        motivo_consulta: motivoConsulta || null,
        diagnostico: diagnostico || null,
        peso_kg: pesoKg ? parseFloat(pesoKg) : null,
        talla_cm: tallaCm ? parseFloat(tallaCm) : null,
        temperatura_c: temperaturaC ? parseFloat(temperaturaC) : null,
        frecuencia_cardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca) : null,
        observaciones: observaciones || null,
      })
      .select()
      .single();

    if (histError) {
      showToast('Error al registrar consulta', 'error');
      setSaving(false);
      return;
    }

    // Update cita to COMPLETADA
    await supabase.from('citas').update({ estado: 'COMPLETADA' }).eq('id', selectedCita.id);

    showToast('Consulta Registrada', 'success');
    setSaving(false);
    setDrawerOpen(false);

    // Store the historia for potential prescription creation
    if (historiaData) {
      localStorage.setItem('lastHistoria', JSON.stringify(historiaData));
    }

    fetchCitas();
  }

  const queueLength = citas.length;
  const confirmedCount = citas.filter((c) => c.estado === 'CONFIRMADA').length;
  const pendingCount = citas.filter((c) => c.estado === 'PENDIENTE').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Sala de Espera</h1>
        <p className="text-slate-500 mt-1">Cola de pacientes del día lista para atención</p>
      </div>

      {/* Queue stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-3xl font-bold text-sky-600">{queueLength}</p>
          <p className="text-sm text-slate-500">En espera</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-3xl font-bold text-teal-600">{confirmedCount}</p>
          <p className="text-sm text-slate-500">Confirmadas</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-3xl font-bold text-amber-500">{pendingCount}</p>
          <p className="text-sm text-slate-500">Pendientes</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : citas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No hay pacientes en sala de espera</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {citas.map((cita, index) => (
            <div
              key={cita.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-sky-100 rounded-xl shrink-0">
                    <span className="text-xs font-semibold text-sky-600">#{index + 1}</span>
                    <span className="text-sm font-bold text-sky-700">{cita.hora?.slice(0, 5)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-lg">
                        {cita.paciente?.nombre} {cita.paciente?.apellido}
                      </h3>
                      <Badge variant={cita.estado === 'CONFIRMADA' ? 'confirmada' : 'pendiente'}>
                        {cita.estado}
                      </Badge>
                    </div>
                    <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                      <p>Dr. {cita.medico?.nombre} {cita.medico?.apellido} · {cita.medico?.especialidad}</p>
                      <p className="text-xs">{cita.motivo_consulta}</p>
                      {cita.paciente?.notas && (
                        <p className="text-xs text-amber-600 font-medium">Nota: {cita.paciente.notas}</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openDrawer(cita)}
                  className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors touch-target whitespace-nowrap"
                >
                  <Stethoscope className="w-5 h-5" />
                  Atender Paciente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clinical History Express Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Historia Clínica Express"
        width="w-full max-w-lg"
      >
        {selectedCita && (
          <div className="space-y-5">
            {/* Patient info header */}
            <div className="bg-slate-800 text-white rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {selectedCita.paciente?.nombre} {selectedCita.paciente?.apellido}
                  </p>
                  <p className="text-sm text-slate-300">
                    Dr. {selectedCita.medico?.nombre} {selectedCita.medico?.apellido} · {selectedCita.hora?.slice(0, 5)}
                  </p>
                </div>
              </div>
            </div>

            {/* Motivo de consulta */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Motivo de Consulta</label>
              <textarea
                value={motivoConsulta}
                onChange={(e) => setMotivoConsulta(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white text-sm resize-none"
                placeholder="Describe el motivo de la consulta..."
              />
            </div>

            {/* Vital Signs */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                Signos Vitales
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Scale className="w-3.5 h-3.5" /> Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
                    placeholder="12.50"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Ruler className="w-3.5 h-3.5" /> Talla (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tallaCm}
                    onChange={(e) => setTallaCm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
                    placeholder="85.0"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Thermometer className="w-3.5 h-3.5" /> Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperaturaC}
                    onChange={(e) => setTemperaturaC(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
                    placeholder="36.5"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Heart className="w-3.5 h-3.5" /> FC (bpm)
                  </label>
                  <input
                    type="number"
                    value={frecuenciaCardiaca}
                    onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
                    placeholder="110"
                  />
                </div>
              </div>
            </div>

            {/* Diagnóstico */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Diagnóstico</label>
              <textarea
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white text-sm resize-none"
                placeholder="Diagnóstico clínico..."
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white text-sm resize-none"
                placeholder="Observaciones adicionales..."
              />
            </div>

            <button
              onClick={attendPatient}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors touch-target"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar Consulta'}
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
