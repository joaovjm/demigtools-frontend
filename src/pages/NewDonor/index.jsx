import React, { useEffect, useState } from "react";
import "./index.css";
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { useNavigate } from "react-router";
import {
  insertDonor,
  insertDonor_cpf,
  insertDonor_email,
  insertDonor_mensal,
  insertDonor_observation,
  insertDonor_reference,
  insertDonor_tel_2,
  insertDonor_tel_3,
} from "../../helper/insertDonor";
import { toast } from "react-toastify";

const index = () => {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Avulso");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [telefone1, setTelefone1] = useState("");
  const [telefone2, setTelefone2] = useState("");
  const [telefone3, setTelefone3] = useState("");
  const [dia, setDia] = useState(null);
  const [mensalidade, setMensalidade] = useState(null);
  const [observacao, setObservacao] = useState("");
  const [referencia, setReferencia] = useState("");
  const [empty, setEmpty] = useState(false);

  const navigate = useNavigate();

  const handleChange = (event) => {
    setTipo(event.target.value);
  };

  const OnClickNewDonor = async () => {
    if (
      (dia !== null && mensalidade !== null && tipo === "Mensal") ||
      tipo === "Avulso" ||
      tipo === "Lista"
    ) {
      if ([nome, endereco, cidade, bairro, telefone1].some((v) => v === "")) {
        setEmpty(true);
        toast.warning("Preencha todos os campos obrigatórios");
        return;
      }
      try {
        const data = await insertDonor(
          nome,
          tipo,
          endereco,
          cidade,
          bairro,
          telefone1,
          dia,
          mensalidade
        );
        if (cpf !== "") {
          insertDonor_cpf(data[0].donor_id, cpf);
        }
        if (email !== "") insertDonor_email(data[0].donor_id, email);
        if (telefone2 !== "") {
          insertDonor_tel_2(data[0].donor_id, telefone2);
        }
        if (telefone3 !== "") {
          insertDonor_tel_3(data[0].donor_id, telefone3);
        }
        if (tipo === "Mensal") {
          insertDonor_mensal(data[0].donor_id, dia, mensalidade);
        }
        if (observacao !== "") {
          insertDonor_observation(data[0].donor_id, observacao);
        }
        if (referencia !== "") {
          insertDonor_reference(data[0].donor_id, referencia);
        }
        navigate("/donor/" + data[0].donor_id);
      } catch (error) {
        toast.warning("Erro ao criar doador: ", error);
      }
    } else {
      toast.warning(
        "Os campos DIA e MENSALIDADE precisam ser preenchidos corretamente!"
      );
    }
  };

  useEffect(() => {
    if (tipo === "Avulso") {
      setTipo("Avulso");
    } else if (tipo === "Mensal") {
      setTipo("Mensal");
    } else {
      setTipo("Lista");
    }
  }, [tipo]);

  return (
    <main className="containerDonor">
      <div className="donor-content">
        {/* Cabeçalho com botões */}
        <header className="donor-header">
          <h2 className="donor-title">
            <FaMoneyCheckDollar /> Novo Doador
          </h2>
          <div className="donor-actions">
            <button 
              onClick={() => window.history.back()} 
              className="donor-btn secondary"
            >
              ← Voltar
            </button>
            <button onClick={OnClickNewDonor} className="donor-btn primary">
              Criar Doador
            </button>
          </div>
        </header>

        {/* Formulario com informações do doador */}
        <div className="donor-form-container">
          <form className="donor-form">
            
            {/* Seção: Informações Básicas */}
            <div className="donor-section">
              <h4>Informações Básicas</h4>
              <div className="form-row">
                <div className={`input-field ${empty ? "empty" : ""}`}>
                  <label className="label">Nome *</label>
                  <input
                    type="text"
                    name="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="input-field">
                  <label htmlFor="dropdown" className="label">
                    Tipo *
                  </label>
                  <select id="dropdown" onChange={handleChange} value={tipo}>
                    <option value="Avulso">Avulso</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Lista">Lista</option>
                  </select>
                </div>
                <div className="input-field">
                  <label className="label">CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="input-field">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {tipo === "Mensal" && (
                  <>
                    <div className="input-field">
                      <label className="label">Dia</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dia || ""}
                        onChange={(e) => setDia(e.target.value)}
                      />
                    </div>
                    <div className="input-field">
                      <label className="label">Mensalidade (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={mensalidade || ""}
                        onChange={(e) => setMensalidade(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Seção: Endereço */}
            <div className="donor-section">
              <h4>Endereço</h4>
              <div className="form-row">
                <div className={`input-field ${empty ? "empty" : ""}`}>
                  <label className="label">Endereço *</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
                <div className={`input-field ${empty ? "empty" : ""}`}>
                  <label className="label">Cidade *</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
                <div className={`input-field ${empty ? "empty" : ""}`}>
                  <label className="label">Bairro *</label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Contatos */}
            <div className="donor-section">
              <h4>Contatos</h4>
              <div className="form-row">
                <div className={`input-field ${empty ? "empty" : ""}`}>
                  <label className="label">Telefone 1 *</label>
                  <input
                    type="tel"
                    value={telefone1}
                    onChange={(e) => setTelefone1(e.target.value)}
                  />
                </div>
                <div className="input-field">
                  <label className="label">Telefone 2</label>
                  <input
                    type="tel"
                    value={telefone2}
                    onChange={(e) => setTelefone2(e.target.value)}
                  />
                </div>
                <div className="input-field">
                  <label className="label">Telefone 3</label>
                  <input
                    type="tel"
                    value={telefone3}
                    onChange={(e) => setTelefone3(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Informações Adicionais */}
            <div className="donor-section">
              <h4>Informações Adicionais</h4>
              <div className="form-row">
                <div className="input-field form-group full-width">
                  <label className="label">Observação</label>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="input-field form-group full-width">
                  <label className="label">Referência</label>
                  <textarea
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default index;
