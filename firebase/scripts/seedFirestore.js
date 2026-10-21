/**
 * =============================================================================
 * SCRIPT DE SEED DETERMINÍSTICO PARA CLOUD FIRESTORE (TCC - BaaS)
 * Norma ISO/IEC 25010: Reprodutibilidade e Paridade de Massa de Dados
 * =============================================================================
 *
 * Popula o Cloud Firestore (Local Emulator ou Nuvem) com a mesma massa
 * controlada utilizada no back-end MVC (MySQL):
 * - 8 matérias
 * - 4 vestibulares
 * - 120 questões padronizadas (5 alternativas cada)
 * - 10 usuários de teste
 * - 200 respostas históricas
 *
 * Execução com Firebase Emulator:
 *   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"  # PowerShell
 *   node scripts/seedFirestore.js
 */

'use strict';

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Inicializa SDK Admin (detecta automaticamente emulador se FIRESTORE_EMULATOR_HOST estiver setado)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'vestibular-tcc-project'
  });
}

const db = admin.firestore();

async function seedFirestore() {
  console.log('🚀 Iniciando povoamento determinístico no Firestore para Benchmark...');

  try {
    // 1. Matérias padrão
    const subjects = [
      { id: '1', name: 'Matemática' },
      { id: '2', name: 'Física' },
      { id: '3', name: 'Química' },
      { id: '4', name: 'Biologia' },
      { id: '5', name: 'História' },
      { id: '6', name: 'Geografia' },
      { id: '7', name: 'Língua Portuguesa' },
      { id: '8', name: 'Inglês' }
    ];

    const batch1 = db.batch();
    for (const sub of subjects) {
      const ref = db.collection('subjects').doc(sub.id);
      batch1.set(ref, { name: sub.name }, { merge: true });
    }
    await batch1.commit();
    console.log(`✅ ${subjects.length} matérias verificadas/inseridas.`);

    // 2. Vestibulares padrão
    const vestibulares = [
      { id: '1', name: 'Exame Nacional do Ensino Médio', acronym: 'ENEM' },
      { id: '2', name: 'Fundação Universitária para o Vestibular', acronym: 'FUVEST' },
      { id: '3', name: 'Universidade Estadual de Campinas', acronym: 'UNICAMP' },
      { id: '4', name: 'Universidade Estadual Paulista', acronym: 'UNESP' }
    ];

    const batch2 = db.batch();
    for (const vest of vestibulares) {
      const ref = db.collection('vestibulares').doc(vest.id);
      batch2.set(ref, { name: vest.name, acronym: vest.acronym }, { merge: true });
    }
    await batch2.commit();
    console.log(`✅ ${vestibulares.length} bancas/vestibulares verificados/inseridos.`);

    // 3. Gerar 120 questões distribuídas (15 por matéria, anos 2020 a 2024)
    let questionCounter = 0;
    const years = [2020, 2021, 2022, 2023, 2024];
    const difficulties = ['FACIL', 'MEDIO', 'DIFICIL'];
    const createdQuestionIds = [];

    // Lotes Firestore têm limite de 500 operações por batch
    let batch3 = db.batch();
    let opsCount = 0;

    for (let s = 1; s <= 8; s++) {
      for (let i = 1; i <= 15; i++) {
        questionCounter++;
        const vestIndex = ((questionCounter - 1) % 4);
        const vest = vestibulares[vestIndex];
        const year = years[(questionCounter - 1) % years.length];
        const diff = difficulties[(questionCounter - 1) % difficulties.length];
        const subject = subjects[s - 1];

        const qId = `q_${questionCounter}`;
        createdQuestionIds.push({ id: qId, subjectId: subject.id, subjectName: subject.name });

        const statement = `[Benchmark Q${questionCounter}] Questão avaliativa de ${subject.name} sobre conteúdos programáticos do vestibular referente ao ano de ${year}. Analise as proposições e assinale a alternativa que apresenta a resolução tecnicamente correta.`;
        const explanation = `Resolução comentada da questão ${questionCounter}: A alternativa B é a correta de acordo com as diretrizes teóricas de ${subject.name}.`;

        const letters = ['A', 'B', 'C', 'D', 'E'];
        const alternatives = letters.map((l, idx) => ({
          id: `${qId}_alt_${idx + 1}`,
          letter: l,
          text: `Proposição referente à alternativa ${l} para o item ${questionCounter} de ${subject.name}.`,
          isCorrect: l === 'B'
        }));

        const qRef = db.collection('questions').doc(qId);
        batch3.set(qRef, {
          statement,
          explanation,
          difficulty: diff,
          year,
          subjectId: subject.id,
          subjectName: subject.name,
          vestibularId: vest.id,
          vestibularName: vest.acronym,
          imageUrl: null,
          alternatives
        }, { merge: true });

        opsCount++;
        if (opsCount >= 400) {
          await batch3.commit();
          batch3 = db.batch();
          opsCount = 0;
        }
      }
    }
    if (opsCount > 0) {
      await batch3.commit();
    }
    console.log(`✅ ${questionCounter} questões padronizadas com 5 alternativas criadas.`);

    // 4. Usuários de Teste para Benchmark (10 usuários com senha padronizada 'senha123')
    const passwordHash = await bcrypt.hash('senha123', 10);
    const benchmarkUserIds = [];
    const batch4 = db.batch();

    for (let u = 1; u <= 10; u++) {
      const uId = `benchmark_user_${u}`;
      benchmarkUserIds.push(uId);

      const uRef = db.collection('users').doc(uId);
      batch4.set(uRef, {
        email: `benchmark_aluno_${u}@tcc.edu.br`,
        passwordHash,
        fullName: `Aluno de Benchmark ${u}`,
        bio: 'Perfil sintético para testes automatizados da ISO/IEC 25010.',
        avatarUrl: null,
        isActive: true,
        createdAt: admin.firestore.Timestamp.now()
      }, { merge: true });
    }
    await batch4.commit();
    console.log(`✅ ${benchmarkUserIds.length} usuários de teste criados (senha: senha123).`);

    // 5. Histórico Sintético de Respostas (20 respostas por usuário = 200 respostas)
    let totalAnswers = 0;
    let batch5 = db.batch();
    let ansOps = 0;

    for (const userId of benchmarkUserIds) {
      for (let k = 0; k < 20; k++) {
        totalAnswers++;
        const targetQ = createdQuestionIds[k % createdQuestionIds.length];
        const isCorrect = (k % 2 === 0); // alterna entre acerto e erro

        const ansRef = db.collection('answers').doc(`ans_${totalAnswers}`);
        batch5.set(ansRef, {
          userId,
          questionId: targetQ.id,
          alternativeId: isCorrect ? `${targetQ.id}_alt_2` : `${targetQ.id}_alt_1`,
          isCorrect,
          subjectId: targetQ.subjectId,
          subjectName: targetQ.subjectName,
          answeredAt: admin.firestore.Timestamp.now()
        }, { merge: true });

        ansOps++;
        if (ansOps >= 400) {
          await batch5.commit();
          batch5 = db.batch();
          ansOps = 0;
        }
      }
    }
    if (ansOps > 0) {
      await batch5.commit();
    }
    console.log(`✅ ${totalAnswers} respostas históricas sintéticas gravadas no Firestore.`);
    console.log('🎉 Povoamento determinístico do Firestore concluído com sucesso!');

  } catch (err) {
    console.error('❌ Erro durante o povoamento do Firestore:', err);
  } finally {
    process.exit(0);
  }
}

seedFirestore();
