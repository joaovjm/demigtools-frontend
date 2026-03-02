import supabase from '../helper/supaBaseClient.js';

/**
 * Serviço para gerenciar campanhas de WhatsApp usando Supabase
 * Substitui a necessidade de um servidor serverless
 */
class CampaignsService {
  
  /**
   * Lista todas as campanhas
   * @returns {Promise<{success: boolean, campaigns?: Array, error?: string}>}
   */
  async getCampaigns() {
    try {
      const { data: campaigns, error } = await supabase
        .from("whatsapp_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar campanhas:", error);
        return {
          success: false,
          error: "Erro ao buscar campanhas",
          details: error.message,
        };
      }

      return {
        success: true,
        campaigns: campaigns || [],
      };
    } catch (error) {
      console.error("❌ Erro no serviço de campanhas (GET):", error);
      return {
        success: false,
        error: "Erro interno do serviço",
        details: error.message,
      };
    }
  }

  /**
   * Cria uma nova campanha
   * @param {Object} campaignData - Dados da campanha
   * @param {string} campaignData.name - Nome da campanha
   * @param {string} [campaignData.description] - Descrição da campanha
   * @param {Array} campaignData.selectedTemplates - Templates selecionados
   * @param {Array} [campaignData.variables] - Variáveis da campanha
   * @returns {Promise<{success: boolean, campaign?: Object, error?: string}>}
   */
  async createCampaign(campaignData) {
    try {
      const { name, description, selectedTemplates, variables = [] } = campaignData;

      // Validação
      if (!name || !selectedTemplates || selectedTemplates.length === 0) {
        return {
          success: false,
          error: "Nome da campanha e pelo menos um template são obrigatórios",
        };
      }

      // Preparar dados para inserção
      const dataToInsert = {
        name: name.trim(),
        description: description?.trim() || null,
        selected_templates: selectedTemplates,
        variables: variables.filter(v => v && v.trim() !== ''), // Salvar apenas variáveis não vazias
      };

      const { data: campaign, error } = await supabase
        .from("whatsapp_campaigns")
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao criar campanha:", error);
        
        // Verificar se a tabela existe
        if (error.message?.includes('relation "whatsapp_campaigns" does not exist')) {
          return {
            success: false,
            error: "Tabela whatsapp_campaigns não encontrada. Execute o script SQL primeiro.",
            details: error.message,
          };
        }

        return {
          success: false,
          error: "Erro ao criar campanha",
          details: error.message,
        };
      }

      return {
        success: true,
        campaign,
        message: "Campanha criada com sucesso",
      };
    } catch (error) {
      console.error("❌ Erro no serviço de campanhas (POST):", error);
      return {
        success: false,
        error: "Erro interno do serviço",
        details: error.message,
      };
    }
  }

  /**
   * Atualiza uma campanha existente
   * @param {string} campaignId - ID da campanha
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<{success: boolean, campaign?: Object, error?: string}>}
   */
  async updateCampaign(campaignId, updateData) {
    try {
      if (!campaignId) {
        return {
          success: false,
          error: "ID da campanha é obrigatório",
        };
      }

      // Preparar dados para atualização (remover campos vazios)
      const dataToUpdate = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          if (key === 'variables') {
            dataToUpdate[key] = updateData[key].filter(v => v && v.trim() !== '');
          } else if (typeof updateData[key] === 'string') {
            dataToUpdate[key] = updateData[key].trim();
          } else {
            dataToUpdate[key] = updateData[key];
          }
        }
      });

      const { data: campaign, error } = await supabase
        .from("whatsapp_campaigns")
        .update(dataToUpdate)
        .eq("id", campaignId)
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao atualizar campanha:", error);
        return {
          success: false,
          error: "Erro ao atualizar campanha",
          details: error.message,
        };
      }

      if (!campaign) {
        return {
          success: false,
          error: "Campanha não encontrada",
        };
      }

      return {
        success: true,
        campaign,
        message: "Campanha atualizada com sucesso",
      };
    } catch (error) {
      console.error("❌ Erro no serviço de campanhas (PUT):", error);
      return {
        success: false,
        error: "Erro interno do serviço",
        details: error.message,
      };
    }
  }

  /**
   * Deleta uma campanha
   * @param {string} campaignId - ID da campanha
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteCampaign(campaignId) {
    try {
      if (!campaignId) {
        return {
          success: false,
          error: "ID da campanha é obrigatório",
        };
      }

      const { error } = await supabase
        .from("whatsapp_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) {
        console.error("❌ Erro ao deletar campanha:", error);
        return {
          success: false,
          error: "Erro ao deletar campanha",
          details: error.message,
        };
      }

      return {
        success: true,
        message: "Campanha deletada com sucesso",
      };
    } catch (error) {
      console.error("❌ Erro no serviço de campanhas (DELETE):", error);
      return {
        success: false,
        error: "Erro interno do serviço",
        details: error.message,
      };
    }
  }

  /**
   * Busca uma campanha específica por ID
   * @param {string} campaignId - ID da campanha
   * @returns {Promise<{success: boolean, campaign?: Object, error?: string}>}
   */
  async getCampaignById(campaignId) {
    try {
      if (!campaignId) {
        return {
          success: false,
          error: "ID da campanha é obrigatório",
        };
      }

      const { data: campaign, error } = await supabase
        .from("whatsapp_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (error) {
        console.error("❌ Erro ao buscar campanha:", error);
        return {
          success: false,
          error: "Erro ao buscar campanha",
          details: error.message,
        };
      }

      if (!campaign) {
        return {
          success: false,
          error: "Campanha não encontrada",
        };
      }

      return {
        success: true,
        campaign,
      };
    } catch (error) {
      console.error("❌ Erro no serviço de campanhas (GET BY ID):", error);
      return {
        success: false,
        error: "Erro interno do serviço",
        details: error.message,
      };
    }
  }

  /**
   * Busca campanhas por nome (busca parcial)
   * @param {string} searchTerm - Termo de busca
   * @returns {Promise<{success: boolean, campaigns?: Array, error?: string}>}
   */
  async searchCampaigns(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return this.getCampaigns();
      }

      const { data: campaigns, error } = await supabase
        .from("whatsapp_campaigns")
        .select("*")
        .ilike("name", `%${searchTerm.trim()}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar campanhas:", error);
        return {
          success: false,
          error: "Erro ao buscar campanhas",
          details: error.message,
        };
      }

      return {
        success: true,
        campaigns: campaigns || [],
      };
    } catch (error) {
      console.error("❌ Erro no serviço de campanhas (SEARCH):", error);
      return {
        success: false,
        error: "Erro interno do serviço",
        details: error.message,
      };
    }
  }
}

// Criar uma instância singleton do serviço
const campaignsService = new CampaignsService();

export default campaignsService;

// Exportar também as funções individuais para conveniência
export const {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignById,
  searchCampaigns
} = campaignsService;
