import React, { Fragment, useState } from "react";
import { toast } from "react-toastify";
import styles from "../../pages/AdminManager/adminmanager.module.css";
import { FaAngleDown, FaAngleRight, FaTrash } from "react-icons/fa";
import Loader from "../Loader";
import {
  deleteOperatorMeta,
  fetchOperatorMetaHistory,
  postOperatorMeta,
} from "../../api/adminManagerApi";

const Meta = ({ operators, inputs, setInputs, read, setRead }) => {
  const [historyOpen, setHistoryOpen] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleInputChange = (id, field, value) => {
    setInputs((prev) => {
      const updated = { ...prev[id], [field]: value };
      if (field === "value" || field === "percent") {
        const val = parseInt(updated.value) || 0;
        const perc = parseInt(updated.percent) || 0;
        updated.total = (val * perc) / 100 + val;
      }
      return { ...prev, [id]: updated };
    });
  };

  const handleEdit = (id) => {
    setRead((prev) => ({
      ...prev,
      [id]: { only: !prev?.[id]?.only },
    }));
  };

  const handleUpdateMeta = async (id) => {
    setLoading(true);
    const { total, date, percent, value } = inputs[id];

    try {
      const response = await postOperatorMeta({
        operator_code_id: id,
        base: value,
        meta: Number(total),
        start_date: date,
        percent: percent,
      });
      if (!response?.success) {
        toast.error(response?.message || "Erro ao salvar meta");
        return;
      }
      setInputs((prev) => {
        const updated = { total: "", date: "", percent: "", value: "" };
        return { ...prev, [id]: updated };
      });
      toast.success("Atualizado com sucesso...");
    } catch (e) {
      toast.error("Erro ao salvar meta");
    } finally {
      setLoading(false);
    }
  };
  const handleHistory = async (id) => {
    if (historyOpen === "") {
      setHistoryOpen(id);
      try {
        const response = await fetchOperatorMetaHistory(id, 5);
        setHistoryData(response?.data || []);
      } catch (e) {
        toast.error("Erro ao carregar histórico");
      }
    } else {
      setHistoryOpen("");
      setHistoryData([]);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (window.confirm("Deseja mesmo deletar este histórico?")) {
      try {
        const response = await deleteOperatorMeta(id);
        if (response?.success) {
          toast.success("Excluído com sucesso...");
          setHistoryData(historyData.filter((item) => item.id !== id));
        }
      } catch (error) { 
        toast.error("Erro ao excluir histórico");
      }
    }
  };

  return (
    <>
      {operators
        .filter(
          (op) =>
            op.operator_type !== "Admin"
        )
        .map((operator) => (
          <Fragment key={operator.operator_code_id}>
            <div
              className={styles.adminManagerContentOperator}
            >
              <div className="input-field">
                <label>Operador</label>
                <strong>{operator.operator_name}</strong>
              </div>
              <div className="input-field" style={{ maxWidth: 70 }}>
                <label>Valor</label>
                <input
                  type="text"
                  readOnly={read?.[operator.operator_code_id]?.only}
                  value={inputs?.[operator.operator_code_id]?.value || ""}
                  onChange={(e) =>
                    handleInputChange(
                      operator.operator_code_id,
                      "value",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="input-field" style={{ maxWidth: 40 }}>
                <label>Porcentagem</label>
                <input
                  type="text"
                  readOnly={read?.[operator.operator_code_id]?.only}
                  value={inputs?.[operator.operator_code_id]?.percent || ""}
                  onChange={(e) =>
                    handleInputChange(
                      operator.operator_code_id,
                      "percent",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className="input-field" style={{ maxWidth: 70 }}>
                <label>Total</label>
                <input
                  type="text"
                  value={inputs?.[operator.operator_code_id]?.total || ""}
                  readOnly
                />
              </div>
              <div className="input-field" style={{ maxWidth: 130 }}>
                <label>Data</label>
                <input
                  type="date"
                  readOnly={read?.[operator.operator_code_id]?.only}
                  value={inputs?.[operator.operator_code_id]?.date || ""}
                  onChange={(e) =>
                    handleInputChange(
                      operator.operator_code_id,
                      "date",
                      e.target.value
                    )
                  }
                />
              </div>
              <div className={styles.adminManagerContentOperatorBtns}>
                <button
                  className={`${styles.adminManagerContentOperatorBtnSave} ${
                    read?.[operator.operator_code_id]?.only === false
                      ? styles.metaActionBtnSave
                      : styles.metaActionBtnEdit
                  }`}
                  disabled={loading}
                  onClick={() => {
                    if (read?.[operator.operator_code_id]?.only === false) {
                      handleUpdateMeta(operator.operator_code_id);
                    }
                    handleEdit(operator.operator_code_id);
                  }}
                >
                  {read?.[operator.operator_code_id]?.only === false
                    ? loading ? <Loader /> : "Salvar"
                    : "Editar"}
                </button>
                <button
                  className={styles.adminManagerContentOperatorBtnHistory}
                  disabled={loading}
                  onClick={() => handleHistory(operator.operator_code_id)}
                >
                  {historyOpen === operator.operator_code_id ? <FaAngleDown /> : <FaAngleRight />}
                </button>
              </div>
            </div>
            {historyOpen && operator.operator_code_id === historyOpen && (
              <div className={styles.adminManagerContentOperatorHistory}>
                {historyData.map((item) => (
                  <div
                    className={styles.adminManagerContentOperatorHistoryItem}
                    key={item.id}
                  >
                    <p>
                      Base:{" "}
                      {item?.base?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }) || "R$ 0.00"}
                    </p>
                    <p>
                      Data:{" "}
                      {new Date(item.start_date).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </p>
                    <p>
                      Meta:{" "}
                      {item?.meta?.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }) || "R$ 0.00"}
                    </p>
                    <p>Porcentagem: {item?.percent || 0}%</p>
                    <p>Status: {item?.status || ""}</p>
                    <button
                      className={
                        styles.adminManagerContentOperatorHistoryBtnDelete
                      }
                      onClick={() => handleDeleteHistory(item.id)}
                    >
                      <FaTrash /> Excluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Fragment>
        ))}
    </>
  );
};

export default Meta;
