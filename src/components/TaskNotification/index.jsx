import React, { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './tasknotification.module.css'
import { UserContext } from '../../context/UserContext'
import supabase from '../../helper/superBaseClient'
import { FaTasks, FaBell, FaTimes, FaArrowRight, FaCheckCircle, FaCode } from 'react-icons/fa'

const STORAGE_KEY = 'pendingTaskNotification'
const STORAGE_KEY_COMPLETED = 'completedTaskNotification'
const STORAGE_KEY_DEV_TASK = 'pendingDevTaskNotification'
const STORAGE_KEY_DEV_COMPLETED = 'completedDevTaskNotification'

const TaskNotification = () => {
  const { operatorData } = useContext(UserContext)
  const navigate = useNavigate()
  const [notification, setNotification] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [hasNewTask, setHasNewTask] = useState(false)
  const [notificationType, setNotificationType] = useState('new') // 'new', 'completed', 'dev_new', 'dev_completed'
  const timeoutRef = useRef(null)
  const subscriptionRef = useRef(null)

  // Verificar tipo de usuário
  const isAdmin = operatorData?.operator_type === 'Admin'
  const isDeveloper = operatorData?.operator_type === 'Developer'
  const currentOperatorId = operatorData?.operator_code_id

  // Carregar notificação persistida ao iniciar
  useEffect(() => {
    // Carregar notificação de nova tarefa (para admin)
    if (isAdmin) {
      const savedNotification = localStorage.getItem(STORAGE_KEY)
      if (savedNotification) {
        try {
          const parsed = JSON.parse(savedNotification)
          setNotification(parsed)
          setIsVisible(true)
          setIsMinimized(true)
          setHasNewTask(true)
          setNotificationType('new')
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY)
        }
      }

      // Carregar notificação de tarefa de dev concluída (para admin)
      const savedDevCompleted = localStorage.getItem(STORAGE_KEY_DEV_COMPLETED)
      if (savedDevCompleted) {
        try {
          const parsed = JSON.parse(savedDevCompleted)
          setNotification(parsed)
          setIsVisible(true)
          setIsMinimized(true)
          setHasNewTask(true)
          setNotificationType('dev_completed')
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY_DEV_COMPLETED)
        }
      }
    }

    // Carregar notificação de tarefa concluída (para operadores)
    if (currentOperatorId) {
      const savedCompletedNotification = localStorage.getItem(STORAGE_KEY_COMPLETED)
      if (savedCompletedNotification) {
        try {
          const parsed = JSON.parse(savedCompletedNotification)
          // Verificar se a notificação é para o operador atual
          if (parsed.operatorRequiredId === currentOperatorId) {
            setNotification(parsed)
            setIsVisible(true)
            setIsMinimized(true)
            setHasNewTask(true)
            setNotificationType('completed')
          }
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY_COMPLETED)
        }
      }
    }

    // Carregar notificação de nova tarefa de dev (para developer)
    if (isDeveloper) {
      const savedDevTask = localStorage.getItem(STORAGE_KEY_DEV_TASK)
      if (savedDevTask) {
        try {
          const parsed = JSON.parse(savedDevTask)
          setNotification(parsed)
          setIsVisible(true)
          setIsMinimized(true)
          setHasNewTask(true)
          setNotificationType('dev_new')
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY_DEV_TASK)
        }
      }
    }
  }, [isAdmin, isDeveloper, currentOperatorId])

  useEffect(() => {
    if (!currentOperatorId) return

    let insertChannel = null
    let updateChannel = null
    let devTaskChannel = null
    let devTaskUpdateChannel = null

    // Configurar subscription do Supabase Realtime para INSERT (apenas para admins)
    if (isAdmin) {
      insertChannel = supabase
        .channel('task_manager_insert')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_manager'
          },
          async (payload) => {
            // Buscar informações do operador que criou a tarefa
            const { data: operatorInfo } = await supabase
              .from('operator')
              .select('operator_name')
              .eq('operator_code_id', payload.new.operator_required)
              .single()

            const newNotification = {
              id: payload.new.id,
              reason: payload.new.reason || 'Nova tarefa',
              operatorName: operatorInfo?.operator_name || 'Operador',
              createdAt: new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }

            // Salvar no localStorage para persistir entre navegações
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotification))

            setNotification(newNotification)
            setIsVisible(true)
            setIsMinimized(false)
            setHasNewTask(true)
            setNotificationType('new')

            // Limpar timeout anterior se existir
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }

            // Esconder após 3 segundos
            timeoutRef.current = setTimeout(() => {
              setIsMinimized(true)
            }, 3000)
          }
        )
        .subscribe()

      // Subscription para tarefas de dev concluídas (para admins)
      devTaskUpdateChannel = supabase
        .channel('developer_task_update_admin')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'developer_task'
          },
          async (payload) => {
            const newStatus = payload.new?.status
            const oldStatus = payload.old?.status

            // Notificar admin quando tarefa de dev for concluída
            if (newStatus === 'concluido' && oldStatus !== 'concluido') {
              const completedNotification = {
                id: payload.new.id,
                title: payload.new.title || 'Tarefa concluída',
                developerResponse: payload.new.developer_response || '',
                createdAt: new Date().toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }

              localStorage.setItem(STORAGE_KEY_DEV_COMPLETED, JSON.stringify(completedNotification))

              setNotification(completedNotification)
              setIsVisible(true)
              setIsMinimized(false)
              setHasNewTask(true)
              setNotificationType('dev_completed')

              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }

              timeoutRef.current = setTimeout(() => {
                setIsMinimized(true)
              }, 3000)
            }
          }
        )
        .subscribe()
    }

    // Configurar subscription para UPDATE
    updateChannel = supabase
      .channel('task_manager_update_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'task_manager'
        },
        async (payload) => {
          const oldStatus = payload.old?.status
          const newStatus = payload.new?.status
          const taskId = payload.new?.id
          const operatorRequiredId = payload.new?.operator_required

          // Para admins: remover notificação quando status mudar de pendente
          if (isAdmin && oldStatus === 'pendente' && newStatus !== 'pendente') {
            const savedNotification = localStorage.getItem(STORAGE_KEY)
            if (savedNotification) {
              try {
                const parsed = JSON.parse(savedNotification)
                if (parsed.id === taskId) {
                  localStorage.removeItem(STORAGE_KEY)
                  setIsVisible(false)
                  setIsMinimized(true)
                  setHasNewTask(false)
                  setNotification(null)
                }
              } catch (e) {
                // Erro ao parsear, ignorar
              }
            }
          }

          // Para operadores: notificar quando sua tarefa for concluída
          if (newStatus === 'concluido' && operatorRequiredId === currentOperatorId) {
            // Buscar informações do admin que concluiu a tarefa
            const { data: adminInfo } = await supabase
              .from('operator')
              .select('operator_name')
              .eq('operator_code_id', payload.new.operator_activity_conclude)
              .single()

            const completedNotification = {
              id: taskId,
              reason: payload.new.reason || 'Tarefa concluída',
              adminReason: payload.new.admin_reason || '',
              operatorName: adminInfo?.operator_name || 'Administrador',
              operatorRequiredId: operatorRequiredId,
              createdAt: new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }

            // Salvar no localStorage para persistir entre navegações
            localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedNotification))

            setNotification(completedNotification)
            setIsVisible(true)
            setIsMinimized(false)
            setHasNewTask(true)
            setNotificationType('completed')

            // Limpar timeout anterior se existir
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }

            // Esconder após 3 segundos
            timeoutRef.current = setTimeout(() => {
              setIsMinimized(true)
            }, 3000)
          }
        }
      )
      .subscribe()

    // Subscription para novas tarefas de desenvolvimento (para developer)
    if (isDeveloper) {
      devTaskChannel = supabase
        .channel('developer_task_insert')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'developer_task'
          },
          async (payload) => {
            // Buscar informações do admin que criou a tarefa
            const { data: adminInfo } = await supabase
              .from('operator')
              .select('operator_name')
              .eq('operator_code_id', payload.new.admin_created_by)
              .single()

            const newNotification = {
              id: payload.new.id,
              title: payload.new.title || 'Nova tarefa de desenvolvimento',
              priority: payload.new.priority,
              operatorName: adminInfo?.operator_name || 'Admin',
              createdAt: new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }

            localStorage.setItem(STORAGE_KEY_DEV_TASK, JSON.stringify(newNotification))

            setNotification(newNotification)
            setIsVisible(true)
            setIsMinimized(false)
            setHasNewTask(true)
            setNotificationType('dev_new')

            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
              setIsMinimized(true)
            }, 3000)
          }
        )
        .subscribe()
    }

    subscriptionRef.current = { insertChannel, updateChannel, devTaskChannel, devTaskUpdateChannel }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (subscriptionRef.current) {
        if (subscriptionRef.current.insertChannel) {
          supabase.removeChannel(subscriptionRef.current.insertChannel)
        }
        if (subscriptionRef.current.updateChannel) {
          supabase.removeChannel(subscriptionRef.current.updateChannel)
        }
        if (subscriptionRef.current.devTaskChannel) {
          supabase.removeChannel(subscriptionRef.current.devTaskChannel)
        }
        if (subscriptionRef.current.devTaskUpdateChannel) {
          supabase.removeChannel(subscriptionRef.current.devTaskUpdateChannel)
        }
      }
    }
  }, [isAdmin, isDeveloper, currentOperatorId])

  const handleShowNotification = () => {
    setIsMinimized(false)
    setHasNewTask(false)

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Esconder após 3 segundos
    timeoutRef.current = setTimeout(() => {
      setIsMinimized(true)
    }, 3000)
  }

  const handleClose = () => {
    setIsMinimized(true)
  }

  const handleViewTasks = () => {
    // Remover do localStorage dependendo do tipo de notificação
    if (notificationType === 'new') {
      localStorage.removeItem(STORAGE_KEY)
      navigate('/tasks')
    } else if (notificationType === 'completed') {
      localStorage.removeItem(STORAGE_KEY_COMPLETED)
      navigate('/mytasks')
    } else if (notificationType === 'dev_new') {
      localStorage.removeItem(STORAGE_KEY_DEV_TASK)
      navigate('/tasktodeveloper')
    } else if (notificationType === 'dev_completed') {
      localStorage.removeItem(STORAGE_KEY_DEV_COMPLETED)
      navigate('/taskdevelopment')
    }
    
    setIsMinimized(true)
    setIsVisible(false)
    setHasNewTask(false)
    setNotification(null)
  }

  // Não renderizar se não tiver notificação
  if (!isVisible) return null

  const isCompletedNotification = notificationType === 'completed'
  const isDevNotification = notificationType === 'dev_new' || notificationType === 'dev_completed'
  const isDevCompleted = notificationType === 'dev_completed'

  // Determinar a cor e icone baseado no tipo
  const getNotificationStyle = () => {
    if (isDevNotification) {
      return {
        btnClass: isDevCompleted ? styles.devCompletedBtn : styles.devBtn,
        dotClass: styles.dotDev,
        notificationClass: styles.notificationDev,
        headerClass: styles.headerDev,
        titleClass: styles.titleDev,
        icon: FaCode,
        title: isDevCompleted ? 'Tarefa Dev Concluída' : 'Nova Tarefa Dev',
        btnText: isDevCompleted ? 'Ver Tarefas de Dev' : 'Ver Tarefas'
      }
    }
    if (isCompletedNotification) {
      return {
        btnClass: styles.completedBtn,
        dotClass: styles.dotCompleted,
        notificationClass: styles.notificationCompleted,
        headerClass: styles.headerCompleted,
        titleClass: styles.titleCompleted,
        icon: FaCheckCircle,
        title: 'Tarefa Concluída',
        btnText: 'Ver Minhas Solicitações'
      }
    }
    return {
      btnClass: '',
      dotClass: '',
      notificationClass: '',
      headerClass: '',
      titleClass: '',
      icon: FaTasks,
      title: 'Nova Tarefa',
      btnText: 'Ver Tarefas'
    }
  }

  const style = getNotificationStyle()
  const IconComponent = style.icon

  return (
    <div className={styles.notificationContainer}>
      {/* Botão minimizado */}
      {isMinimized && (
        <button 
          className={`${styles.minimizedBtn} ${hasNewTask ? styles.hasNew : ''} ${style.btnClass}`}
          onClick={handleShowNotification}
          title={`Ver notificação: ${style.title}`}
        >
          <IconComponent />
          {hasNewTask && <span className={`${styles.dot} ${style.dotClass}`}></span>}
        </button>
      )}

      {/* Notificação expandida */}
      {!isMinimized && notification && (
        <div className={`${styles.notification} ${style.notificationClass}`}>
          <div className={`${styles.notificationHeader} ${style.headerClass}`}>
            <div className={`${styles.notificationTitle} ${style.titleClass}`}>
              <IconComponent className={styles.icon} />
              <span>{style.title}</span>
            </div>
            <button 
              className={styles.closeBtn}
              onClick={handleClose}
              title="Fechar"
            >
              <FaTimes />
            </button>
          </div>

          <div className={styles.notificationBody}>
            <p className={styles.taskReason}>
              {(notification.title || notification.reason || '').length > 50 
                ? (notification.title || notification.reason).substring(0, 50) + '...' 
                : (notification.title || notification.reason)}
            </p>
            {isCompletedNotification && notification.adminReason && (
              <p className={styles.adminReason}>
                <strong>Resultado:</strong> {notification.adminReason.length > 40 
                  ? notification.adminReason.substring(0, 40) + '...' 
                  : notification.adminReason}
              </p>
            )}
            {isDevCompleted && notification.developerResponse && (
              <p className={styles.devResponse}>
                <strong>Resposta:</strong> {notification.developerResponse.length > 40 
                  ? notification.developerResponse.substring(0, 40) + '...' 
                  : notification.developerResponse}
              </p>
            )}
            <div className={styles.taskMeta}>
              <span className={`${styles.operatorName} ${isDevNotification ? styles.operatorNameDev : isCompletedNotification ? styles.operatorNameCompleted : ''}`}>
                {isCompletedNotification || isDevCompleted ? `Por: ${notification.operatorName}` : notification.operatorName}
              </span>
              <span className={styles.time}>
                {notification.createdAt}
              </span>
            </div>
          </div>

          <div className={styles.notificationFooter}>
            <button 
              className={`${styles.viewTasksBtn} ${isDevNotification ? styles.viewTasksBtnDev : isCompletedNotification ? styles.viewTasksBtnCompleted : ''}`}
              onClick={handleViewTasks}
            >
              {style.btnText} <FaArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskNotification
