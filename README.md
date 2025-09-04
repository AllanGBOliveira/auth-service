# Auth Microservice

Um microserviço de autenticação construído com NestJS e PostgreSQL.

## 🚀 Funcionalidades

- **Autenticação JWT**: Sistema completo de login/register com tokens JWT
- **Hash de Senhas**: Senhas criptografadas com bcrypt
- **Guards Globais**: Proteção automática de rotas com JWT Guard
- **CRUD de Usuários**: Criação, leitura, atualização e exclusão de usuários
- **Banco PostgreSQL**: Integração completa com PostgreSQL usando TypeORM
- **Migrations**: Sistema de migração de banco de dados
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
```

**⚠️ CRÍTICO**: Configure as variáveis obrigatórias no arquivo `.env`:
- `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (PostgreSQL)
- `JWT_SECRET` (chave forte com mínimo 32 caracteres)
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

A aplicação estará disponível em `http://localhost:3000`

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

## 🔗 Endpoints da API

### Autenticação (`/auth`) - Rotas Públicas

- `POST /auth/register` - Registra novo usuário
- `POST /auth/login` - Faz login e retorna JWT token

### Usuários (`/users`) - Rotas Protegidas (JWT)

- `GET /users` - Lista todos os usuários
- `GET /users/profile` - Busca perfil do usuário logado
- `GET /users/:id` - Busca usuário por ID
- `POST /users` - Cria novo usuário
- `PATCH /users/:id` - Atualiza usuário
- `DELETE /users/:id` - Remove usuário

### Exemplos de Payloads:

**Registro:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "role": "user"
}
```

**Login:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Resposta de Autenticação:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Autenticação
Para acessar rotas protegidas, inclua o token JWT no header:
```
Authorization: Bearer <seu-jwt-token>
```

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
│   ├── auth.controller.ts         # Endpoints de autenticação
│   ├── auth.service.ts            # Lógica de autenticação
│   ├── auth.module.ts             # Módulo de autenticação
│   └── jwt-auth.guard.ts          # Guard JWT global
├── config/
│   └── database.config.ts         # Configuração unificada (NestJS + CLI)
├── entities/
│   └── user.entity.ts             # Entidade User com TypeORM
├── migrations/
│   └── 1704067200000-CreateUserTable.ts  # Migration inicial
├── users/
│   ├── users.controller.ts        # Endpoints de usuários (protegidos)
│   ├── users.service.ts           # Lógica de negócio de usuários
│   └── users.module.ts            # Módulo de usuários
├── app.module.ts                  # Módulo principal com JWT Guard global
└── main.ts                        # Entry point
```

## 🐳 Docker

O projeto inclui configuração completa do Docker:

- **PostgreSQL**: Banco de dados
- **NestJS App**: Aplicação principal

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

## 🔐 Segurança Implementada

- ✅ **Autenticação JWT** - Sistema completo com tokens seguros
- ✅ **Hash de Senhas** - bcrypt para criptografia de senhas
- ✅ **Guards Globais** - Proteção automática de rotas
- ✅ **Variáveis de Ambiente** - Credenciais seguras (não hardcoded)
- ✅ **Separação de Responsabilidades** - Auth vs Users modules

## 📝 Próximos Passos

- [ ] Implementar sistema de roles e permissões avançado
- [ ] Adicionar refresh tokens
- [ ] Implementar rate limiting
- [ ] Adicionar testes unitários e e2e
- [ ] Documentação com Swagger/OpenAPI
- [ ] Logs estruturados
- [ ] Monitoramento e métricas
