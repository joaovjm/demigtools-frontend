import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
//import getDonationReceived from "../../helper/getDonationReceived";
// import getDonationPerMonthReceived from "../../helper/getDonationPerMonthReceived";
import { DataNow } from "../../components/DataTime";
import TableConfirmation from "../../components/TableConfirmation";
import TableInOpen from "../../components/TableInOpen";
import ModalConfirmations from "../../components/ModalConfirmations";
import { toast } from "react-toastify";
import TableScheduled from "../../components/TableScheduled";
import ModalScheduled from "../../components/ModalScheduled";
import { UserContext } from "../../context/UserContext";
import ModalDonationInOpen from "../../components/ModalDonationInOpen";
import { useLocation } from "react-router";
import MotivationalPhrases from "../../components/MotivationalPhrases";
import getOperatorMeta from "../../helper/getOperatorMeta";
import TableReceived from "../../components/TableReceived";
import {
  fetchDashboardCards,
  fetchDashboardReceivedTable,
  fetchDashboardConfirmationTable,
  fetchDashboardOpenTable,
  fetchDashboardScheduledTable,
} from "../../api/dashboardApi.js";
import apiClient from "../../services/apiClient.js";

const Dashboard = () => {
  const [confirmations, setConfirmations] = useState(null); //Quantidade de fichas na confirmação
  const [valueConfirmations, setValueConfirmations] = useState(null); //Total valor na confirmação
  const [openDonations, setOpenDonations] = useState(null); //Quantidades de fichas em aberto
  const [valueOpenDonations, setValueOpenDonations] = useState(null); //Total valor de fichas em aberto
  const [valueMonthReceived, setValueMonthReceived] = useState(null); //Total valor dos recebidos do atual Mês
  const [scheduling, setScheduling] = useState(0); //Total de leads agendadas
  const [active, setActive] = useState(false);
  const [scheduledTotalCount, setScheduledTotalCount] = useState(0);
  const [nowScheduled, setNowScheduled] = useState(null);
  const { operatorData } = useContext(UserContext);
  const operatorSessionData = useMemo(() => {
    try {
      const raw = localStorage.getItem("operatorData");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [operatorData?.operator_code_id, operatorData?.operator_type]);
  const sessionOperatorCodeId =
    operatorData?.operator_code_id ?? operatorSessionData?.operator_code_id ?? null;
  const sessionOperatorType =
    operatorData?.operator_type ?? operatorSessionData?.operator_type ?? "Operador";

  const [donationConfirmationOpen, setDonationConfirmationOpen] = useState([]);
  const [donationOpen, setDonationOpen] = useState([]);
  const [scheduledOpen, setScheduledOpen] = useState([]);
  const [donationConfirmation, setDonationConfirmation] = useState([]);
  const [fullNotReceivedDonations, setFullNotReceivedDonations] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [scheduledDonations, setScheduledDonations] = useState([]);
  const [scheduledFromTable, setScheduledFromTable] = useState([]);
  const [donationFilterPerId, setDonationFilterPerId] = useState("");
  const [donationsOperator, setDonationsOperator] = useState()
  const [meta, setMeta] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const prevModalOpenRef = useRef(modalOpen);

  const monthref = DataNow("mesref");

  const [status, setStatus] = useState();

  const location = useLocation();

  const loadCards = async () => {
    if (!sessionOperatorCodeId) return;
    const cards = await fetchDashboardCards({
      operatorCodeId: sessionOperatorCodeId,
      operatorType: sessionOperatorType,
    });

    setConfirmations(cards.confirmations);
    setValueConfirmations(cards.valueConfirmations);
    setOpenDonations(cards.openDonations);
    setValueOpenDonations(cards.valueOpenDonations);
    setValueMonthReceived(cards.valueReceived);
    setScheduledTotalCount(cards.scheduledTotal);
  };

  const loadActiveTable = async (activeCard) => {
    if (!sessionOperatorCodeId) return;

    if (activeCard === "inConfirmation") {
      const rows = await fetchDashboardConfirmationTable({
        operatorCodeId: sessionOperatorCodeId,
        operatorType: sessionOperatorType,
      });
      setDonationConfirmation(rows);
      return;
    }

    if (activeCard === "inOpen") {
      const rows = await fetchDashboardOpenTable({
        operatorCodeId: sessionOperatorCodeId,
        operatorType: sessionOperatorType,
      });
      setFullNotReceivedDonations(rows);
      return;
    }

    if (activeCard === "inScheduled") {
      const payload = await fetchDashboardScheduledTable({
        operatorCodeId: sessionOperatorCodeId,
        operatorType: sessionOperatorType,
      });
      setScheduled(payload.scheduled || []);
      setScheduledDonations(payload.scheduledDonations || []);
      setScheduledFromTable(payload.scheduledFromTable || []);
      return;
    }

    if (activeCard === "received") {
      const rows = await fetchDashboardReceivedTable({
        operatorCodeId: sessionOperatorCodeId,
        operatorType: sessionOperatorType,
      });
      setDonationsOperator(rows || []);
    }
  };

  useEffect(() => {
    const getMeta = async () => {
      const metaInfo = await getOperatorMeta(sessionOperatorCodeId);
      setMeta(metaInfo);
    };
    if (sessionOperatorCodeId) getMeta();
  }, [sessionOperatorCodeId]);

  useEffect(() => {
    // Cards carregam sempre (sem buscar tabelas pesadas).
    loadCards().catch((e) => console.error("Erro ao carregar cards:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionOperatorCodeId, sessionOperatorType]);

  useEffect(() => {
    // Carrega a tabela somente quando o card estiver ativo.
    if (!active) return;
    loadActiveTable(active).catch((e) =>
      console.error("Erro ao carregar tabela:", e)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!status) return;

    if (status === "OK") {
      toast.success("Ficha cancelada com sucesso!", {
        position: "top-right",
        autoClose: 1000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else if (status === "Update OK") {
      toast.success("Ficha recriada com sucesso!", {
        position: "top-right",
        autoClose: 1000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }

    loadCards().catch((e) => console.error("Erro ao recarregar cards:", e));
    if (active) {
      loadActiveTable(active).catch((e) =>
        console.error("Erro ao recarregar tabela:", e)
      );
    }
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Atualiza dados quando o usuário fecha modais após ações que alteram status
  useEffect(() => {
    if (!prevModalOpenRef.current) {
      prevModalOpenRef.current = modalOpen;
      return;
    }

    if (prevModalOpenRef.current && !modalOpen) {
      loadCards().catch((e) => console.error("Erro ao recarregar cards:", e));
      if (active) {
        loadActiveTable(active).catch((e) =>
          console.error("Erro ao recarregar tabela:", e)
        );
      }
    }

    prevModalOpenRef.current = modalOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, active]);

  useEffect(() => {
    setActive(false);
    setDonationFilterPerId("");
    setModalOpen(false);
  }, [location.pathname]);

  const handleClickCard = (e) => {
    setActive(e.currentTarget.id);
  };

  return (
    <main className="mainDashboard">
      <>
        <section className="sectionHeader">
          {/* Card Agendados */}
          <div
            id="inScheduled"
            className={`divCard ${active === "inScheduled" ? "active" : ""}`}
            onClick={handleClickCard}
          >
            <div className="divHeader">
              <h3 className="h3Header">Agendados</h3>
            </div>
            <div className="divBody">
              <p>{scheduledTotalCount}</p>
            </div>
          </div>
          
          {/* Card Em Confirmação */}
          <div
            id="inConfirmation"
            className={`divCard ${active === "inConfirmation" ? "active" : ""}`}
            onClick={handleClickCard}
          >
            <div className="divHeader">
              <h3 className="h3Header">Em Confirmação</h3>
            </div>
            <div className="divBody">
              <p>{confirmations}</p>
              <p>R$ {valueConfirmations}</p>
            </div>
          </div>

          {/* Card Em Aberto */}
          <div
            id="inOpen"
            className={`divCard ${active === "inOpen" ? "active" : ""}`}
            onClick={handleClickCard}
          >
            <div className="divHeader">
              <h3 className="h3Header">Em Aberto</h3>
            </div>
            <div className="divBody">
              <p>{openDonations}</p>
              <p>R$ {valueOpenDonations}</p>
            </div>
          </div>

          {/* Card Recebida / Falta */}
          <div
            id="received"
            className={`divCard ${active === "received" ? "active" : ""}`}
            onClick={handleClickCard}
          >
            <div className="divHeader">
              <h3 className="h3Header">Recebida / Falta</h3>
            </div>
            <div className="divBody">
              <p>R$ {valueMonthReceived}</p>
              <p>R$ {(meta[0]?.meta - valueMonthReceived).toFixed(2)}</p>
            </div>
          </div>
        </section>

        {!active && (
          <section className="motivational">
            <div className="motivational-card">{<MotivationalPhrases />}</div>
          </section>
        )}
        <section className="sectionGrafico">
          {active === "inConfirmation" ? (
            <>
              <TableConfirmation
                donationConfirmation={donationConfirmation}
                setModalOpen={setModalOpen}
                setDonationConfirmationOpen={setDonationConfirmationOpen}
              />
            </>
          ) : active === "inOpen" ? (
            <TableInOpen
              fullNotReceivedDonations={fullNotReceivedDonations}
              setDonationOpen={setDonationOpen}
              setModalOpen={setModalOpen}
            />
          ) : active === "inScheduled" ? (
            <TableScheduled
              scheduled={scheduled}
              scheduledDonations={scheduledDonations}
              scheduledFromTable={scheduledFromTable}
              setModalOpen={setModalOpen}
              setScheduledOpen={setScheduledOpen}
              setNowScheduled={setNowScheduled}
            />
          ) : active === "received" ? (
            <TableReceived donationsOperator={donationsOperator} operatorType={sessionOperatorType} />
          ) : null}
        </section>
        {modalOpen && active === "inConfirmation" && (
          <ModalConfirmations
            donationConfirmationOpen={donationConfirmationOpen}
            onClose={() => setModalOpen(false)}
          />
        )}
        {modalOpen && active === "inScheduled" && (
          <ModalScheduled
            scheduledOpen={scheduledOpen}
            onClose={() => setModalOpen(false)}
            setStatus={setStatus}
            nowScheduled={nowScheduled}
          />
        )}
        {modalOpen && active === "inOpen" && (
          <ModalDonationInOpen
            donationOpen={donationOpen}
            onClose={() => setModalOpen(false)}
          />
        )}
      </>
    </main>
  );
};

export default Dashboard;
