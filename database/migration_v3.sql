-- =============================================================================
-- PROJETO TCC: SISTEMA DE QUESTÕES DE VESTIBULARES
-- MIGRAÇÃO V3: SUPORTE A IMAGENS NAS QUESTÕES
-- =============================================================================

USE `vestibular_db`;

-- -----------------------------------------------------------------------------
-- 1. Adicionar coluna image_url na tabela questions (Seguro para qualquer versão do MySQL)
-- -----------------------------------------------------------------------------
SET @dbname = DATABASE();
SET @tablename = "questions";
SET @columnname = "image_url";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `questions` ADD COLUMN `image_url` VARCHAR(255) NULL AFTER `statement`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- -----------------------------------------------------------------------------
-- 2. Inserção de Questões de Exemplo com Imagens (Gráficos / Ilustrações)
-- -----------------------------------------------------------------------------

-- Questão 9: Física com Gráfico (ENEM 2023)
INSERT IGNORE INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `image_url`, `explanation`, `difficulty`) VALUES
(9, 2, 1, 2023, 'O gráfico a seguir representa a variação da velocidade de um corpo em função do tempo durante um movimento retilíneo:\n\nCom base nas informações do gráfico, determine a aceleração média do corpo no intervalo de 0 a 10 segundos.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80', 'A aceleração média é dada pela variação da velocidade dividida pela variação do tempo: a = (vf - vi) / (tf - ti) = (20 - 0) / (10 - 0) = 2,0 m/s².', 'FACIL');

INSERT IGNORE INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(9, 'A', '1,0 m/s²', 0),
(9, 'B', '2,0 m/s²', 1),
(9, 'C', '3,0 m/s²', 0),
(9, 'D', '4,0 m/s²', 0),
(9, 'E', '5,0 m/s²', 0);

-- Questão 10: Biologia com Esquema Celular (FUVEST 2023)
INSERT IGNORE INTO `questions` (`id`, `subject_id`, `vestibular_id`, `year`, `statement`, `image_url`, `explanation`, `difficulty`) VALUES
(10, 4, 2, 2023, 'Analise o esquema simplificado da estrutura de uma célula eucariótica apresentado na imagem:\n\nQual organela celular indicada é a principal responsável pela síntese de ATP por meio da respiração celular aeróbica?', 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80', 'As mitocôndrias são as organelas responsáveis pela respiração celular aeróbica e pela maior parte da produção de ATP da célula eucariótica.', 'FACIL');

INSERT IGNORE INTO `alternatives` (`question_id`, `letter`, `text`, `is_correct`) VALUES
(10, 'A', 'Complexo Golgiense', 0),
(10, 'B', 'Retículo Endoplasmático Rugoso', 0),
(10, 'C', 'Mitocôndria', 1),
(10, 'D', 'Lisossomo', 0),
(10, 'E', 'Ribossomo livre', 0);
