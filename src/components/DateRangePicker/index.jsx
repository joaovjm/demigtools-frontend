import React, { useState, useEffect, useRef } from "react";
import styles from "./daterangepicker.module.css";

const DateRangePicker = ({ isOpen, onClose, onDateSelect, startDate, endDate, position }) => {
  const [localStartDate, setLocalStartDate] = useState(startDate || "");
  const [localEndDate, setLocalEndDate] = useState(endDate || "");
  const pickerRef = useRef(null);

  useEffect(() => {
    setLocalStartDate(startDate || "");
    setLocalEndDate(endDate || "");
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    onDateSelect(localStartDate, localEndDate);
    onClose();
  };

  const handleClear = () => {
    setLocalStartDate("");
    setLocalEndDate("");
    onDateSelect("", "");
    onClose();
  };

  if (!isOpen) return null;

  const style = position
    ? {
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }
    : {};

  return (
    <div ref={pickerRef} className={styles.dateRangePicker} style={style}>
      <div className={styles.dateRangePickerHeader}>
        <h4>Selecionar Período</h4>
      </div>
      <div className={styles.dateRangePickerBody}>
        <div className={styles.dateInputGroup}>
          <label>Data Início</label>
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => setLocalStartDate(e.target.value)}
            max={localEndDate || undefined}
          />
        </div>
        <div className={styles.dateInputGroup}>
          <label>Data Fim</label>
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => setLocalEndDate(e.target.value)}
            min={localStartDate || undefined}
          />
        </div>
      </div>
      <div className={styles.dateRangePickerFooter}>
        <button className={styles.clearButton} onClick={handleClear}>
          Limpar
        </button>
        <button className={styles.applyButton} onClick={handleApply}>
          Aplicar
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;

