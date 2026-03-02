import React, { useState } from "react";
import { useCampaigns } from "../../hooks/useCampaigns.jsx";
import { ICONS } from "../../constants/constants";
import { toast } from "react-toastify";
import styles from "../../pages/AdminManager/adminmanager.module.css";

/**
 * Versão migrada do componente Campain usando o novo serviço de campanhas
 * Este é um exemplo de como migrar componentes existentes
 */
const CampainMigrated = () => {
  const {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign
  } = useCampaigns();

  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  // Função para criar nova campanha
  const handleNewCampaign = async () => {
    if (newCampaignName.trim() === "") {
      toast.warning("Preencha o campo 'Nova Campanha' corretamente...");
      return;
    }

    const result = await createCampaign({
      name: newCampaignName.trim(),
      description: newCampaignDescription.trim() || null,
      selectedTemplates: [], // Pode ser preenchido conforme necessário
      variables: [] // Pode ser preenchido conforme necessário
    });

    if (result.success) {
      toast.success("Campanha criada com sucesso!");
      setNewCampaignName("");
      setNewCampaignDescription("");
    } else {
      toast.error(`Erro ao criar campanha: ${result.error}`);
    }
  };

  // Função para iniciar edição
  const handleEdit = (campaign) => {
    setEditingId(campaign.id);
    setEditingName(campaign.name);
    setEditingDescription(campaign.description || "");
  };

  // Função para salvar edição
  const handleSaveEdit = async () => {
    if (editingName.trim() === "") {
      toast.warning("Nome da campanha não pode estar vazio");
      return;
    }

    const result = await updateCampaign(editingId, {
      name: editingName.trim(),
      description: editingDescription.trim() || null
    });

    if (result.success) {
      toast.success("Campanha atualizada com sucesso!");
      setEditingId(null);
      setEditingName("");
      setEditingDescription("");
    } else {
      toast.error(`Erro ao atualizar campanha: ${result.error}`);
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  // Função para deletar campanha
  const handleDelete = async (id) => {
    if (window.confirm("Deseja mesmo deletar esta campanha?")) {
      const result = await deleteCampaign(id);
      
      if (result.success) {
        toast.success("Campanha deletada com sucesso!");
      } else {
        toast.error(`Erro ao deletar campanha: ${result.error}`);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.campain}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Carregando campanhas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.campain}>
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          Erro ao carregar campanhas: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.campain}>
      <div className={styles.campainDivs}>
        <label>Nova Campanha</label>
        <div className="input-field">
          <label>Nome da Campanha</label>
          <input
            type="text"
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            placeholder="Digite o nome da campanha"
          />
        </div>
        <div className="input-field">
          <label>Descrição (Opcional)</label>
          <textarea
            value={newCampaignDescription}
            onChange={(e) => setNewCampaignDescription(e.target.value)}
            placeholder="Digite uma descrição para a campanha"
            rows={3}
          />
        </div>
        <button onClick={handleNewCampaign}>
          {ICONS.plus} Criar Campanha
        </button>
      </div>

      <div className={styles.campainDivs}>
        <label>Campanhas Existentes ({campaigns.length})</label>
        <div className="campaigns-list">
          {campaigns.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Nenhuma campanha encontrada. Crie uma nova campanha acima.
            </p>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="campaign-item" style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                margin: '10px 0',
                backgroundColor: '#f9f9f9'
              }}>
                {editingId === campaign.id ? (
                  // Modo de edição
                  <div>
                    <div className="input-field" style={{ marginBottom: '10px' }}>
                      <label>Nome:</label>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                    </div>
                    <div className="input-field" style={{ marginBottom: '10px' }}>
                      <label>Descrição:</label>
                      <textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={handleSaveEdit} style={{ backgroundColor: '#4CAF50' }}>
                        Salvar
                      </button>
                      <button onClick={handleCancelEdit} style={{ backgroundColor: '#f44336' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo de visualização
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                      {campaign.name}
                    </h4>
                    {campaign.description && (
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                        {campaign.description}
                      </p>
                    )}
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                      Criado em: {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleEdit(campaign)}>
                        {ICONS.edit} Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(campaign.id)}
                        style={{ backgroundColor: '#f44336' }}
                      >
                        {ICONS.delete} Deletar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Seção para mensagens de campanha (mantida do componente original) */}
      <div className={styles.campainDivs} style={{display: "flex", gap: 0}}>
        <label>Mensagens Para Campanhas</label>
        <div className="input-field" style={{maxHeight: 166}}>
          <label>Mensagem</label>
          <textarea style={{ height: 90, padding: 4 }} />
        </div>
        <div style={{display: "flex", gap: 16, alignItems: "flex-end"}}>
          <div className="input-field">
            <label>Campanha Associada</label>
            <select>
              <option value="" disabled>
                Selecione...
              </option>
              {campaigns?.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          <button>Associar</button>  
        </div>
      </div>
    </div>
  );
};

export default CampainMigrated;
