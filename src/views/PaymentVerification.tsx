import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Modal } from '@/components/ui';
import { Check, X, QrCode, Receipt, Eye } from 'lucide-react';
import type { Pago, PagoEstado } from '@/lib/types';

export function PaymentVerification() {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PagoEstado | 'ALL'>('PENDIENTE');
  const [viewingPago, setViewingPago] = useState<Pago | null>(null);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        *,
        paciente:pacientes(*),
        cita:citas(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Error al cargar pagos', 'error');
      setLoading(false);
      return;
    }

    setPagos((data || []) as Pago[]);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  async function updateEstado(pagoId: string, estado: PagoEstado) {
    const { error } = await supabase
      .from('pagos')
      .update({
        estado,
        verificado_por: profile?.nombre_completo || 'Sistema',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pagoId);

    if (error) {
      showToast('Error al actualizar pago', 'error');
      return;
    }

    showToast(
      estado === 'VERIFICADO' ? 'Pago Verificado' : estado === 'RECHAZADO' ? 'Pago Rechazado' : 'Pago actualizado',
      estado === 'VERIFICADO' ? 'success' : estado === 'RECHAZADO' ? 'error' : 'info'
    );
    fetchPagos();
  }

  const filteredPagos = filter === 'ALL' ? pagos : pagos.filter((p) => p.estado === filter);

  const estadoVariants: Record<PagoEstado, 'pendiente' | 'verificado' | 'rechazado'> = {
    PENDIENTE: 'pendiente',
    VERIFICADO: 'verificado',
    RECHAZADO: 'rechazado',
  };

  const filters: { key: PagoEstado | 'ALL'; label: string }[] = [
    { key: 'PENDIENTE', label: 'Pendientes' },
    { key: 'VERIFICADO', label: 'Verificados' },
    { key: 'RECHAZADO', label: 'Rechazados' },
    { key: 'ALL', label: 'Todos' },
  ];

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Verificación de Pagos QR</h1>
        <p className="text-slate-500 mt-1">Revisa y concilia los pagos con códigos de referencia QR</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {filters.map((f) => {
          const count = f.key === 'ALL' ? pagos.length : pagos.filter((p) => p.estado === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`p-4 rounded-2xl text-left transition-all ${
                filter === f.key
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 hover:border-sky-300'
              }`}
            >
              <p className={`text-2xl font-bold ${filter === f.key ? 'text-white' : 'text-slate-800'}`}>
                {count}
              </p>
              <p className={`text-sm ${filter === f.key ? 'text-sky-100' : 'text-slate-500'}`}>{f.label}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : filteredPagos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No hay pagos para mostrar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredPagos.map((pago) => (
            <div
              key={pago.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                    {pago.metodo_pago === 'QR' ? (
                      <QrCode className="w-6 h-6 text-sky-600" />
                    ) : (
                      <Receipt className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800">
                        {pago.paciente
                          ? `${pago.paciente.nombre} ${pago.paciente.apellido}`
                          : 'Pago sin paciente asignado'}
                      </h3>
                      <Badge variant={estadoVariants[pago.estado]}>{pago.estado}</Badge>
                    </div>
                    <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                      <p>
                        Método: {pago.metodo_pago} ·{' '}
                        {pago.tipo_tarifa === 'REGULAR' ? 'Tarifa Regular' : 'Beneficia Solidaria'}
                      </p>
                      {pago.codigo_referencia_qr && (
                        <p className="font-mono text-xs text-slate-600">
                          Ref: {pago.codigo_referencia_qr}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(pago.fecha_pago).toLocaleString('es-DO')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(pago.monto)}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {pago.comprobante_url && (
                    <button
                      onClick={() => setViewingPago(pago)}
                      className="px-3 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 touch-target"
                    >
                      <Eye className="w-4 h-4" />
                      Ver comprobante
                    </button>
                  )}
                  {pago.estado === 'PENDIENTE' && (
                    <>
                      <button
                        onClick={() => updateEstado(pago.id, 'VERIFICADO')}
                        className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 touch-target"
                      >
                        <Check className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => updateEstado(pago.id, 'RECHAZADO')}
                        className="px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors flex items-center gap-1.5 touch-target"
                      >
                        <X className="w-4 h-4" />
                        Rechazar
                      </button>
                    </>
                  )}
                  {pago.estado === 'RECHAZADO' && (
                    <button
                      onClick={() => updateEstado(pago.id, 'VERIFICADO')}
                      className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors touch-target"
                    >
                      Revertir a Verificado
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt viewer modal */}
      <Modal
        open={!!viewingPago}
        onClose={() => setViewingPago(null)}
        title="Comprobante de Pago"
      >
        {viewingPago && (
          <div className="space-y-4">
            <div className="bg-slate-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Referencia QR:</span>
                <span className="font-mono text-sm font-semibold text-slate-700">
                  {viewingPago.codigo_referencia_qr || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Monto:</span>
                <span className="font-bold text-slate-700">{formatCurrency(viewingPago.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Paciente:</span>
                <span className="text-sm text-slate-700">
                  {viewingPago.paciente
                    ? `${viewingPago.paciente.nombre} ${viewingPago.paciente.apellido}`
                    : 'N/A'}
                </span>
              </div>
            </div>
            {viewingPago.comprobante_url && (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={viewingPago.comprobante_url}
                  alt="Comprobante"
                  className="w-full h-auto"
                />
              </div>
            )}
            {viewingPago.estado === 'PENDIENTE' && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateEstado(viewingPago.id, 'VERIFICADO');
                    setViewingPago(null);
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Aprobar Pago
                </button>
                <button
                  onClick={() => {
                    updateEstado(viewingPago.id, 'RECHAZADO');
                    setViewingPago(null);
                  }}
                  className="flex-1 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                >
                  Rechazar Pago
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
