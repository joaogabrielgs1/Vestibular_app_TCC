# Resultados dos Testes de Desempenho — Vestibular App TCC

> **Aviso:** Os resultados documentados aqui foram medidos em ambiente controlado durante os experimentos do TCC. A re-execução dos benchmarks em hardware diferente, com carga de sistema distinta ou configuração de rede diferente produzirá valores distintos.

---

## Condições do experimento

| Parâmetro | Valor |
|---|---|
| Ferramenta principal | Autocannon v8.0.0 (back-end MVC) |
| Conexões simultâneas | 20 |
| Duração por cenário | 10 segundos |
| Pool de conexões MySQL | connectionLimit: 10 |
| Massa de dados | Seed determinístico (`npm run seed:benchmark`) |
| Ambiente MVC | Node.js v20.14.0, MySQL local |
| Ambiente BaaS | Firebase Cloud Functions HTTP (Cloud Run) + Cloud Firestore |
| Ambiente BaaS — Emulador | Firebase Emulator local |

---

## Resultados — Back-end MVC (Node.js + MySQL)

### Cenários de carga padrão (20 conexões, 10 s)

| Cenário | RPS (Vazão) | Latência Média (ms) | P90 (ms) | P99 (ms) | Erros |
|---|---|---|---|---|---|
| 1 — Questões c/ filtro composto | 1.232 | — | — | — | 0 |
| 2 — Metadados: matérias | 1.681 | — | — | — | 0 |
| 3 — Metadados: vestibulares | — | — | — | — | 0 |
| 4 — Baseline (`/health`) | — | — | — | — | 0 |

> Os valores completos de latência por cenário encontram-se documentados na seção de Resultados do TCC (`TCC_Monografia_Revisada.md`).

### Teste de estresse (100 conexões) — executado experimentalmente

| Métrica | Resultado |
|---|---|
| Comportamento | Degradação de desempenho observada |
| Causa identificada | Context-switching e esgotamento do pool (connectionLimit: 10) |

> Após o experimento, a configuração foi revertida para os valores originais (connectionLimit: 10, connections: 20).

---

## Resultados — Back-end BaaS (Firebase)

### Firebase Emulator local — cenários padrão (20 conexões, 10 s)

| Cenário | RPS (Vazão) | Latência Média (ms) | P99 (ms) |
|---|---|---|---|
| Baseline (`/health` equivalente) | 680 | — | — |

### Firebase Emulator local — teste com carga aumentada

| Métrica | Resultado |
|---|---|
| Vazão (cenário basal) | ~520 RPS |
| Latência média | 86,97 ms |
| P99 | 1.423,72 ms |
| Causa | Emulador local sem elasticidade horizontal; saturação sob carga elevada |

### Firebase Nuvem (Cloud Run)

| Condição | Comportamento observado |
|---|---|
| Primeira requisição após período de inatividade | Cold start: ~2 s (30 min de inatividade) |
| Carga sustentada | Manteve desempenho estável até o limite diário da quota gratuita |
| Sob carga aumentada | Não apresentou a mesma degradação do emulador (elasticidade horizontal do Cloud Run) |

---

## Comparativo consolidado

| Métrica | Node.js MVC | Firebase BaaS (Nuvem) |
|---|---|---|
| Vazão máxima (leitura simples) | 1.681 RPS | ~680 RPS |
| Vazão (consulta c/ filtro) | 1.232 RPS | — |
| Comportamento sob estresse | Degradação por pool e context-switching | Elástico (Cloud Run) |
| Cold Start | Não aplicável | ~2 s (após 30 min) |
| Latência de rede adicional | Não (local) | Sim (~201 ms medidos) |

---

## Limitações e variáveis de confusão

1. **Banco de dados diferente**: MySQL (relacional, normalizado) vs Firestore (NoSQL, documentos desnormalizados). Essa diferença estrutural é uma variável de confusão inerente à comparação.
2. **Latência de rede**: o back-end MVC foi testado localmente; o Firebase Nuvem adiciona latência de rede real (~201 ms).
3. **Cold Start**: o Firebase Nuvem apresenta cold start de aproximadamente 2 s após 30 minutos de inatividade, ausente no servidor Node.js local.
4. **Quota gratuita Firebase**: os testes na nuvem foram limitados pela quota diária do Firebase Spark Plan.
5. **Hardware**: os resultados são específicos ao hardware utilizado nos experimentos. A reprodução em outro ambiente produzirá valores distintos.
