FROM node:22-slim
LABEL "language"="nodejs"
LABEL "framework"="vite"
WORKDIR /src
COPY . .
RUN apt-get update && apt-get install -y python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
