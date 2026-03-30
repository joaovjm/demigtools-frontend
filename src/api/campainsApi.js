import apiClient from "../services/apiClient.js";

export function fetchActiveCampains() {
  return apiClient.get("/campains/active").then((r) => r.data?.data ?? r.data);
}

/** Lista mínima: id e campain_name (menos tráfego que GET /campains/active). */
export function fetchActiveCampainsSummary() {
  return apiClient
    .get("/campains/active/summary")
    .then((r) => r.data?.data ?? r.data);
}

export function createCampainRequest(campain_name) {
  return apiClient.post("/campains", { campain_name }).then((r) => r.data);
}

export function patchCampainRequest(id, campain_name) {
  return apiClient.patch(`/campains/${id}`, { campain_name }).then((r) => r.data);
}

export function deleteCampainRequest(id) {
  return apiClient.delete(`/campains/${id}`).then((r) => r.data);
}

export function fetchCampainTexts(campain_id) {
  return apiClient.get("/campain-texts", { params: { campain_id } }).then((r) => r.data);
}

export function fetchCampainTextById(id) {
  return apiClient
    .get(`/campain-texts/${encodeURIComponent(id)}`)
    .then((r) => r.data);
}

/** Texto sem colunas image/video (menos dados do banco). */
export function fetchCampainTextBodyById(id) {
  return apiClient
    .get(`/campain-texts/${encodeURIComponent(id)}`, { params: { lean: true } })
    .then((r) => r.data);
}

/** Só image e video, após saber que existem (has_image / has_video na lista). */
export function fetchCampainTextMediaById(id) {
  return apiClient
    .get(`/campain-texts/${encodeURIComponent(id)}/media`)
    .then((r) => r.data);
}

export function createCampainTextRequest(payload) {
  return apiClient.post("/campain-texts", payload).then((r) => r.data);
}

export function patchCampainTextRequest(id, payload) {
  return apiClient.patch(`/campain-texts/${id}`, payload).then((r) => r.data);
}

export function deleteCampainTextRequest(id, hardDelete = false) {
  return apiClient
    .delete(`/campain-texts/${id}`, { params: { hardDelete } })
    .then((r) => r.data);
}
