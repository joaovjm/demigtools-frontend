import apiClient from "../services/apiClient.js";

export function fetchVoipStatus() {
  return apiClient.get("/voip/status").then((r) => r.data);
}

export function postVoipClickCall(phone) {
  return apiClient.post("/voip/click-call", { phone }).then((r) => r.data);
}

export function fetchVoipWebrtcConfig(operatorCodeId) {
  const q = operatorCodeId ? `?operator_code_id=${encodeURIComponent(operatorCodeId)}` : "";
  return apiClient.get(`/voip/webrtc-config${q}`).then((r) => r.data);
}

export function fetchVoipRecordings() {
  return apiClient.get("/voip/recordings").then((r) => r.data);
}

export function deleteVoipRecording(filename) {
  return apiClient
    .delete(`/voip/recordings/${encodeURIComponent(filename)}`)
    .then((r) => r.data);
}

export function fetchAdminVoipSettings() {
  return apiClient.get("/admin-manager/voip-settings").then((r) => r.data);
}

export function patchAdminVoipSettings(payload) {
  return apiClient.patch("/admin-manager/voip-settings", payload).then((r) => r.data);
}

export function postAdminVoipTestConnection() {
  return apiClient.post("/admin-manager/voip/test-connection").then((r) => r.data);
}

export function fetchAdminVoipExtensions() {
  return apiClient.get("/admin-manager/voip/extensions").then((r) => r.data);
}

export function postAdminVoipExtension(payload) {
  return apiClient.post("/admin-manager/voip/extensions", payload).then((r) => r.data);
}

/**
 * Cria ramal com fluxo na VPS (NDJSON). onEvent recebe { type: 'step'|'complete', ... }.
 * @returns {Promise<object|null>} último evento `complete` ou null
 */
export async function postAdminVoipExtensionProvisionStream(payload, onEvent) {
  const url = "/api/admin-manager/voip/extensions/provision";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = res.statusText;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const j = await res.json();
        message = j.message || j.error || message;
      } catch {
        /* ignore */
      }
    } else {
      try {
        const t = await res.text();
        if (t) message = t.slice(0, 240);
      } catch {
        /* ignore */
      }
    }
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Resposta sem corpo");

  const decoder = new TextDecoder();
  let buffer = "";
  let lastComplete = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let ev;
      try {
        ev = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (typeof onEvent === "function") onEvent(ev);
      if (ev?.type === "complete") lastComplete = ev;
    }
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      const ev = JSON.parse(tail);
      if (typeof onEvent === "function") onEvent(ev);
      if (ev?.type === "complete") lastComplete = ev;
    } catch {
      /* ignore */
    }
  }

  return lastComplete;
}

export function patchAdminVoipExtension(id, payload) {
  return apiClient.patch(`/admin-manager/voip/extensions/${id}`, payload).then((r) => r.data);
}

export function deleteAdminVoipExtension(id) {
  return apiClient.delete(`/admin-manager/voip/extensions/${id}`).then((r) => r.data);
}

export function fetchAdminVoipOperatorAssignments() {
  return apiClient.get("/admin-manager/voip/operator-assignments").then((r) => r.data);
}

export function putAdminVoipOperatorAssignment(operatorCodeId, voipExtensionId) {
  return apiClient
    .put(`/admin-manager/voip/operator-assignments/${encodeURIComponent(operatorCodeId)}`, {
      voip_extension_id: voipExtensionId,
    })
    .then((r) => r.data);
}

export function fetchAdminVoipTrunks() {
  return apiClient.get("/admin-manager/voip/trunks").then((r) => r.data);
}

export function deleteAdminVoipTrunk(id) {
  return apiClient.delete(`/admin-manager/voip/trunks/${id}`).then((r) => r.data);
}

/**
 * Cria trunk com fluxo NDJSON na VPS. onEvent recebe { type: 'step'|'complete', ... }.
 * @returns {Promise<object|null>} último evento `complete` ou null
 */
export async function postAdminVoipTrunkProvisionStream(payload, onEvent) {
  const url = "/api/admin-manager/voip/trunks";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = res.statusText;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const j = await res.json();
        message = j.message || j.error || message;
      } catch {
        /* ignore */
      }
    } else {
      try {
        const t = await res.text();
        if (t) message = t.slice(0, 240);
      } catch {
        /* ignore */
      }
    }
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Resposta sem corpo");

  const decoder = new TextDecoder();
  let buffer = "";
  let lastComplete = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let ev;
      try {
        ev = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (typeof onEvent === "function") onEvent(ev);
      if (ev?.type === "complete") lastComplete = ev;
    }
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      const ev = JSON.parse(tail);
      if (typeof onEvent === "function") onEvent(ev);
      if (ev?.type === "complete") lastComplete = ev;
    } catch {
      /* ignore */
    }
  }

  return lastComplete;
}
