# Arquitetura do Sistema — Vestibular App TCC

## Visão Geral

O projeto implementa e compara duas arquiteturas distintas de back-end para um aplicativo mobile de preparação para vestibulares:

| Arquitetura | Back-end | Banco de Dados |
|---|---|---|
| **MVC customizado** | Node.js + Express (REST API) | MySQL (relacional) |
| **BaaS** | Firebase (Cloud Functions HTTP) | Cloud Firestore (NoSQL orientado a documentos) |

O front-end é único e compartilhado: um aplicativo Android nativo em Kotlin que se comunica com qualquer um dos back-ends via HTTP/REST.

---

## Diagrama de componentes

```
┌────────────────────────────────────┐
│         Android App (Kotlin)       │
│  Retrofit 2 + OkHttp + Coroutines  │
└──────────────┬─────────────────────┘
               │ HTTP/REST (Bearer JWT)
               │
       ┌───────┴──────────────────────────────────────┐
       │                                              │
┌──────▼──────────────┐              ┌────────────────▼──────────────┐
│  Back-end MVC       │              │  Back-end BaaS                │
│  Node.js + Express  │              │  Firebase Cloud Functions HTTP │
│  Porta 3000         │              │  (Google Cloud Run)           │
└──────┬──────────────┘              └────────────────┬──────────────┘
       │                                              │
┌──────▼──────────┐                    ┌─────────────▼──────────────┐
│  MySQL          │                    │  Cloud Firestore            │
│  (Relacional)   │                    │  (NoSQL — Documentos)       │
└─────────────────┘                    └────────────────────────────┘
```

---

## Back-end MVC (Node.js + Express + MySQL)

### Camadas

```
backend/
├── src/
│   ├── app.js              # Express: middlewares globais, rotas, health check
│   ├── server.js           # Ponto de entrada: escuta na porta configurada
│   ├── config/
│   │   └── database.js     # Pool de conexões MySQL (mysql2/promise, limit 10)
│   ├── controllers/        # Lógica de negócio por domínio
│   │   ├── authController.js
│   │   ├── answerController.js
│   │   ├── filterController.js
│   │   ├── questionController.js
│   │   └── simulationController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js    # Validação de JWT Bearer
│   │   └── errorMiddleware.js   # Handler centralizado de erros HTTP
│   ├── models/             # Consultas SQL e acesso ao banco
│   │   ├── answerModel.js
│   │   ├── questionModel.js
│   │   ├── simulationModel.js
│   │   ├── subjectModel.js
│   │   ├── userModel.js
│   │   └── vestibularModel.js
│   └── routes/             # Definição de rotas por domínio
│       ├── index.js
│       ├── authRoutes.js
│       ├── answerRoutes.js
│       ├── filterRoutes.js
│       ├── questionRoutes.js
│       └── simulationRoutes.js
├── scripts/
│   ├── runPerformanceBenchmark.js   # Benchmark Autocannon (4 cenários)
│   └── seedBenchmark.js             # Popula o banco com massa de dados controlada
├── benchmarks/
│   ├── load_test_k6.js    # Teste de carga contínua (50 VUs, 3 min)
│   ├── spike_test_k6.js   # Teste de rajada (5→120 VUs)
│   └── README.md          # Guia de execução dos testes k6
└── tests/
    ├── auth.test.js
    ├── answers.test.js
    ├── questions.test.js
    └── simulations.test.js
```

### Middlewares globais (em ordem de aplicação)

1. **helmet** — cabeçalhos de segurança HTTP
2. **response-time** — injeta `X-Response-Time` em todas as respostas
3. **cors** — habilita requisições cross-origin
4. **express.json** — parsing do corpo das requisições
5. **express.static** — servir imagens de questões em `/uploads`
6. **authMiddleware** — aplicado por rota, valida JWT Bearer
7. **errorMiddleware** — captura erros lançados pelos controllers

---

## Back-end BaaS (Firebase Cloud Functions + Cloud Firestore)

### Camadas

```
firebase/
├── firebase.json              # Configurações do runtime e emuladores locais
├── firestore.rules            # Regras de segurança declarativas
├── firestore.indexes.json     # Índices compostos para ordenação e filtros
├── scripts/
│   └── seedFirestore.js       # Povoamento determinístico idêntico ao seed MySQL
└── functions/
    ├── package.json           # Dependências (Express, firebase-admin, etc.)
    └── src/
        ├── index.js           # Ponto de entrada: exports.api = functions.https.onRequest(app)
        ├── middlewares/
        │   └── authMiddleware.js # Validação de JWT Bearer
        ├── controllers/       # Lógica de negócio sobre o Firestore
        │   ├── authController.js
        │   ├── questionController.js
        │   ├── answerController.js
        │   ├── simulationController.js
        │   └── filterController.js
        └── routes/            # Rotas /api/* idênticas às do MVC
            ├── authRoutes.js
            ├── questionRoutes.js
            ├── answerRoutes.js
            ├── simulationRoutes.js
            └── filterRoutes.js
```

### Modelo de Dados no Firestore (NoSQL orientado a documentos)

| Coleção | Estrutura Principal | Estratégia de Modelagem |
|---|---|---|
| `users` | Documento por usuário contendo credenciais (hash), perfil e status | Chave = UID do usuário |
| `subjects` | Documentos simples `{ id, name }` | Leitura pública rápida |
| `vestibulares` | Documentos simples `{ id, name, acronym }` | Leitura pública rápida |
| `questions` | Documentos completos contendo enunciado, alternativas em array e dados de matéria/banca | **Desnormalização:** armazena `subjectName` e `vestibularName` no próprio documento para eliminar necessidade de JOINs |
| `answers` | Registro de submissões de resposta com `userId`, `questionId`, `alternativeId`, `isCorrect` e timestamp | Indexado por `userId` e `answeredAt` para histórico e agregação estatística |
| `simulations` | Documentos com questões incorporadas em array, respostas marcadas e pontuação final | Agrupamento em documento autocontido |

---

## Front-end Android (Kotlin)

### Camadas de código

```
android/app/src/main/java/com/tcc/vestibular/
├── data/
│   ├── api/
│   │   ├── ApiClient.kt       # Singleton Retrofit; configura OkHttp, interceptors e BASE_URL
│   │   ├── ApiService.kt      # Interface com todos os endpoints declarados
│   │   └── SessionManager.kt  # Armazena e recupera o token JWT em SharedPreferences
│   ├── models/                # Data classes Kotlin (request/response DTOs)
│   └── utils/
│       └── ImageUtils.kt      # Utilitário para carregamento de imagens
└── ui/
    ├── auth/         # Login e registro
    ├── home/         # Tela inicial com navegação por abas (BottomNavigation)
    ├── questions/    # Listagem com filtros e detalhe de questão
    ├── simulation/   # Criação, execução (exame) e resultado de simulado
    ├── history/      # Histórico de respostas com paginação
    ├── profile/      # Estatísticas por matéria e detalhes de desempenho
    └── main/         # MainActivity: host do BottomNavigationView
```

### Fluxo de autenticação

1. `LoginActivity` / `RegisterActivity` → `POST /api/auth/login` ou `/register`
2. Resposta: `{ token, user }` → `SessionManager.saveAuthToken(token)`
3. `ApiClient.authInterceptor` injeta `Authorization: Bearer <token>` em todas as requisições subsequentes
4. Token expira em `7d` (configurável no back-end via `JWT_EXPIRES_IN`)

---

## Banco de dados MySQL — Estrutura

Os scripts estão em `database/`:

| Arquivo | Conteúdo |
|---|---|
| `schema.sql` | Schema completo: tabelas, índices, chaves estrangeiras |
| `migration_v2.sql` | Migração incremental (versão 2) |
| `migration_v3.sql` | Migração incremental (versão 3) |

Tabelas principais: `users`, `subjects`, `vestibulares`, `questions`, `answers`, `simulations`, `simulation_answers`.

---

## Decisões de projeto relevantes

- **`connectionLimit: 10`** no pool MySQL — valor deliberado para os experimentos do TCC; em produção, ajustar conforme carga esperada.
- **`android:usesCleartextTraffic="true"`** — necessário para HTTP local em desenvolvimento; deve ser removido em produção (usar HTTPS).
- **`BASE_URL` hardcoded** em `ApiClient.kt` — deve ser externalizado para `BuildConfig` ou `local.properties` em um projeto de produção.
