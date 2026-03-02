import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./navbar.css";
import Loader from "../Loader";
import { MdOutlineLogin } from "react-icons/md";
import { IoPersonCircleOutline } from "react-icons/io5";
import { HiMenu, HiX } from "react-icons/hi";
import { FaAngleDown, FaCode } from "react-icons/fa";

import { AdminMenu, Navitens, OperadorMenu, RelatórioMenu } from "../Navitens";
import supabase from "../../helper/superBaseClient";
import getOperatorMeta from "../../helper/getOperatorMeta";
import { getInternalUnreadCount } from "../../helper/getInternalUnreadCount";
import { navigateWithNewTab } from "../../utils/navigationUtils";

// Tipos de operadores com acesso completo aos menus
const FULL_ACCESS_TYPES = ["Admin", "Developer"];

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState(null);
  const [operatorMeta, setOperatorMeta] = useState([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [pendingDevTasksCount, setPendingDevTasksCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const [operatorData, setOperatorData] = useState();

  // Verifica se o operador tem acesso completo aos menus
  const hasFullAccess = FULL_ACCESS_TYPES.includes(operatorData?.operator_type);
  const isAdmin = operatorData?.operator_type === "Admin";
  const isDeveloper = operatorData?.operator_type === "Developer";

  const fetchOperatorData = async (email) => {
    const username = email.split("@")[0];

    const { data: allOperators, error } = await supabase.from("operator")
      .select(`
      operator_active,
      operator_name,
      operator_type,
      operator_uuid,
      operator_code_id
    `);

    if (error) {
      console.error("Erro ao buscar operadores:", error);
      return;
    }

    const userData = allOperators?.find((op) => {
      const formattedName = op.operator_name
        .normalize("NFD")
        .replace(/[\u0300-\u036f\s]/g, "")
        .toLowerCase();
      return formattedName === username;
    });
    if (userData) {
      localStorage.setItem("operatorData", JSON.stringify(userData));
      setOperatorData(userData);
    } else {
      console.error("Nenhum operador encontrado para o email:", email);
    }
  };

  useEffect(() => {
    const meta = async () => {
      if (operatorData && operatorData.operator_code_id) {
        const operatorMeta = await getOperatorMeta(
          operatorData.operator_code_id
        );
        setOperatorMeta(operatorMeta);
      }
    };
    meta();
  }, [operatorData]);

  // Buscar contagem de tarefas pendentes para Admin
  useEffect(() => {
    const fetchPendingTasks = async () => {
      if (isAdmin) {
        try {
          const { count, error } = await supabase
            .from("task_manager")
            .select("*", { count: "exact", head: true })
            .eq("status", "pendente");

          if (!error) {
            setPendingTasksCount(count || 0);
          }
        } catch (error) {
          console.error("Erro ao buscar tarefas pendentes:", error);
        }
      }
    };

    fetchPendingTasks();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPendingTasks, 30000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Buscar contagem de tarefas de dev pendentes para Developer
  useEffect(() => {
    const fetchPendingDevTasks = async () => {
      if (isDeveloper) {
        try {
          const { count, error } = await supabase
            .from("developer_task")
            .select("*", { count: "exact", head: true })
            .in("status", ["pendente", "em_andamento"]);

          if (!error) {
            setPendingDevTasksCount(count || 0);
          }
        } catch (error) {
          console.error("Erro ao buscar tarefas de dev pendentes:", error);
        }
      }
    };

    fetchPendingDevTasks();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPendingDevTasks, 30000);

    return () => clearInterval(interval);
  }, [isDeveloper]);

  // Buscar contagem de mensagens não lidas do chat interno (todos os usuários)
  useEffect(() => {
    const fetchChatUnread = async () => {
      if (!operatorData?.operator_code_id) return;
      try {
        const count = await getInternalUnreadCount(operatorData.operator_code_id);
        setChatUnreadCount(count ?? 0);
      } catch (e) {
        console.error("Erro ao buscar não lidas do chat:", e);
      }
    };
    fetchChatUnread();
    const interval = setInterval(fetchChatUnread, 15000);
    return () => clearInterval(interval);
  }, [operatorData?.operator_code_id]);

  useEffect(() => {
    const checkSession = async () => {
      const stored = localStorage.getItem("operatorData");
      if (stored) {
        setOperatorData(JSON.parse(stored));
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) console.error("Erro na sessão:", error);
      setIsAuthenticated(!!session);

      if (session && !stored) {
        await fetchOperatorData(session.user.email);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthenticated(!!session);

        if (event === "SIGNED_IN" && session) {
          const stored = localStorage.getItem("operatorData");
          if (stored) {
            setOperatorData(JSON.parse(stored));
          } else {
            await fetchOperatorData(session.user.email);
          }
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem("operatorData");
          setOperatorData(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [setOperatorData]);

  useEffect(() => {
    if (isAuthenticated && !operatorData) {
      const timer = setTimeout(async () => {
        const stored = localStorage.getItem("operatorData");
        if (stored) {
          setOperatorData(JSON.parse(stored));
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            await fetchOperatorData(session.user.email);
          }
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, operatorData, setOperatorData]);

  const onClickUserIcon = () => setIsOpen(!isOpen);
  const onClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };
  const handleMobileMenuClick = () => setMobileMenuOpen(!mobileMenuOpen);
  const handleMobileDropdownClick = (title) => {
    setActiveMobileDropdown(activeMobileDropdown === title ? null : title);
  };
  const onClickOutsideMobileMenu = (e) => {
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", onClickOutside);
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", onClickOutsideMobileMenu);
    }

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("mousedown", onClickOutsideMobileMenu);
    };
  }, [isOpen, mobileMenuOpen]);

  const signOut = async () => {
    if (window.confirm("Tem certeza que deseja sair?")) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          const isSessionError = 
            error.message?.includes("Auth session missing") ||
            error.message?.includes("session") ||
            error.status === 403;
          
          if (!isSessionError) {
            console.error("Erro ao fazer logout:", error);
          }
        }
      } catch (err) {
        console.error("Exceção ao fazer logout:", err);
      } finally {
        localStorage.removeItem("operatorData");
        setOperatorData(null);
        setIsAuthenticated(false);
        setShowDropdown(null);
        setMobileMenuOpen(false);
        navigate("/");
        setLoading(false);
      }
    }
  };

  const handleLogoClick = (path, event) => {
    if (location.pathname === path) {
      navigate(location.pathname);
    } else {
      navigateWithNewTab(event, path, navigate);
    }
  };

  const handleNavItemClick = (path, event) => {
    navigateWithNewTab(event, path, navigate);
  };

  // Componente para renderizar o botão de Tarefas Dev (apenas Developer)
  const DevTasksButton = ({ isMobile = false }) => {
    if (!isDeveloper) return null;

    if (isMobile) {
      return (
        <li className="mobile-nav-item">
          <Link 
            to="/tasktodeveloper" 
            className="mobile-dev-tasks-btn"
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                window.open('/tasktodeveloper', '_blank');
              }
              setMobileMenuOpen(false);
            }}
            title="Ctrl+Click para abrir em nova aba"
          >
            <FaCode />
            <span>Tarefas Dev</span>
            {pendingDevTasksCount > 0 && (
              <span className="dev-task-badge">{pendingDevTasksCount}</span>
            )}
          </Link>
        </li>
      );
    }

    return (
      <li className="nav-item">
        <Link 
          to="/tasktodeveloper" 
          className="dev-tasks-btn"
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              window.open('/tasktodeveloper', '_blank');
            }
          }}
          title="Ctrl+Click para abrir em nova aba"
        >
          <FaCode />
          <span>Tarefas Dev</span>
          {pendingDevTasksCount > 0 && (
            <span className="dev-task-badge">{pendingDevTasksCount}</span>
          )}
        </Link>
      </li>
    );
  };

  // Componente para renderizar o perfil do usuário
  const UserProfile = () => (
    <div
      ref={dropdownRef}
      className="user-profile desktop-only"
      onMouseEnter={() => setShowDropdown("userIcon")}
      onMouseLeave={() => setShowDropdown(null)}
    >
      <IoPersonCircleOutline
        onClick={onClickUserIcon}
        className="icon-user"
      />

      {isOpen && showDropdown === "userIcon" && (
        <ul className="dropdown-admin user-dropdown">
          {operatorData && (
            <li className="nav-item operator-info">
              <p>{operatorData?.operator_name}</p>
              <p className="operator-type">
                {operatorData?.operator_type}
              </p>
            </li>
          )}
          <li className="nav-item" onClick={signOut}>
            {loading ? <Loader /> : "Sair"}
          </li>
        </ul>
      )}
    </div>
  );

  // Componente para renderizar itens de menu dropdown
  const renderDropdownItems = (menuItems, showBadge = false) => (
    <ul className="dropdown-admin" onClick={() => setShowDropdown(null)}>
      {menuItems.map((item) => (
        <li
          key={item.id}
          className={item.cName}
          onClick={(e) => handleNavItemClick(item.path, e)}
          title="Ctrl+Click para abrir em nova aba"
        >
          {item.title}
          {showBadge && item.title === "Tarefas" && pendingTasksCount > 0 && (
            <span className="task-badge">{pendingTasksCount}</span>
          )}
        </li>
      ))}
    </ul>
  );

  // Componente para renderizar menu desktop com acesso completo
  const FullAccessDesktopMenu = () => (
    <ul className="nav-items">
      {/* Botão Tarefas Dev - apenas para Developer */}
      <DevTasksButton />
      
      {Navitens.map((item) => (
        <li
          key={item.id}
          className={item.cName}
          onMouseEnter={() => setShowDropdown(item.title)}
          onMouseLeave={() => setShowDropdown(null)}
        >
          <div className="nav-item-content">
            <p>{item.title}</p>
            <FaAngleDown className="dropdown-icon" />
          </div>

          {/* Dropdown Admin */}
          {item.title === "Admin" && showDropdown === "Admin" && 
            renderDropdownItems(AdminMenu, true)}

          {/* Dropdown Relatório */}
          {item.title === "Relatório" && showDropdown === "Relatório" && 
            renderDropdownItems(RelatórioMenu)}

          {/* Dropdown Operador */}
          {item.title === "Operador" && showDropdown === "Operador" && (
            <ul className="dropdown-admin" onClick={() => setShowDropdown(null)}>
              {OperadorMenu.map((menuItem) => (
                <li
                  key={menuItem.id}
                  className={menuItem.cName}
                  onClick={(e) => handleNavItemClick(menuItem.path, e)}
                  title="Ctrl+Click para abrir em nova aba"
                >
                  {menuItem.title}
                  {menuItem.title === "CHAT" && chatUnreadCount > 0 && (
                    <span className="task-badge">{chatUnreadCount > 99 ? "99+" : chatUnreadCount}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  // Componente para renderizar menu desktop com acesso limitado (operador comum)
  const LimitedAccessDesktopMenu = () => (
    <ul className="nav-items">
      <li
        key={Navitens[2].id}
        className={Navitens[2].cName}
        onMouseEnter={() => setShowDropdown(Navitens[2].title)}
        onMouseLeave={() => setShowDropdown(null)}
      >
        <div className="nav-item-content">
          <p>{Navitens[2].title}</p>
          <FaAngleDown className="dropdown-icon" />
        </div>

        {Navitens[2].title === "Operador" && showDropdown === "Operador" && (
          <ul className="dropdown-admin" onClick={() => setShowDropdown(null)}>
            {OperadorMenu.map((admin) => (
              <li key={admin.id} className={admin.cName}>
                <Link 
                  to={admin.path}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      window.open(admin.path, '_blank');
                    }
                  }}
                  title="Ctrl+Click para abrir em nova aba"
                >
                  {admin.title}
                  {admin.title === "CHAT" && chatUnreadCount > 0 && (
                    <span className="task-badge">{chatUnreadCount > 99 ? "99+" : chatUnreadCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    </ul>
  );

  // Componente para renderizar menu mobile com acesso completo
  const FullAccessMobileMenu = () => (
    <div
      ref={mobileMenuRef}
      className={`mobile-menu ${mobileMenuOpen ? "active" : ""}`}
    >
      <ul className="mobile-nav-items">
        {/* Botão Tarefas Dev Mobile - apenas para Developer */}
        <DevTasksButton isMobile />

        {Navitens.map((item) => (
          <li key={item.id} className="mobile-nav-item">
            <div
              className="mobile-nav-header"
              onClick={() => handleMobileDropdownClick(item.title)}
            >
              <p>{item.title}</p>
              <FaAngleDown
                className={`dropdown-icon ${
                  activeMobileDropdown === item.title ? "rotated" : ""
                }`}
              />
            </div>

            {/* Mobile Dropdown Admin */}
            {item.title === "Admin" && activeMobileDropdown === "Admin" && (
              <ul className="mobile-dropdown">
                {AdminMenu.map((admin) => (
                  <li key={admin.id} className="mobile-dropdown-item">
                    <Link
                      to={admin.path}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                          window.open(admin.path, '_blank');
                        }
                        setMobileMenuOpen(false);
                      }}
                      title="Ctrl+Click para abrir em nova aba"
                    >
                      {admin.title}
                      {admin.title === "Tarefas" && pendingTasksCount > 0 && (
                        <span className="task-badge">{pendingTasksCount}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Mobile Dropdown Relatório */}
            {item.title === "Relatório" && activeMobileDropdown === "Relatório" && (
              <ul className="mobile-dropdown">
                {RelatórioMenu.map((admin) => (
                  <li key={admin.id} className="mobile-dropdown-item">
                    <Link
                      to={admin.path}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                          window.open(admin.path, '_blank');
                        }
                        setMobileMenuOpen(false);
                      }}
                      title="Ctrl+Click para abrir em nova aba"
                    >
                      {admin.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Mobile Dropdown Operador */}
            {item.title === "Operador" && activeMobileDropdown === "Operador" && (
              <ul className="mobile-dropdown">
                {OperadorMenu.map((admin) => (
                  <li key={admin.id} className="mobile-dropdown-item">
                    <Link
                      to={admin.path}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                          window.open(admin.path, '_blank');
                        }
                        setMobileMenuOpen(false);
                      }}
                      title="Ctrl+Click para abrir em nova aba"
                    >
                      {admin.title}
                      {admin.title === "CHAT" && chatUnreadCount > 0 && (
                        <span className="task-badge">{chatUnreadCount > 99 ? "99+" : chatUnreadCount}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}

        <li className="mobile-nav-item sign-out" onClick={signOut}>
          {operatorData && (
            <div className="mobile-operator-info">
              <p>{operatorData?.operator_name}</p>
              <p className="operator-type">
                {operatorData?.operator_type}
              </p>
            </div>
          )}
          {loading ? <Loader /> : "Sair"}
        </li>
      </ul>
    </div>
  );

  // Componente para renderizar menu mobile com acesso limitado
  const LimitedAccessMobileMenu = () => (
    <div
      ref={mobileMenuRef}
      className={`mobile-menu ${mobileMenuOpen ? "active" : ""}`}
    >
      <ul className="mobile-nav-items">
        <li key={Navitens[2].id} className="mobile-nav-item">
          <div
            className="mobile-nav-header"
            onClick={() => handleMobileDropdownClick(Navitens[2].title)}
          >
            <p>{Navitens[2].title}</p>
            <FaAngleDown
              className={`dropdown-icon ${
                activeMobileDropdown === Navitens[2].title ? "rotated" : ""
              }`}
            />
          </div>

          {Navitens[2].title === "Operador" && activeMobileDropdown === "Operador" && (
            <ul className="mobile-dropdown">
              {OperadorMenu.map((admin) => (
                <li key={admin.id} className="mobile-dropdown-item">
                  <Link
                    to={admin.path}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        window.open(admin.path, '_blank');
                      }
                      setMobileMenuOpen(false);
                    }}
                    title="Ctrl+Click para abrir em nova aba"
                  >
                    {admin.title}
                    {admin.title === "CHAT" && chatUnreadCount > 0 && (
                      <span className="task-badge">{chatUnreadCount > 99 ? "99+" : chatUnreadCount}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>

        <li className="mobile-nav-item sign-out" onClick={signOut}>
          {operatorData && (
            <div className="mobile-operator-info">
              <p>{operatorData?.operator_name}</p>
              <p className="operator-type">
                {operatorData?.operator_type}
              </p>
            </div>
          )}
          {loading ? <Loader /> : "Sair"}
        </li>
      </ul>
    </div>
  );

  return (
    <>
      <header className="header-nav">
        <nav className="nav">
          <div className="nav-logo">
            {isAuthenticated ? (
              operatorData ? (
                <div
                  onClick={(e) =>
                    handleLogoClick(
                      hasFullAccess ? "/dashboardAdmin" : "/dashboard",
                      e
                    )
                  }
                  className="logo"
                  title="Ctrl+Click para abrir em nova aba"
                >
                  <span className="span-logo-1">DEMI</span>
                  <span className="span-logo-2">GT</span>
                  <span className="span-logo-3">ools</span>
                </div>
              ) : (
                <Loader />
              )
            ) : (
              <Link to="/" className="logo">
                <span className="span-logo-1">DEMI</span>
                <span className="span-logo-2">GT</span>
                <span className="span-logo-3">ools</span>
              </Link>
            )}
          </div>

          {/* META - apenas para operadores sem acesso completo */}
          {operatorData && !hasFullAccess && (
            <div className="meta">
              <label>
                META: R$ {operatorMeta?.[0]?.meta || "?"}
              </label>
            </div>
          )}

          {/* Menu Desktop */}
          {isAuthenticated && hasFullAccess ? (
            <div className="menu-and-logo">
              <FullAccessDesktopMenu />
              <UserProfile />
              <div className="mobile-menu-toggle">
                <button onClick={handleMobileMenuClick}>
                  {mobileMenuOpen ? <HiX /> : <HiMenu />}
                </button>
              </div>
            </div>
          ) : isAuthenticated && operatorData ? (
            <div className="menu-and-logo">
              <LimitedAccessDesktopMenu />
              <UserProfile />
              <div className="mobile-menu-toggle">
                <button onClick={handleMobileMenuClick}>
                  {mobileMenuOpen ? <HiX /> : <HiMenu />}
                </button>
              </div>
            </div>
          ) : isAuthenticated ? (
            <div className="menu-and-logo">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Loader />
                  <span>Carregando menu...</span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: "10px",
                    padding: "5px 10px",
                    background: "#f0f0f0",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Recarregar página
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="link_login">
              <MdOutlineLogin />
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu */}
        {isAuthenticated && hasFullAccess ? (
          <FullAccessMobileMenu />
        ) : (
          isAuthenticated && operatorData && <LimitedAccessMobileMenu />
        )}
      </header>
    </>
  );
};

export default Navbar;
