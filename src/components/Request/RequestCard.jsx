import React, { useEffect, useState } from "react";
import { 
  IoPersonRemoveSharp, 
  IoAddCircleOutline, 
  IoRemoveCircleOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline
} from "react-icons/io5";
import {
  assignAllPackage,
  assignPackage,
  deleteOperatorInList,
  removeAllPackage,
  removePackage,
} from "../../services/distributePackageService";
import { toast } from "react-toastify";
import "./RequestCard.css";

const RequestCard = ({
  perOperator,
  operatorName,
  operatorID,
  selected,
  setSelected,
  createPackage,
  setCreatePackage,
  unassigned,
  allOperator,
  setAllOperator,
  selection,
  setSelection,
  operatorsInView,
  setOperatorsInView,
  activeForDistribution,
  setActiveForDistribution
}) => {
  const [countValue, setCountValue] = useState(0);
  const [countQuant, setCountQuant] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [isSelected, setIsSelected] = useState(false);
  const calculateValues = () => {
    
    if (perOperator && perOperator.length > 0) {
      const value = perOperator.reduce(
        (acc, item) => acc + item.donation_value,
        0
      );
      const quantity = perOperator.length;

      setCountValue(value);
      setCountQuant(quantity);
    } else {
      setCountValue(0);
      setCountQuant(0);
    }
  };

  const relatory = () => {
    let pkgi = [];
    createPackage.map((pkg) => {
      if (pkg.operator_code_id === operatorID) {
        pkgi.push(pkg);
      }
    });
  };

  useEffect(() => {
    calculateValues();
    relatory();
  }, [perOperator]);

  useEffect(() => {
    // Usa activeForDistribution se disponível (EditRequestCreated), senão usa selection
    if (activeForDistribution) {
      setIsSelected(activeForDistribution.includes(operatorID));
    } else {
      setIsSelected(selection.includes(operatorID));
    }
  }, [activeForDistribution, selection, operatorID]);

  const addSingle = () => {

    if (!selected) {
      toast.warning("Selecione uma doação!");
      return;
    }
    assignPackage(
      selected,
      operatorID,
      createPackage,
      setCreatePackage,
      unassigned
    );

    setSelected(null);
  };

  const addAll = () => {
    assignAllPackage(
      createPackage,
      unassigned,
      operatorID,
      setCreatePackage,
      maxValue,
      countValue
    );
  };

  const removeOperatorInList = (e) => {
    e.stopPropagation();
    deleteOperatorInList(allOperator, setAllOperator, operatorID, createPackage, setCreatePackage);
    
    // Se estamos no EditRequestCreated, remove de operatorsInView e activeForDistribution
    if (setOperatorsInView && operatorsInView) {
      setOperatorsInView(operatorsInView.filter(f => f !== operatorID));
    }
    if (setActiveForDistribution && activeForDistribution) {
      setActiveForDistribution(activeForDistribution.filter(f => f !== operatorID));
    }
    setSelection(selection.filter(f => f !== operatorID));
  }

  const removeAll = () => {
    removeAllPackage(createPackage, operatorID, setCreatePackage);
  };

  const removeSingle = () => {
    removePackage(createPackage, setCreatePackage, operatorID);
  };

  const handleCardClick = () => {
    // Se estamos no EditRequestCreated (tem activeForDistribution), alterna apenas nele
    // Isso permite marcar/desmarcar sem remover o card da tela
    if (setActiveForDistribution && activeForDistribution) {
      setActiveForDistribution(prev => 
        prev.includes(operatorID) 
          ? prev.filter(id => id !== operatorID) 
          : [...prev, operatorID]
      );
    } else {
      // Comportamento padrão para criação de requisição
      setSelection(prev => 
        prev.includes(operatorID) 
          ? prev.filter(id => id !== operatorID) 
          : [...prev, operatorID]
      );
    }
  };

  

  return (
    <div className={`request-card ${isSelected ? "selected" : ""}`}>
      {/* Card Header */}
      <div className="request-card-header">
        <div className="operator-info">
          <div className="operator-id">{operatorID}</div>
          <div className="operator-name">{operatorName}</div>
        </div>
        <button 
          className="remove-operator-btn"
          onClick={removeOperatorInList}
          title="Remover operador"
        >
          <IoPersonRemoveSharp />
        </button>
      </div>

      {/* Card Body */}
      <div 
        className={`request-card-body ${isSelected ? "active" : ""}`} 
        onClick={handleCardClick}
      >
        <div className="card-stats">
          <div className="stat-item">
            <span className="stat-label">Valor</span>
            <span className="stat-value value-amount">
              {countValue?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }) || "R$ 0,00"}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Qtd</span>
            <span className="stat-value quantity-amount">
              {countQuant || 0}
            </span>
          </div>
        </div>

        <div className="max-value-section">
          <label className="max-value-label">Max</label>
          <input 
            type="number" 
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)} 
            placeholder="0.00"
            className="max-value-input"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Card Actions */}
      <div className="request-card-actions">
        <div className="action-group remove-group">
          <button 
            className="action-btn remove-btn"
            onClick={removeAll}
            title="Remover todas"
          >
            <IoCloseCircleOutline />
            <span>All</span>
          </button>
          <button 
            className="action-btn remove-btn"
            onClick={removeSingle}
            title="Remover uma"
          >
            <IoRemoveCircleOutline />
            <span>-1</span>
          </button>
        </div>

        <div className="action-separator">
          <div className="separator-line"></div>
        </div>

        <div className="action-group add-group">
          <button 
            className="action-btn add-btn"
            onClick={addAll}
            title="Adicionar todas"
          >
            <IoAddCircleOutline />
            <span>All</span>
          </button>
          <button 
            className="action-btn add-btn"
            onClick={addSingle}
            title="Adicionar uma"
            disabled={!selected}
          >
            <IoAddCircleOutline />
            <span>+1</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
