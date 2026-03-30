import React, { useEffect, useState } from "react";
import styles from "./tableDonationsInOperatorsAndCollectors.module.css";
import { useNavigate } from "react-router";
import { DataSelect } from "../DataTime";
import { navigateWithNewTab } from "../../utils/navigationUtils";
import { fetchDonationsByEntityWork } from "../../api/dashboardApi.js";
import { toast } from "react-toastify";

const TableDonationsInOperatorsAndCollectors = ({
  click,
  startDate,
  endDate,
  filter,
  statusFilter = null,
}) => {
  const [donations, setDonations] = useState([]);
  const [oc, setOc] = useState();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const getRelatory = async () => {
      if (!click?.id || !startDate || !endDate || !filter) {
        setDonations([]);
        return;
      }

      setLoading(true);
      setOc(filter);

      try {
        const data = await fetchDonationsByEntityWork({
          filterType: filter,
          entityId: click.id,
          startDate,
          endDate,
          donationReceived: statusFilter,
        });
        if (!cancelled) {
          setDonations(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Erro: ", error);
          toast.error(error?.message || "Erro ao carregar doações");
          setDonations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    getRelatory();
    return () => {
      cancelled = true;
    };
  }, [click, startDate, endDate, filter, statusFilter]);

  const handleClick = (id, event) => {
    navigateWithNewTab(event, `/donor/${id}`, navigate);
  };

  if (loading) {
    return (
      <p style={{ padding: "12px", color: "var(--color-muted, #9e9e9e)" }}>
        Carregando…
      </p>
    );
  }

  return (
    <table className={styles.tableContainer}>
      <thead className={styles.tableDoacHead}>
        <tr>
          <th>Recibo</th>
          <th>Valor</th>
          <th>Nome</th>
          <th>Telefone</th>
          <th>{oc === "Coletadores" ? "Operador" : "Coletador"}</th>
          <th>Data Receber</th>
          <th>Data Recebida</th>
          <th>Impresso</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody className={styles.tableDoacBody}>
        {donations.map((donation, index) => (
          <tr
            key={donation.receipt_donation_id ?? index}
            onDoubleClick={(e) => handleClick(donation.donor_id, e)}
            title="Duplo-clique para abrir (Ctrl+Click para nova aba)"
          >
            <td>{donation.receipt_donation_id}</td>
            <td>
              {(donation.donation_value ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </td>
            <td>{donation.donor?.donor_name ?? "—"}</td>
            <td>{donation.donor?.donor_tel_1 ?? "—"}</td>
            <td>
              {filter === "Coletadores"
                ? donation.operator?.operator_name ?? "—"
                : donation.collector?.collector_name ?? "—"}
            </td>
            <td>
              {donation.donation_day_to_receive
                ? DataSelect(donation.donation_day_to_receive)
                : "—"}
            </td>
            <td>
              {donation.donation_day_received
                ? DataSelect(donation.donation_day_received)
                : "-"}
            </td>
            <td>{donation.donation_print ?? "—"}</td>
            <td>{donation.donation_received ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableDonationsInOperatorsAndCollectors;
