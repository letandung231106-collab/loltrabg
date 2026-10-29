# Base image Node.js 20 LTS
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source code
COPY . .

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
