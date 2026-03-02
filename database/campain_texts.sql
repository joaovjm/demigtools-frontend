-- ============================================
-- Tabela para armazenar textos estilizados das campanhas
-- ============================================

-- Criação da tabela campain_texts
CREATE TABLE IF NOT EXISTS campain_texts (
    id SERIAL PRIMARY KEY,
    campain_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image TEXT, -- Imagem em base64 (opcional)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Chave estrangeira para a tabela campain
    CONSTRAINT fk_campain
        FOREIGN KEY (campain_id) 
        REFERENCES campain(id)
        ON DELETE CASCADE
);

-- Índice para melhorar performance em buscas por campanha
CREATE INDEX idx_campain_texts_campain_id ON campain_texts(campain_id);
CREATE INDEX idx_campain_texts_is_active ON campain_texts(is_active);

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_campain_texts_updated_at
    BEFORE UPDATE ON campain_texts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS SOBRE A ESTRUTURA
-- ============================================

COMMENT ON TABLE campain_texts IS 'Armazena textos estilizados associados às campanhas';
COMMENT ON COLUMN campain_texts.id IS 'ID único do texto';
COMMENT ON COLUMN campain_texts.campain_id IS 'ID da campanha associada';
COMMENT ON COLUMN campain_texts.title IS 'Título do texto';
COMMENT ON COLUMN campain_texts.content IS 'Conteúdo HTML estilizado do texto';
COMMENT ON COLUMN campain_texts.image IS 'Imagem em formato base64 (opcional) - Use o marcador {{imagem}} no content para posicionar';
COMMENT ON COLUMN campain_texts.is_active IS 'Indica se o texto está ativo';
COMMENT ON COLUMN campain_texts.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN campain_texts.updated_at IS 'Data da última atualização';

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

-- Inserir um novo texto para uma campanha (sem imagem)
-- INSERT INTO campain_texts (campain_id, title, content)
-- VALUES (1, 'Mensagem de Boas-Vindas', '<h1>Bem-vindo!</h1><p>Obrigado por participar da nossa campanha.</p>');

-- Inserir um novo texto com imagem (use {{imagem}} no content para posicionar)
-- INSERT INTO campain_texts (campain_id, title, content, image)
-- VALUES (1, 'Email com Imagem', '<h1>Olá!</h1><p>Veja nossa novidade:</p>{{imagem}}<p>Esperamos que goste!</p>', 'data:image/jpeg;base64,...');

-- Buscar todos os textos de uma campanha específica
-- SELECT * FROM campain_texts WHERE campain_id = 1 AND is_active = true;

-- Atualizar um texto
-- UPDATE campain_texts SET content = '<p>Novo conteúdo</p>' WHERE id = 1;

-- Deletar um texto (soft delete)
-- UPDATE campain_texts SET is_active = false WHERE id = 1;

-- Deletar um texto (hard delete)
-- DELETE FROM campain_texts WHERE id = 1;

