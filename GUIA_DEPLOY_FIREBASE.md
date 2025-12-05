# Guia de Deploy - CRM Prime Habitação (Firebase)

## 📋 Pré-requisitos

Você já tem configurado:

- ✅ Projeto Firebase criado
- ✅ Variáveis de ambiente no Vercel:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

## 🔥 Configuração do Firebase (Próximos Passos)

### 1. Configurar Firestore Database

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto: **crm-prime-habitacao-af481**
3. Vá em **Build > Firestore Database**
4. Clique em **Create Database**
5. Escolha **Start in production mode** (vamos aplicar regras customizadas)
6. Escolha a região: **southamerica-east1 (São Paulo)**

### 2. Aplicar Regras de Segurança do Firestore

No console do Firestore:

1. Vá em **Firestore Database > Rules**
2. Cole o conteúdo do arquivo `firestore.rules` do projeto
3. Clique em **Publish**

### 3. Configurar Firebase Storage

1. Vá em **Build > Storage**
2. Clique em **Get Started**
3. Escolha **Start in production mode**
4. Use a mesma região: **southamerica-east1**

### 4. Aplicar Regras de Segurança do Storage

No console do Storage:

1. Vá em **Storage > Rules**
2. Cole o conteúdo do arquivo `storage.rules` do projeto
3. Clique em **Publish**

### 5. Habilitar Firebase Authentication

1. Vá em **Build > Authentication**
2. Clique em **Get Started**
3. Clique em **Sign-in method**
4. Habilite **Email/Password**:
   - Clique em **Email/Password**
   - Ative **Enable**
   - Salve

## 🚀 Deploy no Vercel

### Opção 1: Deploy Automático (Recomendado)

1. Faça commit e push das alterações:

```bash
git add .
git commit -m "Migração para Firebase concluída"
git push origin main
```

2. O Vercel detectará automaticamente e iniciará o deploy
3. Aguarde a conclusão do build

### Opção 2: Deploy Manual

```bash
npm run build
vercel --prod
```

## ✅ Verificação Pós-Deploy

1. **Teste de Registro**:
   - Acesse a URL do Vercel
   - Crie uma nova conta
   - Verifique no Firebase Console > Authentication se o usuário foi criado

2. **Teste de Login**:
   - Faça login com as credenciais criadas
   - Verifique se o dashboard correto é exibido

3. **Teste de Perfil**:
   - Verifique no Firestore Database se a coleção `profiles` foi criada
   - Confirme se o documento do usuário foi salvo corretamente

## 🔧 Estrutura de Dados do Firestore

### Coleções Principais

```
firestore
├── profiles/{userId}
│   ├── id: string
│   ├── email: string
│   ├── name: string
│   ├── role: 'admin' | 'attendant' | 'client'
│   ├── avatar_url?: string
│   ├── created_at: timestamp
│   └── updated_at: timestamp
│
├── processes/{processId}
│   ├── client_id: string
│   ├── client_name: string
│   ├── client_email: string
│   ├── client_cpf?: string
│   ├── attendant_id?: string
│   ├── type: string
│   ├── status: ProcessStatus
│   ├── value: number
│   ├── documents: Array
│   ├── extra_fields: Map
│   ├── created_at: timestamp
│   └── updated_at: timestamp
│   │
│   └── messages/{messageId}  (Subcoleção)
│       ├── sender_id: string
│       ├── sender_name: string
│       ├── role: string
│       ├── content: string
│       └── timestamp: timestamp
```

## 🔐 Primeiro Acesso Admin

Para criar o primeiro usuário administrador:

1. Crie uma conta com o email: `david@creditoprime.com.br`
2. O sistema automaticamente atribuirá role `admin` (hardcoded no `authService.ts`)
3. Após login, você terá acesso total ao sistema

## 🐛 Troubleshooting

### Erro: "auth/invalid-credential"

- Verifique se as variáveis de ambiente estão corretas no Vercel
- Confirme que o Firebase Authentication está habilitado

### Erro: "Missing or insufficient permissions"

- Verifique se as regras do Firestore foram aplicadas corretamente
- Confirme que o usuário está autenticado

### Storage não funciona

- Verifique se as regras do Storage foram aplicadas
- Confirme que o bucket foi criado

## 📝 Próximas Melhorias

- [ ] Implementar recuperação de senha
- [ ] Adicionar verificação de email
- [ ] Configurar Cloud Functions para notificações
- [ ] Implementar backup automático do Firestore
- [ ] Adicionar analytics com Firebase Analytics
