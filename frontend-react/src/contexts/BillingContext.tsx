import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Payment } from '../types';
import { api } from '../services/api';

interface BillingContextType {
  payments: Payment[];
  loading: boolean;
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  fetchPayments: (month: string) => Promise<void>;
  markAsPaid: (paymentId: number) => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchPayments = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const data = await api.get<Payment[]>(`/cobranca?mes=${month}`);
      setPayments(data);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsPaid = useCallback(async (paymentId: number) => {
    try {
      // Get today's date in local format YYYY-MM-DD to avoid timezone issues
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      
      await api.put(`/pagamentos/${paymentId}`, { 
        status: 'PAGO',
        data_pagamento: localDate
      });
      await fetchPayments(currentMonth);
    } catch (err) {
      console.error('Erro ao marcar como pago:', err);
      throw err;
    }
  }, [currentMonth, fetchPayments]);

  return (
    <BillingContext.Provider
      value={{
        payments,
        loading,
        currentMonth,
        setCurrentMonth,
        fetchPayments,
        markAsPaid,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within BillingProvider');
  }
  return context;
};
