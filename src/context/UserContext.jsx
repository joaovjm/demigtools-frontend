import { createContext, useEffect, useState } from "react";
import localStorageService from "../utils/localStorageService";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [operatorData, setOperatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const savedOperator = localStorageService.get("operatorData");
        if (savedOperator) {
          setOperatorData(savedOperator);
        }
      } catch (error) {
        console.error("Error loading operator data from localStorage:", error);
        // Em caso de erro, limpar dados corrompidos
        localStorageService.remove("operatorData");
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeUserData();
  }, []);

  useEffect(() => {
    // Só salvar no localStorage após a inicialização para evitar loops
    if (initialized) {
      if (operatorData) {
        localStorageService.set("operatorData", operatorData);
      } else {
        localStorageService.remove("operatorData");
      }
    }
  }, [operatorData, initialized]);

  const login = (operator) => {
    setOperatorData(operator);
    // Não precisa chamar localStorageService.set aqui pois o useEffect já faz isso
  };

  const logout = () => {
    setOperatorData(null);
    // Não precisa chamar localStorageService.remove aqui pois o useEffect já faz isso
  };

  return (
    <UserContext.Provider value={{ operatorData, setOperatorData, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};
