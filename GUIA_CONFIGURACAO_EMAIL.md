# Guia de Configuração de E-mail (EmailJS)

Este guia explica como configurar o envio de e-mails automáticos de boas-vindas usando sua conta do Google Workspace.

## 📂 Onde está o arquivo?

O arquivo que você precisa editar está em:
`services/emailService.ts`

Caminho completo:
`c:\Users\David Freitas\Desktop\app habitação prime\CRM PRIME 19NOV25\services\emailService.ts`

## 🛠️ Passo a Passo

### 1. Criar Conta no EmailJS

1. Acesse [https://www.emailjs.com/](https://www.emailjs.com/) e clique em **"Sign Up Free"**.
2. Crie sua conta.

### 2. Conectar seu E-mail (Service ID)

1. No painel do EmailJS, clique em **"Email Services"** no menu lateral.
2. Clique em **"Add New Service"**.
3. Escolha **"Gmail"**.
4. Clique em **"Connect Account"** e faça login com sua conta Google Workspace.
5. Clique em **"Create Service"**.
6. Copie o **Service ID** (geralmente algo como `service_xxxxxx`).
7. Cole este código no arquivo `emailService.ts` na linha:

    ```typescript
    const SERVICE_ID = 'service_xxxxxx';
    ```

### 3. Criar o Modelo de E-mail (Template ID)

1. Clique em **"Email Templates"** no menu lateral.
2. Clique em **"Create New Template"**.
3. Edite o assunto e o corpo do e-mail. Você pode usar as variáveis que o sistema envia:
    * `{{to_name}}`: Nome do Cliente
    * `{{to_email}}`: E-mail do Cliente
    * `{{password}}`: Senha provisória
    * `{{login_link}}`: Link do sistema
4. **Exemplo de Corpo do E-mail:**

    ```html
    Olá {{to_name}},

    Seja bem-vindo à Prime Correspondente Caixa!
    Seu cadastro foi realizado com sucesso.

    Acesse seu painel para enviar seus documentos:
    Link: {{login_link}}
    E-mail: {{to_email}}
    Senha Provisória: {{password}}

    Atenciosamente,
    Equipe Prime
    ```

5. Clique em **"Save"**.
6. Copie o **Template ID** (geralmente algo como `template_xxxxxx`).
7. Cole este código no arquivo `emailService.ts` na linha:

    ```typescript
    const TEMPLATE_ID = 'template_xxxxxx';
    ```

### 4. Pegar a Chave Pública (Public Key)

1. Clique no seu nome no canto superior direito e vá em **"Account"**.
2. Copie o código que aparece em **"Public Key"**.
3. Cole este código no arquivo `emailService.ts` na linha:

    ```typescript
    const PUBLIC_KEY = 'user_xxxxxx';
    ```

### ✅ Teste

Após salvar o arquivo `emailService.ts` com os 3 códigos, faça um novo cadastro de cliente no sistema. O e-mail deve chegar em alguns segundos!
