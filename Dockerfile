# ---------- BUILD ----------
    FROM node:latest AS builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build
    
    # ---------- NGINX ----------
    FROM nginx:alpine
    
    # Remove config padrão
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Copia config customizada
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # Copia build do React
    # Vite -> dist
    # CRA  -> build
    COPY --from=builder /app/dist /usr/share/nginx/html
    # Se for CRA, troque /dist por /build
    
    EXPOSE 80
    
    CMD ["nginx", "-g", "daemon off;"]
    