# 📚 Índice - Sistema de Textos Estilizados para Campanhas

## 🎯 Navegação Rápida

Este é o índice completo de toda a documentação do sistema de textos estilizados para campanhas.

---

## 📁 Arquivos de Banco de Dados

### 📄 `campain_texts.sql`
**Script SQL para criar a tabela no banco de dados**

- 🎯 **Use quando:** Precisar criar ou recriar a tabela no Supabase
- 📝 **Contém:** 
  - Definição completa da tabela `campain_texts`
  - Índices para otimização de performance
  - Trigger para atualização automática do campo `updated_at`
  - Exemplos de queries SQL
- ⏱️ **Tempo:** 2 minutos para executar

👉 **Ação:** Copie e cole no SQL Editor do Supabase

---

## 📖 Guias e Documentação

### 1️⃣ `TUTORIAL_PASSO_A_PASSO.md`
**Tutorial completo para iniciantes** ⭐ COMECE AQUI!

- 🎯 **Ideal para:** Primeira implementação do sistema
- 📝 **Contém:** 
  - Configuração do banco de dados passo a passo
  - Como usar a interface do componente
  - Criar primeiro texto estilizado
  - Exemplos práticos de uso
  - Testes e validações
- ⏱️ **Tempo:** 15-20 minutos
- 🎓 **Nível:** Iniciante

👉 **[Leia o Tutorial Completo](TUTORIAL_PASSO_A_PASSO.md)**

---

### 2️⃣ `QUICK_START.md`
**Guia de início rápido**

- 🎯 **Ideal para:** Implementação rápida (já tem experiência)
- 📝 **Contém:** 
  - Checklist de implementação
  - Comandos SQL essenciais
  - Exemplos de uso rápido
  - Dicas de formatação
- ⏱️ **Tempo:** 5 minutos
- 🎓 **Nível:** Intermediário

👉 **[Acesso Rápido](QUICK_START.md)**

---

### 3️⃣ `README_CAMPAIN_TEXTS.md`
**Documentação técnica completa**

- 🎯 **Ideal para:** Referência técnica detalhada
- 📝 **Contém:** 
  - Visão geral do sistema
  - Estrutura dos arquivos
  - Como usar todas as funcionalidades
  - Formatação HTML suportada
  - Exemplos avançados
  - Consultas SQL úteis
  - Troubleshooting
- ⏱️ **Tempo:** 30 minutos (leitura completa)
- 🎓 **Nível:** Todos os níveis

👉 **[Documentação Completa](README_CAMPAIN_TEXTS.md)**

---

### 4️⃣ `VARIAVEIS_DINAMICAS.md`
**Guia de variáveis dinâmicas**

- 🎯 **Ideal para:** Personalização avançada de textos
- 📝 **Contém:** 
  - O que são variáveis dinâmicas
  - Como usar variáveis no formato `{{nome}}`
  - Lista completa de variáveis disponíveis
  - Exemplos práticos (emails, notificações)
  - Integração com código
  - Formatação avançada (moedas, datas)
  - Criar suas próprias variáveis
- ⏱️ **Tempo:** 20 minutos
- 🎓 **Nível:** Intermediário/Avançado

👉 **[Guia de Variáveis](VARIAVEIS_DINAMICAS.md)**

---

## 💻 Código-Fonte

### Componente Principal

#### `src/components/AdminManager/Campain.jsx`
**Componente React atualizado**

- ✅ Gerenciamento de campanhas
- ✅ CRUD completo de textos estilizados
- ✅ Editor com botões de formatação
- ✅ Pré-visualização em tempo real
- ✅ Filtro por campanha
- ✅ Interface intuitiva

---

### Helper Functions

#### `src/helper/getCampainTexts.jsx`
```javascript
getCampainTexts(campainId?)
```
- 📥 Busca textos do banco de dados
- Pode filtrar por campanha específica ou trazer todos
- Retorna apenas textos ativos

---

#### `src/helper/insertCampainText.jsx`
```javascript
insertCampainText({ campain_id, title, content })
```
- 📝 Insere novo texto no banco
- Validação automática de campos obrigatórios
- Toast de confirmação

---

#### `src/helper/updateCampainText.jsx`
```javascript
updateCampainText(id, { title, content })
```
- ✏️ Atualiza texto existente
- Atualiza campo `updated_at` automaticamente
- Toast de confirmação

---

#### `src/helper/deleteCampainText.jsx`
```javascript
deleteCampainText(id, hardDelete?)
```
- 🗑️ Deleta texto (soft ou hard delete)
- Padrão: soft delete (mantém no banco com `is_active = false`)
- Opcional: hard delete (remove permanentemente)
- Toast de confirmação

---

#### `src/helper/replaceCampainTextVariables.jsx`
```javascript
replaceCampainTextVariables(text, variables)
extractVariablesFromText(text)
validateTextVariables(text, variables)
```
- 🔄 Substitui variáveis dinâmicas
- Extrai lista de variáveis de um texto
- Valida se todas as variáveis foram fornecidas
- Lista de variáveis comuns pré-definidas

---

## 🗂️ Estrutura de Diretórios

```
demigtools/
│
├── database/                           📁 Documentação e SQL
│   ├── campain_texts.sql              ⚙️ Script de criação da tabela
│   ├── INDEX.md                       📋 Este arquivo (índice)
│   ├── TUTORIAL_PASSO_A_PASSO.md     📖 Tutorial completo
│   ├── QUICK_START.md                 ⚡ Guia rápido
│   ├── README_CAMPAIN_TEXTS.md       📚 Documentação técnica
│   └── VARIAVEIS_DINAMICAS.md        🔄 Guia de variáveis
│
└── src/
    ├── components/
    │   └── AdminManager/
    │       └── Campain.jsx            💻 Componente principal
    │
    └── helper/
        ├── getCampainTexts.jsx        📥 Buscar textos
        ├── insertCampainText.jsx      📝 Criar texto
        ├── updateCampainText.jsx      ✏️ Atualizar texto
        ├── deleteCampainText.jsx      🗑️ Deletar texto
        └── replaceCampainTextVariables.jsx 🔄 Variáveis dinâmicas
```

---

## 🚀 Guia de Uso por Cenário

### 🆕 Primeira Vez - Setup Inicial
```
1. Leia: TUTORIAL_PASSO_A_PASSO.md
2. Execute: campain_texts.sql no Supabase
3. Teste: Crie seu primeiro texto no Campain.jsx
```

### ⚡ Implementação Rápida
```
1. Leia: QUICK_START.md
2. Execute: campain_texts.sql
3. Use: Interface em Campain.jsx
```

### 📖 Consulta Técnica
```
1. Leia: README_CAMPAIN_TEXTS.md
2. Seção específica de interesse
3. Exemplos de código
```

### 🔄 Usar Variáveis Dinâmicas
```
1. Leia: VARIAVEIS_DINAMICAS.md
2. Crie textos com {{variavel}}
3. Use: replaceCampainTextVariables()
```

### 🐛 Problemas e Erros
```
1. README_CAMPAIN_TEXTS.md → Seção "Troubleshooting"
2. QUICK_START.md → "Problemas Comuns"
3. Consulte logs do console do navegador
```

---

## 📊 Fluxo de Dados

```
┌─────────────────────────────────────────────────────┐
│  1. CRIAR TEXTO                                     │
│  Campain.jsx → insertCampainText() → Supabase      │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  2. ARMAZENAR                                       │
│  Supabase: campain_texts table                     │
│  { id, campain_id, title, content, ... }           │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  3. BUSCAR                                          │
│  getCampainTexts(campainId) → Supabase → Dados    │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  4. SUBSTITUIR VARIÁVEIS                            │
│  replaceCampainTextVariables(texto, dados)         │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│  5. USAR                                            │
│  Email, Notificação, Relatório, etc.               │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Funcionalidades Implementadas

- ✅ CRUD completo de textos estilizados
- ✅ Associação de textos a campanhas específicas
- ✅ Editor HTML com botões de formatação
- ✅ Pré-visualização em tempo real
- ✅ Sistema de variáveis dinâmicas
- ✅ Validação de dados
- ✅ Soft delete (mantém histórico)
- ✅ Timestamps automáticos
- ✅ Filtro por campanha
- ✅ Interface intuitiva
- ✅ Notificações (toasts)
- ✅ Documentação completa

---

## 📋 Checklist de Implementação Completa

### Banco de Dados
- [ ] Executar `campain_texts.sql` no Supabase
- [ ] Verificar criação da tabela
- [ ] Testar inserção manual via SQL

### Código
- [ ] Verificar arquivos helper criados
- [ ] Verificar Campain.jsx atualizado
- [ ] Testar imports no navegador

### Funcionalidades
- [ ] Criar texto simples
- [ ] Criar texto com formatação HTML
- [ ] Editar texto existente
- [ ] Deletar texto
- [ ] Filtrar por campanha
- [ ] Testar variáveis dinâmicas

### Integração
- [ ] Integrar com sistema de emails (se aplicável)
- [ ] Criar templates para diferentes situações
- [ ] Documentar variáveis específicas do projeto

---

## 🎓 Níveis de Conhecimento

### 🟢 Iniciante
Comece por aqui:
1. `TUTORIAL_PASSO_A_PASSO.md` - Passo a passo completo
2. Crie alguns textos de teste
3. Explore a interface do Campain.jsx

### 🟡 Intermediário
Aprofunde seu conhecimento:
1. `README_CAMPAIN_TEXTS.md` - Documentação técnica
2. `QUICK_START.md` - Referência rápida
3. Experimente formatações HTML avançadas

### 🔴 Avançado
Personalize e integre:
1. `VARIAVEIS_DINAMICAS.md` - Sistema de variáveis
2. Crie suas próprias variáveis
3. Integre com outros sistemas

---

## 💡 Dicas Gerais

### Para Desenvolvimento
- Use a pré-visualização antes de salvar
- Teste em diferentes navegadores
- Valide HTML antes de usar em produção
- Mantenha backup dos textos importantes

### Para Produção
- Crie templates para situações comuns
- Documente variáveis específicas do seu projeto
- Implemente validações adicionais se necessário
- Monitore performance de queries

### Para Manutenção
- Revise textos periodicamente
- Mantenha documentação atualizada
- Use soft delete para manter histórico
- Faça backups regulares do banco

---

## 🔗 Links Úteis

### Documentação Externa
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [HTML Reference](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
- [CSS Styling](https://developer.mozilla.org/pt-BR/docs/Web/CSS)

### Ferramentas Online
- [HTML Validator](https://validator.w3.org/)
- [HTML Beautifier](https://htmlbeautify.com/)
- [Color Picker](https://htmlcolorcodes.com/)
- [Email HTML Tester](https://www.emailonacid.com/)

---

## 📞 Suporte

### Problemas Comuns
1. **Tabela não existe** → Execute `campain_texts.sql`
2. **Textos não aparecem** → Verifique `is_active = true`
3. **Variáveis não funcionam** → Veja `VARIAVEIS_DINAMICAS.md`
4. **Erros de formatação** → Valide HTML

### Recursos de Ajuda
- 📖 Consulte seção Troubleshooting em `README_CAMPAIN_TEXTS.md`
- 🔍 Verifique console do navegador (F12)
- 💬 Entre em contato com equipe de desenvolvimento

---

## 🎉 Começando Agora?

### Caminho Recomendado:

```
1️⃣ Leia este INDEX.md (✅ Você está aqui!)
   ↓
2️⃣ Siga TUTORIAL_PASSO_A_PASSO.md
   ↓
3️⃣ Execute campain_texts.sql no Supabase
   ↓
4️⃣ Teste no componente Campain.jsx
   ↓
5️⃣ Explore VARIAVEIS_DINAMICAS.md
   ↓
6️⃣ Consulte README quando necessário
```

**Tempo total estimado:** 30-40 minutos

---

## 📊 Status do Projeto

| Item | Status |
|------|--------|
| Banco de dados | ✅ Estrutura completa |
| Helper functions | ✅ CRUD completo |
| Componente UI | ✅ Interface implementada |
| Variáveis dinâmicas | ✅ Sistema funcional |
| Documentação | ✅ Completa |
| Testes | ⚠️ Requer validação manual |
| Integração email | ⏳ Depende do projeto |

---

## 🚀 Próximas Melhorias (Sugestões)

- [ ] Editor WYSIWYG (ex: React-Quill)
- [ ] Templates pré-definidos
- [ ] Sistema de versionamento de textos
- [ ] Preview de email antes de enviar
- [ ] Categorias/tags para textos
- [ ] Busca por conteúdo
- [ ] Histórico de alterações
- [ ] Permissões de acesso
- [ ] Exportar/Importar textos
- [ ] Análise de uso de templates

---

**Desenvolvido para DemigTools** 🚀

**Última atualização:** Novembro 2025

---

## 📝 Resumo Final

Você tem acesso a:
- ⚙️ **1 script SQL** para criar a tabela
- 📖 **4 guias** de documentação completos
- 💻 **1 componente** React atualizado
- 🔧 **5 helper functions** para CRUD e variáveis
- 🎯 **Sistema completo** de textos estilizados

**Tudo pronto para usar!** ✨

Boa sorte com seu projeto! 🎉

