import React, { useEffect, useState } from "react";
import { fetchVoipStatus } from "../../api/voipApi.js";
import styles from "./voipStatusBadge.module.css";

const POLL_MS = 45000;

/**
 * Indicador compacto de saúde do VoIP (PBX + ramal do operador).
 */
export function VoipStatusBadge({ operatorCodeId }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetchVoipStatus(operatorCodeId);
        if (!cancelled && res?.success) setData(res.data);
        else if (!cancelled) setErr(true);
      } catch {
        if (!cancelled) setErr(true);
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [operatorCodeId]);

  if (err && !data) {
    return (
      <span className={`${styles.badge} ${styles.bad}`} title="Erro ao consultar VoIP">
        VoIP: —
      </span>
    );
  }

  if (!data) {
    return (
      <span className={`${styles.badge} ${styles.neutral}`}>VoIP: …</span>
    );
  }

  const cls =
    data.state === "ready"
      ? styles.good
      : data.state === "offline" || data.state === "misconfigured"
        ? styles.neutral
        : styles.bad;

  return (
    <span className={`${styles.badge} ${cls}`} title={data.message || ""}>
      VoIP: {data.message || data.state}
    </span>
  );
}
