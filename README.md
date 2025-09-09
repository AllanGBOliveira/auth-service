# Auth Microservice

Um microserviço de autenticação construído com NestJS, PostgreSQL e RabbitMQ para comunicação entre microserviços.

## 🚀 Funcionalidades

- **Autenticação JWT**: Sistema completo de login/register com tokens JWT
- **Hash de Senhas**: Senhas criptografadas com bcrypt
- **Guards Globais**: Proteção automática de rotas com JWT Guard
- **CRUD de Usuários**: Criação, leitura, atualização e exclusão de usuários
- **Banco PostgreSQL**: Integração completa com PostgreSQL usando TypeORM
- **Migrations**: Sistema de migração de banco de dados
- **RabbitMQ**: Comunicação assíncrona entre microserviços
- **Interceptors RabbitMQ**: Logging e rate limiting para mensagens
- **Docker Seguro**: Configuração com variáveis de ambiente (sem credenciais hardcoded)
- **Validação**: Validação de dados com class-validator
- **TypeScript**: Totalmente tipado
- **Arquitetura Modular**: Separação clara entre Auth e Users modules

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- Docker e Docker Compose
- npm ou yarn

## 🛠️ Configuração do Ambiente

1. **Clone o repositório e instale as dependências:**

```bash
npm install
```

2. **Configure as variáveis de ambiente:**

```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

**📝 Variáveis Obrigatórias:**

```bash
# Database
DB_USERNAME=auth_user
DB_PASSWORD=sua_senha_segura
DB_DATABASE=auth_db

# JWT
JWT_SECRET=sua-chave-jwt-super-secreta-minimo-32-caracteres

# RabbitMQ (para comunicação entre microserviços)
RABBITMQ_URL=amqp://meu_usuario:minha_senha@rabbitmq-container:5672
RABBITMQ_QUEUE=auth_queue
```

**⚠️ CRÍTICO**: Configure as variáveis obrigatórias no arquivo `.env`:

- `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (PostgreSQL)
- `JWT_SECRET` (chave forte com mínimo 32 caracteres)
- `RABBITMQ_URL`, `RABBITMQ_QUEUE` (RabbitMQ para microserviços)
- Aplicação **não iniciará** sem essas configurações

3. **Inicie o PostgreSQL com Docker:**

```bash
docker compose up -d postgres
```

4. **Execute as migrations:**

```bash
npm run migration:run
```

## 🚀 Executando a Aplicação

### Desenvolvimento Local

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod
```

### Com Docker (Recomendado)

```bash
# Subir todos os serviços (PostgreSQL + NestJS)
docker compose up

# Apenas PostgreSQL (para desenvolvimento local)
docker compose up -d postgres

# Build e subir com logs
docker compose up --build
```

**⚠️ IMPORTANTE**: Este microserviço funciona via **RabbitMQ**, não HTTP direto.
- **Porta 3001**: Apenas para desenvolvimento/debug
- **Comunicação**: Via RabbitMQ queue `auth_queue`
- **Gateway**: Acesse através do gateway service em `http://localhost:3000`

## 📊 Banco de Dados

### Configuração PostgreSQL

- **Host**: `DB_HOST` (padrão: localhost)
- **Porta**: `DB_PORT` (padrão: 5432)
- **Database**: `DB_DATABASE` ⚠️ **Obrigatório**
- **Usuário**: `DB_USERNAME` ⚠️ **Obrigatório**
- **Senha**: `DB_PASSWORD` ⚠️ **Obrigatório**

**🔒 Segurança**:

- Todas as credenciais são configuradas via variáveis de ambiente
- Valores em branco no `.env.example` por segurança
- Configure antes de executar a aplicação

### Sistema de Migrations

O projeto usa **migrations explícitas** (não synchronize) para controle total do schema:

- Configuração unificada em `src/config/database.config.ts`
- Migrations localizadas em `src/migrations/`
- Controle de versão do banco via migrations

### Entidades

- **User**: Entidade principal com campos id, name, email, password, isActive, role, createdAt, updatedAt

## 🔗 Comunicação via RabbitMQ

### Arquitetura de Microserviços

```
Frontend → Gateway (HTTP) → RabbitMQ → Auth Service
```

### Patterns RabbitMQ Suportados

**Autenticação:**
- `registerMicroservice` - Registra novo usuário
- `loginMicroservice` - Faz login e retorna JWT token

**Usuários (protegidos por JWT):**
- `findAllUsers` - Lista todos os usuários
- `findUserById` - Busca usuário por ID
- `createUser` - Cria novo usuário
- `updateUser` - Atualiza usuário
- `deleteUser` - Remove usuário
- `getUserProfile` - Busca perfil do usuário logado

### Acesso via Gateway

Este microserviço **NÃO** aceita requisições HTTP diretas. Toda comunicação é feita via **RabbitMQ**.

Para usar este microserviço, faça requisições HTTP para o **Gateway Service** que se comunica com este serviço via RabbitMQ:

**Autenticação (`/auth`) - Rotas Públicas no Gateway:**
- `POST http://localhost:3000/auth/register` → `registerMicroservice` pattern
- `POST http://localhost:3000/auth/login` → `loginMicroservice` pattern

**Usuários (`/users`) - Rotas Protegidas no Gateway:**
- `GET http://localhost:3000/users` → `findAllUsers` pattern
- `GET http://localhost:3000/users/profile` → `getUserProfile` pattern
- `GET http://localhost:3000/users/:id` → `findUserById` pattern
- `POST http://localhost:3000/users` → `createUser` pattern
- `PATCH http://localhost:3000/users/:id` → `updateUser` pattern
- `DELETE http://localhost:3000/users/:id` → `deleteUser` pattern

### Exemplos de Mensagens RabbitMQ:

**Pattern: `registerMicroservice`**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "role": "user"
}
```

**Pattern: `loginMicroservice`**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Pattern: `createUser`**
```json
{
  "name": "Maria Santos",
  "email": "maria@email.com",
  "password": "senha456",
  "role": "admin"
}
```

**Pattern: `updateUser`**
```json
{
  "id": "uuid-do-usuario",
  "name": "João Silva Atualizado",
  "email": "joao.novo@email.com"
}
```

**Resposta Padrão de Autenticação:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Autenticação via Gateway

Para acessar patterns protegidos via Gateway, inclua o token JWT no header das requisições HTTP:

```
Authorization: Bearer <seu-jwt-token>
```

O Gateway extrairá o token e o enviará junto com a mensagem RabbitMQ para este microserviço.

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📁 Estrutura do Projeto

```
src/
├── auth/
│   ├── decorators/
│   │   └── public.decorator.ts    # Decorator para rotas públicas
│   ├── auth.controller.ts         # RabbitMQ message handlers
│   ├── auth.service.ts            # Lógica de autenticação
│   ├── auth.module.ts             # Módulo de autenticação
│   └── jwt-auth.guard.ts          # Guard JWT global
├── config/
│   ├── database.config.ts         # Configuração PostgreSQL
│   ├── app.config.ts              # Configuração da aplicação
│   └── jwt.config.ts              # Configuração JWT
├── entities/
│   └── user.entity.ts             # Entidade User com TypeORM
├── middleware/
│   ├── rabbitmq-logger.interceptor.ts      # Logging de mensagens RabbitMQ
│   └── rabbitmq-rate-limit.interceptor.ts  # Rate limiting RabbitMQ
├── migrations/
│   └── 1704067200000-CreateUserTable.ts  # Migration inicial
├── users/
│   ├── users.controller.ts        # RabbitMQ message handlers (protegidos)
│   ├── users.service.ts           # Lógica de negócio de usuários
│   └── users.module.ts            # Módulo de usuários
├── app.module.ts                  # Módulo principal com interceptors
└── main.ts                        # Entry point RabbitMQ
```

## 🐳 Docker

O projeto inclui configuração completa do Docker:

- **PostgreSQL**: Banco de dados
- **RabbitMQ**: Message broker para comunicação
- **NestJS App**: Microserviço de autenticação

```bash
# Subir todos os serviços
docker compose up

# Subir apenas o PostgreSQL
docker compose up -d postgres

# Parar todos os serviços
docker compose down

# Rebuild e subir
docker compose up --build
```

## 🔧 Scripts Disponíveis

### Aplicação

- `npm run build` - Compila o projeto
- `npm run start:dev` - Inicia em modo desenvolvimento
- `npm run start:prod` - Inicia em modo produção
- `npm run lint` - Executa o linter
- `npm run format` - Formata o código

### Migrations

- `npm run migration:generate -- src/migrations/NomeDaMigration` - Gera nova migration
- `npm run migration:run` - Executa migrations pendentes
- `npm run migration:revert` - Reverte a última migration

## 🔐 Segurança e Monitoramento

### Segurança
- ✅ **Autenticação JWT** - Sistema completo com tokens seguros
- ✅ **Hash de Senhas** - bcrypt para criptografia de senhas
- ✅ **Guards Globais** - Proteção automática de rotas
- ✅ **Variáveis de Ambiente** - Credenciais seguras (não hardcoded)
- ✅ **Separação de Responsabilidades** - Auth vs Users modules
- ✅ **Rate Limiting** - Proteção contra spam (1000 msgs/15min por email)

### Monitoramento e Logs
- ✅ **RabbitMQ Logger Interceptor** - Log detalhado de mensagens
- ✅ **Rate Limit Interceptor** - Controle de taxa de mensagens
- ✅ **Request Tracking** - ID único por mensagem para rastreamento
- ✅ **Performance Monitoring** - Tempo de processamento de mensagens

### Exemplo de Logs:
```bash
[RabbitMQ-RateLimit] Rate limit check - Key: loginMicroservice:user@email.com | Count: 1/1000
[RabbitMQ] [abc123def] Received message - Pattern: loginMicroservice | Data: {...}
[RabbitMQ] [abc123def] Message processed successfully | Response: {...} | Time: 134ms
```

## 🎯 Funcionalidades Implementadas

- ✅ **Sistema de roles e permissões básico**
- ✅ **Rate limiting** - 1000 mensagens por 15 minutos
- ✅ **Logs estruturados** - Interceptors RabbitMQ
- ✅ **Monitoramento básico** - Tempo de processamento
- ✅ **Arquitetura de microserviços** - RabbitMQ
- ✅ **ConfigService pattern** - Configuração centralizada

## 📝 Próximos Passos

- [ ] Adicionar refresh tokens
- [ ] Implementar sistema de permissões avançado
- [ ] Adicionar testes unitários e e2e
- [ ] Documentação com Swagger/OpenAPI
- [ ] Métricas avançadas (Prometheus/Grafana)
- [ ] Circuit breaker para RabbitMQ
- [ ] Dead letter queue handling
