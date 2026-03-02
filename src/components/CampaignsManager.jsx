import React, { useState } from 'react';
import { useCampaigns } from '../hooks/useCampaigns.jsx';

/**
 * Componente de exemplo para gerenciar campanhas
 * Demonstra como usar o novo serviço de campanhas
 */
const CampaignsManager = () => {
  const {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    searchCampaigns
  } = useCampaigns();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedTemplates: [],
    variables: []
  });

  // Função para lidar com busca
  const handleSearch = async (e) => {
    e.preventDefault();
    await searchCampaigns(searchTerm);
  };

  // Função para criar campanha
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    const result = await createCampaign(formData);
    
    if (result.success) {
      setFormData({
        name: '',
        description: '',
        selectedTemplates: [],
        variables: []
      });
      setShowCreateForm(false);
      alert('Campanha criada com sucesso!');
    } else {
      alert(`Erro ao criar campanha: ${result.error}`);
    }
  };

  // Função para deletar campanha
  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Tem certeza que deseja deletar esta campanha?')) {
      const result = await deleteCampaign(campaignId);
      
      if (result.success) {
        alert('Campanha deletada com sucesso!');
      } else {
        alert(`Erro ao deletar campanha: ${result.error}`);
      }
    }
  };

  // Função para editar campanha
  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      selectedTemplates: campaign.selected_templates || [],
      variables: campaign.variables || []
    });
    setShowCreateForm(true);
  };

  // Função para atualizar campanha
  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    
    const result = await updateCampaign(editingCampaign.id, formData);
    
    if (result.success) {
      setEditingCampaign(null);
      setFormData({
        name: '',
        description: '',
        selectedTemplates: [],
        variables: []
      });
      setShowCreateForm(false);
      alert('Campanha atualizada com sucesso!');
    } else {
      alert(`Erro ao atualizar campanha: ${result.error}`);
    }
  };

  // Função para adicionar variável
  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, '']
    }));
  };

  // Função para remover variável
  const removeVariable = (index) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  // Função para atualizar variável
  const updateVariable = (index, value) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((v, i) => i === index ? value : v)
    }));
  };

  if (loading) {
    return (
      <div className="campaigns-manager">
        <div className="loading">Carregando campanhas...</div>
      </div>
    );
  }

  return (
    <div className="campaigns-manager">
      <h2>Gerenciador de Campanhas</h2>
      
      {error && (
        <div className="error-message">
          Erro: {error}
        </div>
      )}

      {/* Barra de busca */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Buscar campanhas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>

      {/* Botão para criar nova campanha */}
      <button 
        onClick={() => setShowCreateForm(true)}
        className="create-button"
      >
        Nova Campanha
      </button>

      {/* Formulário de criação/edição */}
      {showCreateForm && (
        <div className="campaign-form">
          <h3>{editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}</h3>
          
          <form onSubmit={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}>
            <div className="form-group">
              <label>Nome da Campanha:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Descrição:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Variáveis:</label>
              {formData.variables.map((variable, index) => (
                <div key={index} className="variable-input">
                  <input
                    type="text"
                    value={variable}
                    onChange={(e) => updateVariable(index, e.target.value)}
                    placeholder="Nome da variável"
                  />
                  <button type="button" onClick={() => removeVariable(index)}>
                    Remover
                  </button>
                </div>
              ))}
              <button type="button" onClick={addVariable}>
                Adicionar Variável
              </button>
            </div>

            <div className="form-actions">
              <button type="submit">
                {editingCampaign ? 'Atualizar' : 'Criar'} Campanha
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCampaign(null);
                  setFormData({
                    name: '',
                    description: '',
                    selectedTemplates: [],
                    variables: []
                  });
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de campanhas */}
      <div className="campaigns-list">
        <h3>Campanhas ({campaigns.length})</h3>
        
        {campaigns.length === 0 ? (
          <p>Nenhuma campanha encontrada.</p>
        ) : (
          <div className="campaigns-grid">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="campaign-card">
                <h4>{campaign.name}</h4>
                {campaign.description && (
                  <p className="description">{campaign.description}</p>
                )}
                
                {campaign.variables && campaign.variables.length > 0 && (
                  <div className="variables">
                    <strong>Variáveis:</strong>
                    <ul>
                      {campaign.variables.map((variable, index) => (
                        <li key={index}>{variable}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="campaign-actions">
                  <button onClick={() => handleEditCampaign(campaign)}>
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="delete-button"
                  >
                    Deletar
                  </button>
                </div>
                
                <div className="campaign-meta">
                  <small>
                    Criado em: {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsManager;
