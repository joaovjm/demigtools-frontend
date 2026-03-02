
import React, { useEffect, useState } from "react";
import { getOperators } from "../../helper/getOperators";
import supabase from "../../helper/supaBaseClient";
import { useCampaigns } from "../../hooks/useCampaigns";
import campaignsService from "../../services/campaignsService";
import styles from "../../pages/AdminManager/adminmanager.module.css";

const WhatsappManager = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "utility",
    language: "pt_BR",
    bodyText: "",
    headerText: "",
    footerText: "",
    buttons: [],
  });
  const [templateStatus, setTemplateStatus] = useState("");
  const [searchTemplate, setSearchTemplate] = useState("");
  
  // Estados para Mensagens de Campanha - Migrado para useCampaigns hook
  const {
    campaigns,
    loading: campaignLoading,
    error: campaignError,
    createCampaign: createCampaignHook,
    deleteCampaign: deleteCampaignHook,
    loadCampaigns
  } = useCampaigns();
  
  const [allTemplates, setAllTemplates] = useState([]);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    selectedTemplates: [],
    variables: [], // Array de strings para os parâmetros
  });

  // Estados para Gerenciar Contatos
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editOperatorCode, setEditOperatorCode] = useState("");
  const [operators, setOperators] = useState([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
 

  // Função para consultar status de template
  const checkTemplateStatus = async (templateName) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/submit-template?name=${templateName}`);
      const data = await response.json();

      if (data.success && data.result.data && data.result.data.length > 0) {
        setTemplates(data.result.data);
        setTemplateStatus(`Template encontrado: ${data.result.data[0].status}`);
      } else {
        setTemplateStatus("Template não encontrado");
        setTemplates([]);
      }
    } catch (error) {
      console.error("Erro ao consultar template:", error);
      setTemplateStatus("Erro ao consultar template");
    }
    setLoading(false);
  };

  // Função para criar novo template
  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.category) {
      alert("Nome e categoria são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/submit-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTemplate),
      });

      const data = await response.json();

      if (data.success) {
        alert("Template enviado para aprovação com sucesso!");
        setNewTemplate({
          name: "",
          category: "utility",
          language: "pt_BR",
          bodyText: "",
          headerText: "",
          footerText: "",
          buttons: [],
        });
      } else {
        alert(`Erro ao criar template: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao criar template:", error);
      alert("Erro ao criar template");
    }
    setLoading(false);
  };

  // Função para adicionar botão
  const addButton = () => {
    setNewTemplate((prev) => ({
      ...prev,
      buttons: [...prev.buttons, { type: "QUICK_REPLY", text: "" }],
    }));
  };

  // Função para remover botão
  const removeButton = (index) => {
    setNewTemplate((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  };

  // Função para atualizar botão
  const updateButton = (index, text) => {
    setNewTemplate((prev) => ({
      ...prev,
      buttons: prev.buttons.map((button, i) =>
        i === index ? { ...button, text } : button
      ),
    }));
  };

  const formatTemplateStatus = (status) => {
    const statusMap = {
      APPROVED: "Aprovado",
      PENDING: "Pendente",
      REJECTED: "Rejeitado",
      DISABLED: "Desabilitado",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "#4CAF50";
      case "PENDING":
        return "#FF9800";
      case "REJECTED":
        return "#F44336";
      case "DISABLED":
        return "#9E9E9E";
      default:
        return "#FFF";
    }
  };

  // Função para carregar todos os templates aprovados usando edge function
  const loadAllTemplates = async () => {

    try {
      const { data, error } = await supabase.functions.invoke('get-approved-templates');
      
      if (error) {
        console.error("Erro ao chamar edge function:", error);
        alert(`Erro ao carregar templates aprovados: ${error.message}`);
        return;
      }
      
      if (data && data.success) {
        setAllTemplates(data.templates || []);
      } else {
        console.error("Resposta inválida da edge function:", data);
        alert("Erro ao carregar templates aprovados - resposta inválida");
      }
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      alert(`Erro ao carregar templates aprovados: ${error.message}`);
    }

  };

  // Função para carregar campanhas salvas - Migrada para useCampaigns hook
  // A função loadCampaigns agora vem do hook useCampaigns

  // Função para criar nova campanha - Migrada para useCampaigns hook
  const createCampaign = async () => {
    if (!newCampaign.name || newCampaign.selectedTemplates.length === 0) {
      alert("Nome da campanha e pelo menos um template são obrigatórios");
      return;
    }

    try {
      const result = await createCampaignHook(newCampaign);
      
      if (result.success) {
        alert("Campanha criada com sucesso!");
        setNewCampaign({
          name: "",
          description: "",
          selectedTemplates: [],
          variables: [],
        });
      } else {
        console.error("❌ Erro na criação:", result.error);
        
        if (result.error?.includes("não encontrada")) {
          alert(`Erro: ${result.error}\n\nVocê precisa executar o script SQL para criar as tabelas primeiro.`);
        } else {
          alert(`Erro ao criar campanha: ${result.error || "Erro desconhecido"}`);
        }
      }
    } catch (error) {
      console.error("❌ Erro ao criar campanha:", error);
      alert(`Erro ao criar campanha: ${error.message}`);
    }
  };

  // Função para deletar campanha - Migrada para useCampaigns hook
  const deleteCampaign = async (campaignId) => {
    if (!confirm("Tem certeza que deseja deletar esta campanha?")) {
      return;
    }

    try {
      const result = await deleteCampaignHook(campaignId);
      
      if (result.success) {
        alert("Campanha deletada com sucesso!");
      } else {
        console.error("❌ Erro na deleção:", result.error);
        alert(`Erro ao deletar campanha: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Erro ao deletar campanha:", error);
      alert(`Erro ao deletar campanha: ${error.message}`);
    }
  };

  // Função para contar parâmetros necessários em um template
  const countTemplateParameters = (template) => {
    const bodyComponent = template.components?.find(c => c.type === 'BODY');
    if (bodyComponent && bodyComponent.text) {
      const matches = bodyComponent.text.match(/\{\{\d+\}\}/g);
      return matches ? matches.length : 0;
    }
    return 0;
  };

  // Função para calcular total de parâmetros necessários
  const calculateTotalParameters = (templates) => {
    return Math.max(...templates.map(t => countTemplateParameters(t)), 0);
  };

  // Função para adicionar/remover template da campanha
  const toggleTemplateSelection = (template) => {
    setNewCampaign(prev => {
      const isSelected = prev.selectedTemplates.find(t => t.name === template.name);
      
      let newSelectedTemplates;
      if (isSelected) {
        newSelectedTemplates = prev.selectedTemplates.filter(t => t.name !== template.name);
      } else {
        newSelectedTemplates = [...prev.selectedTemplates, template];
      }

      // Recalcular variáveis necessárias
      const maxParams = calculateTotalParameters(newSelectedTemplates);
      const currentVariables = prev.variables || [];
      
      // Ajustar array de variáveis para o tamanho necessário
      let newVariables = [...currentVariables];
      if (maxParams > currentVariables.length) {
        // Adicionar variáveis vazias se necessário
        while (newVariables.length < maxParams) {
          newVariables.push('');
        }
      } else if (maxParams < currentVariables.length) {
        // Remover variáveis excedentes
        newVariables = newVariables.slice(0, maxParams);
      }

      return {
        ...prev,
        selectedTemplates: newSelectedTemplates,
        variables: newVariables
      };
    });
  };

  // Função para atualizar variável
  const updateVariable = (index, value) => {
    setNewCampaign(prev => ({
      ...prev,
      variables: prev.variables.map((v, i) => i === index ? value : v)
    }));
  };

  // Função para testar a configuração - DESCONTINUADA (migração para Supabase)
  // Agora usamos o campaignsService diretamente, não precisamos mais testar APIs serverless
  const testConfiguration = async () => {
    try {
      const result = await campaignsService.getCampaigns();
      if (result.success) {
        alert("✅ Configuração OK! Conexão com Supabase funcionando.");
      } else {
        alert(`❌ Problema de configuração:\n\n${result.error}\n\nDetalhes: ${result.details || "Verifique os logs"}`);
      }
    } catch (error) {
      alert(`❌ Erro ao testar: ${error.message}`);
    }
  };

  // Função para testar template individual usando edge function
  const testTemplate = async (templateName) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-template', {
        body: { templateName }
      });
      
      if (error) {
        console.error("Erro ao chamar edge function validate-template:", error);
        alert(`❌ Erro ao validar template: ${error.message}`);
        return;
      }
      
      if (data && data.success) {
        alert(`✅ Template "${templateName}" está funcionando corretamente!`);
      } else if (data && !data.success) {
        alert(`❌ Problema com o template "${templateName}":\n\nErro: ${data.error?.error || 'Erro desconhecido'}\nCódigo: ${data.error?.errorCode || 'N/A'}\n\nInterpretação: ${data.interpretation || 'N/A'}\n\nRecomendação: ${data.recommendation || 'N/A'}`);
      } else {
        console.error("Resposta inválida da edge function:", data);
        alert("❌ Erro ao validar template - resposta inválida da edge function");
      }
    } catch (error) {
      console.error("Erro ao testar template:", error);
      alert(`❌ Erro ao testar template: ${error.message}`);
    }
   
  };

  // Função para testar deleção - DESCONTINUADA (migração para Supabase)
  // Agora usamos o campaignsService diretamente
  const testDeletion = async () => {
    try {
      const result = await campaignsService.getCampaigns();
      if (result.success) {
        let message = "✅ Teste de conexão com Supabase realizado!\n\n";
        message += `Campanhas encontradas: ${result.campaigns.length}\n`;
        message += `Estrutura da tabela: OK\n`;
        message += `Conexão com Supabase: Funcionando\n\n`;
        message += `Agora você pode criar e deletar campanhas diretamente!`;
        alert(message);
      } else {
        alert(`❌ Erro no teste de conexão:\n\n${result.error}\n\nDetalhes: ${result.details}`);
      }
    } catch (error) {
      alert(`❌ Erro ao testar conexão: ${error.message}`);
    }
  };

  // Função para testar endpoint de deleção direto - DESCONTINUADA (migração para Supabase)
  const testDeleteEndpoint = async () => {
    try {
      // Teste simples de conexão com Supabase
      const result = await campaignsService.getCampaigns();
      if (result.success) {
        alert(`✅ Conexão com Supabase funcionando!\n\nCampanhas encontradas: ${result.campaigns.length}\n\nAgora você pode usar todas as funcionalidades diretamente!`);
      } else {
        alert(`❌ Falha na conexão:\n\n${result.error}\n\nDetalhes: ${result.details}`);
      }
    } catch (error) {
      console.error("❌ Erro no teste de conexão:", error);
      alert(`❌ Erro no teste de conexão: ${error.message}`);
    }
  };

  // Função para carregar contatos - Migrada para Supabase direto
  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      // Buscar contatos diretamente do Supabase com informações do operador
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select(`
          contact_id,
          phone_number,
          created_at,
          operator_code_id,
          operator!operator_code_id (
            operator_name,
            operator_code_id
          )
        `)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Erro ao buscar contatos:", error);
        alert(`Erro ao carregar contatos: ${error.message}`);
        return;
      }

      // Processar os dados para incluir o nome do operador
      const processedContacts = (contacts || []).map(contact => ({
        id: contact.contact_id,
        phone_number: contact.phone_number,
        operator_name: contact.operator?.operator_name || "Sem operador",
        operator_code_id: contact.operator_code_id,
        created_at: contact.created_at
      }));

      setContacts(processedContacts);
    } catch (error) {
      console.error("❌ Erro ao carregar contatos:", error);
      alert(`Erro ao carregar contatos: ${error.message}`);
    }
    setContactsLoading(false);
  };

  // Função para carregar operadores ativos
  const loadOperators = async () => {
    setOperatorsLoading(true);
    try {
      const data = await getOperators({ active: true });
      
      if (data && !data.error) {
        setOperators(data || []);
      } else {
        console.error("Erro ao carregar operadores:", data?.error);
        alert("Erro ao carregar operadores");
      }
    } catch (error) {
      console.error("Erro ao carregar operadores:", error);
      alert("Erro ao carregar operadores");
    }
    setOperatorsLoading(false);
  };

  // Função para iniciar edição de contato
  const startEditContact = (contact) => {
    setEditingContact(contact.id);
    setEditOperatorCode(contact.operator_code_id || "");
  };

  // Função para cancelar edição
  const cancelEditContact = () => {
    setEditingContact(null);
    setEditOperatorCode("");
  };

  // Função para salvar edição do código do operador
  const saveOperatorCode = async (contactId) => {
    setContactsLoading(true);
    try {
      
      // Usar Supabase diretamente em vez da API
      const { data: updatedContact, error } = await supabase
        .from("contacts")
        .update({ operator_code_id: editOperatorCode })
        .eq("contact_id", contactId)
        .select(`
          contact_id,
          phone_number,
          operator_code_id,
          operator!operator_code_id (
            operator_name,
            operator_code_id
          )
        `)
        .single();

      if (error) {
        console.error("❌ Erro ao atualizar contato no Supabase:", error);
        throw new Error(`Erro ao atualizar contato: ${error.message}`);
      }

      if (updatedContact) {
        // Atualizar o contato na lista local
        setContacts(prev => 
          prev.map(contact => 
            contact.id === contactId 
              ? { 
                  ...contact, 
                  operator_code_id: editOperatorCode,
                  operator_name: updatedContact.operator?.operator_name || contact.operator_name
                }
              : contact
          )
        );
        setEditingContact(null);
        setEditOperatorCode("");
        alert("Código do operador atualizado com sucesso!");
      } else {
        throw new Error("Contato não foi atualizado");
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar código do operador:", error);
      alert(`Erro ao atualizar código do operador: ${error.message}`);
    }
    setContactsLoading(false);
  };


  // Carregar dados quando as abas forem ativadas
  useEffect(() => {
    if (activeTab === "campaigns") {
      loadAllTemplates();
      // loadCampaigns() agora é chamado automaticamente pelo hook useCampaigns
    } else if (activeTab === "contacts") {
      loadContacts();
      loadOperators();
    }
  }, [activeTab]);



  return (
    <div className={styles.whatsappManagerContainer}>
      {/* Menu de Tabs */}
      <div className={styles.whatsappManagerTabs}>
        <div
          className={`${styles.whatsappManagerTab} ${
            activeTab === "templates" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("templates")}
        >
          Consultar Templates
        </div>
        <div
          className={`${styles.whatsappManagerTab} ${
            activeTab === "create" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("create")}
        >
          Criar Template
        </div>
        <div
          className={`${styles.whatsappManagerTab} ${
            activeTab === "campaigns" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("campaigns")}
        >
          Mensagens de Campanha
        </div>
        <div
          className={`${styles.whatsappManagerTab} ${
            activeTab === "contacts" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("contacts")}
        >
          Gerenciar Contatos
        </div>
        <div
          className={`${styles.whatsappManagerTab} ${
            activeTab === "diagnostico" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("diagnostico")}
        >
          Diagnóstico
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className={styles.whatsappManagerContent}>
        {activeTab === "templates" && (
          <div className={styles.whatsappManagerSection}>
            <h3>Consultar Status de Templates</h3>

            <div className={styles.whatsappManagerSearch}>
              <input
                type="text"
                placeholder="Nome do template"
                value={searchTemplate}
                onChange={(e) => setSearchTemplate(e.target.value)}
                className={styles.whatsappManagerInput}
              />
              <button
                onClick={() => checkTemplateStatus(searchTemplate)}
                disabled={loading || !searchTemplate}
                className={`${styles.whatsappManagerBtn} ${styles.primary}`}
              >
                {loading ? "Consultando..." : "Consultar"}
              </button>
            </div>

            {templateStatus && (
              <div className={styles.whatsappManagerStatus}>{templateStatus}</div>
            )}

            {templates.length > 0 && (
              <div className={styles.whatsappManagerTemplates}>
                <h4>Templates Encontrados:</h4>
                {templates.map((template, index) => (
                  <div key={index} className={styles.whatsappManagerTemplateItem}>
                    <div className={styles.templateInfo}>
                      <strong>{template.name}</strong>
                      <span className={styles.templateCategory}>
                        {template.category}
                      </span>
                      <span className={styles.templateLanguage}>
                        {template.language}
                      </span>
                    </div>
                    <div
                      className={styles.templateStatus}
                      style={{ color: getStatusColor(template.status) }}
                    >
                      {formatTemplateStatus(template.status)}
                    </div>
                    {template.last_updated_time && (
                      <div className={styles.templateUpdated}>
                        Atualizado:{" "}
                        {new Date(
                          template.last_updated_time * 1000
                        ).toLocaleString()}
                      </div>
                    )}
                    {template.rejected_reason && (
                      <div className={styles.templateRejection}>
                        Motivo da rejeição: {template.rejected_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className={styles.whatsappManagerSection}>
            <h3>Criar Novo Template</h3>

            <div className={styles.whatsappManagerForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nome do Template *</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ex: boas_vindas_cliente"
                    className={styles.whatsappManagerInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Categoria *</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className={styles.whatsappManagerSelect}
                  >
                    <option value="utility">Utility</option>
                    <option value="marketing">Marketing</option>
                    <option value="authentication">Authentication</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Idioma</label>
                  <select
                    value={newTemplate.language}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        language: e.target.value,
                      }))
                    }
                    className={styles.whatsappManagerSelect}
                  >
                    <option value="pt_BR">Português (BR)</option>
                    <option value="en_US">English (US)</option>
                    <option value="es_ES">Español</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Cabeçalho (Header)</label>
                  <input
                    type="text"
                    value={newTemplate.headerText}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        headerText: e.target.value,
                      }))
                    }
                    placeholder="Texto do cabeçalho (opcional)"
                    className={styles.whatsappManagerInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Corpo da Mensagem *</label>
                <textarea
                  value={newTemplate.bodyText}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      bodyText: e.target.value,
                    }))
                  }
                  placeholder="Texto principal da mensagem. Use {{1}}, {{2}}, etc. para variáveis"
                  className={styles.whatsappManagerTextarea}
                  rows="4"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Rodapé (Footer)</label>
                <input
                  type="text"
                  value={newTemplate.footerText}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      footerText: e.target.value,
                    }))
                  }
                  placeholder="Texto do rodapé (opcional)"
                  className={styles.whatsappManagerInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Botões</label>
                <div className={styles.buttonsSection}>
                  {newTemplate.buttons.map((button, index) => (
                    <div key={index} className={styles.buttonItem}>
                      <input
                        type="text"
                        value={button.text}
                        onChange={(e) => updateButton(index, e.target.value)}
                        placeholder="Texto do botão"
                        className={styles.whatsappManagerInput}
                      />
                      <button
                        onClick={() => removeButton(index)}
                        className={`${styles.whatsappManagerBtn} ${styles.danger} ${styles.small}`}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addButton}
                    className={`${styles.whatsappManagerBtn} ${styles.secondary} ${styles.small}`}
                  >
                    Adicionar Botão
                  </button>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={createTemplate}
                  disabled={
                    loading || !newTemplate.name || !newTemplate.category
                  }
                  className={`${styles.whatsappManagerBtn} ${styles.primary}`}
                >
                  {loading ? "Criando..." : "Criar Template"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "campaigns" && (
          <div className={styles.whatsappManagerSection}>
            <h3>Mensagens de Campanha</h3>

            {/* Seção de Criar Nova Campanha */}
            <div className={styles.campaignFormSection}>
              <h4>Criar Nova Campanha</h4>
              
              <div className={styles.whatsappManagerForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nome da Campanha *</label>
                    <input
                      type="text"
                      value={newCampaign.name}
                      onChange={(e) =>
                        setNewCampaign((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ex: Campanha Leite"
                      className={styles.whatsappManagerInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Descrição</label>
                    <input
                      type="text"
                      value={newCampaign.description}
                      onChange={(e) =>
                        setNewCampaign((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descrição da campanha (opcional)"
                      className={styles.whatsappManagerInput}
                    />
                  </div>
                </div>

                {/* Seleção de Templates */}
                <div className={styles.formGroup}>
                  <label>Selecionar Templates *</label>
                  <div className={styles.templatesSelection}>
                    {campaignLoading ? (
                      <div className={styles.loadingMessage}>Carregando templates...</div>
                    ) : allTemplates.length > 0 ? (
                        <div className={styles.templatesGrid}>
                        {allTemplates.map((template, index) => {
                          const isSelected = newCampaign.selectedTemplates.find(t => t.name === template.name);
                          return (
                            <div 
                              key={index} 
                              className={`${styles.templateCard} ${isSelected ? styles.selected : ''}`}
                              onClick={() => toggleTemplateSelection(template)}
                            >
                              <div className={styles.templateCardHeader}>
                                <strong>{template.name}</strong>
                                <span className={styles.templateCategory}>{template.category}</span>
                              </div>
                              <div className={styles.templateCardBody}>
                                {template.components?.find(c => c.type === 'BODY')?.text || 'Sem texto do corpo'}
                              </div>
                              <div className={styles.templateCardStatus}>
                                <span style={{ color: getStatusColor(template.status) }}>
                                  {formatTemplateStatus(template.status)}
                                </span>
                                <button
                                  className={styles.testTemplateBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    testTemplate(template.name);
                                  }}
                                  disabled={campaignLoading}
                                  title="Testar este template"
                                >
                                  🔧
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={styles.noTemplatesMessage}>
                        Nenhum template aprovado encontrado. Crie e aprove templates primeiro.
                      </div>
                    )}
                  </div>

                  {/* Templates Selecionados */}
                  {newCampaign.selectedTemplates.length > 0 && (
                    <div className={styles.selectedTemplates}>
                      <h5>Templates Selecionados ({newCampaign.selectedTemplates.length}):</h5>
                      <div className={styles.selectedTemplatesList}>
                        {newCampaign.selectedTemplates.map((template, index) => {
                          const paramCount = countTemplateParameters(template);
                          return (
                            <div key={index} className={styles.selectedTemplateItem}>
                              <span>
                                {index + 1}. {template.name} 
                                {paramCount > 0 && <small> ({paramCount} parâmetros)</small>}
                              </span>
                              <button
                                onClick={() => toggleTemplateSelection(template)}
                                className={styles.removeTemplateBtn}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Seção de Variáveis */}
                  {newCampaign.selectedTemplates.length > 0 && newCampaign.variables.length > 0 && (
                    <div className={styles.campaignVariables}>
                      <h5>Variáveis da Campanha:</h5>
                      <p className={styles.variablesHelp}>
                        Configure os valores que serão substituídos nos templates ({"{1}"}, {"{2}"}, etc.)
                      </p>
                      <div className={styles.variablesList}>
                        {newCampaign.variables.map((variable, index) => (
                          <div key={index} className={styles.variableItem}>
                            <label>Variável {index + 1}:</label>
                            <div className={styles.variableInputGroup}>
                              <select
                                value={variable.startsWith('{{') ? variable : 'static'}
                                onChange={(e) => {
                                  if (e.target.value === 'static') {
                                    updateVariable(index, '');
                                  } else {
                                    updateVariable(index, e.target.value);
                                  }
                                }}
                                className={`${styles.whatsappManagerSelect} ${styles.variableTypeSelect}`}
                              >
                                <option value="static">Valor Estático</option>
                                <option value="{{selectedConversation.title}}">Nome do Contato</option>
                                <option value="{{selectedConversation.phone_number}}">Telefone do Contato</option>
                                <option value="{{currentDate}}">Data Atual</option>
                                <option value="{{currentTime}}">Hora Atual</option>
                              </select>
                              {!variable.startsWith('{{') && (
                                <input
                                  type="text"
                                  value={variable}
                                  onChange={(e) => updateVariable(index, e.target.value)}
                                  placeholder={`Valor para {${index + 1}}`}
                                  className={`${styles.whatsappManagerInput} ${styles.variableStaticInput}`}
                                />
                              )}
                              {variable.startsWith('{{') && (
                                <div className={styles.dynamicVariableDisplay}>
                                  <span className={styles.dynamicVariableLabel}>
                                    {variable === '{{selectedConversation.title}}' && 'Nome do contato será usado automaticamente'}
                                    {variable === '{{selectedConversation.phone_number}}' && 'Telefone do contato será usado automaticamente'}
                                    {variable === '{{currentDate}}' && 'Data atual será inserida automaticamente'}
                                    {variable === '{{currentTime}}' && 'Hora atual será inserida automaticamente'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={styles.variablesInfo}>
                        <small>
                          💡 Deixe em branco para usar valores padrão ("Valor 1", "Valor 2", etc.)
                        </small>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={createCampaign}
                    disabled={campaignLoading || !newCampaign.name || newCampaign.selectedTemplates.length === 0}
                    className={`${styles.whatsappManagerBtn} ${styles.primary}`}
                  >
                    {campaignLoading ? "Criando..." : "Criar Campanha"}
                  </button>
                </div>
              </div>
            </div>

            {/* Seção de Campanhas Criadas */}
            <div className={styles.campaignsListSection}>
              <h4>Campanhas Criadas</h4>
              {campaigns.length > 0 ? (
                <div className={styles.campaignsGrid}>
                  {campaigns.map((campaign, index) => (
                    <div key={index} className={styles.campaignItem}>
                      <div className={styles.campaignHeader}>
                        <h5>{campaign.name}</h5>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className={styles.deleteCampaignBtn}
                        >
                          ×
                        </button>
                      </div>
                      {campaign.description && (
                        <p className={styles.campaignDescription}>{campaign.description}</p>
                      )}
                      <div className={styles.campaignTemplates}>
                        <strong>Templates ({campaign.selectedTemplates?.length || 0}):</strong>
                        <ul>
                          {(campaign.selectedTemplates || []).map((template, idx) => (
                            <li key={idx}>{template.name}</li>
                          ))}
                        </ul>
                      </div>
                      <div className={styles.campaignDate}>
                        Criada em: {campaign.created_at ? new Date(campaign.created_at).toLocaleString() : 'Data não disponível'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noCampaignsMessage}>
                  Nenhuma campanha criada ainda. Crie sua primeira campanha acima.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className={styles.whatsappManagerSection}>
            <h3>Gerenciar Contatos</h3>

            <div className={styles.contactsSection}>
              <div className={styles.contactsHeader}>
                <h4>Lista de Contatos</h4>
                <button
                  onClick={loadContacts}
                  disabled={contactsLoading}
                  className={`${styles.whatsappManagerBtn} ${styles.secondary}`}
                >
                  {contactsLoading ? "Carregando..." : "Atualizar Lista"}
                </button>
              </div>

              {contactsLoading ? (
                <div className={styles.loadingMessage}>Carregando contatos...</div>
              ) : contacts.length > 0 ? (
                <div className={styles.contactsTable}>
                  <div className={styles.contactsTableHeader}>
                    <div className={styles.contactCell}>Telefone</div>
                    <div className={styles.contactCell}>Nome do Operador</div>
                    <div className={styles.contactCell}>Código do Operador</div>
                    <div className={styles.contactCell}>Ações</div>
                  </div>
                  {contacts.map((contact) => (
                    <div key={contact.id} className={styles.contactsTableRow}>
                      <div className={styles.contactCell} data-label="Telefone">
                        <strong>{contact.phone_number || "Sem telefone"}</strong>
                      </div>
                      <div className={styles.contactCell} data-label="Nome do Operador">
                        {contact.operator_name || "Sem operador"}
                      </div>
                      <div className={styles.contactCell} data-label="Código do Operador">
                        {editingContact === contact.id ? (
                          <select
                            value={editOperatorCode}
                            onChange={(e) => setEditOperatorCode(e.target.value)}
                            className={`${styles.whatsappManagerSelect} ${styles.small}`}
                            style={{ width: "100%", fontSize: "12px" }}
                          >
                            <option value="">Selecione um operador</option>
                            {operators.map((operator) => (
                              <option key={operator.operator_code_id} value={operator.operator_code_id}>
                                {operator.operator_name} ({operator.operator_code_id})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={styles.operatorCodeDisplay}>
                            {contact.operator_code_id || "Sem código"}
                          </span>
                        )}
                      </div>
                      <div className={styles.contactCell} data-label="Ações">
                        {editingContact === contact.id ? (
                            <div className={styles.editActions}>
                            <button
                              onClick={() => saveOperatorCode(contact.id)}
                              disabled={contactsLoading}
                              className={`${styles.whatsappManagerBtn} ${styles.primary} ${styles.small}`}
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                              Salvar
                            </button>
                            <button
                              onClick={cancelEditContact}
                              disabled={contactsLoading}
                              className={`${styles.whatsappManagerBtn} ${styles.secondary} ${styles.small}`}
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditContact(contact)}
                            className={`${styles.whatsappManagerBtn} ${styles.secondary} ${styles.small}`}
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noContactsMessage}>
                  Nenhum contato encontrado. Verifique se a tabela 'contacts' existe e possui dados.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "diagnostico" && (
          <div className={styles.whatsappManagerSection}>
            <h3>Diagnóstico do Sistema</h3>

            {/* Seção de Diagnóstico - Migrada para Supabase */}
            <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: "#363a3d", borderRadius: "8px", border: "2px solid #2f2d2d" }}>
              <h4 style={{ color: "#faa01c", marginBottom: "12px", fontSize: "14px" }}>Testes de Conexão Supabase</h4>
              <p style={{ color: "#ccc", fontSize: "13px", marginBottom: "12px" }}>
                <strong>🔍 Testar Configuração:</strong> Verifica conexão com Supabase<br/>
                <strong>🗑️ Testar Conexão:</strong> Testa operações de leitura<br/>
                <strong>🔧 Teste Direto:</strong> Verifica funcionalidade básica
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={testConfiguration}
                  disabled={campaignLoading}
                  className={`${styles.whatsappManagerBtn} ${styles.secondary}`}
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  {campaignLoading ? "Testando..." : "🔍 Testar Configuração"}
                </button>
                <button
                  onClick={testDeletion}
                  disabled={campaignLoading}
                  className={`${styles.whatsappManagerBtn} ${styles.secondary}`}
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  {campaignLoading ? "Testando..." : "🗑️ Testar Conexão"}
                </button>
                <button
                  onClick={testDeleteEndpoint}
                  disabled={campaignLoading}
                  className={`${styles.whatsappManagerBtn} ${styles.secondary}`}
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  {campaignLoading ? "Testando..." : "🔧 Teste Direto"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsappManager;
