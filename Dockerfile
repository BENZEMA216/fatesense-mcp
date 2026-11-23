FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.js README.md LICENSE glama.json ./

ENTRYPOINT ["node", "index.js"]
