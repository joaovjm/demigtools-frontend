import React, { useState, useEffect, useContext } from 'react';
import styles from './tasktodeveloper.module.css';
import { toast } from 'react-toastify';
import { UserContext } from '../../context/UserContext';
import developerTaskService from '../../services/developerTaskService';
import {
  FaCode,
  FaSpinner,
  FaFilter,
  FaSearch,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaChevronDown,
  FaChevronUp,
  FaImage,
  FaSave,
  FaTimes,
  FaPlay
} from 'react-icons/fa';

const TaskToDeveloper = () => {
  const { operatorData } = useContext(UserContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTasks, setExpandedTasks] = useState({});
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [responseText, setResponseText] = useState({});

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: '#faa01c', icon: FaClock },
    { value: 'em_andamento', label: 'Em Andamento', color: '#385bad', icon: FaPlay },
    { value: 'concluido', label: 'Concluído', color: '#28a745', icon: FaCheckCircle },
    { value: 'cancelado', label: 'Cancelado', color: '#c70000', icon: FaBan }
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

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      
      const response = responseText[taskId] || null;
      await developerTaskService.updateTaskStatus(taskId, newStatus, response);
      
      toast.success('Status atualizado com sucesso!');
      fetchTasks();
      
      // Limpar resposta após salvar
      if (response) {
        setResponseText(prev => ({ ...prev, [taskId]: '' }));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSaveResponse = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      setUpdatingTaskId(taskId);
      
      const response = responseText[taskId] || '';
      await developerTaskService.updateTaskStatus(taskId, task.status, response);
      
      toast.success('Resposta salva com sucesso!');
      fetchTasks();
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      toast.error('Erro ao salvar resposta');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || '#666';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.label || status;
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

  const getPriorityLabel = (priority) => {
    const labels = { baixa: 'Baixa', media: 'Normal', alta: 'Alta' };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const colors = { baixa: '#28a745', media: '#385bad', alta: '#c70000' };
    return colors[priority] || '#385bad';
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
      if (a.priority === 'alta' && b.priority !== 'alta' && a.status !== 'concluido') return -1;
      if (a.priority !== 'alta' && b.priority === 'alta' && b.status !== 'concluido') return 1;
      // Concluídos por último
      if (a.status === 'concluido' && b.status !== 'concluido') return 1;
      if (a.status !== 'concluido' && b.status === 'concluido') return -1;
      // Em andamento antes de pendentes
      if (a.status === 'em_andamento' && b.status === 'pendente') return -1;
      if (a.status === 'pendente' && b.status === 'em_andamento') return 1;
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
        <h1>
          <FaCode /> Tarefas para Desenvolvimento
        </h1>
        <p className={styles.subtitle}>Gerencie as tarefas enviadas pelos administradores</p>
      </header>

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
        <button 
          className={`${styles.statCard} ${filterStatus === 'all' ? styles.statCardActive : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          <span className={styles.statNumber}>{tasks.length}</span>
          <span className={styles.statLabel}>Total</span>
        </button>
        <button 
          className={`${styles.statCard} ${filterStatus === 'pendente' ? styles.statCardActive : ''}`}
          onClick={() => setFilterStatus('pendente')}
          style={{ borderColor: '#faa01c' }}
        >
          <span className={styles.statNumber} style={{ color: '#faa01c' }}>
            {tasks.filter(t => t.status === 'pendente').length}
          </span>
          <span className={styles.statLabel}>Pendentes</span>
        </button>
        <button 
          className={`${styles.statCard} ${filterStatus === 'em_andamento' ? styles.statCardActive : ''}`}
          onClick={() => setFilterStatus('em_andamento')}
          style={{ borderColor: '#385bad' }}
        >
          <span className={styles.statNumber} style={{ color: '#385bad' }}>
            {tasks.filter(t => t.status === 'em_andamento').length}
          </span>
          <span className={styles.statLabel}>Em Andamento</span>
        </button>
        <button 
          className={`${styles.statCard} ${filterStatus === 'concluido' ? styles.statCardActive : ''}`}
          onClick={() => setFilterStatus('concluido')}
          style={{ borderColor: '#28a745' }}
        >
          <span className={styles.statNumber} style={{ color: '#28a745' }}>
            {tasks.filter(t => t.status === 'concluido').length}
          </span>
          <span className={styles.statLabel}>Concluídos</span>
        </button>
      </div>

      {/* Lista de tarefas */}
      <div className={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <FaCode className={styles.emptyIcon} />
            <p>Nenhuma tarefa encontrada</p>
            <span>Não há tarefas pendentes no momento</span>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isExpanded = expandedTasks[task.id];
            const isUpdating = updatingTaskId === task.id;
            
            return (
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

                {/* Header com título e expansão */}
                <div className={styles.taskHeader} onClick={() => toggleExpand(task.id)}>
                  <div className={styles.taskHeaderLeft}>
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    <div className={styles.taskHeaderMeta}>
                      <span className={styles.adminName}>
                        Por: {task.admin?.operator_name || 'Admin'}
                      </span>
                      <span className={styles.taskDate}>
                        {formatDate(task.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.taskHeaderRight}>
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
                    <button className={styles.expandBtn}>
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>

                {/* Preview da descrição (sempre visível) */}
                {!isExpanded && (
                  <div className={styles.taskPreview}>
                    <p>{task.description?.substring(0, 150)}{task.description?.length > 150 ? '...' : ''}</p>
                    {task.images?.length > 0 && (
                      <span className={styles.attachmentHint}>
                        <FaImage /> {task.images.length} imagem(ns) anexada(s)
                      </span>
                    )}
                  </div>
                )}

                {/* Conteúdo expandido */}
                {isExpanded && (
                  <div className={styles.expandedContent}>
                    {/* Descrição completa */}
                    <div className={styles.fullDescription}>
                      <label>Descrição:</label>
                      <p>{task.description}</p>
                    </div>

                    {/* Metadados */}
                    <div className={styles.taskMeta}>
                      <div className={styles.metaItem}>
                        <label>Prioridade</label>
                        <span style={{ color: getPriorityColor(task.priority) }}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      <div className={styles.metaItem}>
                        <label>Criado em</label>
                        <span>{formatDate(task.created_at)}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <label>Atualizado em</label>
                        <span>{formatDate(task.updated_at)}</span>
                      </div>
                      {task.completed_at && (
                        <div className={styles.metaItem}>
                          <label>Concluído em</label>
                          <span>{formatDate(task.completed_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Imagens anexadas */}
                    {task.images?.length > 0 && (
                      <div className={styles.taskImages}>
                        <label><FaImage /> Imagens Anexadas:</label>
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

                    {/* Resposta do desenvolvedor */}
                    <div className={styles.responseSection}>
                      <label>Resposta / Observações:</label>
                      <textarea
                        value={responseText[task.id] ?? task.developer_response ?? ''}
                        onChange={(e) => setResponseText(prev => ({ 
                          ...prev, 
                          [task.id]: e.target.value 
                        }))}
                        placeholder="Adicione sua resposta ou observações sobre esta tarefa..."
                        rows={3}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Ações */}
                    <div className={styles.taskActions}>
                      <div className={styles.statusSelect}>
                        <label>Alterar Status:</label>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          disabled={isUpdating}
                          style={{ borderColor: getStatusColor(task.status) }}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        className={styles.btnSave}
                        onClick={() => handleSaveResponse(task.id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <FaSpinner className={styles.spinner} />
                        ) : (
                          <>
                            <FaSave /> Salvar Resposta
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskToDeveloper;

