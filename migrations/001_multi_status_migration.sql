-- =====================================================
-- Migração: Suporte a Múltiplos Status na WorkList
-- Data: 2026-02-06
-- Descrição: Converte o campo request_status de TEXT para JSONB
--           para suportar múltiplos status por requisição
-- =====================================================

-- Passo 1: Backup da tabela (recomendado antes de qualquer alteração)
-- Descomente a linha abaixo para criar um backup
CREATE TABLE request_backup AS SELECT * FROM request;

-- Passo 2: Verificar a estrutura atual da coluna
DO $$ 
BEGIN
    -- Exibir informações sobre a coluna
    RAISE NOTICE 'Verificando estrutura atual da coluna request_status...';
END $$;

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'request' 
  AND column_name = 'request_status';

-- Passo 3: Analisar dados existentes antes da migração
DO $$ 
BEGIN
    RAISE NOTICE 'Analisando dados existentes...';
END $$;

SELECT 
    request_status,
    COUNT(*) as quantidade
FROM request
WHERE request_status IS NOT NULL AND request_status != ''
GROUP BY request_status
ORDER BY quantidade DESC;

-- Passo 4: Converter a coluna para JSONB
-- Esta operação converte strings existentes em arrays JSON
DO $$ 
BEGIN
    RAISE NOTICE 'Iniciando conversão para JSONB...';
    
    -- Verifica se a coluna já é JSONB
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'request' 
          AND column_name = 'request_status'
          AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Coluna request_status já é do tipo JSONB. Nenhuma alteração necessária.';
    ELSE
        -- Converter coluna para JSONB
        ALTER TABLE request 
        ALTER COLUMN request_status TYPE JSONB USING 
          CASE 
            -- Se for NULL ou vazio, retorna array vazio
            WHEN request_status IS NULL OR request_status = '' THEN '[]'::jsonb
            -- Se já for um array JSON válido (caso já tenha sido parcialmente migrado)
            WHEN request_status::text LIKE '[%]' THEN request_status::jsonb
            -- Se for uma string simples, converte para array com um elemento
            ELSE jsonb_build_array(request_status::text)
          END;
        
        RAISE NOTICE 'Coluna request_status convertida para JSONB com sucesso!';
    END IF;
END $$;

-- Passo 5: Definir valor padrão para novos registros
ALTER TABLE request 
ALTER COLUMN request_status SET DEFAULT '[]'::jsonb;

-- Passo 6: Criar índice GIN para melhor performance em queries
-- Índices GIN são otimizados para tipos JSONB
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'request' 
          AND indexname = 'idx_request_status'
    ) THEN
        CREATE INDEX idx_request_status ON request USING gin(request_status);
        RAISE NOTICE 'Índice idx_request_status criado com sucesso!';
    ELSE
        RAISE NOTICE 'Índice idx_request_status já existe.';
    END IF;
END $$;

-- Passo 7: Criar índice adicional para queries que buscam status específico
-- Este índice melhora a performance de filtros
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'request' 
          AND indexname = 'idx_request_status_contains'
    ) THEN
        CREATE INDEX idx_request_status_contains ON request USING gin(request_status jsonb_path_ops);
        RAISE NOTICE 'Índice idx_request_status_contains criado com sucesso!';
    ELSE
        RAISE NOTICE 'Índice idx_request_status_contains já existe.';
    END IF;
END $$;

-- Passo 8: Verificar resultado da migração
DO $$ 
BEGIN
    RAISE NOTICE 'Verificando resultado da migração...';
END $$;

-- Ver exemplos de dados convertidos
SELECT 
    id,
    donor_id,
    request_status,
    jsonb_typeof(request_status) as tipo_json
FROM request
LIMIT 10;

-- Contar registros por tipo de status
SELECT 
    CASE 
        WHEN request_status = '[]'::jsonb THEN 'Vazio'
        WHEN jsonb_array_length(request_status) = 1 THEN 'Status Único'
        WHEN jsonb_array_length(request_status) > 1 THEN 'Múltiplos Status'
        ELSE 'Outro'
    END as tipo,
    COUNT(*) as quantidade
FROM request
GROUP BY tipo;

-- =====================================================
-- Queries Úteis para Trabalhar com o Novo Formato
-- =====================================================

-- 1. Buscar requisições com um status específico
-- SELECT * FROM request WHERE request_status @> '["Agendado"]'::jsonb;

-- 2. Buscar requisições com qualquer um dos status
-- SELECT * FROM request WHERE request_status ?| array['NA', 'NP'];

-- 3. Buscar requisições sem status
-- SELECT * FROM request WHERE request_status = '[]'::jsonb;

-- 4. Contar quantas requisições têm cada status
-- SELECT 
--     status_value,
--     COUNT(*) as total
-- FROM request,
--      jsonb_array_elements_text(request_status) as status_value
-- GROUP BY status_value
-- ORDER BY total DESC;

-- 5. Atualizar status (adicionar novo status mantendo os existentes)
-- UPDATE request 
-- SET request_status = request_status || '["NovoStatus"]'::jsonb
-- WHERE id = 123;

-- 6. Substituir todos os status por um único (como "Agendado")
-- UPDATE request 
-- SET request_status = '["Agendado"]'::jsonb
-- WHERE id = 123;

-- =====================================================
-- Rollback (apenas em caso de emergência)
-- =====================================================

-- ATENÇÃO: Execute apenas se precisar reverter a migração
-- Este script converte de volta para TEXT, mas perderá múltiplos status

-- ALTER TABLE request 
-- ALTER COLUMN request_status TYPE TEXT USING 
--   CASE 
--     WHEN jsonb_typeof(request_status) = 'array' 
--       AND jsonb_array_length(request_status) > 0 
--     THEN request_status->>0
--     ELSE NULL
--   END;
-- 
-- DROP INDEX IF EXISTS idx_request_status;
-- DROP INDEX IF EXISTS idx_request_status_contains;

-- =====================================================
-- Fim da Migração
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Migração concluída com sucesso!';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Verificar se os dados foram convertidos corretamente';
    RAISE NOTICE '2. Testar a aplicação com os novos formatos';
    RAISE NOTICE '3. Monitorar performance das queries';
END $$;
