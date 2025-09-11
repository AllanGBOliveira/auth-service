# 🔐 Auth Microservice

Microserviço de autenticação com **padrão híbrido RabbitMQ**: request-response para gateway + eventos assíncronos para microservices.

## 🎯 O que faz

- **Autenticação centralizada** via JWT (login/register/validate)
- **CRUD completo de usuários** com proteção JWT
- **Padrão híbrido RabbitMQ**: MessagePattern (sync) + EventPattern (async)
- **PostgreSQL** com TypeORM e migrations
- **Logs estruturados** e rate limiting
- **Testes completos** (14/14 passando)
- **I18n RabbitMQ** com traduções pt-BR/en

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
- ✅ **I18n RabbitMQ** com RabbitMQI18nResolver
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

## 🌍 I18n RabbitMQ

### Configuração
```typescript
// app.module.ts
I18nModule.forRoot({
  fallbackLanguage: 'en',
  loader: I18nJsonLoader,
  loaderOptions: {
    path: path.join(__dirname, '/i18n/'),
    watch: process.env.NODE_ENV !== 'production',
  },
  resolvers: [
    RabbitMQI18nResolver,  // Resolver customizado para RabbitMQ
  ],
})
```

### RabbitMQI18nResolver
```typescript
// config/rabbitmq-i18n.resolver.ts
@Injectable()
export class RabbitMQI18nResolver implements I18nResolver {
  resolve(context: ExecutionContext): string | string[] | undefined {
    const data = context.switchToRpc().getData();
    
    if (data && typeof data === 'object' && 'lang' in data) {
      return data.lang;  // Extrai idioma do payload RabbitMQ
    }
    
    return 'en';  // Fallback para inglês
  }
}
```

### Gateway Integration
```typescript
// Gateway deve incluir 'lang' no payload
const result = await authClient.send({ cmd: 'login' }, {
  email: 'user@example.com',
  password: 'password',
  lang: 'pt-BR'  // ← Idioma enviado via RabbitMQ
});
```

### Uso nos Controllers
```typescript
// Controllers usam i18n.t() SEM parâmetro lang manual
@MessagePattern({ cmd: 'login' })
async login(data: LoginDto & { lang?: string }) {
  return {
    access_token: token,
    message: await this.i18n.t('auth.LOGIN_SUCCESS')  // Tradução automática
  };
}
```

### Arquivos de Tradução
```json
// src/i18n/pt-BR/auth.json
{
  "LOGIN_SUCCESS": "Login realizado com sucesso",
  "LOGIN_FAILED": "Credenciais inválidas",
  "USER_NOT_FOUND": "Usuário não encontrado"
}

// src/i18n/en-US/auth.json
{
  "LOGIN_SUCCESS": "Login successful", 
  "LOGIN_FAILED": "Invalid credentials",
  "USER_NOT_FOUND": "User not found"
}
```

### Comportamento
- **Com `lang` no payload** → Usa idioma especificado
- **Sem `lang` no payload** → Fallback para `'en'`
- **Tradução não encontrada** → Fallback para `'en'`

## 🔧 RabbitMQ Configuration

### Configuração Crítica - Durable Settings
```typescript
// main.ts - Auth Service
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://user:pass@rabbitmq:5672'],
    queue: 'auth_queue',
    queueOptions: {
      durable: true,  // ← IMPORTANTE: Gateway deve usar mesmo valor
    },
  },
});
```

⚠️ **ATENÇÃO:** Gateway e Auth Service devem usar **mesmo valor** para `durable` ou ocorrerá erro:
```
PRECONDITION_FAILED - inequivalent arg 'durable' for queue 'auth_queue'
```

**Filas RabbitMQ:**
- `auth_queue` - MessagePatterns (request-response) - `durable: true`
- `auth_events_queue` - EventPatterns (fire-and-forget)

## 🚨 Error Handling

### RpcException para RabbitMQ
```typescript
// Controllers devem usar RpcException em vez de HttpException
@MessagePattern({ cmd: 'login' })
async login(data: LoginDto) {
  try {
    return await this.authService.login(data.email, data.password);
  } catch (error) {
    const errorMessage = await this.i18n.t('auth.LOGIN_FAILED');
    throw new RpcException({
      statusCode: 401,
      message: errorMessage,
      error: 'Unauthorized'
    });
  }
}
```

### Error Interceptor (Planejado)
```typescript
// middleware/error.interceptor.ts (TODO)
@Injectable()
export class RabbitMQErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(err => {
        // Log estruturado de erros
        // Tradução automática de mensagens
        // Padronização de response
        throw new RpcException({
          statusCode: err.status || 500,
          message: err.message,
          timestamp: new Date().toISOString(),
          path: context.switchToRpc().getPattern()
        });
      })
    );
  }
}
```

### Gateway Error Handling
```typescript
// Gateway deve tratar RpcException
try {
  const result = await this.authClient.send({ cmd: 'login' }, loginDto);
  return result;
} catch (error) {
  // RpcException vira HttpException no Gateway
  throw new HttpException(error.message, error.statusCode || 500);
}
```

## 📄 Paginação & Filtros Avançados

### DTOs de Paginação e Filtros (Planejado)
```typescript
// dto/pagination.dto.ts (TODO)
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['name', 'email', 'createdAt', 'updatedAt', 'isActive'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// dto/user-filters.dto.ts (TODO)
export class UserFiltersDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsIn(['admin', 'user', 'moderator'])
  role?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nameContains?: string;

  @IsOptional()
  @IsEmail()
  emailDomain?: string; // @example.com

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]; // ['premium', 'verified']

  @IsOptional()
  @IsObject()
  customFilters?: Record<string, any>;
}

export class PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    filters?: Record<string, any>;
    appliedSort?: {
      field: string;
      order: 'ASC' | 'DESC';
    };
  };
}
```

### Queries com Filtros Avançados (Planejado)
```typescript
// users.service.ts (TODO)
async findAllPaginated(filters: UserFiltersDto): Promise<PaginatedResponse<User>> {
  const { 
    page, limit, search, sortBy, sortOrder,
    isActive, role, createdAfter, createdBefore,
    nameContains, emailDomain, tags, customFilters
  } = filters;
  
  const skip = (page - 1) * limit;

  const queryBuilder = this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.profile', 'profile')
    .select([
      'user.id', 'user.name', 'user.email', 'user.isActive', 
      'user.role', 'user.createdAt', 'user.updatedAt',
      'profile.avatar', 'profile.tags'
    ])
    .skip(skip)
    .take(limit);

  // Busca geral (search)
  if (search) {
    queryBuilder.andWhere(
      '(user.name ILIKE :search OR user.email ILIKE :search OR profile.bio ILIKE :search)',
      { search: `%${search}%` }
    );
  }

  // Filtro por status ativo
  if (typeof isActive === 'boolean') {
    queryBuilder.andWhere('user.isActive = :isActive', { isActive });
  }

  // Filtro por role
  if (role) {
    queryBuilder.andWhere('user.role = :role', { role });
  }

  // Filtros por data
  if (createdAfter) {
    queryBuilder.andWhere('user.createdAt >= :createdAfter', { createdAfter });
  }
  if (createdBefore) {
    queryBuilder.andWhere('user.createdAt <= :createdBefore', { createdBefore });
  }

  // Filtro por nome específico
  if (nameContains) {
    queryBuilder.andWhere('user.name ILIKE :nameContains', { 
      nameContains: `%${nameContains}%` 
    });
  }

  // Filtro por domínio de email
  if (emailDomain) {
    queryBuilder.andWhere('user.email ILIKE :emailDomain', { 
      emailDomain: `%${emailDomain}` 
    });
  }

  // Filtro por tags (array)
  if (tags && tags.length > 0) {
    queryBuilder.andWhere('profile.tags && :tags', { tags });
  }

  // Filtros customizados dinâmicos
  if (customFilters) {
    Object.entries(customFilters).forEach(([key, value], index) => {
      const paramName = `custom${index}`;
      queryBuilder.andWhere(`user.${key} = :${paramName}`, { [paramName]: value });
    });
  }

  // Ordenação dinâmica
  const validSortFields = ['name', 'email', 'createdAt', 'updatedAt', 'isActive', 'role'];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  queryBuilder.orderBy(`user.${finalSortBy}`, sortOrder);

  // Ordenação secundária para consistência
  if (finalSortBy !== 'id') {
    queryBuilder.addOrderBy('user.id', 'ASC');
  }

  const [users, total] = await queryBuilder.getManyAndCount();

  return {
    data: users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
      filters: {
        isActive,
        role,
        createdAfter,
        createdBefore,
        search,
        nameContains,
        emailDomain,
        tags,
        customFilters
      },
      appliedSort: {
        field: finalSortBy,
        order: sortOrder
      }
    },
  };
}

// Busca avançada com full-text search (TODO)
async searchUsersAdvanced(searchDto: {
  query: string;
  filters?: UserFiltersDto;
  fuzzy?: boolean;
  highlight?: boolean;
}): Promise<PaginatedResponse<User>> {
  const { query, filters = {}, fuzzy = false, highlight = false } = searchDto;
  
  const queryBuilder = this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.profile', 'profile');

  // Full-text search com PostgreSQL
  if (fuzzy) {
    // Busca fuzzy com similarity
    queryBuilder.where(
      `(
        similarity(user.name, :query) > 0.3 OR 
        similarity(user.email, :query) > 0.3 OR
        similarity(profile.bio, :query) > 0.2
      )`,
      { query }
    );
    queryBuilder.orderBy('greatest(similarity(user.name, :query), similarity(user.email, :query))', 'DESC');
  } else {
    // Busca exata com ranking
    queryBuilder.where(
      `(
        to_tsvector('portuguese', user.name || ' ' || user.email || ' ' || COALESCE(profile.bio, '')) 
        @@ plainto_tsquery('portuguese', :query)
      )`,
      { query }
    );
    queryBuilder.orderBy(
      `ts_rank(to_tsvector('portuguese', user.name || ' ' || user.email), plainto_tsquery('portuguese', :query))`,
      'DESC'
    );
  }

  // Aplicar filtros adicionais
  return this.applyFiltersToQuery(queryBuilder, filters);
}
```

### MessagePatterns com Filtros Avançados (Planejado)
```typescript
// users.controller.ts (TODO)
@MessagePattern({ cmd: 'find_all_users_paginated' })
async findAllPaginated(payload: UserFiltersDto & { user?: any }) {
  const result = await this.usersService.findAllPaginated(payload);
  return {
    ...result,
    message: await this.i18n.t('auth.USERS_RETRIEVED'),
  };
}

@MessagePattern({ cmd: 'search_users_advanced' })
async searchUsersAdvanced(payload: {
  query: string;
  filters?: UserFiltersDto;
  fuzzy?: boolean;
  highlight?: boolean;
}) {
  const result = await this.usersService.searchUsersAdvanced(payload);
  return {
    ...result,
    message: await this.i18n.t('auth.SEARCH_COMPLETED'),
  };
}

@MessagePattern({ cmd: 'filter_users_by_role' })
async filterUsersByRole(payload: { role: string; filters?: UserFiltersDto }) {
  const filtersWithRole = { ...payload.filters, role: payload.role };
  const result = await this.usersService.findAllPaginated(filtersWithRole);
  return {
    ...result,
    message: await this.i18n.t('auth.USERS_FILTERED_BY_ROLE', { role: payload.role }),
  };
}

@MessagePattern({ cmd: 'filter_users_by_date_range' })
async filterUsersByDateRange(payload: {
  startDate: string;
  endDate: string;
  filters?: UserFiltersDto;
}) {
  const filtersWithDate = {
    ...payload.filters,
    createdAfter: payload.startDate,
    createdBefore: payload.endDate,
  };
  const result = await this.usersService.findAllPaginated(filtersWithDate);
  return {
    ...result,
    message: await this.i18n.t('auth.USERS_FILTERED_BY_DATE'),
  };
}

@MessagePattern({ cmd: 'get_user_statistics' })
async getUserStatistics(payload: { filters?: UserFiltersDto }) {
  const stats = await this.usersService.getUserStatistics(payload.filters);
  return {
    data: stats,
    message: await this.i18n.t('auth.STATISTICS_RETRIEVED'),
  };
}
```

### Gateway Integration com Filtros Avançados (Planejado)
```typescript
// Gateway routes com filtros completos
@Get('users')
async getUsers(@Query() filters: UserFiltersDto) {
  return this.authClient.send({ cmd: 'find_all_users_paginated' }, {
    ...filters,
    lang: 'pt-BR'
  });
}

@Get('users/search')
async searchUsersAdvanced(
  @Query('q') query: string,
  @Query() filters: UserFiltersDto,
  @Query('fuzzy') fuzzy?: boolean,
  @Query('highlight') highlight?: boolean
) {
  return this.authClient.send({ cmd: 'search_users_advanced' }, {
    query,
    filters,
    fuzzy: fuzzy === 'true',
    highlight: highlight === 'true',
    lang: 'pt-BR'
  });
}

@Get('users/role/:role')
async getUsersByRole(
  @Param('role') role: string,
  @Query() filters: UserFiltersDto
) {
  return this.authClient.send({ cmd: 'filter_users_by_role' }, {
    role,
    filters,
    lang: 'pt-BR'
  });
}

@Get('users/date-range')
async getUsersByDateRange(
  @Query('start') startDate: string,
  @Query('end') endDate: string,
  @Query() filters: UserFiltersDto
) {
  return this.authClient.send({ cmd: 'filter_users_by_date_range' }, {
    startDate,
    endDate,
    filters,
    lang: 'pt-BR'
  });
}

@Get('users/statistics')
async getUserStatistics(@Query() filters: UserFiltersDto) {
  return this.authClient.send({ cmd: 'get_user_statistics' }, {
    filters,
    lang: 'pt-BR'
  });
}

// Exemplos de uso das rotas:
// GET /users?page=1&limit=20&isActive=true&role=admin&sortBy=createdAt&sortOrder=DESC
// GET /users/search?q=joão&fuzzy=true&isActive=true&createdAfter=2024-01-01
// GET /users/role/admin?page=1&limit=10&createdAfter=2024-01-01
// GET /users/date-range?start=2024-01-01&end=2024-12-31&isActive=true
// GET /users/statistics?role=admin&isActive=true
```

### Exemplos de Queries Complexas (Planejado)
```typescript
// Service methods para casos específicos (TODO)

// 1. Buscar usuários ativos com múltiplos filtros
async findActiveUsersWithFilters(filters: {
  roles: string[];
  tags: string[];
  createdInLastDays: number;
  hasAvatar: boolean;
}): Promise<PaginatedResponse<User>> {
  const createdAfter = new Date();
  createdAfter.setDate(createdAfter.getDate() - filters.createdInLastDays);

  return this.findAllPaginated({
    isActive: true,
    role: filters.roles[0], // Expandir para IN query
    tags: filters.tags,
    createdAfter: createdAfter.toISOString(),
    customFilters: {
      hasAvatar: filters.hasAvatar
    }
  });
}

// 2. Relatório de usuários por período
async getUsersReport(reportFilters: {
  groupBy: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  roles?: string[];
}): Promise<{
  data: Array<{
    period: string;
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }>;
}> {
  // Query com GROUP BY e agregações
  const queryBuilder = this.userRepository
    .createQueryBuilder('user')
    .select([
      `DATE_TRUNC('${reportFilters.groupBy}', user.createdAt) as period`,
      'COUNT(*) as total',
      'COUNT(CASE WHEN user.isActive = true THEN 1 END) as active',
      'COUNT(CASE WHEN user.isActive = false THEN 1 END) as inactive',
      'user.role'
    ])
    .where('user.createdAt BETWEEN :startDate AND :endDate', {
      startDate: reportFilters.startDate,
      endDate: reportFilters.endDate
    })
    .groupBy('period, user.role')
    .orderBy('period', 'DESC');

  if (reportFilters.roles?.length) {
    queryBuilder.andWhere('user.role IN (:...roles)', { roles: reportFilters.roles });
  }

  return queryBuilder.getRawMany();
}

// 3. Busca com score de relevância
async searchWithRelevanceScore(searchQuery: {
  term: string;
  weights: {
    name: number;
    email: number;
    bio: number;
  };
  minScore: number;
}): Promise<Array<User & { relevanceScore: number }>> {
  const { term, weights, minScore } = searchQuery;
  
  return this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.profile', 'profile')
    .select([
      'user.*',
      `(
        (CASE WHEN user.name ILIKE '%${term}%' THEN ${weights.name} ELSE 0 END) +
        (CASE WHEN user.email ILIKE '%${term}%' THEN ${weights.email} ELSE 0 END) +
        (CASE WHEN profile.bio ILIKE '%${term}%' THEN ${weights.bio} ELSE 0 END)
      ) as relevanceScore`
    ])
    .having('relevanceScore >= :minScore', { minScore })
    .orderBy('relevanceScore', 'DESC')
    .getRawMany();
}
```

## 🔄 Roadmap

### ✅ Implementado
- JWT Auth + bcrypt
- RabbitMQ MessagePattern/EventPattern
- PostgreSQL + TypeORM
- I18n RabbitMQ com resolver customizado
- Logs estruturados + rate limiting
- 14/14 testes passando

### 🚧 Próximas Implementações
- **Error Handling**: RabbitMQErrorInterceptor + padronização de erros
- **Paginação Avançada**: UserFiltersDto + queries otimizadas + múltiplos filtros
- **Busca Complexa**: Full-text search + fuzzy search + relevance scoring
- **Filtros Dinâmicos**: Por role, data, tags, domínio email + customFilters
- **Relatórios**: Agregações + GROUP BY + estatísticas por período
- **Validação**: Class-validator nos DTOs RabbitMQ + sanitização
- **Monitoring**: Health checks + metrics + query performance
- **Cache**: Redis para queries frequentes + invalidação inteligente
- **Search Engine**: Elasticsearch integration + indexação automática
- **Auditoria**: Log de queries + tracking de filtros utilizados
