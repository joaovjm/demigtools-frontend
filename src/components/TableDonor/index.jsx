import { useEffect, useState, Fragment } from "react";
import "./index.css";
import { getDonation } from "../../helper/getDonation";
import { toast } from "react-toastify";
import { DataSelect } from "../DataTime";

const TableDonor = ({
  idDonor,
  modalShow,
  setModalEdit,
  setDonation,
  modalEdit,
}) => {
  const caracterOperator = JSON.parse(localStorage.getItem("operatorData"));
  const [dados, setDados] = useState([]);

  // Carrega os dados da doação
  useEffect(() => {
    if (idDonor) {
      getDonation(idDonor)
        .then((data) => {
          setDados(data);
        })
        .catch((error) => {
        });
    }
  }, [idDonor, modalShow, modalEdit]);

  const handleEditDonation = (item) => {
    if (caracterOperator.operator_code_id !== item.operator_code_id) {
      if (caracterOperator.operator_type !== "Admin") {
        toast.warning("Não pode editar movimento de outro operator!");
        return;
      }
    }
    if (caracterOperator.operator_type !== "Admin") {
      if (item.donation_print === "Sim" || item.donation_received === "Sim") {
        toast.warning(
          "Impossível editar. Essa ficha já foi impressa ou já foi recebida!"
        );
        return;
      }
    }

    setModalEdit(true);
    setDonation(item);
  };

  return (
    <div className="donor-table-container">
      <div className="donor-table-content">
        {dados.length > 0 ? (
          <div className="donor-table-wrapper">
            <div className="donor-table-header">
              <div className="donor-table-stats">
                <span className="stats-item">
                  <strong>{dados.length}</strong> {dados.length === 1 ? 'registro' : 'registros'}
                </span>
                <span className="stats-item">
                  Total: <strong>
                    {dados.reduce((acc, item) => acc + (item.donation_value || 0) + (item.donation_extra || 0), 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                </span>
              </div>
            </div>

            <div className="donor-table-scroll">
              <table className="donor-table">
                <thead>
                  <tr className="donor-table-head-row">
                    <th className="donor-table-head">Recibo</th>
                    <th className="donor-table-head">Operador</th>
                    <th className="donor-table-head">Valor</th>
                    <th className="donor-table-head">Extra</th>
                    <th className="donor-table-head">Contato</th>
                    <th className="donor-table-head">Receber</th>
                    <th className="donor-table-head">Recebida</th>
                    <th className="donor-table-head">Status</th>
                    <th className="donor-table-head">MesRef</th>
                    <th className="donor-table-head">Coletador</th>
                  </tr>
                </thead>

                <tbody>
                  {dados.map((item) => (
                    <Fragment key={item.receipt_donation_id}>
                      <tr
                        onDoubleClick={() => handleEditDonation(item)}
                        className="donor-table-row"
                      >
                        <td className="donor-table-cell">
                          <span className="receipt-number">{item.receipt_donation_id}</span>
                        </td>
                        <td className="donor-table-cell">
                          <div className="operator-info">
                            <span className="operator-id">{item.operator_code_id}</span>
                            <span className="operator-name">{item.operator?.operator_name}</span>
                          </div>
                        </td>
                        <td className="donor-table-cell">
                          <span className="value-amount">
                            {item?.donation_value?.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </td>
                        <td className="donor-table-cell">
                          <span className="extra-amount">
                            {item?.donation_extra ? item?.donation_extra.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }) : "R$ 0,00"}
                          </span>
                        </td>
                        <td className="donor-table-cell">
                          <span className="date-info">
                            {new Date(
                              item.donation_day_contact
                            ).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                          </span>
                        </td>
                        <td className="donor-table-cell">
                          <span className="date-info">
                            {new Date(
                              item.donation_day_to_receive
                            ).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                          </span>
                        </td>
                        <td className="donor-table-cell">
                          <span className="date-info">
                            {item.donation_day_received
                              ? new Date(
                                  item?.donation_day_received
                                ).toLocaleDateString("pt-BR", {
                                  timeZone: "UTC",
                                })
                              : "—"}
                          </span>
                        </td>
                        <td className="donor-table-cell">
                          <div className="status-group">
                            <span className={`status-badge ${item.donation_print === "Sim" ? "status-success" : "status-pending"}`}>
                              {item.donation_print === "Sim" ? "✓ Impresso" : "○ Não impresso"}
                            </span>
                            <span className={`status-badge ${item.donation_received === "Sim" ? "status-success" : "status-pending"}`}>
                              {item.donation_received === "Sim" ? "✓ Recebido" : "○ Em Aberto"}
                            </span>
                          </div>
                        </td>
                        <td className="donor-table-cell">
                          <span className="month-ref">
                            {item.donation_monthref
                              ? new Date(
                                  item?.donation_monthref
                                ).toLocaleDateString("pt-BR", {month: "numeric", year: "numeric", timeZone: "UTC"})
                              : "—"}
                          </span>
                        </td>
                        <td className="donor-table-cell">
                          <div className="collector-info">
                            <span className="collector-id">{item.collector_code_id || "—"}</span>
                            {item.collector?.collector_name && (
                              <span className="collector-name">{item.collector.collector_name}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr className="donor-table-details-row">
                        <td colSpan="5" className="donor-table-details">
                          <div className="details-section">
                            <span className="details-label">Descrição:</span>
                            <span className="details-value">
                              {item.donation_description || "Nenhuma descrição informada"}
                            </span>
                          </div>
                        </td>
                        <td colSpan="5" className="donor-table-details">
                          <div className="details-section">
                            <span className="details-label">Campanha:</span>
                            <span className="details-value">{item.donation_campain}</span>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="donor-table-empty">
            <div className="empty-icon">📊</div>
            <h4>Nenhuma doação encontrada</h4>
            <p>Este doador ainda não possui registros de doação.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableDonor;
