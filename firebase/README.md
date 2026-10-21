# Back-end BaaS (Firebase Cloud Functions + Cloud Firestore)

Este diretório contém a implementação da arquitetura **Backend-as-a-Service (BaaS)** desenvolvida no escopo do TCC para comparação empírica com o back-end tradicional **MVC customizado (Node.js + Express + MySQL)**, sob a ótica da norma **ISO/IEC 25010:2011**.

---

## 1. Visão Geral da Arquitetura

Na abordagem BaaS:
- **Camada de Computação Serverless:** Google Cloud Functions (2nd gen / Cloud Run) executando uma aplicação Express encapsulada em uma função HTTP (`api`).
- **Camada de Persistência:** Google Cloud Firestore — banco de dados NoSQL distribuído, baseado em documentos JSON e coleções hierárquicas.
- **Paridade Funcional:** Os endpoints, contratos de entrada e saída (JSON), códigos de status HTTP e lógica de autenticação (JWT) são equivalentes aos do back-end MVC, viabilizando uma comparação direta e justa nos testes de carga.

```
┌──────────────────────────────────────────────┐
│             Android App / k6                 │
└──────────────────────┬───────────────────────┘
                       │ HTTP/REST (Bearer JWT)
                       │
       ┌───────────────▼────────────────┐
       │   Cloud Function HTTP (api)    │
       │   Node.js 20 + Express         │
       └───────────────┬────────────────┘
                       │ Firebase Admin SDK
                       │
       ┌───────────────▼────────────────┐
       │        Cloud Firestore         │
       │   (users, questions, answers,  │
       │    simulations, subjects...)   │
       └────────────────────────────────┘
```

---

## 2. Estrutura de Arquivos

```
firebase/
├── firebase.json              # Configurações do Firebase e portas dos Emuladores
├── firestore.rules            # Regras de segurança declarativas do Firestore
├── firestore.indexes.json     # Definições de índices compostos (ordenação e filtros)
├── scripts/
│   └── seedFirestore.js       # Script determinístico de povoamento para benchmarks
└── functions/                 # Código da Cloud Function HTTP
    ├── package.json           # Dependências (express, firebase-admin, jsonwebtoken, etc.)
    └── src/
        ├── index.js           # Ponto de entrada (exports.api = functions.https.onRequest(app))
        ├── controllers/       # Lógica por domínio (auth, questions, answers, simulations)
        ├── middlewares/       # Validação de token JWT Bearer
        └── routes/            # Roteamento dos endpoints /api/*
```

---

## 3. Pré-requisitos

1. **Node.js** v18 ou v20 instalado.
2. **Firebase CLI** instalado globalmente:
   ```bash
   npm install -g firebase-tools
   ```
3. **Java Runtime Environment (JRE 11+)** instalado (necessário para executar o Firebase Local Emulator Suite).

---

## 4. Instalação e Execução Local (Emulador)

### Passo 1: Instalar dependências das Cloud Functions

```bash
cd firebase/functions
npm install
```

### Passo 2: Iniciar o Firebase Local Emulator Suite

Na raiz do diretório `firebase/`:

```bash
cd firebase
firebase emulators:start
```

Isso iniciará:
- **Cloud Functions Emulator:** `http://localhost:5001/<projeto>/us-central1/api`
- **Firestore Emulator:** `http://localhost:8080`
- **Emulator UI:** `http://localhost:4000` (painel web para inspecionar dados e requisições)

> Caso queira especificar um ID de projeto local sem precisar logar:
> ```bash
> firebase emulators:start --project vestibular-tcc-project
> ```

---

## 5. Povoamento Determinístico (Seed para Benchmark)

Para garantir paridade com o MySQL nos experimentos de desempenho da **ISO/IEC 25010**:

1. Mantenha os emuladores rodando em um terminal.
2. Em outro terminal, aponte o SDK para o emulador e execute o script:

```bash
# No PowerShell (Windows):
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
$env:GCLOUD_PROJECT="vestibular-tcc-project"
node firebase/scripts/seedFirestore.js

# No Bash (Linux / macOS):
export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
export GCLOUD_PROJECT="vestibular-tcc-project"
node firebase/scripts/seedFirestore.js
```

O script criará exatamente:
- 8 matérias
- 4 bancas examinadoras (ENEM, FUVEST, UNICAMP, UNESP)
- 120 questões distribuídas com 5 alternativas
- 10 usuários sintéticos para testes (`benchmark_aluno_1@tcc.edu.br` a `10`, senha `senha123`)
- 200 respostas históricas

---

## 6. Execução de Benchmarks contra o Firebase

Com o emulador ou a função na nuvem em execução:

```bash
# Exemplo de teste de carga com k6 apontando para a Cloud Function:
k6 run \
  --env TARGET_HOST=http://localhost:5001/vestibular-tcc-project/us-central1/api \
  --out json=backend/benchmarks/results_firebase_load.json \
  backend/benchmarks/load_test_k6.js
```

---

## 7. Publicação na Nuvem (Deploy no Firebase)

Caso deseje implantar no Google Cloud / Firebase real:

1. Faça login na sua conta Google:
   ```bash
   firebase login
   ```
2. Associe o projeto configurado no console do Firebase:
   ```bash
   firebase use <ID_DO_SEU_PROJETO_FIREBASE>
   ```
3. Defina a chave JWT nas configurações de ambiente:
   ```bash
   firebase functions:config:set jwt.secret="sua_chave_secreta_longa"
   ```
4. Efetue o deploy das regras, índices e Cloud Functions:
   ```bash
   firebase deploy
   ```
