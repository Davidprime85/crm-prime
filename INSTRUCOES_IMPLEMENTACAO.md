
# Manual de Implementação - Sistema Prime CRM

Este documento descreve os passos necessários para transformar o protótipo atual em um sistema de produção completo, com as novas funcionalidades de Admin e Exportação.

## 1. Pré-requisitos

Para executar e desenvolver este projeto, você precisará instalar:

*   **Node.js** (Versão 18 ou superior) - [Download](https://nodejs.org/)
*   **Git** - [Download](https://git-scm.com/)
*   **Editor de Código** (VS Code recomendado)

## 2. Instalação Local

1.  Extraia os arquivos do projeto em uma pasta.
2.  Abra o terminal na pasta do projeto.
3.  Instale as dependências:

```bash
npm install react react-dom react-router-dom lucide-react recharts @supabase/supabase-js tailwindcss postcss autoprefixer
```

## 3. Funcionalidades Novas Implementadas

### Admin com Superpoderes
O `AdminDashboard.tsx` foi reformulado para ter abas:
1.  **Visão Geral**: Gráficos.
2.  **Gestão de Processos**: Agora o Admin pode aprovar documentos, recusar (com motivo), anexar arquivos pelo cliente e usar o Chat.
3.  **Novo Cliente**: Um formulário completo que gera um novo processo. Ele inclui um botão "Criar Campo" para adicionar dados personalizados (Ex: Nome da Mãe, Data de Casamento) dinamicamente.

### Exportação / Impressão
Ao clicar no botão "Exportar Ficha" dentro de um processo no Admin:
1.  O sistema ativa o modo de impressão do navegador.
2.  Uma folha de estilo CSS oculta menus, botões e barras laterais.
3.  Exibe apenas a "Ficha do Cliente" com logo (texto placeholder se imagem falhar), dados financeiros, campos personalizados e checklist de documentos.
4.  Para testar: Pressione `Ctrl + P` ou clique no botão no painel.

### Documentos Dinâmicos
O componente `DocumentList` agora possui um botão "Adicionar Outro Documento". Isso permite que Admin, Atendente (e Cliente, se configurado) adicionem requisitos que não estavam previstos inicialmente (Ex: Carta de Anuência).

## 4. Configuração do Banco de Dados (Supabase)

Se for usar o Supabase real, atualize o SQL para suportar os campos extras (JSONB):

```sql
-- Tabela de Processos Atualizada
CREATE TABLE processes (
  id TEXT PRIMARY KEY, 
  client_id UUID REFERENCES profiles(id),
  client_cpf TEXT, -- Novo Campo
  attendant_id UUID REFERENCES profiles(id),
  type TEXT,
  status TEXT,
  value NUMERIC,
  extra_fields JSONB, -- Novo Campo para guardar dados dinâmicos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Documentos
CREATE TABLE process_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  process_id TEXT REFERENCES processes(id),
  name TEXT,
  status TEXT,
  url TEXT,
  feedback TEXT,
  is_extra BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP
);
```

## 5. Conectando o Código ao Banco

No arquivo `services/storageService.ts` e `services/authService.ts`, descomente as linhas referentes ao Supabase e preencha o arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave
```

## 6. Hospedagem

Recomendado usar a **Vercel**.
1.  `npm install -g vercel`
2.  `vercel`
3.  Siga os passos na tela.

---
*Desenvolvido por Assistente de IA para o Grupo Prime.*
