import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get<DashboardData>('/dashboard');
      setData(response);
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
      
      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="metric-content">
            <h3>Total Alunos</h3>
            <p className="metric-value">{data.alunos}</p>
          </div>
        </div>

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

        <div className="metric-card danger">
          <div className="metric-icon">
            <i className="fa-solid fa-exclamation-triangle"></i>
          </div>
          <div className="metric-content">
            <h3>Atrasados</h3>
            <p className="metric-value">{data.atrasados}</p>
          </div>
        </div>

        <div className="metric-card primary">
          <div className="metric-icon">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div className="metric-content">
            <h3>Previsão Total</h3>
            <p className="metric-value">R$ {Number(data.previsao_total).toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card professor">
          <div className="metric-icon">
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
          <div className="metric-content">
            <h3>Total Professores</h3>
            <p className="metric-value">R$ {Number(data.total_professores).toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card church">
          <div className="metric-icon">
            <i className="fa-solid fa-church"></i>
          </div>
          <div className="metric-content">
            <h3>Total Igreja</h3>
            <p className="metric-value">R$ {Number(data.total_igreja).toFixed(2)}</p>
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
      </div>
    </div>
  );
};

