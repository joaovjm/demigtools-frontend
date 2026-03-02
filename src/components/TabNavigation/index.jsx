import React from "react";
import styles from "./tabNavigation.module.css";

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabList}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${
              activeTab === tab.id ? styles.active : ""
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            {tab.label}
            {tab.badge && <span className={styles.badge}>{tab.badge}</span>}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default TabNavigation;

