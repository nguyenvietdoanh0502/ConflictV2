# Minimal Node.js 20 Alpine for Zalo Bridge
FROM node:20-alpine

WORKDIR /app

# Run as non-root user node
ENV NODE_ENV=production \
    PORT=3001

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY src ./src
# Create placeholder for session file if needed
RUN touch zalo_session.json && chown -R node:node /app

USER node

EXPOSE 3001

CMD ["node", "src/server.js"]
