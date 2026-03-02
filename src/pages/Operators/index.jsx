import React, { useEffect, useState } from "react";
import styles from "./operators.module.css";
import FormInput from "../../components/forms/FormInput";
import FormListSelect from "../../components/forms/FormListSelect";
import { ICONS } from "../../constants/constants";
import {
  BtnDelete,
  BtnEdit,
  BtnNewOperator,
} from "../../components/buttons/ActionButtons";
import { getOperators } from "../../helper/getOperators";
import editOperator from "../../helper/editOperator";
import Loader from "../../components/Loader";
import ModalNewOperator from "../../components/ModalNewOperator";
import deleteOperator from "../../helper/deleteOperator";
import { ModalConfirm } from "../../components/ModalConfirm";
import { toast, ToastContainer } from "react-toastify";

const Operators = () => {
  const [formTerm, setFormTerm] = useState({
    cod: "",
    operator: "",
    password: "",
    type: "",
    active: false,
  });

  const [tableOperators, setTableOperators] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: null,
  });
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [active, setActive] = useState("Ativos");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const operators = async () => {
      setIsLoading(true);
      try {
        let status;
        if (active === "Ativos") {
          status = "true";
        } else {
          status = "false";
        }
        const data = await getOperators({ active: status });
        setTableOperators(data);

        if (data.length > 0) {
          const operator = data[0];
          setFormTerm({
            cod: operator.operator_code_id,
            operator: operator.operator_name,
            password: "",
            type: operator.operator_type,
            active: operator.operator_active,
          });
        }
      } catch (error) {
        console.error("Erro: ", error.message);
      }
    };
    operators();
    setIsLoading(false);
  }, [modalShow === false, modalConfirmOpen === false, active]);

  const handleInputChange = (e, operator) => {
    const { name, value, type, checked } = e.target;

    const inputValue = type === "checkbox" ? checked : value;

    const updatedOperators = tableOperators.map((op) => {
      if (op.operator_code_id === operator.operator_code_id) {
        if (name === "operator") {
          return { ...op, operator_name: inputValue };
        } else if (name === "cod") {
          return { ...op, operator_code_id: inputValue };
        } else if (name === "type") {
          return { ...op, operator_type: inputValue };
        } else if (name === "active") {
          return { ...op, operator_active: inputValue };
        } else if (name === "password") {
          return { ...op, operator_password: inputValue };
        }
        return { ...op, [`operator_${name}`]: inputValue };
      }
      return op;
    });

    setTableOperators(updatedOperators);
  };

  const handleSubmit = async (e, action, operatorId) => {
    e.preventDefault();
    if (action === "edit") {
      setTableOperators((prevOperators) =>
        prevOperators.map((op) =>
          op.operator_code_id === operatorId
            ? { ...op, isDisable: !op.isDisable }
            : op
        )
      );
    } else if (action === "save") {
      const operatorToUpdate = tableOperators.find(
        (op) => op.operator_code_id === operatorId
      );

      if (operatorToUpdate) {
        const operatorData = {
          id: operatorToUpdate.operator_code_id,
          name: operatorToUpdate.operator_name,
          type: operatorToUpdate.operator_type,
          active: operatorToUpdate.operator_active,
          password: operatorToUpdate.operator_password,
        };

        const data = await editOperator(operatorData);
        if (data === "success") {
          toast.success("Dados atualizados com sucesso!");
        }

        setTableOperators((prevOperators) =>
          prevOperators.map((op) =>
            op.operator_code_id === operatorId ? { ...op, isDisable: true } : op
          )
        );
      }
    } else if (action === "delete") {
      return new Promise((resolve) => {
        setModalConfig({
          title: "Deletar Usuario",
          message: "Tem certeza que desejas deletar este usuário?",
          onConfirm: async () => {
            await deleteOperator(operatorId).then(resolve);
            setModalConfirmOpen(false);
            toast.success("Usuário deletado com sucesso!");
          },
        });
        setModalConfirmOpen(true);
      });
    } else if (action === "newoperator") {
      setModalShow(true);
    }
  };

  const typeOperator = ["Admin", "Operador", "Operador Extra", "Mensal", "Confirmação"];
  return (
    <main className={styles.operatorsContainer}>
      <div className={styles.operatorsContent}>
        {/* Cabeçalho com botões */}
        <header className={styles.operatorsHeader}>
          <h2 className={styles.operatorsTitle}>👥 Operadores</h2>
          <div className={styles.operatorsActions}>
            <div className={styles.operatorsFilterTabs}>
              <button
                className={`${styles.operatorsTab} ${
                  active === "Ativos" ? styles.active : ""
                }`}
                onClick={() => setActive("Ativos")}
              >
                Ativos
              </button>
              <button
                className={`${styles.operatorsTab} ${
                  active === "Desativados" ? styles.active : ""
                }`}
                onClick={() => setActive("Desativados")}
              >
                Desativados
              </button>
            </div>
            <BtnNewOperator
              className={`${styles.operatorsBtn} ${styles.primary}`}
              onClick={(e) => handleSubmit(e, "newoperator")}
              icon={ICONS.CIRCLEOUTLINE}
            />
          </div>
        </header>

        <ModalConfirm
          isOpen={modalConfirmOpen}
          onClose={() => setModalConfirmOpen(false)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
        />

        {/* Lista de Operadores */}
        <div className={styles.operatorsListContainer}>
          <div className={styles.operatorsList}>
            {isLoading ? (
              <div className={styles.operatorsLoading}>
                <Loader />
              </div>
            ) : (
              tableOperators.map((operator, index) => (
                <div
                  key={operator.operator_code_id || index}
                  className={styles.operatorCard}
                >
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className={styles.operatorForm}
                  >
                    {/* Informações Básicas */}
                    <div className={styles.operatorSection}>
                      <h4>Informações do Operador</h4>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <div className={styles.inputField}>
                            <label>Código</label>
                            <input
                              type="text"
                              value={operator.operator_code_id}
                              onChange={(e) => handleInputChange(e, operator)}
                              readOnly={operator.isDisable}
                            />
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <FormInput
                            label="Operador"
                            type="text"
                            name="operator"
                            value={operator.operator_name}
                            autoComplete="username"
                            onChange={(e) => handleInputChange(e, operator)}
                            readOnly={operator.isDisable}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <FormInput
                            label="Senha"
                            type="password"
                            name="password"
                            value={operator.operator_password || ""}
                            autoComplete="current-password"
                            onChange={(e) => handleInputChange(e, operator)}
                            readOnly={operator.isDisable}
                          />
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <FormListSelect
                            label="Tipo de Operador"
                            value={operator.operator_type}
                            name="type"
                            id={operator.operator_code_id}
                            onChange={(e) => handleInputChange(e, operator)}
                            options={typeOperator}
                            disabled={operator.isDisable}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.checkboxLabel}>Status</label>
                          <div className={styles.checkboxContainer}>
                            <input
                              type="checkbox"
                              value="active"
                              name="active"
                              checked={operator.operator_active}
                              onChange={(e) => handleInputChange(e, operator)}
                              disabled={operator.isDisable}
                              className={styles.operatorsCheckbox}
                            />
                            <span className={styles.checkboxText}>
                              {operator.operator_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className={styles.operatorActions}>
                      <BtnEdit
                        label={operator.isDisable ? "Editar" : "Salvar"}
                        onClick={(e) =>
                          handleSubmit(
                            e,
                            operator.isDisable ? "edit" : "save",
                            operator.operator_code_id
                          )
                        }
                        className={`${styles.operatorsBtn} ${styles.secondary}`}
                      />
                      <button
                        className={`${styles.operatorsBtn} ${styles.danger}`}
                        onClick={(e) =>
                          handleSubmit(e, "delete", operator.operator_code_id)
                        }
                      >
                        {ICONS.TRASH} Excluir
                      </button>
                    </div>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {modalShow && (
        <ModalNewOperator setModalShow={setModalShow} setStatus={setStatus} />
      )}

      <ToastContainer
        closeOnClick="true"
        pauseOnFocusLoss="false"
        position="top-left"
      />
    </main>
  );
};

export default Operators;
