# Vestibular App — TCC

Aplicativo mobile de preparação para vestibulares desenvolvido como Trabalho de Conclusão de Curso (TCC) em Ciencia da Computação.

O projeto implementa e compara empiricamente duas arquiteturas de back-end — **MVC customizado (Node.js + MySQL)** e **BaaS (Firebase/Firestore)** — avaliando desempenho, manutenibilidade e adequação funcional segundo a norma **ISO/IEC 25010:2011**.

---

## Funcionalidades implementadas

- Cadastro e autenticação de usuários (JWT)
- Atualização de e-mail, senha e exclusão de conta
- Listagem e filtro de questões por matéria, vestibular e ano
- Visualização de detalhes de questões com imagens
- Registro e histórico de respostas
- Estatísticas de desempenho por matéria
- Criação, execução e revisão de simulados personalizados

---

## Tecnologias utilizadas

### Front-end (Android)
| Tecnologia | Versão | Função |
|---|---|---|
| Kotlin | — | Linguagem principal |
| Android SDK | compileSdk 34, minSdk 24 | Plataforma mobile |
| Retrofit 2 | 2.11.0 | Cliente HTTP REST |
| OkHttp | 4.12.0 | Interceptação e logging HTTP |
| Gson Converter | 2.11.0 | Serialização JSON |
| Kotlinx Coroutines | 1.8.0 | Programação assíncrona |
| Lifecycle KTX | 2.7.0 | Gerenciamento de ciclo de vida |
| Material Design | 1.12.0 | Componentes de UI |
| ViewBinding | — | Ligação de views sem `findViewById` |

### Back-end MVC (Node.js)
| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | ≥ 18.0.0 (testado em v20.14.0) | Runtime JavaScript |
| Express | 4.19.2 | Framework HTTP |
| MySQL 2 | 3.9.7 | Driver MySQL com pool de conexões |
| bcryptjs | 2.4.3 | Hash de senhas |
| jsonwebtoken | 9.0.2 | Geração e validação de JWT |
| helmet | 7.1.0 | Segurança de cabeçalhos HTTP |
| dotenv | 16.4.5 | Variáveis de ambiente |
| response-time | 2.3.2 | Medição de latência interna |

### Banco de dados
| Tecnologia | Função |
|---|---|
| MySQL | Persistência relacional (arquitetura MVC) |
| Google Firestore (Firebase) | Persistência NoSQL orientada a documentos (arquitetura BaaS — comparativo) |

### Ferramentas de desenvolvimento e teste
| Ferramenta | Versão | Função |
|---|---|---|
| Jest | 29.7.0 | Testes de integração |
| Supertest | 6.3.4 | Simulação de requisições HTTP nos testes |
| Autocannon | 8.0.0 | Testes de carga e desempenho (benchmark interno) |
| k6 | — | Testes de carga e estresse externos (scripts em `backend/benchmarks/`) |
| nodemon | 3.1.0 | Reinício automático em desenvolvimento |

---

## Arquitetura e organização

O projeto é composto por dois componentes independentes:

```
vestibular_app/
├── android/          # Front-end: aplicativo Android (Kotlin)
├── backend/          # Back-end MVC: API REST em Node.js + MySQL
├── database/         # Scripts SQL: schema e migrações
└── docs/             # Documentação técnica complementar
```

### Back-end (MVC)

A API REST segue o padrão **MVC** com separação em camadas:

```
backend/src/
├── config/           # Configuração do pool de conexões MySQL
├── controllers/      # Lógica de negócio por domínio (auth, questions, simulations…)
├── middlewares/      # Autenticação JWT e tratamento centralizado de erros
├── models/           # Consultas SQL e acesso ao banco de dados
└── routes/           # Definição e agrupamento dos endpoints da API
```

Endpoints expostos sob `/api/`:

| Prefixo | Domínio |
|---|---|
| `/api/auth` | Registro, login, perfil, atualização de conta |
| `/api/questions` | Listagem e detalhe de questões com filtros |
| `/api/filters` | Matérias, vestibulares e anos disponíveis |
| `/api/answers` | Registro, histórico e estatísticas de respostas |
| `/api/simulations` | Criação, execução e resultado de simulados |
| `/health` | Verificação de disponibilidade da API |

### Front-end (Android)

Organizado em pacotes por camada:

```
android/app/src/main/java/com/tcc/vestibular/
├── data/
│   ├── api/          # ApiClient (Retrofit), ApiService (interface REST), SessionManager (JWT)
│   ├── models/       # Data classes Kotlin (DTOs)
│   └── utils/        # Utilitários de dados (ex: ImageUtils)
└── ui/
    ├── auth/         # LoginActivity, RegisterActivity
    ├── home/         # HomeActivity, HomeFragment
    ├── questions/    # Listagem e detalhe de questões
    ├── simulation/   # Criação, execução e resultado de simulados
    ├── history/      # Histórico de respostas
    ├── profile/      # Perfil, estatísticas e detalhes por matéria
    └── main/         # MainActivity (host de navegação)
```

A comunicação entre front-end e back-end é feita via **HTTP/REST** com autenticação **Bearer JWT**. O `ApiClient` configura o `BASE_URL` do Retrofit. **Em emulador Android padrão, use `10.0.2.2:3000`. Em dispositivo físico, use o IP da máquina na rede local** (atualmente hardcoded em `ApiClient.kt`).

---

## Pré-requisitos

- **Node.js** ≥ 18.0.0
- **MySQL Server** ≥ 8.0 ativo localmente
- **Android Studio** (para compilar e executar o front-end)
- **Java 8** (exigido pelo `kotlinOptions.jvmTarget = "1.8"`)
- Opcional para testes de carga externos: **k6** instalado no sistema

---

## Instalação e configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/joaogabrielgs1/Vestibular_app_TCC.git
cd Vestibular_app_TCC
```

### 2. Configurar o back-end

```bash
cd backend
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais MySQL e uma chave JWT segura:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=vestibular_db
JWT_SECRET=chave-longa-e-aleatoria
JWT_EXPIRES_IN=7d
```

### 3. Preparar o banco de dados MySQL

Crie o banco e aplique o schema:

```bash
mysql -u seu_usuario -p -e "CREATE DATABASE IF NOT EXISTS vestibular_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u seu_usuario -p vestibular_db < database/schema.sql
```

Se necessário, aplique as migrações em ordem:

```bash
mysql -u seu_usuario -p vestibular_db < database/migration_v2.sql
mysql -u seu_usuario -p vestibular_db < database/migration_v3.sql
```

### 4. Iniciar o back-end

```bash
# Produção / execução simples:
cd backend
npm start

# Desenvolvimento (reinício automático com nodemon):
npm run dev
```

O servidor ficará disponível em `http://localhost:3000`. Verifique com:

```bash
curl http://localhost:3000/health
```

### 5. Configurar e executar o front-end Android

1. Abra a pasta `android/` no **Android Studio**.
2. Aguarde a sincronização do Gradle.
3. Configure o `BASE_URL` em `android/app/src/main/java/com/tcc/vestibular/data/api/ApiClient.kt`:
   - **Emulador:** `http://10.0.2.2:3000/api/`
   - **Dispositivo físico (Wi-Fi):** `http://<IP-DA-SUA-MAQUINA>:3000/api/`
4. Execute em um emulador ou dispositivo físico.

> **Atenção:** O `android:usesCleartextTraffic="true"` no `AndroidManifest.xml` permite tráfego HTTP sem TLS, necessário para conexão com o servidor local durante o desenvolvimento.

---

## Testes

### Testes de integração (Jest + Supertest)

Os testes requerem o banco de dados MySQL ativo e configurado no `.env`.

```bash
cd backend

# Executar a suíte completa:
npm test

# Executar com relatório de cobertura:
npm run test:coverage
```

Os arquivos de teste estão em `backend/tests/`:

| Arquivo | Domínio testado |
|---|---|
| `auth.test.js` | Registro, login, perfil, atualização e exclusão de conta |
| `questions.test.js` | Listagem e filtro de questões |
| `answers.test.js` | Envio, histórico e estatísticas de respostas |
| `simulations.test.js` | Criação, execução, resposta e finalização de simulados |

> Os testes de integração criam e limpam dados reais no banco. Execute-os em um banco de desenvolvimento separado do de produção.

### Testes de desempenho (Autocannon)

Medem **Eficiência de Desempenho (ISO/IEC 25010)**: vazão (RPS), latência média, P90, P95, P99 e taxa de erros.

**Pré-requisito:** popular o banco com a massa de dados padronizada:

```bash
cd backend
npm run seed:benchmark
```

**Executar o benchmark interno (Autocannon):**

```bash
npm run benchmark
```

O script em `backend/scripts/runPerformanceBenchmark.js` executa 4 cenários com **20 conexões simultâneas por 10 segundos** cada:

| Cenário | Endpoint |
|---|---|
| 1 | `GET /api/questions?subject_id=1&year=2023&limit=10` — consulta paginada com filtro |
| 2 | `GET /api/filters/subjects` — listagem de matérias |
| 3 | `GET /api/filters/vestibulares` — listagem de bancas |
| 4 | `GET /health` — baseline de carga mínima |

### Testes de carga e estresse externos (k6)

Os scripts em `backend/benchmarks/` foram utilizados nos experimentos do TCC para comparação entre o back-end MVC e o Firebase.

> **Importante:** os resultados documentados no TCC foram medidos em ambiente controlado. A re-execução pode produzir valores diferentes conforme o hardware e a carga do sistema.

**Pré-requisito:** instalar o k6:

```bash
# Windows (winget):
winget install k6 --source winget

# Windows (Chocolatey):
choco install k6
```

**Teste de carga contínua (50 VUs por 3 minutos):**

```bash
k6 run --out json=benchmarks/results_node_load.json benchmarks/load_test_k6.js
```

**Teste de rajada / confiabilidade (spike: de 5 a 120 VUs):**

```bash
k6 run --out json=benchmarks/results_node_spike.json benchmarks/spike_test_k6.js
```

Para executar os mesmos cenários contra o Firebase Emulator:

```bash
k6 run --env TARGET_HOST=http://localhost:5001/<SEU-PROJETO>/us-central1/api \
  --out json=benchmarks/results_firebase_load.json \
  benchmarks/load_test_k6.js
```

Para detalhes sobre os parâmetros, métricas e procedimentos completos, consulte [`docs/metodologia-de-testes.md`](docs/metodologia-de-testes.md).

---

## Resultados e metodologia do TCC

Os experimentos de desempenho foram conduzidos segundo a **ISO/IEC 25010:2011**, avaliando as características de **Eficiência de Desempenho**, **Adequação Funcional**, **Manutenibilidade** e **Segurança** em ambas as arquiteturas.

Os resultados detalhados, incluindo métricas medidas, limitações metodológicas e discussão das variáveis de confusão, estão documentados em:

- [`docs/metodologia-de-testes.md`](docs/metodologia-de-testes.md) — ferramentas, cenários e procedimentos
- [`docs/resultados-testes.md`](docs/resultados-testes.md) — métricas obtidas e análise comparativa

---

## Solução de problemas comuns

**`Error: connect ECONNREFUSED 127.0.0.1:3306`**
O servidor MySQL não está ativo. Inicie-o e verifique as credenciais no `.env`.

**`Error: Unknown database 'vestibular_db'`**
O banco não foi criado. Execute o passo de preparação do banco descrito na seção de instalação.

**`JsonWebTokenError: invalid signature`**
O `JWT_SECRET` no `.env` foi alterado após tokens terem sido emitidos. Faça login novamente.

**App Android não conecta ao back-end**
Verifique o `BASE_URL` em `ApiClient.kt`. Em emulador, use `10.0.2.2`; em dispositivo físico, use o IP real da máquina na rede Wi-Fi local.

**Testes Jest falham com `ECONNREFUSED`**
O banco de dados precisa estar ativo e acessível antes de executar `npm test`.

---

## Segurança e variáveis de ambiente

- **Nunca versione o arquivo `.env`** — ele está listado no `.gitignore`.
- Use `.env.example` como referência para as variáveis necessárias.
- O `JWT_SECRET` deve ser uma string longa, aleatória e exclusiva por ambiente.
- Este projeto foi desenvolvido para fins acadêmicos. Para uso em produção, seria necessário configurar HTTPS, restringir o CORS e revisar as configurações de segurança.

---

## Contribuições

Este repositório corresponde ao projeto de TCC. Não há política de contribuição externa ativa.
