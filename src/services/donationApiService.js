import api from '../config/api';

export const donationApiService = {
  // Criar doação
  async createDonation(donationData) {
    return await api.post('/donations', donationData);
  },

  // Buscar doações de um doador
  async getDonationsByDonor(donorId) {
    return await api.get(`/donations/donor/${donorId}`);
  },

  // Receber doação
  async receiveDonation(donationId, collectorId) {
    return await api.put(`/donations/${donationId}/receive`, { collectorId });
  },

  // Cancelar doação
  async cancelDonation(donationId) {
    return await api.delete(`/donations/${donationId}`);
  },

  // Buscar doações recebidas
  async getReceivedDonations(filters = {}) {
    const params = new URLSearchParams(filters);
    return await api.get(`/donations/received?${params}`);
  },

  // Buscar doações não recebidas
  async getNotReceivedDonations(filters = {}) {
    const params = new URLSearchParams(filters);
    return await api.get(`/donations/not-received?${params}`);
  },

  // Buscar doações agendadas
  async getScheduledDonations() {
    return await api.get('/donations/scheduled');
  },
};

export default donationApiService;
