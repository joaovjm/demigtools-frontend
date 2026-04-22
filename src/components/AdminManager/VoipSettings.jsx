import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "../../pages/AdminManager/adminmanager.module.css";
import {
  fetchAdminVoipSettings,
  patchAdminVoipSettings,
  postAdminVoipTestConnection,
} from "../../api/voipApi";
import { VoipOperadoresTab, VoipRamaisTab } from "./VoipRamaisOperadores";
import { VoipRecordingsTab } from "./VoipRecordings";
import { VoipTrunksTab } from "./VoipTrunks";

const emptyForm = () => ({
  enabled: false,
  ari_url: "",
  ari_username: "",
  ari_password: "",
  originate_endpoint_template: "",
  dial_prefix: "",
  caller_id: "",
  stasis_app: "",
  stasis_app_args: "",
  originate_context: "",
  originate_extension: "",
  originate_priority: 1,
  webrtc_enabled: false,
  webrtc_ws_url: "",
  webrtc_sip_domain: "",
  webrtc_ice_servers: "[]",
  webrtc_display_name: "{operator_name}",
  webrtc_register_expires: 300,
  webrtc_dial_prefix: "",
  webrtc_target_template: "sip:{number}@{sip_domain}",
  webrtc_default_ddd: "",
});

const VoipSettings = () => {
  const [innerTab, setInnerTab] = useState("connection");
  const [inEdit, setInEdit] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [ariPasswordSet, setAriPasswordSet] = useState(false);
  const [testing, setTesting] = useState(false);

  const load = async () => {
    try {
      const res = await fetchAdminVoipSettings();
      const d = res?.data;
      if (!d) return;
      setAriPasswordSet(Boolean(d.ari_password_set));
      setForm({
        ...emptyForm(),
        enabled: Boolean(d.enabled),
        ari_url: d.ari_url || "",
        ari_username: d.ari_username || "",
        ari_password: "",
        originate_endpoint_template: d.originate_endpoint_template || "",
        dial_prefix: d.dial_prefix || "",
        caller_id: d.caller_id || "",
        stasis_app: d.stasis_app || "",
        stasis_app_args: d.stasis_app_args || "",
        originate_context: d.originate_context || "",
        originate_extension: d.originate_extension || "",
        originate_priority: Number(d.originate_priority) || 1,
        webrtc_enabled: Boolean(d.webrtc_enabled),
        webrtc_ws_url: d.webrtc_ws_url || "",
        webrtc_sip_domain: d.webrtc_sip_domain || "",
        webrtc_ice_servers: d.webrtc_ice_servers || "[]",
        webrtc_display_name: d.webrtc_display_name || "{operator_name}",
        webrtc_register_expires: Number(d.webrtc_register_expires) || 300,
        webrtc_dial_prefix: d.webrtc_dial_prefix || "",
        webrtc_target_template: d.webrtc_target_template || "sip:{number}@{sip_domain}",
        webrtc_default_ddd: d.webrtc_default_ddd || "",
      });
    } catch (e) {
      toast.error("Não foi possível carregar as configurações VoIP");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!inEdit) {
      setInEdit(true);
      return;
    }
    try {
      const payload = { ...form };
      if (!payload.ari_password?.trim()) {
        delete payload.ari_password;
      }
      const res = await patchAdminVoipSettings(payload);
      if (!res?.success) {
        toast.error(res?.message || "Erro ao salvar");
        return;
      }
      toast.success("Configuração VoIP salva.");
      setInEdit(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Erro ao salvar VoIP");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await postAdminVoipTestConnection();
      if (!res?.success) {
        toast.error(res?.message || "Teste falhou");
      } else {
        toast.success(`Conexão ARI ok${res.data?.systemName ? `: ${res.data.systemName}` : ""}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Teste de conexão falhou");
    } finally {
      setTesting(false);
    }
  };

  const innerTabs = [
    { id: "connection", label: "Conexão ARI" },
    { id: "dial", label: "Discagem" },
    { id: "flow", label: "Fluxo (Stasis / dialplan)" },
    { id: "webrtc", label: "WebRTC / JSSIP" },
    { id: "extensions", label: "Ramais" },
    { id: "trunks", label: "Trunks" },
    { id: "operators", label: "Operadores" },
    { id: "recordings", label: "Gravações" },
  ];

  const showAriActions = ["connection", "dial", "flow", "webrtc"].includes(innerTab);

  return (
    <div className={styles.receiptConfigContainer}>
      <div className={styles.receiptConfigContent}>
        <h3 className={styles.receiptConfigTitle}>VoIP — Asterisk ARI + WebRTC</h3>
        <p className={styles.voipIntro}>
          O backend usa o pacote <code>ari-client</code> para originar canais. Ajuste o endpoint e o
          fluxo conforme o dialplan do seu Asterisk / FreePBX.
        </p>

        <div className={styles.whatsappManagerTabs}>
          {innerTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.whatsappManagerTab} ${
                innerTab === t.id ? styles.active : ""
              }`}
              onClick={() => setInnerTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.whatsappManagerContent}>
          {innerTab === "connection" && (
            <div className={styles.receiptConfigForm}>
              <div className={styles.receiptConfigSection}>
                <h4>Conexão</h4>
                <div className={styles.formRow}>
                  <label className={styles.voipCheck}>
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(e) => change("enabled", e.target.checked)}
                      disabled={!inEdit}
                    />
                    VoIP ativo (botão &quot;Ligar&quot; na ficha do doador)
                  </label>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>URL base do ARI</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.ari_url}
                      onChange={(e) => change("ari_url", e.target.value)}
                      disabled={!inEdit}
                      placeholder="http://192.168.1.10:8088"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Usuário ARI</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.ari_username}
                      onChange={(e) => change("ari_username", e.target.value)}
                      disabled={!inEdit}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Senha ARI {ariPasswordSet ? "(já definida — deixe em branco para manter)" : ""}</label>
                    <input
                      className={styles.receiptConfigInput}
                      type="password"
                      value={form.ari_password}
                      onChange={(e) => change("ari_password", e.target.value)}
                      disabled={!inEdit}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {innerTab === "dial" && (
            <div className={styles.receiptConfigForm}>
              <div className={styles.receiptConfigSection}>
                <h4>Endpoint e número</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 2 }}>
                    <label>Modelo de endpoint (obrigatório: {"{number}"})</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.originate_endpoint_template}
                      onChange={(e) => change("originate_endpoint_template", e.target.value)}
                      disabled={!inEdit}
                      placeholder="PJSIP/{number}@trunk-externo"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Prefixo de discagem (só dígitos, ex.: 55)</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.dial_prefix}
                      onChange={(e) => change("dial_prefix", e.target.value)}
                      disabled={!inEdit}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Caller ID (opcional)</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.caller_id}
                      onChange={(e) => change("caller_id", e.target.value)}
                      disabled={!inEdit}
                      placeholder="Nome &lt;5511999999999&gt;"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {innerTab === "extensions" && <VoipRamaisTab />}

          {innerTab === "trunks" && <VoipTrunksTab />}

          {innerTab === "operators" && <VoipOperadoresTab />}

          {innerTab === "recordings" && <VoipRecordingsTab />}

          {innerTab === "flow" && (
            <div className={styles.receiptConfigForm}>
              <div className={styles.receiptConfigSection}>
                <h4>Stasis (recomendado para apps ARI)</h4>
                <p className={styles.voipHint}>
                  Se preencher a aplicação Stasis, o originate envia <code>app</code> e{" "}
                  <code>appArgs</code>. O Asterisk precisa carregar essa app no dialplan.
                </p>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Nome da aplicação Stasis</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.stasis_app}
                      onChange={(e) => change("stasis_app", e.target.value)}
                      disabled={!inEdit}
                      placeholder="meu_app"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Argumentos (appArgs)</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.stasis_app_args}
                      onChange={(e) => change("stasis_app_args", e.target.value)}
                      disabled={!inEdit}
                      placeholder="demigtools"
                    />
                  </div>
                </div>
              </div>
              <div className={styles.receiptConfigSection}>
                <h4>Ou contexto + extensão (dialplan)</h4>
                <p className={styles.voipHint}>
                  Se não usar Stasis, preencha contexto e extensão. A extensão pode conter{" "}
                  <code>{"{number}"}</code> (número já com prefixo).
                </p>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Contexto</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.originate_context}
                      onChange={(e) => change("originate_context", e.target.value)}
                      disabled={!inEdit}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Extensão</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.originate_extension}
                      onChange={(e) => change("originate_extension", e.target.value)}
                      disabled={!inEdit}
                      placeholder="{number} ou s"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Prioridade</label>
                    <input
                      className={styles.receiptConfigInput}
                      type="number"
                      min={1}
                      value={form.originate_priority}
                      onChange={(e) => change("originate_priority", Number(e.target.value) || 1)}
                      disabled={!inEdit}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {innerTab === "webrtc" && (
            <div className={styles.receiptConfigForm}>
              <div className={styles.receiptConfigSection}>
                <h4>Registro WebRTC no navegador</h4>
                <p className={styles.voipHint}>
                  O botão de ligação no doador usa JSSIP com WSS e ramal vinculado ao operador.
                </p>
                <div className={styles.formRow}>
                  <label className={styles.voipCheck}>
                    <input
                      type="checkbox"
                      checked={form.webrtc_enabled}
                      onChange={(e) => change("webrtc_enabled", e.target.checked)}
                      disabled={!inEdit}
                    />
                    Habilitar chamadas WebRTC no navegador
                  </label>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>WSS do Asterisk/FreePBX</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.webrtc_ws_url}
                      onChange={(e) => change("webrtc_ws_url", e.target.value)}
                      disabled={!inEdit}
                      placeholder="wss://pbx.seudominio.com:8089/ws"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Domínio SIP</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.webrtc_sip_domain}
                      onChange={(e) => change("webrtc_sip_domain", e.target.value)}
                      disabled={!inEdit}
                      placeholder="pbx.seudominio.com"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>ICE servers (JSON)</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.webrtc_ice_servers}
                      onChange={(e) => change("webrtc_ice_servers", e.target.value)}
                      disabled={!inEdit}
                      placeholder='[{"urls":"stun:stun.l.google.com:19302"}]'
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Display Name (template)</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.webrtc_display_name}
                      onChange={(e) => change("webrtc_display_name", e.target.value)}
                      disabled={!inEdit}
                      placeholder="{operator_name}"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Register expires (s)</label>
                    <input
                      className={styles.receiptConfigInput}
                      type="number"
                      min={60}
                      value={form.webrtc_register_expires}
                      onChange={(e) => change("webrtc_register_expires", Number(e.target.value) || 300)}
                      disabled={!inEdit}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Prefixo de discagem WebRTC (somente digitos)</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.webrtc_dial_prefix}
                      onChange={(e) => change("webrtc_dial_prefix", e.target.value)}
                      disabled={!inEdit}
                      placeholder="55"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Template de destino SIP (INVITE)</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.webrtc_target_template}
                      onChange={(e) => change("webrtc_target_template", e.target.value)}
                      disabled={!inEdit}
                      placeholder="sip:{number}@{sip_domain}"
                    />
                  </div>
                </div>
                <p className={styles.voipHint}>
                  Placeholders: <code>{"{number}"}</code> (numero com prefixo),{" "}
                  <code>{"{sip_domain}"}</code>, <code>{"{raw_number}"}</code> (sem prefixo).
                </p>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>DDD padrão (2 dígitos, ex.: 21)</label>
                    <input
                      className={styles.receiptConfigInput}
                      value={form.webrtc_default_ddd}
                      onChange={(e) => change("webrtc_default_ddd", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      disabled={!inEdit}
                      placeholder="21"
                      maxLength={2}
                    />
                  </div>
                </div>
                <p className={styles.voipHint}>
                  Usado na ficha do doador para completar números sem DDD ou sem código do país (55) antes de
                  discar.
                </p>
              </div>
            </div>
          )}
        </div>

        {showAriActions && (
          <div className={styles.receiptConfigActions}>
            <button
              type="button"
              className={styles.receiptConfigBtn}
              onClick={handleTest}
              disabled={testing || inEdit}
            >
              {testing ? "Testando…" : "Testar conexão ARI"}
            </button>
            <button
              type="button"
              className={styles.receiptConfigBtnPrimary}
              onClick={handleSave}
            >
              {inEdit ? "Salvar" : "Editar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoipSettings;
