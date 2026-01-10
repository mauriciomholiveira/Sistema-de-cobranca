import React, { useState, useEffect } from 'react';
import { useClients } from '../../../contexts/ClientContext';
import { useResources } from '../../../contexts/ResourceContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { fetchAddressByCep } from '../../../services/cepService';
import { parseAddress, formatAddress } from '../../../utils/formatters';
import type { AddressData } from '../../../utils/formatters';
import type { ClientFormData, EnrollmentFormData, Enrollment } from '../../../types';
import './ClientForm.css';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: number | null;
}

export const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, clientId }) => {
  const { clients, createClient, updateClient, getClientEnrollments, createEnrollment, updateEnrollment, deleteEnrollment } = useClients();
  const { courses, professors, fetchResources } = useResources();
  
  const [formData, setFormData] = useState<ClientFormData>({
    nome: '',
    endereco: '',
    whatsapp: '',
  });
  const [addressForm, setAddressForm] = useState<AddressData>(parseAddress(''));
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<EnrollmentFormData[]>([]);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<number | null>(null);
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

  // Auto-calculate church value when monthly fee or professor value changes
  useEffect(() => {
    if (enrollmentForm.valor_mensalidade > 0) {
      const churchValue = enrollmentForm.valor_mensalidade - enrollmentForm.valor_professor;
      if (churchValue !== enrollmentForm.valor_igreja) {
        setEnrollmentForm(prev => ({
          ...prev,
          valor_igreja: Math.max(0, churchValue)
        }));
      }
    }
  }, [enrollmentForm.valor_mensalidade, enrollmentForm.valor_professor]);

  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData({
          nome: client.nome,
          endereco: client.endereco,
          whatsapp: client.whatsapp,
        });
        setAddressForm(parseAddress(client.endereco));
        loadEnrollments();
      }
    } else {
      setFormData({ nome: '', endereco: '', whatsapp: '+55 ' });
      setAddressForm(parseAddress(''));
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

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCep = e.target.value;
    setAddressForm({ ...addressForm, cep: newCep });

    const cleanCep = newCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const address = await fetchAddressByCep(cleanCep);
      if (address) {
        setAddressForm(prev => ({
          ...prev,
          cep: newCep,
          logradouro: address.logradouro,
          bairro: address.bairro,
          cidade: address.localidade,
          uf: address.uf
        }));
        // Optional: Focus number field
        document.getElementById('client-address-number')?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        endereco: formatAddress(addressForm)
      };

      if (clientId) {
        await updateClient(clientId, payload);
      } else {
        const newClient = await createClient(payload);
        
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
        if (editingEnrollmentId) {
          // Update existing enrollment
          updateEnrollment(editingEnrollmentId, enrollmentForm).then(() => {
            loadEnrollments();
            setIsEnrollmentModalOpen(false);
            resetEnrollmentForm();
            setEditingEnrollmentId(null);
          });
        } else {
          // Create new enrollment
          createEnrollment(clientId, enrollmentForm).then(() => {
            loadEnrollments();
            setIsEnrollmentModalOpen(false);
            resetEnrollmentForm();
          });
        }
      } else {
        setPendingEnrollments([...pendingEnrollments, enrollmentForm]);
        setIsEnrollmentModalOpen(false);
        resetEnrollmentForm();
      }
    }
  };

  const handleEditEnrollment = (enrollment: Enrollment) => {
    setEnrollmentForm({
      curso_id: enrollment.curso_id,
      professor_id: enrollment.professor_id,
      dia_vencimento: enrollment.dia_vencimento,
      valor_mensalidade: enrollment.valor_mensalidade,
      valor_professor: enrollment.valor_professor,
      valor_igreja: enrollment.valor_igreja,
    });
    setEditingEnrollmentId(enrollment.id);
    setIsEnrollmentModalOpen(true);
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
    setEditingEnrollmentId(null);
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
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Endereço</label>
            
            <div className="form-row">
              <div className="form-group" style={{ flex: '0 0 120px' }}>
                <label>CEP</label>
                <input
                  type="text"
                  value={addressForm.cep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Logradouro (Rua/Av)</label>
                <input
                  type="text"
                  value={addressForm.logradouro}
                  onChange={(e) => setAddressForm({ ...addressForm, logradouro: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: '0 0 80px' }}>
                <label>Nº</label>
                <input
                  id="client-address-number"
                  type="text"
                  value={addressForm.numero}
                  onChange={(e) => setAddressForm({ ...addressForm, numero: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bairro</label>
                <input
                  type="text"
                  value={addressForm.bairro}
                  onChange={(e) => setAddressForm({ ...addressForm, bairro: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Complemento</label>
                <input
                  type="text"
                  value={addressForm.complemento}
                  onChange={(e) => setAddressForm({ ...addressForm, complemento: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cidade</label>
                <input
                  type="text"
                  value={addressForm.cidade}
                  onChange={(e) => setAddressForm({ ...addressForm, cidade: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: '0 0 80px' }}>
                <label>UF</label>
                <input
                  type="text"
                  value={addressForm.uf}
                  onChange={(e) => setAddressForm({ ...addressForm, uf: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>
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
                    <div className="enrollment-actions">
                      <button type="button" onClick={() => handleEditEnrollment(e)} title="Editar matrícula">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button type="button" onClick={() => handleDeleteEnrollment(e.id)} title="Excluir matrícula">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
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
        onClose={() => {
          setIsEnrollmentModalOpen(false);
          resetEnrollmentForm();
        }}
        title={editingEnrollmentId ? "Editar Matrícula" : "Vincular Curso"}
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
                readOnly
                disabled
                style={{ backgroundColor: '#1e293b', cursor: 'not-allowed' }}
              />
              <small style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Calculado automaticamente: Mensalidade - Professor
              </small>
            </div>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => {
              setIsEnrollmentModalOpen(false);
              resetEnrollmentForm();
            }}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleAddEnrollment}>
              {editingEnrollmentId ? 'Atualizar Vínculo' : 'Salvar Vínculo'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
