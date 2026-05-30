import api from '../config/api';

export const operatorApiService = {
  // Buscar todos os operadores
  async getOperators() {
    return await api.get('/operators');
  },

  // Buscar operador por ID
  async getOperator(id) {
    return await api.get(`/operators/${id}`);
  },

  // Criar operador
  async createOperator(operatorData) {
    return await api.post('/operators', operatorData);
  },

  // Atualizar operador
  async updateOperator(id, operatorData) {
    return await api.put(`/operators/${id}`, operatorData);
  },

  // Deletar operador
  async deleteOperator(id) {
    return await api.delete(`/operators/${id}`);
  },

  // Buscar meta do operador
  async getOperatorMeta(id, startDate, endDate) {
    return await api.get(`/operators/${id}/meta?startDate=${startDate}&endDate=${endDate}`);
  },

  // Buscar doações recebidas do operador
  async getOperatorDonationsReceived(id, filters = {}) {
    const params = new URLSearchParams(filters);
    return await api.get(`/operators/${id}/donations-received?${params}`);
  },
};

export default operatorApiService;
