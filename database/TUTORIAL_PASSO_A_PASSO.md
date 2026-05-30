# 📖 Tutorial Passo a Passo - Textos Estilizados para Campanhas

## 🎯 Objetivo

Ao final deste tutorial, você será capaz de:
- ✅ Criar a tabela no banco de dados Supabase
- ✅ Gerenciar textos estilizados no componente Campain
- ✅ Usar variáveis dinâmicas nos textos
- ✅ Integrar com sistema de emails (se aplicável)

**Tempo estimado:** 15-20 minutos

---

## 📦 Parte 1: Configuração do Banco de Dados

### Passo 1.1: Acessar o Supabase

```
🌐 Abra seu navegador
   ↓
🔑 Acesse: https://supabase.com/dashboard
   ↓
🏢 Faça login com suas credenciais
   ↓
📂 Selecione o projeto: khsapythnppdplqnlmkj
```

### Passo 1.2: Abrir SQL Editor

```
┌─────────────────────────────────┐
│  📋 Menu Lateral do Supabase    │
├─────────────────────────────────┤
│  🏠 Home                        │
│  📊 Table Editor                │
│  ⚡ SQL Editor      ← CLIQUE    │
│  🔧 Database                    │
│  🔐 Authentication              │
│  📁 Storage                     │
└─────────────────────────────────┘
```

1. No menu lateral esquerdo, clique em **⚡ SQL Editor**
2. Clique no botão **+ New query** (canto superior direito)

### Passo 1.3: Executar Script SQL

1. **Abra o arquivo** `campain_texts.sql` (está na pasta `database/`)
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no SQL Editor** do Supabase (Ctrl+V)
4. **Execute o script** clicando em **Run** ou pressionando `Ctrl + Enter`

```
┌──────────────────────────────────────────────┐
│  SQL Editor                                  │
├──────────────────────────────────────────────┤
│  [Run] [Explain] [Save]    [+ New query]    │
├──────────────────────────────────────────────┤
│                                              │
│  CREATE TABLE IF NOT EXISTS campain_texts   │
│  (                                           │
│    id SERIAL PRIMARY KEY,                   │
│    campain_id INTEGER NOT NULL,             │
│    ...                                       │
│  );                                          │
│                                              │
└──────────────────────────────────────────────┘
```

### Passo 1.4: Verificar Criação

Após executar, você verá uma mensagem de sucesso:

```
✅ Success. No rows returned
```

Para confirmar, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'campain_texts';
```

Resultado esperado:
```
┌──────────────────┐
│  table_name      │
├──────────────────┤
│  campain_texts   │
└──────────────────┘
```

**✨ Parabéns! A tabela foi criada com sucesso!**

---

## 💻 Parte 2: Testando a Aplicação

### Passo 2.1: Verificar Arquivos Criados

Verifique se os seguintes arquivos existem no seu projeto:

```
demigtools/
├── src/
│   ├── components/
│   │   └── AdminManager/
│   │       └── Campain.jsx ✅ (ATUALIZADO)
│   └── helper/
│       ├── getCampainTexts.jsx ✅ (NOVO)
│       ├── insertCampainText.jsx ✅ (NOVO)
│       ├── updateCampainText.jsx ✅ (NOVO)
│       ├── deleteCampainText.jsx ✅ (NOVO)
│       └── replaceCampainTextVariables.jsx ✅ (NOVO)
└── database/
    ├── campain_texts.sql ✅ (NOVO)
    ├── README_CAMPAIN_TEXTS.md ✅ (NOVO)
    ├── QUICK_START.md ✅ (NOVO)
    ├── VARIAVEIS_DINAMICAS.md ✅ (NOVO)
    └── TUTORIAL_PASSO_A_PASSO.md ✅ (VOCÊ ESTÁ AQUI)
```

### Passo 2.2: Iniciar a Aplicação

```bash
# No terminal, na pasta do projeto
npm start
# ou
yarn start
```

Aguarde o servidor iniciar e abra no navegador:
```
http://localhost:3000
```

### Passo 2.3: Navegar até AdminManager

```
🏠 Página Inicial
   ↓
🔧 AdminManager (ou menu de administração)
   ↓
📋 Seção de Campanhas
```

---

## 🎨 Parte 3: Criando seu Primeiro Texto

### Passo 3.1: Visualizar Interface

Você verá 3 seções principais:

```
┌─────────────────────────────────────────────┐
│  📋 Seção 1: GERENCIAR CAMPANHAS           │
│  - Lista de campanhas existentes            │
│  - Editar/Deletar campanhas                 │
│  - Adicionar nova campanha                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ✏️ Seção 2: NOVO TEXTO PARA CAMPANHA      │
│  - Selecionar campanha                      │
│  - Título do texto                          │
│  - Editor de conteúdo HTML                  │
│  - Botões de formatação (B, I, U, etc.)    │
│  - Pré-visualização                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📚 Seção 3: TEXTOS CADASTRADOS            │
│  - Lista de todos os textos                 │
│  - Filtro por campanha                      │
│  - Editar/Deletar textos                    │
└─────────────────────────────────────────────┘
```

### Passo 3.2: Criar um Texto de Teste

**3.2.1 - Selecionar Campanha**
```
┌──────────────────────────────────┐
│  Campanha Associada              │
│  ┌────────────────────────────┐  │
│  │ Selecione uma campanha...  │  │
│  │ ▼ Campanha A               │← SELECIONE
│  │   Campanha B               │  │
│  │   Campanha C               │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**3.2.2 - Digitar Título**
```
┌──────────────────────────────────┐
│  Título do Texto                 │
│  ┌────────────────────────────┐  │
│  │ Mensagem de Teste          │← DIGITE
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**3.2.3 - Escrever Conteúdo**
```
┌──────────────────────────────────┐
│  Conteúdo (HTML Suportado)       │
│  [B] [I] [U] [H1] [H2] [P] [BR] │ ← Botões de formatação
│  ┌────────────────────────────┐  │
│  │ <h1>Olá Mundo!</h1>        │← DIGITE
│  │ <p>Este é um teste.</p>    │
│  │                            │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**3.2.4 - Visualizar Preview**
```
┌──────────────────────────────────┐
│  Pré-visualização:               │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │  Olá Mundo!                │← RESULTADO
│  │                            │
│  │  Este é um teste.          │
│  │                            │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**3.2.5 - Salvar**
```
┌──────────────────────────────────┐
│  [Salvar Texto]                  │← CLIQUE
└──────────────────────────────────┘
```

### Passo 3.3: Verificar Sucesso

Você verá uma notificação:
```
✅ Texto da campanha adicionado com sucesso!
```

E o texto aparecerá na **Seção 3: Textos Cadastrados**

---

## 🎯 Parte 4: Usando Variáveis Dinâmicas

### Passo 4.1: Criar Texto com Variáveis

Vamos criar um texto mais sofisticado usando variáveis:

**Título:**
```
Confirmação de Doação
```

**Conteúdo:**
```html
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="color: #4CAF50;">Doação Confirmada! 🎉</h1>
  
  <p>Olá, <strong>{{nome_doador}}</strong>!</p>
  
  <p>Sua doação foi recebida com sucesso:</p>
  
  <ul>
    <li><strong>Valor:</strong> {{valor_doacao}}</li>
    <li><strong>Data:</strong> {{data_doacao}}</li>
    <li><strong>Campanha:</strong> {{nome_campanha}}</li>
  </ul>
  
  <p>Muito obrigado pela sua contribuição!</p>
  
  <p style="color: #666; font-size: 12px;">
    {{nome_empresa}} - {{ano_atual}}
  </p>
</div>
```

### Passo 4.2: Usar o Texto com Variáveis

**No seu código (exemplo em um componente de envio de email):**

```javascript
import { replaceCampainTextVariables } from "../../helper/replaceCampainTextVariables";
import { getCampainTexts } from "../../helper/getCampainTexts";

// 1. Buscar o texto da campanha
const campainId = 1; // ID da campanha
const texts = await getCampainTexts(campainId);
const confirmationText = texts.find(t => t.title === "Confirmação de Doação");

// 2. Preparar os dados
const donor = { name: "João Silva" };
const donation = { 
  amount: 150.50, 
  date: new Date(),
  campaign: "Natal Solidário"
};

// 3. Criar objeto de variáveis
const variables = {
  nome_doador: donor.name,
  valor_doacao: `R$ ${donation.amount.toFixed(2)}`,
  data_doacao: donation.date.toLocaleDateString("pt-BR"),
  nome_campanha: donation.campaign,
  nome_empresa: "DemigTools",
  ano_atual: new Date().getFullYear(),
};

// 4. Substituir variáveis
const finalText = replaceCampainTextVariables(
  confirmationText.content,
  variables
);

// 5. Usar o texto final
console.log(finalText);
// ou enviar por email, exibir na tela, etc.
```

**Resultado:**
```html
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="color: #4CAF50;">Doação Confirmada! 🎉</h1>
  
  <p>Olá, <strong>João Silva</strong>!</p>
  
  <p>Sua doação foi recebida com sucesso:</p>
  
  <ul>
    <li><strong>Valor:</strong> R$ 150,50</li>
    <li><strong>Data:</strong> 05/12/2023</li>
    <li><strong>Campanha:</strong> Natal Solidário</li>
  </ul>
  
  <p>Muito obrigado pela sua contribuição!</p>
  
  <p style="color: #666; font-size: 12px;">
    DemigTools - 2023
  </p>
</div>
```

---

## 🛠️ Parte 5: Operações Avançadas

### Editar um Texto Existente

```
1. Na Seção 3 (Textos Cadastrados)
   ↓
2. Encontre o texto que deseja editar
   ↓
3. Clique no botão [✏️ Editar]
   ↓
4. O formulário será preenchido automaticamente
   ↓
5. Faça as alterações desejadas
   ↓
6. Clique em [Atualizar Texto]
```

### Deletar um Texto

```
1. Na Seção 3 (Textos Cadastrados)
   ↓
2. Encontre o texto que deseja deletar
   ↓
3. Clique no botão [🗑️ Deletar]
   ↓
4. Confirme na janela pop-up
   ↓
5. ✅ Texto deletado com sucesso!
```

### Filtrar Textos por Campanha

```
Na Seção 3:
┌────────────────────────────────┐
│  Filtrar por Campanha:         │
│  ┌──────────────────────────┐  │
│  │ Todas as campanhas       │← SELECIONE
│  │ ▼ Campanha A             │
│  │   Campanha B             │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## 🧪 Parte 6: Testes e Validação

### Teste 1: Criar Texto Simples

✅ **Objetivo:** Verificar se consegue criar um texto básico

1. Selecione uma campanha
2. Título: "Teste Simples"
3. Conteúdo: `<p>Este é um teste.</p>`
4. Clique em Salvar
5. Verifique se aparece na lista

**Resultado esperado:** ✅ Texto criado e visível na lista

---

### Teste 2: Criar Texto com Formatação

✅ **Objetivo:** Testar botões de formatação

1. Selecione uma campanha
2. Título: "Teste Formatação"
3. No conteúdo, escreva: "Texto de teste"
4. Selecione "teste" com o mouse
5. Clique no botão [B] (negrito)
6. Resultado no editor: `Texto de <strong>teste</strong>`
7. Salve o texto

**Resultado esperado:** ✅ Palavra "teste" em negrito na preview

---

### Teste 3: Editar Texto Existente

✅ **Objetivo:** Verificar funcionalidade de edição

1. Na lista de textos, clique em [Editar]
2. Modifique o título ou conteúdo
3. Clique em [Atualizar Texto]
4. Verifique se as alterações foram salvas

**Resultado esperado:** ✅ Texto atualizado corretamente

---

### Teste 4: Usar Variáveis

✅ **Objetivo:** Testar substituição de variáveis

No console do navegador (F12):

```javascript
// Importar função (já deve estar disponível no seu código)
const { replaceCampainTextVariables } = require('./helper/replaceCampainTextVariables');

// Testar
const template = "<p>Olá {{nome}}!</p>";
const vars = { nome: "João" };
const result = replaceCampainTextVariables(template, vars);
console.log(result); // "<p>Olá João!</p>"
```

**Resultado esperado:** ✅ Variável substituída corretamente

---

## 📊 Parte 7: Consultas SQL Úteis

### Ver todos os textos no banco

```sql
SELECT 
  ct.id,
  ct.title,
  c.campain_name,
  ct.created_at
FROM campain_texts ct
JOIN campain c ON ct.campain_id = c.id
ORDER BY ct.created_at DESC;
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

### Buscar textos específicos

```sql
SELECT * FROM campain_texts
WHERE title ILIKE '%confirmação%';
```

---

## 🎓 Conclusão

**Parabéns! 🎉** Você concluiu o tutorial!

Agora você sabe:
- ✅ Criar e gerenciar textos estilizados
- ✅ Usar HTML para formatação avançada
- ✅ Trabalhar com variáveis dinâmicas
- ✅ Integrar textos com outras funcionalidades

### 📚 Próximos Passos

1. **Leia os guias complementares:**
   - `README_CAMPAIN_TEXTS.md` - Documentação completa
   - `QUICK_START.md` - Guia rápido de referência
   - `VARIAVEIS_DINAMICAS.md` - Guia de variáveis

2. **Experimente criar:**
   - Templates de emails profissionais
   - Mensagens personalizadas para cada campanha
   - Textos com variáveis dinâmicas

3. **Integre com outras funcionalidades:**
   - Sistema de envio de emails
   - Notificações automáticas
   - Relatórios personalizados

### 🆘 Precisa de Ajuda?

- 📖 Consulte a documentação em `README_CAMPAIN_TEXTS.md`
- 🐛 Veja a seção de Troubleshooting
- 💬 Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido para DemigTools** 🚀

Boa sorte com seu projeto!

