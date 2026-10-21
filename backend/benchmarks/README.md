# Guia Experimental de Benchmark (ISO/IEC 25010)

Este diretório contém os scripts padronizados para execução dos experimentos práticos de comparação entre o back-end em **Node.js/Express + MySQL** e o back-end em **Firebase**.

---

## 1. Pré-requisitos
- Node.js instalado (v18+)
- MySQL Server ativo com o banco `vestibular_db`
- Ferramenta **k6** instalada no sistema (ou via winget: `winget install k6 --source winget` ou chocolatey: `choco install k6`)

---

## 2. Passo a Passo da Execução Experimental

### Passo 1: Povoar a Base de Dados Padronizada
Execute o script de seed determinístico para garantir que ambos os bancos possuam a mesma massa de dados:
```bash
cd backend
npm run seed:benchmark
```

### Passo 2: Executar a Suíte de Testes Funcionais e Cobertura
Mede **Adequação Funcional** e **Manutenibilidade / Cobertura**:
```bash
npm run test:coverage
```

### Passo 3: Iniciar o Servidor Back-end
```bash
npm start
```

### Passo 4: Executar os Testes de Desempenho com k6
1. **Teste de Carga Contínua (50 VUs por 3 minutos):**
   ```bash
   k6 run --out json=benchmarks/results_node_load.json benchmarks/load_test_k6.js
   ```

2. **Teste de Rajada / Confiabilidade (Spike Test de 5 a 120 VUs):**
   ```bash
   k6 run --out json=benchmarks/results_node_spike.json benchmarks/spike_test_k6.js
   ```

### Passo 5: Repetir os Mesmos Testes contra o Firebase
Ao implementar o back-end do Firebase (com Firebase Functions / Emulator):
```bash
k6 run --env TARGET_HOST=http://localhost:5001/<SEU_PROJETO>/us-central1/api --out json=benchmarks/results_firebase_load.json benchmarks/load_test_k6.js
```

---

## 3. Métricas Extraídas Automaticamente pelo k6
- `http_req_duration`: Média, P90, P95 e P99 de latência.
- `http_reqs`: Vazão em requisições por segundo (RPS).
- `iso_error_rate`: Percentual de falhas sob carga.
- `x-response-time`: Tempo de processamento interno isolado da latência de rede.
