const localStorageService = {
    get(key) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Erro ao recuperar do localStorage', error);
        return null;
      }
    },
  
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Erro ao salvar no localStorage', error);
      }
    },
  
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Erro ao remover do localStorage', error);
      }
    }
  };
  
export default localStorageService;