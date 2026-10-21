/**
 * =============================================================================
 * SCRIPT DE TESTE DE RAJADA (SPIKE TEST) K6 - CONFIABILIDADE (ISO/IEC 25010)
 * =============================================================================
 * Avalia tolerância a falhas e comportamento sob picos repentinos de concorrência.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const failureRate = new Rate('spike_failure_rate');

export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Carga basal baixa (5 VUs)
    { duration: '15s', target: 120 },  // Salto súbito para 120 VUs (Spike)
    { duration: '1m', target: 120 },   // Sustentação do pico
    { duration: '15s', target: 5 },    // Queda para carga basal
    { duration: '10s', target: 0 },    // Finalização
  ],
  thresholds: {
    'spike_failure_rate': ['rate<0.05'], // Tolerância máxima de 5% de falhas no pico extremo
  },
};

const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:3000/api';

export default function () {
  const res = http.get(`${BASE_URL}/questions?limit=10`);
  const ok = check(res, {
    'Status é 200 sob rajada': (r) => r.status === 200,
  });
  failureRate.add(!ok);
  sleep(0.2);
}
