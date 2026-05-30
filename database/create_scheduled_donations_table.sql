-- ============================================
-- Tabela: scheduled_donations
-- Descrição: Tabela dedicada para agendamentos de doações
-- Criado em: 2025
-- ============================================

-- Criar tabela scheduled_donations
CREATE TABLE IF NOT EXISTS scheduled_donations (
  -- Identificação
  id BIGSERIAL PRIMARY KEY,
  
  -- Relacionamentos
  donor_id BIGINT NOT NULL,
  operator_code_id INTEGER NOT NULL,
  donation_id BIGINT DEFAULT NULL,
  
  -- Dados do Agendamento
  scheduled_date DATE NOT NULL,
  scheduled_observation TEXT,
  scheduled_tel_success VARCHAR(20) NOT NULL,
  
  -- Dados Adicionais da Doação Esperada
  scheduled_value DECIMAL(10,2),
  scheduled_campain VARCHAR(100),
  
  -- Status e Controle
  scheduled_status VARCHAR(20) DEFAULT 'Pendente' CHECK (scheduled_status IN ('Pendente', 'Concluído', 'Cancelado', 'Não Pode Ajudar')),
  scheduled_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Foreign Keys (ajustar nomes de tabelas conforme seu banco)
  CONSTRAINT fk_scheduled_donations_donor 
    FOREIGN KEY (donor_id) 
    REFERENCES donor(donor_id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_scheduled_donations_operator 
    FOREIGN KEY (operator_code_id) 
    REFERENCES operator(operator_code_id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_scheduled_donations_donation 
    FOREIGN KEY (donation_id) 
    REFERENCES donation(receipt_donation_id) 
    ON DELETE SET NULL
);

-- ============================================
-- Índices para melhorar performance
-- ============================================

-- Índice para buscar por doador
CREATE INDEX IF NOT EXISTS idx_scheduled_donations_donor_id 
  ON scheduled_donations(donor_id);

-- Índice para buscar por operador
CREATE INDEX IF NOT EXISTS idx_scheduled_donations_operator_code_id 
  ON scheduled_donations(operator_code_id);

-- Índice para buscar por data de agendamento
CREATE INDEX IF NOT EXISTS idx_scheduled_donations_scheduled_date 
  ON scheduled_donations(scheduled_date);

-- Índice para buscar por status
CREATE INDEX IF NOT EXISTS idx_scheduled_donations_status 
  ON scheduled_donations(scheduled_status);

-- Índice composto para buscar agendamentos ativos de um operador
CREATE INDEX IF NOT EXISTS idx_scheduled_donations_operator_active 
  ON scheduled_donations(operator_code_id, scheduled_active, scheduled_status);

-- Índice para buscar por doação vinculada
CREATE INDEX IF NOT EXISTS idx_scheduled_donations_donation_id 
  ON scheduled_donations(donation_id) 
  WHERE donation_id IS NOT NULL;

-- ============================================
-- Comentários nas colunas
-- ============================================

COMMENT ON TABLE scheduled_donations IS 'Tabela para gerenciar agendamentos de doações';
COMMENT ON COLUMN scheduled_donations.id IS 'Identificador único do agendamento';
COMMENT ON COLUMN scheduled_donations.donor_id IS 'ID do doador vinculado ao agendamento';
COMMENT ON COLUMN scheduled_donations.operator_code_id IS 'ID do operador responsável pelo agendamento';
COMMENT ON COLUMN scheduled_donations.donation_id IS 'ID da doação criada após conclusão do agendamento';
COMMENT ON COLUMN scheduled_donations.scheduled_date IS 'Data agendada para contato/coleta';
COMMENT ON COLUMN scheduled_donations.scheduled_observation IS 'Observações sobre o agendamento';
COMMENT ON COLUMN scheduled_donations.scheduled_tel_success IS 'Telefone usado para contato bem-sucedido';
COMMENT ON COLUMN scheduled_donations.scheduled_value IS 'Valor esperado da doação';
COMMENT ON COLUMN scheduled_donations.scheduled_campain IS 'Campanha associada ao agendamento';
COMMENT ON COLUMN scheduled_donations.scheduled_status IS 'Status do agendamento: Pendente, Concluído, Cancelado, Não Pode Ajudar';
COMMENT ON COLUMN scheduled_donations.scheduled_active IS 'Indica se o agendamento está ativo';
COMMENT ON COLUMN scheduled_donations.created_at IS 'Data e hora de criação do agendamento';
COMMENT ON COLUMN scheduled_donations.updated_at IS 'Data e hora da última atualização';
COMMENT ON COLUMN scheduled_donations.completed_at IS 'Data e hora em que o agendamento foi concluído ou cancelado';

-- ============================================
-- Trigger para atualizar updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_scheduled_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduled_donations_updated_at
  BEFORE UPDATE ON scheduled_donations
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_donations_updated_at();

-- ============================================
-- Views úteis
-- ============================================

-- View para agendamentos pendentes com informações do doador
-- Nota: donor_tel_2 e donor_tel_3 estão em tabelas separadas, não incluídas aqui
CREATE OR REPLACE VIEW v_scheduled_donations_pending AS
SELECT 
  sd.id,
  sd.donor_id,
  d.donor_name,
  d.donor_tel_1,
  d.donor_address,
  d.donor_neighborhood,
  d.donor_city,
  sd.operator_code_id,
  o.operator_name,
  sd.scheduled_date,
  sd.scheduled_observation,
  sd.scheduled_tel_success,
  sd.scheduled_value,
  sd.scheduled_campain,
  sd.created_at
FROM 
  scheduled_donations sd
  INNER JOIN donor d ON sd.donor_id = d.donor_id
  INNER JOIN operator o ON sd.operator_code_id = o.operator_code_id
WHERE 
  sd.scheduled_status = 'Pendente'
  AND sd.scheduled_active = TRUE
ORDER BY 
  sd.scheduled_date ASC;

-- View para agendamentos do dia
CREATE OR REPLACE VIEW v_scheduled_donations_today AS
SELECT 
  sd.id,
  sd.donor_id,
  d.donor_name,
  d.donor_tel_1,
  d.donor_address,
  sd.operator_code_id,
  o.operator_name,
  sd.scheduled_date,
  sd.scheduled_observation,
  sd.scheduled_tel_success,
  sd.scheduled_value,
  sd.scheduled_campain
FROM 
  scheduled_donations sd
  INNER JOIN donor d ON sd.donor_id = d.donor_id
  INNER JOIN operator o ON sd.operator_code_id = o.operator_code_id
WHERE 
  sd.scheduled_status = 'Pendente'
  AND sd.scheduled_active = TRUE
  AND sd.scheduled_date = CURRENT_DATE
ORDER BY 
  sd.created_at ASC;

-- View para agendamentos atrasados
CREATE OR REPLACE VIEW v_scheduled_donations_overdue AS
SELECT 
  sd.id,
  sd.donor_id,
  d.donor_name,
  d.donor_tel_1,
  d.donor_address,
  sd.operator_code_id,
  o.operator_name,
  sd.scheduled_date,
  sd.scheduled_observation,
  sd.scheduled_tel_success,
  sd.scheduled_value,
  sd.scheduled_campain,
  CURRENT_DATE - sd.scheduled_date AS days_overdue
FROM 
  scheduled_donations sd
  INNER JOIN donor d ON sd.donor_id = d.donor_id
  INNER JOIN operator o ON sd.operator_code_id = o.operator_code_id
WHERE 
  sd.scheduled_status = 'Pendente'
  AND sd.scheduled_active = TRUE
  AND sd.scheduled_date < CURRENT_DATE
ORDER BY 
  sd.scheduled_date ASC;

-- ============================================
-- Queries úteis para estatísticas
-- ============================================

-- Função para obter estatísticas de agendamentos por operador
CREATE OR REPLACE FUNCTION get_scheduled_donations_stats(
  p_operator_code_id INTEGER,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total BIGINT,
  pendentes BIGINT,
  concluidos BIGINT,
  cancelados BIGINT,
  nao_pode_ajudar BIGINT,
  valor_total DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total,
    COUNT(*) FILTER (WHERE scheduled_status = 'Pendente')::BIGINT AS pendentes,
    COUNT(*) FILTER (WHERE scheduled_status = 'Concluído')::BIGINT AS concluidos,
    COUNT(*) FILTER (WHERE scheduled_status = 'Cancelado')::BIGINT AS cancelados,
    COUNT(*) FILTER (WHERE scheduled_status = 'Não Pode Ajudar')::BIGINT AS nao_pode_ajudar,
    COALESCE(SUM(scheduled_value), 0) AS valor_total
  FROM 
    scheduled_donations
  WHERE 
    operator_code_id = p_operator_code_id
    AND (p_start_date IS NULL OR scheduled_date >= p_start_date)
    AND (p_end_date IS NULL OR scheduled_date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Dados de exemplo (comentados - descomentar se necessário)
-- ============================================

/*
-- Exemplo de inserção
INSERT INTO scheduled_donations (
  donor_id,
  operator_code_id,
  scheduled_date,
  scheduled_observation,
  scheduled_tel_success,
  scheduled_value,
  scheduled_campain,
  scheduled_status,
  scheduled_active
) VALUES (
  1,  -- ID do doador
  1,  -- ID do operador
  '2025-11-15',
  'Doador preferiu agendar para próxima semana',
  '21987654321',
  100.00,
  'Campanha Natal 2025',
  'Pendente',
  TRUE
);
*/

-- ============================================
-- Política de segurança (RLS) - Opcional
-- ============================================

/*
-- Habilitar Row Level Security
ALTER TABLE scheduled_donations ENABLE ROW LEVEL SECURITY;

-- Política para operadores verem apenas seus agendamentos
CREATE POLICY scheduled_donations_operator_policy ON scheduled_donations
  FOR ALL
  USING (operator_code_id = current_setting('app.current_operator_id')::INTEGER);

-- Política para admins verem todos os agendamentos
CREATE POLICY scheduled_donations_admin_policy ON scheduled_donations
  FOR ALL
  USING (current_setting('app.user_role') = 'Admin');
*/

