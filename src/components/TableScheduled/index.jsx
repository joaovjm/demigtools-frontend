import React from "react";
import "./index.css";
import { DataSelect } from "../DataTime";

const TableScheduled = ({
  scheduled,
  scheduledDonations = [],
  scheduledFromTable = [],
  setModalOpen,
  setScheduledOpen,
  setNowScheduled,
  donationFilterPerId,
}) => {
  console.log({scheduled, scheduledDonations, scheduledFromTable});
  // Combinar dados de todas as fontes
  const allScheduled = [
    ...scheduled.map(item => ({ ...item, source: 'legacy' })),
    ...scheduledDonations.map(item => ({ ...item, source: item.source || 'scheduled_donations' })),
    ...scheduledFromTable.map(item => ({ ...item, source: item.source || 'scheduled_table' }))
  ];
  
  const handleClick = (e) => {
    // Se é doação agendada da tabela donation
    if (e.source === 'donation_agendada') {
      setScheduledOpen({
        id: e.donation_id || e.id,
        donor_id: e.donor_id,
        name: e.donor?.donor_name,
        address: e.donor?.donor_address,
        city: e.donor?.donor_city,
        neighborhood: e.donor?.donor_neighborhood,
        phone: e.donor?.donor_tel_1,
        phone2: null,
        phone3: null,
        phone4: null,
        phone5: null,
        phone6: null,
        observation: e.scheduled_observation,
        scheduling_date: e.scheduled_date,
        operator_code_id: e.operator_code_id,
        typeScheduled: "donation_agendada",
        donationId: e.donation_id || e.id,
        scheduledDonationData: e,
      });
    } else if (e.source === 'scheduled_donations') {
      setScheduledOpen({
        id: e.id,
        donor_id: e.donor_id,
        name: e.donor?.donor_name,
        address: e.donor?.donor_address,
        city: e.donor?.donor_city,
        neighborhood: e.donor?.donor_neighborhood,
        phone: e.donor?.donor_tel_1,
        phone2: null, // donor_tel_2 vem de tabela separada
        phone3: null, // donor_tel_3 vem de tabela separada
        phone4: null,
        phone5: null,
        phone6: null,
        observation: e.scheduled_observation,
        scheduling_date: e.scheduled_date,
        operator_code_id: e.operator_code_id,
        typeScheduled: "scheduled_donation",
        scheduledDonationData: e, // Dados completos do agendamento
      });
    } else if (e.source === 'scheduled_table') {
      setScheduledOpen({
        id: e.id,
        donor_id: e.donor_id,
        name: e.donor?.donor_name,
        address: e.donor?.donor_address,
        city: e.donor?.donor_city,
        neighborhood: e.donor?.donor_neighborhood,
        phone: e.donor?.donor_tel_1,
        phone2: null,
        phone3: null,
        phone4: null,
        phone5: null,
        phone6: null,
        observation: e.scheduled_observation,
        scheduling_date: e.scheduled_date,
        operator_code_id: e.operator_code_id,
        typeScheduled: "scheduled_table",
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        scheduledTableData: e, // Dados completos do agendamento da tabela scheduled
      });
    } else {
      // Lógica existente para leads/requests
      setScheduledOpen({
        id: e.leads_id ? e.leads_id : e.id && e.id,
        donor_id: e.donor_id,
        name: e.leads_name || e.donor?.donor_name,
        address: e.leads_address || e.donor?.donor_address,
        city: e.leads_city,
        neighborhood: e.leads_neighborhood,
        phone: e.leads_tel_1 || e.donor?.donor_tel_1,
        phone2: e.leads_tel_2,
        phone3: e.leads_tel_3,
        phone4: e.leads_tel_4,
        phone5: e.leads_tel_5,
        phone6: e.leads_tel_6,
        leads: e.leads_created,
        date_accessed: e.leads_date_accessed,
        leads_icpf: e.leads_icpf,
        observation: e.leads_observation || e.request_observation,
        scheduling_date: e.leads_scheduling_date,
        operator_code_id: e.operator_code_id,
        typeScheduled: e.leads_id ? "lead" : e.donor_id !== undefined && "request"
      });
    }
    setNowScheduled(e);
    setModalOpen(true);
  };

  const filterScheduled = allScheduled.filter(
    (filter) => filter.operator_code_id === donationFilterPerId
  );

  const dataToShow = donationFilterPerId ? filterScheduled : allScheduled;
  const showPhoneColumn = !donationFilterPerId;

  console.log(dataToShow);

  return (
    <div className="table-scheduled-container">
      <div className="table-scheduled-content">
        {dataToShow?.length > 0 ? (
          <div className="table-scheduled-wrapper">
            <div className="table-scheduled-header">
              <div className="table-scheduled-stats">
                <span className="stats-item">
                  <strong>{dataToShow.length}</strong> {dataToShow.length === 1 ? 'agendamento' : 'agendamentos'}
                </span>
                <span className="stats-item">
                  {showPhoneColumn ? 'Visualização completa' : 'Filtrado por operador'}
                </span>
              </div>
            </div>

            <div className="table-scheduled-scroll">
              <table className="table-scheduled">
                <thead>
                  <tr className="table-scheduled-head-row">
                    <th className="table-scheduled-head">Nome</th>
                    <th className="table-scheduled-head">Observação</th>
                    <th className="table-scheduled-head">Agendado para</th>
                    {showPhoneColumn && (
                      <th className="table-scheduled-head">Telefone Contactado</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {dataToShow.map((item) => {
                    // Determinar os valores baseado na fonte
                    const isScheduledDonation = item.source === 'scheduled_donations' || item.source === 'donation_agendada' || item.source === 'scheduled_table';
                    const itemKey = item.leads_id || item.id;
                    const itemName = isScheduledDonation 
                      ? item.donor?.donor_name 
                      : (item.leads_name || item.donor?.donor_name);
                    const itemObservation = isScheduledDonation
                      ? item.scheduled_observation
                      : (item.leads_observation || item.request_observation);
                    const itemDate = isScheduledDonation
                      ? item.scheduled_date
                      : (item.leads_scheduling_date || item.request_scheduled_date);
                    const itemPhone = isScheduledDonation
                      ? item.scheduled_tel_success
                      : (item.request_tel_success || item.leads_tel_success);
                    
                    return (
                      <tr
                        key={`${item.source}-${itemKey}`}
                        className="table-scheduled-row"
                        onClick={() => handleClick(item)}
                      >
                        <td className="table-scheduled-cell">
                          <span className="scheduled-name">
                            {itemName || "—"}
                          </span>
                        </td>
                        <td className="table-scheduled-cell">
                          <span className="observation-text" title={itemObservation || "Sem observação"}>
                            {itemObservation || "—"}
                          </span>
                        </td>
                        <td className="table-scheduled-cell">
                          <span className="date-info">
                            {itemDate
                              ? new Date(itemDate).toLocaleDateString("pt-BR", {timeZone: "UTC"})
                              : "—"}
                          </span>
                        </td>
                        {showPhoneColumn && (
                          <td className="table-scheduled-cell">
                            <span className="phone-info">
                              {itemPhone || "—"}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="table-scheduled-empty">
            <div className="empty-icon">📅</div>
            <h4>Nenhum agendamento</h4>
            <p>Não há fichas agendadas no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableScheduled;
