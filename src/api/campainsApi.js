import apiClient from "../services/apiClient.js";

/** Resposta de GET /campain-texts/:id/media — evita baixar vídeo/imagem repetidas vezes. */
const CAMPAIN_TEXT_MEDIA_TTL_MS = 60 * 60 * 1000;
const CAMPAIN_TEXT_MEDIA_MAX_ENTRIES = 40;
const campainTextMediaCache = new Map();

function invalidateCampainTextMediaCacheEntry(id) {
  const k = Number(id);
  if (Number.isFinite(k)) campainTextMediaCache.delete(k);
}

function evictOldestCampainTextMediaWhileOverLimit() {
  while (campainTextMediaCache.size > CAMPAIN_TEXT_MEDIA_MAX_ENTRIES) {
    let oldestKey = null;
    let oldestTs = Infinity;
    for (const [key, entry] of campainTextMediaCache) {
      if (entry.ts < oldestTs) {
        oldestTs = entry.ts;
        oldestKey = key;
      }
    }
    if (oldestKey == null) break;
    campainTextMediaCache.delete(oldestKey);
  }
}

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

/** Só image e video, após saber que existem (has_image / has_video na lista). Usa cache em memória (TTL + limite de entradas). */
export function fetchCampainTextMediaById(id) {
  const key = Number(id);
  if (!Number.isFinite(key)) {
    return apiClient
      .get(`/campain-texts/${encodeURIComponent(id)}/media`)
      .then((r) => r.data);
  }
  const now = Date.now();
  const hit = campainTextMediaCache.get(key);
  if (hit && now - hit.ts < CAMPAIN_TEXT_MEDIA_TTL_MS) {
    return Promise.resolve(hit.payload);
  }
  return apiClient
    .get(`/campain-texts/${encodeURIComponent(id)}/media`)
    .then((r) => {
      const payload = r.data;
      const failed = payload && payload.success === false;
      if (!failed) {
        campainTextMediaCache.set(key, { payload, ts: Date.now() });
        evictOldestCampainTextMediaWhileOverLimit();
      }
      return payload;
    });
}

export function createCampainTextRequest(payload) {
  return apiClient.post("/campain-texts", payload).then((r) => r.data);
}

export function patchCampainTextRequest(id, payload) {
  return apiClient.patch(`/campain-texts/${id}`, payload).then((r) => {
    invalidateCampainTextMediaCacheEntry(id);
    return r.data;
  });
}

export function deleteCampainTextRequest(id, hardDelete = false) {
  return apiClient
    .delete(`/campain-texts/${id}`, { params: { hardDelete } })
    .then((r) => {
      invalidateCampainTextMediaCacheEntry(id);
      return r.data;
    });
}
