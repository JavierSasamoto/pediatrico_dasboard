import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Modal } from '@/components/ui';
import { Users, ShieldCheck, Stethoscope, UserCog, Pencil } from 'lucide-react';
import type { Profile, UserRole } from '@/lib/types';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepción / Caja',
  MEDICO: 'Médico / Pediatra',
};

const ROLE_ICONS: Record<UserRole, typeof ShieldCheck> = {
  ADMIN: ShieldCheck,
  RECEPCIONISTA: Users,
  MEDICO: Stethoscope,
};

const ROLE_VARIANTS: Record<UserRole, 'info' | 'confirmada' | 'success'> = {
  ADMIN: 'info',
  RECEPCIONISTA: 'confirmada',
  MEDICO: 'success',
};

export function UserManagement() {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('RECEPCIONISTA');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Error al cargar usuarios', 'error');
      setLoading(false);
      return;
    }
    setProfiles((data || []) as Profile[]);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  function openEdit(p: Profile) {
    setEditingProfile(p);
    setEditRole(p.rol);
  }

  async function saveRole() {
    if (!editingProfile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ rol: editRole, updated_at: new Date().toISOString() })
      .eq('id', editingProfile.id);

    if (error) { showToast('Error al actualizar rol', 'error'); return; }
    showToast('Rol actualizado', 'success');
    setEditingProfile(null);
    fetchProfiles();
  }

  const roleCounts: Record<UserRole, number> = {
    ADMIN: profiles.filter((p) => p.rol === 'ADMIN').length,
    RECEPCIONISTA: profiles.filter((p) => p.rol === 'RECEPCIONISTA').length,
    MEDICO: profiles.filter((p) => p.rol === 'MEDICO').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
        <p className="text-slate-500 mt-1">Lista de usuarios del sistema con asignación de roles</p>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
          const Icon = ROLE_ICONS[role];
          const colors: Record<UserRole, string> = {
            ADMIN: 'bg-slate-700 text-white',
            RECEPCIONISTA: 'bg-sky-600 text-white',
            MEDICO: 'bg-teal-600 text-white',
          };
          return (
            <div key={role} className={`rounded-2xl p-5 ${colors[role]}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">{ROLE_LABELS[role]}</span>
              </div>
              <p className="text-3xl font-bold">{roleCounts[role]}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-lg">No hay usuarios registrados</p>
          <p className="text-sm text-slate-400 mt-1">
            Los usuarios aparecerán aquí después de iniciar sesión por primera vez
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Teléfono</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((p) => {
                const RoleIcon = ROLE_ICONS[p.rol];
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-slate-600">
                            {p.nombre_completo.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{p.nombre_completo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{p.email || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-slate-500">{p.telefono || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={ROLE_VARIANTS[p.rol]}>
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[p.rol]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors touch-target"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Cambiar Rol
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit role modal */}
      <Modal
        open={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        title="Asignar Rol de Usuario"
      >
        {editingProfile && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-semibold text-slate-700">{editingProfile.nombre_completo}</p>
              <p className="text-sm text-slate-500">{editingProfile.email || 'Sin email'}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccionar Rol</label>
              <div className="space-y-2">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
                  const Icon = ROLE_ICONS[role];
                  const isSelected = editRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setEditRole(role)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-700">{ROLE_LABELS[role]}</p>
                        <p className="text-xs text-slate-500">
                          {role === 'ADMIN' && 'Acceso completo al sistema'}
                          {role === 'RECEPCIONISTA' && 'Gestión de citas y pagos'}
                          {role === 'MEDICO' && 'Atención clínica y recetas'}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-sky-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={saveRole}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors touch-target"
            >
              Guardar Rol
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
