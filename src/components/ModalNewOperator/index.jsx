import React, { useState } from "react";
import "./index.css";
import UsersToOperators from "../../auth/UsersToOperators";
import { toast, ToastContainer } from "react-toastify";
import { FaCode } from "react-icons/fa";

const ModalNewOperator = ({ setModalShow }) => {
  const typeOperator = ["Admin", "Operador", "Mensal" , "Developer"];
  const [newOperator, setNewOperator] = useState({
    cod: "",
    operator: "",
    password: "",
    type: "",
  });

  const handleOperatorChange = (e) => {
    const { name, value } = e.target;
    setNewOperator((prev) => ({ ...prev, [name]: value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!newOperator.cod || !newOperator.operator || !newOperator.password || !newOperator.type) {
      toast.warning("Preencha todos os campos obrigatórios!");
      return;
    }
    
    // Validação da senha
    if (newOperator.password.length < 6) {
      toast.warning("A senha deve ter pelo menos 6 caracteres!");
      return;
    }
    
    // Validação do código
    if (newOperator.cod.length < 3) {
      toast.warning("O código deve ter pelo menos 3 caracteres!");
      return;
    }
    
    try {
      const status = await UsersToOperators(newOperator);
      if (status === "OK") {
        toast.success("Operador criado com sucesso!");
        // Reset do formulário
        setNewOperator({
          cod: "",
          operator: "",
          password: "",
          type: "",
        });
        setTimeout(() => {
          setModalShow(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Erro: ", error.message);
      toast.error("Erro ao criar operador. Tente novamente.");
    }
  };

  return (
    <main className="modal-newoperator-container">
      <div className="modal-newoperator">
        <div className="modal-newoperator-content">
          <div className="modal-newoperator-header">
            <div className="modal-title-section">
              <h3 className="modal-title">Novo Operador</h3>
              <span className="operator-type-badge">
                Sistema de Usuários
              </span>
            </div>
            <button
              onClick={() => setModalShow(false)}
              className="btn-close-modal"
              title="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="modal-newoperator-body">
            <div className="form-section">
              <h3>Dados do Operador</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Código *</label>
                  <input
                    type="text"
                    name="cod"
                    value={newOperator.cod}
                    onChange={handleOperatorChange}
                    placeholder="Ex: OP001"
                    className={newOperator.cod && newOperator.cod.length < 3 ? "input-error" : ""}
                    required
                  />
                  {newOperator.cod && newOperator.cod.length < 3 && (
                    <span className="error-message">Mínimo 3 caracteres</span>
                  )}
                </div>
                <div className="input-group">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    name="operator"
                    value={newOperator.operator}
                    onChange={handleOperatorChange}
                    placeholder="Nome do operador"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Senha *</label>
                  <input
                    type="password"
                    name="password"
                    value={newOperator.password}
                    onChange={handleOperatorChange}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className={newOperator.password && newOperator.password.length < 6 ? "input-error" : ""}
                    required
                  />
                  {newOperator.password && newOperator.password.length < 6 && (
                    <span className="error-message">Mínimo 6 caracteres</span>
                  )}
                </div>
                <div className="input-group">
                  <label>Tipo de Acesso *</label>
                  <select
                    name="type"
                    value={newOperator.type}
                    onChange={handleOperatorChange}
                    required
                  >
                    <option value="" disabled>
                      Selecione o tipo...
                    </option>
                    {typeOperator.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="info-section">
                <h4>Informações Importantes</h4>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-icon">🔐</span>
                    <span>Admin: Acesso total ao sistema</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">👤</span>
                    <span>Operador: Acesso limitado às funcionalidades</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon"><FaCode /></span>
                    <span>Developer: Acesso a todas as funcionalidades</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-newoperator-footer">
            <div className="primary-buttons">
              <button
                onClick={handleClick}
                className="btn-confirm"
                disabled={!newOperator.cod || !newOperator.operator || !newOperator.password || !newOperator.type}
              >
                ✨ Criar Operador
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        autoClose={2000}
        closeOnClick="true"
        pauseOnFocusLoss="false"
        position="top-left"
      />
    </main>
  );
};

export default ModalNewOperator;
