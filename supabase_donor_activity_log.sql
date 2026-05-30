-- Tabela para armazenar histórico de atividades do doador
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS donor_activity_log (
  id BIGSERIAL PRIMARY KEY,
  donor_id BIGINT NOT NULL,
  operator_code_id VARCHAR(50) NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- Tipo de ação: 'donor_edit', 'donation_create', 'donation_edit', 'donation_delete', 'donor_access'
  action_description TEXT, -- Descrição detalhada da ação
  old_values JSONB, -- Valores antigos (para edições)
  new_values JSONB, -- Valores novos (para edições)
  related_donation_id BIGINT, -- ID da doação relacionada (se aplicável)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_donor_activity_donor 
    FOREIGN KEY (donor_id) 
    REFERENCES donor(donor_id) 
    ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_donor_activity_donor_id 
  ON donor_activity_log(donor_id);

CREATE INDEX IF NOT EXISTS idx_donor_activity_operator 
  ON donor_activity_log(operator_code_id);

CREATE INDEX IF NOT EXISTS idx_donor_activity_created_at 
  ON donor_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_donor_activity_action_type 
  ON donor_activity_log(action_type);

-- Habilitar Row Level Security (RLS)
ALTER TABLE donor_activity_log ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos operadores autenticados podem ler)
CREATE POLICY "Operadores podem visualizar histórico"
  ON donor_activity_log
  FOR SELECT
  USING (true); -- Ajuste conforme suas regras de autenticação

-- Política para inserção (todos operadores autenticados podem inserir)
CREATE POLICY "Operadores podem inserir histórico"
  ON donor_activity_log
  FOR INSERT
  WITH CHECK (true); -- Ajuste conforme suas regras de autenticação

-- Comentários na tabela
COMMENT ON TABLE donor_activity_log IS 'Armazena o histórico de todas as ações realizadas em doadores';
COMMENT ON COLUMN donor_activity_log.action_type IS 'Tipo de ação: donor_edit, donation_create, donation_edit, donation_delete, donor_access';
COMMENT ON COLUMN donor_activity_log.old_values IS 'JSON com valores antigos (para edições)';
COMMENT ON COLUMN donor_activity_log.new_values IS 'JSON com valores novos (para edições)';

