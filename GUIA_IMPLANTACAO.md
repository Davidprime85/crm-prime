# Guia de Implantação - CRM Prime

Este guia descreve o passo a passo para colocar o sistema CRM Prime no ar utilizando a plataforma Vercel, conectada ao banco de dados Supabase.

## Pré-requisitos

1.  **Conta no GitHub**: Você precisará de uma conta no [GitHub](https://github.com/) para hospedar o código.
2.  **Conta na Vercel**: Você precisará de uma conta na [Vercel](https://vercel.com/) (pode criar usando sua conta do GitHub).
3.  **Projeto no Supabase**: Você já deve ter o projeto criado no Supabase (conforme as chaves que já estão no projeto).

## Passo 1: Preparar o Repositório (GitHub)

Se você ainda não tem este código no GitHub, siga estes passos:

1.  Crie um **novo repositório** no GitHub (ex: `crm-prime`).
2.  No seu computador (onde estão os arquivos), abra o terminal na pasta do projeto.
3.  Inicialize o git e suba os arquivos (se ainda não fez):
    ```bash
    git init
    git add .
    git commit -m "Primeiro commit - Sistema CRM Prime"
    git branch -M main
    git remote add origin https://github.com/SEU_USUARIO/crm-prime.git
    git push -u origin main
    ```
    *(Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub)*

## Passo 2: Configurar na Vercel

1.  Acesse o dashboard da [Vercel](https://vercel.com/dashboard).
2.  Clique em **"Add New..."** -> **"Project"**.
3.  Na lista "Import Git Repository", encontre o repositório `crm-prime` que você acabou de criar e clique em **"Import"**.

## Passo 3: Configurar o Projeto na Vercel

Na tela de configuração do projeto ("Configure Project"):

1.  **Framework Preset**: A Vercel deve detectar automaticamente como `Vite`. Se não, selecione `Vite`.
2.  **Root Directory**: Deixe como `./` (padrão).
3.  **Build and Output Settings**:
    *   Build Command: `npm run build` (ou o padrão do Vite)
    *   Output Directory: `dist` (ou o padrão do Vite)
    *   Install Command: `npm install --legacy-peer-deps` (Importante: isso já está configurado no arquivo `vercel.json`, mas é bom conferir).

## Passo 4: Variáveis de Ambiente (Environment Variables)

**MUITO IMPORTANTE**: O sistema não funcionará sem isso.

1.  Ainda na tela de configuração, expanda a seção **"Environment Variables"**.
2.  Adicione as seguintes variáveis (copie os valores do seu arquivo `.env` local):

    *   **Nome**: `VITE_SUPABASE_URL`
        *   **Valor**: `https://jleanhxygswmzprtddop.supabase.co`
    
    *   **Nome**: `VITE_SUPABASE_ANON_KEY`
        *   **Valor**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZWFuaHh5Z3N3bXpwcnRkZG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTQ3NDUsImV4cCI6MjA3ODYzMDc0NX0.SfNfUGppijxALIrLp_pp_QRZSfSjmepbctYUFsZ3oj0`

3.  Clique em **"Deploy"**.

## Passo 5: Verificar o Deploy

1.  A Vercel iniciará o processo de build. Aguarde alguns instantes.
2.  Se tudo der certo, você verá uma tela de "Congratulations!".
3.  Clique na imagem do projeto ou no botão "Visit" para acessar seu sistema online.


## Opcional: Testando Localmente

Se quiser rodar o projeto no seu computador antes de enviar:

1.  Instale as dependências (use este comando específico para evitar erros de versão):
    ```bash
    npm install --legacy-peer-deps
    ```
2.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
3.  Acesse `http://localhost:5173` no navegador.

## Solução de Problemas Comuns

*   **Erro de Build**: Se o deploy falhar, clique em "View Build Logs" para ver o erro. Geralmente são erros de TypeScript ou dependências.
*   **Tela Branca/Erro no App**: Abra o console do navegador (F12 -> Console). Se vir erros 401 ou de conexão, verifique se as Variáveis de Ambiente foram copiadas corretamente (sem espaços extras).
*   **Rotas não funcionam ao recarregar**: O arquivo `vercel.json` incluído no projeto já deve resolver isso, redirecionando todas as requisições para o `index.html`.

---
**Observação**: Mantenha suas chaves do Supabase seguras. A chave `ANON` é segura para usar no frontend, mas a `SERVICE_ROLE` (se tiver) nunca deve ser exposta aqui.
