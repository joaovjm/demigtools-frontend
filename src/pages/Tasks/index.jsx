import React, { useState, useEffect, useContext, useMemo } from 'react'
import styles from './tasks.module.css'
import { toast } from 'react-toastify'
import { UserContext } from '../../context/UserContext'
import { fetchAllTasks, patchTaskManagerRequest } from '../../api/taskManagerApi'
import { FaTasks, FaSpinner, FaFilter, FaSearch, FaExclamationTriangle, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import ModalTaskDetails from '../../components/ModalTaskDetails'

const PAGE_SIZE = 20

const Tasks = () => {
  const { operatorData } = useContext(UserContext)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: '#faa01c' },
    { value: 'em_andamento', label: 'Em Andamento', color: '#385bad' },
    { value: 'concluido', label: 'Concluído', color: '#28a745' },
    { value: 'cancelado', label: 'Cancelado', color: '#c70000' }
  ]

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await fetchAllTasks()
      setTasks(data || [])
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      toast.error(error?.message || 'Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filterStatus, searchTerm])

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId)
      const updateData = { status: newStatus }

      if (newStatus === 'em_andamento' || newStatus === 'concluido') {
        updateData.operator_activity_conclude = operatorData?.operator_code_id
      }

      await patchTaskManagerRequest(taskId, updateData)

      toast.success('Status atualizado com sucesso!')
      fetchTasks()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error(error?.message || 'Erro ao atualizar status')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleOpenDetails = (task) => {
    setSelectedTask(task)
    setShowModal(true)
  }

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return statusOption?.color || '#666'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          let matchesFilter = true
          if (filterStatus === 'prioridade_alta' && task.status !== 'concluido') {
            matchesFilter = task.priority === 'alta'
          } else if (filterStatus !== 'all') {
            matchesFilter = task.status === filterStatus
          }

          const matchesSearch =
            searchTerm === '' ||
            task.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.operator_required_info?.operator_name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            task.donor?.donor_name?.toLowerCase().includes(searchTerm.toLowerCase())

          return matchesFilter && matchesSearch
        })
        .sort((a, b) => {
          const aIsHighPriority = a.priority === 'alta'
          const bIsHighPriority = b.priority === 'alta'
          if (aIsHighPriority && !bIsHighPriority) return -1
          if (!aIsHighPriority && bIsHighPriority) return 1

          const aIsConcluded = a.status === 'concluido'
          const bIsConcluded = b.status === 'concluido'
          if (aIsConcluded && !bIsConcluded) return 1
          if (!aIsConcluded && bIsConcluded) return -1

          return new Date(b.created_at) - new Date(a.created_at)
        }),
    [tasks, filterStatus, searchTerm]
  )

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE))
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [filteredTasks.length])

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  if (loading) {
    return (
      <div className={styles.tasksContainer}>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <p>Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tasksContainer}>
      <header className={styles.header}>
        <h1><FaTasks /> Gerenciador de Tarefas</h1>
        <p className={styles.subtitle}>Gerencie as solicitações dos operadores</p>
      </header>

      <div className={styles.filtersContainer}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por tarefa, operador ou doador..."
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

      <div className={styles.statsContainer}>
        <button 
          className={`${styles.statCard} ${filterStatus === 'all' ? styles.statCardActive : ''}`}
          onClick={() => setFilterStatus('all')}
          title="Mostrar todas as tarefas"
        >
          <span className={styles.statNumber}>{tasks.length}</span>
          <span className={styles.statLabel}>Total</span>
        </button>
        <button 
          className={`${styles.statCard} ${filterStatus === 'prioridade_alta' ? styles.statCardActive : ''}`}
          onClick={() => setFilterStatus('prioridade_alta')}
          style={{ borderColor: '#c70000' }}
          title="Filtrar tarefas com prioridade alta"
        >
          <span className={styles.statNumber} style={{ color: '#c70000' }}>
            {tasks.filter(t => t.priority === 'alta' && t.status !== 'concluido').length}
          </span>
          <span className={styles.statLabel}>Prioridade Alta</span>
        </button>
        <button 
          className={`${styles.statCard} ${filterStatus === 'pendente' ? styles.statCardActive : ''}`}
          onClick={() => setFilterStatus('pendente')}
          style={{ borderColor: '#faa01c' }}
          title="Filtrar tarefas pendentes"
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
          title="Filtrar tarefas em andamento"
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
          title="Filtrar tarefas concluídas"
        >
          <span className={styles.statNumber} style={{ color: '#28a745' }}>
            {tasks.filter(t => t.status === 'concluido').length}
          </span>
          <span className={styles.statLabel}>Concluídos</span>
        </button>
      </div>

      <div className={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <FaTasks className={styles.emptyIcon} />
            <p>Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          paginatedTasks.map((task) => (
            <div 
              key={task.id} 
              className={`${styles.taskItemsContainer} ${task.priority === "alta" && task.status !== "concluido" ? styles.priorityTask : ''}`}
              style={{ borderLeftColor: task.priority === "alta" && task.status !== "concluido" ? '#c70000' : getStatusColor(task.status) }}
            >
              {task.priority === "alta" && (
                <span className={styles.priorityBadge}>
                  <FaExclamationTriangle /> Prioridade
                </span>
              )}
              <div className={styles.taskReasonRow}>
                <div className={styles.taskItemBlock}>
                  <label>Tarefa</label>
                  <span className={styles.taskReason}>{task.reason || 'Sem descrição'}</span>
                </div>
              </div>

              <div className={styles.taskMainContent}>

                <div className={styles.taskItemBlock}>
                  <label>Referência</label>
                  <span>
                    {task.donor?.donor_name || 
                     (task.receipt_donation_id ? `Recibo #${task.receipt_donation_id}` : '-')}
                  </span>
                </div>

                <div className={styles.taskItemBlock}>
                  <label>Solicitante</label>
                  <span>{task.operator_required_info?.operator_name || '-'}</span>
                </div>

                <div className={styles.taskItemBlock}>
                  <label>Responsável</label>
                  <span>{task.operator_conclude_info?.operator_name || 'Não atribuído'}</span>
                </div>

                <div className={styles.taskItemBlock}>
                  <label>Criado em</label>
                  <span>{formatDate(task.created_at)}</span>
                </div>

                <div className={styles.taskItemBlock}>
                  <label>Atualizado em</label>
                  <span>{formatDate(task.updated_at)}</span>
                </div>

                <div className={styles.taskActions}>
                  <div className={styles.taskItemBlock}>
                    <label htmlFor={`status-${task.id}`}>Status</label>
                    <select
                      id={`status-${task.id}`}
                      className={styles.selectStatus}
                      value={task.status || 'pendente'}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      disabled={updatingTaskId === task.id}
                      style={{ borderColor: getStatusColor(task.status) }}
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className={styles.btnDetails}
                    onClick={() => handleOpenDetails(task)}
                    disabled={updatingTaskId === task.id}
                  >
                    {updatingTaskId === task.id ? (
                      <FaSpinner className={styles.spinner} />
                    ) : (
                      'Ver Detalhes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredTasks.length > PAGE_SIZE && (
        <nav className={styles.pagination} aria-label="Paginação da lista de tarefas">
          <span className={styles.paginationInfo}>
            Página {currentPage} de {totalPages} — exibindo{' '}
            {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredTasks.length)} de {filteredTasks.length}
          </span>
          <div className={styles.paginationButtons}>
            <button
              type="button"
              className={styles.paginationBtn}
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <FaChevronLeft /> Anterior
            </button>
            <button
              type="button"
              className={styles.paginationBtn}
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima <FaChevronRight />
            </button>
          </div>
        </nav>
      )}

      {showModal && selectedTask && (
        <ModalTaskDetails
          task={selectedTask}
          onClose={() => {
            setShowModal(false)
            setSelectedTask(null)
          }}
          onUpdate={fetchTasks}
          statusOptions={statusOptions}
        />
      )}
    </div>
  )
}

export default Tasks
