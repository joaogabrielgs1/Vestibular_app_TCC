/**
 * =============================================================================
 * SCRIPT DE TESTE DE CARGA K6 - BENCHMARK DE DESEMPENHO (ISO/IEC 25010)
 * =============================================================================
 * Mede: Latência Média, P95, P99, RPS, Taxa de Erros e Throughput.
 * 
 * Como executar contra Node.js:
 *   k6 run --env TARGET_HOST=http://localhost:3000/api load_test_k6.js
 * 
 * Como executar contra Firebase Emulator:
 *   k6 run --env TARGET_HOST=http://localhost:5001/<project-id>/us-central1/api load_test_k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Métricas Customizadas da ISO/IEC 25010
export const questionLatency = new Trend('iso_question_latency');
export const simulationFinishLatency = new Trend('iso_simulation_finish_latency');
export const errorRate = new Rate('iso_error_rate');
export const totalRequests = new Counter('iso_total_requests');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Fase 1: Aquecimento (Warm-up) com 10 usuários virtuais
    { duration: '2m', target: 50 },   // Fase 2: Carga estável (Steady-state) com 50 usuários virtuais
    { duration: '30s', target: 0 },   // Fase 3: Desaceleração (Cool-down)
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% das requisições devem responder em menos de 500ms
    'iso_error_rate': ['rate<0.01'],    // Taxa de erro deve ser menor que 1%
  },
};

const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:3000/api';

export default function () {
  // 1. Cenário: Consulta Paginada de Questões com Filtros
  const startQ = Date.now();
  const qRes = http.get(`${BASE_URL}/questions?subject_id=1&year=2023&limit=10`);
  questionLatency.add(Date.now() - startQ);
  totalRequests.add(1);

  const qCheck = check(qRes, {
    'GET /questions status é 200': (r) => r.status === 200,
    'GET /questions tem payload JSON': (r) => r.body.includes('data'),
  });
  errorRate.add(!qCheck);

  sleep(0.5);

  // 2. Cenário: Consulta de Filtros de Matérias
  const subRes = http.get(`${BASE_URL}/filters/subjects`);
  totalRequests.add(1);
  check(subRes, {
    'GET /filters/subjects status é 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
