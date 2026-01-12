import { api } from './api';
import type { Payment } from '../types';

export interface PaymentFormData {
  valor_cobrado: number;
  valor_professor_recebido: number;
  valor_igreja_recebido: number;
}

export interface PaymentStatusUpdate {
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO';
  data_pagamento?: string | null;
}

/**
 * Service for billing/payment operations
 */
export const billingService = {
  /**
   * Fetches payments for a specific month
   */
  async getPayments(month: string): Promise<Payment[]> {
    return api.get<Payment[]>(`/cobranca?mes=${month}`);
  },

  /**
   * Updates payment values
   */
  async updatePayment(id: number, data: PaymentFormData): Promise<void> {
    return api.put(`/pagamentos/${id}`, data);
  },

  /**
   * Updates payment status
   */
  async updatePaymentStatus(id: number, data: PaymentStatusUpdate): Promise<void> {
    return api.put(`/pagamentos/${id}`, data);
  },

  /**
   * Marks a payment as paid
   */
  async markAsPaid(id: number): Promise<void> {
    // Get today's date in local format YYYY-MM-DD to avoid timezone issues
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    
    return this.updatePaymentStatus(id, {
      status: 'PAGO',
      data_pagamento: localDate,
    });
  },

  /**
   * Marks a payment as pending (reverses paid status)
   */
  async markAsPending(id: number): Promise<void> {
    return this.updatePaymentStatus(id, {
      status: 'PENDENTE',
      data_pagamento: null,
    });
  },
};
