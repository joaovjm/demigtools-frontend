import { useContext } from "react"
import { UserContext } from "../context/UserContext"
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = ({requiredRole}) => {
    const { operatorData, loading } = useContext(UserContext);
    
    // Aguardar o UserContext terminar de carregar
    if (loading) {
        return <div>Carregando...</div>;
    }
    
    // Se não há dados do operador, redirecionar para login
    if (!operatorData) {
        return <Navigate to="/login" />;
    }

    const { operator_type } = operatorData;

    if (requiredRole === "Admin" && operator_type !== "Admin"){
        return <Navigate to="/dashboard"/>
    }

    if (requiredRole === "Operador" && operator_type === "Admin"){
        return <Navigate to="/dashboardAdmin"/>
    }

    return <Outlet/>
}

export default ProtectedRoute;