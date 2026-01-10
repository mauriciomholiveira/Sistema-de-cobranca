// Client types
export interface Client {
  id: number;
  nome: string;
  endereco: string;
  whatsapp: string;
  active: boolean;
  created_at?: string;
}

export interface ClientFormData {
  nome: string;
  endereco: string;
  whatsapp: string;
}

// Enrollment types
export interface Enrollment {
  id: number;
  cliente_id: number;
  curso_id: number;
  professor_id: number;
  dia_vencimento: number;
  valor_mensalidade: number;
  valor_professor: number;
  valor_igreja: number;
  active: boolean;
  nome_curso?: string;
  nome_professor?: string;
}

export interface EnrollmentFormData {
  curso_id: number;
  professor_id: number;
  dia_vencimento: number;
  valor_mensalidade: number;
  valor_professor: number;
  valor_igreja: number;
}

// Payment types
export interface Payment {
  id: number;
  cliente_id: number;
  matricula_id: number;
  mes_ref: string;
  valor_cobrado: number;
  valor_professor_recebido: number;
  valor_igreja_recebido: number;
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO';
  data_pagamento?: string;
  data_vencimento: string;
  nome: string;
  nome_curso: string;
  whatsapp?: string;
  nome_professor?: string;
}

export interface PaymentFormData {
  valor_cobrado: number;
  valor_professor_recebido: number;
  valor_igreja_recebido: number;
}

// Course types
export interface Course {
  id: number;
  nome: string;
  mensalidade_padrao: number;
  active: boolean;
}

// Professor types
export interface Professor {
  id: number;
  nome: string;
  active: boolean;
}

// Template types
export interface Template {
  id: number;
  nome: string;
  mensagem: string;
  active: boolean;
}

// Dashboard types
export interface DashboardMetrics {
  totalAlunos: number;
  totalPagamentos: number;
  totalPendente: number;
  totalAtrasado: number;
  totalPago: number;
}

export interface ProfessorMetric {
  id: number;
  nome: string;
  total_alunos: number;
  a_receber: number;
  paga_igreja: number;
  pendencias: number;
  previsao_total: number;
}
