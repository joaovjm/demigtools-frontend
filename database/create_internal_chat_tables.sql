-- ============================================================
-- CHAT INTERNO: conversas entre administradores e operadores
-- ============================================================
-- Execute este script no Supabase (SQL Editor) para criar as tabelas
-- necessárias para o chat interno.
-- ============================================================

-- Tabela de conversas internas (entre dois usuários: admin/operador)
CREATE TABLE IF NOT EXISTS internal_chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 INTEGER NOT NULL REFERENCES operator(operator_code_id),
    participant_2 INTEGER NOT NULL REFERENCES operator(operator_code_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT different_participants CHECK (participant_1 <> participant_2)
);

-- Uma única conversa por par de participantes (ordem não importa)
CREATE UNIQUE INDEX IF NOT EXISTS idx_internal_chat_conv_pair
    ON internal_chat_conversations (LEAST(participant_1, participant_2), GREATEST(participant_1, participant_2));

-- Tabela de mensagens do chat interno
CREATE TABLE IF NOT EXISTS internal_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES internal_chat_conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES operator(operator_code_id),
    body TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_internal_chat_conv_p1 ON internal_chat_conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_internal_chat_conv_p2 ON internal_chat_conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_internal_chat_conv_updated ON internal_chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_chat_messages_conv ON internal_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_internal_chat_messages_created ON internal_chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_internal_chat_messages_read ON internal_chat_messages(conversation_id, read_at) WHERE read_at IS NULL;

-- Trigger para atualizar updated_at da conversa quando nova mensagem
CREATE OR REPLACE FUNCTION update_internal_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE internal_chat_conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_internal_chat_message_insert ON internal_chat_messages;
CREATE TRIGGER trigger_internal_chat_message_insert
    AFTER INSERT ON internal_chat_messages
    FOR EACH ROW
    EXECUTE PROCEDURE update_internal_conversation_updated_at();

-- RLS (Row Level Security)
ALTER TABLE internal_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (ajuste conforme sua autenticação/Supabase)
CREATE POLICY "Allow all for internal_chat_conversations" ON internal_chat_conversations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for internal_chat_messages" ON internal_chat_messages
    FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para notificações de novas mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE internal_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE internal_chat_conversations;

COMMENT ON TABLE internal_chat_conversations IS 'Conversas do chat interno entre administradores e operadores';
COMMENT ON TABLE internal_chat_messages IS 'Mensagens do chat interno; read_at preenchido quando o destinatário lê';
