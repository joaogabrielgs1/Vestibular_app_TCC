-- =============================================================================
-- PROJETO TCC: SISTEMA DE QUESTÕES DE VESTIBULARES
-- MIGRAÇÃO V2: SISTEMA DE SIMULADOS + CARGA DE QUESTÕES
-- =============================================================================

USE `vestibular_db`;

-- -----------------------------------------------------------------------------
-- 1. Tabela de Simulados
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `simulations` (
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

-- -----------------------------------------------------------------------------
-- 2. Tabela de Questões do Simulado
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `simulation_questions` (
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

-- -----------------------------------------------------------------------------
-- 3. Carga Extra de Questões para Testes de Simulados
-- -----------------------------------------------------------------------------

-- Questão 5: Química (FUVEST 2023)
INSERT IGNORE INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(5, 3, 2, 2023, 'A queima de combustíveis fósseis libera diversos gases na atmosfera. Qual dos seguintes gases é o principal responsável pelo agravamento do efeito estufa antropogênico?', 'O dióxido de carbono (CO2) é o principal gás de efeito estufa emitido por atividades humanas devido ao grande volume gerado pela queima de combustíveis fósseis.', 'FACIL');

INSERT IGNORE INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(5, 'A', 'Monóxido de nitrogênio (NO)', 0),
(5, 'B', 'Dióxido de carbono (CO2)', 1),
(5, 'C', 'Gás hélio (He)', 0),
(5, 'D', 'Oxigênio molecular (O2)', 0),
(5, 'E', 'Dióxido de enxofre (SO2)', 0);

-- Questão 6: Geografia (ENEM 2023)
INSERT IGNORE INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(6, 6, 1, 2023, 'O bioma brasileiro caracterizado pela vegetação adaptada à seca (xerófila), com perda foliar na estação seca e solos pedregosos, é denominado:', 'A Caatinga é o único bioma exclusivamente brasileiro, com clima semiárido e vegetação adaptada à escassez hídrica.', 'FACIL');

INSERT IGNORE INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(6, 'A', 'Cerrado', 0),
(6, 'B', 'Mata Atlântica', 0),
(6, 'C', 'Caatinga', 1),
(6, 'D', 'Pampa', 0),
(6, 'E', 'Pantanal', 0);

-- Questão 7: Matemática (UNICAMP 2023)
INSERT IGNORE INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(7, 1, 3, 2023, 'Se a função f(x) = ax + b satisfaz f(1) = 5 e f(3) = 11, qual é o valor de a + b?', 'Temos: a(1) + b = 5 e a(3) + b = 11. Subtraindo as equações: 2a = 6 -> a = 3. Substituindo: 3 + b = 5 -> b = 2. Logo, a + b = 3 + 2 = 5.', 'MEDIO');

INSERT IGNORE INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(7, 'A', '4', 0),
(7, 'B', '5', 1),
(7, 'C', '6', 0),
(7, 'D', '7', 0),
(7, 'E', '8', 0);

-- Questão 8: Português (FUVEST 2022)
INSERT IGNORE INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `explanation`, `difficulty`) VALUES
(8, 7, 2, 2022, 'Na oração "Embora estivesse cansado, continuou estudando", a conjunção subordinativa destacada expressa ideia de:', '"Embora" é uma conjunção subordinativa concessiva, indicando uma concessão (oposição que não impede a ação principal).', 'FACIL');

INSERT IGNORE INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(8, 'A', 'Causa', 0),
(8, 'B', 'Consequência', 0),
(8, 'C', 'Concessão', 1),
(8, 'D', 'Condição', 0),
(8, 'E', 'Finalidade', 0);
