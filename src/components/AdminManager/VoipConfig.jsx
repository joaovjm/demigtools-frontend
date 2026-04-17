import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  deleteVoipExtension,
  fetchOperatorVoipAssignments,
  fetchVoipAmiStatus,
  fetchVoipExtensions,
  fetchVoipSettings,
  fetchVoipStatus,
  patchVoipExtension,
  patchVoipSettings,
  postVoipExtension,
  putOperatorVoipAssignment,
} from "../../api/voipApi.js";
import styles from "../../pages/AdminManager/adminmanager.module.css";
import voip from "./voipConfig.module.css";

const emptyExtForm = { label: "", sip_user: "", sip_password: "" };

const TABS = [
  { id: "extensions", label: "Lista de ramais" },
  { id: "operators", label: "Operadoras e ramais" },
  { id: "settings", label: "Configuração" },
];

const VoipConfig = () => {
  const [activeTab, setActiveTab] = useState("extensions");
  const [settings, setSettings] = useState(null);
  const [extensions, setExtensions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [status, setStatus] = useState(null);
  const [amiStatus, setAmiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extForm, setExtForm] = useState(emptyExtForm);
  const [editingId, setEditingId] = useState(null);
  const [amiPasswordDraft, setAmiPasswordDraft] = useState("");
  const [amiMonitor, setAmiMonitor] = useState(false);
  const [amiLogLines, setAmiLogLines] = useState([]);
  const esRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stRes, exRes, asRes, statRes, amiRes] = await Promise.all([
        fetchVoipSettings(),
        fetchVoipExtensions(),
        fetchOperatorVoipAssignments(),
        fetchVoipStatus(),
        fetchVoipAmiStatus().catch(() => ({ success: false })),
      ]);
      if (stRes?.success) setSettings(stRes.data);
      if (exRes?.success) setExtensions(exRes.data || []);
      if (asRes?.success) setAssignments(asRes.data || []);
      if (statRes?.success) setStatus(statRes.data);
      if (amiRes?.success) setAmiStatus(amiRes.data);
    } catch (e) {
      toast.error(e?.message || "Erro ao carregar VoIP");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (activeTab !== "settings") return undefined;
    let cancelled = false;
    const tick = async () => {
      const amiRes = await fetchVoipAmiStatus().catch(() => null);
      if (!cancelled && amiRes?.success) setAmiStatus(amiRes.data);
    };
    tick();
    const id = setInterval(tick, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeTab]);

  useEffect(() => {
    if (!amiMonitor || activeTab !== "settings") {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      return undefined;
    }
    const url = `${window.location.origin}/api/voip/ami/stream`;
    const es = new EventSource(url);
    esRef.current = es;
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        const line = `[${payload.Event || "?"}${
          payload.Channel ? ` ${payload.Channel}` : ""
        }]`;
        setAmiLogLines((prev) => {
          const next = [...prev, `${new Date().toLocaleTimeString()} ${line}`];
          return next.length > 200 ? next.slice(-200) : next;
        });
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      /* reconexão automática do EventSource */
    };
    return () => {
      es.close();
      if (esRef.current === es) esRef.current = null;
    };
  }, [amiMonitor, activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const body = {
        enabled: settings.enabled,
        wss_url: settings.wss_url,
        sip_host: settings.sip_host,
        stun_urls: settings.stun_urls || null,
        pbx_check_port: settings.pbx_check_port != null ? Number(settings.pbx_check_port) : 5060,
        ami_enabled: Boolean(settings.ami_enabled),
        ami_host: settings.ami_host ?? "",
        ami_port: Number(settings.ami_port) || 5038,
        ami_username: settings.ami_username ?? "",
        ami_originate_context: settings.ami_originate_context ?? "from-internal",
        ami_channel_prefix: settings.ami_channel_prefix ?? "PJSIP",
      };
      const pwd = amiPasswordDraft.trim();
      if (pwd) body.ami_password = pwd;

      const res = await patchVoipSettings(body);
      if (res?.success) {
        toast.success("Configurações salvas.");
        setSettings(res.data);
        setAmiPasswordDraft("");
        const [statRes, amiRes] = await Promise.all([
          fetchVoipStatus(),
          fetchVoipAmiStatus().catch(() => null),
        ]);
        if (statRes?.success) setStatus(statRes.data);
        if (amiRes?.success) setAmiStatus(amiRes.data);
      } else toast.error(res?.message || "Falha ao salvar");
    } catch (err) {
      toast.error(err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExtension = async (e) => {
    e.preventDefault();
    if (!extForm.label?.trim() || !extForm.sip_user?.trim()) {
      toast.warning("Preencha rótulo e usuário SIP WebRTC.");
      return;
    }
    if (!editingId && !extForm.sip_password) {
      toast.warning("Informe a senha do ramal.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const body = {
          label: extForm.label.trim(),
          sip_user: extForm.sip_user.trim(),
        };
        if (extForm.sip_password) body.sip_password = extForm.sip_password;
        const res = await patchVoipExtension(editingId, body);
        if (res?.success) {
          toast.success("Ramal atualizado.");
          setExtForm(emptyExtForm);
          setEditingId(null);
          await loadAll();
        } else toast.error(res?.message || "Erro ao atualizar");
      } else {
        const res = await postVoipExtension({
          label: extForm.label.trim(),
          sip_user: extForm.sip_user.trim(),
          sip_password: extForm.sip_password,
        });
        if (res?.success) {
          toast.success("Ramal criado.");
          setExtForm(emptyExtForm);
          await loadAll();
        } else toast.error(res?.message || "Erro ao criar");
      }
    } catch (err) {
      toast.error(err?.message || "Erro ao salvar ramal");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExtension = async (id) => {
    if (!window.confirm("Excluir este ramal?")) return;
    setSaving(true);
    try {
      const res = await deleteVoipExtension(id);
      if (res?.success) {
        toast.success("Ramal removido.");
        await loadAll();
      } else toast.error(res?.message || "Não foi possível excluir");
    } catch (err) {
      toast.error(err?.message || "Erro ao excluir");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (ext) => {
    setEditingId(ext.id);
    setExtForm({
      label: ext.label || "",
      sip_user: ext.sip_user || "",
      sip_password: "",
    });
  };

  const handleAssignmentChange = async (operatorCodeId, voipExtensionId) => {
    setSaving(true);
    try {
      const res = await putOperatorVoipAssignment({
        operator_code_id: operatorCodeId,
        voip_extension_id: voipExtensionId === "" ? null : Number(voipExtensionId),
      });
      if (res?.success) {
        toast.success("Vínculo atualizado.");
        await loadAll();
      } else toast.error(res?.message || "Erro ao vincular");
    } catch (err) {
      toast.error(err?.message || "Erro ao vincular");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className={styles.receiptConfigContainer}>
        <p className={voip.loadingText}>Carregando configurações VoIP…</p>
      </div>
    );
  }

  return (
    <div className={styles.receiptConfigContainer}>
      <div className={`${styles.receiptConfigContent} ${voip.voipScroll}`}>
        <div className={voip.root}>
          <h3 className={voip.title}>Configurações do VoIP (FreePBX / Asterisk)</h3>

          <div className={voip.tabsRow} role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                className={`${voip.tab} ${activeTab === t.id ? voip.tabActive : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "extensions" ? (
            <div className={voip.tabPanel}>
              <form onSubmit={handleAddExtension} className={voip.formStack}>
                <div className={voip.section}>
                  <h4>Ramais WebRTC</h4>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup}>
                      <label>Rótulo</label>
                      <input
                        className={voip.input}
                        value={extForm.label}
                        onChange={(e) =>
                          setExtForm((f) => ({ ...f, label: e.target.value }))
                        }
                      />
                    </div>
                    <div className={voip.formGroup}>
                      <label>Usuário SIP (ex.: número do ramal PJSIP WebRTC)</label>
                      <input
                        className={voip.input}
                        value={extForm.sip_user}
                        onChange={(e) =>
                          setExtForm((f) => ({ ...f, sip_user: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>Senha {editingId ? "(vazio = manter)" : ""}</label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        className={voip.input}
                        value={extForm.sip_password}
                        onChange={(e) =>
                          setExtForm((f) => ({ ...f, sip_password: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className={voip.actions}>
                    <button
                      type="submit"
                      className={styles.receiptConfigBtnPrimary}
                      disabled={saving}
                    >
                      {editingId ? "Atualizar ramal" : "Adicionar ramal"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        className={styles.receiptConfigBtn}
                        onClick={() => {
                          setEditingId(null);
                          setExtForm(emptyExtForm);
                        }}
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>

              <div className={voip.section}>
                <h4>Lista de ramais</h4>
                {extensions.length === 0 ? (
                  <p className={voip.hint}>Nenhum ramal cadastrado.</p>
                ) : (
                  extensions.map((ex) => (
                    <div key={ex.id} className={voip.extRow}>
                      <span className={voip.cell}>{ex.label}</span>
                      <span className={voip.cell}>{ex.sip_user}</span>
                      <span className={voip.cell}>
                        {ex.password_set ? "senha OK" : "—"}
                      </span>
                      <span className={voip.cell} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className={styles.receiptConfigBtnPrimary}
                          onClick={() => startEdit(ex)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={styles.receiptConfigBtn}
                          onClick={() => handleDeleteExtension(ex.id)}
                        >
                          Excluir
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {activeTab === "operators" ? (
            <div className={voip.tabPanel}>
              <div className={voip.section}>
                <h4>Operadoras e ramais</h4>
                <p className={voip.hint}>
                  Somente operadores ativos. Defina o ramal usado nas chamadas pela página do doador.
                </p>
                {assignments.map((row) => (
                  <div key={row.operator_code_id} className={voip.assignRow}>
                    <div className={voip.formGroup}>
                      <label>
                        {row.operator_name || "—"} ({row.operator_code_id})
                      </label>
                      <select
                        className={voip.input}
                        value={row.voip_extension_id ?? ""}
                        onChange={(e) =>
                          handleAssignmentChange(row.operator_code_id, e.target.value)
                        }
                        disabled={saving}
                        style={{ height: 30 }}
                      >
                        <option value="">— sem ramal —</option>
                        {extensions.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.label} ({ex.sip_user})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "settings" ? (
            <div className={voip.tabPanel}>
              <p className={voip.hint}>
                WebRTC: extensões PJSIP com WebSocket (ex.: wss://servidor:8089/ws). AMI: usuário no manager.conf
                (porta 5038) para originate e eventos em tempo real.
              </p>

              {status ? (
                <div className={voip.section}>
                  <h4>Status WebRTC</h4>
                  <p className={voip.statusText}>
                    {status.message}
                    {status.pbxReachable != null && (
                      <>
                        {" "}
                        · TCP {status.sipHost || "—"}:{" "}
                        {status.pbxReachable ? "OK" : "sem resposta"}
                      </>
                    )}
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleSaveSettings} className={voip.formStack}>
                <div className={voip.section}>
                  <h4>Conexão WebRTC / SIP</h4>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup}>
                      <label>Ativar VoIP (navegador)</label>
                      <input
                        type="checkbox"
                        checked={Boolean(settings?.enabled)}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, enabled: e.target.checked }))
                        }
                        className={voip.input}
                        style={{ width: 18, height: 18 }}
                      />
                    </div>
                    <div className={voip.formGroup}>
                      <label>Porta verificação TCP</label>
                      <input
                        type="number"
                        className={voip.input}
                        title="5060: SIP. 8089: HTTP TLS (WSS), útil no FreePBX."
                        value={settings?.pbx_check_port ?? 5060}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, pbx_check_port: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup}>
                      <label>URL WebSocket (WSS)</label>
                      <input
                        type="text"
                        className={voip.input}
                        placeholder="wss://host:8089/ws"
                        value={settings?.wss_url || ""}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, wss_url: e.target.value }))
                        }
                      />
                    </div>
                    <div className={voip.formGroup}>
                      <label>Host SIP (domínio do ramal / realm)</label>
                      <input
                        type="text"
                        className={voip.input}
                        placeholder="pbx.empresa.local"
                        value={settings?.sip_host || ""}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, sip_host: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>STUN (opcional)</label>
                      <input
                        type="text"
                        className={voip.input}
                        placeholder="stun:stun.l.google.com:19302"
                        value={settings?.stun_urls || ""}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, stun_urls: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className={voip.section}>
                  <h4>AMI (Asterisk Manager — FreePBX)</h4>
                  <p className={voip.hint}>
                    Permite originate (click-to-call pela API) e monitoramento de eventos. Crie o utilizador em{" "}
                    <strong>Settings → Asterisk Manager Users</strong> no FreePBX.
                  </p>
                  {amiStatus ? (
                    <p className={voip.statusText}>
                      AMI: {amiStatus.connected ? "conectado" : "desconectado"}
                      {amiStatus.lastError ? ` — ${amiStatus.lastError}` : ""}
                    </p>
                  ) : null}
                  <div className={voip.formRow}>
                    <div className={voip.formGroup}>
                      <label>Ativar AMI no backend</label>
                      <input
                        type="checkbox"
                        checked={Boolean(settings?.ami_enabled)}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, ami_enabled: e.target.checked }))
                        }
                        className={voip.input}
                        style={{ width: 18, height: 18 }}
                      />
                    </div>
                    <div className={voip.formGroup}>
                      <label>Porta AMI</label>
                      <input
                        type="number"
                        className={voip.input}
                        value={settings?.ami_port ?? 5038}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, ami_port: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup}>
                      <label>Host / IP do Asterisk</label>
                      <input
                        type="text"
                        className={voip.input}
                        placeholder="192.168.1.18"
                        value={settings?.ami_host || ""}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, ami_host: e.target.value }))
                        }
                      />
                    </div>
                    <div className={voip.formGroup}>
                      <label>Utilizador AMI</label>
                      <input
                        type="text"
                        className={voip.input}
                        placeholder="myapp"
                        value={settings?.ami_username || ""}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, ami_username: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>
                        Senha AMI{" "}
                        {settings?.ami_password_set ? "(vazio = manter)" : ""}
                      </label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        className={voip.input}
                        value={amiPasswordDraft}
                        onChange={(e) => setAmiPasswordDraft(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup}>
                      <label>Contexto originate</label>
                      <input
                        type="text"
                        className={voip.input}
                        placeholder="from-internal"
                        value={settings?.ami_originate_context || ""}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            ami_originate_context: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className={voip.formGroup}>
                      <label>Prefixo do canal</label>
                      <input
                        type="text"
                        className={voip.input}
                        placeholder="PJSIP"
                        value={settings?.ami_channel_prefix || ""}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            ami_channel_prefix: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className={voip.formRow}>
                    <div className={voip.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={amiMonitor}
                          onChange={(e) => {
                            setAmiMonitor(e.target.checked);
                            if (!e.target.checked) setAmiLogLines([]);
                          }}
                          style={{ marginRight: 8, width: 16, height: 16, verticalAlign: "middle" }}
                        />
                        Monitorar eventos AMI (SSE)
                      </label>
                      {amiMonitor ? (
                        <div className={voip.amiEventLog}>
                          {amiLogLines.length === 0 ? (
                            <span className={voip.hint}>Aguardando eventos…</span>
                          ) : (
                            amiLogLines.map((line, i) => (
                              <div key={`${i}-${line.slice(0, 24)}`}>{line}</div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={`${voip.actions} ${voip.actionsCenter}`}>
                  <button
                    type="submit"
                    className={styles.receiptConfigBtnPrimary}
                    disabled={saving}
                  >
                    {saving ? "Salvando…" : "Salvar configuração"}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default VoipConfig;
