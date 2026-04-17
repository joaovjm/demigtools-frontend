import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
//import fs from "fs";

//import os from 'os'
//import path from 'path'

//const homeDir = os.homedir()
//const keyPath = path.join(homeDir, '.vite/ssl/key.pem')
//const certPath = path.join(homeDir, '.vite/ssl/cert.pem')


function wsUpstreamToHttpTarget(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (u.startsWith("wss://")) return `https://${u.slice(6)}`;
  if (u.startsWith("ws://")) return `http://${u.slice(5)}`;
  if (u.startsWith("https://") || u.startsWith("http://")) return u;
  return `https://${u}`;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const voipUpstreamRaw = env.VOIP_WSS_UPSTREAM?.trim();
  const voipUpstream = wsUpstreamToHttpTarget(voipUpstreamRaw);
  const voipRemotePath = env.VOIP_WSS_PATH?.trim() || "/ws";
  const voipLocalPath = env.VOIP_LOCAL_WS_PATH?.trim() || "/__voip/ws";
  const useHttpsDev = env.VITE_DEV_HTTPS !== "0" && env.VITE_DEV_HTTPS !== "false";

  const proxy = {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
      secure: false,
    },
  };

  /** Logs no terminal do Vite: VOIP_PROXY_DEBUG=1 */
  const voipProxyDebug = env.VOIP_PROXY_DEBUG === "1" || env.VOIP_PROXY_DEBUG === "true";

  if (voipUpstream) {
    proxy[voipLocalPath] = {
      target: voipUpstream,
      ws: true,
      changeOrigin: true,
      secure: false,
      /** Garante path exato no upstream (ex.: /ws) */
      rewrite: (path) => {
        const q = path.includes("?") ? path.slice(path.indexOf("?")) : "";
        return `${voipRemotePath}${q}`;
      },
      configure: (proxyServer) => {
        if (!voipProxyDebug) return;
        proxyServer.on("proxyReqWs", (proxyReq, req) => {
          console.log(
            "[VOIP proxy] WS upgrade",
            req.url,
            "→",
            voipUpstream + voipRemotePath,
            "| Sec-WebSocket-Protocol:",
            req.headers["sec-websocket-protocol"] || "(nenhum)"
          );
        });
        proxyServer.on("error", (err, _req, res) => {
          console.error("[VOIP proxy] error:", err?.message || err);
          if (res && typeof res.end === "function" && !res.headersSent) {
            try {
              res.end();
            } catch {
              /* ignore */
            }
          }
        });
      },
    };
  }

  return {
    define: {
      // Caminho local do proxy WebSocket; "" desliga (produção ou sem VOIP_WSS_UPSTREAM)
      __VOIP_WS_PROXY_PATH__: JSON.stringify(voipUpstream ? voipLocalPath : ""),
    },
    plugins: [
      react(),
      ...(useHttpsDev ? [basicSsl()] : []),
    ],
    server: {
      port: 5173,
      proxy,
      https: useHttpsDev,
      //https: {
      //  key: fs.readFileSync(keyPath),
      //  cert: fs.readFileSync(certPath),
      //},
      host: true,
      cors: true,
      headers: {
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'; frame-src 'self'",
        "X-Content-Type-Options": "nosniff",
      },
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
    },
  };
});
