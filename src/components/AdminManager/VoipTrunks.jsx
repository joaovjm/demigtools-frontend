import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "../../pages/AdminManager/adminmanager.module.css";
import {
  deleteAdminVoipTrunk,
  fetchAdminVoipTrunks,
  postAdminVoipTrunkProvisionStream,
} from "../../api/voipApi";

const emptyForm = () => ({
  label: "",
  sip_user: "",
  sip_password: "",
  sip_domain: "",
  sip_port: "5060",
});

const TRUNK_STEP_LABELS = {
  validate: "Validação",
  pjsip_write: "Gravar pjsip.conf",
  asterisk_reload: "Reload PJSIP no Asterisk",
  db_insert: "Salvar no DemigTools",
};

const STATUS_LABELS = {
  running: "em andamento",
  done: "concluído",
  error: "erro",
  skipped: "ignorado",
};

function upsertTrunkStep(rows, ev) {
  if (ev.type !== "step") return rows;
  const label = TRUNK_STEP_LABELS[ev.id] || ev.id;
  const idx = rows.findIndex((r) => r.id === ev.id);
  const row = {
    id: ev.id,
    label,
    status: ev.status,
    message: ev.message || "",
  };
  if (idx === -1) return [...rows, row];
  const copy = [...rows];
  copy[idx] = { ...copy[idx], ...row };
  return copy;
}

function formatCreatedAt(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

function StepStatusIcon({ status }) {
  if (status === "running") {
    return <span className={styles.voipStepSpinner} aria-hidden title="Em andamento" />;
  }
  if (status === "done") {
    return (
      <span className={styles.voipStepIconDone} aria-hidden title="Concluído">
        ✓
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className={styles.voipStepIconError} aria-hidden title="Erro">
        ✕
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className={styles.voipStepIconSkipped} aria-hidden title="Ignorado">
        —
      </span>
    );
  }
  return <span className={styles.voipStepIconNeutral} aria-hidden />;
}

export function VoipTrunksTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [provisionSteps, setProvisionSteps] = useState([]);
  const [provisionBusy, setProvisionBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetchAdminVoipTrunks();
      if (res?.success) {
        setList(res.data || []);
      } else {
        const msg = res?.message || "Erro ao carregar trunks";
        setListError(msg);
        toast.error(msg);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Não foi possível carregar os trunks VoIP";
      setListError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const openModal = () => {
    setForm(emptyForm());
    setProvisionSteps([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (provisionBusy) return;
    setModalOpen(false);
    setForm(emptyForm());
    setProvisionSteps([]);
  };

  const changeField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setProvisionBusy(true);
    setProvisionSteps([]);
    const portNum = Number(form.sip_port);
    const payload = {
      label: form.label.trim(),
      sip_user: form.sip_user.trim(),
      sip_password: form.sip_password,
      sip_domain: form.sip_domain.trim(),
      sip_port: Number.isFinite(portNum) && portNum > 0 ? portNum : 5060,
    };
    try {
      const complete = await postAdminVoipTrunkProvisionStream(payload, (ev) => {
        if (ev?.type === "step") setProvisionSteps((prev) => upsertTrunkStep(prev, ev));
      });
      if (complete?.success) {
        toast.success("Trunk cadastrado.");
        setForm(emptyForm());
        setProvisionSteps([]);
        setModalOpen(false);
        await reload();
      } else {
        const msg = complete?.message || "Falha no provisionamento do trunk";
        toast.error(msg);
      }
    } catch (err) {
      toast.error(err?.message || "Erro ao criar trunk");
    } finally {
      setProvisionBusy(false);
    }
  };

  const handleDelete = async (id, label) => {
    const ok = window.confirm(
      `Excluir o trunk "${label || id}"? Isso remove o registro e a configuração no pjsip.conf.`
    );
    if (!ok) return;
    try {
      const res = await deleteAdminVoipTrunk(id);
      if (!res?.success) {
        toast.error(res?.message || "Erro ao excluir");
        return;
      }
      toast.success("Trunk removido.");
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Erro ao excluir trunk");
    }
  };

  return (
    <div className={styles.voipRamaisWrap}>
      <div className={styles.voipRecordingsToolbar}>
        <button type="button" className={styles.receiptConfigBtnPrimary} onClick={openModal}>
          Novo trunk
        </button>
      </div>

      {listError ? (
        <div className={styles.voipRecordingsError} role="alert">
          <p>{listError}</p>
          <button type="button" className={styles.receiptConfigBtn} onClick={() => reload()}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className={styles.voipHint}>Carregando trunks…</p>
      ) : (
        <div className={styles.receiptConfigSection}>
          <h4>Trunks cadastrados</h4>
          <div className={styles.voipTableScroll}>
            <table className={styles.voipTable}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Usuário SIP</th>
                  <th>Domínio</th>
                  <th>Porta</th>
                  <th>Data de criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.label}</td>
                    <td>{row.sip_user}</td>
                    <td>{row.sip_domain}</td>
                    <td>{row.sip_port ?? "—"}</td>
                    <td>{formatCreatedAt(row.created_at)}</td>
                    <td className={styles.voipTableActions}>
                      <button
                        type="button"
                        className={styles.receiptConfigBtn}
                        onClick={() => handleDelete(row.id, row.label)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && !listError && (
              <p className={styles.voipHint}>Nenhum trunk cadastrado ainda.</p>
            )}
          </div>
        </div>
      )}

      {modalOpen ? (
        <div
          className={styles.voipModalOverlay}
          role="presentation"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) closeModal();
          }}
        >
          <div
            className={styles.voipModalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voip-trunk-modal-title"
          >
            <div className={styles.voipModalHeader}>
              <h4 id="voip-trunk-modal-title">Novo trunk VoIP</h4>
              <button
                type="button"
                className={styles.voipModalClose}
                onClick={closeModal}
                disabled={provisionBusy}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className={styles.voipModalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="trunk-label">Nome</label>
                    <input
                      id="trunk-label"
                      className={styles.receiptConfigInput}
                      value={form.label}
                      onChange={(e) => changeField("label", e.target.value)}
                      disabled={provisionBusy}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="trunk-user">Usuário SIP</label>
                    <input
                      id="trunk-user"
                      className={styles.receiptConfigInput}
                      value={form.sip_user}
                      onChange={(e) => changeField("sip_user", e.target.value)}
                      disabled={provisionBusy}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="trunk-pass">Senha SIP</label>
                    <input
                      id="trunk-pass"
                      className={styles.receiptConfigInput}
                      type="password"
                      value={form.sip_password}
                      onChange={(e) => changeField("sip_password", e.target.value)}
                      disabled={provisionBusy}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="trunk-domain">Domínio</label>
                    <input
                      id="trunk-domain"
                      className={styles.receiptConfigInput}
                      value={form.sip_domain}
                      onChange={(e) => changeField("sip_domain", e.target.value)}
                      disabled={provisionBusy}
                      required
                      placeholder="sip.operadora.com"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="trunk-port">Porta</label>
                    <input
                      id="trunk-port"
                      className={styles.receiptConfigInput}
                      type="number"
                      min={1}
                      max={65535}
                      value={form.sip_port}
                      onChange={(e) => changeField("sip_port", e.target.value)}
                      disabled={provisionBusy}
                    />
                  </div>
                </div>

                {provisionSteps.length > 0 && (
                  <ol className={styles.voipProvisionStepsWithIcons}>
                    {provisionSteps.map((s) => {
                      let rowClass = "";
                      if (s.status === "running") rowClass = styles.voipProvisionRunning;
                      else if (s.status === "done") rowClass = styles.voipProvisionDone;
                      else if (s.status === "error") rowClass = styles.voipProvisionError;
                      else if (s.status === "skipped") rowClass = styles.voipProvisionSkipped;
                      return (
                        <li
                          key={s.id}
                          className={`${styles.voipProvisionStepRow} ${rowClass}`.trim()}
                        >
                          <span className={styles.voipProvisionStepIconCell}>
                            <StepStatusIcon status={s.status} />
                          </span>
                          <span className={styles.voipProvisionStepText}>
                            <span className={styles.voipProvisionStepTitle}>{s.label}</span>
                            <span className={styles.voipProvisionStepStatus}>
                              {" "}
                              — {STATUS_LABELS[s.status] || s.status}
                            </span>
                            {s.message ? (
                              <div className={styles.voipProvisionStepMsg}>{s.message}</div>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
              <div className={styles.voipModalFooter}>
                <button
                  type="button"
                  className={styles.receiptConfigBtn}
                  onClick={closeModal}
                  disabled={provisionBusy}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.receiptConfigBtnPrimary} disabled={provisionBusy}>
                  {provisionBusy ? "Provisionando…" : "Criar trunk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
