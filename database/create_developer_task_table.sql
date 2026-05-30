-- Tabela para tarefas de desenvolvimento
-- Tarefas enviadas de administradores para o desenvolvedor
CREATE TABLE IF NOT EXISTS developer_task (
    id BIGSERIAL PRIMARY KEY,
    
    -- Conteúdo da tarefa
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- URLs das imagens (array de strings)
    images TEXT[] DEFAULT '{}',
    
    -- Status da tarefa
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
    
    -- Prioridade
    priority VARCHAR(20) DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta')),
    
    -- Admin que criou a tarefa
    admin_created_by INTEGER NOT NULL REFERENCES operator(operator_code_id),
    
    -- Resposta/Resultado do desenvolvedor
    developer_response TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para otimização de queries
CREATE INDEX IF NOT EXISTS idx_developer_task_status ON developer_task(status);
CREATE INDEX IF NOT EXISTS idx_developer_task_admin ON developer_task(admin_created_by);
CREATE INDEX IF NOT EXISTS idx_developer_task_created_at ON developer_task(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_developer_task_priority ON developer_task(priority);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_developer_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_developer_task_updated_at ON developer_task;
CREATE TRIGGER trigger_update_developer_task_updated_at
    BEFORE UPDATE ON developer_task
    FOR EACH ROW
    EXECUTE FUNCTION update_developer_task_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE developer_task ENABLE ROW LEVEL SECURITY;

-- Política para permitir que admins vejam e criem tarefas
CREATE POLICY "Admins can do everything on developer_task" ON developer_task
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Política para permitir que developers vejam e atualizem tarefas
CREATE POLICY "Developers can view and update developer_task" ON developer_task
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE developer_task;

-- Comentários da tabela
COMMENT ON TABLE developer_task IS 'Tabela para tarefas enviadas de administradores para o desenvolvedor';
COMMENT ON COLUMN developer_task.title IS 'Título resumido da tarefa';
COMMENT ON COLUMN developer_task.description IS 'Descrição detalhada da tarefa';
COMMENT ON COLUMN developer_task.images IS 'Array com URLs das imagens anexadas';
COMMENT ON COLUMN developer_task.status IS 'Status atual: pendente, em_andamento, concluido, cancelado';
COMMENT ON COLUMN developer_task.priority IS 'Nível de prioridade: baixa, media, alta';
COMMENT ON COLUMN developer_task.admin_created_by IS 'ID do admin que criou a tarefa';
COMMENT ON COLUMN developer_task.developer_response IS 'Resposta/feedback do desenvolvedor sobre a tarefa';

