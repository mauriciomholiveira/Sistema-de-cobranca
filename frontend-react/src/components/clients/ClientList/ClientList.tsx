import React, { useState, useEffect } from 'react';
import { useClients } from '../../../contexts/ClientContext';
import { ClientForm } from '../ClientForm';
import './ClientList.css';

export const ClientList: React.FC = () => {
  const { clients, loading, fetchClients, deleteClient, toggleClientActive } = useClients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

  const handleToggleActive = async (id: number) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    setSelectedClientId(id);
    setSelectedClientName(client.nome);
    setIsActivating(!client.active);
    setShowConfirmModal(true);
  };

  const confirmToggle = async () => {
    if (selectedClientId === null) return;
    
    try {
      await toggleClientActive(selectedClientId);
      setShowConfirmModal(false);
      setSelectedClientId(null);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleDelete = async (id: number) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    setSelectedClientId(id);
    setSelectedClientName(client.nome);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedClientId === null) return;

    try {
      await deleteClient(selectedClientId);
      setShowDeleteModal(false);
      setSelectedClientId(null);
      setDeleteConfirmText('');
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
    }
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 11) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    return phone;
  };

  const filteredClients = clients.filter(c => 
    activeTab === 'active' ? c.active : !c.active
  );

  return (
    <div className="client-list-container">
      <div className="client-list-header">
        <h2>Gestão de Clientes</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="fa-solid fa-plus"></i>
          Novo Cliente
        </button>
      </div>

      {/* Tabs */}
      <div className="client-tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <i className="fa-solid fa-users"></i>
          Ativos ({clients.filter(c => c.active).length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'inactive' ? 'active' : ''}`}
          onClick={() => setActiveTab('inactive')}
        >
          <i className="fa-solid fa-user-slash"></i>
          Inativos ({clients.filter(c => !c.active).length})
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
            {filteredClients.map((client) => (
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
                    className={`btn-icon ${client.active ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => handleToggleActive(client.id)}
                    title={client.active ? 'Inativar Cliente' : 'Reativar Cliente'}
                  >
                    <i className={`fa-solid ${client.active ? 'fa-pause' : 'fa-play'}`}></i>
                  </button>
                  {!client.active && (
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDelete(client.id)}
                      title="Excluir Permanentemente"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className={`fa-solid ${isActivating ? 'fa-play' : 'fa-pause'}`}></i>
                {isActivating ? 'Reativar Cliente' : 'Pausar Cliente'}
              </h3>
              <button className="btn-close" onClick={() => setShowConfirmModal(false)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <p className="client-name">
                <strong>{selectedClientName}</strong>
              </p>

              {isActivating ? (
                <div className="info-box info-success">
                  <i className="fa-solid fa-circle-info"></i>
                  <div>
                    <h4>Como funciona a reativação:</h4>
                    <ul>
                      <li>✅ Cliente volta para a lista de ativos</li>
                      <li>✅ Novas cobranças começam a partir do <strong>mês atual</strong></li>
                      <li>✅ Histórico de pagamentos anteriores é preservado</li>
                      <li>⚠️ Meses inativos <strong>não serão cobrados retroativamente</strong></li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="info-box info-warning">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <div>
                    <h4>Como funciona a pausa:</h4>
                    <ul>
                      <li>⏸️ Cliente será movido para <strong>Inativos</strong></li>
                      <li>🗑️ Pagamentos pendentes serão <strong>removidos</strong></li>
                      <li>❌ Cliente <strong>não aparecerá</strong> em cobranças futuras</li>
                      <li>✅ Histórico de pagamentos <strong>já realizados</strong> será mantido</li>
                      <li>🔄 Você pode reativar a qualquer momento</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </button>
              <button 
                className={`btn ${isActivating ? 'btn-success' : 'btn-warning'}`}
                onClick={confirmToggle}
              >
                <i className={`fa-solid ${isActivating ? 'fa-play' : 'fa-pause'}`}></i>
                {isActivating ? 'Confirmar Reativação' : 'Confirmar Pausa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-trash"></i>
                Excluir Cliente Permanentemente
              </h3>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <p className="client-name">
                <strong>{selectedClientName}</strong>
              </p>

              <div className="warning-header">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <h4>ATENÇÃO: Esta ação é IRREVERSÍVEL!</h4>
              </div>

              <div className="warning-content">
                <p className="warning-text">
                  Ao excluir este cliente, os seguintes dados serão <strong>permanentemente removidos</strong>:
                </p>

                <ul className="delete-list">
                  <li>
                    <i className="fa-solid fa-graduation-cap"></i>
                    <span><strong>Todas as matrículas</strong> do cliente</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                    <span><strong>Todos os pagamentos</strong> (passados, atuais e futuros)</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-chart-line"></i>
                    <span><strong>Todo o histórico financeiro</strong></span>
                  </li>
                  <li>
                    <i className="fa-solid fa-user"></i>
                    <span><strong>Dados cadastrais</strong> do cliente</span>
                  </li>
                </ul>

                <div className="tip-box">
                  <i className="fa-solid fa-lightbulb"></i>
                  <div>
                    <strong>Dica:</strong> Se você quer apenas pausar as cobranças, use o botão 
                    <span className="highlight">"Pausar"</span> ao invés de excluir. Assim você mantém o histórico!
                  </div>
                </div>
              </div>

              <div className="confirmation-input-section">
                <label htmlFor="delete-confirm">
                  Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="Digite EXCLUIR"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleteConfirmText.trim() !== 'EXCLUIR'}
              >
                <i className="fa-solid fa-trash"></i>
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
