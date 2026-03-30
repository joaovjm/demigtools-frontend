import React, { useEffect, useState } from "react";
import styles from "./modalreceiptsend.module.css";
import { FaDollarSign, FaTimes, FaEnvelope, FaPaperPlane, FaCheckCircle, FaInfoCircle, FaCheck, FaFilePdf } from "react-icons/fa";
import {
  fetchReceiptConfig,
  patchDepositReceiptSent,
} from "../../../api/receiverDonationsApi.js";
import GenerateDepositPDF from "../../GenerateDepositPDF";
import { toast } from "react-toastify";

const ModalReceiptSend = ({ setSendModalOpen, deposit, setDeposit }) => {
  const [config, setConfig] = useState({});
  // Estados para envio de email
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [emailSubject, setEmailSubject] = useState("Comprovante de Depósito");
  const [emailMessage, setEmailMessage] = useState(
    "Oi {{nome_doador}}, \n\n {{saudacao}} \n\n GOSTARIAMOS DE AGRADECER PROFUNDAMENTE A SUA GRANDE AJUDA. \n\n Segue em anexo o comprovante da sua doação. Agradecemos pela sua colaboração! MUITO OBRIGADO! \n\n Atenciosamente, Centro Geriátrico Manancial"
  );
  const [sending, setSending] = useState(false);
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [receiptToMark, setReceiptToMark] = useState(null);

  const loadReceiptConfig = async () => {
    try {
      const res = await fetchReceiptConfig();
      const row = res?.data;
      if (row) setConfig(row);
    } catch (e) {
      console.error(e?.message || e);
    }
  };

  /** Metadados continuam vindo do Postgres (pai); PDF gerado localmente sob demanda. */
  const displayDeposit = deposit ?? [];

  // Função para gerar saudação baseada na hora
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Função para pegar apenas os dois primeiros nomes
  const getPrimeirosDoisNomes = (nomeCompleto) => {
    if (!nomeCompleto) return "";
    const nomes = nomeCompleto.trim().split(/\s+/); // Divide por espaços
    if (nomes.length >= 1) {
      return nomes[0]; // Retorna só o primeiro nome
    }
  };

  // Função para selecionar/desselecionar destinatário
  const toggleRecipient = (receiptId) => {
    setSelectedRecipients((prev) =>
      prev.includes(receiptId)
        ? prev.filter((id) => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  // Função para selecionar todos
  const selectAll = () => {
    const validDeposits = displayDeposit?.filter(
      (item) => item.donor?.donor_email?.donor_email
    );
    setSelectedRecipients(
      validDeposits?.map((item) => item.receipt_donation_id) || []
    );
  };

  // Função para desselecionar todos
  const deselectAll = () => {
    setSelectedRecipients([]);
  };

  // Função para inserir tag no cursor
  const insertTag = (tag) => {
    const textarea = document.getElementById("emailMessageTextarea");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = emailMessage;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    setEmailMessage(before + tag + after);
    
    // Restaura o foco e posição do cursor
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + tag.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Função para gerar PDF como base64 (sempre local)
  const generatePDFBase64 = async (item) => {
    try {
      const mappedData = {
        receipt_donation_id: item.receipt_donation_id,
        donation_value: item.donation_value,
        donation_campain: item.donation_campain,
        donation_day_received: item.donation_day_received || new Date().toISOString(),
        donor_name: item.donor?.donor_name || "",
        cpf: item.donor?.cpf || "",
      };

      const blob = await GenerateDepositPDF({
        data: mappedData,
        config,
        cpf_visible: false,
        download: false,
      });
      
      // Converter blob para base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      return null;
    }
  };

  // Função para marcar recibo como enviado manualmente (via modal de confirmação)
  const handleMarkAsSent = async () => {
    if (!receiptToMark) return;
    try {
      await patchDepositReceiptSent(receiptToMark.receipt_donation_id);

      // Remover o item da lista
      setDeposit(prevDeposit => 
        prevDeposit.filter(d => d.receipt_donation_id !== receiptToMark.receipt_donation_id)
      );

      toast.success(`Recibo marcado como enviado para ${receiptToMark.donor?.donor_name}`);
      setConfirmModalOpen(false);
      setReceiptToMark(null);
    } catch (error) {
      console.error('Erro ao marcar como enviado:', error);
      toast.error('Erro ao processar a solicitação');
    }
  };

  const openConfirmMarkAsSent = (item) => {
    setReceiptToMark(item);
    setConfirmModalOpen(true);
  };

  const handleGenerateAndDownloadPdf = async (item) => {
    try {
      await GenerateDepositPDF({
        data: {
          receipt_donation_id: item.receipt_donation_id,
          donation_value: item.donation_value,
          donation_campain: item.donation_campain,
          donation_day_received: item.donation_day_received,
          donor_name: item.donor?.donor_name || "",
          cpf: item.donor?.cpf || "",
        },
        config,
        cpf_visible: false,
      });
      toast.success("PDF gerado e baixado com sucesso");
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Erro ao gerar PDF");
    }
  };

  const handleDownloadSelectedPdfs = async () => {
    if (selectedRecipients.length === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }
    let okCount = 0;
    for (const receiptId of selectedRecipients) {
      const item = displayDeposit.find((d) => d.receipt_donation_id === receiptId);
      if (!item) continue;
      try {
        await GenerateDepositPDF({
          data: {
            receipt_donation_id: item.receipt_donation_id,
            donation_value: item.donation_value,
            donation_campain: item.donation_campain,
            donation_day_received: item.donation_day_received,
            donor_name: item.donor?.donor_name || "",
            cpf: item.donor?.cpf || "",
          },
          config,
          cpf_visible: false,
        });
        okCount += 1;
      } catch (_error) {
        // erro individual já notificado no helper
      }
    }
    if (okCount > 0) {
      toast.success(`${okCount} PDF(s) gerado(s) e baixado(s)`);
    }
  };

  // Função para enviar emails
  const handleSendEmails = async () => {
    if (selectedRecipients.length === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Preencha o assunto e a mensagem");
      return;
    }

    setSending(true);
    setSendingProgress({ current: 0, total: selectedRecipients.length });
    let successCount = 0;
    let errorCount = 0;
    const sentReceiptIds = []; // Array para coletar IDs enviados com sucesso

    try {
      for (let i = 0; i < selectedRecipients.length; i++) {
        const receiptId = selectedRecipients[i];
        setSendingProgress({ current: i + 1, total: selectedRecipients.length });
        
        const item = displayDeposit.find((d) => d.receipt_donation_id === receiptId);
        
        if (!item || !item.donor?.donor_email?.donor_email) {
          errorCount++;
          continue;
        }

        const donorName = item.donor.donor_name;
        const donorEmail = item.donor.donor_email.donor_email;
        const primeirosDoisNomes = getPrimeirosDoisNomes(donorName);
        
        // Substituir tags dinâmicas
        let personalizedMessage = emailMessage
          .replace(/\{\{nome_doador\}\}/gi, primeirosDoisNomes)
          .replace(/\{\{saudacao\}\}/gi, getSaudacao());

        // Gerar PDF do comprovante
        const pdfBase64 = await generatePDFBase64(item);
        
        if (!pdfBase64) {
          console.error(`Erro ao gerar PDF para ${donorName}`);
          errorCount++;
          continue;
        }

        const fileName = `Comprovante_${item.receipt_donation_id}_${donorName.replace(/[\/\\:*?"<>|]/g, "")}.pdf`;
        
        try {
          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emailTo: donorEmail,
              subject: emailSubject,
              text: personalizedMessage,
              pdf: {
                filename: fileName,
                content: pdfBase64,
                contentType: 'application/pdf'
              }
            }),
          });

          if (response.ok) {
            try {
              await patchDepositReceiptSent(item.receipt_donation_id);
              successCount++;
              sentReceiptIds.push(item.receipt_donation_id);
            } catch (updateErr) {
              console.error(`Erro ao atualizar banco para ${donorEmail}:`, updateErr);
              errorCount++;
            }
          } else {
            errorCount++;
            console.error(`Erro ao enviar para ${donorEmail}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Erro ao enviar para ${donorEmail}:`, error.message);
        }

        // Pequeno delay entre envios para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Remover todos os itens enviados com sucesso de uma vez
      if (sentReceiptIds.length > 0) {
        setDeposit((prevDeposit) =>
          prevDeposit.filter((d) => !sentReceiptIds.includes(d.receipt_donation_id))
        );
      }

      // Feedback ao usuário
      if (successCount > 0) {
        toast.success(`${successCount} email(s) enviado(s) com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} email(s) falharam no envio`);
      }

      // Limpar seleção após envio bem-sucedido
      if (successCount > 0) {
        setSelectedRecipients([]);
      }
    } catch (error) {
      console.error("Erro ao enviar emails:", error);
      toast.error("Erro ao enviar emails");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadReceiptConfig();
  }, []);
  
  return (
    <div className="modal-area">
      <div className={styles.modalReceiptSendContainer}>
        <div className={styles.modalReceiptSendHeader}>
          <h3>
            <FaDollarSign />
            Comprovantes de Depósitos
          </h3>
          <button
            className={styles.modalReceiptSendHeaderButtonExit}
            onClick={() => setSendModalOpen(false)}
          >
            <FaTimes />
            Fechar
          </button>
        </div>
        
        <div className={styles.modalReceiptSendBody}>
          {displayDeposit?.length === 0 ? (
            <div className={styles.modalReceiptSendEmpty}>
              <p>Nenhum comprovante de depósito encontrado.</p>
            </div>
          ) : (
            <>
              {/* Seção de Email */}
              <div className={styles.emailSection}>
                <div className={styles.emailSectionHeader}>
                  <h4>
                    <FaEnvelope />
                    Enviar Comprovantes por Email
                  </h4>
                  <button
                    className={styles.toggleEmailBtn}
                    onClick={() => setShowEmailSection(!showEmailSection)}
                  >
                    {showEmailSection ? "Ocultar" : "Mostrar"} Configurações
                  </button>
                </div>

                {/* Aviso se não houver emails */}
                {displayDeposit?.filter((item) => item.donor?.donor_email?.donor_email)
                  .length === 0 && (
                  <div className={styles.warningMessage}>
                    <FaInfoCircle />
                    <p>Nenhum doador possui email cadastrado. Cadastre emails para habilitar o envio.</p>
                  </div>
                )}

                {showEmailSection && (
                  <div className={styles.emailConfig}>
                    <div className={styles.emailFormGroup}>
                      <label>Assunto do Email</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Digite o assunto do email"
                        className={styles.emailInput}
                      />
                    </div>

                    <div className={styles.emailFormGroup}>
                      <div className={styles.labelWithInfo}>
                        <label>Mensagem do Email</label>
                        <span className={styles.infoText}>
                          <FaInfoCircle /> Use as tags abaixo para personalizar
                        </span>
                      </div>
                      <div className={styles.tagsContainer}>
                        <button
                          type="button"
                          onClick={() => insertTag("{{nome_doador}}")}
                          className={styles.tagBtn}
                        >
                          + Nome do Doador
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTag("{{saudacao}}")}
                          className={styles.tagBtn}
                        >
                          + Saudação (Bom dia/tarde/noite)
                        </button>
                      </div>
                      <textarea
                        id="emailMessageTextarea"
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="Digite a mensagem do email"
                        className={styles.emailTextarea}
                        rows="8"
                      />
                    </div>

                    <div className={styles.recipientControls}>
                      <button
                        type="button"
                        onClick={selectAll}
                        className={styles.selectAllBtn}
                      >
                        <FaCheckCircle /> Selecionar Todos
                      </button>
                      <button
                        type="button"
                        onClick={deselectAll}
                        className={styles.deselectAllBtn}
                      >
                        Limpar Seleção
                      </button>
                      <span className={styles.selectedCount}>
                        {selectedRecipients.length} selecionado(s)
                      </span>
                    </div>

                    {/* Preview da mensagem */}
                    {showPreview && selectedRecipients.length > 0 && (
                      <div className={styles.previewSection}>
                        <div className={styles.previewHeader}>
                          <h5>Preview da Mensagem</h5>
                          <button
                            type="button"
                            onClick={() => setShowPreview(false)}
                            className={styles.closePreviewBtn}
                          >
                            <FaTimes />
                          </button>
                        </div>
                        <div className={styles.previewContent}>
                          {(() => {
                            const firstRecipient = displayDeposit.find(
                              (d) => d.receipt_donation_id === selectedRecipients[0]
                            );
                            const previewNome = getPrimeirosDoisNomes(firstRecipient?.donor?.donor_name || "[Nome]");
                            const previewMessage = emailMessage
                              .replace(/\{\{nome_doador\}\}/gi, previewNome)
                              .replace(/\{\{saudacao\}\}/gi, getSaudacao());
                            return (
                              <div className={styles.previewText}>
                                <p><strong>Para:</strong> {firstRecipient?.donor?.donor_email?.donor_email || "[Email]"}</p>
                                <p><strong>Assunto:</strong> {emailSubject}</p>
                                <hr />
                                <pre>{previewMessage}</pre>
                                <hr />
                                <p className={styles.attachmentInfo}>📎 Anexo: Comprovante de Depósito (PDF)</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className={styles.emailActions}>
                      <button
                        type="button"
                        onClick={handleDownloadSelectedPdfs}
                        disabled={sending || selectedRecipients.length === 0}
                        className={styles.previewBtn}
                      >
                        <FaFilePdf /> Gerar/Baixar PDFs Selecionados
                      </button>
                      {!showPreview && selectedRecipients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className={styles.previewBtn}
                        >
                          <FaInfoCircle /> Ver Preview
                        </button>
                      )}
                      
                      <button
                        onClick={handleSendEmails}
                        disabled={sending || selectedRecipients.length === 0}
                        className={styles.sendEmailBtn}
                      >
                        <FaPaperPlane />
                        {sending 
                          ? `Enviando ${sendingProgress.current} de ${sendingProgress.total}...` 
                          : `Enviar Email para ${selectedRecipients.length} destinatário(s)`
                        }
                      </button>
                    </div>

                    {/* Barra de progresso */}
                    {sending && (
                      <div className={styles.progressContainer}>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill}
                            style={{ width: `${(sendingProgress.current / sendingProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className={styles.progressText}>
                          Enviando email {sendingProgress.current} de {sendingProgress.total}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de Comprovantes */}
              <div className={styles.receiptsListHeader}>
                <h4>Lista de Comprovantes</h4>
              </div>

              {displayDeposit?.map((item) => {
                const hasEmail = item.donor?.donor_email?.donor_email;
                const isSelected = selectedRecipients.includes(item.receipt_donation_id);
                
                return (
                  <div 
                    key={item.receipt_donation_id} 
                    className={`${styles.modalReceiptSendItem} ${isSelected ? styles.selected : ""}`}
                  >
                    <div className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecipient(item.receipt_donation_id)}
                        disabled={!hasEmail}
                        className={styles.recipientCheckbox}
                        title={hasEmail ? "Selecionar para envio" : "Email não cadastrado"}
                      />
                    </div>

                    <div className={styles.modalReceiptSendItemInfo}>
                      <div className={styles.inputField}>
                        <label>Recibo</label>
                        <p title={item.receipt_donation_id}>{item.receipt_donation_id}</p>
                        <span className={styles.pdfHintWarn}>
                          PDF gerado localmente no envio/geração manual
                        </span>
                      </div>
                      <div className={styles.inputField}>
                        <label>Nome</label>
                        <p title={item.donor?.donor_name}>{item.donor?.donor_name}</p>
                      </div>
                      <div className={styles.inputField}>
                        <label>Email</label>
                        <p 
                          className={hasEmail ? styles.hasEmail : styles.noEmail}
                          title={hasEmail ? item.donor.donor_email.donor_email : "Não cadastrado"}
                        >
                          {hasEmail ? item.donor.donor_email.donor_email : "Não cadastrado"}
                        </p>
                      </div>
                      <div className={styles.inputField}>
                        <label>WhatsApp</label>
                        <p title={item.donor?.donor_tel_1}>{item.donor?.donor_tel_1 || "-"}</p>
                      </div>
                    </div>
                    
                    <div className={styles.modalReceiptSendItemActions}>
                      {/* Botão para marcar como enviado manualmente (apenas se não tem email) */}
                      {!hasEmail && (
                        <button
                          onClick={() => openConfirmMarkAsSent(item)}
                          className={`${styles.modalReceiptSendActionBtn} ${styles.markAsSent}`}
                          title="Marcar como enviado manualmente"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleGenerateAndDownloadPdf(item)}
                        className={`${styles.modalReceiptSendActionBtn} ${styles.generatePdf}`}
                        title="Gerar e baixar PDF localmente"
                      >
                        <FaFilePdf />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {confirmModalOpen && receiptToMark && (
        <div className={styles.confirmModalOverlay}>
          <div className={styles.confirmModalBox}>
            <h4>Confirmar envio</h4>
            <p>
              Deseja marcar o recibo <strong>#{receiptToMark.receipt_donation_id}</strong> de{" "}
              <strong>{receiptToMark.donor?.donor_name || "doador"}</strong> como enviado?
            </p>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={`${styles.confirmActionBtn} ${styles.cancelBtn}`}
                onClick={() => {
                  setConfirmModalOpen(false);
                  setReceiptToMark(null);
                }}
                title="Cancelar"
              >
                <FaTimes /> Cancelar
              </button>
              <button
                type="button"
                className={`${styles.confirmActionBtn} ${styles.confirmBtn}`}
                onClick={handleMarkAsSent}
                title="Confirmar"
              >
                <FaCheck /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalReceiptSend;
