import React, { useEffect, useState } from "react";
import "./index.css";
import { FaPrint, FaDownload, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import { getDonationsPrinted } from "../../../services/printService";
import { fetchCheckPrintPackage, fetchReceiptConfig } from "../../../api/receiverDonationsApi";
import GenerateReceiptPDF from "../../GenerateReceiptPDF";

const ModalPrintedPackages = ({ setModalOpen }) => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrintedPDFs = async () => {
    setLoading(true);
    try {
      const data = await getDonationsPrinted();
      setPdfs(data || []);
    } catch (error) {
      toast.error("Erro ao carregar impressos");
    } finally {
      setLoading(false);
    }
  };

  const buildAndDownload = async (pkg, openInTab = false) => {
    try {
      const packageRes = await fetchCheckPrintPackage(pkg.id);
      const cards = packageRes?.data?.cards || [];
      if (!cards.length) {
        toast.warning("Pacote sem recibos para reimpressão.");
        return;
      }
      const cfgRes = await fetchReceiptConfig();
      const receiptConfig = cfgRes?.data || {};
      const blob = await GenerateReceiptPDF({
        cards,
        receiptConfig,
        setOk: () => {},
        download: !openInTab,
      });
      if (openInTab && blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR");
  };

  useEffect(() => {
    fetchPrintedPDFs();
  }, []);

  return (
    <div className="modal-area">
      <div className="modal-printed-packages-container">
        <div className="modal-printed-packages-header">
          <h3>
            <FaPrint />
            Pacotes Impressos
          </h3>
          <button
            className="modal-printed-packages-header-button-exit"
            onClick={() => setModalOpen(false)}
          >
            Fechar
          </button>
        </div>
        
        <div className="modal-printed-packages-body">
          {loading ? (
            <div className="modal-printed-packages-loading">
              <p>Carregando PDFs...</p>
            </div>
          ) : pdfs.length === 0 ? (
            <div className="modal-printed-packages-empty">
              <p>Nenhum pacote impresso encontrado.</p>
            </div>
          ) : (
            pdfs.map((pkg) => (
              <div key={pkg.id} className="modal-printed-packages-item">
                <div className="modal-printed-packages-item-info">
                  <div className="input-field">
                    <label>Pacote</label>
                    <p>#{pkg.id}</p>
                  </div>
                  <div className="input-field">
                    <label>Quantidade</label>
                    <p>{pkg.total_items || 0} recibo(s)</p>
                  </div>
                  <div className="input-field">
                    <label>Data de Geração</label>
                    <p>{formatDate(pkg.created_at)}</p>
                  </div>
                  <div className="input-field">
                    <label>Filtro</label>
                    <p>
                      {pkg.donation_type || "Todos"} |{" "}
                      {pkg.start_date ? formatDate(pkg.start_date) : "-"} até{" "}
                      {pkg.end_date ? formatDate(pkg.end_date) : "-"}
                    </p>
                  </div>
                </div>
                
                <div className="modal-printed-packages-item-actions">
                  <button
                    className="modal-printed-packages-action-btn view"
                    onClick={() => buildAndDownload(pkg, true)}
                    title="Visualizar PDF"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="modal-printed-packages-action-btn download"
                    onClick={() => buildAndDownload(pkg, false)}
                    title="Baixar PDF"
                  >
                    <FaDownload />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalPrintedPackages;
