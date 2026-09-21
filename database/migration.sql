-- Adicionar coluna progresso_json na tabela progresso_usuario
ALTER TABLE progresso_usuario ADD COLUMN IF NOT EXISTS progresso_json TEXT;

-- Remover a constraint de foreign key do modulo_id para aceitar valores livres
ALTER TABLE progresso_usuario DROP CONSTRAINT IF EXISTS progresso_usuario_modulo_id_fkey;

-- Agora modulo_id aceita qualquer valor inteiro
