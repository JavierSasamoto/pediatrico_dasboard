import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Modal } from '@/components/ui';
import { Wallet, Plus, Check, Banknote } from 'lucide-react';
import type { Pago, Cita, Paciente, TipoTarifa } from '@/lib/types';

export function CashRegister() {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<string>('');
  const [tarifa, setTarifa] = useState<TipoTarifa>('REGULAR');
  const [monto, setMonto] = useState('1500');
  const [saving, setSaving] = useState(false);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        *,
        paciente:pacientes(*),
        cita:citas(*)
      `)
      .eq('metodo_pago', 'EFECTIVO')
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Error al cargar pagos en efectivo', 'error');
      setLoading(false);
      return;
    }

    setPagos((data || []) as Pago[]);
    setLoading(false);
  }, [showToast]);

  const fetchCitas = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('citas')
      .select(`
        *,
        paciente:pacientes(*),
        medico:medicos(*)
      `)
      .eq('fecha', today)
      .neq('estado', 'CANCELADA')
      .order('hora', { ascending: true });

    if (data) setCitas((data as Cita[]).filter((c) => c.paciente));
  }, []);

  useEffect(() => {
    fetchPagos();
    fetchCitas();
  }, [fetchPagos, fetchCitas]);

  async function verifyCash(pagoId: string) {
    const { error } = await supabase
      .from('pagos')
      .update({
        estado: 'VERIFICADO',
        verificado_por: profile?.nombre_completo || 'Sistema',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pagoId);

    if (error) {
      showToast('Error al verificar pago', 'error');
      return;
    }
    showToast('Pago en efectivo verificado', 'success');
    fetchPagos();
  }

  async function registerCashPayment() {
    if (!selectedCita) {
      showToast('Selecciona una cita', 'error');
      return;
    }

    setSaving(true);
    const cita = citas.find((c) => c.id === selectedCita);
    const montoNum = parseFloat(monto) || 0;

    const { error } = await supabase.from('pagos').insert({
      cita_id: selectedCita,
      paciente_id: cita?.paciente_id || null,
      monto: montoNum,
      metodo_pago: 'EFECTIVO',
      estado: 'VERIFICADO',
      tipo_tarifa: tarifa,
      verificado_por: profile?.nombre_completo || 'Sistema',
      fecha_pago: new Date().toISOString(),
    });

    if (error) {
      showToast('Error al registrar pago', 'error');
      setSaving(false);
      return;
    }

    showToast('Pago en efectivo registrado y verificado', 'success');
    setShowAddModal(false);
    setSelectedCita('');
    setMonto('1500');
    setTarifa('REGULAR');
    setSaving(false);
    fetchPagos();
  }

  const totalVerificado = pagos
    .filter((p) => p.estado === 'VERIFICADO')
    .reduce((sum, p) => sum + p.monto, 0);
  const totalPendiente = pagos
    .filter((p) => p.estado === 'PENDIENTE')
    .reduce((sum, p) => sum + p.monto, 0);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Caja / Pagos en Efectivo</h1>
          <p className="text-slate-500 mt-1">Registra y verifica pagos en efectivo al momento de la atención</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors touch-target"
        >
          <Plus className="w-5 h-5" />
          Registrar Pago
        </button>
      </div>

      {/* Cash summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <span className="text-emerald-50 text-sm font-medium">Verificado Hoy</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalVerificado)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-amber-50 text-sm font-medium">Pendiente</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalPendiente)}</p>
        </div>
        <div className="bg-slate-800 text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-slate-300 text-sm font-medium">Total Transacciones</span>
          </div>
          <p className="text-3xl font-bold">{pagos.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : pagos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No hay pagos en efectivo registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paciente</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Cita</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarifa</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.map((pago) => (
                <tr key={pago.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-slate-700">
                      {pago.paciente ? `${pago.paciente.nombre} ${pago.paciente.apellido}` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-slate-500">
                      {pago.cita ? `${pago.cita.hora?.slice(0, 5)} - ${pago.cita.motivo_consulta || ''}` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold ${pago.tipo_tarifa === 'BENEFICA_SOLIDARIA' ? 'text-teal-600' : 'text-slate-600'}`}>
                      {pago.tipo_tarifa === 'BENEFICA_SOLIDARIA' ? 'Solidaria' : 'Regular'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(pago.monto)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Badge variant={pago.estado === 'VERIFICADO' ? 'verificado' : pago.estado === 'RECHAZADO' ? 'rechazado' : 'pendiente'}>
                      {pago.estado}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {pago.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => verifyCash(pago.id)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors touch-target"
                      >
                        Verificar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add cash payment modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Registrar Pago en Efectivo"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cita de Hoy</label>
            <select
              value={selectedCita}
              onChange={(e) => {
                setSelectedCita(e.target.value);
                const cita = citas.find((c) => c.id === e.target.value);
                if (cita) {
                  setTarifa(cita.tipo_tarifa);
                  setMonto(cita.tipo_tarifa === 'BENEFICA_SOLIDARIA' ? '750' : '1500');
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white text-sm"
            >
              <option value="">Seleccionar cita...</option>
              {citas.map((cita) => (
                <option key={cita.id} value={cita.id}>
                  {cita.hora?.slice(0, 5)} - {cita.paciente?.nombre} {cita.paciente?.apellido} - {cita.motivo_consulta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Tarifa</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setTarifa('REGULAR');
                  setMonto('1500');
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  tarifa === 'REGULAR'
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-slate-700">Regular</p>
                <p className="text-xs text-slate-500">RD$ 1,500</p>
              </button>
              <button
                onClick={() => {
                  setTarifa('BENEFICA_SOLIDARIA');
                  setMonto('750');
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  tarifa === 'BENEFICA_SOLIDARIA'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-slate-700">Solidaria</p>
                <p className="text-xs text-slate-500">RD$ 750</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Monto (RD$)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all bg-white"
            />
          </div>

          <button
            onClick={registerCashPayment}
            disabled={saving || !selectedCita}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors touch-target"
          >
            {saving ? 'Registrando...' : 'Registrar y Verificar Pago'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
