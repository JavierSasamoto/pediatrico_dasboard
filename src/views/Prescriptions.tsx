import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Modal } from '@/components/ui';
import { FileText, Plus, Printer, Send, Check } from 'lucide-react';
import type { Receta, HistoriaClinica } from '@/lib/types';

export function Prescriptions() {
  const { showToast } = useToast();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [printReceta, setPrintReceta] = useState<Receta | null>(null);
  const [saving, setSaving] = useState(false);

  // New prescription form
  const [selectedHistoria, setSelectedHistoria] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [medicamentos, setMedicamentos] = useState('');

  const fetchRecetas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recetas')
      .select(`
        *,
        paciente:pacientes(*),
        medico:medicos(*),
        historia_clinica:historias_clinicas(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }
    setRecetas((data || []) as Receta[]);
    setLoading(false);
  }, []);

  const fetchHistorias = useCallback(async () => {
    const { data } = await supabase
      .from('historias_clinicas')
      .select(`
        *,
        paciente:pacientes(*),
        medico:medicos(*)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setHistorias((data as HistoriaClinica[]));
  }, []);

  useEffect(() => {
    fetchRecetas();
    fetchHistorias();
  }, [fetchRecetas, fetchHistorias]);

  async function createReceta() {
    if (!selectedHistoria || !indicaciones) {
      showToast('Selecciona una historia y escribe las indicaciones', 'error');
      return;
    }

    setSaving(true);
    const historia = historias.find((h) => h.id === selectedHistoria);

    const { error } = await supabase.from('recetas').insert({
      historia_clinica_id: selectedHistoria,
      paciente_id: historia?.paciente_id || null,
      medico_id: historia?.medico_id || null,
      indicaciones_tratamiento: indicaciones,
      medicamentos: medicamentos || null,
    });

    if (error) {
      showToast('Error al crear receta', 'error');
      setSaving(false);
      return;
    }

    showToast('Receta creada exitosamente', 'success');
    setShowModal(false);
    setSelectedHistoria('');
    setIndicaciones('');
    setMedicamentos('');
    setSaving(false);
    fetchRecetas();
  }

  async function sendWhatsApp(receta: Receta) {
    const { error } = await supabase
      .from('recetas')
      .update({ enviada_whatsapp: true })
      .eq('id', receta.id);

    if (error) {
      showToast('Error al enviar', 'error');
      return;
    }

    showToast('Receta enviada por WhatsApp', 'success');
    fetchRecetas();
  }

  function handlePrint(receta: Receta) {
    setPrintReceta(receta);
    setTimeout(() => {
      window.print();
    }, 300);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recetas Digitales</h1>
          <p className="text-slate-500 mt-1">Prescripciones médicas con envío por WhatsApp y vista de impresión</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors touch-target"
        >
          <Plus className="w-5 h-5" />
          Nueva Receta
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : recetas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center no-print">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No hay recetas registradas</p>
        </div>
      ) : (
        <div className="grid gap-3 no-print">
          {recetas.map((receta) => (
            <div
              key={receta.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800">
                      {receta.paciente ? `${receta.paciente.nombre} ${receta.paciente.apellido}` : 'Paciente N/A'}
                    </h3>
                    {receta.enviada_whatsapp ? (
                      <Badge variant="success">
                        <Check className="w-3 h-3" /> Enviada
                      </Badge>
                    ) : (
                      <Badge variant="pendiente">Pendiente envío</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Dr. {receta.medico?.nombre} {receta.medico?.apellido} ·{' '}
                    {new Date(receta.created_at).toLocaleDateString('es-DO')}
                  </p>
                  <div className="mt-2 bg-slate-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-slate-700">Indicaciones:</p>
                    <p className="text-sm text-slate-600 mt-1">{receta.indicaciones_tratamiento}</p>
                    {receta.medicamentos && (
                      <>
                        <p className="text-sm font-semibold text-slate-700 mt-2">Medicamentos:</p>
                        <p className="text-sm text-slate-600">{receta.medicamentos}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handlePrint(receta)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors touch-target"
                  >
                    <Printer className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => sendWhatsApp(receta)}
                    disabled={receta.enviada_whatsapp}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors touch-target"
                  >
                    <Send className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New prescription modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Receta Digital"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Historia Clínica (Paciente)
            </label>
            <select
              value={selectedHistoria}
              onChange={(e) => setSelectedHistoria(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white text-sm"
            >
              <option value="">Seleccionar historia clínica...</option>
              {historias.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.paciente?.nombre} {h.paciente?.apellido} - {h.diagnostico || h.motivo_consulta} ({new Date(h.created_at).toLocaleDateString('es-DO')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Medicamentos
            </label>
            <input
              type="text"
              value={medicamentos}
              onChange={(e) => setMedicamentos(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white text-sm"
              placeholder="Ej: Paracetamol 120mg/5ml, Amoxicilina 250mg..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Indicaciones de Tratamiento
            </label>
            <textarea
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white text-sm resize-none"
              placeholder="Instrucciones detalladas del tratamiento..."
            />
          </div>

          <button
            onClick={createReceta}
            disabled={saving}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors touch-target"
          >
            {saving ? 'Guardando...' : 'Crear Receta'}
          </button>
        </div>
      </Modal>

      {/* Print view */}
      {printReceta && (
        <div className="hidden print:block fixed inset-0 bg-white z-[200] p-12">
          <div className="max-w-2xl mx-auto">
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Clínica Pediátrica Integral</h1>
              <p className="text-slate-500">Receta Médica</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">Paciente: {printReceta.paciente?.nombre} {printReceta.paciente?.apellido}</p>
                  <p className="text-sm text-slate-600">Fecha: {new Date(printReceta.created_at).toLocaleDateString('es-DO')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Dr. {printReceta.medico?.nombre} {printReceta.medico?.apellido}</p>
                  <p className="text-sm text-slate-600">Lic. {printReceta.medico?.licencia_medica}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="font-semibold mb-1">Medicamentos:</p>
                <p className="text-sm">{printReceta.medicamentos || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Indicaciones:</p>
                <p className="text-sm">{printReceta.indicaciones_tratamiento}</p>
              </div>
              <div className="border-t border-slate-200 pt-8 mt-12">
                <p className="text-center text-sm text-slate-500">Firma del Médico</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
