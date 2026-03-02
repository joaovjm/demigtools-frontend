# Guia de Implementação - Textos Estilizados para Campanhas

## 📋 Visão Geral

Este guia explica como configurar e usar o sistema de textos estilizados associados às campanhas no DemigTools.

## 🗄️ Configuração do Banco de Dados

### Passo 1: Criar a Tabela no Supabase

Você tem duas opções para criar a tabela no banco de dados:

#### Opção A: Usando o SQL Editor do Supabase (Recomendado)

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **+ New query**
5. Copie e cole todo o conteúdo do arquivo `campain_texts.sql`
6. Clique em **Run** ou pressione `Ctrl + Enter`

#### Opção B: Usando a Interface do Supabase

1. Acesse **Table Editor** no painel do Supabase
2. Clique em **Create a new table**
3. Configure os seguintes campos:

| Nome do Campo | Tipo          | Configuração                          |
|---------------|---------------|---------------------------------------|
| id            | int8          | Primary Key, Auto-increment           |
| campain_id    | int8          | Foreign Key → campain(id), NOT NULL   |
| title         | varchar(255)  | NOT NULL                              |
| content       | text          | NOT NULL                              |
| is_active     | bool          | Default: true                         |
| created_at    | timestamptz   | Default: now()                        |
| updated_at    | timestamptz   | Default: now()                        |

4. Após criar a tabela, adicione os índices:
   - `idx_campain_texts_campain_id` em `campain_id`
   - `idx_campain_texts_is_active` em `is_active`

5. Configure o trigger para atualizar `updated_at` automaticamente (use o SQL do arquivo `campain_texts.sql`)

### Passo 2: Verificar a Configuração

Execute a seguinte query no SQL Editor para verificar se a tabela foi criada corretamente:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'campain_texts';
```

## 🔧 Estrutura dos Arquivos Criados

### Helper Functions (em `/src/helper/`)

1. **getCampainTexts.jsx** - Busca textos das campanhas
2. **insertCampainText.jsx** - Insere novo texto
3. **updateCampainText.jsx** - Atualiza texto existente
4. **deleteCampainText.jsx** - Deleta texto (soft ou hard delete)

### Componente Atualizado

- **Campain.jsx** - Componente principal atualizado com gerenciamento completo de textos

## 📖 Como Usar

### 1. Criar um Novo Texto para Campanha

1. Acesse o componente **Campain** no AdminManager
2. Selecione a **Campanha Associada** no dropdown
3. Digite um **Título do Texto** (ex: "Mensagem de Boas-Vindas")
4. Digite ou cole o **Conteúdo** na área de texto
5. Use os botões de formatação para estilizar o texto:
   - **B** - Negrito (`<strong>`)
   - **I** - Itálico (`<em>`)
   - **U** - Sublinhado (`<u>`)
   - **H1** - Título grande
   - **H2** - Título médio
   - **P** - Parágrafo
   - **BR** - Quebra de linha
6. Visualize o resultado na seção **Pré-visualização**
7. Clique em **Salvar Texto**

### 2. Editar um Texto Existente

1. Na seção **Textos Cadastrados**, encontre o texto que deseja editar
2. Clique no botão **Editar**
3. O formulário será preenchido com os dados do texto
4. Faça as alterações necessárias
5. Clique em **Atualizar Texto**
6. Ou clique em **Cancelar Edição** para descartar as alterações

### 3. Filtrar Textos por Campanha

1. Na seção **Textos Cadastrados**, use o dropdown **Filtrar por Campanha**
2. Selecione a campanha desejada ou escolha **Todas as campanhas**
3. A lista será atualizada automaticamente

### 4. Deletar um Texto

1. Na seção **Textos Cadastrados**, encontre o texto que deseja deletar
2. Clique no botão **Deletar** (vermelho)
3. Confirme a ação na janela de confirmação

## 🎨 Formatação HTML Suportada

O editor suporta HTML completo. Aqui estão alguns exemplos:

### Formatação Básica

```html
<strong>Texto em negrito</strong>
<em>Texto em itálico</em>
<u>Texto sublinhado</u>
```

### Títulos

```html
<h1>Título Principal</h1>
<h2>Subtítulo</h2>
<h3>Título de Seção</h3>
```

### Parágrafos e Quebras de Linha

```html
<p>Este é um parágrafo completo.</p>
<br/>
Texto com quebra de linha<br/>
Nova linha
```

### Listas

```html
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>

<ol>
  <li>Primeiro</li>
  <li>Segundo</li>
  <li>Terceiro</li>
</ol>
```

### Links e Imagens

```html
<a href="https://exemplo.com">Clique aqui</a>
<img src="url-da-imagem.jpg" alt="Descrição" />
```

### Formatação Avançada

```html
<div style="color: blue; font-size: 18px;">
  Texto azul com tamanho 18px
</div>

<span style="background-color: yellow;">Texto com fundo amarelo</span>
```

## 💡 Exemplos de Uso

### Exemplo 1: Mensagem de Boas-Vindas

```html
<h1>Bem-vindo à nossa campanha!</h1>
<p>Olá, <strong>doador</strong>!</p>
<p>Estamos muito felizes em tê-lo conosco nesta jornada.</p>
<p>Sua contribuição faz toda a diferença.</p>
<br/>
<em>Equipe DemigTools</em>
```

### Exemplo 2: Lembrete de Doação

```html
<h2>Lembrete de Doação</h2>
<p>Prezado doador,</p>
<p>Este é um lembrete amigável sobre sua contribuição mensal.</p>
<ul>
  <li>Data de vencimento: <strong>05/12/2023</strong></li>
  <li>Valor: <strong>R$ 100,00</strong></li>
  <li>Campanha: <strong>Ajuda Humanitária</strong></li>
</ul>
<p>Agradecemos sua generosidade!</p>
```

### Exemplo 3: Agradecimento

```html
<h1>Muito Obrigado! ❤️</h1>
<p><strong>Sua doação foi recebida com sucesso!</strong></p>
<p>Graças a pessoas como você, conseguimos continuar nosso trabalho.</p>
<br/>
<p style="color: #4CAF50; font-size: 18px;">
  Você fez a diferença na vida de muitas pessoas!
</p>
```

## 🔍 Consultas SQL Úteis

### Buscar todos os textos de uma campanha específica

```sql
SELECT * FROM campain_texts 
WHERE campain_id = 1 
AND is_active = true
ORDER BY created_at DESC;
```

### Contar textos por campanha

```sql
SELECT 
    c.campain_name,
    COUNT(ct.id) as total_textos
FROM campain c
LEFT JOIN campain_texts ct ON c.id = ct.campain_id
WHERE ct.is_active = true
GROUP BY c.id, c.campain_name;
```

### Buscar textos criados nos últimos 7 dias

```sql
SELECT * FROM campain_texts
WHERE created_at >= NOW() - INTERVAL '7 days'
AND is_active = true;
```

### Restaurar um texto deletado (soft delete)

```sql
UPDATE campain_texts 
SET is_active = true 
WHERE id = 1;
```

## 🚨 Troubleshooting

### Problema: Erro ao criar a tabela

**Solução**: Verifique se:
- A tabela `campain` existe no banco de dados
- Você tem permissões de administrador no Supabase
- Não existe uma tabela com o nome `campain_texts` já criada

### Problema: Textos não aparecem na lista

**Solução**: Verifique se:
- A tabela foi criada corretamente
- O campo `is_active` está como `true`
- A campanha selecionada tem textos associados
- Verifique o console do navegador para erros de API

### Problema: Formatação HTML não funciona

**Solução**: 
- Certifique-se de usar tags HTML válidas
- Verifique se não há tags não fechadas
- Use a pré-visualização para verificar antes de salvar

## 📊 Estrutura de Relacionamento

```
campain (Campanhas)
    ↓
    | (1:N)
    ↓
campain_texts (Textos Estilizados)
```

Cada campanha pode ter **múltiplos textos** associados.

## 🔐 Segurança

- Os textos são sanitizados no frontend antes de serem renderizados
- `dangerouslySetInnerHTML` é usado com cuidado apenas para conteúdo confiável
- A deleção soft delete mantém histórico dos textos
- Foreign key garante integridade referencial com a tabela de campanhas

## 📝 Notas Importantes

1. **Backup**: Sempre faça backup antes de executar scripts SQL
2. **Validação**: O sistema valida campos obrigatórios antes de salvar
3. **Timestamps**: Os campos `created_at` e `updated_at` são gerenciados automaticamente
4. **Cascade Delete**: Se uma campanha for deletada, todos os seus textos também serão deletados

## 🎯 Próximos Passos

Para melhorias futuras, considere:

1. Implementar um editor WYSIWYG (ex: React-Quill, TinyMCE)
2. Adicionar templates pré-definidos de textos
3. Implementar versionamento de textos
4. Adicionar suporte para variáveis dinâmicas (ex: {{nome_doador}})
5. Criar sistema de preview antes de enviar emails
6. Adicionar categorias/tags para os textos
7. Implementar busca por conteúdo dos textos

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique a seção de Troubleshooting
2. Consulte a documentação do Supabase
3. Verifique o console do navegador para erros
4. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido para DemigTools** 🚀

