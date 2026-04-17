import apiClient from "../services/apiClient.js";

export async function fetchVoipStatus(operatorCodeId) {
  const { data } = await apiClient.get("/voip/status", {
    params: { operatorCodeId },
  });
  return data;
}

export async function fetchVoipClientConfig(operatorCodeId) {
  const { data } = await apiClient.get("/voip/client-config", {
    params: { operatorCodeId },
  });
  return data;
}

export async function fetchVoipSettings() {
  const { data } = await apiClient.get("/voip/settings");
  return data;
}

export async function patchVoipSettings(payload) {
  const { data } = await apiClient.patch("/voip/settings", payload);
  return data;
}

export async function fetchVoipExtensions() {
  const { data } = await apiClient.get("/voip/extensions");
  return data;
}

export async function postVoipExtension(payload) {
  const { data } = await apiClient.post("/voip/extensions", payload);
  return data;
}

export async function patchVoipExtension(id, payload) {
  const { data } = await apiClient.patch(`/voip/extensions/${id}`, payload);
  return data;
}

export async function deleteVoipExtension(id) {
  const { data } = await apiClient.delete(`/voip/extensions/${id}`);
  return data;
}

export async function fetchOperatorVoipAssignments() {
  const { data } = await apiClient.get("/voip/operator-assignments");
  return data;
}

export async function putOperatorVoipAssignment(payload) {
  const { data } = await apiClient.put("/voip/operator-assignments", payload);
  return data;
}

export async function fetchVoipAmiStatus() {
  const { data } = await apiClient.get("/voip/ami/status");
  return data;
}

export async function postVoipAmiOriginate(payload) {
  const { data } = await apiClient.post("/voip/ami/originate", payload);
  return data;
}
