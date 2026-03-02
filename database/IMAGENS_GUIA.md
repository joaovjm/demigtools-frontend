# 🖼️ Guia de Uso - Imagens em Textos de Campanhas

## 📋 Visão Geral

Agora você pode adicionar **imagens** aos textos estilizados das campanhas e posicioná-las exatamente onde desejar usando o marcador `{{imagem}}`.

---

## 🚀 Como Usar Imagens

### Passo 1: Selecionar uma Imagem

1. No formulário de criação/edição de texto
2. Role até a seção **"Anexar Imagem (opcional)"**
3. Clique no botão **"Escolher Imagem"**
4. Selecione uma imagem do seu computador

**Requisitos da Imagem:**
- ✅ Formatos aceitos: JPG, PNG, GIF, WebP
- ✅ Tamanho máximo: 5MB
- ✅ Resolução recomendada: 800x600px para emails

### Passo 2: Posicionar a Imagem no Texto

Use o marcador `{{imagem}}` onde deseja que a imagem apareça:

```html
<h1>Bem-vindo à nossa campanha!</h1>
<p>Confira nossa novidade:</p>

{{imagem}}

<p>Esperamos que goste!</p>
```

**Ou use o botão IMG na barra de formatação:**
1. Posicione o cursor onde quer a imagem
2. Clique no botão **"IMG"** (verde com ícone de imagem)
3. O marcador `{{imagem}}` será inserido automaticamente

### Passo 3: Pré-visualização

- A pré-visualização mostrará a imagem no lugar do marcador
- Se não houver imagem anexada, aparecerá um placeholder cinza

### Passo 4: Salvar

- Clique em **"Salvar Texto"** ou **"Atualizar Texto"**
- A imagem será armazenada junto com o texto

---

## 💡 Exemplos Práticos

### Exemplo 1: Email com Logo no Topo

```html
<div style="text-align: center;">
  {{imagem}}
  <h1>Bem-vindo!</h1>
  <p>Obrigado por fazer parte da nossa campanha.</p>
</div>
```

### Exemplo 2: Imagem no Meio do Texto

```html
<h2>Novidade Especial</h2>
<p>Temos uma novidade incrível para compartilhar com você:</p>

{{imagem}}

<p>Esta é a nossa nova coleção! Não perca!</p>
<p><strong>Aproveite agora!</strong></p>
```

### Exemplo 3: Múltiplas Seções com Imagem

```html
<h1>Relatório de Impacto</h1>

<p>Graças à sua contribuição, conseguimos alcançar resultados incríveis:</p>

{{imagem}}

<h2>Números que Fazem a Diferença</h2>
<ul>
  <li>500 famílias atendidas</li>
  <li>1.000 refeições distribuídas</li>
  <li>50 crianças na escola</li>
</ul>

<p>Muito obrigado por fazer parte dessa história!</p>
```

### Exemplo 4: Email Marketing Completo

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 20px; background-color: #faa01c;">
    <h1 style="color: white; margin: 0;">{{nome_campanha}}</h1>
  </div>
  
  <div style="padding: 20px;">
    <h2>Olá, {{nome_doador}}!</h2>
    <p>Sua contribuição de <strong>{{valor_doacao}}</strong> fez toda a diferença!</p>
    
    {{imagem}}
    
    <p>Veja o impacto que você causou em nossa comunidade.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px;">
      <p style="margin: 0;"><strong>Total arrecadado:</strong> {{arrecadado}}</p>
      <p style="margin: 0;"><strong>Meta:</strong> {{meta}}</p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; background-color: #f5f5f5;">
    <p style="color: #666; margin: 0;">{{nome_empresa}} - {{ano_atual}}</p>
  </div>
</div>
```

---

## 🎨 Dicas de Design

### 1. Tamanho da Imagem
- Para emails: 600px de largura é o ideal
- Para notificações: 400px de largura
- A imagem se ajusta automaticamente ao tamanho da tela

### 2. Formato
- **JPG**: Melhor para fotos
- **PNG**: Melhor para logos e gráficos com transparência
- **GIF**: Para animações simples

### 3. Otimização
- Comprima a imagem antes de enviar
- Use ferramentas online como TinyPNG ou Squoosh
- Mantenha o tamanho abaixo de 2MB quando possível

### 4. Posicionamento
- **Centro**: Use `{{imagem}}` dentro de uma `<div style="text-align: center;">`
- **Esquerda/Direita**: Use CSS float
- **Responsivo**: A imagem sempre se adapta à tela

---

## 🔧 Recursos Técnicos

### Como Funciona

1. **Upload**: Imagem é convertida para base64
2. **Armazenamento**: Salva no banco de dados como TEXT
3. **Renderização**: Marcador `{{imagem}}` é substituído pela tag `<img>` com src em base64
4. **Preview**: Mostra a imagem em tempo real

### Estrutura no Banco

```sql
campain_texts
├── id (INTEGER)
├── campain_id (INTEGER)
├── title (VARCHAR)
├── content (TEXT) -- Contém {{imagem}}
├── image (TEXT) -- Base64 da imagem
└── ...
```

### Substituição de Marcador

```javascript
// Automático ao exibir
content.replace(/\{\{imagem\}\}/gi, 
  `<img src="${image}" alt="Imagem" style="max-width: 100%;" />`
);
```

---

## ⚙️ Atualização do Banco de Dados

### Se Você Já Tem a Tabela Criada

Execute o script `add_image_column.sql`:

```sql
-- Adiciona apenas a coluna image
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campain_texts' AND column_name = 'image'
    ) THEN
        ALTER TABLE campain_texts ADD COLUMN image TEXT;
        RAISE NOTICE 'Coluna "image" adicionada com sucesso';
    END IF;
END $$;
```

### Nova Instalação

Execute o script completo `campain_texts.sql` que já inclui a coluna image.

---

## 📱 Interface do Usuário

### Botões de Formatação

A barra de ferramentas agora inclui:

| Botão | Função | Atalho |
|-------|--------|--------|
| **B** | Negrito | - |
| **I** | Itálico | - |
| **U** | Sublinhado | - |
| **H1** | Título 1 | - |
| **H2** | Título 2 | - |
| **P** | Parágrafo | - |
| **BR** | Quebra de linha | - |
| **IMG** 🆕 | Inserir marcador de imagem | Clique |

### Seção de Upload

```
┌─────────────────────────────────────┐
│ Anexar Imagem (opcional)            │
├─────────────────────────────────────┤
│ [📷 Escolher Imagem]                │
│                                     │
│ ┌─────────────────────────────┐   │
│ │  [Preview da Imagem]         │   │
│ │  [🗑️ Remover]                │   │
│ │  nome_arquivo.jpg            │   │
│ └─────────────────────────────┘   │
│                                     │
│ ✅ Imagem carregada!                │
│    Use {{imagem}} para posicioná-la │
└─────────────────────────────────────┘
```

---

## 🐛 Solução de Problemas

### Imagem Não Aparece

**Problema:** Marcador `{{imagem}}` aparece como texto
**Solução:** 
- Verifique se anexou uma imagem
- Certifique-se de salvar o texto
- Recarregue a página

### Imagem Muito Grande

**Problema:** Imagem ocupa toda a tela
**Solução:**
- A imagem já tem `max-width: 100%` automático
- Se necessário, reduza o tamanho antes de enviar

### Erro ao Fazer Upload

**Problema:** "A imagem deve ter no máximo 5MB"
**Solução:**
- Comprima a imagem usando ferramentas online
- Reduza a resolução se for muito grande

### Marcador Não Funciona

**Problema:** `{{imagem}}` não é substituído
**Solução:**
- Use exatamente `{{imagem}}` (minúsculas)
- Não adicione espaços: ❌ `{{ imagem }}` ✅ `{{imagem}}`
- Certifique-se de ter anexado uma imagem

---

## ✅ Checklist de Uso

- [ ] Selecionar uma imagem (máx 5MB)
- [ ] Verificar preview da imagem
- [ ] Adicionar `{{imagem}}` no texto onde desejar
- [ ] Verificar pré-visualização do texto completo
- [ ] Salvar o texto
- [ ] Testar visualização na lista de textos

---

## 🎯 Casos de Uso Recomendados

### ✅ Bom Para:
- Logos da empresa
- Fotos de eventos
- Infográficos
- Banners promocionais
- Certificados
- Fotos de produtos
- Imagens de impacto social

### ❌ Evite:
- Imagens muito pesadas (>5MB)
- Múltiplas imagens no mesmo texto (use apenas uma)
- Imagens sensíveis ou confidenciais
- GIFs muito grandes

---

## 📊 Estatísticas

### Formato de Armazenamento
- **Tipo**: Base64 (texto)
- **Tamanho no banco**: ~33% maior que o arquivo original
- **Performance**: Ótima para imagens até 2MB

### Compatibilidade
- ✅ Emails (Gmail, Outlook, etc.)
- ✅ Navegadores modernos
- ✅ Apps mobile
- ✅ Sistemas de notificação

---

## 🔐 Segurança

### Validações Implementadas
1. ✅ Tipo de arquivo (apenas imagens)
2. ✅ Tamanho máximo (5MB)
3. ✅ Conversão segura para base64
4. ✅ Sanitização no servidor

### Boas Práticas
- Não faça upload de imagens com dados sensíveis
- Use imagens otimizadas
- Verifique sempre a pré-visualização
- Mantenha backup das imagens originais

---

## 📝 Resumo

| Recurso | Detalhes |
|---------|----------|
| **Marcador** | `{{imagem}}` |
| **Limite** | 5MB por imagem |
| **Formatos** | JPG, PNG, GIF, WebP |
| **Armazenamento** | Base64 no banco |
| **Posicionamento** | Onde colocar `{{imagem}}` |
| **Preview** | Tempo real |
| **Edição** | Sim, pode trocar a imagem |

---

## 🎓 Aprendizado Extra

### CSS para Imagens

```html
<!-- Imagem centralizada -->
<div style="text-align: center;">
  {{imagem}}
</div>

<!-- Imagem com borda -->
<div style="border: 2px solid #faa01c; padding: 10px; border-radius: 8px;">
  {{imagem}}
</div>

<!-- Imagem com legenda -->
<figure style="margin: 20px 0;">
  {{imagem}}
  <figcaption style="text-align: center; color: #666; font-size: 14px;">
    Legenda da imagem
  </figcaption>
</figure>
```

---

## 💬 Feedback

Se tiver dúvidas ou sugestões sobre o uso de imagens:
1. Consulte esta documentação
2. Verifique os exemplos práticos
3. Teste a pré-visualização antes de usar
4. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido para DemigTools** 🚀

**Versão:** 2.0 (com suporte a imagens)

**Última atualização:** Novembro 2025

---

**🎉 Aproveite o recurso de imagens para criar textos ainda mais impactantes!**

