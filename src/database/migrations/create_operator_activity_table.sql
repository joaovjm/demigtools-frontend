-- Migração: Criar tabela de atividades das operadoras
-- Data: 2025-12-09
-- Descrição: Tabela para registrar todas as atividades das operadoras na Worklist

-- Criar tabela operator_activity
CREATE TABLE IF NOT EXISTS operator_activity (
    id BIGSERIAL PRIMARY KEY,
    operator_code_id INTEGER NOT NULL,
    operator_name VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    donor_id INTEGER,
    donor_name VARCHAR(255),
    request_name VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_activity_type CHECK (
        activity_type IN (
            'worklist_click',
            'new_donation',
            'scheduled',
            'not_answered',
            'cannot_help',
            'whatsapp'
        )
    )
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_operator_activity_operator_id 
    ON operator_activity(operator_code_id);

CREATE INDEX IF NOT EXISTS idx_operator_activity_created_at 
    ON operator_activity(created_at);

CREATE INDEX IF NOT EXISTS idx_operator_activity_type 
    ON operator_activity(activity_type);

CREATE INDEX IF NOT EXISTS idx_operator_activity_operator_name 
    ON operator_activity(operator_name);

-- Comentários na tabela
COMMENT ON TABLE operator_activity IS 'Registra atividades das operadoras na Worklist';
COMMENT ON COLUMN operator_activity.activity_type IS 'Tipo da atividade: worklist_click, new_donation, scheduled, not_answered, cannot_help, whatsapp';
COMMENT ON COLUMN operator_activity.metadata IS 'Dados adicionais em formato JSON (valor, data, observação, etc.)';

-- Habilitar Row Level Security (RLS) se necessário
-- ALTER TABLE operator_activity ENABLE ROW LEVEL SECURITY;

-- Policy para permitir inserção por qualquer usuário autenticado
-- CREATE POLICY "Enable insert for authenticated users" ON operator_activity
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para permitir leitura por qualquer usuário autenticado
-- CREATE POLICY "Enable read for authenticated users" ON operator_activity
--     FOR SELECT USING (auth.role() = 'authenticated');

