import { useContext, useEffect, useState } from "react";
import styles from "./modaleditdonation.module.css";
import supabase from "../../helper/superBaseClient";
import { toast } from "react-toastify";
import { getCampains } from "../../helper/getCampains";
import { getOperators } from "../../helper/getOperators";
import { getCollector } from "../../helper/getCollector";
import { UserContext } from "../../context/UserContext";
import GenerateReceiptPDF from "../GenerateReceiptPDF";
import { getEditReceipt } from "../../helper/getEditReceipt";
import { FaDollarSign, FaEdit } from "react-icons/fa";
import GenerateDepositPDF from "../GenerateDepositPDF";
import { DataSelect } from "../DataTime";
import { logDonorActivity } from "../../helper/logDonorActivity";
import { DONOR_TYPES } from "../../constants/constants";
import { ModalConfirm } from "../ModalConfirm";

const ModalEditDonation = ({ donation, setModalEdit, donorData, idDonor }) => {
  const { operatorData } = useContext(UserContext);
  const [value, setValue] = useState(donation.donation_value);
  const [date, setDate] = useState(donation.donation_day_to_receive);
  const [monthReferent, setMonthReferent] = useState(
    donation.donation_monthref
  );
  const [observation, setObservation] = useState(donation.donation_description);
  const [campaign, setCampaign] = useState(donation.campaign_id);
  const [campaigns, setCampaigns] = useState([]);
  const [operator, setOperator] = useState(donation.operator_code_id);
  const [impresso, setImpresso] = useState(
    donation.donation_print === "Sim" ? true : false
  );
  const [recebido, setRecebido] = useState(
    donation.donation_received === "Sim" ? true : false
  );
  const [collectors, setCollectors] = useState([]);
  const [collector, setCollector] = useState(donation.collector_code_id);
  const [operators, setOperators] = useState([]);
  const [receiptConfig, setReceiptConfig] = useState([]);
  const [extraValue, setExtraValue] = useState(donation.donation_extra);
  const [request, setRequest] = useState([]);
  const [loadingDeposit, setLoadingDeposit] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [donorConfirmationReason, setDonorConfirmationReason] = useState("");
  const [showCpfConfirmModal, setShowCpfConfirmModal] = useState(false);
  const [dateReceived, setDateReceived] = useState(
    donation.donation_day_received
  );
  const [initialDateReceived, setInitialDateReceived] = useState(
    donation.donation_day_received
  );

  // Armazenar valores originais para comparação
  const [originalValues] = useState({
    donation_value: donation.donation_value,
    donation_day_to_receive: donation.donation_day_to_receive,
    donation_monthref: donation.donation_monthref,
    donation_description: donation.donation_description,
    campaign_id: donation.campaign_id,
    operator_code_id: donation.operator_code_id,
    collector_code_id: donation.collector_code_id,
    donation_extra: donation.donation_extra,
  });
  useEffect(() => {
    const fetchCampaigns = async () => {
      const response = await getCampains();
      setCampaigns(response);
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const fetchReceiptConfig = async () => {
      const response = await getEditReceipt();
      setReceiptConfig(response[0]);
    };
    fetchReceiptConfig();
  }, []);

  useEffect(() => {
    const fetchOperators = async () => {
      const response = await getOperators({
        active: true,
        item: "operator_code_id, operator_name",
      });
      setOperators(response);
    };
    fetchOperators();
  }, []);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data, error } = await supabase
          .from("request")
          .select("*, operator: operator_code_id(operator_name)")
          .eq("donor_id", idDonor)
          .eq("request_active", "True")
          .order("request_start_date", { ascending: false })
          .limit(1);
        if (error) throw error;
        if (data) {
          console.log(data);
          setRequest(data);
        }
      } catch (error) {
        console.error("Erro ao buscar requisição:", error.message);
      }
    };
    fetchRequest();
  }, []);

  useEffect(() => {
    const fetchCollectors = async () => {
      const response = await getCollector();
      setCollectors(response);
    };
    fetchCollectors();
  }, []);

  useEffect(() => {
    // Sincroniza o mês referente com a data para receber quando o modal carrega
    if (donation.operator_code_id && date) {
      const monthYear = `${DataSelect(date, "year")}-${DataSelect(
        date,
        "month"
      )}-01`;
      setMonthReferent(monthYear);
    }
  }, []);

  useEffect(() => {
    const fetchDonationConfirmationReason = async () => {
      const { data, error } = await supabase
        .from("donor_confirmation_reason")
        .select("donor_confirmation_reason")
        .eq("receipt_donation_id", donation.receipt_donation_id);
      if (error) throw error;
      if (data) {
        setDonorConfirmationReason(data[0]?.donor_confirmation_reason || "");
      }
    };
    fetchDonationConfirmationReason();
  }, []);

  const handleConfirm = async () => {
    if (operator === "") {
      toast.warning("Operador deve ser preenchido!");
      return;
    }

    if (value === "" || date === "") {
      toast.warning("Valor e data devem ser preenchidos!");
      return;
    }
    if (extraValue < 0 || value < 0) {
      toast.warning("Valor e extra não podem ser negativos!");
      return;
    }

    if (dateReceived !== initialDateReceived) {
      if (
        !window.confirm(
          "A data de recebimento foi alterada. \n\n Data inicial: " +
            new Date(initialDateReceived).toLocaleDateString("pt-BR", {timeZone: "UTC"}) +
            "\n Data atual: " +
            new Date(dateReceived).toLocaleDateString("pt-BR", {timeZone: "UTC"}) +
            "\n\n Deseja continuar?"
        )
      ) {
        return;
      }
    }

    setLoadingSave(true);
    try {
      const { data, error } = await supabase
        .from("donation")
        .update([
          {
            donation_value: value,
            donation_extra: extraValue,
            donation_day_to_receive: date,
            donation_day_received: dateReceived,
            donation_description: observation,
            operator_code_id: operator,
            donation_print: impresso ? "Sim" : "Não",
            donation_received: recebido ? "Sim" : "Não",
            donation_monthref: monthReferent,
            collector_code_id: collector,
            donation_campain: campaign,
          },
        ])
        .eq("receipt_donation_id", donation.receipt_donation_id)
        .select();

      if (error) throw error;

      if (data.length > 0) {
        // Registrar edição de doação no histórico
        logDonorActivity({
          donor_id: idDonor,
          operator_code_id: operatorData.operator_code_id,
          action_type: "donation_edit",
          action_description: `Editou a doação de R$ ${originalValues.donation_value} para R$ ${value}`,
          old_values: originalValues,
          new_values: {
            donation_value: value,
            donation_extra: extraValue,
            donation_day_to_receive: date,
            donation_day_received: dateReceived,
            donation_description: observation,
            operator_code_id: operator,
            donation_monthref: monthReferent,
            collector_code_id: collector,
            donation_campain: campaign,
            receipt_donation_id: donation.receipt_donation_id,
          },
          related_donation_id: donation.donation_code_id || null,
        });

        toast.success("Doação atualizado com sucesso");
        setModalEdit(false);
        setObservation("");
      }
    } catch (error) {
      toast.error("Erro ao atualizar doação: ", error.message);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleDelete = async () => {
    console.log({ donation, donorData });
    if (window.confirm("Deseja deletar a doação?")) {
      const { error } = await supabase
        .from("donation")
        .delete()
        .eq("receipt_donation_id", donation.receipt_donation_id);
      if (error) throw error;
      if (!error) {
        // Registrar deleção de doação no histórico
        logDonorActivity({
          donor_id: idDonor,
          operator_code_id: operatorData.operator_code_id,
          action_type: "donation_delete",
          action_description: `Deletou uma doação no valor de R$ ${donation.donation_value}`,
          old_values: {
            donation_value: donation.donation_value,
            donation_day_to_receive: donation.donation_day_to_receive,
            donation_description: donation.donation_description,
            operator_code_id: donation.operator_code_id,
            donation_monthref: donation.donation_monthref,
            donation_extra: donation.donation_extra,
            donation_campain: donation.donation_campain,
            receipt_donation_id: donation.receipt_donation_id,
          },
          related_donation_id: donation.donation_code_id || null,
        });

        toast.success("Doação deletada com sucesso!");
        setModalEdit(false);
      }
    }
  };

  const handleDownloadPDF = async () => {
    setLoadingPDF(true);
    try {
      // Prepara os dados no formato esperado pelo GenerateReceiptPDF
      const donationData = {
        ...donation,
        donor: {
          donor_name: donorData.nome,
          donor_tel_1: donorData.telefone1,
          donor_tel_2: donorData.telefone2,
          donor_tel_3: donorData.telefone3,
          donor_address: donorData.endereco,
          donor_city: donorData.cidade,
          donor_neighborhood: donorData.bairro,
          donor_type: donorData.tipo,
          donor_reference: donorData.referencia,
          donor_observation: donorData.observacao,
          ult_collector: donation.ult_collector,
        },
        donation_campain: donation.donation_campain || "Campanha Geral",
      };

      // Chama o GenerateReceiptPDF com o nome do colaborador no arquivo
      await GenerateReceiptPDF({
        cards: [donationData],
        receiptConfig,
        setOk: () => {},
      });

      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleOpenCpfConfirmModal = () => {
    setShowCpfConfirmModal(true);
  };

  const handleDownloadPDFDeposit = async (cpfVisible) => {
    setShowCpfConfirmModal(false);
    setLoadingDeposit(true);
    const donoAndDonationData = {
      ...donation,
      donor_name: donorData.nome,
      cpf: donorData.cpf,
    };

    try {
      await GenerateDepositPDF({
        data: donoAndDonationData,
        config: receiptConfig,
        cpf_visible: cpfVisible,
      });
      toast.success("PDF para deposito gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF para deposito");
    } finally {
      setLoadingDeposit(false);
    }
  };

  const handleDate = (e) => {
    const value = e.target.value;
    setDate(value);

    if (donation.operator_code_id) {
      const monthYear = `${DataSelect(value, "year")}-${DataSelect(
        value,
        "month"
      )}-01`;
      setMonthReferent(monthYear);
    }
  };

  const handleDateReceived = (e) => {
    const value = e.target.value;
    setDateReceived(value);
  };

  const handleMesRefChange = (e) => {
    const value = e.target.value; // formato: yyyy-mm
    if (value) {
      setMonthReferent(`${value}-01`); // adiciona o dia 01 para o formato yyyy-mm-dd
    } else {
      setMonthReferent("");
    }
  };

  return (
    <main className={styles["modal-donation-container"]}>
      <ModalConfirm
        isOpen={showCpfConfirmModal}
        onClose={() => handleDownloadPDFDeposit(false)}
        onConfirm={() => handleDownloadPDFDeposit(true)}
        title="Exibir CPF no Recibo"
        message="Você deseja usar o CPF no recibo?"
        confirmText="Sim"
        cancelText="Não"
      />
      <div className={styles["modal-donation"]}>
        <div className={styles["modal-donation-content"]}>
          <div className={styles["modal-donation-header"]}>
            <div className={styles["modal-title-section"]}>
              <h2 className={styles["modal-title"]}>
                <FaDollarSign />
                Editar Doação
              </h2>
            </div>
            {request.length > 0 && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    color: "#faa01c",
                    fontSize: "12px",
                    fontWeight: "500",
                    padding: "3px 8px",
                    backgroundColor: "rgba(250, 160, 28, 0.1)",
                    borderRadius: "12px",
                    border: "1px solid rgba(250, 160, 28, 0.3)",
                  }}
                >
                  Lista de trabalho: {request[0].request_name}
                </span>
              </div>
            )}
            {donation.operator_code_id && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    color: "#28a745",
                    fontSize: "12px",
                    fontWeight: "500",
                    padding: "3px 8px",
                    backgroundColor: "rgba(40, 167, 69, 0.1)",
                    borderRadius: "12px",
                    border: "1px solid rgba(40, 167, 69, 0.3)",
                  }}
                >
                  Operador: {request?.[0]?.operator?.operator_name}
                </span>
              </div>
            )}
            <button
              onClick={() => setModalEdit(false)}
              className={styles["btn-close-modal"]}
              title="Fechar"
            >
              ✕
            </button>
          </div>
          <div className={styles["modal-donation-body"]}>
            <div className={styles["form-section"]}>
              <h3>Dados da Doação</h3>
              <div className={styles["form-grid"]}>
                <div className={styles["input-group"]}>
                  <label>Valor *</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0,00"
                    min="0"
                  />
                </div>
                <div className={styles["input-group"]}>
                  <label>Extra *</label>
                  <input
                    type="number"
                    value={extraValue}
                    onChange={(e) => setExtraValue(e.target.value)}
                    placeholder="0,00"
                    disabled={donation.donation_extra === 0}
                    min="0"
                  />
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  {/* Data para Receber*/}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div className={styles["input-group"]}>
                      <label>Data para Receber *</label>
                      <input type="date" value={date} onChange={handleDate} />
                    </div>
                    {donation.donor_type === DONOR_TYPES.MONTHLY && (
                      <div className={styles["input-group"]}>
                        <label>Mês Referente</label>
                        <input
                          type="month"
                          value={
                            monthReferent ? monthReferent.substring(0, 7) : ""
                          }
                          onChange={handleMesRefChange}
                        />
                      </div>
                    )}
                  </div>

                  {/* Data Recebida*/}
                  {donation.donation_received === "Sim" && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className={styles["input-group"]}>
                        <label>Data Recebida *</label>
                        <input
                          type="date"
                          value={dateReceived}
                          onChange={handleDateReceived}
                        />
                      </div>
                      {donation.donor_type === DONOR_TYPES.MONTHLY && (
                        <div className={styles["input-group"]}>
                          <label>Mês Referente</label>
                          <input
                            type="month"
                            value={
                              monthReferent ? monthReferent.substring(0, 7) : ""
                            }
                            onChange={handleMesRefChange}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles["input-group"]}>
                  <label>Operador *</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecione um operador...
                    </option>
                    {operators.map((op) => (
                      <option
                        key={op.operator_code_id}
                        value={op.operator_code_id}
                      >
                        {op.operator_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles["input-group"]}>
                  <label>Coletador *</label>
                  <select
                    value={collector}
                    onChange={(e) => setCollector(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecione um coletador...
                    </option>
                    {collectors.map((op) => (
                      <option
                        key={op.collector_code_id}
                        value={op.collector_code_id}
                      >
                        {op.collector_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles["input-group"]}>
                  <label>Campanha</label>
                  <select
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecione uma campanha...
                    </option>
                    {campaigns?.map((campaign) => (
                      <option key={campaign.id} value={campaign.campain_name}>
                        {campaign.campain_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className={`${styles["input-group"]} ${styles["full-width"]}`}
                >
                  <label>Observação</label>
                  <textarea
                    value={
                      donation.operator_code_id !== 10
                        ? observation
                        : donorConfirmationReason
                    }
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Observações sobre a doação..."
                    rows="3"
                  />
                </div>
              </div>

              {operatorData.operator_type === "Admin" && (
                <div className={styles["status-section"]}>
                  <h4>Status da Doação</h4>
                  <div className={styles["checkbox-group"]}>
                    <label className={styles["checkbox-label"]}>
                      <input
                        type="checkbox"
                        checked={impresso}
                        onChange={(e) => setImpresso(e.target.checked)}
                      />
                      <span className={styles["checkmark"]}></span>
                      Impresso
                    </label>
                    {operatorData.operator_type === "Admin" && (
                      <label className={styles["checkbox-label"]}>
                        <input
                          type="checkbox"
                          checked={recebido}
                          onChange={(e) => setRecebido(e.target.checked)}
                        />
                        <span className={styles["checkmark"]}></span>
                        Recebido
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles["modal-donation-footer"]}>
            <div
              style={{
                display: "flex",
                gap: "12px",
                width: "100%",
                justifyContent: "center",
              }}
            >
              {operatorData.operator_type === "Admin" && (
                <>
                  {donation.donation_received === "Sim" && (
                    <button
                      onClick={handleOpenCpfConfirmModal}
                      disabled={loadingDeposit || loadingPDF || loadingSave}
                      style={{
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: loadingDeposit ? "not-allowed" : "pointer",
                        backgroundColor: loadingDeposit ? "#666" : "#faa01c",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.3s ease",
                        opacity: loadingDeposit ? 0.7 : 1,
                      }}
                      title="Baixar PDF do Recibo"
                    >
                      {loadingDeposit ? (
                        <>
                          <span className={styles["button-spinner"]}></span>{" "}
                          Gerando...
                        </>
                      ) : (
                        "📄 Recibo para Deposito"
                      )}
                    </button>
                  )}

                  <button
                    onClick={handleDownloadPDF}
                    disabled={loadingDeposit || loadingPDF || loadingSave}
                    style={{
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: loadingPDF ? "not-allowed" : "pointer",
                      backgroundColor: loadingPDF ? "#666" : "#28a745",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.3s ease",
                      opacity: loadingPDF ? 0.7 : 1,
                    }}
                    title="Baixar PDF do Recibo"
                  >
                    {loadingPDF ? (
                      <>
                        <span className={styles["button-spinner"]}></span>{" "}
                        Gerando...
                      </>
                    ) : (
                      "📄 Baixar PDF"
                    )}
                  </button>
                </>
              )}
              <button
                onClick={handleDelete}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  backgroundColor: "#c70000",
                  color: "#faf5e9",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.3s ease",
                }}
                title="Excluir Doação"
              >
                🗑️ Excluir
              </button>
              <button
                onClick={handleConfirm}
                disabled={loadingDeposit || loadingPDF || loadingSave}
                className={styles["btn-create-donation"]}
                style={{ minWidth: "auto" }}
              >
                {loadingSave ? (
                  <>
                    <span className={styles["button-spinner"]}></span>{" "}
                    Salvando...
                  </>
                ) : (
                  "💰 Salvar Alterações"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ModalEditDonation;
