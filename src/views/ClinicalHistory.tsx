import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge, Modal } from '@/components/ui';
import { ClipboardList, Search, Scale, Ruler, Thermometer, Heart, Calendar } from 'lucide-react';
import type { HistoriaClinica } from '@/lib/types';

export function ClinicalHistory() {
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HistoriaClinica | null>(null);

  const fetchHistorias = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('historias_clinicas')
      .select(`
        *,
        paciente:pacientes(*),
        medico:medicos(*),
        cita:citas(*)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setLoading(false);
      return;
    }

    setHistorias((data || []) as HistoriaClinica[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistorias();
  }, [fetchHistorias]);

  const filtered = historias.filter((h) => {
    const name = `${h.paciente?.nombre || ''} ${h.paciente?.apellido || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (h.diagnostico || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Historias Clínicas</h1>
        <p className="text-slate-500 mt-1">Registro de consultas y signos vitales de pacientes</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por paciente o diagnóstico..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No hay historias clínicas registradas</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelected(h)}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800">
                      {h.paciente?.nombre} {h.paciente?.apellido}
                    </h3>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(h.created_at).toLocaleDateString('es-DO')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                    {h.diagnostico || h.motivo_consulta || 'Sin diagnóstico'}
                  </p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {h.peso_kg && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Scale className="w-3 h-3" /> {h.peso_kg}kg
                      </span>
                    )}
                    {h.talla_cm && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Ruler className="w-3 h-3" /> {h.talla_cm}cm
                      </span>
                    )}
                    {h.temperatura_c && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Thermometer className="w-3 h-3" /> {h.temperatura_c}°C
                      </span>
                    )}
                    {h.frecuencia_cardiaca && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Heart className="w-3 h-3" /> {h.frecuencia_cardiaca}bpm
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="info">{h.medico?.nombre ? `Dr. ${h.medico.nombre}` : 'N/A'}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Detalle de Historia Clínica"
        maxWidth="max-w-2xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-slate-800 text-white rounded-xl p-4">
              <p className="font-bold text-lg">
                {selected.paciente?.nombre} {selected.paciente?.apellido}
              </p>
              <p className="text-sm text-slate-300">
                Dr. {selected.medico?.nombre} {selected.medico?.apellido} ·{' '}
                {new Date(selected.created_at).toLocaleString('es-DO')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-sky-50 rounded-xl p-3 text-center">
                <Scale className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Peso</p>
                <p className="font-bold text-slate-700">{selected.peso_kg ? `${selected.peso_kg} kg` : 'N/A'}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 text-center">
                <Ruler className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Talla</p>
                <p className="font-bold text-slate-700">{selected.talla_cm ? `${selected.talla_cm} cm` : 'N/A'}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <Thermometer className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Temperatura</p>
                <p className="font-bold text-slate-700">{selected.temperatura_c ? `${selected.temperatura_c} °C` : 'N/A'}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <Heart className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Frec. Cardíaca</p>
                <p className="font-bold text-slate-700">{selected.frecuencia_cardiaca ? `${selected.frecuencia_cardiaca} bpm` : 'N/A'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Motivo de Consulta</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
                {selected.motivo_consulta || 'No registrado'}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Diagnóstico</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
                {selected.diagnostico || 'No registrado'}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Observaciones</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
                {selected.observaciones || 'Sin observaciones'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
