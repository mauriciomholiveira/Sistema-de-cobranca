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
  const [valuesVisible, setValuesVisible] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchProfessorMetrics();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get<DashboardData>('/dashboard');
      setData(response);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      // Only set loading to false after both fetches are complete, or handle separately
      // For now, assuming this is the main data fetch that determines overall loading
      // If professorMetrics is also critical for initial render, loading state needs adjustment
    }
  };

  const fetchProfessorMetrics = async () => {
    try {
      const response = await api.get<ProfessorMetric[]>('/dashboard/professores');
      setProfessorMetrics(response);
    } catch (err) {
      console.error('Erro ao carregar métricas de professores:', err);
    } finally {
      setLoading(false); // Set loading to false after all initial data is fetched
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
            <span className="forecast-value">{formatValue(data.previsao_total)}</span>
          </div>
          <div className="forecast-item professor">
            <span className="forecast-label">Previsão Professores</span>
            <span className="forecast-value">{formatValue(data.total_professores)}</span>
          </div>
          <div className="forecast-item church">
            <span className="forecast-label">Previsão Igreja</span>
            <span className="forecast-value">{formatValue(data.total_igreja)}</span>
          </div>
        </div>
      </div>

      {/* Financial metrics - 4 columns */}
      <div className="financial-grid">
        <div className="metric-card success">
          <div className="metric-icon">
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <div className="metric-content">
            <h3>Recebido</h3>
            <p className="metric-value">{formatValue(data.recebido)}</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="metric-content">
            <h3>A Receber</h3>
            <p className="metric-value">{formatValue(data.a_receber)}</p>
          </div>
        </div>

        <div className="metric-card professor">
          <div className="metric-icon">
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
          <div className="metric-content">
            <h3>Total Pago Professores</h3>
            <p className="metric-value">{formatValue(data.total_professores)}</p>
          </div>
        </div>

        <div className="metric-card church">
          <div className="metric-icon">
            <i className="fa-solid fa-church"></i>
          </div>
          <div className="metric-content">
            <h3>Total Pago Igreja</h3>
            <p className="metric-value">{formatValue(data.total_igreja)}</p>
          </div>
        </div>
      </div>

      {/* Counter metrics - 3 columns */}
      <div className="counter-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="metric-content">
            <h3>Total Alunos</h3>
            <p className="metric-value">{formatNumber(data.alunos)}</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <i className="fa-solid fa-gift"></i>
          </div>
          <div className="metric-content">
            <h3>Isentos</h3>
            <p className="metric-value">{formatNumber(data.isentos)}</p>
          </div>
        </div>

        <div className="metric-card danger">
          <div className="metric-icon">
            <i className="fa-solid fa-exclamation-triangle"></i>
          </div>
          <div className="metric-content">
            <h3>Atrasados</h3>
            <p className="metric-value">{formatNumber(data.atrasados)}</p>
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
                    <td className="metric-cell">{formatNumber(prof.total_alunos)}</td>
                    <td className="metric-cell success">{formatValue(prof.a_receber)}</td>
                    <td className="metric-cell info">{formatValue(prof.paga_igreja)}</td>
                    <td className="metric-cell warning">{formatValue(prof.pendencias)}</td>
                    <td className="metric-cell primary">{formatValue(prof.previsao_total)}</td>
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

