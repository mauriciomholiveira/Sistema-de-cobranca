import React, { useState, useEffect } from 'react';
import { useResources } from '../../../contexts/ResourceContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { api } from '../../../services/api';
import { fetchAddressByCep } from '../../../services/cepService';
import { parseAddress, parseBankData, formatAddress, formatBankData } from '../../../utils/formatters';
import type { AddressData, BankData } from '../../../utils/formatters';
import './Management.css';

export const Management: React.FC = () => {
  const { user } = useAuth();
  const { courses, professors, fetchResources } = useResources();
  const [activeTab, setActiveTab] = useState<'courses' | 'professors' | 'templates' | 'settings'>('courses');
  
  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    schoolName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Load school name
    const storedName = localStorage.getItem('premium_sys_school_name');
    if (storedName) {
      setSettingsForm(prev => ({ ...prev, schoolName: storedName }));
    }
    // Load user email if available
    // We might need to fetch user details first if not in context
    if (user && user.email) {
       setSettingsForm(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);
  
  // Course state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState({ nome: '', mensalidade_padrao: 0 });
  
  
  // Professor state
  const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);
  const [editingProfessorId, setEditingProfessorId] = useState<number | null>(null);
  const [professorForm, setProfessorForm] = useState<any>({ 
    nome: '', 
    email: '', 
    whatsapp: '', 
    data_nascimento: '', 
    pix: '', 
    cpf: '', 
    contato: '', 
    endereco: '', 
    dados_bancarios: '', 
    senha: '', 
    confirmSenha: '',
    can_send_messages: false // Initialize
  });
  const [addressForm, setAddressForm] = useState<AddressData>(parseAddress(''));
  const [bankForm, setBankForm] = useState<BankData>(parseBankData(''));
  
  // Template state
  const [templates, setTemplates] = useState<any[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [templateForm, setTemplateForm] = useState({ nome: '', mensagem: '' });

  useEffect(() => {
    fetchResources();
    fetchTemplates();
  }, [fetchResources]);

  const fetchTemplates = async () => {
    try {
      const data = await api.get<any[]>('/templates');
      setTemplates(data);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    }
  };

  // Course handlers
  const handleOpenCourseModal = (courseId?: number) => {
    if (courseId) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setCourseForm({ nome: course.nome, mensalidade_padrao: course.mensalidade_padrao });
        setEditingCourseId(courseId);
      }
    } else {
      setCourseForm({ nome: '', mensalidade_padrao: 0 });
      setEditingCourseId(null);
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await api.put(`/cursos/${editingCourseId}`, courseForm);
      } else {
        await api.post('/cursos', courseForm);
      }
      setIsCourseModalOpen(false);
      fetchResources();
    } catch (err) {
      console.error('Erro ao salvar curso:', err);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (window.confirm('Excluir este curso?')) {
      try {
        await api.put(`/cursos/${id}`, { active: false });
        fetchResources();
      } catch (err) {
        console.error('Erro ao excluir curso:', err);
      }
    }
  };

  // Professor handlers
  const handleOpenProfessorModal = (professorId?: number) => {
    if (professorId) {
      const professor = professors.find(p => p.id === professorId);
      if (professor) {

        setProfessorForm({ 
          nome: professor.nome,
          email: professor.email || '',
          whatsapp: professor.whatsapp || '',
          data_nascimento: professor.data_nascimento ? professor.data_nascimento.split('T')[0] : '', // Format date for input
          pix: professor.pix || '',
          cpf: professor.cpf || '',
          contato: professor.contato || '',
          endereco: professor.endereco || '',
          dados_bancarios: professor.dados_bancarios || '',
          senha: '',
          confirmSenha: '',
          can_send_messages: professor.can_send_messages || false
        });
        setAddressForm(parseAddress(professor.endereco));
        setBankForm(parseBankData(professor.dados_bancarios));
        setEditingProfessorId(professorId);
      }
    } else {
      setProfessorForm({ 
        nome: '', 
        email: '', 
        whatsapp: '', 
        data_nascimento: '', 
        pix: '', 
        cpf: '', 
        contato: '', 
        endereco: '', 
        dados_bancarios: '', 
        senha: '', 
        confirmSenha: '',
        can_send_messages: false
      });
      setAddressForm(parseAddress(''));
      setBankForm(parseBankData(''));
      setEditingProfessorId(null);
    }
    setIsProfessorModalOpen(true);
  };

  const handleSaveProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (professorForm.senha !== professorForm.confirmSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    try {
      const payload = {
        ...professorForm,
        endereco: formatAddress(addressForm),
        dados_bancarios: formatBankData(bankForm)
      };

      if (editingProfessorId) {
        await api.put(`/professores/${editingProfessorId}`, payload);
      } else {
        await api.post('/professores', payload);
      }
      setIsProfessorModalOpen(false);
      fetchResources();
    } catch (err) {
      console.error('Erro ao salvar professor:', err);
    }
  };

  const handleDeleteProfessor = async (id: number) => {
    if (window.confirm('Excluir este professor?')) {
      try {
        await api.put(`/professores/${id}`, { active: false });
        fetchResources();
      } catch (err) {
        console.error('Erro ao excluir professor:', err);
      }
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
        document.getElementById('address-number')?.focus();
      }
    }
  };

  // Template handlers
  const handleOpenTemplateModal = (templateId?: number) => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setTemplateForm({ nome: template.nome, mensagem: template.mensagem });
        setEditingTemplateId(templateId);
      }
    } else {
      setTemplateForm({ nome: '', mensagem: '' });
      setEditingTemplateId(null);
    }
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplateId) {
        await api.put(`/templates/${editingTemplateId}`, templateForm);
      } else {
        await api.post('/templates', templateForm);
      }
      setIsTemplateModalOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error('Erro ao salvar template:', err);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (window.confirm('Excluir este template?')) {
      try {
        await api.put(`/templates/${id}`, { active: false });
        fetchTemplates();
      } catch (err) {
        console.error('Erro ao excluir template:', err);
      }
    }
  };

  return (
    <div className="management-container">
      <h2>Gestão</h2>

      <div className="tabs">
        <button
          className={activeTab === 'courses' ? 'active' : ''}
          onClick={() => setActiveTab('courses')}
        >
          <i className="fa-solid fa-book"></i>
          Cursos
        </button>
        <button
          className={activeTab === 'professors' ? 'active' : ''}
          onClick={() => setActiveTab('professors')}
        >
          <i className="fa-solid fa-chalkboard-user"></i>
          Professores
        </button>
        <button
          className={activeTab === 'templates' ? 'active' : ''}
          onClick={() => setActiveTab('templates')}
        >
          <i className="fa-solid fa-message"></i>
          Templates
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          <i className="fa-solid fa-user-gear"></i>
          Minha Conta
        </button>
      </div>

      {activeTab === 'courses' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>Cursos Cadastrados</h3>
            <Button variant="primary" icon="fa-plus" onClick={() => handleOpenCourseModal()}>
              Novo Curso
            </Button>
          </div>

          <div className="items-grid">
            {courses.filter(c => c.active).map(course => (
              <div key={course.id} className="item-card">
                <div className="item-info">
                  <h4>{course.nome}</h4>
                  <p>Mensalidade padrão: R$ {Number(course.mensalidade_padrao).toFixed(2)}</p>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleOpenCourseModal(course.id)}>
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => handleDeleteCourse(course.id)} className="danger">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'professors' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>Professores Cadastrados</h3>
            <Button variant="primary" icon="fa-plus" onClick={() => handleOpenProfessorModal()}>
              Novo Professor
            </Button>
          </div>

          <div className="items-grid">
            {professors.filter(p => p.active && !p.is_admin).map(professor => ( 
              <div key={professor.id} className="item-card">
                <div className="item-info">
                  <h4>{professor.nome}</h4>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleOpenProfessorModal(professor.id)}>
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => handleDeleteProfessor(professor.id)} className="danger">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>Templates de Mensagem</h3>
            <Button variant="primary" icon="fa-plus" onClick={() => handleOpenTemplateModal()}>
              Novo Template
            </Button>
          </div>

          <div className="items-grid">
            {templates.filter(t => t.active).map(template => (
              <div key={template.id} className="item-card">
                <div className="item-info">
                  <h4>{template.nome}</h4>
                  <p className="template-preview">{template.mensagem.substring(0, 100)}...</p>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleOpenTemplateModal(template.id)}>
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => handleDeleteTemplate(template.id)} className="danger">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>Dados da Escola & Administrador</h3>
          </div>
          
          <div className="settings-container">
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              if (settingsForm.password && settingsForm.password !== settingsForm.confirmPassword) {
                alert('As senhas não coincidem!');
                return;
              }

              try {
                // 1. Save School Name Local
                if (settingsForm.schoolName) {
                  localStorage.setItem('premium_sys_school_name', settingsForm.schoolName);
                  // Dispatch event so Sidebar updates immediately
                  window.dispatchEvent(new Event('school_name_updated'));
                }

                // 2. Update Admin User (Email/Pass) via API
                const payload: any = {};
                if (settingsForm.email) payload.email = settingsForm.email;
                if (settingsForm.password) payload.senha = settingsForm.password;

                if (user?.id && (payload.email || payload.password)) {
                  await api.put(`/professores/${user.id}`, payload);
                }

                alert('Configurações salvas com sucesso!');
                setSettingsForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
              } catch (err) {
                console.error(err);
                alert('Erro ao salvar configurações.');
              }
            }} className="management-form" style={{ maxWidth: '600px' }}>
              
              <div className="form-group">
                <label>Nome da Escola (Exibido no Menu)</label>
                <input
                  type="text"
                  value={settingsForm.schoolName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, schoolName: e.target.value })}
                  placeholder="Minha Escola de Música"
                />
              </div>

              <div className="section-divider">
                <span>Dados de Acesso (Admin)</span>
              </div>

              <div className="form-group">
                <label>Email de Login</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nova Senha</label>
                  <input
                    type="password"
                    value={settingsForm.password}
                    onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                    placeholder="Deixe em branco para manter"
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={settingsForm.confirmPassword}
                    onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })}
                    placeholder="Repita a senha"
                  />
                </div>
              </div>

              <div className="form-actions">
                <Button type="submit" variant="primary">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={editingCourseId ? 'Editar Curso' : 'Novo Curso'}
      >
        <form onSubmit={handleSaveCourse} className="management-form">
          <div className="form-group">
            <label>Nome do Curso</label>
            <input
              type="text"
              value={courseForm.nome}
              onChange={(e) => setCourseForm({ ...courseForm, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Mensalidade Padrão (R$)</label>
            <input
              type="number"
              step="0.01"
              value={courseForm.mensalidade_padrao}
              onChange={(e) => setCourseForm({ ...courseForm, mensalidade_padrao: Number(e.target.value) })}
              required
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsCourseModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Professor Modal */}
      <Modal
        isOpen={isProfessorModalOpen}
        onClose={() => setIsProfessorModalOpen(false)}
        title={editingProfessorId ? 'Editar Professor' : 'Novo Professor'}
      >
        <form onSubmit={handleSaveProfessor} className="management-form">
          <div className="form-group">
            <label>Nome do Professor</label>
            <input
              type="text"
              value={professorForm.nome}
              onChange={(e) => setProfessorForm({ ...professorForm, nome: e.target.value })}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={professorForm.email || ''}
                onChange={(e) => setProfessorForm({ ...professorForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>WhatsApp</label>
              <input
                type="text"
                value={professorForm.whatsapp || ''}
                onChange={(e) => setProfessorForm({ ...professorForm, whatsapp: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de Nascimento</label>
              <input
                type="date"
                value={professorForm.data_nascimento || ''}
                onChange={(e) => setProfessorForm({ ...professorForm, data_nascimento: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>CPF</label>
              <input
                type="text"
                value={professorForm.cpf || ''}
                onChange={(e) => setProfessorForm({ ...professorForm, cpf: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
             <div className="form-group">
              <label>Chave Pix</label>
              <input
                type="text"
                value={professorForm.pix || ''}
                onChange={(e) => setProfessorForm({ ...professorForm, pix: e.target.value })}
              />
            </div>
             <div className="form-group">
              <label>Contato</label>
              <input
                type="text"
                value={professorForm.contato || ''}
                onChange={(e) => setProfessorForm({ ...professorForm, contato: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="can_send_messages"
                checked={professorForm.can_send_messages}
                onChange={(e) => setProfessorForm({ ...professorForm, can_send_messages: e.target.checked })}
                style={{ width: 'auto', margin: 0 }}
              />
              <label htmlFor="can_send_messages" style={{ margin: 0, fontWeight: 'normal' }}>
                Permitir envio de mensagens de cobrança (WhatsApp)
              </label>
            </div>
          </div>

          <div className="section-divider">
            <span>Endereço</span>
          </div>
          
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
                id="address-number"
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

          <div className="section-divider">
            <span>Dados Bancários</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Banco</label>
              <input
                type="text"
                value={bankForm.banco}
                onChange={(e) => setBankForm({ ...bankForm, banco: e.target.value })}
                placeholder="Ex: Nubank, Inter..."
              />
            </div>
            <div className="form-group">
              <label>Tipo de Conta</label>
              <select
                value={bankForm.tipo_conta}
                onChange={(e) => setBankForm({ ...bankForm, tipo_conta: e.target.value })}
              >
                <option value="Corrente">Corrente</option>
                <option value="Poupança">Poupança</option>
                <option value="Pagamento">Pagamento</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Agência</label>
              <input
                type="text"
                value={bankForm.agencia}
                onChange={(e) => setBankForm({ ...bankForm, agencia: e.target.value })}
              />
            </div>
             <div className="form-group">
              <label>Conta (com dígito)</label>
              <input
                type="text"
                value={bankForm.conta}
                onChange={(e) => setBankForm({ ...bankForm, conta: e.target.value })}
              />
            </div>
          </div>

          {!editingProfessorId && (
            <>
              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={professorForm.senha || ''}
                  onChange={(e) => setProfessorForm({ ...professorForm, senha: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Confirmar Senha</label>
                <input
                  type="password"
                  value={professorForm.confirmSenha || ''}
                  onChange={(e) => setProfessorForm({ ...professorForm, confirmSenha: e.target.value })}
                />
              </div>
            </>
          )}

           {editingProfessorId && (
            <>
              <div className="form-group">
                <label>Nova Senha (deixe em branco para manter)</label>
                <input
                  type="password"
                  value={professorForm.senha || ''}
                  onChange={(e) => setProfessorForm({ ...professorForm, senha: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsProfessorModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={editingTemplateId ? 'Editar Template' : 'Novo Template'}
      >
        <form onSubmit={handleSaveTemplate} className="management-form">
          <div className="form-group">
            <label>Nome do Template</label>
            <input
              type="text"
              value={templateForm.nome}
              onChange={(e) => setTemplateForm({ ...templateForm, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Mensagem</label>
            <textarea
              rows={6}
              value={templateForm.mensagem}
              onChange={(e) => setTemplateForm({ ...templateForm, mensagem: e.target.value })}
              placeholder="Use {nome}, {curso}, {valor} para personalizar"
              required
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
