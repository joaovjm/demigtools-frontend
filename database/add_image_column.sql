-- ============================================
-- Adicionar coluna IMAGE à tabela campain_texts
-- Execute este script se você já tem a tabela criada
-- ============================================

-- Adicionar coluna image (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campain_texts' AND column_name = 'image'
    ) THEN
        ALTER TABLE campain_texts ADD COLUMN image TEXT;
        
        -- Adicionar comentário à coluna
        COMMENT ON COLUMN campain_texts.image IS 'Imagem em formato base64 (opcional) - Use o marcador {{imagem}} no content para posicionar';
        
        RAISE NOTICE 'Coluna "image" adicionada com sucesso à tabela campain_texts';
    ELSE
        RAISE NOTICE 'Coluna "image" já existe na tabela campain_texts';
    END IF;
END $$;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campain_texts' AND column_name = 'image';

