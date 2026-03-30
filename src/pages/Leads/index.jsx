import React, { useContext, useEffect, useState } from "react";
import "./index.css";
import GetLeadsWithPagination from "../../helper/getLeadsWithPagination";

import { ICONS } from "../../constants/constants";
import { toast, ToastContainer } from "react-toastify";
import { DataNow, DataSelect } from "../../components/DataTime";
import {
  fetchLeadNeighborhoods,
  scheduleLead,
  createDonationFromLead,
} from "../../api/leadsApi.js";
import getSession from "../../auth/getSession";
import Loader from "../../components/Loader";
import updateLeads from "../../helper/updateLeads";
import ModalNewDonation from "../../components/ModalNewDonation";
import ModalScheduling from "../../components/ModalScheduling";
import ModalHistory from "../../components/ModalHistory";
import ModalEditLead from "../../components/ModalEditLead";
import { UserContext } from "../../context/UserContext";
import { registerOperatorActivity, ACTIVITY_TYPES } from "../../services/operatorActivityService";

const Leads = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState(0);
  const [currentItem, setCurrentItem] = useState(1);
  const [currentLead, setCurrentLead] = useState([]);
  const [isModalNewDonationOpen, setIsModalNewDonationOpen] = useState(false);
  const [isModalSchedulingOpen, setIsModalSchedulingOpen] = useState(false);
  const [idSession, setIdSession] = useState("");
  const [isModalHistoryOpen, setIsModalHistoryOpen] = useState(false);
  const [isModalEditLeadOpen, setIsModalEditLeadOpen] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState([]);
  const { operatorData } = useContext(UserContext);

  useEffect(() => {
    const GetSession = async () => {
      const session = await getSession();
      setIdSession(session.user.id);
    };

    GetSession();
  }, []);

  const fetchAvailableNeighborhoods = async () => {
    try {
      const resp = await fetchLeadNeighborhoods();
      const neighborhoods = resp?.data ?? [];
      setAvailableNeighborhoods(neighborhoods);
    } catch (error) {
      console.error("Erro ao buscar bairros:", error.message);
    }
  };

  useEffect(() => {
    if (operatorData.operator_code_id) {
      fetchAvailableNeighborhoods();
    }
  }, [operatorData.operator_code_id]);

  const fetchLeads = async () => {
    setIsLoading(true);
    
    const start = currentItem - 1;
    const end = currentItem - 1;

    const lead = await GetLeadsWithPagination(
      start,
      end,
      setItems,
      setCurrentLead,
      Number(operatorData.operator_code_id),
      selectedNeighborhood
    );

    // Verificar se há leads retornados
    if (lead && Array.isArray(lead) && lead.length > 0 && lead[0]?.leads_id) {
      await updateLeads(
        "Aberto",
        Number(operatorData.operator_code_id),
        lead[0].leads_id
      );
    }

    setIsLoading(false);
    return lead;
  };

  useEffect(() => {
    if (operatorData.operator_code_id) {
      fetchLeads();
    }
  }, [currentItem, selectedNeighborhood, operatorData.operator_code_id]);

  const handleNeighborhoodChange = (e) => {
    setSelectedNeighborhood(e.target.value);
    setCurrentItem(1); // Reset para o primeiro lead quando mudar o filtro
  };

  const reloadAfterProcess = async () => {
    // Se estávamos no último lead e ele foi processado
    if (currentItem === items && items === 1) {
      // Era o último lead, agora não há mais
      setItems(0);
      setCurrentLead(null);
      return;
    }
    
    if (currentItem === items && items > 1) {
      // Era o último lead, mas ainda há outros antes
      setCurrentItem(currentItem - 1);
      return;
    }
    
    // Nos outros casos, recarregar na mesma posição
    await fetchLeads();
  };

  const handleNext = async () => {
    if (window.confirm("Deseja passar para o proximo?")) {
      if (currentLead?.leads_id) {
        const data = await updateLeads(
          "Não Atendeu",
          Number(operatorData.operator_code_id),
          currentLead.leads_id
        );
        if (data && data[0]?.leads_status === "Não Atendeu") {
          // Registra atividade de lead não atendeu
          await registerOperatorActivity({
            operatorId: operatorData.operator_code_id,
            operatorName: operatorData.operator_name,
            activityType: ACTIVITY_TYPES.LEAD_NOT_ANSWERED,
            donorName: currentLead.leads_name,
            metadata: { leadId: currentLead.leads_id, source: "leads" },
          });
          // Recarregar leads após marcar como não atendeu
          await reloadAfterProcess();
        }
      }
    }
  };

  const handleNoDonation = async () => {
    if (window.confirm("Confirma que o colaborador não poderá ajudar?")) {
      const response = await updateLeads(
        "Não pode ajudar",
        Number(operatorData.operator_code_id),
        currentLead.leads_id
      );
      if (response && response.length > 0) {
        // Registra atividade de lead não pode ajudar
        await registerOperatorActivity({
          operatorId: operatorData.operator_code_id,
          operatorName: operatorData.operator_name,
          activityType: ACTIVITY_TYPES.LEAD_CANNOT_HELP,
          donorName: currentLead.leads_name,
          metadata: { leadId: currentLead.leads_id, source: "leads" },
        });
        // Recarregar leads após processar
        await reloadAfterProcess();
      }
    }
  };

  const handleScheduling = (e) => {
    setIsModalNewDonationOpen(false);
    setIsModalSchedulingOpen(true);
  };


  const handleAction = (e) => {
    setIsModalSchedulingOpen(false);
    setIsModalNewDonationOpen(true);
  };

  const handleSchedulingSave = async (formData) => {
    if (!formData.dateScheduling || !formData.telScheduling) {
      toast.warning("Preencha data e telefone usado para contato...");
      return;
    }
    try {
      await scheduleLead({
        leads_id: currentLead.leads_id,
        dateScheduling: formData.dateScheduling,
        telScheduling: formData.telScheduling,
        observationScheduling: formData.observationScheduling,
      });

      // Registra atividade de lead agendado
      await registerOperatorActivity({
        operatorId: operatorData.operator_code_id,
        operatorName: operatorData.operator_name,
        activityType: ACTIVITY_TYPES.LEAD_SCHEDULED,
        donorName: currentLead.leads_name,
        metadata: {
          leadId: currentLead.leads_id,
          source: "leads",
          scheduledDate: formData.dateScheduling,
        },
      });

      toast.success("Agendado com sucesso!");
      setIsModalSchedulingOpen(false);
      await reloadAfterProcess();
    } catch (error) {
      console.error("Erro: ", error?.message || error);
      toast.error("Erro ao agendar lead");
    }
  };

  const handleNewDonationSave = async (formData) => {
    if (
      formData.address === "" ||
      formData.city === "" ||
      formData.neighborhood === "" ||
      formData.telSuccess === "" ||
      formData.valueDonation === "" ||
      formData.dateDonation === "" ||
      formData.campain === ""
    ) {
      toast.warning("Preencha todos os campos obrigatórios!");
    } else {
      toast.promise(
        (async () => {
          try {
            const resp = await createDonationFromLead({
              leads_id: currentLead.leads_id,
              operator_code_id: operatorData.operator_code_id,
              formData,
            });

            const out = resp?.data ?? {};
            const donorId = out?.donor_id;

            // Registra atividade de lead sucesso (nova doação)
            await registerOperatorActivity({
              operatorId: operatorData.operator_code_id,
              operatorName: operatorData.operator_name,
              activityType: ACTIVITY_TYPES.LEAD_SUCCESS,
              donorId,
              donorName: currentLead.leads_name,
              metadata: { 
                leadId: currentLead.leads_id, 
                source: "leads",
                donationValue: formData.valueDonation,
              },
            });

            setIsModalNewDonationOpen(false);
            
            // Recarregar leads após processar
            await reloadAfterProcess();

            return "Processo concluido com sucesso!";
          } catch (error) {
            console.error("Erro na operação:", error.message);
            throw error;
          }
        })(),
        {
          pending: "Processando doação...",
          success: (message) => message,
          error: "Erro ao processar a operação",
        }
      );
    }
  };

  return (
    <main className="leads-container">
      <div className="leads-content">
        {/* Header */}
        <header className="leads-header">
          <h2 className="leads-title">{ICONS.CIRCLEOUTLINE} Gerenciar Leads</h2>
          <div className="leads-filters">
            <div className="filter-group">
              <label htmlFor="neighborhood-filter" className="filter-label">Filtrar por Bairro:</label>
              <select
                id="neighborhood-filter"
                value={selectedNeighborhood}
                onChange={handleNeighborhoodChange}
                className="filter-select"
              >
                <option value="">Todos os bairros</option>
                {availableNeighborhoods.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="leads-btn secondary" onClick={() => setIsModalHistoryOpen(true)}>Histórico de Leads</button>
          <div className="leads-stats">
            <span className="leads-counter">Lead {currentItem} de {items}</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="leads-main-content">
          {isLoading ? (
            <div className="leads-loading">
              <Loader />
              <p>Carregando lead...</p>
            </div>
          ) : items === 0 ? (
            <div className="leads-empty-state">
              <div className="empty-state-icon">{ICONS.CIRCLEOUTLINE}</div>
              <h3>Nenhum lead disponível</h3>
              <p>Não há leads disponíveis no momento{selectedNeighborhood && ` para o bairro "${selectedNeighborhood}"`}.</p>
              {selectedNeighborhood && (
                <button 
                  className="leads-btn secondary" 
                  onClick={() => setSelectedNeighborhood("")}
                >
                  Limpar filtro
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Lead Information Section */}
              <div className="leads-section">
                <h3 className="leads-section-title">Informações do Lead</h3>
                <div className="leads-info-card">
                  <div className="lead-name">
                    <h4>{currentLead.leads_name}</h4>
                  </div>
                  
                  <div className="lead-details">
                    <div className="lead-section">
                      <h5>Contatos</h5>
                      <div className="contact-grid">
                        {currentLead.leads_tel_1 && (
                          <div className="contact-item">
                            <span className="contact-label">Telefone 1:</span>
                            <span className="contact-value">{currentLead.leads_tel_1}</span>
                          </div>
                        )}
                        {currentLead.leads_tel_2 && (
                          <div className="contact-item">
                            <span className="contact-label">Telefone 2:</span>
                            <span className="contact-value">{currentLead.leads_tel_2}</span>
                          </div>
                        )}
                        {currentLead.leads_tel_3 && (
                          <div className="contact-item">
                            <span className="contact-label">Telefone 3:</span>
                            <span className="contact-value">{currentLead.leads_tel_3}</span>
                          </div>
                        )}
                        {currentLead.leads_tel_4 && (
                          <div className="contact-item">
                            <span className="contact-label">Telefone 4:</span>
                            <span className="contact-value">{currentLead.leads_tel_4}</span>
                          </div>
                        )}
                        {currentLead.leads_tel_5 && (
                          <div className="contact-item">
                            <span className="contact-label">Telefone 5:</span>
                            <span className="contact-value">{currentLead.leads_tel_5}</span>
                          </div>
                        )}
                        {currentLead.leads_tel_6 && (
                          <div className="contact-item">
                            <span className="contact-label">Telefone 6:</span>
                            <span className="contact-value">{currentLead.leads_tel_6}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lead-section">
                      <h5>Localização</h5>
                      <div className="location-info">
                        <div className="location-item">
                          <span className="location-label">Bairro:</span>
                          <span className="location-value">{currentLead.leads_neighborhood}</span>
                        </div>
                        {currentLead?.leads_value && (
                          <div className="location-item">
                            <span className="location-label">Valor da doação:</span>
                            <span className="location-value">
                              {Number(currentLead.leads_value).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isModalNewDonationOpen && !isModalSchedulingOpen && (
                <div className="leads-actions">
                  <div className="action-buttons">
                    <button
                      onClick={handleNoDonation}
                      className="leads-btn danger"
                    >
                      Não pode ajudar
                    </button>
                    <button
                      onClick={handleScheduling}
                      className="leads-btn warning"
                    >
                      Agendar
                    </button>
                    <button 
                      onClick={handleAction} 
                      className="leads-btn primary"
                    >
                      {ICONS.CIRCLEOUTLINE} Nova doação
                    </button>
                    <button 
                      className="leads-btn secondary" 
                      onClick={handleNext}
                    >
                      Não Atendeu
                    </button>
                    <button 
                      className="leads-btn secondary" 
                      onClick={() => setIsModalEditLeadOpen(true)}
                    >
                      {ICONS.EDIT} Editar Lead
                    </button>
                  </div>
                </div>
              )}
            </>
          )}


        <ToastContainer closeOnClick="true" />
        </div>
      </div>

      {/* Modals */}
      <ModalNewDonation
        isOpen={isModalNewDonationOpen}
        onClose={() => setIsModalNewDonationOpen(false)}
        currentLead={currentLead}
        onSave={handleNewDonationSave}
        operatorID={operatorData.operator_code_id}
      />

      <ModalScheduling
        isOpen={isModalSchedulingOpen}
        onClose={() => setIsModalSchedulingOpen(false)}
        currentLead={currentLead}
        onSave={handleSchedulingSave}
      />

      {isModalHistoryOpen && (
        <ModalHistory
          onClose={() => setIsModalHistoryOpen(false)}
          operatorData={operatorData}
        />
      )}

      <ModalEditLead
        isOpen={isModalEditLeadOpen}
        onClose={() => setIsModalEditLeadOpen(false)}
        leadId={currentLead?.leads_id}
        initialEditMode={true}
        onSave={async (updatedLead) => {
          // Atualiza o lead atual com os dados atualizados e recarrega
          setCurrentLead(updatedLead);
          setIsModalEditLeadOpen(false);
          // Recarrega os dados do lead para garantir sincronização
          await fetchLeads();
        }}
      />
    </main>
  );
};

export default Leads;
