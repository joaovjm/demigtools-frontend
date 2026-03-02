-- Criação da tabela para armazenar campanhas de WhatsApp

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  selected_templates JSONB NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_name ON whatsapp_campaigns(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_created_at ON whatsapp_campaigns(created_at);

-- Comentários para documentação
COMMENT ON TABLE whatsapp_campaigns IS 'Tabela para armazenar campanhas de WhatsApp com múltiplos templates';
COMMENT ON COLUMN whatsapp_campaigns.name IS 'Nome da campanha (Ex: Campanha Leite)';
COMMENT ON COLUMN whatsapp_campaigns.description IS 'Descrição opcional da campanha';
COMMENT ON COLUMN whatsapp_campaigns.selected_templates IS 'Array JSON com os templates selecionados para a campanha';
COMMENT ON COLUMN whatsapp_campaigns.variables IS 'Array JSON com as variáveis para substituir nos templates ({{1}}, {{2}}, etc.)';
COMMENT ON COLUMN whatsapp_campaigns.created_at IS 'Data e hora de criação da campanha';
COMMENT ON COLUMN whatsapp_campaigns.updated_at IS 'Data e hora da última atualização da campanha';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_campaigns_updated_at 
    BEFORE UPDATE ON whatsapp_campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criação da tabela para logs de campanhas enviadas
CREATE TABLE IF NOT EXISTS campaign_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
  conversation_id VARCHAR(255),
  to_number VARCHAR(20) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  results JSONB,
  errors JSONB,
  total_sent INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at ON campaign_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_to_number ON campaign_logs(to_number);

-- Comentários para documentação
COMMENT ON TABLE campaign_logs IS 'Tabela para logs de campanhas enviadas';
COMMENT ON COLUMN campaign_logs.campaign_id IS 'ID da campanha que foi enviada';
COMMENT ON COLUMN campaign_logs.conversation_id IS 'ID da conversa onde a campanha foi enviada';
COMMENT ON COLUMN campaign_logs.to_number IS 'Número do destinatário';
COMMENT ON COLUMN campaign_logs.results IS 'Array JSON com os resultados dos templates enviados com sucesso';
COMMENT ON COLUMN campaign_logs.errors IS 'Array JSON com os erros ocorridos durante o envio';
COMMENT ON COLUMN campaign_logs.total_sent IS 'Total de templates enviados com sucesso';
COMMENT ON COLUMN campaign_logs.total_errors IS 'Total de templates que falharam';

-- Exemplo de inserção para teste
-- INSERT INTO whatsapp_campaigns (name, description, selected_templates) 
-- VALUES (
--     'Campanha Leite', 
--     'Campanha promocional para produtos lácteos',
--     '[
--         {"name": "template1", "category": "marketing", "language": "pt_BR"},
--         {"name": "template2", "category": "utility", "language": "pt_BR"}
--     ]'::jsonb
-- );
