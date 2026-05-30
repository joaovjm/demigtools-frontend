import { Navigate } from "react-router-dom";
import supabase from "../../helper/superBaseClient";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";

function Wrapper({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { operatorData } = useContext(UserContext);
  
  useEffect(() => {
    let timeoutId;
    
    const getSession = async () => {
      try {
        // Timeout de 10 segundos para evitar loading infinito
        timeoutId = setTimeout(() => {
          console.warn("Wrapper - Session check timeout, assuming not authenticated");
          setIsAuthenticated(false);
          setLoading(false);
        }, 10000);

        const { data: { session }, error } = await supabase.auth.getSession();

        // Limpar timeout se a requisição foi bem-sucedida
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        setIsAuthenticated(!!session);
        setLoading(false);
        setError(null);
        
        if (error) {
          console.error("Wrapper - error checking session:", error);
          setError(error);
        }
      } catch (err) {
        console.error("Wrapper - exception checking session:", err);
        setError(err);
        setLoading(false);
        
        // Limpar timeout em caso de erro
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    getSession();
    
    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
      setError(null);
    });
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      data?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  } 
  
  if (error) {
    console.error("Wrapper - Authentication error:", error);
    return <Navigate to="/login" />;
  }
  
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <Navigate to="/login" />;
}

export default Wrapper;
