import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify';
import styles from './modalsendemail.module.css'
import { FaEnvelope, FaTimes, FaPaperPlane, FaImage, FaTrash, FaVideo } from 'react-icons/fa';
import { getCampainsSummary } from '../../helper/getCampains';
import { getCampainTexts } from '../../helper/getCampainTexts';
import {
  fetchCampainTextBodyById,
  fetchCampainTextMediaById,
} from '../../api/campainsApi.js';

/** Preview em `<img>` / `<video>` precisa de data URL se a API devolver só base64 puro. */
function ensureDataUrlForPreview(mimeFallback, value) {
  if (value == null || value === '') return null;
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  if (s.startsWith('data:')) return s;
  return `data:${mimeFallback};base64,${s}`;
}

/** Igual ao backend: data URL ou base64 puro (sem vírgula). */
function extractRawBase64ForEmail(value) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') return '';
  const s = value.trim();
  const dataMatch = /^data:[^;]+;base64,(.+)$/is.exec(s);
  if (dataMatch) return dataMatch[1].replace(/\s+/g, '');
  const idx = s.indexOf('base64,');
  if (idx !== -1) return s.slice(idx + 7).replace(/\s+/g, '');
  return s.replace(/\s+/g, '');
}

/** Mesma prioridade do botão "Exibir anexo": imagem, depois vídeo. */
async function loadCampaignMediaForSend(textId, campainTextsList) {
  const id = parseInt(textId, 10);
  if (!Number.isFinite(id)) return null;
  const meta = campainTextsList.find((t) => Number(t.id) === id);
  if (!meta || (meta.has_image !== true && meta.has_video !== true)) return null;

  const resMedia = await fetchCampainTextMediaById(id);
  const mediaRow = resMedia?.success ? resMedia.data : resMedia?.data ?? resMedia;
  if (!mediaRow) return null;

  if (mediaRow.image) {
    return {
      mediaType: 'image',
      media: { name: 'imagem_campanha.jpg', type: 'image/jpeg' },
      mediaPreview: ensureDataUrlForPreview('image/jpeg', mediaRow.image),
    };
  }
  if (mediaRow.video) {
    return {
      mediaType: 'video',
      media: { name: 'video_campanha.mp4', type: 'video/mp4' },
      mediaPreview: ensureDataUrlForPreview('video/mp4', mediaRow.video),
    };
  }
  return null;
}

const ModalSendEmail = ({ donor_email, donor_name, setModalSendEmail }) => {
  const [emailTo, setEmailTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' ou 'video'
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Estados para campanhas e textos
  const [campainTexts, setCampainTexts] = useState([]);
  const [selectedCampainId, setSelectedCampainId] = useState('');
  const [selectedTextId, setSelectedTextId] = useState('');
  const [campainsWithTexts, setCampainsWithTexts] = useState([]);
  /** Vídeo da campanha: só busca e exibe após "Exibir Anexo" */
  const [deferCampaignMedia, setDeferCampaignMedia] = useState(false);
  const [campaignMediaLoading, setCampaignMediaLoading] = useState(false);

  // Preenche o email automaticamente se vier do prop
  useEffect(() => {
    if (donor_email) {
      setEmailTo(donor_email);
    }
  }, [donor_email]);

  // Buscar apenas as campanhas ao carregar o componente
  useEffect(() => {
    const fetchCampains = async () => {
      try {
        const campainsData = await getCampainsSummary();

        setCampainsWithTexts(campainsData || []);
      } catch (error) {
        console.error('Erro ao buscar campanhas:', error);
      }
    };
    
    fetchCampains();
  }, []);

  // Quando selecionar uma campanha, buscar os textos dela (lazy load)
  useEffect(() => {
    const fetchTextsForCampain = async () => {
      // Se nenhuma campanha estiver selecionada, limpa textos
      if (!selectedCampainId) {
        setCampainTexts([]);
        setSelectedTextId('');
        return;
      }

      try {
        const campainIdNumber = parseInt(selectedCampainId);
        const textsForCampain = await getCampainTexts(campainIdNumber);

        setCampainTexts(textsForCampain || []);

        // Se houver apenas um texto, seleciona automaticamente
        if (textsForCampain && textsForCampain.length === 1) {
          setSelectedTextId(textsForCampain[0].id.toString());
        }
      } catch (error) {
        console.error('Erro ao buscar textos da campanha:', error);
      }
    };

    fetchTextsForCampain();
  }, [selectedCampainId]);

  // Lista de textos vem sem `content` (API leve); ao escolher um, busca o registro completo
  useEffect(() => {
    if (!selectedTextId) {
      setDeferCampaignMedia(false);
      setCampaignMediaLoading(false);
      return;
    }

    let cancelled = false;

    const loadFullText = async () => {
      try {
        const id = parseInt(selectedTextId, 10);
        if (!Number.isFinite(id)) return;

        setDeferCampaignMedia(false);
        setCampaignMediaLoading(false);

        const resBody = await fetchCampainTextBodyById(id);
        const body = resBody?.success ? resBody.data : resBody?.data ?? resBody;
        if (cancelled || !body) return;

        setSubject(body.title ?? '');

        const raw = String(body.content ?? '');
        let content = raw.replace(/\{\{imagem\}\}/gi, '[IMAGEM]');
        content = content.replace(/\{\{video\}\}/gi, '[VIDEO]');
        setMessage(content);

        const meta = campainTexts.find((t) => Number(t.id) === id);
        const needMediaFetch =
          !meta || meta.has_image === true || meta.has_video === true;

        if (!needMediaFetch) {
          setMediaPreview(null);
          setMediaType(null);
          setMedia(null);
          return;
        }

        // Vídeo da campanha: não baixa nem exibe até "Exibir Anexo"
        if (meta?.has_video === true) {
          setMediaPreview(null);
          setMediaType(null);
          setMedia(null);
          setDeferCampaignMedia(true);
          return;
        }

        const resMedia = await fetchCampainTextMediaById(id);
        const mediaRow = resMedia?.success ? resMedia.data : resMedia?.data ?? resMedia;
        if (cancelled) return;

        if (mediaRow?.image) {
          setMediaPreview(ensureDataUrlForPreview('image/jpeg', mediaRow.image));
          setMediaType('image');
          setMedia({ name: 'imagem_campanha.jpg', type: 'image/jpeg' });
        } else {
          setMediaPreview(null);
          setMediaType(null);
          setMedia(null);
        }
      } catch (e) {
        if (!cancelled) console.error('Erro ao carregar texto da campanha:', e);
      }
    };

    loadFullText();
    return () => {
      cancelled = true;
    };
  }, [selectedTextId, campainTexts]);

  const handleRevealCampaignAttachment = async () => {
    const id = parseInt(selectedTextId, 10);
    if (!Number.isFinite(id)) return;

    setCampaignMediaLoading(true);
    try {
      const resMedia = await fetchCampainTextMediaById(id);
      const mediaRow = resMedia?.success ? resMedia.data : resMedia?.data ?? resMedia;

      if (mediaRow?.image) {
        setMediaPreview(ensureDataUrlForPreview('image/jpeg', mediaRow.image));
        setMediaType('image');
        setMedia({ name: 'imagem_campanha.jpg', type: 'image/jpeg' });
      } else if (mediaRow?.video) {
        setMediaPreview(ensureDataUrlForPreview('video/mp4', mediaRow.video));
        setMediaType('video');
        setMedia({ name: 'video_campanha.mp4', type: 'video/mp4' });
      } else {
        setMediaPreview(null);
        setMediaType(null);
        setMedia(null);
      }
      setDeferCampaignMedia(false);
    } catch (e) {
      console.error('Erro ao carregar anexo da campanha:', e);
    } finally {
      setCampaignMediaLoading(false);
    }
  };

  // Função para lidar com seleção de mídia (imagem ou vídeo)
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      // Validar tipo de arquivo
      if (!isImage && !isVideo) {
        setStatus({ type: 'error', message: 'Por favor, selecione apenas arquivos de imagem ou vídeo.' });
        return;
      }
      
      // Validar tamanho
      const maxImageSize = 5 * 1024 * 1024; // 5MB para imagens
      const maxVideoSize = 25 * 1024 * 1024; // 25MB para vídeos
      const maxSize = isVideo ? maxVideoSize : maxImageSize;
      
      if (file.size > maxSize) {
        const sizeLabel = isVideo ? '25MB' : '5MB';
        const typeLabel = isVideo ? 'vídeo' : 'imagem';
        setStatus({ type: 'error', message: `O ${typeLabel} deve ter no máximo ${sizeLabel}.` });
        return;
      }

      setMedia(file);
      setMediaType(isVideo ? 'video' : 'image');
      setDeferCampaignMedia(false);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setStatus({ type: '', message: '' });
    }
  };

  // Função para remover mídia
  const handleRemoveMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!emailTo || !subject || !message) {
      setStatus({ type: 'error', message: 'Por favor, preencha todos os campos.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // URL da API - ajustada para funcionar com Vercel
      const apiUrl = '/api/send-email';

      // Substituir {{nome_doador}} pelo nome real do doador
      let processedMessage = message;
      if (donor_name) {
        processedMessage = processedMessage.replace(/\{\{nome_doador\}\}/gi, donor_name);
      }

      let sendMedia = media;
      let sendMediaPreview = mediaPreview;
      let sendMediaType = mediaType;

      // Campanha com vídeo/imagem em modo lazy: busca na API na hora do envio (não exige "Exibir anexo")
      if (deferCampaignMedia && selectedTextId) {
        const meta = campainTexts.find((t) => Number(t.id) === parseInt(selectedTextId, 10));
        try {
          const snap = await loadCampaignMediaForSend(selectedTextId, campainTexts);
          if ((meta?.has_video || meta?.has_image) && !snap) {
            setStatus({
              type: 'error',
              message:
                'Não foi possível carregar o anexo desta campanha. Use "Exibir anexo" ou verifique se o vídeo/imagem está salvo no texto da campanha.',
            });
            setLoading(false);
            return;
          }
          if (snap) {
            sendMedia = snap.media;
            sendMediaPreview = snap.mediaPreview;
            sendMediaType = snap.mediaType;
          }
        } catch (_err) {
          setStatus({
            type: 'error',
            message: 'Erro ao carregar o anexo da campanha. Tente de novo ou use "Exibir anexo".',
          });
          setLoading(false);
          return;
        }
      }

      // Usar FormData se houver arquivo anexado, caso contrário JSON
      let requestBody;
      let headers = {};

      if (sendMedia && sendMedia instanceof File) {
        // Usar FormData para arquivos - mais eficiente, sem conversão base64
        const formData = new FormData();
        formData.append('emailTo', emailTo);
        formData.append('subject', subject);
        formData.append('text', processedMessage);
        
        // Anexar o arquivo com o nome correto do campo
        if (sendMediaType === 'video') {
          formData.append('video', sendMedia);
        } else {
          formData.append('image', sendMedia);
        }
        
        requestBody = formData;
        // Não definir Content-Type, o browser faz isso automaticamente com boundary correto
      } else if (sendMedia && sendMediaPreview) {
        // Caso seja mídia de campanha (base64), usar JSON como antes
        const emailData = {
          emailTo,
          subject,
          text: processedMessage,
        };

        const rawB64 = extractRawBase64ForEmail(sendMediaPreview);
        if (!rawB64) {
          setStatus({
            type: 'error',
            message: 'Não foi possível ler o anexo (vídeo/imagem). Tente anexar o arquivo de novo ou reabra o anexo da campanha.',
          });
          setLoading(false);
          return;
        }

        const mediaData = {
          filename: sendMedia.name,
          content: rawB64,
          contentType: sendMedia.type,
        };
        
        if (sendMediaType === 'video') {
          emailData.video = mediaData;
        } else {
          emailData.image = mediaData;
        }

        requestBody = JSON.stringify(emailData);
        headers['Content-Type'] = 'application/json';
      } else {
        // Sem mídia, usar JSON simples
        const emailData = {
          emailTo,
          subject,
          text: processedMessage,
        };
        
        requestBody = JSON.stringify(emailData);
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: requestBody,
      });

      // Verifica se a resposta tem conteúdo antes de fazer parse
      const contentType = response.headers.get('content-type');
      let data = {};
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      }

      if (response.ok) {
        const okMsg = data.message || 'E-mail enviado com sucesso!';
        toast.success(okMsg);
        setStatus({ type: 'success', message: okMsg });
        // Limpa os campos após 2 segundos
        setTimeout(() => {
          setSubject('');
          setMessage('');
          setMedia(null);
          setMediaPreview(null);
          setMediaType(null);
          setDeferCampaignMedia(false);
          setCampaignMediaLoading(false);
          setStatus({ type: '', message: '' });
        }, 2000);
      } else {
        const errorMessage = data.message || data.error || `Erro ${response.status}: ${response.statusText}`;
        setStatus({ type: 'error', message: errorMessage });
        console.error('Erro na resposta:', { status: response.status, data });
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      setStatus({ 
        type: 'error', 
        message: `Erro ao conectar com o servidor: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalSendEmailContainer}>
        <div className={styles.modalSendEmailContent}>
            <div className={styles.modalSendEmailHeader}>
                <h3><FaEnvelope /> Envio de Email</h3>
                <button className={styles.modalSendEmailHeaderButtonExit} onClick={() => setModalSendEmail(false)}>
                    <FaTimes />
                </button>
            </div>
            <div className={styles.modalSendEmailBody}>
                <form onSubmit={handleSendEmail}>
                    <div className={styles.searchInputGroup}>
                        <label>Email do Destinatário</label>
                        <input 
                            className={styles.searchInput} 
                            type="email" 
                            value={emailTo}
                            onChange={(e) => setEmailTo(e.target.value)}
                            placeholder="exemplo@email.com"
                            required
                        />
                    </div>

                    {/* Seleção de Campanha */}
                    <div className={styles.searchInputGroup}>
                        <label>📋 Usar Mensagem de Campanha (opcional)</label>
                        <select
                            className={styles.searchInput}
                            value={selectedCampainId}
                            onChange={(e) => {
                              setSelectedCampainId(e.target.value);
                              setSelectedTextId(''); // Limpa o texto selecionado
                            }}
                        >
                            <option value="">Selecione uma campanha...</option>
                            {campainsWithTexts.map((camp) => (
                                <option key={camp.id} value={camp.id}>
                                    {camp.campain_name}
                                </option>
                            ))}
                        </select>
                        {campainsWithTexts.length === 0 && (
                            <small style={{ color: '#999', fontSize: '0.85em', marginTop: '5px', display: 'block' }}>
                                ℹ️ Nenhuma campanha com textos cadastrados ainda
                            </small>
                        )}
                    </div>

                    {/* Seleção de Texto da Campanha */}
                    {selectedCampainId && (
                        <div className={styles.searchInputGroup}>
                            <label>📝 Selecione o Texto</label>
                            <select
                                className={styles.searchInput}
                                value={selectedTextId}
                                onChange={(e) => setSelectedTextId(e.target.value)}
                            >
                                <option value="">Escolha um texto...</option>
                                {campainTexts
                                    .filter(text => text.campain_id === parseInt(selectedCampainId))
                                    .map((text) => (
                                        <option key={text.id} value={text.id}>
                                            {text.title}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.searchInputGroup}>
                        <label>Assunto</label>
                        <input 
                            className={styles.searchInput} 
                            type="text" 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Assunto do email"
                            required
                        />
                    </div>

                    <div className={styles.searchInputGroup}>
                        <label>Mensagem</label>
                        <textarea 
                            className={styles.searchTextarea} 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Digite sua mensagem aqui..."
                            rows="10"
                            required
                        />
                        <small style={{ color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block' }}>
                            💡 Dica: Use <strong>[IMAGEM]</strong> ou <strong>[VIDEO]</strong> no texto para posicionar a mídia onde desejar
                        </small>
                    </div>

                    <div className={styles.searchInputGroup}>
                        <label>Anexar Imagem ou Vídeo (opcional)</label>
                        <div className={styles.imageUploadContainer}>
                            <input 
                                type="file" 
                                id="media-upload"
                                accept="image/*,video/*"
                                onChange={handleMediaChange}
                                className={styles.imageInput}
                            />
                            <label htmlFor="media-upload" className={styles.imageUploadLabel}>
                                <FaImage /> <FaVideo /> Escolher Mídia
                            </label>
                            {deferCampaignMedia && (
                                <button
                                    type="button"
                                    className={styles.exibirAnexoButton}
                                    onClick={handleRevealCampaignAttachment}
                                    disabled={campaignMediaLoading}
                                >
                                    <FaVideo />
                                    {campaignMediaLoading ? 'Carregando…' : 'Exibir Anexo'}
                                </button>
                            )}
                            {mediaPreview && (
                                <div className={styles.imagePreviewContainer}>
                                    {mediaType === 'video' ? (
                                        <video 
                                            src={mediaPreview} 
                                            controls
                                            preload="none"
                                            className={styles.videoPreview}
                                        >
                                            Seu navegador não suporta vídeos.
                                        </video>
                                    ) : (
                                        <img 
                                            src={mediaPreview} 
                                            alt="Preview" 
                                            className={styles.imagePreview}
                                        />
                                    )}
                                    <button 
                                        type="button"
                                        onClick={handleRemoveMedia}
                                        className={styles.removeImageButton}
                                        title="Remover mídia"
                                    >
                                        <FaTrash />
                                    </button>
                                    <span className={styles.imageName}>
                                        {mediaType === 'video' ? '🎬' : '📷'} {media?.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        <small style={{ color: '#888', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
                            📷 Imagens: máx. 5MB | 🎬 Vídeos: máx. 25MB
                        </small>
                    </div>

                    {status.message && (
                        <div className={`${styles.statusMessage} ${styles[status.type]}`}>
                            {status.message}
                        </div>
                    )}

                    <div className={styles.buttonGroup}>
                        <button 
                            type="submit" 
                            className={styles.sendButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <>Enviando...</>
                            ) : (
                                <>
                                    <FaPaperPlane /> Enviar Email
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default ModalSendEmail;