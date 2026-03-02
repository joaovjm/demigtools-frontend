import React, { useState, useEffect, useContext } from "react";
import styles from "./mytasks.module.css";
import supabase from "../../helper/superBaseClient";
import { toast } from "react-toastify";
import { UserContext } from "../../context/UserContext";
import {
  FaTasks,
  FaUser,
  FaReceipt,
  FaSpinner,
  FaFilter,
  FaSearch,
  FaExternalLinkAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router";
import { navigateWithNewTab } from "../../utils/navigationUtils";

const MyTasks = () => {
  const { operatorData } = useContext(UserContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const statusOptions = [
    { value: "pendente", label: "Pendente", color: "#faa01c" },
    { value: "em_andamento", label: "Em Andamento", color: "#385bad" },
    { value: "concluido", label: "Concluído", color: "#28a745" },
    { value: "cancelado", label: "Cancelado", color: "#c70000" },
  ];

  const fetchMyTasks = async () => {
    if (!operatorData?.operator_code_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("task_manager")
        .select(
          `
          *,
          operator_required_info:operator_required(operator_name, operator_code_id),
          operator_conclude_info:operator_activity_conclude(operator_name, operator_code_id),
          donor:donor_id(donor_id, donor_name)
        `
        )
        .eq("operator_required", operatorData.operator_code_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      toast.error("Erro ao carregar suas tarefas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [operatorData?.operator_code_id]);

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return statusOption?.color || "#666";
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return statusOption?.label || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenDonor = (donorId, event) => {
    if (donorId) {
      navigateWithNewTab(event, `/donor/${donorId}`, navigate);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      task.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.donor?.donor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <p>Carregando suas tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          <FaTasks /> Minhas Solicitações
        </h1>
        <p className={styles.subtitle}>Acompanhe o status das suas tarefas</p>
      </header>

      <div className={styles.filtersContainer}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por tarefa ou doador..."
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
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{tasks.length}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: "#faa01c" }}>
          <span className={styles.statNumber} style={{ color: "#faa01c" }}>
            {tasks.filter((t) => t.status === "pendente").length}
          </span>
          <span className={styles.statLabel}>Pendentes</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: "#385bad" }}>
          <span className={styles.statNumber} style={{ color: "#385bad" }}>
            {tasks.filter((t) => t.status === "em_andamento").length}
          </span>
          <span className={styles.statLabel}>Em Andamento</span>
        </div>
        <div className={styles.statCard} style={{ borderColor: "#28a745" }}>
          <span className={styles.statNumber} style={{ color: "#28a745" }}>
            {tasks.filter((t) => t.status === "concluido").length}
          </span>
          <span className={styles.statLabel}>Concluídos</span>
        </div>
      </div>

      <div className={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <FaTasks className={styles.emptyIcon} />
            <p>Nenhuma solicitação encontrada</p>
            <span>
              Você pode criar uma nova tarefa a partir da página do doador
            </span>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={styles.taskCard}
              style={{ borderLeftColor: getStatusColor(task.status) }}
            >
              <div className={styles.taskHeader}>
                <div className={styles.taskType}>
                  {task.donor_id ? (
                    <>
                      <FaUser className={styles.typeIcon} /> Doador
                    </>
                  ) : task.receipt_donation_id ? (
                    <>
                      <FaReceipt className={styles.typeIcon} /> Recibo
                    </>
                  ) : (
                    "Geral"
                  )}
                </div>
                <div
                  className={styles.statusBadge}
                  style={{
                    backgroundColor: `${getStatusColor(task.status)}20`,
                    color: getStatusColor(task.status),
                    borderColor: getStatusColor(task.status),
                  }}
                >
                  {getStatusLabel(task.status)}
                </div>
              </div>

              <div className={styles.taskBody}>
                <div className={styles.taskReason}>
                  <label>Tarefa</label>
                  <p>{task.reason || "Sem descrição"}</p>
                </div>

                <div className={styles.taskInfo}>
                  <div className={styles.infoItem}>
                    <label>Referência</label>
                    <span>
                      {task.donor?.donor_name ||
                        (task.receipt_donation_id
                          ? `Recibo #${task.receipt_donation_id}`
                          : "-")}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <label>Responsável</label>
                    <span>
                      {task.operator_conclude_info?.operator_name ||
                        "Aguardando atribuição"}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <label>Criado em</label>
                    <span>{formatDate(task.created_at)}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <label>Última atualização</label>
                    <span>{formatDate(task.updated_at)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.taskFooter}>
                <div className={styles.infoItem}>
                  <label>Resultado</label>
                  <span>
                    <FaCheckCircle
                      style={{ fontSize: "16px", color: "#28a745"}}
                    />{" "}
                    {task.admin_reason || "Não declarado"}
                  </span>
                </div>
                {task.donor_id && (
                  <div className={styles.taskActions}>
                    <button
                      className={styles.btnOpenDonor}
                      onClick={(e) => handleOpenDonor(task.donor_id, e)}
                      title="Ctrl+Click para abrir em nova aba"
                    >
                      <FaExternalLinkAlt /> Ver Doador
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyTasks;
