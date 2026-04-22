import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttpsDev = env.VITE_DEV_HTTPS !== "0" && env.VITE_DEV_HTTPS !== "false";

  const proxy = {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
      secure: false,
    },
  };

  return {
    plugins: [react(), ...(useHttpsDev ? [basicSsl()] : [])],
    server: {
      port: 5173,
      proxy,
      https: useHttpsDev,
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
