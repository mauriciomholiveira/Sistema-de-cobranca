import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import { formatMonthYear } from '../../../utils/dateUtils';
import './Reports.css';

interface ProfessorReport {
  id: number;
  nome: string;
  email: string;
  pix: string;
  alunos_ativos: number;
  alunos_inativos: number;
  total_mes: number;
  total_pago: number;
  total_pendente: number;
  total_atrasado: number;
  qtd_atrasados: number;
  professor_recebido: number;
  professor_total: number;
  igreja_recebido: number;
  igreja_total: number;
  qtd_pagos: number;
  qtd_pendentes: number;
  total_cobrancas: number;
}

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ProfessorReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchReports = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const data = await api.get<ProfessorReport[]>(`/relatorios/professores?mes=${month}`);
      setReports(data);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.is_admin) {
      fetchReports(currentMonth);
    }
  }, [currentMonth, fetchReports, user?.is_admin]);

  const handlePreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  // Calculate totals
  const totals = reports.reduce((acc, r) => ({
    alunos_ativos: acc.alunos_ativos + Number(r.alunos_ativos),
    alunos_inativos: acc.alunos_inativos + Number(r.alunos_inativos),
    total_mes: acc.total_mes + Number(r.total_mes),
    total_pago: acc.total_pago + Number(r.total_pago),
    total_pendente: acc.total_pendente + Number(r.total_pendente),
    total_atrasado: acc.total_atrasado + Number(r.total_atrasado),
    qtd_atrasados: acc.qtd_atrasados + Number(r.qtd_atrasados),
    professor_recebido: acc.professor_recebido + Number(r.professor_recebido),
    professor_total: acc.professor_total + Number(r.professor_total),
    igreja_recebido: acc.igreja_recebido + Number(r.igreja_recebido),
    igreja_total: acc.igreja_total + Number(r.igreja_total),
  }), {
    alunos_ativos: 0,
    alunos_inativos: 0,
    total_mes: 0,
    total_pago: 0,
    total_pendente: 0,
    total_atrasado: 0,
    qtd_atrasados: 0,
    professor_recebido: 0,
    professor_total: 0,
    igreja_recebido: 0,
    igreja_total: 0,
  });

  if (!user?.is_admin) {
    return (
      <div className="reports-container">
        <div className="access-denied">
          <i className="fa-solid fa-lock"></i>
          <h2>Acesso Negado</h2>
          <p>Apenas administradores podem acessar os relatórios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>
          <i className="fa-solid fa-chart-bar"></i>
          Relatórios de Professores
        </h2>
        <div className="header-actions">
          <div className="month-selector">
            <button 
              className="month-nav-btn"
              onClick={handlePreviousMonth}
              title="Mês anterior"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <span className="current-month">{formatMonthYear(currentMonth)}</span>
            <button 
              className="month-nav-btn"
              onClick={handleNextMonth}
              title="Próximo mês"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="month-picker-trigger"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="summary-content">
            <h3>Alunos Ativos</h3>
            <p className="summary-value">{totals.alunos_ativos}</p>
          </div>
        </div>

        <div className="summary-card success">
          <div className="summary-icon">
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <div className="summary-content">
            <h3>Total Recebido</h3>
            <p className="summary-value">{formatCurrency(totals.total_pago)}</p>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="summary-icon">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="summary-content">
            <h3>A Receber</h3>
            <p className="summary-value">{formatCurrency(totals.total_pendente + totals.total_atrasado)}</p>
          </div>
        </div>

        <div className="summary-card church">
          <div className="summary-icon">
            <i className="fa-solid fa-church"></i>
          </div>
          <div className="summary-content">
            <h3>Repasse Igreja</h3>
            <p className="summary-value">{formatCurrency(totals.igreja_recebido)}</p>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Carregando relatórios...</div>}

      {/* Professor Cards */}
      <div className="professor-cards-grid">
        {reports.map((professor) => (
          <div key={professor.id} className="professor-report-card">
            <div className="card-header">
              <div className="professor-avatar">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
              <div className="professor-info">
                <h3>{professor.nome}</h3>
                {professor.pix && (
                  <span className="professor-pix" title="Chave PIX">
                    <i className="fa-brands fa-pix"></i> {professor.pix}
                  </span>
                )}
              </div>
            </div>

            <div className="card-section students-section">
              <div className="section-title">
                <i className="fa-solid fa-users"></i>
                Alunos
              </div>
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-label">Ativos</span>
                  <span className="stat-value success">{professor.alunos_ativos}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Inativos</span>
                  <span className="stat-value muted">{professor.alunos_inativos}</span>
                </div>
              </div>
            </div>

            <div className="card-section payments-section">
              <div className="section-title">
                <i className="fa-solid fa-money-bill-wave"></i>
                Pagamentos do Mês
              </div>
              <div className="payment-stats">
                <div className="payment-row total">
                  <span className="payment-label">Total Esperado</span>
                  <span className="payment-value">{formatCurrency(professor.total_mes)}</span>
                </div>
                <div className="payment-row success">
                  <span className="payment-label">
                    <i className="fa-solid fa-check"></i> Recebido
                  </span>
                  <span className="payment-value">{formatCurrency(professor.total_pago)}</span>
                </div>
                <div className="payment-row pending">
                  <span className="payment-label">
                    <i className="fa-solid fa-clock"></i> Pendente
                  </span>
                  <span className="payment-value">{formatCurrency(professor.total_pendente)}</span>
                </div>
                {Number(professor.total_atrasado) > 0 && (
                  <div className="payment-row danger">
                    <span className="payment-label">
                      <i className="fa-solid fa-exclamation-triangle"></i> Atrasado ({professor.qtd_atrasados})
                    </span>
                    <span className="payment-value">{formatCurrency(professor.total_atrasado)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="card-section earnings-section">
              <div className="section-title">
                <i className="fa-solid fa-wallet"></i>
                Divisão de Valores
              </div>
              <div className="earnings-grid">
                <div className="earning-item professor">
                  <div className="earning-header">
                    <i className="fa-solid fa-user-tie"></i>
                    <span>Professor Recebe</span>
                  </div>
                  <div className="earning-values">
                    <span className="earning-received">{formatCurrency(professor.professor_recebido)}</span>
                    <span className="earning-total">de {formatCurrency(professor.professor_total)}</span>
                  </div>
                </div>
                <div className="earning-item church">
                  <div className="earning-header">
                    <i className="fa-solid fa-church"></i>
                    <span>Igreja Recebe</span>
                  </div>
                  <div className="earning-values">
                    <span className="earning-received">{formatCurrency(professor.igreja_recebido)}</span>
                    <span className="earning-total">de {formatCurrency(professor.igreja_total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-footer">
              <div className="footer-stat">
                <span className="footer-count success">{professor.qtd_pagos}</span>
                <span className="footer-label">Pagos</span>
              </div>
              <div className="footer-stat">
                <span className="footer-count warning">{professor.qtd_pendentes}</span>
                <span className="footer-label">Pendentes</span>
              </div>
              <div className="footer-stat">
                <span className="footer-count danger">{professor.qtd_atrasados}</span>
                <span className="footer-label">Atrasados</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && !loading && (
        <div className="no-data">
          <i className="fa-solid fa-chart-bar"></i>
          <p>Nenhum relatório disponível para este mês</p>
        </div>
      )}
    </div>
  );
};
