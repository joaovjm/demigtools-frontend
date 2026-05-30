import { useContext, useEffect, useState } from "react";
import "./login.css";
import { FaEye, FaEyeSlash, FaRegUser } from "react-icons/fa";
import supabase from "../../helper/superBaseClient";
import { Navigate, useNavigate } from "react-router";
import Loader from "../../components/Loader";
import OperatorSessionLogin from "../../auth/OperatorSessionLogin";
import { UserContext } from "../../context/UserContext";

const Login = () => {
  const caracterOperator = JSON.parse(localStorage.getItem("operatorData"));
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSession, setIsSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const { operatorData, setOperatorData } = useContext(UserContext);

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsSession(session);
      } catch (err) {
        console.error("Login page - error checking session:", err);
      }
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setIsSession(session);
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await OperatorSessionLogin(username, password);

      if (response) {
        setIsSession(response.session);
        setOperatorData(response.operator)
        localStorage.setItem('operatorData', JSON.stringify(response.operator));
        return null;
      }
    } catch (err) {
      console.error("Error during login:", err);
    }

    setUsername("");
    setPassword("");
    setLoading(false);
  };

  return (
    <>
      {isSession ? (
        caracterOperator ? (
          caracterOperator.operator_type === "Admin" ? (
            <Navigate to="/dashboardAdmin"/>
          ) : (
            <Navigate to="/dashboard" />
          )
        ) : (
          <Loader/>
        )
        
      ) : (
        <main className="login-page-container">
          <div className="login-content">
            {/* Header com título e logo */}
            <header className="login-header">
              <div className="login-logo">
                <div className="logo-icon">🔐</div>
                <h1 className="login-title">Acesso ao Sistema</h1>
              </div>
              <p className="login-subtitle">Faça login para continuar</p>
            </header>

            {/* Formulário de login */}
            <div className="login-form-container">
              <form onSubmit={handleSubmit} className="login-form">
                {/* Campo de usuário */}
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    <FaRegUser className="label-icon" />
                    Usuário
                  </label>
                  <div className="input-container">
                    <input
                      type="text"
                      id="username"
                      placeholder="Digite seu usuário"
                      className="form-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />
                    <div className="input-icon">
                      <FaRegUser />
                    </div>
                  </div>
                </div>

                {/* Campo de senha */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    <FaEye className="label-icon" />
                    Senha
                  </label>
                  <div className="input-container">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      placeholder="Digite sua senha"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      onClick={togglePasswordVisibility}
                      className="password-toggle"
                      type="button"
                      aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {passwordVisible ? (
                        <FaEyeSlash size={18} />
                      ) : (
                        <FaEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão de login */}
                <div className="form-actions">
                  <button 
                    className="login-btn" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar</span>
                        <div className="btn-arrow">→</div>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Informações adicionais */}
              <div className="login-footer">
                <div className="login-info">
                  <p>💡 Dica: Use suas credenciais fornecidas pelo administrador</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </>
  );
};

export default Login;
