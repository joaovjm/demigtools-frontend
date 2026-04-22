import React, { useEffect, useState } from "react";
import styles from "./adminmanager.module.css";
import { getOperators } from "../../helper/getOperators";
import Meta from "../../components/AdminManager/Meta";
import Campain from "../../components/AdminManager/Campain";
import ReceiptConfig from "../../components/AdminManager/ReceiptConfig";
import LeadsManager from "../../components/AdminManager/LeadsManager";
import VoipSettings from "../../components/AdminManager/VoipSettings";
import { DataNow } from "../../components/DataTime";

const AdminManager = () => {
  const [active, setActive] = useState();
  const [operators, setOperators] = useState([]);
  const [inputs, setInputs] = useState({
    value: 0.00,
    percent: 0.00,
    total: 0.00,
    date: DataNow("noformated"),
  });
  const [read, setRead] = useState({});

  useEffect(() => {
    const fetchOperators = async () => {
      const operator = await getOperators({ active: true });
      setOperators(operator);

      const initialReadState = {};
      operator.forEach((op) => {
        initialReadState[op.operator_code_id] = { only: true };
      });
      setRead(initialReadState);
    };
    fetchOperators();
  }, []);

  const menuItems = [
    { id: "meta", label: "Meta", icon: "🎯" },
    { id: "campain", label: "Campanha", icon: "📢" },
    { id: "receipt", label: "Config. Recibo", icon: "🧾" },
    { id: "leads", label: "Ger. Leads", icon: "👥" },
    { id: "voip", label: "VoIP", icon: "📞" },
  ];

  return (
    <main className={styles.adminManager}>
      <div className={styles.adminManagerMenu}>
        <div className={styles.adminManagerMenuHeader}>
          <h3>⚙️ Painel Admin</h3>
        </div>
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.adminManagerMenuItem} ${
              active === item.id ? styles.active : ""
            }`}
            onClick={() => setActive(item.id)}
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            <span className={styles.menuLabel}>{item.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.adminManagerContent}>
        {active === "meta" ? (
          <Meta
            operators={operators}
            inputs={inputs}
            setInputs={setInputs}
            read={read}
            setRead={setRead}
          />
        ) : active === "campain" ? (
          <Campain />
        ) : active === "receipt" ? (
          <ReceiptConfig />
        ) : active === "leads" ? (
          <LeadsManager />
        ) : active === "voip" ? (
          <VoipSettings />
        ) : (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeIcon}>⚙️</div>
              <p className={styles.welcomeDescription}>
                Selecione uma opção no menu lateral para começar
              </p>
              <div className={styles.welcomeFeatures}>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcon}>🎯</span>
                  <h4>Metas</h4>
                  <p>Gerencie metas dos operadores</p>
                </div>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcon}>📢</span>
                  <h4>Campanhas</h4>
                  <p>Crie e gerencie campanhas</p>
                </div>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcon}>🧾</span>
                  <h4>Recibos</h4>
                  <p>Configure informações de recibos</p>
                </div>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcon}>👥</span>
                  <h4>Leads</h4>
                  <p>Gerencie leads e contatos</p>
                </div>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcon}>📞</span>
                  <h4>VoIP</h4>
                  <p>ARI / Asterisk para chamadas</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminManager;
