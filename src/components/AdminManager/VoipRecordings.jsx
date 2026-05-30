import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  deleteVoipRecording,
  fetchAdminVoipOperatorAssignments,
  fetchVoipRecordings,
} from "../../api/voipApi";
import styles from "../../pages/AdminManager/adminmanager.module.css";

const MIN_BYTES = 100;
const PAGE_SIZE = 20;

/** Formato esperado: YYYYMMDD-HHMMSS-origem-numero.wav */
function parseVoipRecordingFilename(filename) {
  const base = String(filename || "").replace(/\.wav$/i, "");
  const parts = base.split("-");
  if (parts.length < 4) {
    return {
      ok: false,
      dateKey: "",
      displayDateTime: "—",
      origin: "",
      calledNumber: "—",
    };
  }
  const dateRaw = parts[0];
  const timeRaw = parts[1];
  if (!/^\d{8}$/.test(dateRaw) || !/^\d{6}$/.test(timeRaw)) {
    return {
      ok: false,
      dateKey: "",
      displayDateTime: "—",
      origin: parts.slice(2, -1).join("-") || "—",
      calledNumber: parts[parts.length - 1] || "—",
    };
  }
  const calledNumber = parts[parts.length - 1] || "—";
  const origin = parts.slice(2, -1).join("-") || "—";
  const displayDateTime = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)} ${timeRaw.slice(0, 2)}:${timeRaw.slice(2, 4)}:${timeRaw.slice(4, 6)}`;
  return {
    ok: true,
    dateKey: dateRaw,
    displayDateTime,
    origin,
    calledNumber,
  };
}

/** Estimativa para WAV telefônico (8 kHz, mono, 16 bit PCM ≈ 16000 B/s de áudio). */
function estimateDurationSeconds(sizeBytes) {
  const dataBytes = Math.max(0, Number(sizeBytes) - 80);
  const bytesPerSecond = 16000;
  return Math.round(dataBytes / bytesPerSecond);
}

function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function recordingAudioUrl(filename) {
  return `/api/voip/recordings/${encodeURIComponent(filename)}`;
}

/**
 * Associa o trecho "origem" do ficheiro ao operador ativo que usa esse ramal SIP
 * (voip_sip_user), com heurísticas para nomes de canal tipo PJSIP/1001-…
 */
function findOperatorForOrigin(origin, assignments) {
  const o = String(origin ?? "").trim();
  if (!o || !Array.isArray(assignments)) return null;

  const maybeOpId = /^\d{1,14}$/.test(o) ? Number(o) : NaN;
  if (Number.isFinite(maybeOpId)) {
    const byId = assignments.find((a) => Number(a.operator_code_id) === maybeOpId);
    if (byId?.operator_name != null) return byId;
  }

  const withSip = assignments.filter((a) => String(a.voip_sip_user || "").trim());
  const sorted = [...withSip].sort(
    (a, b) => String(b.voip_sip_user).length - String(a.voip_sip_user).length
  );

  for (const a of sorted) {
    const sip = String(a.voip_sip_user).trim();
    if (!sip) continue;
    if (o === sip) return a;
    if (o.endsWith(`/${sip}`) || o.endsWith(sip)) return a;
    const idx = o.indexOf(sip);
    if (idx !== -1 && sip.length >= 3) {
      const before = o[idx - 1];
      const after = o[idx + sip.length];
      const boundaryOk =
        (before === undefined || /[^0-9A-Za-z]/.test(before)) &&
        (after === undefined || /[^0-9A-Za-z]/.test(after));
      if (boundaryOk) return a;
    }
  }
  return null;
}

function formatOperatorLabel(op, originRaw) {
  if (!op?.operator_name) {
    return { primary: originRaw || "—", title: "" };
  }
  const sip = String(op.voip_sip_user || "").trim();
  const primary = String(op.operator_name).trim();
  const titleParts = [];
  if (originRaw && originRaw !== sip) titleParts.push(`Origem no ficheiro: ${originRaw}`);
  if (sip) titleParts.push(`Ramal SIP: ${sip}`);
  return { primary, title: titleParts.join("\n") };
}

export function VoipRecordingsTab() {
  const [items, setItems] = useState([]);
  const [operatorAssignments, setOperatorAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterNumber, setFilterNumber] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterOperatorId, setFilterOperatorId] = useState("");
  const [page, setPage] = useState(1);
  const [playingFilename, setPlayingFilename] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recRes, opRes] = await Promise.all([
        fetchVoipRecordings(),
        fetchAdminVoipOperatorAssignments().catch(() => ({ success: false, data: [] })),
      ]);

      if (opRes?.success) setOperatorAssignments(Array.isArray(opRes.data) ? opRes.data : []);
      else setOperatorAssignments([]);

      if (!recRes?.success) {
        setError(recRes?.message || "Não foi possível carregar as gravações.");
        setItems([]);
        return;
      }
      const raw = Array.isArray(recRes.data) ? recRes.data : [];
      const filtered = raw.filter((r) => Number(r?.size) >= MIN_BYTES);
      setItems(filtered);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Erro ao carregar gravações.";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const normalizedFilterNumber = useMemo(
    () => filterNumber.replace(/\D/g, ""),
    [filterNumber]
  );

  const filtered = useMemo(() => {
    let rows = items.map((row) => {
      const meta = parseVoipRecordingFilename(row.filename);
      const operator = findOperatorForOrigin(meta.origin, operatorAssignments);
      return { ...row, meta, operator };
    });

    if (normalizedFilterNumber) {
      rows = rows.filter((r) => {
        const digits = String(r.meta.calledNumber || "").replace(/\D/g, "");
        return digits.includes(normalizedFilterNumber);
      });
    }

    if (filterDate) {
      const key = filterDate.replace(/-/g, "");
      rows = rows.filter((r) => {
        if (r.meta.ok && r.meta.dateKey) return r.meta.dateKey === key;
        const created = rowCreatedDateKey(r.createdAt);
        return created === key;
      });
    }

    if (filterOperatorId !== "") {
      const want = String(filterOperatorId);
      rows = rows.filter((r) => {
        const id = r.operator?.operator_code_id;
        return id != null && String(id) === want;
      });
    }

    return rows;
  }, [items, normalizedFilterNumber, filterDate, filterOperatorId, operatorAssignments]);

  useEffect(() => {
    setPage(1);
  }, [normalizedFilterNumber, filterDate, filterOperatorId]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    setPage((p) => Math.min(p, tp));
  }, [filtered.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const togglePlay = (filename) => {
    setPlayingFilename((prev) => (prev === filename ? null : filename));
  };

  const closeDeleteModal = () => {
    if (deleteBusy) return;
    setDeleteConfirm(null);
  };

  const confirmDeleteRecording = async () => {
    if (!deleteConfirm?.filename) return;
    setDeleteBusy(true);
    try {
      const res = await deleteVoipRecording(deleteConfirm.filename);
      if (!res?.success) {
        toast.error(res?.message || "Erro ao excluir a gravação.");
        return;
      }
      const removed = deleteConfirm.filename;
      setItems((prev) => prev.filter((r) => r.filename !== removed));
      setPlayingFilename((prev) => (prev === removed ? null : prev));
      toast.success("Gravação excluída.");
      setDeleteConfirm(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Erro ao excluir a gravação.");
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) {
    return <p className={styles.voipHint}>Carregando gravações…</p>;
  }

  if (error) {
    return (
      <div className={styles.voipRecordingsError}>
        <p>{error}</p>
        <button type="button" className={styles.receiptConfigBtnPrimary} onClick={load}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.voipRamaisWrap}>
      <div className={styles.receiptConfigSection}>
        <h4>Filtros</h4>
        <div className={styles.voipRecordingsToolbar}>
          <select
            className={styles.receiptConfigInput}
            value={filterOperatorId}
            onChange={(e) => setFilterOperatorId(e.target.value)}
            aria-label="Filtrar por operador"
          >
            <option value="">Todos os operadores</option>
            {operatorAssignments.map((op) => (
              <option key={String(op.operator_code_id)} value={String(op.operator_code_id)}>
                {op.operator_name || `Código ${op.operator_code_id}`}
                {op.voip_sip_user ? ` (${op.voip_sip_user})` : ""}
              </option>
            ))}
          </select>
          <input
            type="search"
            className={styles.receiptConfigInput}
            placeholder="Filtrar por número discado…"
            value={filterNumber}
            onChange={(e) => setFilterNumber(e.target.value)}
            aria-label="Filtrar por número"
          />
          <input
            type="date"
            className={styles.receiptConfigInput}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            aria-label="Filtrar por data"
          />
          {(filterNumber || filterDate || filterOperatorId !== "") && (
            <button
              type="button"
              className={styles.receiptConfigBtn}
              onClick={() => {
                setFilterNumber("");
                setFilterDate("");
                setFilterOperatorId("");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
        <p className={styles.voipHint}>
          Nomes no formato <code>YYYYMMDD-HHMMSS-origem-numero.wav</code>. O campo{" "}
          <strong>origem</strong> é cruzado com o ramal SIP do operador (aba Operadores) para exibir o
          nome. Duração estimada assumindo PCM 8 kHz mono 16 bit (~16 KB/s). Gravações com menos de{" "}
          {MIN_BYTES} bytes são ignoradas.
        </p>
      </div>

      <div className={styles.receiptConfigSection}>
        <h4>Lista ({filtered.length})</h4>
        <div className={styles.voipTableScroll}>
          <table className={styles.voipTable}>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Operador</th>
                <th>Número chamado</th>
                <th>Duração estimada</th>
                <th>Tamanho</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((row) => {
                const { primary, title } = formatOperatorLabel(row.operator, row.meta.origin);
                return (
                <React.Fragment key={row.filename}>
                  <tr>
                    <td>{row.meta.displayDateTime}</td>
                    <td title={title || undefined}>
                      {primary}
                    </td>
                    <td>{row.meta.calledNumber}</td>
                    <td>
                      ~{formatDuration(estimateDurationSeconds(row.size))}
                    </td>
                    <td>{formatFileSize(row.size)}</td>
                    <td className={styles.voipTableActions}>
                      <button
                        type="button"
                        className={styles.receiptConfigBtnPrimary}
                        onClick={() => togglePlay(row.filename)}
                      >
                        {playingFilename === row.filename ? "Ocultar" : "Ouvir"}
                      </button>
                      <button
                        type="button"
                        className={styles.receiptConfigBtn}
                        onClick={() =>
                          setDeleteConfirm({
                            filename: row.filename,
                            summary: `${row.meta.displayDateTime} · ${row.meta.calledNumber}`,
                          })
                        }
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                  {playingFilename === row.filename && (
                    <tr className={styles.voipRecordingPlayerRow}>
                      <td colSpan={6}>
                        <audio
                          className={styles.voipRecordingAudio}
                          controls
                          preload="metadata"
                          src={recordingAudioUrl(row.filename)}
                        >
                          Seu navegador não suporta áudio embutido.
                        </audio>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className={styles.voipHint}>Nenhuma gravação encontrada com os filtros atuais.</p>
          )}
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className={styles.voipPagination}>
            <button
              type="button"
              className={styles.receiptConfigBtn}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className={styles.voipPaginationInfo}>
              Página {safePage} de {totalPages}
            </span>
            <button
              type="button"
              className={styles.receiptConfigBtn}
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {deleteConfirm ? (
        <div
          className={styles.voipModalOverlay}
          role="presentation"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) closeDeleteModal();
          }}
        >
          <div
            className={styles.voipModalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voip-recording-delete-title"
          >
            <div className={styles.voipModalHeader}>
              <h4 id="voip-recording-delete-title">Excluir gravação?</h4>
              <button
                type="button"
                className={styles.voipModalClose}
                onClick={closeDeleteModal}
                disabled={deleteBusy}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className={styles.voipModalBody}>
              <p className={styles.voipRecordingDeleteLead}>
                Deseja mesmo excluir esta gravação? A exclusão é permanente: o ficheiro deixa de
                existir no servidor e não pode ser recuperado.
              </p>
              <p className={styles.voipRecordingDeleteMeta}>
                {deleteConfirm.summary}
                <br />
                <code className={styles.voipRecordingDeleteFilename}>{deleteConfirm.filename}</code>
              </p>
            </div>
            <div className={styles.voipModalFooter}>
              <button
                type="button"
                className={styles.receiptConfigBtn}
                onClick={closeDeleteModal}
                disabled={deleteBusy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.receiptConfigBtnPrimary}
                onClick={confirmDeleteRecording}
                disabled={deleteBusy}
              >
                {deleteBusy ? "A excluir…" : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function rowCreatedDateKey(createdAt) {
  const d = createdAt ? new Date(createdAt) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export default VoipRecordingsTab;
