/**
 * =============================================================================
 * SCRIPT DE BENCHMARK AUTOMATIZADO COM AUTOCANNON (ISO/IEC 25010)
 * =============================================================================
 * Executa testes de carga controlados e gera métricas estatísticas:
 * - Latência Média, P50, P90, P95, P99 e Desvio Padrão
 * - Throughput (Requisições por Segundo - RPS)
 * - Taxa de Erro HTTP (%)
 * - Volume Total de Dados Transferidos
 */

const autocannon = require('autocannon');
const http = require('http');
const app = require('../src/app');

async function runBenchmark() {
  console.log('🚀 Iniciando Servidor Interno de Testes de Desempenho...');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3001, '127.0.0.1', resolve));
  console.log('✅ Servidor de Benchmark ouvindo na porta 3001.\n');

  const scenarios = [
    {
      name: 'Cenário 1: Consulta Paginada de Questões com Filtro Composto (I/O Bound)',
      url: 'http://127.0.0.1:3001/api/questions?subject_id=1&year=2023&limit=10',
      method: 'GET',
      connections: 20,
      duration: 10,
      pipelining: 1
    },
    {
      name: 'Cenário 2: Consulta de Metadados e Filtros de Matérias',
      url: 'http://127.0.0.1:3001/api/filters/subjects',
      method: 'GET',
      connections: 20,
      duration: 10,
      pipelining: 1
    },
    {
      name: 'Cenário 3: Consulta de Bancas e Vestibulares',
      url: 'http://127.0.0.1:3001/api/filters/vestibulares',
      method: 'GET',
      connections: 20,
      duration: 10,
      pipelining: 1
    },
    {
      name: 'Cenário 4: Checagem de Saúde e Carga Basal (Baseline)',
      url: 'http://127.0.0.1:3001/health',
      method: 'GET',
      connections: 20,
      duration: 10,
      pipelining: 1
    }
  ];

  const resultsSummary = [];

  for (const scenario of scenarios) {
    console.log(`⏳ Executando ${scenario.name} (Conexões: ${scenario.connections}, Duração: ${scenario.duration}s)...`);

    const result = await autocannon({
      url: scenario.url,
      method: scenario.method,
      connections: scenario.connections,
      duration: scenario.duration,
      pipelining: scenario.pipelining
    });

    resultsSummary.push({
      scenario: scenario.name,
      requestsTotal: result.requests.total,
      requestsAverage: result.requests.average,
      latencyMean: result.latency.mean,
      latencyStddev: result.latency.stddev,
      latencyMin: result.latency.min,
      latencyP50: result.latency.p50 || result.latency.median,
      latencyP90: result.latency.p90,
      latencyP97_5: result.latency.p97_5,
      latencyP99: result.latency.p99,
      latencyMax: result.latency.max,
      throughputBytesSec: result.throughput.average,
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx
    });

    console.log(`   ✓ Requisições Totais: ${result.requests.total}`);
    console.log(`   ✓ Vazão Média: ${result.requests.average.toFixed(2)} req/s`);
    console.log(`   ✓ Latência Média: ${result.latency.mean.toFixed(2)} ms (Min: ${result.latency.min} ms, P90: ${result.latency.p90} ms, P99: ${result.latency.p99} ms, Max: ${result.latency.max} ms)`);
    console.log(`   ✓ Erros: ${result.errors} | Timeouts: ${result.timeouts}\n`);
  }

  server.close();
  console.log('=============================================================================');
  console.log('📊 RESUMO CONSOLIDADO PARA A DISSERTAÇÃO DE TCC (ISO/IEC 25010)');
  console.log('=============================================================================');
  console.table(resultsSummary.map(r => ({
    'Cenário': r.scenario.split(':')[0],
    'Total Req': r.requestsTotal,
    'RPS (Vazão)': r.requestsAverage.toFixed(1),
    'Latência Média (ms)': r.latencyMean.toFixed(2),
    'P90 (ms)': r.latencyP90,
    'P97.5 (ms)': r.latencyP97_5,
    'P99 (ms)': r.latencyP99,
    'Erros': r.errors
  })));

  process.exit(0);
}

runBenchmark().catch(err => {
  console.error('Erro no benchmark:', err);
  process.exit(1);
});
