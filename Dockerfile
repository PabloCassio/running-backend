# Dockerfile para DESENVOLVIMENTO do backend do Maratona Ao Vivo
# Foco exclusivo em ambiente de desenvolvimento com hot-reload

FROM node:18-alpine

WORKDIR /app

# Instala dependências do sistema necessárias para desenvolvimento
RUN apk add --no-cache \
    git \
    openssh-client \
    python3 \
    make \
    g++ \
    curl

# Instala ferramentas globais para desenvolvimento
RUN npm install -g nodemon sequelize-cli ts-node

# Copia arquivos de configuração
COPY package*.json ./
COPY .env.example ./

# Instala dependências (incluindo devDependencies)
RUN npm install

# Copia o código fonte
COPY . .

# Expõe a porta de desenvolvimento
EXPOSE 5000

# Comando para desenvolvimento com hot-reload usando TypeScript
CMD ["nodemon", "--exec", "ts-node", "src/server.ts"]