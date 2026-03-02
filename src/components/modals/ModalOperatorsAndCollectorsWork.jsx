import React, { useState } from "react";
import "./index.css";
import TableDonationsInOperatorsAndCollectors from "../tables/TableDonationsInOperatorsAndCollectors";

const ModalOperatorsAndCollectorsWork = ({
  click,
  startDate,
  endDate,
  filter,
  setModalOpen
}) => {
  const [activeTab, setActiveTab] = useState("recebidas"); // "recebidas" ou "abertas"

  return (
    <div className="modal-area">
      <div className="modal-area-container">
        <div className="modal-area-container-header">
            <h3>{click.name}</h3>
            <button className="modal-area-container-header-button-exit" onClick={() => setModalOpen(false)}>Fechar</button>
        </div>
        
        {/* Guias de navegação */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === "recebidas" ? "active" : ""}`}
            onClick={() => setActiveTab("recebidas")}
          >
            Doações Recebidas
          </button>
          <button 
            className={`modal-tab ${activeTab === "abertas" ? "active" : ""}`}
            onClick={() => setActiveTab("abertas")}
          >
            Doações em Aberto
          </button>
        </div>
        
        <div className="modal-area-container-body">
          {activeTab === "recebidas" && (
            <TableDonationsInOperatorsAndCollectors
              click={click}
              startDate={startDate}
              endDate={endDate}
              filter={filter}
              statusFilter="Sim"
            />
          )}
          
          {activeTab === "abertas" && (
            <TableDonationsInOperatorsAndCollectors
              click={click}
              startDate={startDate}
              endDate={endDate}
              filter={filter}
              statusFilter="Não"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalOperatorsAndCollectorsWork;
