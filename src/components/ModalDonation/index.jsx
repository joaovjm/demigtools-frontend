import React, { useContext, useEffect, useState } from "react";
import styles from "./modaldonation.module.css";

import { FaDollarSign } from "react-icons/fa";
import { DataNow, DataSelect } from "../DataTime";
import { toast } from "react-toastify";
import { fetchActiveCampains } from "../../api/campainsApi";
import { createDonationRequest, updateCollectorForDonorRequest } from "../../api/donationsApi";
import { fetchDonorActiveRequest } from "../../api/donorApi";
import { UserContext } from "../../context/UserContext";
import { getOperators } from "../../helper/getOperators";
import { logDonorActivity } from "../../helper/logDonorActivity";

const ModalDonation = ({
  modalShow,
  setModalShow,
  mensalidade,
  tipo,
  donor_id,
}) => {
  const [comissao, setComissao] = useState("");
  const [valor, setValor] = useState("");
  const [data_receber, setData_receber] = useState(DataNow("noformated"));
  const { operatorData } = useContext(UserContext);
  const [descricao, setDescricao] = useState("");
  const [impresso, setImpresso] = useState("");
  const [recebido, setRecebido] = useState("");
  const [mesref, setMesref] = useState(() => {
    if (tipo === "Mensal") {
      return DataNow("noformated");
    } else {
      return "";
    }
  });

  const [operator, setOperator] = useState(operatorData.operator_code_id);
  const [campain, setCampain] = useState([]);
  const [campainSelected, setCampainSelect] = useState("");
  const [operators, setOperators] = useState([]);
  const [extra, setExtra] = useState(false);
  const [request, setRequest] = useState([]);
  const data_contato = DataNow("noformated");

  const fetchCampains = async () => {
    const response = await fetchActiveCampains();
    setCampain(response || []);
  };

  const fetchOperators = async () => {
    const response = await getOperators({
      active: "true",
      item: "operator_code_id, operator_name",
    });

    setOperators(response);
  };

  useEffect(() => {
    fetchCampains();
    fetchOperators();
  }, []);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const data = await fetchDonorActiveRequest(donor_id);
        setRequest(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar requisição:", error.message);
        setRequest([]);
      }
    };
    if (donor_id) {
      fetchRequest();
    }
  }, [donor_id]);

  useEffect(() => {
    if (extra) {
      setValor(comissao);
      setDescricao("Somente Extra")
      return;
    }
    if (mensalidade && comissao == "") {
      setValor(mensalidade);
    } else if (mensalidade && comissao != "") {
      setValor(Number(mensalidade) + Number(comissao));
    }
  }, [comissao]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (campainSelected === "") {
      toast.warning("Selecione a campanha");
      return;
    }


    const runCreate = async () => {
      const res = await createDonationRequest({
        donor_id,
        operator_code_id: operator,
        valor,
        comissao: comissao || null,
        data_receber,
        descricao,
        mesref: mesref || null,
        campain: campainSelected,
        collector_code_id: null,
        request_name: null,
        requestRowId: null,
        impresso: impresso === true,
        recebido: recebido === true,
      });
      const created = res?.donation?.[0];
      if (created) {
        logDonorActivity({
          donor_id: donor_id,
          operator_code_id: operatorData.operator_code_id,
          action_type: "donation_create",
          action_description: `Criou uma doação no valor de R$ ${valor}${comissao ? ` (Extra: R$ ${comissao})` : ""}`,
          new_values: {
            donation_value: valor,
            donation_extra: comissao,
            donation_day_to_receive: data_receber,
            donation_description: descricao,
            donation_monthref: mesref,
            donation_campain: campainSelected,
            receipt_donation_id: created.receipt_donation_id,
          },
          related_donation_id: created.donation_code_id || null,
        });

        const updateResult = await updateCollectorForDonorRequest({
          donorId: donor_id,
          oldCollectorId: 10,
          newCollectorId: 11,
        });
        if (updateResult?.success && updateResult.count > 0) {
          console.log(`${updateResult.count} doação(ões) atualizada(s) do coletor 10 para 11`);
        }
      }
      setModalShow(false);
      setValor("");
      setComissao("");
      setData_receber("");
      setDescricao("");
      setImpresso("");
      setRecebido("");
      setMesref("");
    };

    try {
      await toast.promise(runCreate(), {
        pending: "Criando doação...",
        success: "Doação criada com sucesso!",
        error: "Erro ao criar doação!",
      });
    } catch (_) {}
  };

  const handleDate = (e) => {
    var value = e.target.value;
    const now = DataNow("noformated");

    setData_receber(value);

    if (tipo === "Mensal") {
      const monthYear = `${DataSelect(value, "year")}-${DataSelect(
        value,
        "month"
      )}-01`;
      setMesref(monthYear);
    }
  };

  const handleMesRefChange = (e) => {
    const value = e.target.value; // formato: yyyy-mm
    if (value) {
      setMesref(`${value}-01`); // adiciona o dia 01 para o formato yyyy-mm-dd
    } else {
      setMesref("");
    }
  };

  return (
    <main className={styles['modal-donation-container']}>
      <div className={styles['modal-donation']}>
        <div className={styles['modal-donation-content']}>
          <div className={styles['modal-donation-header']}>
            <div className={styles['modal-title-section']}>
              <h2 className={styles['modal-title']}>
                <FaDollarSign />
                Nova Doação
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
            {operator && (
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
                  Operador: {request?.[0]?.operator?.operator_name || operators.find(op => op.operator_code_id === operator)?.operator_name}
                </span>
              </div>
            )}
            {tipo === "Mensal" && operatorData.operator_type === "Admin" && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px"}}>
                <label>Somente Extra?</label>
                <input
                  type="checkbox"
                  checked={extra}
                  onChange={(e) => setExtra(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
              </div>
            )}
            <button
              onClick={() => setModalShow(!modalShow)}
              className={styles['btn-close-modal']}
              title="Fechar"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles['modal-donation-body']}>
            <div className={styles['form-section']}>
              <h3>Dados da Doação</h3>
              <div className={styles['form-grid']}>
                <div className={styles['input-group']}>
                  <label>Valor *</label>
                  <input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                    required
                    disabled={extra}
                    min="0"
                  />
                </div>

                {tipo === "Mensal" && (
                  <div className={styles['input-group']}>
                    <label>Extra</label>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={comissao}
                      onChange={(e) => setComissao(e.target.value)}
                      min="0"
                    />
                  </div>
                )}

                <div className={styles['input-group']}>
                  <label>Data para Receber *</label>
                  <input
                    type="date"
                    value={data_receber}
                    onChange={handleDate}
                    required
                  />
                </div>

                {tipo === "Mensal" && (
                  <div className={styles['input-group']}>
                    <label>Mês Referente</label>
                    <input
                      type="month"
                      value={mesref ? mesref.substring(0, 7) : ""}
                      onChange={handleMesRefChange}
                    />
                  </div>
                )}

                <div className={styles['input-group']}>
                  <label>Operador *</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    required
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

                <div className={styles['input-group']}>
                  <label>Campanha *</label>
                  <select
                    value={campainSelected}
                    onChange={(e) => setCampainSelect(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Selecione uma campanha...
                    </option>
                    {campain.map((cp) => (
                      <option key={cp.id} value={cp.campain_name}>
                        {cp.campain_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles['input-group']} ${styles['full-width']}`}>
                  <label>Descrição</label>
                  <textarea
                    placeholder="Observações sobre a doação..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows="3"
                  />
                </div>
              </div>

              {/*{operatorData.operator_type === "Admin" && (
                <div className={styles['status-section']}>
                  <h4>Status da Doação</h4>
                  <div className={styles['checkbox-group']}>
                    <label className={styles['checkbox-label']}>
                      <input
                        type="checkbox"
                        checked={impresso}
                        onChange={(e) => setImpresso(e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Impresso
                    </label>
                    <label className={styles['checkbox-label']}>
                      <input
                        type="checkbox"
                        checked={recebido}
                        onChange={(e) => setRecebido(e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      Recebido
                    </label>
                  </div>
                </div>
              )}*/}
            </div>

            <div className={styles['modal-donation-footer']}>
              <button type="submit" className={styles['btn-create-donation']}>
                💰 Criar Doação
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ModalDonation;
