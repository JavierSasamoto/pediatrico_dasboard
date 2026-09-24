export type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'MEDICO';

export interface Profile {
  id: string;
  nombre_completo: string;
  rol: UserRole;
  email: string | null;
  telefono: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  sexo: 'M' | 'F' | null;
  nombre_tutor: string | null;
  telefono_tutor: string | null;
  email_tutor: string | null;
  direccion: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  licencia_medica: string | null;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HorarioMedico {
  id: string;
  medico_id: string;
  dia_semana: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
  created_at: string;
}

export type CitaEstado = 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';
export type TipoTarifa = 'REGULAR' | 'BENEFICA_SOLIDARIA';

export interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha: string;
  hora: string;
  estado: CitaEstado;
  tipo_tarifa: TipoTarifa;
  motivo_consulta: string | null;
  created_at: string;
  updated_at: string;
  paciente?: Paciente;
  medico?: Medico;
}

export type PagoEstado = 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';
export type MetodoPago = 'QR' | 'EFECTIVO' | 'TARJETA';

export interface Pago {
  id: string;
  cita_id: string | null;
  paciente_id: string | null;
  monto: number;
  metodo_pago: MetodoPago;
  codigo_referencia_qr: string | null;
  comprobante_url: string | null;
  estado: PagoEstado;
  tipo_tarifa: TipoTarifa;
  verificado_por: string | null;
  fecha_pago: string;
  created_at: string;
  updated_at: string;
  paciente?: Paciente;
  cita?: Cita;
}

export interface HistoriaClinica {
  id: string;
  cita_id: string | null;
  paciente_id: string;
  medico_id: string | null;
  motivo_consulta: string | null;
  diagnostico: string | null;
  peso_kg: number | null;
  talla_cm: number | null;
  temperatura_c: number | null;
  frecuencia_cardiaca: number | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  paciente?: Paciente;
  medico?: Medico;
  cita?: Cita;
}

export interface Receta {
  id: string;
  historia_clinica_id: string;
  paciente_id: string | null;
  medico_id: string | null;
  indicaciones_tratamiento: string;
  medicamentos: string | null;
  enviada_whatsapp: boolean;
  created_at: string;
  paciente?: Paciente;
  medico?: Medico;
  historia_clinica?: HistoriaClinica;
}
