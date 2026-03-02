import { useState, useEffect, useCallback } from 'react';
import campaignsService from '../services/campaignsService.js';

/**
 * Hook personalizado para gerenciar campanhas
 * Fornece estado e funções para operações CRUD de campanhas
 */
export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar campanhas
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await campaignsService.getCampaigns();
      
      if (result.success) {
        setCampaigns(result.campaigns);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erro ao carregar campanhas');
      console.error('Erro no hook useCampaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova campanha
  const createCampaign = useCallback(async (campaignData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await campaignsService.createCampaign(campaignData);
      
      if (result.success) {
        setCampaigns(prev => [result.campaign, ...prev]);
        return { success: true, campaign: result.campaign };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Erro ao criar campanha';
      setError(errorMsg);
      console.error('Erro no hook useCampaigns (create):', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar campanha
  const updateCampaign = useCallback(async (campaignId, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await campaignsService.updateCampaign(campaignId, updateData);
      
      if (result.success) {
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId ? result.campaign : campaign
          )
        );
        return { success: true, campaign: result.campaign };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Erro ao atualizar campanha';
      setError(errorMsg);
      console.error('Erro no hook useCampaigns (update):', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Deletar campanha
  const deleteCampaign = useCallback(async (campaignId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await campaignsService.deleteCampaign(campaignId);
      
      if (result.success) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Erro ao deletar campanha';
      setError(errorMsg);
      console.error('Erro no hook useCampaigns (delete):', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar campanha por ID
  const getCampaignById = useCallback(async (campaignId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await campaignsService.getCampaignById(campaignId);
      
      if (result.success) {
        return { success: true, campaign: result.campaign };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Erro ao buscar campanha';
      setError(errorMsg);
      console.error('Erro no hook useCampaigns (getById):', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar campanhas
  const searchCampaigns = useCallback(async (searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await campaignsService.searchCampaigns(searchTerm);
      
      if (result.success) {
        setCampaigns(result.campaigns);
        return { success: true, campaigns: result.campaigns };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = 'Erro ao buscar campanhas';
      setError(errorMsg);
      console.error('Erro no hook useCampaigns (search):', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar campanhas automaticamente quando o hook é montado
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaignById,
    searchCampaigns,
  };
};

export default useCampaigns;
