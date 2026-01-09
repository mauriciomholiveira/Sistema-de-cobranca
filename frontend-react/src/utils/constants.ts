/**
 * Application constants
 */

export const PIX_CONFIG = {
  key: '47773105000147',
  copiaCola: '00020126360014BR.GOV.BCB.PIX0114477731050001475204000053039865802BR5901N6001C62090505Aulas63043954',
} as const;

export const PAYMENT_STATUS = {
  PAGO: 'PAGO',
  PENDENTE: 'PENDENTE',
  ATRASADO: 'ATRASADO',
} as const;

export const MESSAGE_TYPES = {
  LEMBRETE: 'lembrete',
  VENCIMENTO: 'vencimento',
  ATRASO: 'atraso',
} as const;

export const TOAST_DURATION = 3000;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
