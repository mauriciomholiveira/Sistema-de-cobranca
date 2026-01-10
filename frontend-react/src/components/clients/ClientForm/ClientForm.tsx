import React, { useState, useEffect } from 'react';
import { useClients } from '../../../contexts/ClientContext';
import { useResources } from '../../../contexts/ResourceContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import type { ClientFormData, EnrollmentFormData, Enrollment } from '../../../types';
import './ClientForm.css';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: number | null;
}

export const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, clientId }) => {
  const { clients, createClient, updateClient, getClientEnrollments, createEnrollment, deleteEnrollment } = useClients();
  const { courses, professors, fetchResources } = useResources();
  
  const [formData, setFormData] = useState<ClientFormData>({
    nome: '',
    endereco: '',
    whatsapp: '',
  });
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<EnrollmentFormData[]>([]);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormData>({
    curso_id: 0,
    professor_id: 0,
    dia_vencimento: 10,
    valor_mensalidade: 0,
    valor_professor: 0,
    valor_igreja: 0,
  });

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData({
          nome: client.nome,
          endereco: client.endereco,
          whatsapp: client.whatsapp,
        });
        loadEnrollments();
      }
    } else {
      setFormData({ nome: '', endereco: '', whatsapp: '+55 ' });
      setEnrollments([]);
      setPendingEnrollments([]);
    }
  }, [clientId, clients]);

  const loadEnrollments = async () => {
    if (clientId) {
      const data = await getClientEnrollments(clientId);
      setEnrollments(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (clientId) {
        await updateClient(clientId, formData);
      } else {
        const newClient = await createClient(formData);
        
        // Save pending enrollments
        for (const enrollment of pendingEnrollments) {
          await createEnrollment(newClient.id, enrollment);
        }
        setPendingEnrollments([]);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
    }
  };

  const handleAddEnrollment = () => {
    if (enrollmentForm.curso_id && enrollmentForm.professor_id) {
      if (clientId) {
        createEnrollment(clientId, enrollmentForm).then(() => {
          loadEnrollments();
          setIsEnrollmentModalOpen(false);
          resetEnrollmentForm();
        });
      } else {
        setPendingEnrollments([...pendingEnrollments, enrollmentForm]);
        setIsEnrollmentModalOpen(false);
        resetEnrollmentForm();
      }
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: number) => {
    if (window.confirm('Remover esta matrícula?')) {
      await deleteEnrollment(enrollmentId);
      loadEnrollments();
    }
  };

  const handleRemovePending = (index: number) => {
    setPendingEnrollments(pendingEnrollments.filter((_, i) => i !== index));
  };

  const resetEnrollmentForm = () => {
    setEnrollmentForm({
      curso_id: 0,
      professor_id: 0,
      dia_vencimento: 10,
      valor_mensalidade: 0,
      valor_professor: 0,
      valor_igreja: 0,
    });
  };

  const handleCourseChange = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    setEnrollmentForm({
      ...enrollmentForm,
      curso_id: courseId,
      valor_mensalidade: course?.mensalidade_padrao || 0,
    });
  };

  const formatWhatsApp = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Se começar com 55, remove para não duplicar
    const cleanNumbers = numbers.startsWith('55') ? numbers.slice(2) : numbers;
    
    // Limita a 11 dígitos (DDD + número)
    const limited = cleanNumbers.slice(0, 11);
    
    // Aplica máscara: +55 (XX) XXXXX-XXXX ou +55 (XX) XXXX-XXXX
    if (limited.length === 0) return '+55 ';
    if (limited.length <= 2) return `+55 (${limited}`;
    if (limited.length <= 7) return `+55 (${limited.slice(0, 2)}) ${limited.slice(2)}`;
    if (limited.length <= 11) {
      return `+55 (${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
    return `+55 (${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setFormData({ ...formData, whatsapp: formatted });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={clientId ? 'Editar Cliente' : 'Novo Cliente'}>
        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-group">
            <label>Nome do Aluno</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Endereço</label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={handleWhatsAppChange}
              placeholder="+55 (48) 99999-9999"
              required
            />
          </div>

          <div className="enrollments-section">
            <div className="section-header">
              <h4>Matrículas (Cursos)</h4>
              <Button type="button" variant="secondary" onClick={() => setIsEnrollmentModalOpen(true)}>
                + Vincular Curso
              </Button>
            </div>

            {enrollments.length > 0 && (
              <div className="enrollments-list">
                {enrollments.map((e) => (
                  <div key={e.id} className="enrollment-item">
                    <div>
                      <strong>{e.nome_curso}</strong>
                      <span>Prof: {e.nome_professor} • Dia {e.dia_vencimento} • R$ {e.valor_mensalidade}</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteEnrollment(e.id)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pendingEnrollments.length > 0 && (
              <div className="pending-enrollments">
                <p className="pending-label">Pendentes (serão criadas ao salvar):</p>
                {pendingEnrollments.map((e, index) => {
                  const course = courses.find(c => c.id === e.curso_id);
                  const professor = professors.find(p => p.id === e.professor_id);
                  return (
                    <div key={index} className="enrollment-item pending">
                      <div>
                        <strong>{course?.nome}</strong>
                        <span>Prof: {professor?.nome} • Dia {e.dia_vencimento} • R$ {e.valor_mensalidade}</span>
                      </div>
                      <button type="button" onClick={() => handleRemovePending(index)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {enrollments.length === 0 && pendingEnrollments.length === 0 && (
              <p className="no-enrollments">Nenhum curso vinculado.</p>
            )}
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {clientId ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        title="Vincular Curso"
      >
        <div className="enrollment-form">
          <div className="form-group">
            <label>Curso</label>
            <select
              value={enrollmentForm.curso_id}
              onChange={(e) => handleCourseChange(Number(e.target.value))}
              required
            >
              <option value="">Selecione...</option>
              {courses.filter(c => c.active).map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Professor Responsável</label>
            <select
              value={enrollmentForm.professor_id}
              onChange={(e) => setEnrollmentForm({ ...enrollmentForm, professor_id: Number(e.target.value) })}
              required
            >
              <option value="">Selecione...</option>
              {professors.filter(p => p.active).map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dia Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={enrollmentForm.dia_vencimento}
                onChange={(e) => setEnrollmentForm({ ...enrollmentForm, dia_vencimento: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label>Valor Mensalidade (R$)</label>
              <input
                type="number"
                step="0.01"
                value={enrollmentForm.valor_mensalidade}
                onChange={(e) => setEnrollmentForm({ ...enrollmentForm, valor_mensalidade: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Professor Recebe (R$)</label>
              <input
                type="number"
                step="0.01"
                value={enrollmentForm.valor_professor}
                onChange={(e) => setEnrollmentForm({ ...enrollmentForm, valor_professor: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Igreja Recebe (R$)</label>
              <input
                type="number"
                step="0.01"
                value={enrollmentForm.valor_igreja}
                onChange={(e) => setEnrollmentForm({ ...enrollmentForm, valor_igreja: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsEnrollmentModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleAddEnrollment}>
              Salvar Vínculo
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
