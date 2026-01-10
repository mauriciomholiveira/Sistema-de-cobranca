import React, { useState, useEffect } from 'react';
import { useBilling } from '../../../contexts/BillingContext';
import { useResources } from '../../../contexts/ResourceContext';
import { useToast } from '../../../contexts/ToastContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { billingService } from '../../../services/billingService';
import { whatsappService, type MessageType } from '../../../services/whatsappService';
import type { Payment, PaymentFormData } from '../../../types';
import './Billing.css';

export const Billing: React.FC = () => {
  const { payments, loading, currentMonth, setCurrentMonth, fetchPayments, markAsPaid } = useBilling();
  const { professors, fetchResources } = useResources();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'PAGO' | 'PENDENTE' | 'ATRASADO'>('all');
  const [selectedProfessors, setSelectedProfessors] = useState<number[]>([]);
  const [isProfessorDropdownOpen, setIsProfessorDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState<PaymentFormData>({
    valor_cobrado: 0,
    valor_professor_recebido: 0,
    valor_igreja_recebido: 0,
  });

  useEffect(() => {
    fetchPayments(currentMonth);
    fetchResources();
  }, [currentMonth, fetchPayments, fetchResources]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.professor-filter')) {
        setIsProfessorDropdownOpen(false);
      }
    };

    if (isProfessorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfessorDropdownOpen]);

  const toggleProfessor = (professorId: number) => {
    setSelectedProfessors(prev => 
      prev.includes(professorId)
        ? prev.filter(id => id !== professorId)
        : [...prev, professorId]
    );
  };

  const toggleAllProfessors = () => {
    if (selectedProfessors.length === professors.length) {
      setSelectedProfessors([]);
    } else {
      setSelectedProfessors(professors.map(p => p.id));
    }
  };

  const handleMarkAsPaid = async (paymentId: number) => {
    try {
      await markAsPaid(paymentId);
    } catch (err) {
      alert('Erro ao marcar como pago');
    }
  };

  const handleMarkAsPending = async (paymentId: number) => {
    if (!window.confirm('Deseja reverter este pagamento para PENDENTE?')) {
      return;
    }
    
    try {
      await billingService.markAsPending(paymentId);
      await fetchPayments(currentMonth);
      showToast('Pagamento revertido para pendente', 'success');
    } catch (err) {
      showToast('Erro ao reverter pagamento', 'error');
      console.error(err);
    }
  };

  const handleOpenEditModal = (payment: Payment) => {
    setEditingPayment(payment);
    setEditForm({
      valor_cobrado: Number(payment.valor_cobrado),
      valor_professor_recebido: Number(payment.valor_professor_recebido),
      valor_igreja_recebido: Number(payment.valor_igreja_recebido),
    });
    setIsEditModalOpen(true);
  };

  const handleProfessorChange = (value: number) => {
    const valorCobrado = editForm.valor_cobrado;
    const valorIgreja = valorCobrado - value;
    setEditForm({
      ...editForm,
      valor_professor_recebido: value,
      valor_igreja_recebido: valorIgreja >= 0 ? valorIgreja : 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPayment) return;
    
    try {
      await billingService.updatePayment(editingPayment.id, editForm);
      setIsEditModalOpen(false);
      await fetchPayments(currentMonth);
      showToast('Pagamento atualizado com sucesso', 'success');
    } catch (err) {
      showToast('Erro ao atualizar pagamento', 'error');
      console.error(err);
    }
  };

  const handleSendWhatsApp = (payment: Payment, type: MessageType) => {
    try {
      whatsappService.sendMessage(payment, type);
      showToast('Abrindo WhatsApp...', 'success');
    } catch (err) {
      const error = err as Error;
      showToast(error.message || 'Erro ao enviar WhatsApp', 'error');
    }
  };

  const filteredPayments = payments.filter(p => {
    // Filter by status
    if (filter !== 'all' && p.status !== filter) return false;
    
    // Filter by professor
    if (selectedProfessors.length > 0 && !selectedProfessors.includes(p.professor_id)) return false;
    
    return true;
  });

  const stats = {
    total: payments.reduce((sum, p) => sum + Number(p.valor_cobrado), 0),
    pago: payments.filter(p => p.status === 'PAGO').reduce((sum, p) => sum + Number(p.valor_cobrado), 0),
    pendente: payments.filter(p => p.status === 'PENDENTE').reduce((sum, p) => sum + Number(p.valor_cobrado), 0),
    atrasado: payments.filter(p => p.status === 'ATRASADO').reduce((sum, p) => sum + Number(p.valor_cobrado), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO': return 'success';
      case 'PENDENTE': return 'warning';
      case 'ATRASADO': return 'danger';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAGO': return 'Pago';
      case 'PENDENTE': return 'Pendente';
      case 'ATRASADO': return 'Atrasado';
      default: return status;
    }
  };

  return (
    <div className="billing-container">
      <div className="billing-header">
        <h2>Cobrança</h2>
        <div className="header-actions">
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="month-input"
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-dollar-sign"></i>
          </div>
          <div className="stat-content">
            <h3>Total</h3>
            <p className="stat-value">R$ {stats.total.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>Pago</h3>
            <p className="stat-value">R$ {stats.pago.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>Pendente</h3>
            <p className="stat-value">R$ {stats.pendente.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <i className="fa-solid fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <h3>Atrasado</h3>
            <p className="stat-value">R$ {stats.atrasado.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Todos ({payments.length})
        </button>
        <button
          className={filter === 'PAGO' ? 'active' : ''}
          onClick={() => setFilter('PAGO')}
        >
          Pagos ({payments.filter(p => p.status === 'PAGO').length})
        </button>
        <button
          className={filter === 'PENDENTE' ? 'active' : ''}
          onClick={() => setFilter('PENDENTE')}
        >
          Pendentes ({payments.filter(p => p.status === 'PENDENTE').length})
        </button>
        <button
          className={filter === 'ATRASADO' ? 'active' : ''}
          onClick={() => setFilter('ATRASADO')}
        >
          Atrasados ({payments.filter(p => p.status === 'ATRASADO').length})
        </button>

        <div className="professor-filter">
          <button
            className="professor-filter-button"
            onClick={() => setIsProfessorDropdownOpen(!isProfessorDropdownOpen)}
          >
            <i className="fa-solid fa-chalkboard-user"></i>
            Professores
            {selectedProfessors.length > 0 && (
              <span className="filter-count">({selectedProfessors.length})</span>
            )}
            <i className={`fa-solid fa-chevron-${isProfessorDropdownOpen ? 'up' : 'down'}`}></i>
          </button>

          {isProfessorDropdownOpen && (
            <div className="professor-dropdown">
              <div className="dropdown-header">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedProfessors.length === professors.length}
                    onChange={toggleAllProfessors}
                  />
                  <span>Todos os Professores</span>
                </label>
              </div>
              <div className="dropdown-list">
                {professors.map(prof => (
                  <label key={prof.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedProfessors.includes(prof.id)}
                      onChange={() => toggleProfessor(prof.id)}
                    />
                    <span>{prof.nome}</span>
                  </label>
                ))}
              </div>
              {selectedProfessors.length > 0 && (
                <div className="dropdown-footer">
                  <button
                    className="clear-all-btn"
                    onClick={() => setSelectedProfessors([])}
                  >
                    <i className="fa-solid fa-xmark"></i>
                    Limpar Filtro
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && <div className="loading">Carregando...</div>}

      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Curso</th>
              <th>Valor</th>
              <th>Professor</th>
              <th>Igreja</th>
              <th>Status</th>
              <th>Data Pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td><strong>{payment.nome}</strong></td>
                <td>{payment.nome_curso}</td>
                <td><strong>R$ {Number(payment.valor_cobrado).toFixed(2)}</strong></td>
                <td>R$ {Number(payment.valor_professor_recebido || 0).toFixed(2)}</td>
                <td>R$ {Number(payment.valor_igreja_recebido || 0).toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(payment.status)}`}>
                    {getStatusLabel(payment.status)}
                  </span>
                </td>
                <td>
                  {payment.data_pagamento
                    ? new Date(payment.data_pagamento).toLocaleDateString('pt-BR')
                    : '-'}
                </td>
                <td className="actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleOpenEditModal(payment)}
                    title="Editar valores"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  {payment.status === 'PAGO' ? (
                    <button
                      className="btn-icon warning"
                      onClick={() => handleMarkAsPending(payment.id)}
                      title="Reverter para Pendente"
                    >
                      <i className="fa-solid fa-rotate-left"></i>
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn-icon success"
                        onClick={() => handleMarkAsPaid(payment.id)}
                        title="Marcar como pago"
                      >
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button
                        className="btn-icon whatsapp"
                        onClick={() => handleSendWhatsApp(payment, 'lembrete')}
                        title="Enviar Lembrete"
                      >
                        <i className="fa-solid fa-bell"></i>
                      </button>
                      <button
                        className="btn-icon whatsapp"
                        onClick={() => handleSendWhatsApp(payment, 'vencimento')}
                        title="Vence Hoje"
                      >
                        <i className="fa-solid fa-calendar-day"></i>
                      </button>
                      <button
                        className="btn-icon whatsapp danger"
                        onClick={() => handleSendWhatsApp(payment, 'atraso')}
                        title="Vencido"
                      >
                        <i className="fa-solid fa-exclamation-circle"></i>
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPayments.length === 0 && !loading && (
          <div className="no-data">
            <i className="fa-solid fa-inbox"></i>
            <p>Nenhum pagamento encontrado</p>
          </div>
        )}
      </div>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Pagamento"
      >
        {editingPayment && (
          <div className="edit-payment-form">
            <p className="edit-info">
              <strong>Aluno:</strong> {editingPayment.nome}<br />
              <strong>Curso:</strong> {editingPayment.nome_curso}
            </p>

            <div className="form-group">
              <label>Valor Cobrado (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.valor_cobrado}
                onChange={(e) => setEditForm({ ...editForm, valor_cobrado: Number(e.target.value) })}
              />
              <small>Valor que o aluno vai pagar</small>
            </div>

            <div className="form-group">
              <label>Professor Recebe (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.valor_professor_recebido}
                onChange={(e) => handleProfessorChange(Number(e.target.value))}
              />
              <small>Quanto o professor recebe deste pagamento</small>
            </div>

            <div className="form-group">
              <label>Igreja Recebe (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.valor_igreja_recebido}
                onChange={(e) => setEditForm({ ...editForm, valor_igreja_recebido: Number(e.target.value) })}
              />
              <small>Quanto a igreja recebe deste pagamento</small>
            </div>

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={handleSaveEdit}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
