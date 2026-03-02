# 🔄 Variáveis Dinâmicas - Guia Completo

## 📋 O que são Variáveis Dinâmicas?

Variáveis dinâmicas permitem criar textos **reutilizáveis** que se adaptam automaticamente aos dados de cada doador, doação ou campanha.

### Exemplo Simples

**Texto com variáveis:**
```html
<p>Olá, {{nome_doador}}! Sua doação de {{valor_doacao}} foi recebida.</p>
```

**Resultado após substituição:**
```html
<p>Olá, João Silva! Sua doação de R$ 150,00 foi recebida.</p>
```

## 🎯 Como Usar

### Passo 1: Criar Texto com Variáveis

Use o formato `{{nome_variavel}}` no seu texto:

```html
<h1>Bem-vindo, {{nome_doador}}!</h1>
<p>Sua doação de <strong>{{valor_doacao}}</strong> foi confirmada.</p>
<p>Data: {{data_doacao}}</p>
<p>Campanha: {{nome_campanha}}</p>
<p>ID da transação: {{id_doacao}}</p>
```

### Passo 2: Substituir Variáveis no Código

```javascript
import { replaceCampainTextVariables } from "../../helper/replaceCampainTextVariables";

// Texto do banco de dados
const textTemplate = campainText.content;

// Dados do doador/doação
const variables = {
  nome_doador: donor.name,
  valor_doacao: `R$ ${donation.amount.toFixed(2)}`,
  data_doacao: new Date(donation.date).toLocaleDateString("pt-BR"),
  nome_campanha: campaign.name,
  id_doacao: donation.id,
};

// Substituir variáveis
const finalText = replaceCampainTextVariables(textTemplate, variables);

// Usar o texto final (ex: enviar email)
sendEmail(donor.email, "Confirmação de Doação", finalText);
```

## 📝 Variáveis Disponíveis

### 👤 Dados do Doador

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{nome_doador}}` | Nome completo | João Silva |
| `{{email_doador}}` | Email | joao@email.com |
| `{{telefone_doador}}` | Telefone | (11) 98765-4321 |
| `{{cpf_doador}}` | CPF | 123.456.789-00 |

### 💰 Dados da Doação

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{valor_doacao}}` | Valor doado | R$ 150,00 |
| `{{data_doacao}}` | Data da doação | 05/12/2023 |
| `{{id_doacao}}` | ID da transação | #12345 |
| `{{metodo_pagamento}}` | Forma de pagamento | Cartão de Crédito |

### 🎯 Dados da Campanha

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{nome_campanha}}` | Nome da campanha | Natal Solidário 2023 |
| `{{meta_campanha}}` | Meta da campanha | R$ 50.000,00 |
| `{{arrecadado_campanha}}` | Valor arrecadado | R$ 35.000,00 |

### 🏢 Dados da Empresa

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{nome_empresa}}` | Nome da empresa | DemigTools |
| `{{email_empresa}}` | Email da empresa | contato@demig.com |
| `{{telefone_empresa}}` | Telefone | (11) 3456-7890 |

### 📅 Dados Gerais

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{data_atual}}` | Data de hoje | 05/12/2023 |
| `{{ano_atual}}` | Ano atual | 2023 |

## 💡 Exemplos Práticos

### Exemplo 1: Email de Confirmação de Doação

```html
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="color: #4CAF50;">Doação Confirmada! 🎉</h1>
  
  <p>Olá, <strong>{{nome_doador}}</strong>!</p>
  
  <p>Sua doação foi recebida com sucesso. Confira os detalhes:</p>
  
  <ul style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
    <li><strong>Valor:</strong> {{valor_doacao}}</li>
    <li><strong>Data:</strong> {{data_doacao}}</li>
    <li><strong>Campanha:</strong> {{nome_campanha}}</li>
    <li><strong>Método:</strong> {{metodo_pagamento}}</li>
    <li><strong>ID:</strong> {{id_doacao}}</li>
  </ul>
  
  <p>Agradecemos imensamente sua contribuição!</p>
  
  <br/>
  <p style="color: #666;">
    <em>Equipe {{nome_empresa}}</em><br/>
    {{email_empresa}} | {{telefone_empresa}}
  </p>
</div>
```

### Exemplo 2: Lembrete de Doação Mensal

```html
<h2>Lembrete de Doação Mensal</h2>

<p>Olá, {{nome_doador}}!</p>

<p>Este é um lembrete amigável sobre sua contribuição mensal para a campanha <strong>{{nome_campanha}}</strong>.</p>

<p><strong>Valor:</strong> {{valor_doacao}}</p>
<p><strong>Vencimento:</strong> {{data_doacao}}</p>

<p>Caso já tenha realizado o pagamento, desconsidere esta mensagem.</p>

<p>Obrigado por fazer parte desta causa!</p>

<p>Atenciosamente,<br/>
{{nome_empresa}}</p>
```

### Exemplo 3: Relatório de Impacto

```html
<div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
  <h1>{{nome_doador}}, você fez a diferença! ✨</h1>
  
  <p style="font-size: 20px;">
    Graças à sua doação de <strong>{{valor_doacao}}</strong>,
    conseguimos alcançar <strong>{{arrecadado_campanha}}</strong> 
    de nossa meta de <strong>{{meta_campanha}}</strong>!
  </p>
  
  <p style="font-size: 16px; margin-top: 30px;">
    Sua contribuição ajudou diretamente na campanha:<br/>
    <strong style="font-size: 24px;">{{nome_campanha}}</strong>
  </p>
  
  <p style="margin-top: 40px; font-size: 14px; opacity: 0.9;">
    Data da doação: {{data_doacao}}<br/>
    ID: {{id_doacao}}
  </p>
</div>
```

### Exemplo 4: Agradecimento Personalizado

```html
<div style="max-width: 600px; margin: 0 auto; font-family: 'Georgia', serif;">
  <img src="https://sua-empresa.com/logo.png" alt="Logo" style="width: 150px; display: block; margin: 20px auto;">
  
  <h1 style="text-align: center; color: #2c3e50;">
    Muito Obrigado, {{nome_doador}}! ❤️
  </h1>
  
  <p style="font-size: 18px; line-height: 1.6; color: #34495e;">
    Sua generosidade nos inspira a continuar nosso trabalho. 
    A doação de <strong>{{valor_doacao}}</strong> realizada em 
    <strong>{{data_doacao}}</strong> será usada com responsabilidade 
    na campanha <strong>{{nome_campanha}}</strong>.
  </p>
  
  <div style="background-color: #ecf0f1; padding: 20px; border-radius: 10px; margin: 30px 0;">
    <h3 style="margin-top: 0; color: #2c3e50;">📊 Status da Campanha</h3>
    <p style="margin: 10px 0;">
      <strong>Arrecadado:</strong> {{arrecadado_campanha}}<br/>
      <strong>Meta:</strong> {{meta_campanha}}
    </p>
  </div>
  
  <p style="text-align: center; color: #7f8c8d; font-size: 14px;">
    {{nome_empresa}} | {{email_empresa}}<br/>
    © {{ano_atual}} - Todos os direitos reservados
  </p>
</div>
```

## 🔧 Funções Auxiliares

### Extrair Variáveis de um Texto

```javascript
import { extractVariablesFromText } from "../../helper/replaceCampainTextVariables";

const text = "<p>Olá {{nome}}! Valor: {{valor}}</p>";
const variables = extractVariablesFromText(text);
// Resultado: ["nome", "valor"]
```

### Validar se Todas as Variáveis Foram Fornecidas

```javascript
import { validateTextVariables } from "../../helper/replaceCampainTextVariables";

const text = "<p>Olá {{nome}}! Valor: {{valor}}</p>";
const data = { nome: "João" }; // faltando "valor"

const validation = validateTextVariables(text, data);
console.log(validation);
// {
//   valid: false,
//   missing: ["valor"],
//   required: ["nome", "valor"]
// }
```

## 🎨 Formatação Avançada de Variáveis

### Formatar Valores Monetários

```javascript
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const variables = {
  valor_doacao: formatCurrency(150.50), // "R$ 150,50"
};
```

### Formatar Datas

```javascript
const formatDate = (date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
};

const variables = {
  data_doacao: formatDate(donation.date), // "05/12/2023"
};
```

### Formatar Telefones

```javascript
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const variables = {
  telefone_doador: formatPhone('11987654321'), // "(11) 98765-4321"
};
```

## 🚀 Integração com Envio de Emails

### Exemplo Completo

```javascript
import { replaceCampainTextVariables } from "../../helper/replaceCampainTextVariables";
import { getCampainTexts } from "../../helper/getCampainTexts";

const sendDonationConfirmationEmail = async (donation, donor, campaign) => {
  // 1. Buscar template da campanha
  const texts = await getCampainTexts(campaign.id);
  const confirmationTemplate = texts.find(t => t.title === "Confirmação de Doação");
  
  if (!confirmationTemplate) {
    console.error("Template não encontrado");
    return;
  }
  
  // 2. Preparar variáveis
  const variables = {
    nome_doador: donor.name,
    email_doador: donor.email,
    telefone_doador: donor.phone,
    valor_doacao: formatCurrency(donation.amount),
    data_doacao: formatDate(donation.date),
    id_doacao: `#${donation.id}`,
    metodo_pagamento: donation.payment_method,
    nome_campanha: campaign.name,
    nome_empresa: "DemigTools",
    email_empresa: "contato@demig.com",
    data_atual: formatDate(new Date()),
    ano_atual: new Date().getFullYear(),
  };
  
  // 3. Substituir variáveis
  const emailContent = replaceCampainTextVariables(
    confirmationTemplate.content, 
    variables
  );
  
  // 4. Enviar email
  await sendEmail({
    to: donor.email,
    subject: `Confirmação de Doação - ${campaign.name}`,
    html: emailContent,
  });
};
```

## ⚙️ Configuração Avançada

### Criar Suas Próprias Variáveis

```javascript
// Em replaceCampainTextVariables.jsx, adicione ao COMMON_VARIABLES:

export const COMMON_VARIABLES = {
  // ... variáveis existentes ...
  
  // Suas variáveis personalizadas
  CUSTOM_FIELD_1: "campo_personalizado_1",
  CUSTOM_FIELD_2: "campo_personalizado_2",
};
```

### Variáveis Condicionais

```javascript
const variables = {
  nome_doador: donor.name,
  saudacao: donor.gender === "M" ? "Prezado" : "Prezada",
  tratamento: donor.gender === "M" ? "Sr." : "Sra.",
};

// Texto: "<p>{{saudacao}} {{tratamento}} {{nome_doador}}</p>"
// Resultado: "<p>Prezado Sr. João Silva</p>"
```

### Variáveis com Fallback

```javascript
const variables = {
  nome_doador: donor.name || "Doador",
  email_doador: donor.email || "Não informado",
};
```

## 📋 Checklist de Uso

- [ ] Criar texto com variáveis no formato `{{nome}}`
- [ ] Definir todas as variáveis necessárias
- [ ] Validar variáveis antes de substituir
- [ ] Formatar valores (datas, moedas, etc.)
- [ ] Testar com dados reais
- [ ] Verificar preview do resultado
- [ ] Implementar em produção

## 🐛 Troubleshooting

### Problema: Variável não é substituída

**Possíveis causas:**
1. Nome da variável incorreto (verifique espaços)
2. Variável não fornecida no objeto `variables`
3. Sintaxe incorreta (use `{{nome}}` não `{nome}`)

**Solução:**
```javascript
// ❌ Errado
const text = "{nome}"; // faltam chaves duplas
const vars = { nome_completo: "João" }; // nome diferente

// ✅ Correto
const text = "{{nome}}";
const vars = { nome: "João" };
```

### Problema: Variável aparece como undefined

**Solução:**
```javascript
// Sempre forneça um valor padrão
const variables = {
  nome: donor.name || "Cliente",
  email: donor.email || "não informado",
};
```

## 🎯 Boas Práticas

1. **Use nomes descritivos** para variáveis
   ```
   ✅ {{nome_doador}}
   ❌ {{n}}
   ```

2. **Documente as variáveis** disponíveis
3. **Valide antes de usar** em produção
4. **Formate valores** adequadamente
5. **Teste com dados reais**
6. **Mantenha templates** separados por tipo (confirmação, lembrete, etc.)

## 📚 Recursos Adicionais

- [Template Literals no JavaScript](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Template_literals)
- [Intl.NumberFormat para formatação de moedas](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Intl.DateTimeFormat para formatação de datas](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)

---

**Desenvolvido para DemigTools** 🚀

Com variáveis dinâmicas, seus textos ficam mais personalizados e profissionais!

