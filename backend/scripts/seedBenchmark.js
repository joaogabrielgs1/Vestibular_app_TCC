/**
 * =============================================================================
 * SCRIPT DE SEED DETERMINÍSTICO PARA BENCHMARK ACADÊMICO (TCC)
 * Norma ISO/IEC 25010: Reprodutibilidade e Paridade de Massa de Dados
 * =============================================================================
 * Popula o banco com uma quantidade controlada de matérias, vestibulares,
 * questões, usuários e respostas históricas para testes de carga e comparação.
 */

const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

async function seedBenchmark() {
  console.log('🚀 Iniciando povoamento determinístico do banco de dados para Benchmark...');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Matérias padrão
    const subjects = [
      { id: 1, name: 'Matemática' },
      { id: 2, name: 'Física' },
      { id: 3, name: 'Química' },
      { id: 4, name: 'Biologia' },
      { id: 5, name: 'História' },
      { id: 6, name: 'Geografia' },
      { id: 7, name: 'Língua Portuguesa' },
      { id: 8, name: 'Inglês' }
    ];

    for (const sub of subjects) {
      await connection.execute(
        `INSERT INTO subjects (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [sub.id, sub.name]
      );
    }
    console.log(`✅ ${subjects.length} matérias verificadas/inseridas.`);

    // 2. Vestibulares padrão
    const vestibulares = [
      { id: 1, name: 'Exame Nacional do Ensino Médio', acronym: 'ENEM' },
      { id: 2, name: 'Fundação Universitária para o Vestibular', acronym: 'FUVEST' },
      { id: 3, name: 'Universidade Estadual de Campinas', acronym: 'UNICAMP' },
      { id: 4, name: 'Universidade Estadual Paulista', acronym: 'UNESP' }
    ];

    for (const vest of vestibulares) {
      await connection.execute(
        `INSERT INTO vestibulares (id, name, acronym) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), acronym = VALUES(acronym)`,
        [vest.id, vest.name, vest.acronym]
      );
    }
    console.log(`✅ ${vestibulares.length} bancas/vestibulares verificados/inseridos.`);

    // 3. Gerar 120 questões distribuídas (15 questões por matéria, anos 2020 a 2024)
    let questionCounter = 0;
    const years = [2020, 2021, 2022, 2023, 2024];
    const difficulties = ['FACIL', 'MEDIO', 'DIFICIL'];

    for (let s = 1; s <= 8; s++) {
      for (let i = 1; i <= 15; i++) {
        questionCounter++;
        const vestId = ((questionCounter - 1) % 4) + 1;
        const year = years[(questionCounter - 1) % years.length];
        const diff = difficulties[(questionCounter - 1) % difficulties.length];
        const subjectName = subjects[s - 1].name;

        const statement = `[Benchmark Q${questionCounter}] Questão avaliativa de ${subjectName} sobre conteúdos programáticos do vestibular referente ao ano de ${year}. Analise as proposições e assinale a alternativa que apresenta a resolução tecnicamente correta.`;
        const explanation = `Resolução comentada da questão ${questionCounter}: A alternativa B é a correta de acordo com as diretrizes teóricas de ${subjectName}.`;

        const [qRes] = await connection.execute(
          `INSERT INTO questions (subject_id, vestibular_id, year, statement, explanation, difficulty)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [s, vestId, year, statement, explanation, diff]
        );

        const qId = qRes.insertId;

        // 5 alternativas por questão
        const letters = ['A', 'B', 'C', 'D', 'E'];
        for (const l of letters) {
          const isCorrect = (l === 'B') ? 1 : 0;
          await connection.execute(
            `INSERT INTO alternatives (question_id, letter, text, is_correct) VALUES (?, ?, ?, ?)`,
            [qId, l, `Proposição referente à alternativa ${l} para o item ${questionCounter} de ${subjectName}.`, isCorrect]
          );
        }
      }
    }
    console.log(`✅ ${questionCounter} questões padronizadas com 5 alternativas criadas.`);

    // 4. Usuários de Teste para Benchmark (10 usuários com senha padronizada 'senha123')
    const passwordHash = await bcrypt.hash('senha123', 10);
    const benchmarkUsers = [];

    for (let u = 1; u <= 10; u++) {
      const email = `benchmark_aluno_${u}@tcc.edu.br`;
      const fullName = `Aluno de Benchmark ${u}`;

      const [uRes] = await connection.execute(
        `INSERT INTO users (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [email, passwordHash]
      );
      const userId = uRes.insertId;

      await connection.execute(
        `INSERT INTO user_profiles (user_id, full_name, bio) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)`,
        [userId, fullName, 'Perfil sintético para testes automatizados da ISO 25010.']
      );

      benchmarkUsers.push(userId);
    }
    console.log(`✅ ${benchmarkUsers.length} usuários de teste criados (senha padrão: senha123).`);

    // 5. Histórico Sintético de Respostas (20 respostas por usuário = 200 respostas)
    let totalAnswers = 0;
    const [allQuestions] = await connection.query(`SELECT id FROM questions LIMIT 50`);

    for (const userId of benchmarkUsers) {
      for (let k = 0; k < 20; k++) {
        const q = allQuestions[k % allQuestions.length];
        const [alts] = await connection.query(`SELECT id, is_correct FROM alternatives WHERE question_id = ?`, [q.id]);
        if (alts.length > 0) {
          const selectedAlt = alts[k % alts.length];
          await connection.execute(
            `INSERT INTO user_answers (user_id, question_id, alternative_id, is_correct) VALUES (?, ?, ?, ?)`,
            [userId, q.id, selectedAlt.id, selectedAlt.is_correct]
          );
          totalAnswers++;
        }
      }
    }
    console.log(`✅ ${totalAnswers} respostas históricas sintéticas gravadas para cálculo de estatísticas.`);

    await connection.commit();
    console.log('🎉 Povoamento de Benchmark concluído com sucesso!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erro durante o povoamento:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedBenchmark();
