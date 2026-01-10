import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import type { ProfessorMetric } from '../../../types';
import './Dashboard.css';

interface DashboardData {
  mes_ref: string;
  alunos: number;
  atrasados: number;
  recebido: number;
  a_receber: number;
  previsao_total: number;
  isentos: number;
  total_professores: number;
  total_igreja: number;
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [professorMetrics, setProfessorMetrics] = useState<ProfessorMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get<DashboardData>('/dashboard');
      setData(response);
      
      const profMetrics = await api.get<ProfessorMetric[]>('/dashboard/professores');
      setProfessorMetrics(profMetrics);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <h2>Dashboard</h2>
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <h2>Dashboard</h2>
        <div className="loading">Erro ao carregar dados</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      
      {/* Forecast card - First */}
      <div className="forecast-card-top">
        <div className="forecast-header">
          <i className="fa-solid fa-chart-line"></i>
          <h3>Previsões do Mês</h3>
        </div>
        <div className="forecast-grid-content">
          <div className="forecast-item total">
            <span className="forecast-label">Previsão Total</span>
            <span className="forecast-value">R$ {Number(data.previsao_total).toFixed(2)}</span>
          </div>
          <div className="forecast-item professor">
            <span className="forecast-label">Previsão Professores</span>
            <span className="forecast-value">R$ {Number(data.total_professores).toFixed(2)}</span>
          </div>
          <div className="forecast-item church">
            <span className="forecast-label">Previsão Igreja</span>
            <span className="forecast-value">R$ {Number(data.total_igreja).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main metrics grid - Middle */}
      <div className="metrics-grid">
        <div className="metric-card success">
          <div className="metric-icon">
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <div className="metric-content">
            <h3>Recebido</h3>
            <p className="metric-value">R$ {Number(data.recebido).toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="metric-content">
            <h3>A Receber</h3>
            <p className="metric-value">R$ {Number(data.a_receber).toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card professor">
          <div className="metric-icon">
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
          <div className="metric-content">
            <h3>Total Pago Professores</h3>
            <p className="metric-value">R$ {Number(data.total_professores).toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card church">
          <div className="metric-icon">
            <i className="fa-solid fa-church"></i>
          </div>
          <div className="metric-content">
            <h3>Total Pago Igreja</h3>
            <p className="metric-value">R$ {Number(data.total_igreja).toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="metric-content">
            <h3>Total Alunos</h3>
            <p className="metric-value">{data.alunos}</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <i className="fa-solid fa-gift"></i>
          </div>
          <div className="metric-content">
            <h3>Isentos</h3>
            <p className="metric-value">{data.isentos}</p>
          </div>
        </div>

        <div className="metric-card danger">
          <div className="metric-icon">
            <i className="fa-solid fa-exclamation-triangle"></i>
          </div>
          <div className="metric-content">
            <h3>Atrasados</h3>
            <p className="metric-value">{data.atrasados}</p>
          </div>
        </div>
      </div>

      {/* Professor Metrics Table */}
      {professorMetrics.length > 0 && (
        <div className="professor-metrics-section">
          <h3>Métricas por Professor</h3>
          <div className="professor-table-container">
            <table className="professor-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>
                    <i className="fa-solid fa-users"></i>
                    Alunos
                  </th>
                  <th>
                    <i className="fa-solid fa-hand-holding-dollar"></i>
                    A Receber
                  </th>
                  <th>
                    <i className="fa-solid fa-church"></i>
                    Paga Igreja
                  </th>
                  <th>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    Pendências
                  </th>
                  <th>
                    <i className="fa-solid fa-chart-line"></i>
                    Previsão Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {professorMetrics.map((prof) => (
                  <tr key={prof.id}>
                    <td className="professor-name">{prof.nome}</td>
                    <td className="metric-cell">{prof.total_alunos}</td>
                    <td className="metric-cell success">R$ {Number(prof.a_receber).toFixed(2)}</td>
                    <td className="metric-cell info">R$ {Number(prof.paga_igreja).toFixed(2)}</td>
                    <td className="metric-cell warning">R$ {Number(prof.pendencias).toFixed(2)}</td>
                    <td className="metric-cell primary">R$ {Number(prof.previsao_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

