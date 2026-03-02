import React, { useState, useEffect } from "react";
import styles from "./bulkemailsend.module.css";
import { 
  FaEnvelope, 
  FaCheckSquare, 
  FaRegSquare, 
  FaPaperPlane, 
  FaFilter,
  FaSearch,
  FaImage,
  FaTrash
} from "react-icons/fa";
import { getDonorEmails, getDonorEmailsByType } from "../../helper/getDonorEmails";
import { getCampains } from "../../helper/getCampains";
import { getCampainTexts } from "../../helper/getCampainTexts";
import Loader from "../../components/Loader";
import { DONOR_TYPES } from "../../constants/constants";

const BulkEmailSend = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  
  // Estados para campanhas
  const [campains, setCampains] = useState([]);
  const [campainTexts, setCampainTexts] = useState([]);
  const [selectedCampainId, setSelectedCampainId] = useState("");
  const [selectedTextId, setSelectedTextId] = useState("");
  const [campainsWithTexts, setCampainsWithTexts] = useState([]);
  
  // Estados do email
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  // Buscar contatos ao carregar
  useEffect(() => {
    fetchContacts();
    fetchCampaigns();
  }, []);

  // Filtrar contatos por tipo
  useEffect(() => {
    if (filterType && filterType !== "Todos") {
      fetchContactsByType(filterType);
    } else {
      fetchContacts();
    }
  }, [filterType]);

  // Aplicar filtro de busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.donor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contact.donor_tel_1 && contact.donor_tel_1.includes(searchTerm))
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const data = await getDonorEmails();

      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
      setStatus({ type: "error", message: "Erro ao carregar contatos" });
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchContactsByType = async (type) => {
    setLoadingContacts(true);
    try {
      const data = await getDonorEmailsByType(type);
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      console.error("Erro ao buscar contatos por tipo:", error);
      setStatus({ type: "error", message: "Erro ao carregar contatos" });
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const [campainsData, textsData] = await Promise.all([
        getCampains(),
        getCampainTexts(),
      ]);

      setCampains(campainsData || []);
      setCampainTexts(textsData || []);

      // Filtrar campanhas que têm textos
      const campainsWithTextsIds = [
        ...new Set(textsData.map((text) => text.campain_id)),
      ];
      const filtered = campainsData.filter((camp) =>
        campainsWithTextsIds.includes(camp.id)
      );
      setCampainsWithTexts(filtered);
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
    }
  };

  // Quando selecionar uma campanha
  useEffect(() => {
    if (selectedCampainId) {
      const textsForCampain = campainTexts.filter(
        (text) => text.campain_id === parseInt(selectedCampainId)
      );
      if (textsForCampain.length === 1) {
        setSelectedTextId(textsForCampain[0].id.toString());
      }
    } else {
      setSelectedTextId("");
    }
  }, [selectedCampainId, campainTexts]);

  // Quando selecionar um texto
  useEffect(() => {
    if (selectedTextId) {
      const selectedText = campainTexts.find(
        (text) => text.id === parseInt(selectedTextId)
      );

      if (selectedText) {
        setSubject(selectedText.title);
        let content = selectedText.content.replace(/\{\{imagem\}\}/gi, "[IMAGEM]");
        setMessage(content);

        if (selectedText.image) {
          setImagePreview(selectedText.image);
          setImage({ name: "imagem_campanha.jpg" });
        }
      }
    }
  }, [selectedTextId, campainTexts]);

  // Selecionar/desselecionar contato individual
  const toggleContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Selecionar/desselecionar todos
  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  // Manipular imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        setStatus({
          type: "error",
          message: "Por favor, selecione apenas arquivos de imagem.",
        });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setStatus({
          type: "error",
          message: "A imagem deve ter no máximo 5MB.",
        });
        return;
      }

      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      setStatus({ type: "", message: "" });
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  // Enviar emails em massa
  const handleBulkSend = async (e) => {
    e.preventDefault();

    if (selectedContacts.length === 0) {
      setStatus({
        type: "error",
        message: "Selecione pelo menos um contato.",
      });
      return;
    }

    if (!subject || !message) {
      setStatus({
        type: "error",
        message: "Preencha o assunto e a mensagem.",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });
    setSendProgress({ current: 0, total: selectedContacts.length });

    try {
      const selectedContactsData = contacts.filter((c) =>
        selectedContacts.includes(c.id)
      );

      let successCount = 0;
      let failCount = 0;
      const failedEmails = [];

      for (let i = 0; i < selectedContactsData.length; i++) {
        const contact = selectedContactsData[i];
        setSendProgress({ current: i + 1, total: selectedContactsData.length });

        try {
          // Substituir variáveis dinâmicas
          let processedMessage = message.replace(
            /\{\{nome_doador\}\}/gi,
            contact.donor_name
          );

          const emailData = {
            emailTo: contact.donor_email,
            subject,
            text: processedMessage,
          };

          // Adicionar imagem se existir
          if (image && imagePreview) {
            emailData.image = {
              filename: image.name,
              content: imagePreview.split(",")[1],
              contentType: image.type,
            };
          }

          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(emailData),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            failedEmails.push(contact.donor_email);
          }

          // Pequeno delay entre envios para não sobrecarregar
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Erro ao enviar para ${contact.donor_email}:`, error);
          failCount++;
          failedEmails.push(contact.donor_email);
        }
      }

      // Mostrar resultado
      if (failCount === 0) {
        setStatus({
          type: "success",
          message: `✓ ${successCount} emails enviados com sucesso!`,
        });
        setSelectedContacts([]);
      } else {
        setStatus({
          type: "warning",
          message: `${successCount} enviados com sucesso, ${failCount} falharam. Emails com falha: ${failedEmails.join(", ")}`,
        });
      }
    } catch (error) {
      console.error("Erro no envio em massa:", error);
      setStatus({
        type: "error",
        message: `Erro ao enviar emails: ${error.message}`,
      });
    } finally {
      setLoading(false);
      setSendProgress({ current: 0, total: 0 });
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            <FaEnvelope /> Envio de Campanha em Massa
          </h2>
          <p className={styles.subtitle}>
            Selecione os contatos e a campanha para enviar emails em massa
          </p>
        </header>

        <div className={styles.mainGrid}>
          {/* Painel de Contatos */}
          <div className={styles.contactsPanel}>
            <div className={styles.panelHeader}>
              <h3>Contatos ({filteredContacts.length})</h3>
              <span className={styles.selectedCount}>
                {selectedContacts.length} selecionados
              </span>
            </div>

            {/* Filtros */}
            <div className={styles.filters}>
              <div className={styles.searchBox}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.filterBox}>
                <FaFilter className={styles.filterIcon} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="Todos">Todos os Tipos</option>
                  {Object.values(DONOR_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={toggleSelectAll}
                className={styles.selectAllBtn}
                disabled={filteredContacts.length === 0}
              >
                {selectedContacts.length === filteredContacts.length ? (
                  <>
                    <FaCheckSquare /> Desselecionar Todos
                  </>
                ) : (
                  <>
                    <FaRegSquare /> Selecionar Todos
                  </>
                )}
              </button>
            </div>

            {/* Lista de Contatos */}
            <div className={styles.contactsList}>
              {loadingContacts ? (
                <div className={styles.loadingContacts}>
                  <Loader />
                  <p>Carregando contatos...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nenhum contato encontrado</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`${styles.contactItem} ${
                      selectedContacts.includes(contact.id)
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => toggleContact(contact.id)}
                  >
                    <div className={styles.checkbox}>
                      {selectedContacts.includes(contact.id) ? (
                        <FaCheckSquare />
                      ) : (
                        <FaRegSquare />
                      )}
                    </div>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactName}>
                        {contact.donor_name}
                        <span className={styles.contactType}>
                          {contact.donor_type}
                        </span>
                      </div>
                      <div className={styles.contactEmail}>
                        {contact.donor_email}
                      </div>
                      {contact.donor_tel_1 && (
                        <div className={styles.contactPhone}>
                          📞 {contact.donor_tel_1}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Painel de Campanha */}
          <div className={styles.campaignPanel}>
            <div className={styles.panelHeader}>
              <h3>Campanha</h3>
            </div>

            <form onSubmit={handleBulkSend} className={styles.campaignForm}>
              {/* Seleção de Campanha */}
              <div className={styles.formGroup}>
                <label>Selecione uma Campanha</label>
                <select
                  value={selectedCampainId}
                  onChange={(e) => {
                    setSelectedCampainId(e.target.value);
                    setSelectedTextId("");
                  }}
                  className={styles.formSelect}
                >
                  <option value="">Selecione uma campanha...</option>
                  {campainsWithTexts.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.campain_name}
                    </option>
                  ))}
                </select>
                {campainsWithTexts.length === 0 && (
                  <small className={styles.hint}>
                    ℹ️ Nenhuma campanha com textos cadastrados
                  </small>
                )}
              </div>

              {/* Seleção de Texto */}
              {selectedCampainId && (
                <div className={styles.formGroup}>
                  <label>Selecione o Texto</label>
                  <select
                    value={selectedTextId}
                    onChange={(e) => setSelectedTextId(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="">Escolha um texto...</option>
                    {campainTexts
                      .filter(
                        (text) => text.campain_id === parseInt(selectedCampainId)
                      )
                      .map((text) => (
                        <option key={text.id} value={text.id}>
                          {text.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Assunto */}
              <div className={styles.formGroup}>
                <label>Assunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Assunto do email"
                  className={styles.formInput}
                  required
                />
              </div>

              {/* Mensagem */}
              <div className={styles.formGroup}>
                <label>Mensagem</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows="10"
                  className={styles.formTextarea}
                  required
                />
                <small className={styles.hint}>
                  💡 Use <strong>{"{{nome_doador}}"}</strong> para personalizar
                  e <strong>[IMAGEM]</strong> para posicionar a imagem
                </small>
              </div>

              {/* Imagem */}
              <div className={styles.formGroup}>
                <label>Anexar Imagem (opcional)</label>
                <div className={styles.imageUpload}>
                  <input
                    type="file"
                    id="bulk-image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={styles.imageInput}
                  />
                  <label
                    htmlFor="bulk-image-upload"
                    className={styles.imageUploadLabel}
                  >
                    <FaImage /> Escolher Imagem
                  </label>
                  {imagePreview && (
                    <div className={styles.imagePreview}>
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className={styles.removeImageBtn}
                        title="Remover imagem"
                      >
                        <FaTrash />
                      </button>
                      <span className={styles.imageName}>{image?.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {loading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${
                          (sendProgress.current / sendProgress.total) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <p className={styles.progressText}>
                    Enviando {sendProgress.current} de {sendProgress.total}...
                  </p>
                </div>
              )}

              {/* Status */}
              {status.message && (
                <div className={`${styles.status} ${styles[status.type]}`}>
                  {status.message}
                </div>
              )}

              {/* Botão de Envio */}
              <button
                type="submit"
                className={styles.sendButton}
                disabled={loading || selectedContacts.length === 0}
              >
                {loading ? (
                  <>
                    <Loader /> Enviando...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Enviar para {selectedContacts.length}{" "}
                    contatos
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BulkEmailSend;

