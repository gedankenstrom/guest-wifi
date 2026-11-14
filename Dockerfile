FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY . .
RUN mkdir -p /data && chown -R node:node /app /data
USER node
EXPOSE 8085
VOLUME ["/data"]
CMD ["npm", "start"]