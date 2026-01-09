import React, { useState, useEffect } from 'react';
import { useClients } from '../../../contexts/ClientContext';
import { ClientForm } from '../ClientForm';
import './ClientList.css';

export const ClientList: React.FC = () => {
  const { clients, loading, fetchClients, deleteClient } = useClients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleOpenModal = (clientId?: number) => {
    setEditingId(clientId || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    fetchClients(); // Refresh list after closing
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('⚠️ ATENÇÃO: Excluir o cliente irá remover TODOS os pagamentos associados! Tem certeza?')) {
      try {
        await deleteClient(id);
      } catch (err) {
        console.error('Erro ao excluir cliente:', err);
      }
    }
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 11) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    return phone;
  };

  return (
    <div className="client-list-container">
      <div className="client-list-header">
        <h2>Gestão de Clientes</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="fa-solid fa-plus"></i>
          Novo Cliente
        </button>
      </div>

      {loading && <div className="loading">Carregando...</div>}

      <div className="client-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Endereço</th>
              <th>WhatsApp</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.filter(c => c.active).map((client) => (
              <tr key={client.id}>
                <td>{client.id}</td>
                <td>{client.nome}</td>
                <td>{client.endereco}</td>
                <td>{formatPhone(client.whatsapp)}</td>
                <td className="actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleOpenModal(client.id)}
                    title="Editar"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(client.id)}
                    title="Excluir"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        clientId={editingId}
      />
    </div>
  );
};
