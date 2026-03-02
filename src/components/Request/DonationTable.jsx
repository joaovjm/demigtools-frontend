import React, { useEffect, useState } from "react";
import { FaAngleDown, FaAngleUp, FaEye, FaEyeSlash, FaFilter, FaDownload, FaRandom } from "react-icons/fa";
import { distribute } from "../../services/distributePackageService";
import "./DonationTable.css";

const DonationTable = ({ unassigned, setSelected, selected, createPackage, setCreatePackage, operatorID, selection, buttonTest, setButtonTest }) => {
  const [visible, setVisible] = useState(true);
  const [packageCount, setPackageCount] = useState(0);
  const [nowPage, setNowPage] = useState(1);
  const [filterText, setFilterText] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const itemsPerPage = 50;
  const endPage = nowPage * itemsPerPage;
  const startPage = endPage - itemsPerPage;

  // Aplicar filtros
  const filteredUnassigned = unassigned.filter((item) => {
    const matchesText = !filterText || 
      item.operator_name?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.donor_tel_1?.includes(filterText) ||
      item.receipt_donation_id?.toString().includes(filterText);
    
    const matchesValue = !filterValue || 
      item.donation_value >= parseFloat(filterValue);
    
    return matchesText && matchesValue;
  });

  const itemsPaginated = filteredUnassigned.slice(startPage, endPage);
  const totalPage = Math.ceil(filteredUnassigned.length / itemsPerPage);

  useEffect(() => {
    const countPackage = () => {
      const count = filteredUnassigned?.reduce((acc, item) => {
        return acc + item.donation_value;
      }, 0);

      setPackageCount(count);
    };
    countPackage();
  }, [filteredUnassigned]);

  const handleUnassignedClick = (id) => {
    setSelected(id);
  };
  
  const handleDistribute = async () => {
    const response = await distribute(filteredUnassigned, createPackage, selection)
    setCreatePackage(response);
  }

  const clearFilters = () => {
    setFilterText("");
    setFilterValue("");
  };

  return (
    <div className="donation-table-container">
      <div className="donation-table-content">
        {/* Header Section */}
        <div className="donation-table-header">
          <h3 className="donation-table-title">💰 Tabela de Doações</h3>
          <div className="donation-table-stats">
            <div className="stats-item">
              <span className="stats-label">Total de Doações:</span>
              <span className="stats-value">{filteredUnassigned.length}</span>
            </div>
            <div className="stats-item">
              <span className="stats-label">Valor Total:</span>
              <span className="stats-value">
                {packageCount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="donation-table-filters">
          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">
                <FaFilter /> Filtro Geral
              </label>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Buscar por operador, telefone ou recibo..."
                className="donation-table-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">
                <FaFilter /> Valor Mínimo (R$)
              </label>
              <input
                type="number"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="0.00"
                className="donation-table-input"
              />
            </div>
            <div className="filter-actions">
              <button
                onClick={clearFilters}
                className="donation-table-btn secondary small"
                disabled={!filterText && !filterValue}
              >
                Limpar Filtros
              </button>
              <button
                onClick={() => setVisible(!visible)}
                className="donation-table-btn secondary small"
              >
                {visible ? <FaEye /> : <FaEyeSlash />}
                {visible ? " Ocultar" : " Mostrar"}
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        {visible && (
          <div className="donation-table-wrapper">
            <div className="donation-table-scroll">
              <table className="donation-table">
                <thead>
                  <tr className="donation-table-head-row">
                    <th className="donation-table-head">Valor</th>
                    <th className="donation-table-head">Recibo</th>
                    <th className="donation-table-head">Operador</th>
                    <th className="donation-table-head">Telefone</th>
                    <th className="donation-table-head">Última OP</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsPaginated?.map((cp) => (
                    <tr
                      key={cp.receipt_donation_id}
                      onClick={() => handleUnassignedClick(cp.receipt_donation_id)}
                      className={`donation-table-row ${
                        selected === cp.receipt_donation_id ? "selected" : ""
                      }`}
                    >
                      <td className="donation-table-cell">
                        <span className="value-amount">
                          {cp.donation_value.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </td>
                      <td className="donation-table-cell">
                        <span className="receipt-number">
                          {cp.receipt_donation_id}
                        </span>
                      </td>
                      <td className="donation-table-cell">
                        <span className="operator-name">
                          {cp.operator_name || "—"}
                        </span>
                      </td>
                      <td className="donation-table-cell">
                        <span className="phone-number">
                          {cp.donor_tel_1 || "—"}
                        </span>
                      </td>
                      <td className="donation-table-cell">
                        <span className="last-operation">
                          {cp.last_operation || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="donation-table-actions">
          <div className="actions-left">
            <button
              onClick={handleDistribute}
              className="donation-table-btn primary"
              disabled={filteredUnassigned.length === 0}
            >
              <FaRandom /> Distribuir Aleatoriamente
            </button>
          </div>
          
          <div className="actions-center">
            <div className="pagination-controls">
              <button
                onClick={() => setNowPage((prev) => Math.max(prev - 1, 1))}
                disabled={nowPage === 1}
                className="pagination-btn"
              >
                <FaAngleDown />
              </button>
              <span className="pagination-info">
                Página {nowPage} de {totalPage}
              </span>
              <button
                onClick={() => setNowPage((prev) => Math.min(prev + 1, totalPage))}
                disabled={nowPage === totalPage}
                className="pagination-btn"
              >
                <FaAngleUp />
              </button>
            </div>
          </div>

          <div className="actions-right">
            <div className="export-section">
              <label className="export-label">
                <input
                  type="checkbox"
                  checked={buttonTest}
                  onChange={() => setButtonTest(!buttonTest)}
                  className="export-checkbox"
                />
                <FaDownload /> Exportar para Excel
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationTable;
