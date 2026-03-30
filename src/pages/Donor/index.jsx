import styles from "./donor.module.css";
import React, { useState, useEffect, useContext, useRef } from "react";

import TableDonor from "../../components/TableDonor";
import { useParams } from "react-router";
import { editDonor } from "../../helper/editDonor";
import { getInfoDonor } from "../../helper/getDonor";
import ModalDonation from "../../components/ModalDonation";
import {
  BUTTON_TEXTS,
  DONOR_TYPES,
  FORM_LABELS,
  getDonorTypeOptions,
  ICONS,
} from "../../constants/constants";

import FormTextArea from "../../components/forms/FormTextArea";
import FormDonorInput from "../../components/forms/FormDonorInput";
import FormListSelect from "../../components/forms/FormListSelect";
import { UserContext } from "../../context/UserContext";
import ModalEditDonation from "../../components/ModalEditDonation";
import { setActivityHistoric } from "../../helper/setActivityHistoric";
import { FaEnvelope, FaTable, FaHistory } from "react-icons/fa";
import ModalSendEmail from "../../components/ModalSendEmail";
import TabNavigation from "../../components/TabNavigation";
import DonorActivityHistory from "../../components/DonorActivityHistory";
import { logDonorActivity } from "../../helper/logDonorActivity";
import ActionDropdown from "../../components/ActionDropdown";
import ModalScheduleDonor from "../../components/ModalScheduleDonor";
import ModalCreateTask from "../../components/ModalCreateTask";
import { CallComponent } from "../../components/CallComponent";
import { fetchDonorActiveRequest, deactivateDonorMensalRequest } from "../../api/donorApi";
const Donor = () => {
  const { id } = useParams();
  const { operatorData, setOperatorData } = useContext(UserContext);
  const [donorData, SetDonorData] = useState({
    nome: "",
    tipo: "",
    cpf: "",
    email: "",
    endereco: "",
    cidade: "",
    bairro: "",
    telefone1: "",
    telefone2: "",
    telefone3: "",
    dia: "",
    mensalidade: "",
    media: "",
    observacao: "",
    referencia: "",
  });
  const [donation, setDonation] = useState([]);
  const [workListRequest, setWorkListRequest] = useState([]);

  const [uiState, setUiState] = useState({
    edit: true,
    btnEdit: BUTTON_TEXTS.EDIT,
    showBtn: true,
    modalShow: false,
    loading: false,
    modalEdit: false,
    modalSendEmail: false,
    modalSchedule: false,
    modalCreateTask: false,
  });
  
  const [activeTab, setActiveTab] = useState("donations");
  const [originalDonorData, setOriginalDonorData] = useState({});
  const accessLoggedRef = useRef(false);

  const params = {};
  if (id) params.id = id;

  useEffect(() => {
    // Resetar a flag quando o ID do doador mudar
    accessLoggedRef.current = false;
    
    const loadDonorData = async () => {
      try {
        const data = await getInfoDonor(id);
        const donor = data[0];

        const donorDataObject = {
          nome: donor.donor_name,
          endereco: donor.donor_address,
          cidade: donor.donor_city,
          bairro: donor.donor_neighborhood,
          telefone1: donor.donor_tel_1,
          cpf: donor.donor_cpf?.donor_cpf || null,
          email: donor.donor_email?.donor_email || null,
          telefone2: donor.donor_tel_2?.donor_tel_2 || null,
          telefone3: donor.donor_tel_3?.donor_tel_3 || null,
          dia: donor.donor_mensal?.donor_mensal_day || null,
          mensalidade: donor.donor_mensal?.donor_mensal_monthly_fee || null,
          observacao: donor.donor_observation?.donor_observation || "",
          referencia: donor.donor_reference?.donor_reference || "",
          tipo: donor.donor_type,
        };

        SetDonorData(donorDataObject);
        setOriginalDonorData(donorDataObject);

        // Registrar acesso ao doador apenas uma vez por carregamento
        if (operatorData?.operator_code_id && !accessLoggedRef.current) {
          accessLoggedRef.current = true;
          logDonorActivity({
            donor_id: id,
            operator_code_id: operatorData.operator_code_id,
            action_type: "donor_access",
            action_description: "Acessou a página do doador",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar os dados do doador: ", error.message);
      }
    };

    loadDonorData();
  }, [id, operatorData?.operator_code_id]);

  useEffect(() => {
    const fetchWorkListRequest = async () => {
      try {
        const data = await fetchDonorActiveRequest(id);
        setWorkListRequest(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar lista de trabalho:", error.message);
        setWorkListRequest([]);
      }
    };
    if (id) fetchWorkListRequest();
  }, [id]);

  const handleInputChange = (field, value) => {
    SetDonorData((prev) => ({ ...prev, [field]: value }));
  };

  // Responsável por editar e salvar as informações do doador
  const handleEditDonor = async () => {
    if (uiState.btnEdit === BUTTON_TEXTS.SAVE) {
      if (
        donorData.tipo === DONOR_TYPES.MONTHLY &&
        (donorData.dia === null || donorData.mensalidade === null)
      ) {
        window.alert(
          "Os campos DIA e MENSALIDADE precisam ser preenchidos corretamente!"
        );
        return;
      }

      setUiState((prev) => ({ ...prev, loading: true }));

      try {
        const previousDonorType = originalDonorData?.tipo;

        const success = await editDonor(
          id,
          donorData.nome,
          donorData.tipo,
          donorData.cpf,
          donorData.email,
          donorData.endereco,
          donorData.cidade,
          donorData.bairro,
          donorData.telefone1,
          donorData.telefone2,
          donorData.telefone3,
          donorData.dia,
          donorData.mensalidade,
          donorData.observacao,
          donorData.referencia
        );

        if (success) {
          // Se o doador era Mensal e foi alterado para Avulso,
          // remover o registro correspondente na tabela donor_mensal
          if (
            previousDonorType === DONOR_TYPES.MONTHLY &&
            donorData.tipo === DONOR_TYPES.CASUAL
          ) {
            try {
              await deactivateDonorMensalRequest(id);
            } catch (error) {
              console.error(
                "Erro inesperado ao remover dados de mensal do doador:",
                error.message
              );
            }
          }

          setActivityHistoric({
            dbID: id,
            dataBase: "donor",
            operatorID: operatorData.operator_code_id,
          });

          // Registrar edição do doador no histórico
          logDonorActivity({
            donor_id: id,
            operator_code_id: operatorData.operator_code_id,
            action_type: "donor_edit",
            action_description: "Editou as informações do doador",
            old_values: originalDonorData,
            new_values: donorData,
          });

          // Atualizar os dados originais para refletir a edição
          setOriginalDonorData(donorData);

          setUiState({
            edit: true,
            btnEdit: BUTTON_TEXTS.EDIT,
            showBtn: true,
            loading: false,
            modalShow: uiState.modalShow,
          });
        }
      } catch (error) {
        console.error("Erro ao editar o doador: ", error.message);
        setUiState((prev) => ({ ...prev, loading: false }));
      }
    } else {
      setUiState((prev) => ({
        ...prev,
        edit: false,
        btnEdit: BUTTON_TEXTS.SAVE,
        showBtn: false,
      }));
    }
  };

  const handleBack = () => window.history.back();
  return (
    <main className={styles.containerDonor}>
      <div className={styles.donorContent}>
        {/* Cabeçalho com botões */}
        <header className={styles.donorHeader}>
          <h2 className={styles.donorTitle}>{ICONS.MONEY} Doador</h2>
          <div className={styles.donorActions}>
            {workListRequest.length > 0 && workListRequest[0].operator?.operator_name && (
              <span className={styles.workListBadge}>
                Está na requisição de {workListRequest[0].operator.operator_name}
              </span>
            )}
            <button onClick={handleBack} className={`${styles.donorBtn} ${styles.secondary}`}>
              {ICONS.BACK} {BUTTON_TEXTS.BACK}
            </button>
            <ActionDropdown
              onCriarMovimento={() =>
                setUiState((prev) => ({ ...prev, modalShow: true }))
              }
              onEditar={handleEditDonor}
              onEnviarEmail={() =>
                setUiState((prev) => ({ ...prev, modalSendEmail: true }))
              }
              onAgendar={() =>
                setUiState((prev) => ({ ...prev, modalSchedule: true }))
              }
              onCriarTarefa={() =>
                setUiState((prev) => ({ ...prev, modalCreateTask: true }))
              }
              showBtnCriarMovimento={uiState.showBtn}
              showBtnCriarTarefa={true}
              isLoading={uiState.loading}
              isEditMode={uiState.btnEdit === BUTTON_TEXTS.SAVE}
              editButtonText={uiState.btnEdit}
            />
          </div>
        </header>

        {/* Formulario com informações do doador */}
        <div className={styles.donorFormContainer}>
          <form className={styles.donorForm}>
            {/* Informações Básicas */}
            <div className={styles.donorSection}>
              <h4>Informações Básicas</h4>
              <div className={styles.formRow}>
                <FormDonorInput
                  label={FORM_LABELS.NAME}
                  value={donorData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  readOnly={uiState.edit}
                />

                <FormListSelect
                  label={FORM_LABELS.TYPE}
                  value={donorData.tipo}
                  onChange={(e) => handleInputChange("tipo", e.target.value)}
                  disabled={(uiState.edit && operatorData?.operator_type !== "Admin" && operatorData?.operator_code_id !== 521) || uiState.edit}
                  options={Object.values(getDonorTypeOptions(operatorData.operator_type))}
                />

                <FormDonorInput
                  label="Email"
                  value={donorData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  readOnly={uiState.edit}
                />

                {operatorData?.operator_type === "Admin" && (
                  <FormDonorInput
                    label={FORM_LABELS.CPF}
                    value={donorData?.cpf?.replace(
                      /(\d{3})(\d{3})(\d{3})(\d{2})/,
                      "$1.$2.$3-$4"
                    )}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    readOnly={uiState.edit}
                  />
                )}
              </div>
            </div>

            {/* Informações de Endereço e contato*/}
            <div className={styles.donorSection}>
              <h4>Endereço e Contato</h4>
              <div className={styles.formRow}>
                <FormDonorInput
                  label={FORM_LABELS.ADDRESS}
                  value={donorData.endereco}
                  onChange={(e) =>
                    handleInputChange("endereco", e.target.value)
                  }
                  readOnly={uiState.edit}
                />

                <FormDonorInput
                  label={FORM_LABELS.CITY}
                  value={donorData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                  readOnly={uiState.edit}
                />

                <FormDonorInput
                  label={FORM_LABELS.NEIGHBORHOOD}
                  value={donorData.bairro}
                  onChange={(e) => handleInputChange("bairro", e.target.value)}
                  readOnly={uiState.edit}
                />
                <div className={styles.inputField}>
                  <label>{FORM_LABELS.PHONE1}</label>
                  <input
                    type="text"
                    value={donorData.telefone1}
                    onChange={(e) =>
                      handleInputChange("telefone1", e.target.value)
                    }
                    readOnly={uiState.edit}
                  />
                </div>

                <div className={styles.inputField}>
                  <label>{FORM_LABELS.PHONE2}</label>
                  <input
                    type="text"
                    value={donorData.telefone2}
                    onChange={(e) =>
                      handleInputChange("telefone2", e.target.value)
                    }
                    readOnly={uiState.edit}
                  />
                </div>

                <div className={styles.inputField}>
                  <label>{FORM_LABELS.PHONE3}</label>
                  <input
                    type="text"
                    value={donorData.telefone3}
                    onChange={(e) =>
                      handleInputChange("telefone3", e.target.value)
                    }
                    readOnly={uiState.edit}
                  />
                </div>
              </div>
            </div>

            {/* Informações de Doação */}
            {donorData.tipo === DONOR_TYPES.MONTHLY && (
            <div className={styles.donorSection}>
              <h4>Informações do Mensal</h4>
              <div className={styles.formRow}>
                <FormDonorInput
                  label={FORM_LABELS.DAY}
                  value={donorData.dia}
                  onChange={(e) => handleInputChange("dia", e.target.value)}
                  readOnly={uiState.edit}
                  disabled={donorData.tipo !== DONOR_TYPES.MONTHLY}
                  style={{ width: "100%", maxWidth: 100 }}
                />

                <FormDonorInput
                  label={FORM_LABELS.FEE}
                  value={donorData.mensalidade}
                  onChange={(e) =>
                    handleInputChange("mensalidade", e.target.value)
                  }
                  readOnly={uiState.edit}
                  disabled={donorData.tipo != DONOR_TYPES.MONTHLY}
                  style={{ width: "100%", maxWidth: 100 }}
                />

                <FormDonorInput
                  label={FORM_LABELS.AVERAGE}
                  value={donorData.media}
                  onChange={(e) => handleInputChange("media", e.target.value)}
                  readOnly={uiState.edit}
                  disabled={donorData.tipo !== DONOR_TYPES.MONTHLY}
                  style={{ width: "100%", maxWidth: 100 }}
                />
              </div>
            </div>
            )} 

            {/* Observações */}
            <div className={styles.donorSection}>
              <h4>Observações e Referências</h4>
              <div className={styles.formRow}>
                <FormTextArea
                  label={FORM_LABELS.OBSERVATION}
                  value={donorData.observacao}
                  onChange={(e) =>
                    handleInputChange("observacao", e.target.value)
                  }
                  readOnly={uiState.edit}
                  name="observacao"
                />
                <FormTextArea
                label={FORM_LABELS.REFERENCE}
                value={donorData.referencia}
                onChange={(e) =>
                  handleInputChange("referencia", e.target.value)
                }
                readOnly={uiState.edit}
                name="referencia"
                />
                <CallComponent/>
              </div>

              
            </div>
          </form>
        </div>
        {uiState.showBtn && (
          <TabNavigation
            tabs={[
              {
                id: "donations",
                label: "Doações",
                icon: <FaTable />,
                content: (
                  <TableDonor
                    idDonor={id}
                    modalShow={uiState.modalShow}
                    setModalEdit={(showEdit) =>
                      setUiState((prev) => ({ ...prev, modalEdit: true }))
                    }
                    setDonation={setDonation}
                    modalEdit={uiState.modalEdit}
                  />
                ),
              },
              {
                id: "history",
                label: "Histórico de Ações",
                icon: <FaHistory />,
                content: <DonorActivityHistory donorId={id} />,
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </div>

      {uiState.modalShow && (
        <ModalDonation
          modalShow={uiState.modalShow}
          setModalShow={(show) =>
            setUiState((prev) => ({ ...prev, modalShow: show }))
          }
          mensalidade={donorData.mensalidade}
          tipo={donorData.tipo}
          donor_id={id}
        />
      )}
      {uiState.modalEdit && (
        <ModalEditDonation
          setModalEdit={(showEdit) =>
            setUiState((prev) => ({ ...prev, modalEdit: showEdit }))
          }
          donation={donation}
          donorData={donorData}
          idDonor={id}
        />
      )}
      {uiState.modalSendEmail && (
        <ModalSendEmail
          donor_email={donorData.email}
          donor_name={donorData.nome}
          setModalSendEmail={(show) =>
            setUiState((prev) => ({ ...prev, modalSendEmail: show }))
          }
        />
      )}
      {uiState.modalSchedule && (
        <ModalScheduleDonor
          isOpen={uiState.modalSchedule}
          onClose={() =>
            setUiState((prev) => ({ ...prev, modalSchedule: false }))
          }
          donorId={id}
        />
      )}
      {uiState.modalCreateTask && (
        <ModalCreateTask
          isOpen={uiState.modalCreateTask}
          onClose={() =>
            setUiState((prev) => ({ ...prev, modalCreateTask: false }))
          }
          donorId={id}
          donorName={donorData.nome}
        />
      )}
    </main>
  );
};

export default Donor;
