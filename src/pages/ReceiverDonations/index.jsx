import React, { useEffect, useState } from "react";
import styles from "./receiverdonations.module.css";

import { ALERT_TYPES, ICONS } from "../../constants/constants";
import FormInput from "../../components/forms/FormInput";

import MessageStatus from "../../components/MessageStatus";
import { useDonation } from "../../helper/receiveDonation";
import { getCollector } from "../../helper/getCollector";
import { ModalConfirm } from "../../components/ModalConfirm";
import ModalReceiptSend from "../../components/modals/ModalReceiptSend";
import { DataNow } from "../../components/DataTime";
import { fetchDepositPending } from "../../api/receiverDonationsApi.js";

/** Coletor cujas doações entram na fila de comprovantes de depósito (igual ao filtro anterior no Supabase). */
const DEPOSIT_PENDING_COLLECTOR_ID = 22;

const ReceiverDonations = () => {
  const [formData, setFormData] = useState({
    collector: "",
    date: DataNow("underday"),
    search: "",
  });

  const [collectors, setCollectors] = useState([]);
  const [tableReceipt, setTableReceipt] = useState([]);
  const [alert, setAlert] = useState({ message: "", type: null, icon: null });
  const [deposit, setDeposit] = useState();
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const { receiveDonation, modalOpen, setModalOpen, modalConfig } =
    useDonation();

  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const data = await getCollector();
        setCollectors(data);
      } catch (error) {
        console.error("Erro ao carregar os coletadores: ", error.message),
          setAlert({
            message: "Erro ao carregar os coletadores",
            type: ALERT_TYPES.ERROR,
            icon: ICONS.ALERT,
          });
      }
    };
    fetchCollectors();
  }, []);

  useEffect(() => {
    const loadDeposit = async () => {
      try {
        const res = await fetchDepositPending(DEPOSIT_PENDING_COLLECTOR_ID);
        setDeposit(res?.data ?? []);
      } catch (error) {
        console.error(error?.message || error);
        setDeposit([]);
      }
    };
    loadDeposit();
  }, [tableReceipt]);

  useEffect(() => {
    setTableReceipt([]);
  }, [formData.collector]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDataChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, date: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.collector || !formData.date || !formData.search) {
      setAlert({
        message: "Preencha todos os campos",
        type: ALERT_TYPES.ATTENTION,
        icon: ICONS.ALERT,
      });

      setTimeout(() => {
        setAlert({ message: "", type: null, icon: null });
      }, 1000);

      return;
    }
    const status = await receiveDonation(
      formData.date,
      Number(formData.collector),
      formData.search,
      setTableReceipt
    );

    setFormData((prev) => ({ ...prev, search: "" }));

    if (status === "received") {
      setAlert({
        message: "Doação já recebida",
        type: ALERT_TYPES.ERROR,
        icon: ICONS.ALERT,
      });
    } else if (status === "not located") {
      setAlert({
        message: "Recibo não localizado",
        type: ALERT_TYPES.ERROR,
        icon: ICONS.ALERT,
      });
    } else if (status === "success") {
      setAlert({
        message: "Doação recebida com sucesso",
        type: ALERT_TYPES.SUCCESS,
        icon: ICONS.CONFIRMED,
      });
    }

    setTimeout(() => {
      setAlert({ message: "", type: null, icon: null });
    }, 1000);
  };

  const handleDeposit = () => {
    setSendModalOpen(true);
  };

  return (
    <div className={styles.receiverDonationsContainer}>
      <div className={styles.receiverDonationsContent}>
        <div className={styles.receiverDonationsHeader}>
          <h3 className={styles.receiverDonationsTitle}>
            {ICONS.MONEY} Receber Doações
          </h3>
          {deposit?.length > 0 && (
            <button
              onClick={handleDeposit}
              className={`${styles.receiverDonationsBtn} ${styles.secondary}`}
            >
              {ICONS.MONEY} Recibo Depósito ({deposit.length})
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.receiverDonationsForm}>
          <div className={styles.formInlineContainer}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {ICONS.MOTORCYCLE} Coletador
              </label>
              <div className={styles.collectorInputGroup}>
                <select
                  value={formData.collector}
                  onChange={(e) =>
                    handleInputChange("collector", e.target.value)
                  }
                  className={styles.receiverDonationsSelect}
                  disabled={modalOpen}
                >
                  <option value="">Selecione...</option>
                  {collectors.map((collector) => (
                    <option
                      key={collector.collector_code_id}
                      value={collector.collector_code_id}
                    >
                      {collector.collector_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className={styles.collectorCodeInput}
                  value={formData.collector}
                  onChange={(e) =>
                    handleInputChange("collector", e.target.value)
                  }
                  placeholder="Cód"
                  readOnly={modalOpen}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {ICONS.CALENDAR} Data
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleDataChange}
                readOnly={modalOpen}
                className={styles.receiverDonationsInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {ICONS.SEARCH} Buscar Recibo
              </label>
              <input
                type="text"
                name="search"
                value={formData.search}
                onChange={(e) => handleInputChange("search", e.target.value)}
                readOnly={modalOpen}
                className={styles.receiverDonationsInput}
                placeholder="Digite o código..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit(e);
                }}
              />
            </div>

            <div className={styles.formGroupBtn}>
              <button
                type="submit"
                className={`${styles.receiverDonationsBtn} ${styles.primary}`}
                disabled={
                  modalOpen ||
                  !formData.collector ||
                  !formData.date ||
                  !formData.search
                }
              >
                {ICONS.SEARCH} Processar
              </button>
            </div>
          </div>
        </form>

        {/*MENSAGEM*/}
        {alert.message && (
          <div className={styles.receiverDonationsAlert}>
            <MessageStatus
              type={alert.type}
              message={alert.message}
              icon={alert.icon}
            />
          </div>
        )}

        {/* SUMÁRIO DOS RECIBOS */}
        {tableReceipt.length > 0 && (
          <div className={styles.receiverDonationsSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total de Fichas:</span>
              <span className={styles.summaryValue}>{tableReceipt.length}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Valor Total:</span>
              <span className={styles.summaryValue}>
                {tableReceipt
                  .reduce((acc, item) => {
                    return (acc += item.value);
                  }, 0)
                  .toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
              </span>
            </div>
          </div>
        )}

        {/* TABELA DE RECIBOS */}
        {tableReceipt.length > 0 && (
          <div className={styles.receiverDonationsTableSection}>
            <h4>Recibos Processados</h4>
            <div className={styles.tableContainer}>
              <table className={styles.receiverDonationsTable}>
                <thead>
                  <tr>
                    <th>Recibo</th>
                    <th>Nome do Doador</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {tableReceipt.map((item) => (
                    <tr key={item.search}>
                      <td className={styles.receiptCode}>{item.search}</td>
                      <td className={styles.donorName}>{item.name}</td>
                      <td className={styles.donationValue}>
                        {item.value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/*MODAL CONFIRM*/}
        <ModalConfirm
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
        />

        {sendModalOpen && (
          <ModalReceiptSend
            setSendModalOpen={setSendModalOpen}
            deposit={deposit}
            setDeposit={setDeposit}
          />
        )}
      </div>
    </div>
  );
};

export default ReceiverDonations;
