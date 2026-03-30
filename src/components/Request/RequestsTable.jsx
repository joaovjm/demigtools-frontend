import React, { useEffect, useState } from "react";
import getAllRequests from "../../helper/getAllRequests";
import { DataSelect } from "../DataTime";
import "./RequestsTable.css";
import EditRequestCreated from "./EditRequestCreated";

const RequestsTable = ({ setRequestId, listVersion = 0 }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllRequests();
      setRequests(data);

    } catch (error) {
      console.error("Erro ao carregar requisições:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [listVersion]);

  const getStatusBadge = (status) => {

    const statusConfig = {
      false: { class: "status-np", text: "Inativo", icon: "❌" },
      true: { class: "status-success", text: "Ativo", icon: "✅" },
    };

    const config = statusConfig[status] || {
      class: "status-default",
      text: status,
      icon: "❓",
    };

    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return DataSelect(dateString);
  };

  if (loading) {
    return (
      <div className="requests-table-container">
        <div className="requests-table-loading">
          <div className="loading-spinner"></div>
          <p>Carregando requisições...</p>
        </div>
      </div>
    );
  }

  const handleRequestClick = (id) => {
  };

  return (
    <div className="requests-table-container">
      <div className="requests-table-header">
        <h3 className="requests-table-title">📋 Requisições Criadas</h3>
        <div className="requests-table-stats">
          <span className="stats-item">
            <strong>{requests.length}</strong>{" "}
            {requests.length === 1 ? "requisição" : "requisições"}
          </span>
        </div>
      </div>

      {requests.length > 0 ? (
        <div className="requests-table-scroll">
          <table className="requests-table">
            <thead>
              <tr className="requests-table-head-row">
                <th className="requests-table-head">Nome da Requisição</th>
                <th className="requests-table-head">Data de Criação</th>
                <th className="requests-table-head">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  onDoubleClick={() => setRequestId(request.id)}
                  className="requests-table-row"
                >
                  <td className="requests-table-cell">
                    <div className="request-name">
                      <strong>{request.name}</strong>
                    </div>
                  </td>
                  <td className="requests-table-cell">
                    {formatDate(request.date_created)}
                  </td>
                  <td className="requests-table-cell">
                    {getStatusBadge(request.active)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="requests-table-empty">
          <div className="empty-icon">📝</div>
          <p>Nenhuma requisição encontrada</p>
          <small>Crie uma nova requisição para vê-la aqui</small>
        </div>
      )}

      
    </div>
  );
};

export default RequestsTable;
