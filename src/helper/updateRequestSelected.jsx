import supabase from './superBaseClient';
import { toast } from 'react-toastify';
import { normalizeStatus } from '../utils/statusUtils';

/**
 * Atualiza o status de uma requisição
 * @param {string|array} status - Status único ou array de status
 * @param {number} id - ID da requisição
 * @param {function} setModalOpen - Função para fechar o modal (opcional)
 * @param {function} setActive - Função para resetar o ativo (opcional)
 * @returns {object} - Dados atualizados
 */
const updateRequestSelected = async (status, id, setModalOpen, setActive) => {
  console.log({status, id, setModalOpen, setActive});
  
  try {
    // Normaliza o status para array
    const statusArray = normalizeStatus(status);
    
    const { data, error } = await supabase
      .from("request")
      .update({ request_status: statusArray })
      .eq("id", id)
      .select();
      
    if (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
      return null;
    }
    
    if (!error) {
      toast.success("Processo concluído com sucesso");
      if (setModalOpen) setModalOpen(false);
      if (setActive) setActive("");
      
      return data;
    }
  } catch (error) {
    console.error(error.message);
    toast.error("Erro ao atualizar status");
    return null;
  }
}

export default updateRequestSelected

