import React, { useState, useEffect } from 'react';
import { useResources } from '../../../contexts/ResourceContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { api } from '../../../services/api';
import './Management.css';

export const Management: React.FC = () => {
  const { courses, professors, fetchResources } = useResources();
  const [activeTab, setActiveTab] = useState<'courses' | 'professors' | 'templates'>('courses');
  
  // Course state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState({ nome: '', mensalidade_padrao: 0 });
  
  // Professor state
  const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);
  const [editingProfessorId, setEditingProfessorId] = useState<number | null>(null);
  const [professorForm, setProfessorForm] = useState<any>({ nome: '', email: '', data_nascimento: '', pix: '', cpf: '', contato: '', endereco: '', dados_bancarios: '', senha: '', confirmSenha: '' });
  
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
          data_nascimento: professor.data_nascimento ? professor.data_nascimento.split('T')[0] : '', // Format date for input
          pix: professor.pix || '',
          cpf: professor.cpf || '',
          contato: professor.contato || '',
          endereco: professor.endereco || '',
          dados_bancarios: professor.dados_bancarios || '',
          senha: '',
          confirmSenha: ''
        });
        setEditingProfessorId(professorId);
      }
    } else {
      setProfessorForm({ nome: '', email: '', data_nascimento: '', pix: '', cpf: '', contato: '', endereco: '', dados_bancarios: '', senha: '', confirmSenha: '' });
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
      if (editingProfessorId) {
        await api.put(`/professores/${editingProfessorId}`, professorForm);
      } else {
        await api.post('/professores', professorForm);
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
            {professors.filter(p => p.active).map(professor => (
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

      {/* Course Modal */}
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
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={professorForm.email || ''}
              onChange={(e) => setProfessorForm({ ...professorForm, email: e.target.value })}
            />
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

          <div className="form-group">
            <label>Endereço</label>
            <input
              type="text"
              value={professorForm.endereco || ''}
              onChange={(e) => setProfessorForm({ ...professorForm, endereco: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Dados Bancários (Completo)</label>
            <textarea
              rows={3}
              value={professorForm.dados_bancarios || ''}
              onChange={(e) => setProfessorForm({ ...professorForm, dados_bancarios: e.target.value })}
              placeholder="Agência, Conta, Banco..."
            />
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
