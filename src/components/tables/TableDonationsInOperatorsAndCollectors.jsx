import React, { useEffect, useState } from "react";
import supabase from "../../helper/superBaseClient";
import styles from "./tableDonationsInOperatorsAndCollectors.module.css"
import { useNavigate } from "react-router";
import { DataSelect } from "../DataTime";
import { navigateWithNewTab } from "../../utils/navigationUtils";

const TableDonationsInOperatorsAndCollectors = ({
  click,
  startDate,
  endDate,
  filter,
  statusFilter = null, // null = todas, "Sim" = recebidas, "Não" = em aberto
}) => {
  const [donations, setDonations] = useState([]);
  const [oc, setOc] = useState()

  const navigate = useNavigate()
  let f;

  if (filter === "Operadores") {
    f = "operator_code_id";
  } else if (filter === "Coletadores") {
    f = "collector_code_id";
  }

  const getRelatory = async () => {
    try {
      let query = supabase
        .from("donation")
        .select(
          "donation_day_received, donation_day_to_receive, donation_print, donation_received, donation_value, receipt_donation_id, donor_id, donor: donor_id(donor_name, donor_tel_1), operator_code_id, operator: operator_code_id(operator_name), collector_code_id, collector: collector_code_id(collector_name)"
        )
        .eq(f, click.id)
        .gte("donation_day_received", startDate)
        .lte("donation_day_received", endDate);

      // Aplica filtro de status se fornecido
      if (statusFilter !== null) {
        query = query.eq("donation_received", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!error) setDonations(data);
  
    } catch (error) {
      console.log("Erro: ", error.message);
    }
  };
  useEffect(() => {
    getRelatory();
    setOc(filter)
  }, [click, statusFilter]);

  const handleClick = (id, event) => {
    navigateWithNewTab(event, `/donor/${id}`, navigate);
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
          <tr key={index} onDoubleClick={(e) => handleClick(donation.donor_id, e)} title="Duplo-clique para abrir (Ctrl+Click para nova aba)">
            <td>{donation.receipt_donation_id}</td>
            <td>{donation.donation_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>{donation.donor.donor_name}</td>
            <td>{donation.donor.donor_tel_1}</td>
            <td>
              {filter ===
                "Coletadores" ? `${donation.operator?.operator_name}` : `${donation.collector?.collector_name}`}
            </td>
            <td>{new Date(donation.donation_day_to_receive).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
            <td>{donation.donation_day_received ? new Date(donation.donation_day_received).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
            <td>{donation.donation_print}</td>
            <td>{donation.donation_received}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableDonationsInOperatorsAndCollectors;
