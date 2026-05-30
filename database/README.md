# 📋 Sistema de Textos Estilizados para Campanhas

## 🎉 Bem-vindo!

Este sistema permite **criar, gerenciar e usar textos estilizados** (HTML) associados às suas campanhas, com suporte a **variáveis dinâmicas** para personalização automática.

---

## ⚡ Início Rápido (5 minutos)

### 1. Execute o SQL no Supabase
```sql
-- Copie todo o conteúdo de: campain_texts.sql
-- Cole no SQL Editor do Supabase
-- Clique em "Run"
```

### 2. Teste na Aplicação
```bash
npm start
# Navegue até AdminManager → Campanhas
```

### 3. Crie seu Primeiro Texto
- Selecione uma campanha
- Digite um título
- Escreva o conteúdo (HTML suportado)
- Clique em "Salvar Texto"

**✅ Pronto! Sistema funcionando!**

---

## 📚 Documentação Completa

### 🎯 Escolha seu Caminho

| Documento | Descrição | Tempo | Nível |
|-----------|-----------|-------|-------|
| **[INDEX.md](INDEX.md)** | 📋 Índice completo | 5 min | Todos |
| **[TUTORIAL_PASSO_A_PASSO.md](TUTORIAL_PASSO_A_PASSO.md)** | 📖 Tutorial completo | 20 min | 🟢 Iniciante |
| **[QUICK_START.md](QUICK_START.md)** | ⚡ Guia rápido | 5 min | 🟡 Intermediário |
| **[README_CAMPAIN_TEXTS.md](README_CAMPAIN_TEXTS.md)** | 📚 Documentação técnica | 30 min | Todos |
| **[VARIAVEIS_DINAMICAS.md](VARIAVEIS_DINAMICAS.md)** | 🔄 Guia de variáveis | 20 min | 🟡 Intermediário |

---

## 🎯 O que Você Pode Fazer?

### ✅ Funcionalidades Implementadas

- ✏️ **Criar** textos estilizados com HTML
- 📝 **Editar** textos existentes
- 🗑️ **Deletar** textos (soft ou hard delete)
- 🔍 **Filtrar** por campanha
- 🎨 **Formatar** com botões rápidos (B, I, U, H1, H2, etc.)
- 👁️ **Pré-visualizar** em tempo real
- 🔄 **Variáveis dinâmicas** (`{{nome}}`, `{{valor}}`, etc.)
- 🔗 **Associar** múltiplos textos a cada campanha
- ⏰ **Timestamps** automáticos

---

## 💡 Exemplo Rápido

### Criar um Texto

**No Componente Campain.jsx:**
```
1. Selecionar campanha: "Natal Solidário"
2. Título: "Confirmação de Doação"
3. Conteúdo:
```

```html
<h1>Obrigado, {{nome_doador}}!</h1>
<p>Sua doação de <strong>{{valor_doacao}}</strong> foi confirmada.</p>
<p>Campanha: {{nome_campanha}}</p>
```

### Usar o Texto

**No seu código:**
```javascript
import { replaceCampainTextVariables } from "./helper/replaceCampainTextVariables";

const texto = campainText.content;
const dados = {
  nome_doador: "João Silva",
  valor_doacao: "R$ 100,00",
  nome_campanha: "Natal Solidário"
};

const resultado = replaceCampainTextVariables(texto, dados);
// Resultado: "<h1>Obrigado, João Silva!</h1>..."
```

---

## 📁 Estrutura de Arquivos

```
database/
├── README.md                          ← VOCÊ ESTÁ AQUI
├── INDEX.md                           📋 Índice completo
├── campain_texts.sql                  ⚙️ Script SQL
├── TUTORIAL_PASSO_A_PASSO.md         📖 Tutorial
├── QUICK_START.md                     ⚡ Início rápido
├── README_CAMPAIN_TEXTS.md           📚 Documentação técnica
└── VARIAVEIS_DINAMICAS.md            🔄 Guia de variáveis

src/
├── components/AdminManager/
│   └── Campain.jsx                    💻 Interface do usuário
└── helper/
    ├── getCampainTexts.jsx            📥 Buscar
    ├── insertCampainText.jsx          📝 Criar
    ├── updateCampainText.jsx          ✏️ Editar
    ├── deleteCampainText.jsx          🗑️ Deletar
    └── replaceCampainTextVariables.jsx 🔄 Variáveis
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `campain_texts`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL | ID único (auto-incremento) |
| `campain_id` | INTEGER | ID da campanha (FK) |
| `title` | VARCHAR(255) | Título do texto |
| `content` | TEXT | Conteúdo HTML |
| `is_active` | BOOLEAN | Se está ativo |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

### Relacionamento

```
campain (1) ──── (N) campain_texts
```

Uma campanha pode ter **vários textos** associados.

---

## 🚀 Como Implementar

### Opção 1: Tutorial Completo (Recomendado para Iniciantes)
```
1. Leia: TUTORIAL_PASSO_A_PASSO.md
2. Siga cada passo
3. Teste tudo
```

### Opção 2: Início Rápido (Para Quem Tem Pressa)
```
1. Leia: QUICK_START.md
2. Execute: campain_texts.sql
3. Use: Campain.jsx
```

---

## 🎨 Recursos de Formatação

### HTML Suportado

```html
<!-- Formatação básica -->
<strong>Negrito</strong>
<em>Itálico</em>
<u>Sublinhado</u>

<!-- Títulos -->
<h1>Título 1</h1>
<h2>Título 2</h2>

<!-- Listas -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<!-- Estilos inline -->
<p style="color: blue; font-size: 18px;">Texto azul</p>

<!-- Links e imagens -->
<a href="url">Link</a>
<img src="url" alt="Imagem" />
```

### Variáveis Dinâmicas

```html
{{nome_doador}}          <!-- Nome do doador -->
{{valor_doacao}}         <!-- Valor da doação -->
{{data_doacao}}          <!-- Data -->
{{nome_campanha}}        <!-- Nome da campanha -->
{{nome_empresa}}         <!-- Nome da empresa -->
{{ano_atual}}            <!-- Ano atual -->
<!-- E muitas outras! Veja VARIAVEIS_DINAMICAS.md -->
```

---

## 🔧 API das Helper Functions

### getCampainTexts
```javascript
// Buscar todos os textos
const todos = await getCampainTexts();

// Buscar textos de uma campanha específica
const textos = await getCampainTexts(campainId);
```

### insertCampainText
```javascript
await insertCampainText({
  campain_id: 1,
  title: "Meu Texto",
  content: "<h1>Conteúdo</h1>"
});
```

### updateCampainText
```javascript
await updateCampainText(textId, {
  title: "Novo Título",
  content: "<p>Novo conteúdo</p>"
});
```

### deleteCampainText
```javascript
// Soft delete (padrão)
await deleteCampainText(textId);

// Hard delete (remove permanentemente)
await deleteCampainText(textId, true);
```

### replaceCampainTextVariables
```javascript
const texto = "<p>Olá {{nome}}!</p>";
const vars = { nome: "João" };
const resultado = replaceCampainTextVariables(texto, vars);
// "<p>Olá João!</p>"
```

---

## 🎯 Casos de Uso

### 1. Email de Confirmação de Doação
```html
<h1>Doação Confirmada!</h1>
<p>Olá {{nome_doador}}, sua doação de {{valor_doacao}} foi recebida.</p>
```

### 2. Lembrete de Doação Mensal
```html
<h2>Lembrete</h2>
<p>{{nome_doador}}, sua doação mensal vence em {{data_vencimento}}.</p>
```

### 3. Agradecimento Personalizado
```html
<div style="text-align: center;">
  <h1>Muito Obrigado!</h1>
  <p>{{nome_doador}}, você fez a diferença!</p>
</div>
```

### 4. Relatório de Impacto
```html
<p>Graças à sua doação, a campanha {{nome_campanha}} já arrecadou {{arrecadado}}!</p>
```

---

## 📊 Fluxo de Trabalho

```
┌──────────────────┐
│  1. CRIAR TEXTO  │  No componente Campain.jsx
└────────┬─────────┘
         ↓
┌──────────────────┐
│  2. ARMAZENAR    │  Banco de dados Supabase
└────────┬─────────┘
         ↓
┌──────────────────┐
│  3. BUSCAR       │  getCampainTexts()
└────────┬─────────┘
         ↓
┌──────────────────┐
│  4. SUBSTITUIR   │  replaceCampainTextVariables()
└────────┬─────────┘
         ↓
┌──────────────────┐
│  5. USAR         │  Email, notificação, etc.
└──────────────────┘
```

---

## ⚠️ Avisos Importantes

### Segurança
- ⚠️ Valide HTML antes de usar em produção
- ⚠️ Nunca permita `<script>` tags
- ⚠️ Use `dangerouslySetInnerHTML` com cuidado
- ⚠️ Sanitize user input se aplicável

### Performance
- ✅ Tabela otimizada com índices
- ✅ Soft delete mantém histórico
- ✅ Timestamps automáticos

### Backup
- 💾 Faça backup regular do banco
- 💾 Documente textos importantes
- 💾 Use controle de versão

---

## 🐛 Problemas Comuns

### Erro: "relation campain_texts does not exist"
**Solução:** Execute `campain_texts.sql` no Supabase

### Textos não aparecem na lista
**Solução:** Verifique se `is_active = true` e atualize a página

### Variáveis não são substituídas
**Solução:** Verifique sintaxe `{{variavel}}` e objeto de dados

### Formatação HTML não funciona
**Solução:** Valide HTML e use pré-visualização

**Para mais soluções:** Veja seção Troubleshooting em `README_CAMPAIN_TEXTS.md`

---

## 📞 Suporte e Recursos

### Documentação
- 📖 [Tutorial Completo](TUTORIAL_PASSO_A_PASSO.md)
- ⚡ [Início Rápido](QUICK_START.md)
- 📚 [Documentação Técnica](README_CAMPAIN_TEXTS.md)
- 🔄 [Guia de Variáveis](VARIAVEIS_DINAMICAS.md)
- 📋 [Índice Completo](INDEX.md)

### Links Externos
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [HTML Reference](https://developer.mozilla.org/pt-BR/docs/Web/HTML)

---

## ✅ Checklist de Implementação

- [ ] Ler documentação inicial (este arquivo)
- [ ] Executar `campain_texts.sql` no Supabase
- [ ] Verificar criação da tabela
- [ ] Testar criar texto no Campain.jsx
- [ ] Testar editar texto
- [ ] Testar deletar texto
- [ ] Testar variáveis dinâmicas
- [ ] Integrar com sistema de emails (opcional)
- [ ] Criar templates para sua aplicação
- [ ] Documentar variáveis específicas do projeto

---

## 🎓 Próximos Passos

### Para Iniciantes
1. ✅ Leia este README
2. 📖 Siga o [TUTORIAL_PASSO_A_PASSO.md](TUTORIAL_PASSO_A_PASSO.md)
3. 🧪 Crie alguns textos de teste
4. 📚 Explore exemplos em [README_CAMPAIN_TEXTS.md](README_CAMPAIN_TEXTS.md)

### Para Intermediários
1. ⚡ Use o [QUICK_START.md](QUICK_START.md)
2. 🔄 Aprenda sobre [VARIAVEIS_DINAMICAS.md](VARIAVEIS_DINAMICAS.md)
3. 🎨 Crie templates personalizados
4. 🔗 Integre com outras funcionalidades

### Para Avançados
1. 🔧 Customize helper functions
2. 🎯 Crie variáveis específicas do projeto
3. 📊 Implemente analytics de uso
4. 🚀 Otimize performance conforme necessário

---

## 🎉 Conclusão

Você agora tem acesso a um **sistema completo** de gerenciamento de textos estilizados para campanhas!

### O que foi implementado:
- ✅ Banco de dados estruturado
- ✅ Interface de gerenciamento
- ✅ Sistema de variáveis dinâmicas
- ✅ Documentação completa
- ✅ Exemplos práticos

### Comece agora:
1. Execute o SQL
2. Teste a interface
3. Crie seu primeiro texto

**Boa sorte com seu projeto!** 🚀

---

**Desenvolvido para DemigTools**

**Última atualização:** Novembro 2025

**Versão:** 1.0.0

---

## 📝 Índice de Documentos

- **[INDEX.md](INDEX.md)** - Índice completo com navegação
- **[TUTORIAL_PASSO_A_PASSO.md](TUTORIAL_PASSO_A_PASSO.md)** - Tutorial passo a passo
- **[QUICK_START.md](QUICK_START.md)** - Guia de início rápido
- **[README_CAMPAIN_TEXTS.md](README_CAMPAIN_TEXTS.md)** - Documentação técnica
- **[VARIAVEIS_DINAMICAS.md](VARIAVEIS_DINAMICAS.md)** - Guia de variáveis dinâmicas

---

**🎯 Escolha seu próximo passo e comece a usar o sistema agora!**

