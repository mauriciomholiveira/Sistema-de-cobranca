import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Client, ClientFormData, Enrollment, EnrollmentFormData } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  createClient: (data: ClientFormData) => Promise<Client>;
  updateClient: (id: number, data: ClientFormData) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
  getClientEnrollments: (clientId: number) => Promise<Enrollment[]>;
  createEnrollment: (clientId: number, data: EnrollmentFormData) => Promise<void>;
  deleteEnrollment: (enrollmentId: number) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Client[]>('/clientes');
      setClients(data);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (data: ClientFormData): Promise<Client> => {
    setLoading(true);
    setError(null);
    try {
      const newClient = await api.post<Client>('/clientes', {
        ...data,
        valor_padrao: 0,
        dia_vencimento: 10,
        professor_id: null,
        curso_id: null,
        valor_professor: 0,
        valor_igreja: 0,
      });
      setClients(prev => [...prev, newClient]);
      showToast('Cliente criado com sucesso!', 'success');
      return newClient;
    } catch (err) {
      setError('Erro ao criar cliente');
      showToast('Erro ao criar cliente', 'error');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateClient = useCallback(async (id: number, data: ClientFormData) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/clientes/${id}`, data);
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      showToast('Cliente atualizado com sucesso!', 'success');
    } catch (err) {
      setError('Erro ao atualizar cliente');
      showToast('Erro ao atualizar cliente', 'error');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const deleteClient = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/clientes/${id}`);
      setClients(prev => prev.filter(c => c.id !== id));
      showToast('Cliente excluído com sucesso!', 'success');
    } catch (err) {
      setError('Erro ao excluir cliente');
      showToast('Erro ao excluir cliente', 'error');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const getClientEnrollments = useCallback(async (clientId: number): Promise<Enrollment[]> => {
    try {
      return await api.get<Enrollment[]>(`/matriculas/${clientId}`);
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  const createEnrollment = useCallback(async (clientId: number, data: EnrollmentFormData) => {
    try {
      await api.post('/matriculas', {
        cliente_id: clientId,
        ...data,
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const deleteEnrollment = useCallback(async (enrollmentId: number) => {
    try {
      await api.delete(`/matriculas/${enrollmentId}`);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  return (
    <ClientContext.Provider
      value={{
        clients,
        loading,
        error,
        fetchClients,
        createClient,
        updateClient,
        deleteClient,
        getClientEnrollments,
        createEnrollment,
        deleteEnrollment,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within ClientProvider');
  }
  return context;
};
