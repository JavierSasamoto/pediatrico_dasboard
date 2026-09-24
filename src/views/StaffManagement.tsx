import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Modal } from '@/components/ui';
import { Plus, Pencil, Trash2, Clock, UserCog, Stethoscope } from 'lucide-react';
import type { Medico, HorarioMedico } from '@/lib/types';

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const;
type Dia = typeof DIAS[number];

export function StaffManagement() {
  const { showToast } = useToast();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [horarios, setHorarios] = useState<HorarioMedico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMedicoModal, setShowMedicoModal] = useState(false);
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null);
  const [showHorariosModal, setShowHorariosModal] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);

  // Medico form
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [especialidad, setEspecialidad] = useState('Pediatría General');
  const [licencia, setLicencia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [activo, setActivo] = useState(true);

  // Horario form
  const [diaSemana, setDiaSemana] = useState<Dia>('LUNES');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('17:00');

  const fetchMedicos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('medicos').select('*').order('nombre', { ascending: true });
    if (error) {
      showToast('Error al cargar médicos', 'error');
      setLoading(false);
      return;
    }
    setMedicos((data || []) as Medico[]);
    setLoading(false);
  }, [showToast]);

  const fetchHorarios = useCallback(async () => {
    const { data } = await supabase.from('horarios_medicos').select('*');
    if (data) setHorarios(data as HorarioMedico[]);
  }, []);

  useEffect(() => {
    fetchMedicos();
    fetchHorarios();
  }, [fetchMedicos, fetchHorarios]);

  function openNewMedico() {
    setEditingMedico(null);
    setNombre('');
    setApellido('');
    setEspecialidad('Pediatría General');
    setLicencia('');
    setTelefono('');
    setEmail('');
    setActivo(true);
    setShowMedicoModal(true);
  }

  function openEditMedico(m: Medico) {
    setEditingMedico(m);
    setNombre(m.nombre);
    setApellido(m.apellido);
    setEspecialidad(m.especialidad);
    setLicencia(m.licencia_medica || '');
    setTelefono(m.telefono || '');
    setEmail(m.email || '');
    setActivo(m.activo);
    setShowMedicoModal(true);
  }

  async function saveMedico() {
    if (!nombre || !apellido) {
      showToast('Nombre y apellido son obligatorios', 'error');
      return;
    }

    const payload = {
      nombre,
      apellido,
      especialidad,
      licencia_medica: licencia || null,
      telefono: telefono || null,
      email: email || null,
      activo,
    };

    if (editingMedico) {
      const { error } = await supabase.from('medicos').update(payload).eq('id', editingMedico.id);
      if (error) { showToast('Error al actualizar médico', 'error'); return; }
      showToast('Médico actualizado', 'success');
    } else {
      const { error } = await supabase.from('medicos').insert(payload);
      if (error) { showToast('Error al crear médico', 'error'); return; }
      showToast('Médico creado', 'success');
    }

    setShowMedicoModal(false);
    fetchMedicos();
  }

  async function deleteMedico(id: string) {
    if (!confirm('¿Eliminar este médico? Se eliminarán también sus horarios.')) return;
    const { error } = await supabase.from('medicos').delete().eq('id', id);
    if (error) { showToast('Error al eliminar médico', 'error'); return; }
    showToast('Médico eliminado', 'success');
    fetchMedicos();
    fetchHorarios();
  }

  function openHorarios(m: Medico) {
    setSelectedMedico(m);
    setShowHorariosModal(true);
  }

  async function addHorario() {
    if (!selectedMedico) return;
    const { error } = await supabase.from('horarios_medicos').insert({
      medico_id: selectedMedico.id,
      dia_semana: diaSemana,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      activo: true,
    });
    if (error) { showToast('Error al agregar horario', 'error'); return; }
    showToast('Horario agregado', 'success');
    fetchHorarios();
  }

  async function deleteHorario(id: string) {
    const { error } = await supabase.from('horarios_medicos').delete().eq('id', id);
    if (error) { showToast('Error al eliminar horario', 'error'); return; }
    showToast('Horario eliminado', 'success');
    fetchHorarios();
  }

  const medicoHorarios = horarios.filter((h) => h.medico_id === selectedMedico?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Personal y Horarios</h1>
          <p className="text-slate-500 mt-1">Gestión de médicos y disponibilidad semanal</p>
        </div>
        <button
          onClick={openNewMedico}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors touch-target"
        >
          <Plus className="w-5 h-5" />
          Nuevo Médico
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : medicos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No hay médicos registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Especialidad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Licencia</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-slate-700">{m.nombre} {m.apellido}</p>
                    <p className="text-xs text-slate-400">{m.telefono || 'Sin teléfono'}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-slate-600">{m.especialidad}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-sm font-mono text-slate-500">{m.licencia_medica || 'N/A'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Badge variant={m.activo ? 'success' : 'cancelada'}>
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openHorarios(m)}
                        className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Horarios"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditMedico(m)}
                        className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMedico(m.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Medico Modal */}
      <Modal
        open={showMedicoModal}
        onClose={() => setShowMedicoModal(false)}
        title={editingMedico ? 'Editar Médico' : 'Nuevo Médico'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Apellido</label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Especialidad</label>
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Licencia Médica</label>
              <input
                type="text"
                value={licencia}
                onChange={(e) => setLicencia(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-5 h-5 rounded text-sky-600 focus:ring-sky-200"
            />
            <span className="text-sm font-semibold text-slate-700">Activo</span>
          </label>
          <button
            onClick={saveMedico}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors touch-target"
          >
            {editingMedico ? 'Guardar Cambios' : 'Crear Médico'}
          </button>
        </div>
      </Modal>

      {/* Horarios Modal */}
      <Modal
        open={showHorariosModal}
        onClose={() => setShowHorariosModal(false)}
        title={`Horarios - Dr. ${selectedMedico?.nombre} ${selectedMedico?.apellido}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          {/* Add horario form */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              Agregar Disponibilidad
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Día</label>
                <select
                  value={diaSemana}
                  onChange={(e) => setDiaSemana(e.target.value as Dia)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-sky-500"
                >
                  {DIAS.map((d) => (
                    <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Desde</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Hasta</label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <button
              onClick={addHorario}
              className="w-full py-2.5 bg-sky-600 text-white rounded-lg font-semibold text-sm hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {/* Existing horarios */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Horarios Configurados</p>
            {medicoHorarios.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No hay horarios configurados</p>
            ) : (
              medicoHorarios.map((h) => (
                <div key={h.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {h.dia_semana.charAt(0) + h.dia_semana.slice(1).toLowerCase()}
                      </p>
                      <p className="text-xs text-slate-500">{h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHorario(h.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
