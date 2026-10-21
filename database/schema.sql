-- =============================================================================
-- PROJETO TCC: SISTEMA DE QUESTÕES DE VESTIBULARES
-- BANCO DE DADOS COMPLETO: DDL + SEED DATA
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `vestibular_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `vestibular_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `simulation_questions`;
DROP TABLE IF EXISTS `simulations`;
DROP TABLE IF EXISTS `user_answers`;
DROP TABLE IF EXISTS `alternatives`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `vestibulares`;
DROP TABLE IF EXISTS `subjects`;
DROP TABLE IF EXISTS `user_profiles`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Usuários
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Perfil de Usuário
CREATE TABLE `user_profiles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `bio` VARCHAR(255) NULL,
  `avatar_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_profiles_user_id` (`user_id`),
  CONSTRAINT `fk_user_profiles_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Matérias / Disciplinas
CREATE TABLE `subjects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subjects_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Vestibulares / Bancas
CREATE TABLE `vestibulares` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `acronym` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vestibulares_acronym` (`acronym`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Questões
CREATE TABLE `questions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `subject_id` INT UNSIGNED NOT NULL,
  `vestibular_id` INT UNSIGNED NOT NULL,
  `year` SMALLINT UNSIGNED NOT NULL,
  `statement` LONGTEXT NOT NULL,
  `image_url` VARCHAR(255) NULL,
  `explanation` TEXT NULL,
  `difficulty` ENUM('FACIL', 'MEDIO', 'DIFICIL') NULL DEFAULT 'MEDIO',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_questions_subject_year` (`subject_id`, `year`),
  KEY `idx_questions_vestibular_year` (`vestibular_id`, `year`),
  KEY `idx_questions_year` (`year`),
  CONSTRAINT `fk_questions_subject`
    FOREIGN KEY (`subject_id`)
    REFERENCES `subjects` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_questions_vestibular`
    FOREIGN KEY (`vestibular_id`)
    REFERENCES `vestibulares` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Alternativas
CREATE TABLE `alternatives` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` INT UNSIGNED NOT NULL,
  `letter` CHAR(1) NOT NULL,
  `text` TEXT NOT NULL,
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alternatives_question_letter` (`question_id`, `letter`),
  KEY `idx_alternatives_question_id` (`question_id`),
  CONSTRAINT `fk_alternatives_question`
    FOREIGN KEY (`question_id`)
    REFERENCES `questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Respostas Avulsas dos Usuários
CREATE TABLE `user_answers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `question_id` INT UNSIGNED NOT NULL,
  `alternative_id` INT UNSIGNED NOT NULL,
  `is_correct` TINYINT(1) NOT NULL,
  `answered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_answers_user_history` (`user_id`, `answered_at` DESC),
  KEY `idx_user_answers_user_performance` (`user_id`, `is_correct`),
  KEY `idx_user_answers_question` (`question_id`),
  CONSTRAINT `fk_user_answers_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_answers_question`
    FOREIGN KEY (`question_id`)
    REFERENCES `questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_answers_alternative`
    FOREIGN KEY (`alternative_id`)
    REFERENCES `alternatives` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Simulados
CREATE TABLE `simulations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `subject_id` INT UNSIGNED NULL,
  `vestibular_id` INT UNSIGNED NULL,
  `year` SMALLINT UNSIGNED NULL,
  `total_questions` SMALLINT UNSIGNED NOT NULL,
  `current_question_index` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'EM_ANDAMENTO',
  `total_correct` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `total_wrong` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `accuracy_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `finished_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `idx_simulations_user_status` (`user_id`, `status`),
  KEY `idx_simulations_user_history` (`user_id`, `started_at` DESC),
  CONSTRAINT `fk_simulations_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_simulations_subject`
    FOREIGN KEY (`subject_id`)
    REFERENCES `subjects` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_simulations_vestibular`
    FOREIGN KEY (`vestibular_id`)
    REFERENCES `vestibulares` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Questões do Simulado
CREATE TABLE `simulation_questions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `simulation_id` INT UNSIGNED NOT NULL,
  `question_id` INT UNSIGNED NOT NULL,
  `order_index` SMALLINT UNSIGNED NOT NULL,
  `selected_alternative_id` INT UNSIGNED NULL,
  `is_correct` TINYINT(1) NULL,
  `answered_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sim_question_order` (`simulation_id`, `order_index`),
  UNIQUE KEY `uk_sim_question_unique` (`simulation_id`, `question_id`),
  KEY `idx_sim_questions_sim_id` (`simulation_id`),
  CONSTRAINT `fk_sim_questions_simulation`
    FOREIGN KEY (`simulation_id`)
    REFERENCES `simulations` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_sim_questions_question`
    FOREIGN KEY (`question_id`)
    REFERENCES `questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_sim_questions_alternative`
    FOREIGN KEY (`selected_alternative_id`)
    REFERENCES `alternatives` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DADOS INICIAIS (SEEDS)
-- =============================================================================

INSERT INTO `subjects` (`id`, `name`, `description`) VALUES
(1, 'Matemática', 'Álgebra, Geometria, Trigonometria, Estatística e Funções'),
(2, 'Física', 'Mecânica, Termodinâmica, Óptica, Ondulatória e Eletromagnetismo'),
(3, 'Química', 'Química Geral, Físico-Química, Química Orgânica e Atomística'),
(4, 'Biologia', 'Citologia, Genética, Ecologia, Fisiologia e Evolução'),
(5, 'História', 'História Geral e História do Brasil'),
(6, 'Geografia', 'Geografia Física, Humana, Geopolítica e Cartografia'),
(7, 'Português', 'Gramática, Interpretação de Texto e Literatura');

INSERT INTO `vestibulares` (`id`, `name`, `acronym`) VALUES
(1, 'Exame Nacional do Ensino Médio', 'ENEM'),
(2, 'Fundação Universitária para o Vestibular', 'FUVEST'),
(3, 'Universidade Estadual de Campinas', 'UNICAMP'),
(4, 'Universidade Estadual Paulista', 'UNESP');

-- Questão 1: Matemática (ENEM 2023)
INSERT INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(1, 1, 1, 2023, 'Um estudante precisa comprar um caderno e dispõe de R$ 30,00. Na papelaria, há uma promoção: cadernos de 100 folhas custam R$ 12,00 cada e cadernos de 200 folhas custam R$ 18,00 cada. Qual é o número máximo de folhas que o estudante pode comprar com o dinheiro disponível?', 'Comprando 1 caderno de 100 folhas (R$ 12,00) e 1 de 200 folhas (R$ 18,00), o total gasto é R$ 30,00 e o total de folhas é 100 + 200 = 300 folhas. Se comprasse dois de 100 folhas gastaria R$ 24,00 e teria 200 folhas.', 'FACIL');

INSERT INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(1, 'A', '200 folhas', 0),
(1, 'B', '250 folhas', 0),
(1, 'C', '300 folhas', 1),
(1, 'D', '350 folhas', 0),
(1, 'E', '400 folhas', 0);

-- Questão 2: Física (FUVEST 2023)
INSERT INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(2, 2, 2, 2023, 'Um carro percorre uma distância de 120 km em uma rodovia retilínea. Nas primeiras 2 horas, ele desenvolve velocidade média de 40 km/h. Qual deve ser sua velocidade média no restante do percurso para completar toda a viagem em 3 horas no total?', 'Nas primeiras 2h a 40 km/h, o carro percorre d1 = 40 * 2 = 80 km. Restam 120 - 80 = 40 km para percorrer em 3 - 2 = 1 hora restante. Logo, Vm = 40 km / 1 h = 40 km/h.', 'MEDIO');

INSERT INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(2, 'A', '30 km/h', 0),
(2, 'B', '40 km/h', 1),
(2, 'C', '50 km/h', 0),
(2, 'D', '60 km/h', 0),
(2, 'E', '80 km/h', 0);

-- Questão 3: Biologia (UNICAMP 2022)
INSERT INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(3, 4, 3, 2022, 'As vacinas de RNA mensageiro (mRNA) contra a COVID-19 fornecem instruções genéticas para que as células do próprio organismo produzam qual componente viral para estimular o sistema imunológico?', 'As vacinas de mRNA contêm o código para a síntese da proteína spike (S) viral na superfície da célula hospedeira, induzindo resposta imune humoral e celular sem causar a infecção.', 'MEDIO');

INSERT INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(3, 'A', 'O capsídeo lipídico completo do vírus inativado', 0),
(3, 'B', 'A enzima polimerase viral ativa', 0),
(3, 'C', 'A proteína da espícula (Spike)', 1),
(3, 'D', 'O genoma viral inteiro atenuado', 0),
(3, 'E', 'Anticorpos monoclonais sintéticos', 0);

-- Questão 4: História (ENEM 2022)
INSERT INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(4, 5, 1, 2022, 'A promulgação da Constituição Brasileira de 1988 representou um marco fundamental no processo de redemocratização do país por:', 'A Constituição de 1988, conhecida como Carta Cidadã, consolidou a transição democrática, restabelecendo a plenitude dos direitos fundamentais civis, sociais e políticos.', 'FACIL');

INSERT INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(4, 'A', 'Restaurar o regime parlamentarista no Brasil.', 0),
(4, 'B', 'Consagrar a ampliação dos direitos fundamentais e o Estado Democrático de Direito.', 1),
(4, 'C', 'Eliminar a separação tripartite de poderes.', 0),
(4, 'D', 'Instituir o voto censitário para as eleições municipais.', 0),
(4, 'E', 'Limitar o acesso universal à saúde e à educação básica.', 0);

-- Questão 5: Química (FUVEST 2023)
INSERT INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(5, 3, 2, 2023, 'A queima de combustíveis fósseis libera diversos gases na atmosfera. Qual dos seguintes gases é o principal responsável pelo agravamento do efeito estufa antropogênico?', 'O dióxido de carbono (CO2) é o principal gás de efeito estufa emitido por atividades humanas devido ao grande volume gerado pela queima de combustíveis fósseis.', 'FACIL');

INSERT INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(5, 'A', 'Monóxido de nitrogênio (NO)', 0),
(5, 'B', 'Dióxido de carbono (CO2)', 1),
(5, 'C', 'Gás hélio (He)', 0),
(5, 'D', 'Oxigênio molecular (O2)', 0),
(5, 'E', 'Dióxido de enxofre (SO2)', 0);

-- Questão 6: Geografia (ENEM 2023)
INSERT INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(6, 6, 1, 2023, 'O bioma brasileiro caracterizado pela vegetação adaptada à seca (xerófila), com perda foliar na estação seca e solos pedregosos, é denominado:', 'A Caatinga é o único bioma exclusivamente brasileiro, com clima semiárido e vegetação adaptada à escassez hídrica.', 'FACIL');

INSERT INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(6, 'A', 'Cerrado', 0),
(6, 'B', 'Mata Atlântica', 0),
(6, 'C', 'Caatinga', 1),
(6, 'D', 'Pampa', 0),
(6, 'E', 'Pantanal', 0);

-- Questão 7: Matemática (UNICAMP 2023)
INSERT INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(7, 1, 3, 2023, 'Se a função f(x) = ax + b satisfaz f(1) = 5 e f(3) = 11, qual é o valor de a + b?', 'Temos: a(1) + b = 5 e a(3) + b = 11. Subtraindo as equações: 2a = 6 -> a = 3. Substituindo: 3 + b = 5 -> b = 2. Logo, a + b = 3 + 2 = 5.', 'MEDIO');

INSERT INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(7, 'A', '4', 0),
(7, 'B', '5', 1),
(7, 'C', '6', 0),
(7, 'D', '7', 0),
(7, 'E', '8', 0);

-- Questão 8: Português (FUVEST 2022)
INSERT INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(8, 7, 2, 2022, 'Na oração "Embora estivesse cansado, continuou estudando", a conjunção subordinativa destacada expressa ideia de:', '"Embora" é uma conjunção subordinativa concessiva, indicando uma concessão (oposição que não impede a ação principal).', 'FACIL');

INSERT INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(8, 'A', 'Causa', 0),
(8, 'B', 'Consequência', 0),
(8, 'C', 'Concessão', 1),
(8, 'D', 'Condição', 0),
(8, 'E', 'Finalidade', 0);
