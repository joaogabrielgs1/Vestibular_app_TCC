# Metodologia de Testes — Vestibular App TCC

Esta documentação descreve os procedimentos de teste utilizados nos experimentos do TCC para avaliação das arquiteturas MVC (Node.js + MySQL) e BaaS (Firebase) segundo a **ISO/IEC 25010:2011**.

---

## 1. Testes de integração (Adequação Funcional)

### Ferramenta
- **Jest** v29.7.0 + **Supertest** v6.3.4

### Objetivo
Verificar a conformidade funcional dos endpoints da API REST (ISO/IEC 25010 — Adequação Funcional e Segurança).

### Pré-requisitos
- MySQL ativo e acessível com as credenciais do `.env`
- Banco `vestibular_db` com schema aplicado

### Execução

```bash
cd backend

# Suíte completa:
npm test

# Com relatório de cobertura (gera backend/coverage/):
npm run test:coverage
```

### Cobertura de arquivos
Configurada em `package.json` para cobrir todos os arquivos em `src/**/*.js`, excluindo `src/server.js`.

### Arquivos de teste

| Arquivo | Endpoints cobertos |
|---|---|
| `tests/auth.test.js` | `POST /api/auth/register`, `/login`, `GET /profile`, `PUT /email`, `PUT /password`, `DELETE /account` |
| `tests/questions.test.js` | `GET /api/questions`, `GET /api/questions/:id` |
| `tests/answers.test.js` | `POST /api/answers`, `GET /api/answers/history`, `GET /api/answers/statistics`, `GET /api/answers/subject/:id` |
| `tests/simulations.test.js` | `POST /api/simulations`, `GET /active`, `POST /:id/answer`, `POST /:id/finish`, `GET /:id/result` |

### Comportamento dos testes
- Cada teste cria e limpa seus próprios dados no banco (via `afterAll`)
- Os testes são executados em série (`--runInBand`) para evitar condições de corrida
- A suíte é encerrada forçosamente ao final (`--forceExit`) para liberar o pool de conexões

---

## 2. Benchmark interno (Eficiência de Desempenho — Autocannon)

### Ferramenta
- **Autocannon** v8.0.0

### Objetivo
Medir Eficiência de Desempenho (ISO/IEC 25010): vazão (RPS), latência (média, P50, P90, P95, P99), taxa de erro e volume de dados transferidos.

### Pré-requisitos
- Banco populado com a massa de dados padronizada:
  ```bash
  npm run seed:benchmark
  ```

### Parâmetros dos cenários

| Parâmetro | Valor |
|---|---|
| Conexões simultâneas | 20 |
| Duração por cenário | 10 segundos |
| Pipelining | 1 (sem multiplexação) |
| Porta | 3001 (servidor interno, isolado do servidor principal) |

### Cenários

| # | Endpoint | Tipo |
|---|---|---|
| 1 | `GET /api/questions?subject_id=1&year=2023&limit=10` | I/O bound — consulta paginada com filtro composto |
| 2 | `GET /api/filters/subjects` | Metadados — listagem de matérias |
| 3 | `GET /api/filters/vestibulares` | Metadados — listagem de bancas |
| 4 | `GET /health` | Baseline — carga mínima (sem acesso ao banco) |

### Execução

```bash
cd backend
npm run benchmark
```

O script imprime os resultados no terminal e exibe uma tabela consolidada ao final.

---

## 3. Testes de carga e estresse externos (k6)

### Ferramenta
- **k6** (instalação externa ao projeto)

### Objetivo
Avaliar comportamento sob carga sustentada e sob rajadas (Confiabilidade e Eficiência de Desempenho — ISO/IEC 25010).

### Instalação do k6

```bash
# Windows (winget):
winget install k6 --source winget

# Windows (Chocolatey):
choco install k6

# Linux/macOS:
# Consulte: https://grafana.com/docs/k6/latest/set-up/install-k6/
```

### Scripts disponíveis

| Arquivo | Descrição |
|---|---|
| `backend/benchmarks/load_test_k6.js` | Teste de carga contínua: 50 VUs durante 3 minutos |
| `backend/benchmarks/spike_test_k6.js` | Teste de rajada: escala de 5 a 120 VUs |

### Métricas coletadas pelo k6

- `http_req_duration` — latência por requisição (média, P90, P95, P99)
- `http_reqs` — taxa de requisições por segundo (RPS / vazão)
- `iso_error_rate` — percentual de falhas (respostas não-2xx)
- `x-response-time` — tempo de processamento interno (excluindo latência de rede)

### Execução — Back-end Node.js

```bash
# Teste de carga:
k6 run --out json=benchmarks/results_node_load.json benchmarks/load_test_k6.js

# Teste de rajada:
k6 run --out json=benchmarks/results_node_spike.json benchmarks/spike_test_k6.js
```

### Execução — Firebase Emulator (ambiente comparativo)

```bash
k6 run \
  --env TARGET_HOST=http://localhost:5001/<SEU-PROJETO>/us-central1/api \
  --out json=benchmarks/results_firebase_load.json \
  benchmarks/load_test_k6.js
```

Substitua `<SEU-PROJETO>` pelo ID do projeto Firebase configurado no emulador.

---

## 4. Seed de dados para benchmark

### Scripts
- MySQL (MVC): `backend/scripts/seedBenchmark.js`
- Cloud Firestore (BaaS): `firebase/scripts/seedFirestore.js`

### Objetivo
Garantir paridade e reprodutibilidade entre os experimentos nos dois ambientes (ISO/IEC 25010 — reprodutibilidade metodológica): o banco relacional MySQL e o Firestore recebem a mesma massa de dados controlada antes de qualquer teste de desempenho.

### Execução no MySQL

```bash
cd backend
npm run seed:benchmark
```

### Execução no Cloud Firestore (Emulador ou Nuvem)

```bash
# Com o Firebase Emulator ativo (PowerShell):
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
$env:GCLOUD_PROJECT="vestibular-tcc-project"
node firebase/scripts/seedFirestore.js
```

Ambos os scripts povoam deterministicamente: 8 matérias, 4 bancas examinadoras, 120 questões com 5 alternativas, 10 usuários de teste e 200 respostas históricas.

---

## 5. Testes que não puderam ser re-executados no ambiente do TCC

| Teste | Motivo |
|---|---|
| Comparativo Firebase Nuvem | Requer conta Firebase ativa e limite diário da quota gratuita; os resultados do TCC foram obtidos durante a janela de quota disponível |
| Testes de estresse com 100 conexões | Foram executados experimentalmente e os valores documentados; a configuração foi revertida para os valores originais (connectionLimit: 10, connections: 20) |

> Os resultados obtidos nos experimentos do TCC encontram-se em [`docs/resultados-testes.md`](resultados-testes.md).
