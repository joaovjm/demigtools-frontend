# 🚀 Quick Start - Textos Estilizados para Campanhas

## ⚡ Implementação Rápida (5 minutos)

### Passo 1: Criar a Tabela no Supabase

1. **Acesse o Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Login com suas credenciais
   - Selecione seu projeto: `khsapythnppdplqnlmkj`

2. **Abra o SQL Editor**
   ```
   Menu Lateral → SQL Editor → + New query
   ```

3. **Execute o SQL**
   - Copie TODO o conteúdo do arquivo: `campain_texts.sql`
   - Cole no editor SQL
   - Clique em **Run** (ou Ctrl + Enter)
   - ✅ Aguarde a mensagem de sucesso

4. **Verifique a Criação**
   ```sql
   SELECT * FROM campain_texts LIMIT 1;
   ```
   Se retornar sem erro, a tabela foi criada com sucesso!

### Passo 2: Testar no Aplicativo

1. **Inicie o aplicativo**
   ```bash
   npm start
   # ou
   yarn start
   ```

2. **Acesse o AdminManager**
   - Navegue até a página de gerenciamento de campanhas
   - Você verá a nova seção: **"Novo Texto Para Campanha"**

3. **Crie seu primeiro texto**
   - Selecione uma campanha
   - Digite um título: "Teste"
   - Digite um conteúdo: `<h1>Olá Mundo!</h1>`
   - Clique em **Salvar Texto**
   - ✅ Sucesso! O texto aparecerá na lista abaixo

## 📋 Checklist de Implementação

- [ ] Tabela `campain_texts` criada no Supabase
- [ ] Trigger `update_campain_texts_updated_at` criado
- [ ] Índices criados em `campain_id` e `is_active`
- [ ] Aplicativo reiniciado
- [ ] Primeiro texto de teste criado com sucesso

## 🎯 Comandos SQL de Teste

### Inserir um texto de teste manualmente

```sql
INSERT INTO campain_texts (campain_id, title, content)
VALUES (1, 'Mensagem de Teste', '<h1>Bem-vindo!</h1><p>Este é um teste.</p>')
RETURNING *;
```

### Listar todos os textos

```sql
SELECT 
    ct.id,
    ct.title,
    c.campain_name,
    ct.created_at
FROM campain_texts ct
JOIN campain c ON ct.campain_id = c.id
WHERE ct.is_active = true
ORDER BY ct.created_at DESC;
```

### Deletar todos os textos de teste

```sql
DELETE FROM campain_texts WHERE title LIKE '%Teste%';
```

## 🔥 Recursos Disponíveis

### No Componente Campain.jsx

✅ **Criar** novos textos estilizados  
✅ **Editar** textos existentes  
✅ **Deletar** textos (com confirmação)  
✅ **Filtrar** textos por campanha  
✅ **Pré-visualizar** HTML antes de salvar  
✅ **Botões de formatação** rápida (B, I, U, H1, H2, P, BR)  
✅ **Contador** de textos cadastrados  
✅ **Timestamps** automáticos (criação e atualização)  

### Helper Functions Criadas

| Arquivo | Função | Descrição |
|---------|--------|-----------|
| `getCampainTexts.jsx` | `getCampainTexts(campainId?)` | Busca textos (todos ou por campanha) |
| `insertCampainText.jsx` | `insertCampainText(data)` | Cria novo texto |
| `updateCampainText.jsx` | `updateCampainText(id, data)` | Atualiza texto existente |
| `deleteCampainText.jsx` | `deleteCampainText(id, hardDelete?)` | Deleta texto (soft/hard) |

## 💡 Exemplos de Uso Rápido

### Exemplo 1: Texto Simples

```html
<h2>Olá!</h2>
<p>Obrigado por sua doação.</p>
```

### Exemplo 2: Texto Formatado

```html
<h1>Bem-vindo à Campanha de Natal! 🎄</h1>
<p>Prezado doador,</p>
<p>Sua contribuição de <strong>R$ 100,00</strong> foi recebida com sucesso!</p>
<ul>
  <li>Data: 05/12/2023</li>
  <li>Campanha: Natal Solidário</li>
</ul>
<p><em>Muito obrigado!</em></p>
```

### Exemplo 3: Email Marketing

```html
<div style="text-align: center; padding: 20px;">
  <h1 style="color: #4CAF50;">Sua Ajuda Faz a Diferença!</h1>
  <p style="font-size: 18px;">
    Graças à sua doação, conseguimos ajudar <strong>50 famílias</strong> 
    este mês.
  </p>
  <br/>
  <a href="https://exemplo.com" style="
    background-color: #4CAF50; 
    color: white; 
    padding: 15px 30px; 
    text-decoration: none; 
    border-radius: 5px;
    display: inline-block;
  ">
    Ver Relatório Completo
  </a>
</div>
```

## 🎨 Dicas de Formatação

### Cores e Estilos

```html
<span style="color: red;">Texto vermelho</span>
<span style="background-color: yellow;">Fundo amarelo</span>
<span style="font-size: 24px;">Texto grande</span>
```

### Alinhamento

```html
<div style="text-align: center;">Centralizado</div>
<div style="text-align: right;">Alinhado à direita</div>
<div style="text-align: justify;">Justificado</div>
```

### Espaçamento

```html
<div style="margin: 20px;">Com margem</div>
<div style="padding: 15px;">Com espaçamento interno</div>
<div style="line-height: 1.8;">Entrelinhas aumentado</div>
```

## ⚠️ Atenção

### Cuidados ao Usar HTML

1. **Sempre feche as tags** corretamente
   ```html
   ❌ <p>Texto não fechado
   ✅ <p>Texto fechado</p>
   ```

2. **Use aspas em atributos**
   ```html
   ❌ <div style=color: red>Texto</div>
   ✅ <div style="color: red">Texto</div>
   ```

3. **Teste antes de usar em produção**
   - Use a pré-visualização
   - Teste em diferentes navegadores
   - Verifique em dispositivos móveis

## 🐛 Problemas Comuns e Soluções

### Erro: "relation campain_texts does not exist"
**Solução**: Execute o arquivo `campain_texts.sql` no Supabase SQL Editor

### Erro: "insert or update on table violates foreign key constraint"
**Solução**: Certifique-se de que a campanha selecionada existe na tabela `campain`

### Textos não aparecem na lista
**Solução**: 
1. Verifique se `is_active = true`
2. Atualize a página (F5)
3. Verifique o console do navegador

### Formatação HTML não aparece
**Solução**: 
1. Verifique se as tags estão corretas
2. Use a pré-visualização antes de salvar
3. Evite usar scripts (`<script>`) por segurança

## 📊 Estrutura da Tabela

```
campain_texts
├── id (PK, auto-increment)
├── campain_id (FK → campain.id) ⚠️ OBRIGATÓRIO
├── title (varchar 255) ⚠️ OBRIGATÓRIO
├── content (text) ⚠️ OBRIGATÓRIO
├── is_active (boolean) default: true
├── created_at (timestamp) auto
└── updated_at (timestamp) auto
```

## 🎓 Aprenda Mais

### HTML Básico
- Tags: https://developer.mozilla.org/pt-BR/docs/Web/HTML
- Estilos inline: https://www.w3schools.com/html/html_styles.asp

### React
- dangerouslySetInnerHTML: https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html

### Supabase
- Documentação: https://supabase.com/docs
- SQL Editor: https://supabase.com/docs/guides/database/overview

## ✅ Pronto!

Agora você pode:
- ✨ Criar textos estilizados para campanhas
- 📝 Gerenciar múltiplos textos por campanha
- 🎨 Usar HTML para formatação avançada
- 🔍 Filtrar e organizar seus textos
- 💾 Editar e deletar textos facilmente

**Bom trabalho! 🚀**

---

**Próximos passos sugeridos:**
1. Crie templates de textos reutilizáveis
2. Integre com sistema de envio de emails
3. Adicione variáveis dinâmicas ({{nome}}, {{valor}}, etc.)
4. Implemente preview de emails antes do envio


