# 🔐 Auth Microservice

Microserviço de autenticação com **padrão híbrido RabbitMQ**: request-response para gateway + eventos assíncronos para microservices.

## 🎯 O que faz

- **Autenticação centralizada** via JWT (login/register/validate)
- **CRUD completo de usuários** com proteção JWT
- **Padrão híbrido RabbitMQ**: MessagePattern (sync) + EventPattern (async)
- **PostgreSQL** com TypeORM e migrations
- **Logs estruturados** e rate limiting
- **Testes completos** (14/14 passando)

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- Docker e Docker Compose
- npm ou yarn

## ⚡ Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env (copie .env.example)
cp .env.example .env

# 3. Subir com Docker
docker compose up

# 4. Rodar migrations
npm run migration:run

# 5. Testar
npm test
```

**Variáveis obrigatórias no .env:**
- `DB_*` (PostgreSQL), `JWT_SECRET`, `RABBITMQ_*`

## 🔄 Padrão Híbrido RabbitMQ

### MessagePattern (Request-Response) - Para Gateway
```typescript
// Gateway → Auth Service (síncrono)
const result = await client.send({ cmd: 'login' }, loginDto);
```

### EventPattern (Fire-and-Forget) - Para Microservices
```typescript
// Auth Service → Games/Analytics (assíncrono)
@EventPattern('auth.user.login')
handleUserLogin(data) { /* cache local */ }
```

**Fluxo:** `Cliente → Gateway → MessagePattern → Auth → EventPattern → Games`

## 📡 API RabbitMQ

### MessagePatterns (Request-Response)
```typescript
// Autenticação (públicos)
{ cmd: 'login' }        // Login → JWT token
{ cmd: 'register' }     // Registro → JWT token
{ cmd: 'validate_token' } // Validação → user data

// Usuários (protegidos)
{ cmd: 'find_all_users' }    // Lista usuários
{ cmd: 'find_user_by_id' }   // Busca por ID
{ cmd: 'get_user_profile' }  // Perfil do logado
{ cmd: 'create_user' }       // Criar usuário
{ cmd: 'update_user' }       // Atualizar usuário
{ cmd: 'delete_user' }       // Deletar usuário

// Sistema
{ cmd: 'health_check' }      // Health check
```

### EventPatterns (Fire-and-Forget)
```typescript
// Eventos publicados automaticamente
'auth.user.login'      // Usuário fez login
'auth.user.logout'     // Usuário fez logout
'auth.token.validated' // Token foi validado
'auth.token.invalid'   // Token inválido
```

## 🔌 Integração com Microservices

### Gateway Service (Request-Response)
```typescript
// gateway/src/auth/auth.service.ts
const authClient = ClientProxyFactory.create({
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://user:pass@rabbitmq:5672'],
    queue: 'auth_queue',
  },
});

// Login síncrono
const result = await authClient.send({ cmd: 'login' }, loginDto);
```

### Games Service (Event Listeners)
```typescript
// games/src/auth/auth-listener.service.ts
@EventPattern('auth.user.login')
handleUserLogin(data: { user: any, timestamp: string }) {
  // Atualiza cache local automaticamente
  this.activeUsers.set(data.user.id, data.user);
}

@EventPattern('auth.token.validated')
handleTokenValidated(data: { user: any }) {
  // Token válido - usuário ativo
}
```

### Configuração RabbitMQ
```typescript
// Filas utilizadas
auth_queue        // MessagePatterns (request-response)
auth_events_queue // EventPatterns (fire-and-forget)
```

## 🧪 Testes

```bash
npm test        # 14/14 testes passando
npm run test:e2e
npm run test:cov
```

## 🐳 Docker

```bash
docker compose up        # Subir tudo
docker compose up -d postgres  # Só PostgreSQL
```

## 📋 Scripts

```bash
npm run build           # Build
npm run start:dev       # Desenvolvimento
npm run start:prod      # Produção
npm run migration:run   # Rodar migrations
npm run lint           # Linter
```

## 🔐 Features

- ✅ **JWT Auth** + bcrypt hash
- ✅ **RabbitMQ Guards** + rate limiting
- ✅ **Structured Logs** + request tracking
- ✅ **PostgreSQL** + TypeORM migrations
- ✅ **Event-driven** architecture
- ✅ **14/14 tests** passing

## 🌐 Gateway Routes (9 rotas HTTP)

### Públicas
- `POST /auth/login` → `{ cmd: 'login' }`
- `POST /auth/register` → `{ cmd: 'register' }`
- `POST /auth/validate` → `{ cmd: 'validate_token' }`
- `GET /health` → `{ cmd: 'health_check' }`

### Protegidas (JWT)
- `GET /users` → `{ cmd: 'find_all_users' }`
- `GET /users/profile` → `{ cmd: 'get_user_profile' }`
- `GET /users/:id` → `{ cmd: 'find_user_by_id' }`
- `PATCH /users/:id` → `{ cmd: 'update_user' }`
- `DELETE /users/:id` → `{ cmd: 'delete_user' }`

### Gateway Client Setup
```typescript
const authClient = ClientProxyFactory.create({
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://user:pass@rabbitmq:5672'],
    queue: 'auth_queue',
  },
});

// Exemplo: Login
@Post('auth/login')
async login(@Body() loginDto) {
  return this.authClient.send({ cmd: 'login' }, loginDto);
}
```

## 🎮 Games Service (Event Listeners)

```typescript
@EventPattern('auth.user.login')
handleUserLogin(data: { user: any, timestamp: string }) {
  // Cache local automático
  this.activeUsers.set(data.user.id, data.user);
}

@EventPattern('auth.token.validated')
handleTokenValidated(data: { user: any }) {
  // Token válido - usuário ativo
}
```

**Filas RabbitMQ:**
- `auth_queue` - MessagePatterns (request-response)
- `auth_events_queue` - EventPatterns (fire-and-forget)
