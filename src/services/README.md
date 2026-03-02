# Serviço de Campanhas - Supabase

Este serviço substitui a necessidade de um servidor serverless para gerenciar campanhas de WhatsApp, utilizando diretamente o cliente Supabase no frontend.

## Arquivos Criados

- `campaignsService.js` - Serviço principal com todas as operações CRUD
- `useCampaigns.jsx` - Hook React personalizado para facilitar o uso
- `CampaignsManager.jsx` - Componente de exemplo mostrando como usar

## Como Usar

### 1. Usando o Serviço Diretamente

```javascript
import campaignsService from '../services/campaignsService.js';

// Listar campanhas
const result = await campaignsService.getCampaigns();
if (result.success) {
  console.log(result.campaigns);
}

// Criar campanha
const newCampaign = await campaignsService.createCampaign({
  name: 'Nova Campanha',
  description: 'Descrição da campanha',
  selectedTemplates: ['template1', 'template2'],
  variables: ['nome', 'valor']
});

// Atualizar campanha
const updated = await campaignsService.updateCampaign('campaign-id', {
  name: 'Nome Atualizado'
});

// Deletar campanha
const deleted = await campaignsService.deleteCampaign('campaign-id');
```

### 2. Usando o Hook React

```jsx
import { useCampaigns } from '../hooks/useCampaigns.jsx';

function MyComponent() {
  const {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign
  } = useCampaigns();

  const handleCreate = async () => {
    const result = await createCampaign({
      name: 'Nova Campanha',
      selectedTemplates: ['template1']
    });
    
    if (result.success) {
      console.log('Campanha criada!');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {campaigns.map(campaign => (
        <div key={campaign.id}>{campaign.name}</div>
      ))}
      <button onClick={handleCreate}>Criar Campanha</button>
    </div>
  );
}
```

## Funcionalidades Disponíveis

### CampaignsService

- `getCampaigns()` - Lista todas as campanhas
- `createCampaign(data)` - Cria nova campanha
- `updateCampaign(id, data)` - Atualiza campanha existente
- `deleteCampaign(id)` - Deleta campanha
- `getCampaignById(id)` - Busca campanha por ID
- `searchCampaigns(term)` - Busca campanhas por nome

### useCampaigns Hook

- `campaigns` - Array com todas as campanhas
- `loading` - Estado de carregamento
- `error` - Mensagem de erro (se houver)
- `loadCampaigns()` - Recarrega as campanhas
- `createCampaign(data)` - Cria nova campanha
- `updateCampaign(id, data)` - Atualiza campanha
- `deleteCampaign(id)` - Deleta campanha
- `getCampaignById(id)` - Busca campanha por ID
- `searchCampaigns(term)` - Busca campanhas

## Estrutura de Dados

### Campanha
```javascript
{
  id: "uuid",
  name: "Nome da Campanha",
  description: "Descrição opcional",
  selected_templates: ["template1", "template2"],
  variables: ["nome", "valor", "data"],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

## Tratamento de Erros

Todas as funções retornam um objeto com:
- `success: boolean` - Indica se a operação foi bem-sucedida
- `error?: string` - Mensagem de erro (se houver)
- `details?: string` - Detalhes técnicos do erro
- `campaign?: object` - Dados da campanha (para operações que retornam dados)

## Vantagens

1. **Sem servidor serverless** - Tudo roda no frontend
2. **Menor latência** - Conexão direta com Supabase
3. **Menos complexidade** - Não precisa gerenciar APIs
4. **Melhor performance** - Menos requisições HTTP
5. **Fácil manutenção** - Código mais simples e direto

## Migração

Para migrar do servidor serverless:

1. Substitua as chamadas para `/api/campaigns` pelo `campaignsService`
2. Use o hook `useCampaigns` nos componentes React
3. Remova o arquivo `api/campaigns.js` (opcional)
4. Atualize os imports nos componentes existentes

## Exemplo de Migração

**Antes (com servidor serverless):**
```javascript
const response = await fetch('/api/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(campaignData)
});
const result = await response.json();
```

**Depois (com Supabase direto):**
```javascript
const result = await campaignsService.createCampaign(campaignData);
```

Muito mais simples e direto! 🚀
