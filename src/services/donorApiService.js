import api from '../config/api';

// Exemplo de service convertido para usar API REST
export const donorApiService = {
  // Buscar doador por ID
  async getDonor(id) {
    return await api.get(`/donors/${id}`);
  },

  // Criar doador
  async createDonor(donorData) {
    return await api.post('/donors', donorData);
  },

  // Atualizar doador
  async updateDonor(id, donorData) {
    return await api.put(`/donors/${id}`, donorData);
  },

  // Buscar doadores
  async searchDonors(term, type = 'Todos') {
    return await api.get(`/donors/search?term=${encodeURIComponent(term)}&type=${encodeURIComponent(type)}`);
  },

  // Buscar emails de doadores
  async getDonorEmails() {
    return await api.get('/donors/emails');
  },

  // Buscar dados de confirmação do doador
  async getDonorConfirmation(id) {
    return await api.get(`/donors/${id}/confirmation`);
  },
};

export default donorApiService;
