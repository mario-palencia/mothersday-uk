# Etapa 1: Construir la aplicación Next.js
# Usar node:20-slim (Debian) en lugar de Alpine: evita fallos de sharp y otros módulos nativos en Cloud Build
FROM node:20-slim AS builder
WORKDIR /app

# Dependencias mínimas por si algún paquete nativo las necesita (sharp, etc.)
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias primero para mejor cache
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copiar el resto de los archivos
COPY . .

# Configurar variables de entorno para static export
ENV STATIC_EXPORT=true
ENV DOCKER=true
ENV CUSTOM_DOMAIN=true
ENV NODE_ENV=production
# Reducir uso de memoria en build (sin source maps en producción estática)
ENV GENERATE_SOURCEMAP=false

# Memoria para Node: 6GB (Cloud Build usa E2_HIGHMEM_8 = 64GB RAM)
ENV NODE_OPTIONS="--max-old-space-size=6144"

# Ejecutar build (STATIC_EXPORT/DOCKER = output: 'export'). Si falla, ver el log completo del paso en Cloud Build.
RUN npm run build

# Verificar que Next.js generó el directorio out (output: 'export')
RUN test -d /app/out && ls -la /app/out | head -30 || (echo "ERROR: out/ not found after build"; ls -la /app/.next 2>/dev/null || true; exit 1)

# Etapa 2: Servir con nginx
FROM nginx:alpine

# Instalar bash, sed, gettext (para envsubst) y net-tools (para netstat)
RUN apk add --no-cache bash sed gettext net-tools

# Copiar archivos estáticos (incluyendo videos)
COPY --from=builder /app/out /usr/share/nginx/html

# Verificar contenido (no fallar si no hay MP4)
RUN ls -la /usr/share/nginx/html/ | head -20; (ls /usr/share/nginx/html/*.mp4 2>/dev/null || echo "No MP4 files")

# Copiar configuración base de nginx (con puerto 8080 por defecto)
COPY nginx.conf /tmp/nginx.conf.template

# Copiar script de entrypoint (normalizar CRLF→LF por si el repo se editó en Windows)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 8080

# Puerto por defecto
ENV PORT=8080

# Usar nuestro entrypoint personalizado
ENTRYPOINT ["/docker-entrypoint.sh"]
