import React, { useState, useEffect, useContext, useRef } from 'react';
import styles from './taskdevelopment.module.css';
import { toast } from 'react-toastify';
import { UserContext } from '../../context/UserContext';
import developerTaskService from '../../services/developerTaskService';
import {
  FaCode,
  FaSpinner,
  FaFilter,
  FaSearch,
  FaPaperPlane,
  FaImage,
  FaTimes,
  FaPlus,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaEye,
  FaTrash
} from 'react-icons/fa';
import { ModalConfirm } from '../../components/ModalConfirm';

const TaskDevelopment = () => {
  const { operatorData } = useContext(UserContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('media');
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Estado para modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const fileInputRef = useRef(null);

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: '#faa01c', icon: FaClock },
    { value: 'em_andamento', label: 'Em Andamento', color: '#385bad', icon: FaSpinner },
    { value: 'concluido', label: 'Concluído', color: '#28a745', icon: FaCheckCircle },
    { value: 'cancelado', label: 'Cancelado', color: '#c70000', icon: FaBan }
  ];

  const priorityOptions = [
    { value: 'baixa', label: 'Baixa', color: '#28a745' },
    { value: 'media', label: 'Normal', color: '#385bad' },
    { value: 'alta', label: 'Alta', color: '#c70000' }
  ];

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await developerTaskService.getTasks();
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.warning(`${file.name} não é uma imagem válida`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning(`${file.name} excede o limite de 5MB`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);

    // Gerar previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, { file, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warning('Por favor, informe o título da tarefa');
      return;
    }

    if (!description.trim()) {
      toast.warning('Por favor, descreva a tarefa');
      return;
    }

    try {
      setSending(true);
      setUploading(images.length > 0);

      // Upload das imagens
      let imageUrls = [];
      if (images.length > 0) {
        try {
          imageUrls = await developerTaskService.uploadMultipleImages(images);
        } catch (uploadError) {
          console.error('Erro ao fazer upload das imagens:', uploadError);
          toast.error('Erro ao fazer upload das imagens. A tarefa será criada sem imagens.');
        }
      }

      setUploading(false);

      // Criar tarefa
      await developerTaskService.createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        images: imageUrls,
        adminId: operatorData?.operator_code_id
      });

      toast.success('Tarefa enviada com sucesso!');
      
      // Limpar form
      setTitle('');
      setDescription('');
      setPriority('media');
      setImages([]);
      setPreviewImages([]);
      setShowForm(false);
      
      fetchTasks();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      setDeleting(true);
      await developerTaskService.deleteTask(taskToDelete.id);
      toast.success('Tarefa excluída com sucesso!');
      setShowDeleteModal(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || '#666';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.label || status;
  };

  const getPriorityColor = (priority) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption?.color || '#385bad';
  };

  const getPriorityLabel = (priority) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption?.label || priority;
  };

  const isTaskCreator = (task) => {
    if (!task || !operatorData?.operator_code_id) return false;
    const creatorId = task.admin_created_by ?? task.admin?.operator_code_id;
    return Number(creatorId) === Number(operatorData.operator_code_id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTasks = tasks
    .filter(task => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesSearch = searchTerm === '' || 
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // Prioridade alta primeiro
      if (a.priority === 'alta' && b.priority !== 'alta') return -1;
      if (a.priority !== 'alta' && b.priority === 'alta') return 1;
      // Concluídos por último
      if (a.status === 'concluido' && b.status !== 'concluido') return 1;
      if (a.status !== 'concluido' && b.status === 'concluido') return -1;
      // Por data
      return new Date(b.created_at) - new Date(a.created_at);
    });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <p>Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>
            <FaCode /> Tarefas de Desenvolvimento
          </h1>
          <p className={styles.subtitle}>Envie tarefas para o desenvolvedor</p>
        </div>
        <button 
          className={styles.btnNewTask}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          {showForm ? 'Cancelar' : 'Nova Tarefa'}
        </button>
      </header>

      {/* Formulário de nova tarefa */}
      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <h3><FaPaperPlane /> Criar Nova Tarefa</h3>
            </div>
            
            <div className={styles.formBody}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Título da Tarefa *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Corrigir bug no formulário de doação"
                    required
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Prioridade</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    {priorityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Descrição Detalhada *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva em detalhes o que precisa ser feito, incluindo passos para reproduzir problemas, comportamento esperado, etc..."
                  rows={5}
                  required
                />
              </div>

              {/* Upload de imagens */}
              <div className={styles.imageUploadSection}>
                <label>
                  <FaImage /> Anexar Imagens (opcional)
                </label>
                <p className={styles.imageHint}>
                  Adicione capturas de tela ou imagens que ajudem a ilustrar a tarefa. Máx. 5MB por imagem.
                </p>
                
                <div className={styles.imageUploadArea}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className={styles.fileInput}
                  />
                  <button 
                    type="button" 
                    className={styles.btnUpload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaPlus /> Adicionar Imagens
                  </button>
                </div>

                {previewImages.length > 0 && (
                  <div className={styles.previewGrid}>
                    {previewImages.map((img, index) => (
                      <div key={index} className={styles.previewItem}>
                        <img src={img.preview} alt={`Preview ${index + 1}`} />
                        <button 
                          type="button"
                          className={styles.removeImage}
                          onClick={() => removeImage(index)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formFooter}>
              <button 
                type="button" 
                className={styles.btnCancel}
                onClick={() => {
                  setShowForm(false);
                  setTitle('');
                  setDescription('');
                  setPriority('media');
                  setImages([]);
                  setPreviewImages([]);
                }}
              >
                <FaTimes /> Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <FaSpinner className={styles.spinner} />
                    {uploading ? 'Enviando imagens...' : 'Criando tarefa...'}
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Enviar Tarefa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterBox}>
          <FaFilter className={styles.filterIcon} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Todos os Status</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{tasks.length}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#faa01c' }}>
          <span className={styles.statNumber} style={{ color: '#faa01c' }}>
            {tasks.filter(t => t.status === 'pendente').length}
          </span>
          <span className={styles.statLabel}>Pendentes</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#385bad' }}>
          <span className={styles.statNumber} style={{ color: '#385bad' }}>
            {tasks.filter(t => t.status === 'em_andamento').length}
          </span>
          <span className={styles.statLabel}>Em Andamento</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#28a745' }}>
          <span className={styles.statNumber} style={{ color: '#28a745' }}>
            {tasks.filter(t => t.status === 'concluido').length}
          </span>
          <span className={styles.statLabel}>Concluídos</span>
        </div>
      </div>

      {/* Lista de tarefas */}
      <div className={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <FaCode className={styles.emptyIcon} />
            <p>Nenhuma tarefa encontrada</p>
            <span>Clique em "Nova Tarefa" para criar uma nova solicitação</span>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className={`${styles.taskCard} ${task.priority === 'alta' && task.status !== 'concluido' ? styles.priorityTask : ''}`}
              style={{ borderLeftColor: task.priority === 'alta' && task.status !== 'concluido' ? '#c70000' : getStatusColor(task.status) }}
            >
              {task.priority === 'alta' && task.status !== 'concluido' && (
                <span className={styles.priorityBadge}>
                  <FaExclamationTriangle /> Alta Prioridade
                </span>
              )}
              
              <div className={styles.taskHeader}>
                <h4 className={styles.taskTitle}>{task.title}</h4>
                <div 
                  className={styles.statusBadge}
                  style={{
                    backgroundColor: `${getStatusColor(task.status)}20`,
                    color: getStatusColor(task.status),
                    borderColor: getStatusColor(task.status)
                  }}
                >
                  {getStatusLabel(task.status)}
                </div>
              </div>

              <div className={styles.taskPreview}>
                <p>{task.description?.substring(0, 150)}{task.description?.length > 150 ? '...' : ''}</p>
              </div>

              <div className={styles.taskMeta}>
                <div className={styles.metaItem}>
                  <label>Criado em</label>
                  <span>{formatDate(task.created_at)}</span>
                </div>
                <div className={styles.metaItem}>
                  <label>Prioridade</label>
                  <span style={{ color: getPriorityColor(task.priority) }}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
                {task.images?.length > 0 && (
                  <div className={styles.metaItem}>
                    <label>Anexos</label>
                    <span><FaImage /> {task.images.length} imagem(ns)</span>
                  </div>
                )}
              </div>

              {task.developer_response && (
                <div className={styles.developerResponse}>
                  <label>Resposta do Desenvolvedor:</label>
                  <p>{task.developer_response}</p>
                </div>
              )}

              <div className={styles.taskActions}>
                <button
                  className={styles.btnDetails}
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  <FaEye /> {expandedTask === task.id ? 'Ocultar' : 'Ver Detalhes'}
                </button>
                {task.status === 'pendente' && isTaskCreator(task) && (
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleDeleteClick(task)}
                    title="Excluir tarefa"
                  >
                    <FaTrash /> Excluir
                  </button>
                )}
              </div>

              {/* Detalhes expandidos */}
              {expandedTask === task.id && (
                <div className={styles.expandedDetails}>
                  <div className={styles.fullDescription}>
                    <label>Descrição Completa:</label>
                    <p>{task.description}</p>
                  </div>
                  
                  {task.images?.length > 0 && (
                    <div className={styles.taskImages}>
                      <label>Imagens Anexadas:</label>
                      <div className={styles.imageGrid}>
                        {task.images.map((img, idx) => (
                          <a 
                            key={idx} 
                            href={img} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.imageLink}
                          >
                            <img src={img} alt={`Anexo ${idx + 1}`} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <ModalConfirm
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Excluir Tarefa"
        message={`Tem certeza que deseja excluir a tarefa "${taskToDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmText={deleting ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
      />
    </div>
  );
};

export default TaskDevelopment;

