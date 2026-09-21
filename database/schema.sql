-- ============================================
-- TABELA: usuarios (já existe)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    xp_total INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    streak_dias INTEGER DEFAULT 0,
    ultima_actividade DATE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ============================================
-- TABELA: disciplinas (História, Filosofia, Geografia, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS disciplinas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),
    cor VARCHAR(7),
    ordem INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: modulos (dentro de cada disciplina)
-- ============================================
CREATE TABLE IF NOT EXISTS modulos (
    id SERIAL PRIMARY KEY,
    disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    xp_necessario INTEGER DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modulos_disciplina ON modulos(disciplina_id);

-- ============================================
-- TABELA: aulas (conteúdo teórico de cada módulo)
-- ============================================
CREATE TABLE IF NOT EXISTS aulas (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    titulo VARCHAR(250) NOT NULL,
    conteudo TEXT NOT NULL,
    resumo TEXT,
    ordem INTEGER DEFAULT 0,
    xp_recompensa INTEGER DEFAULT 10,
    activa BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aulas_modulo ON aulas(modulo_id);

-- ============================================
-- TABELA: perguntas (banco de questões)
-- ============================================
CREATE TABLE IF NOT EXISTS perguntas (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'multipla_escolha',
    opcao_a TEXT NOT NULL,
    opcao_b TEXT NOT NULL,
    opcao_c TEXT,
    opcao_d TEXT,
    opcao_e TEXT,
    resposta_correta VARCHAR(1) NOT NULL,
    explicacao TEXT,
    dificuldade INTEGER DEFAULT 1,
    fonte VARCHAR(250),
    activa BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_perguntas_modulo ON perguntas(modulo_id);
CREATE INDEX IF NOT EXISTS idx_perguntas_dificuldade ON perguntas(dificuldade);

-- ============================================
-- TABELA: quizzes (sessões de quiz)
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    modulo_id INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    pontuacao INTEGER DEFAULT 0,
    total_perguntas INTEGER DEFAULT 0,
    perguntas_acertadas INTEGER DEFAULT 0,
    xp_ganho INTEGER DEFAULT 0,
    tempo_segundos INTEGER,
    completado BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quizzes_usuario ON quizzes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_modulo ON quizzes(modulo_id);

-- ============================================
-- TABELA: respostas_quiz (respostas individuais)
-- ============================================
CREATE TABLE IF NOT EXISTS respostas_quiz (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    pergunta_id INTEGER NOT NULL REFERENCES perguntas(id) ON DELETE CASCADE,
    resposta_usuario VARCHAR(1) NOT NULL,
    acertou BOOLEAN NOT NULL,
    tempo_segundos INTEGER,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_respostas_quiz ON respostas_quiz(quiz_id);

-- ============================================
-- TABELA: progresso_usuario (progresso por módulo)
-- ============================================
CREATE TABLE IF NOT EXISTS progresso_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    modulo_id INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    aulas_concluidas INTEGER DEFAULT 0,
    total_aulas INTEGER DEFAULT 0,
    perguntas_respondidas INTEGER DEFAULT 0,
    perguntas_acertadas INTEGER DEFAULT 0,
    percentual DECIMAL(5,2) DEFAULT 0,
    completo BOOLEAN DEFAULT false,
    ultima_actividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, modulo_id)
);

CREATE INDEX IF NOT EXISTS idx_progresso_usuario ON progresso_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_progresso_modulo ON progresso_usuario(modulo_id);
