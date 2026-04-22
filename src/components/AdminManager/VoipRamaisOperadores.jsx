import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "../../pages/AdminManager/adminmanager.module.css";
import {
  deleteAdminVoipExtension,
  fetchAdminVoipExtensions,
  fetchAdminVoipOperatorAssignments,
  patchAdminVoipExtension,
  postAdminVoipExtensionProvisionStream,
  putAdminVoipOperatorAssignment,
} from "../../api/voipApi";

const emptyNew = () => ({ label: "", sip_user: "", sip_password: "" });

const STEP_LABELS = {
  validate: "Validação",
  db_precheck: "Conferência no cadastro",
  volume: "Caminho local (volume)",
  pjsip_read: "Ler pjsip.conf",
  pjsip_dup: "Conflito no arquivo",
  pjsip_write: "Gravar pjsip.conf",
  asterisk_reload: "Reload PJSIP no Asterisk",
  asterisk_verify: "Verificar endpoint",
  db_insert: "Salvar no DemigTools",
  provision: "Provisionamento",
};

const STATUS_LABELS = {
  running: "em andamento",
  done: "concluído",
  error: "erro",
  skipped: "ignorado",
};

function upsertProvisionStep(rows, ev) {
  if (ev.type !== "step") return rows;
  const label = STEP_LABELS[ev.id] || ev.id;
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

export function VoipRamaisTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newExt, setNewExt] = useState(emptyNew());
  const [editing, setEditing] = useState(null);
  const [provisionSteps, setProvisionSteps] = useState([]);
  const [provisionBusy, setProvisionBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminVoipExtensions();
      if (res?.success) setList(res.data || []);
      else toast.error(res?.message || "Erro ao carregar ramais");
    } catch (e) {
      toast.error("Erro ao carregar ramais");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setProvisionBusy(true);
    setProvisionSteps([]);
    try {
      const complete = await postAdminVoipExtensionProvisionStream(newExt, (ev) => {
        if (ev?.type === "step") setProvisionSteps((prev) => upsertProvisionStep(prev, ev));
      });
      if (complete?.success) {
        toast.success("Ramal cadastrado.");
        setNewExt(emptyNew());
        await reload();
      } else {
        const msg = complete?.message || "Falha no provisionamento";
        toast.error(msg);
        if (complete?.detail) {
          console.warn("Detalhe Asterisk:", complete.detail);
        }
      }
    } catch (err) {
      toast.error(err?.message || "Erro ao criar ramal");
    } finally {
      setProvisionBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir este ramal?")) return;
    try {
      const res = await deleteAdminVoipExtension(id);
      if (!res?.success) {
        toast.error(res?.message || "Erro ao excluir");
        return;
      }
      toast.success("Ramal removido.");
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Erro ao excluir");
    }
  };

  const startEdit = (row) => {
    setEditing({
      id: row.id,
      label: row.label,
      sip_user: row.sip_user,
      sip_password: "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const payload = {
        label: editing.label,
        sip_user: editing.sip_user,
      };
      if (editing.sip_password?.trim()) payload.sip_password = editing.sip_password;
      const res = await patchAdminVoipExtension(editing.id, payload);
      if (!res?.success) {
        toast.error(res?.message || "Erro ao salvar");
        return;
      }
      toast.success("Ramal atualizado.");
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Erro ao salvar ramal");
    }
  };

  if (loading) {
    return <p className={styles.voipHint}>Carregando ramais…</p>;
  }

  return (
    <div className={styles.voipRamaisWrap}>
      <div className={styles.receiptConfigSection}>
        <h4>Novo ramal</h4>
        <form className={styles.voipNewExtForm} onSubmit={handleCreate}>
          <input
            className={styles.receiptConfigInput}
            placeholder="Rótulo (ex.: Maria — escritório)"
            value={newExt.label}
            onChange={(e) => setNewExt((p) => ({ ...p, label: e.target.value }))}
            disabled={provisionBusy}
          />
          <input
            className={styles.receiptConfigInput}
            placeholder="Usuário SIP / ramal"
            value={newExt.sip_user}
            onChange={(e) => setNewExt((p) => ({ ...p, sip_user: e.target.value }))}
            disabled={provisionBusy}
          />
          <input
            className={styles.receiptConfigInput}
            type="password"
            placeholder="Senha SIP"
            value={newExt.sip_password}
            onChange={(e) => setNewExt((p) => ({ ...p, sip_password: e.target.value }))}
            autoComplete="new-password"
            disabled={provisionBusy}
          />
          <button type="submit" className={styles.receiptConfigBtnPrimary} disabled={provisionBusy}>
            {provisionBusy ? "Provisionando…" : "Adicionar"}
          </button>
        </form>
        <p className={styles.voipHint}>
          <strong>Na mesma VPS:</strong> monte o volume das configs do Asterisk no container da API e
          defina <code>VOIP_PJSIP_LOCAL_PATH</code> com o caminho <em>absoluto dentro do container</em>{" "}
          (ex.: <code>/app/asterisk-config/pjsip.conf</code>). A API anexa o bloco ao{" "}
          <code>pjsip.conf</code> e grava o ramal no banco; no Asterisk use{" "}
          <code>module reload res_pjsip</code> se precisar aplicar na hora. Sem{" "}
          <code>VOIP_PJSIP_LOCAL_PATH</code>, apenas o cadastro no banco é criado.
        </p>
        {provisionSteps.length > 0 && (
          <ol className={styles.voipProvisionSteps}>
            {provisionSteps.map((s) => {
              let statusClass = "";
              if (s.status === "running") statusClass = styles.voipProvisionRunning;
              else if (s.status === "done") statusClass = styles.voipProvisionDone;
              else if (s.status === "error") statusClass = styles.voipProvisionError;
              else if (s.status === "skipped") statusClass = styles.voipProvisionSkipped;
              return (
                <li key={s.id} className={`${styles.voipProvisionStep} ${statusClass}`.trim()}>
                  <span className={styles.voipProvisionStepTitle}>{s.label}</span>
                  <span className={styles.voipProvisionStepStatus}>
                    {" "}
                    — {STATUS_LABELS[s.status] || s.status}
                  </span>
                  {s.message ? (
                    <div className={styles.voipProvisionStepMsg}>{s.message}</div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className={styles.receiptConfigSection}>
        <h4>Ramais cadastrados</h4>
        <div className={styles.voipTableScroll}>
          <table className={styles.voipTable}>
            <thead>
              <tr>
                <th>Rótulo</th>
                <th>Usuário SIP</th>
                <th>Senha</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  {editing?.id === row.id ? (
                    <>
                      <td>
                        <input
                          className={styles.receiptConfigInput}
                          value={editing.label}
                          onChange={(e) => setEditing((p) => ({ ...p, label: e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          className={styles.receiptConfigInput}
                          value={editing.sip_user}
                          onChange={(e) => setEditing((p) => ({ ...p, sip_user: e.target.value }))}
                        />
                      </td>
                      <td>
                        <input
                          className={styles.receiptConfigInput}
                          type="password"
                          placeholder={row.sip_password_set ? "(manter)" : ""}
                          value={editing.sip_password}
                          onChange={(e) =>
                            setEditing((p) => ({ ...p, sip_password: e.target.value }))
                          }
                          autoComplete="new-password"
                        />
                      </td>
                      <td className={styles.voipTableActions}>
                        <button
                          type="button"
                          className={styles.receiptConfigBtnPrimary}
                          onClick={saveEdit}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          className={styles.receiptConfigBtn}
                          onClick={() => setEditing(null)}
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{row.label}</td>
                      <td>{row.sip_user}</td>
                      <td>{row.sip_password_set ? "••••••" : "—"}</td>
                      <td className={styles.voipTableActions}>
                        <button
                          type="button"
                          className={styles.receiptConfigBtn}
                          onClick={() => startEdit(row)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={styles.receiptConfigBtn}
                          onClick={() => handleDelete(row.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className={styles.voipHint}>Nenhum ramal cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VoipOperadoresTab() {
  const [rows, setRows] = useState([]);
  const [exts, setExts] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetchAdminVoipOperatorAssignments(),
        fetchAdminVoipExtensions(),
      ]);
      if (a?.success) setRows(a.data || []);
      else toast.error(a?.message || "Erro ao carregar operadores");
      if (b?.success) setExts(b.data || []);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const onSelectRamal = async (operatorCodeId, rawValue) => {
    const voip_extension_id =
      rawValue === "" || rawValue === "__none__" ? null : Number(rawValue);
    try {
      const res = await putAdminVoipOperatorAssignment(operatorCodeId, voip_extension_id);
      if (!res?.success) {
        toast.error(res?.message || "Erro ao salvar vínculo");
        return;
      }
      toast.success("Ramal associado ao operador.");
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Erro ao salvar vínculo");
    }
  };

  if (loading) {
    return <p className={styles.voipHint}>Carregando operadores ativos…</p>;
  }

  return (
    <div className={styles.voipRamaisWrap}>
      <p className={styles.voipHint}>
        Somente operadores com <strong>operator_active</strong> verdadeiro aparecem aqui. Cada ramal
        pode estar ligado a no máximo um operador.
      </p>
      <div className={styles.voipTableScroll}>
        <table className={styles.voipTable}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Ramal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.operator_code_id}>
                <td>{r.operator_code_id}</td>
                <td>{r.operator_name}</td>
                <td>{r.operator_type}</td>
                <td>
                  <select
                    className={styles.receiptConfigInput}
                    value={r.voip_extension_id != null ? String(r.voip_extension_id) : "__none__"}
                    onChange={(e) => onSelectRamal(r.operator_code_id, e.target.value)}
                  >
                    <option value="__none__">— Nenhum —</option>
                    {exts.map((ex) => (
                      <option key={ex.id} value={String(ex.id)}>
                        {ex.label} ({ex.sip_user})
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className={styles.voipHint}>Nenhum operador ativo encontrado.</p>
        )}
      </div>
    </div>
  );
}
