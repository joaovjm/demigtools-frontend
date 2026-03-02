import React, { useEffect, useState } from "react";
import "./index.css";
import { FaPrint, FaDownload, FaEye } from "react-icons/fa";
import supabase from "../../../helper/superBaseClient";
import { toast } from "react-toastify";

const ModalPrintedPackages = ({ setModalOpen }) => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrintedPDFs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('receiptPdfToPrint')
        .list('Print Checked', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Erro ao buscar PDFs:', error);
        toast.error('Erro ao carregar PDFs impressos');
        return;
      }

      if (data) {
        // Filtrar apenas arquivos PDF
        const pdfFiles = data.filter(file => 
          file.name.toLowerCase().endsWith('.pdf')
        );
        setPdfs(pdfFiles);
      }
    } catch (error) {
      console.error('Erro ao buscar PDFs:', error);
      toast.error('Erro ao carregar PDFs impressos');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('receiptPdfToPrint')
        .download(`Print Checked/${fileName}`);

      if (error) {
        console.error('Erro ao baixar PDF:', error);
        toast.error('Erro ao baixar PDF');
        return;
      }

      // Criar URL do blob e fazer download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF');
    }
  };

  const viewPDF = async (fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('receiptPdfToPrint')
        .createSignedUrl(`Print Checked/${fileName}`, 60);

      if (error) {
        console.error('Erro ao gerar URL do PDF:', error);
        toast.error('Erro ao visualizar PDF');
        return;
      }

      // Abrir PDF em nova aba
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar PDF:', error);
      toast.error('Erro ao visualizar PDF');
    }
  };

  const formatFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
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
              <p>Nenhum PDF encontrado na pasta de impressos.</p>
            </div>
          ) : (
            pdfs.map((pdf, index) => (
              <div key={index} className="modal-printed-packages-item">
                <div className="modal-printed-packages-item-info">
                  <div className="input-field">
                    <label>Nome do Arquivo</label>
                    <p>{pdf.name}</p>
                  </div>
                  <div className="input-field">
                    <label>Tamanho</label>
                    <p>{formatFileSize(pdf.metadata?.size || 0)}</p>
                  </div>
                  <div className="input-field">
                    <label>Data de Criação</label>
                    <p>{formatDate(pdf.created_at)}</p>
                  </div>
                </div>
                
                <div className="modal-printed-packages-item-actions">
                  <button
                    className="modal-printed-packages-action-btn view"
                    onClick={() => viewPDF(pdf.name)}
                    title="Visualizar PDF"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="modal-printed-packages-action-btn download"
                    onClick={() => downloadPDF(pdf.name)}
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
