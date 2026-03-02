import React, { useState } from "react";
import "./index.css";
import xlsxFileUpload from "../../components/xlsxFileUpload";
import { ToastContainer } from "react-toastify";
import insertNewLeads from "../../components/insertNewLeads";
import { FaFileUpload, FaUsers, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import Loader from "../../components/Loader";

const LoadLeads = () => {
  const [fileName, setFileName] = useState("Nenhum arquivo selecionado");
  const [excelData, setExcelData] = useState([]);
  const [typeLead, setTypeLead] = useState("");
  const [headers, setHeaders] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [insertedCount, setInsertedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setIsLoading(true);
    await xlsxFileUpload(file, setExcelData, setHeaders);
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("Nenhum arquivo selecionado");
    }
    setIsLoading(false);
  };

  const handleInsertNewLead = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await insertNewLeads(
      excelData,
      setInsertedCount,
      setTotalCount,
      typeLead
    );
    if (response) {
      setFileName("Nenhum arquivo selecionado");
      setExcelData([]);
      setSuccessMessage(response);
    }
    setIsLoading(false);
  };

  const handleTypeLead = () => {

  }

  return (
    <div className="load-leads-container">
      <div className="load-leads-content">
        <div className="load-leads-header">
          <h3 className="load-leads-title">
            <FaUsers className="title-icon" />
            Carregar Leads
          </h3>
          <p className="load-leads-subtitle">
            Importe leads de arquivos Excel para o sistema
          </p>
        </div>

        <div className="load-leads-form">
          {/* Seção de Upload */}
          <div className="load-leads-section">
            <h4 className="section-title">
              <FaFileUpload className="section-icon" />
              Upload de Arquivo
            </h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Arquivo Excel *</label>
                <div className="file-upload-wrapper">
                  <label htmlFor="file-upload" className="file-upload-label">
                    <FaFileUpload className="upload-icon" />
                    <span>Escolher Arquivo</span>
                  </label>
                  <input
                    type="file"
                    id="file-upload"
                    accept=".xlsx, .xls"
                    className="input-file"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="file-name-display">
                  {fileName}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Tipo de Lead *</label>
                <select 
                  onChange={(e) => setTypeLead(e.target.value)} 
                  value={typeLead}
                  className="load-leads-select"
                  disabled={isLoading}
                >
                  <option value="">Selecione o tipo...</option>
                  <option value="Lead Principal">Lead Principal</option>
                  <option value="Lead Casa">Lead Casa</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="load-leads-btn primary"
                onClick={handleInsertNewLead}
                disabled={excelData.length === 0 || !typeLead || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="btn-icon" />
                    <span>Importar Leads</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Seção de Status */}
          <div className="load-leads-section">
            <h4 className="section-title">
              <FaInfoCircle className="section-icon" />
              Status da Importação
            </h4>
            
            <div className="status-container">
              {!successMessage && excelData.length === 0 && !isLoading && (
                <div className="status-message info">
                  <div className="status-icon">
                    <FaInfoCircle />
                  </div>
                  <div className="status-content">
                    <h5>Pronto para Importar</h5>
                    <p>Selecione um arquivo Excel e o tipo de lead para começar a importação</p>
                  </div>
                </div>
              )}

              {excelData.length > 0 && !successMessage && !isLoading && (
                <div className="status-message warning">
                  <div className="status-icon">
                    <FaExclamationTriangle />
                  </div>
                  <div className="status-content">
                    <h5>Arquivo Carregado</h5>
                    <p>
                      <strong>{excelData.length}</strong> registros encontrados no arquivo. 
                      Selecione o tipo de lead e clique em "Importar Leads"
                    </p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="status-message success">
                  <div className="status-icon">
                    <FaCheckCircle />
                  </div>
                  <div className="status-content">
                    <h5>Importação Concluída!</h5>
                    <p>
                      <strong>{insertedCount}</strong> leads foram inseridos com sucesso
                    </p>
                    <p>
                      <strong>{totalCount - insertedCount}</strong> leads já existiam e não foram inseridos
                    </p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="status-message loading">
                  <div className="status-icon">
                    <Loader />
                  </div>
                  <div className="status-content">
                    <h5>Processando...</h5>
                    <p>Importando leads, aguarde um momento</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        closeOnClick="true"
        pauseOnFocusLoss="false"
        pauseOnHover="false"
      />
    </div>
  );
};

export default LoadLeads;
