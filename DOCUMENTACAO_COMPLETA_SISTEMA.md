# 📋 DOCUMENTAÇÃO COMPLETA - CRM PRIME HABITAÇÃO

> **Documento de Referência Técnica e Funcional**
> **Versão:** 2.0 | **Data:** 05/12/2025
> **Status:** Migração Firestore Completa | Notificações Ativas | Frontend Estável

---

## 🎯 VISÃO GERAL DO SISTEMA

O **CRM PRIME HABITAÇÃO** é uma plataforma robusta para gestão de processos de financiamento habitacional, conectando Clientes, Atendentes e Administradores. O sistema evoluiu de um protótipo Supabase para uma arquitetura escalável baseada em **Firebase Firestore**, com foco em segurança, performance e comunicação automatizada.

### ✨ Diferenciais da Versão 2.0

- **Backend Firestore**: Banco de dados NoSQL escalável e em tempo real.
- **Segurança Granular**: Regras de acesso baseadas em funções (RBAC) para Admin, Atendente e Cliente.
- **Notificações Multicanal**: Integração com **Resend** (Email) e estrutura pronta para SMS.
- **Workflow de Porcentagem**: Acompanhamento preciso de 20% a 100% com feedback visual.
- **Sanitização de Dados**: Proteção automática contra erros de tipagem (`undefined` -> `null`).

---

## 🏗️ ARQUITETURA TÉCNICA

### Stack Tecnológica

| Camada | Tecnologia | Detalhes |
|--------|------------|----------|
| **Frontend** | React 18 + Vite | TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Firebase Firestore | Banco de dados NoSQL, Realtime Updates |
| **Auth** | Firebase Auth | Gestão de usuários e sessões (Em migração) |
| **Email** | Resend API | Envio transacional via Serverless Function |
| **Deploy** | Vercel | Hospedagem Frontend e Serverless Functions |

### Estrutura de Pastas (Atualizada)

```
CRM PRIME HABITAÇÃO/
├── api/
│   └── send-email.ts          # [NOVO] Serverless Function para envio seguro de emails (Resend)
├── components/
│   ├── KanbanBoard.tsx        # Gestão visual de processos por etapas
│   ├── Layout.tsx             # Estrutura principal com navegação e notificações
│   └── ...
├── pages/
│   ├── AdminDashboard.tsx     # Painel Admin com gestão total e notificações manuais
│   ├── AttendantDashboard.tsx # Painel Atendente com foco em operação diária
│   └── ClientDashboard.tsx    # Painel Cliente (Read-only + Upload de Docs)
├── services/
│   ├── firebaseConfig.ts      # [NOVO] Inicialização do Firebase (Auth + Firestore)
│   ├── firestoreService.ts    # [NOVO] Camada de abstração CRUD + Chat + Sanitização
│   ├── notificationService.ts # [NOVO] Serviço de Email (Resend) e SMS
│   └── ...
├── types.ts                   # Definições de Tipos (Process, Notification, User)
├── firestore.rules            # [NOVO] Regras de segurança do banco de dados
└── ...
```

---

## 🔐 SEGURANÇA E DADOS

### 1. Regras de Segurança (`firestore.rules`)

O sistema implementa controle de acesso rigoroso:

- **Admin**: Acesso total (leitura/escrita) a todas as coleções.
- **Atendente**:
  - Leitura global de processos e usuários.
  - Edição restrita a campos específicos (`status`, `notes`, `extra_fields`).
- **Cliente**:
  - Leitura apenas dos **próprios processos** (`resource.data.client_id == request.auth.uid`).
  - Escrita permitida apenas no **Chat** (subcoleção `/messages`).

### 2. Sanitização de Dados (`cleanData`)

Para evitar erros comuns do Firestore (que não aceita `undefined`), implementamos uma camada de sanitização automática em `firestoreService.ts`:

- Converte recursivamente `undefined` para `null`.
- Garante integridade dos dados antes de qualquer operação de escrita (`create`, `update`).

### 3. Modelo de Dados (Firestore)

**Coleção `/processes`**:

```json
{
  "id": "uuid",
  "client_name": "João Silva",
  "status": "credit_analysis",
  "progress": 20,
  "extra_fields": { "bank": "Caixa", "value": "200000" }, // Map
  "documents": [ ... ], // Array de objetos
  "created_at": "Timestamp"
}
```

**Subcoleção `/processes/{id}/messages`**:

```json
{
  "text": "Olá, preciso de ajuda",
  "senderId": "uid_cliente",
  "senderRole": "client",
  "createdAt": "Timestamp"
}
```

---

## 📢 SISTEMA DE NOTIFICAÇÕES

O sistema mantém os clientes informados proativamente:

### 1. Gatilhos Automáticos

- **Mudança de Status**: Ao mover um card no Kanban, o cliente recebe um email automático.
- **Aprovação/Rejeição de Docs**: Feedback imediato sobre documentos enviados.

### 2. Infraestrutura de Envio

- **Serviço**: `notificationService.ts`
- **API**: `api/send-email.ts` (Vercel Serverless Function)
- **Provedor**: **Resend** (Alta entregabilidade)
- **Fallback**: Tratamento de erros de CORS e logs detalhados.

### 3. Templates

- Emails HTML responsivos com identidade visual da Prime Habitação.
- Informações dinâmicas: Nome do cliente, Novo Status, Barra de Progresso e Link para o Portal.

---

## 📊 FUNCIONALIDADES POR PERFIL

### 👑 Administrador

- **Visão Global**: Alternância entre Lista e Kanban.
- **Gestão Total**: Criar/Editar/Excluir processos e usuários.
- **Comunicação**: Enviar mensagens no chat e notificações manuais.
- **Métricas**: Visualização de KPIs (Em desenvolvimento).

### 🎧 Atendente

- **Operação Diária**: Foco no Kanban e movimentação de cards.
- **Coleta de Dados**: Modais contextuais para preenchimento de `extra_fields`.
- **Validação**: Aprovar/Rejeitar documentos.

### 👤 Cliente

- **Transparência**: Barra de progresso visual (20% a 100%).
- **Ação**: Upload de documentos pendentes.
- **Comunicação**: Chat direto com atendentes e histórico de mensagens.

---

## 🚀 PRÓXIMOS PASSOS (Roadmap)

1. **Migração de Autenticação**: Substituir `authService` (Supabase) por Firebase Auth.
2. **Dashboard de Métricas**: Implementar gráficos reais com dados do Firestore.
3. **OCR de Documentos**: Integração futura para leitura automática de RGs e CNHs.
4. **App Mobile**: Avaliar necessidade de PWA ou App Nativo.

---

> **Nota para Desenvolvedores**:
> Para rodar localmente, certifique-se de ter as variáveis de ambiente configuradas no `.env`:
>
> - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.
> - `VITE_RESEND_API_KEY` (para emails)
