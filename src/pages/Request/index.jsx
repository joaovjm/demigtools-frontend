import { useEffect, useRef, useState } from "react";
import styles from "./request.module.css";
import DateSelected from "../../components/Request/DateSelected";
import DonationValues from "../../components/Request/DonationValues";
import CreatePackage from "../../components/Request/CreatePackage";
import DonationTable from "../../components/Request/DonationTable";
import RequestCard from "../../components/Request/RequestCard";
import RequestsTable from "../../components/Request/RequestsTable";
import {
  addEndDataInCreatePackage,
  distributePackageService,
  fetchOperatorID,
} from "../../services/distributePackageService";
import { getOperators } from "../../helper/getOperators";
import insertRequest from "../../helper/insertRequest";
import { toast } from "react-toastify";
import { DataNow } from "../../components/DataTime";
import ExportToExcel from "../../components/XLSX";
import { ICONS } from "../../constants/constants";
import EditRequestCreated from "../../components/Request/EditRequestCreated";

const Request = () => {
  // Sistema de etapas
  const [currentStep, setCurrentStep] = useState(1);
  const [createPackage, setCreatePackage] = useState([]);
  const [date, setDate] = useState([]);
  const [perOperator, setPerOperator] = useState({});
  const [unassigned, setUnassigned] = useState([]);
  const [operatorID, setOperatorID] = useState();
  const [operatorIDState, setOperatorIDState] = useState([]);
  const [operatorName, setOperatorName] = useState({});
  const [selected, setSelected] = useState(null);
  const [continueClick, setContinueClick] = useState(false);
  const [cancelClick, setCancelClick] = useState(false);
  const [showEditRequestCreated, setShowEditRequestCreated] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [createPackageState, setCreatePackageState] = useState([]);
  const [selection, setSelection] = useState([]);
  const [endDateRequest, setEndDateRequest] = useState("");
  const [buttonTest, setButtonTest] = useState(false);
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [selectedOperatorToAdd, setSelectedOperatorToAdd] = useState("");
  const [requestsListVersion, setRequestsListVersion] = useState(0);

  const divRef = useRef();

  useEffect(() => {
    if (createPackage.length > 0) {
      // Scroll automático para o final da tela quando a Etapa 1 aparecer
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      }, 400); // Pequeno delay para garantir que o conteúdo foi renderizado
    }
  }, [createPackage.length]);

  useEffect(() => {
    distributePackageService(
      createPackage,
      setPerOperator,
      setUnassigned,
      setOperatorName
    );
  }, [createPackage]);

  // Salvar estado inicial quando chegar no step 3 pela primeira vez
  useEffect(() => {
    if (currentStep === 3 && createPackageState.length === 0 && createPackage.length > 0) {
      // Salvar cópia profunda do estado inicial
      setCreatePackageState(JSON.parse(JSON.stringify(createPackage)));
    }
  }, [currentStep, createPackage]);

  // Carregar operadores quando entrar no step 3
  useEffect(() => {
    const loadOperators = async () => {
      const response = await getOperators({
        active: true,
        item: "operator_name, operator_code_id, operator_type"
      });
      
      const opFilter = response
        .filter((op) => op.operator_type !== "Admin")
        .map((op) => op.operator_code_id);
      
      setOperatorID(opFilter);
      // Salvar estado inicial dos operadores apenas na primeira vez
      if (operatorIDState.length === 0) {
        setOperatorIDState([...opFilter]);
      }
    };
    
    if (showCreatePackage && currentStep === 3) {
      loadOperators();
    }
  }, [showCreatePackage, currentStep]);

  // Ativar edição quando requestId for definido
  useEffect(() => {
    if (requestId) {
      setShowEditRequestCreated(true);
    }
  }, [requestId]);

  const handleCancel = () => {
    setCurrentStep(1);
    setCreatePackage([]);
    setDate([]);
    setPerOperator({});
    setUnassigned([]);
    setOperatorID([]);
    setOperatorName({});
    setSelected(null);
    setContinueClick(false);
    setCancelClick((c) => !c);
    setCreatePackageState([]);
    setOperatorIDState([]);
    setButtonTest(false);
    setEndDateRequest("");
    setShowCreatePackage(false);
  };

  const handleStartNewPackage = () => {
    setShowCreatePackage(true);
    setCurrentStep(1);
    setCreatePackage([]);
    setDate([]);
    setPerOperator({});
    setUnassigned([]);
    setOperatorID([]);
    setOperatorName({});
    setSelected(null);
    setContinueClick(false);
    setCreatePackageState([]);
    setOperatorIDState([]);
    setButtonTest(false);
    setEndDateRequest("");
  };

  const handleReset = () => {
    // Restaurar para o estado inicial salvo
    setCreatePackage(JSON.parse(JSON.stringify(createPackageState)));
    setOperatorID([...operatorIDState]);
    // Limpar estados relacionados ao formulário de adicionar operador
    setShowAddOperator(false);
    setSelectedOperatorToAdd("");
    setSelected(null);
  };

  const handleConclude = async () => {
    if (endDateRequest === "") {
      toast.warning("Preencha a data final da requisição!");
      return;
    }
    if (endDateRequest < DataNow("noformated")) {
      toast.warning("A data final não pode ser menor que a data atual!");
      return;
    }
    const updatePackage = await addEndDataInCreatePackage(
      createPackage,
      setCreatePackage,
      endDateRequest
    );
    try {
      await toast.promise(insertRequest(updatePackage), {
        loading: "Criando o pacote da requisição...",
        success: "Pacote criado com sucesso!",
        error: "Não fio possível criar o pacote! Contacte o administrador!",
      });

      setRequestsListVersion((v) => v + 1);
      handleCancel();
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleStep1Complete = () => {
    setCurrentStep(2);
  };

  const handleStep2Complete = () => {
    setCurrentStep(3);
  };

  const handleAddOperator = () => {
    if (!selectedOperatorToAdd) {
      toast.warning("Selecione um operador para adicionar");
      return;
    }
    
    // Converter para número para manter consistência com os IDs existentes
    const operatorToAdd = Number(selectedOperatorToAdd);
    
    if (operatorID.includes(operatorToAdd)) {
      toast.warning("Este operador já está na requisição");
      return;
    }
    
    setOperatorID([...operatorID, operatorToAdd]);
    setSelection([...selection, operatorToAdd]);
    setSelectedOperatorToAdd("");
    setShowAddOperator(false);
    toast.success("Operador adicionado à requisição!");
  };

  // Filtrar operadores disponíveis (que não estão na requisição)
  const availableOperators = operatorIDState.filter(
    (op) => !operatorID.includes(op)
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <CreatePackage
              createPackage={createPackage}
              setCreatePackage={setCreatePackage}
              setDate={setDate}
              date={date}
              setShowCreatePackage={setShowCreatePackage}
            />

            {createPackage.length > 0 && (
              <DateSelected
                date={date}
                onComplete={handleStep1Complete}
                onCancel={handleCancel}
                divRef={divRef}
              />
            )}
          </>
        );
      case 2:
        return (
          <DonationValues
            createPackage={createPackage}
            onComplete={handleStep2Complete}
            onCancel={handleCancel}
            divRef={divRef}
          />
        );

      case 3:
        return (
          <div className={styles.requestStep4}>
            <div className={styles.requestStep4Left}>
              <DonationTable
                unassigned={unassigned}
                selected={selected}
                setSelected={setSelected}
                createPackage={createPackage}
                setCreatePackage={setCreatePackage}
                operatorID={operatorID}
                selection={selection}
                buttonTest={buttonTest}
                setButtonTest={setButtonTest}
              />
            </div>
            <div className={styles.requestStep4Right}>
              <div className={styles.addOperatorSection}>
                {!showAddOperator ? (
                  <button
                    onClick={() => setShowAddOperator(true)}
                    className={`${styles.requestBtn} ${styles.addOperator}`}
                    disabled={availableOperators.length === 0}
                    style={{ display: availableOperators.length > 0 ? 'block' : 'none' }}
                  >
                    {ICONS.ADD} Adicionar Operador
                  </button>
                ) : (
                  <div className={styles.addOperatorForm}>
                    <select
                      value={selectedOperatorToAdd}
                      onChange={(e) => setSelectedOperatorToAdd(e.target.value)}
                      className={styles.operatorSelect}
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
                      className={`${styles.requestBtn} ${styles.confirmSmall}`}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => {
                        setShowAddOperator(false);
                        setSelectedOperatorToAdd("");
                      }}
                      className={`${styles.requestBtn} ${styles.cancelSmall}`}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.requestStep4RightBody}>
                {operatorID?.map((cp) => (
                  <RequestCard
                    perOperator={perOperator[cp]}
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
                  />
                ))}
              </div>
              <div className={styles.requestStep4RightBottom}>
                <div className={styles.inputField}>
                  <label>Data fim da requisição</label>
                  <input
                    type="date"
                    value={endDateRequest}
                    onChange={(e) => setEndDateRequest(e.target.value)}
                  />
                </div>
                <button onClick={handleCancel} className={`${styles.requestBtn} ${styles.cancel}`}>
                  Cancelar
                </button>
                <button onClick={handleReset} className={`${styles.requestBtn} ${styles.reset}`}>
                  Resetar
                </button>
                {buttonTest ? (
                  <ExportToExcel
                    jsonData={createPackage}
                    fileName={createPackage[0].request_name}
                  />
                ) : (
                  <button
                    onClick={handleConclude}
                    className={`${styles.requestBtn} ${styles.conclude}`}
                  >
                    Concluir
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case showEditRequestCreated: 
        return <EditRequestCreated requestId={requestId} onClose={() => setShowEditRequestCreated(false)} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.requestMain}>
      <div className={styles.requestContainer}>
        {/* Header compacto com navegação das etapas - só aparece quando showCreatePackage é true */}
        {showCreatePackage && (
          <div className={styles.requestHeaderCompact}>
            <h2 className={styles.requestTitleCompact}>
              {ICONS.MONEY} Gerenciamento de Requisições
            </h2>
            <div className={styles.requestStepsCompact}>
              <div
                className={`${styles.stepCompact} ${currentStep >= 1 ? styles.active : ""} ${
                  currentStep > 1 ? styles.completed : ""
                }`}
              >
                <span className={styles.stepNumberCompact}>1</span>
                <span className={styles.stepLabelCompact}>Criar Pacote</span>
              </div>
              <div
                className={`${styles.stepCompact} ${currentStep >= 2 ? styles.active : ""} ${
                  currentStep > 2 ? styles.completed : ""
                }`}
              >
                <span className={styles.stepNumberCompact}>2</span>
                <span className={styles.stepLabelCompact}>Valores</span>
              </div>
              <div className={`${styles.stepCompact} ${currentStep >= 3 ? styles.active : ""}`}>
                <span className={styles.stepNumberCompact}>3</span>
                <span className={styles.stepLabelCompact}>Distribuir</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Requisições Criadas */}
        {!showCreatePackage && !showEditRequestCreated && (
            <RequestsTable
              setRequestId={setRequestId}
              listVersion={requestsListVersion}
            />
        )}

        {showEditRequestCreated && (
          <EditRequestCreated 
            requestId={requestId} 
            onClose={() => {
              setShowEditRequestCreated(false);
              setRequestId(null);
              setRequestsListVersion((v) => v + 1);
            }} 
          />
        )}

        {/* Botão para iniciar criação de novo pacote */}
        {!showCreatePackage && !showEditRequestCreated && (
          <div className={styles.newPackageButtonContainer}>
            <button 
              onClick={handleStartNewPackage}
              className={`${styles.requestBtn} ${styles.primary} ${styles.newPackageBtn}`}
            >
              {ICONS.PLUS} Criar Novo Pacote
            </button>
          </div>
        )}

        {/* Conteúdo da etapa atual - só aparece quando showCreatePackage é true */}
        {showCreatePackage && (
          <div className={styles.requestContent}>{renderStepContent()}</div>
        )}
      </div>
    </div>
  );
};

export default Request;
