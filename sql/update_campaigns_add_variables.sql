-- Script para atualizar tabela existente whatsapp_campaigns
-- Execute este script se você já tem a tabela criada sem a coluna 'variables'

-- Adicionar coluna variables se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_campaigns' 
        AND column_name = 'variables'
    ) THEN
        ALTER TABLE whatsapp_campaigns 
        ADD COLUMN variables JSONB DEFAULT '[]'::jsonb;
        
        -- Adicionar comentário
        COMMENT ON COLUMN whatsapp_campaigns.variables IS 'Array JSON com as variáveis para substituir nos templates ({{1}}, {{2}}, etc.)';
        
        -- Atualizar campanhas existentes com array vazio
        UPDATE whatsapp_campaigns 
        SET variables = '[]'::jsonb 
        WHERE variables IS NULL;
        
        RAISE NOTICE 'Coluna variables adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna variables já existe.';
    END IF;
END $$;
