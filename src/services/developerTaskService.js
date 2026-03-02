import supabase from '../helper/superBaseClient';

const BUCKET_NAME = 'developer-task-images';

/**
 * Serviço para gerenciar tarefas de desenvolvimento
 */
export const developerTaskService = {
  /**
   * Upload de imagem para o Supabase Storage
   * @param {File} file - Arquivo da imagem
   * @returns {Promise<string>} - URL pública da imagem
   */
  async uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `tasks/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * Upload de múltiplas imagens
   * @param {FileList|File[]} files - Lista de arquivos
   * @returns {Promise<string[]>} - Array com URLs das imagens
   */
  async uploadMultipleImages(files) {
    const uploadPromises = Array.from(files).map(file => this.uploadImage(file));
    return Promise.all(uploadPromises);
  },

  /**
   * Criar nova tarefa de desenvolvimento
   * @param {Object} taskData - Dados da tarefa
   * @returns {Promise<Object>} - Tarefa criada
   */
  async createTask(taskData) {
    const { data, error } = await supabase
      .from('developer_task')
      .insert([{
        title: taskData.title,
        description: taskData.description,
        images: taskData.images || [],
        priority: taskData.priority || 'media',
        admin_created_by: taskData.adminId,
        status: 'pendente'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar todas as tarefas com informações do admin
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Object[]>} - Lista de tarefas
   */
  async getTasks(filters = {}) {
    let query = supabase
      .from('developer_task')
      .select(`
        *,
        admin:admin_created_by(operator_name, operator_code_id)
      `)
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Atualizar status de uma tarefa
   * @param {number} taskId - ID da tarefa
   * @param {string} status - Novo status
   * @param {string} developerResponse - Resposta do desenvolvedor (opcional)
   * @returns {Promise<Object>} - Tarefa atualizada
   */
  async updateTaskStatus(taskId, status, developerResponse = null) {
    const updateData = { status };
    
    if (developerResponse) {
      updateData.developer_response = developerResponse;
    }
    
    if (status === 'concluido') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('developer_task')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar uma tarefa específica
   * @param {number} taskId - ID da tarefa
   * @returns {Promise<Object>} - Dados da tarefa
   */
  async getTaskById(taskId) {
    const { data, error } = await supabase
      .from('developer_task')
      .select(`
        *,
        admin:admin_created_by(operator_name, operator_code_id)
      `)
      .eq('id', taskId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deletar uma tarefa
   * @param {number} taskId - ID da tarefa
   * @returns {Promise<void>}
   */
  async deleteTask(taskId) {
    const { error } = await supabase
      .from('developer_task')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  /**
   * Contar tarefas pendentes
   * @returns {Promise<number>}
   */
  async countPendingTasks() {
    const { count, error } = await supabase
      .from('developer_task')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');

    if (error) throw error;
    return count || 0;
  }
};

export default developerTaskService;

