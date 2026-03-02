import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DonationTable from "./DonationTable";
import RequestCard from "./RequestCard";
import ExportToExcel from "../XLSX";
import getRequestById from "../../helper/getRequestById";
import updateRequest from "../../helper/updateRequest";
import {
  deletePackage,
  fetchOperatorID,
  removeAllPackage,
} from "../../services/distributePackageService";
import { distributePackageService } from "../../services/distributePackageService";
import { ICONS } from "../../constants/constants";
import "./EditRequestCreated.css";

const EditRequestCreated = ({ requestId, onClose }) => {
  // Estados principais
  const [createPackage, setCreatePackage] = useState([]);
  const [perOperator, setPerOperator] = useState({});
  const [unassigned, setUnassigned] = useState([]);
  const [operatorID, setOperatorID] = useState([]);
  const [operatorName, setOperatorName] = useState({});
  const [selected, setSelected] = useState(null);
  const [selection, setSelection] = useState([]);
  const [endDateRequest, setEndDateRequest] = useState("");
  const [buttonTest, setButtonTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestName, setRequestName] = useState("");
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [selectedOperatorToAdd, setSelectedOperatorToAdd] = useState("");
  // operatorsInView = operadores visíveis na tela (cards)
  // activeForDistribution = operadores que recebem na distribuição aleatória
  const [operatorsInView, setOperatorsInView] = useState([]);
  const [activeForDistribution, setActiveForDistribution] = useState([]);

  // Carregar dados da requisição
  useEffect(() => {
    const loadRequestData = async () => {
      try {
        setLoading(true);
        const requestData = await getRequestById(requestId);

        if (requestData && requestData.length > 0) {
          // Transformar dados da requisição para o formato esperado
          const transformedData = requestData.map((item) => ({
            id: item.id,
            donor_id: item.donor_id,
            operator_code_id: item.operator_code_id,
            receipt_donation_id: item.receipt_donation_id,
            request_end_date: item.request_end_date,
            request_name: item.request_name,
            request_name_id: item.request_name_id,
            request_start_date: item.request_start_date,
            // Dados do doador
            donor_tel_1: item.donor?.donor_tel_1 || "",

            // Dados do operador
            operator_name: item.operator?.operator_name,
            // Valor da doação
            donation_value: item.donation?.donation_value,
            last_operation: item.donation?.donation_day_received,
          }));

          setCreatePackage(transformedData);
          setRequestName(requestData[0].request_name);
          setEndDateRequest(requestData[0].request_end_date);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da requisição:", error);
        toast.error("Erro ao carregar dados da requisição");
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      loadRequestData();
    }
  }, [requestId]);

  // Carregar operadores
  useEffect(() => {
    fetchOperatorID(setOperatorID);
  }, []);

  // Distribuir pacotes quando createPackage mudar
  useEffect(() => {
    if (createPackage.length > 0) {
      distributePackageService(
        createPackage,
        setPerOperator,
        setUnassigned,
        setOperatorName
      );
    }
  }, [createPackage]);

  // Inicializar operatorsInView e activeForDistribution com operadores que têm doações na requisição
  useEffect(() => {
    if (createPackage.length > 0) {
      const operatorsInRequest = [...new Set(
        createPackage
          .filter(pkg => pkg.operator_code_id)
          .map(pkg => pkg.operator_code_id)
      )];
      setOperatorsInView(operatorsInRequest);
      setActiveForDistribution(operatorsInRequest);
      setSelection(operatorsInRequest); // Manter compatibilidade
    }
  }, [createPackage.length]);

  const handleSave = async () => {
    try {
      if (!requestId) {
        toast.error("ID da requisição não encontrado");
        return;
      }

      if (createPackage.length === 0) {
        toast.error("Nenhuma doação encontrada para salvar");
        return;
      }

      // Validar data de fim
      if (!endDateRequest) {
        toast.error("Data de fim da requisição é obrigatória");
        return;
      }

      // Atualizar requisição
      const response = await updateRequest(
        requestId,
        createPackage,
        endDateRequest
      );
      if (response) {
        toast.success("Requisição atualizada com sucesso!");
        onClose();
      }
    } catch (error) {
      console.error("Erro ao salvar requisição:", error);
      toast.error("Erro ao salvar requisição: " + error.message);
    }
  };

  const handleDeletePackage = async () => {
    if (!createPackage || createPackage.length === 0) {
      toast.error("Não há requisição para deletar");
      return;
    }

    const requestNameId = createPackage[0].request_name_id;
    if (!requestNameId) {
      toast.error("ID da requisição não encontrado");
      return;
    }

    if (window.confirm("Deseja deletar a requisição?")) {
      try {
        const response = await deletePackage(requestNameId);
        if (response && response.success) {
          toast.success("Requisição deletada com sucesso!");
          onClose();
        } else {
          toast.error("Erro ao deletar requisição: " + (response?.message || "Erro desconhecido"));
        }
      } catch (error) {
        console.error("Erro ao deletar requisição:", error);
        toast.error("Erro ao deletar requisição: " + error.message);
      }
    }
  };

  const handleAddOperator = () => {
    if (!selectedOperatorToAdd) {
      toast.warning("Selecione um operador para adicionar");
      return;
    }
    
    // Converter para número para manter consistência com os IDs existentes
    const operatorToAdd = Number(selectedOperatorToAdd);
    
    if (operatorsInView.includes(operatorToAdd)) {
      toast.warning("Este operador já está na requisição");
      return;
    }
    
    setOperatorsInView([...operatorsInView, operatorToAdd]);
    setActiveForDistribution([...activeForDistribution, operatorToAdd]);
    setSelection([...selection, operatorToAdd]); // Manter compatibilidade
    setSelectedOperatorToAdd("");
    setShowAddOperator(false);
    toast.success("Operador adicionado à requisição!");
  };

  // Filtrar operadores disponíveis (que não estão na requisição)
  const availableOperators = operatorID.filter(
    (op) => !operatorsInView.includes(op)
  );

  if (loading) {
    return (
      <div className="edit-request-container">
        <div className="edit-request-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados da requisição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-request-container">
      {/* Header */}
      <div className="edit-request-header">
        <h2 className="edit-request-title">
          {ICONS.EDIT} Editar Requisição: {requestName}
        </h2>
        <button onClick={onClose} className="edit-request-close-btn">
          ✕
        </button>
      </div>

      {/* Conteúdo principal - igual ao request-step-4 */}
      <div className="request-step-4">
        <div className="request-step-4-left">
          <DonationTable
            unassigned={unassigned}
            selected={selected}
            setSelected={setSelected}
            createPackage={createPackage}
            setCreatePackage={setCreatePackage}
            operatorID={operatorID}
            selection={activeForDistribution}
            buttonTest={buttonTest}
            setButtonTest={setButtonTest}
          />
        </div>
        <div className="request-step-4-right">
          <div className="add-operator-section">
            {!showAddOperator ? (
              <button
                onClick={() => setShowAddOperator(true)}
                className="request-btn add-operator"
                disabled={availableOperators.length === 0}
              >
                {ICONS.ADD} Adicionar Operador
              </button>
            ) : (
              <div className="add-operator-form">
                <select
                  value={selectedOperatorToAdd}
                  onChange={(e) => setSelectedOperatorToAdd(e.target.value)}
                  className="operator-select"
                >
                  <option value="">Selecione um operador...</option>
                  {availableOperators.map((opId) => (
                    <option key={opId} value={opId}>
                      {opId} - {operatorName[opId] || "Operador"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddOperator}
                  className="request-btn confirm-small"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowAddOperator(false);
                    setSelectedOperatorToAdd("");
                  }}
                  className="request-btn cancel-small"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
          <div className="request-step-4-right-body">
            {operatorsInView?.map((cp) => {
              return (
                <RequestCard
                  perOperator={perOperator[cp] || []}
                  setPerOperator={setPerOperator}
                  key={cp}
                  operatorName={operatorName[cp]}
                  operatorID={cp}
                  selected={selected}
                  setSelected={setSelected}
                  createPackage={createPackage}
                  setCreatePackage={setCreatePackage}
                  unassigned={unassigned}
                  setUnassigned={setUnassigned}
                  allOperator={operatorID}
                  setAllOperator={setOperatorID}
                  selection={selection}
                  setSelection={setSelection}
                  operatorsInView={operatorsInView}
                  setOperatorsInView={setOperatorsInView}
                  activeForDistribution={activeForDistribution}
                  setActiveForDistribution={setActiveForDistribution}
                />
              );
            })}
          </div>
          <div className="request-step-4-right-bottom">
            <div className="input-field">
              <label>Data fim da requisição</label>
              <input
                type="date"
                value={endDateRequest}
                onChange={(e) => setEndDateRequest(e.target.value)}
              />
            </div>
            <button onClick={onClose} className="request-btn cancel">
              Cancelar
            </button>
            <button onClick={handleDeletePackage} className="request-btn reset">
              Deletar
            </button>
            {buttonTest ? (
              <ExportToExcel
                jsonData={createPackage}
                fileName={createPackage[0]?.request_name || "requisicao"}
              />
            ) : (
              <button onClick={handleSave} className="request-btn conclude">
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequestCreated;
