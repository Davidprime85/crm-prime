# Firestore Security Rules - Guia de Implementação

## 📋 Visão Geral das Regras

As regras de segurança do Firestore garantem que:

- **Admin**: Acesso total (ler/escrever tudo)
- **Atendente**: Ler tudo, editar apenas campos específicos
- **Cliente**: Ler apenas seus processos, criar mensagens no chat

---

## 🔐 Estrutura de Permissões

### Coleção: `/processes`

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| **Admin** | ✅ Todos | ✅ Sim | ✅ Todos campos | ✅ Sim |
| **Atendente** | ✅ Todos | ❌ Não | ✅ Campos específicos* | ❌ Não |
| **Cliente** | ✅ Apenas seus | ❌ Não | ❌ Não | ❌ Não |

*Campos permitidos para Atendente: `status`, `notes`, `updated_at`, `extra_fields`, `documents`

### Subcoleção: `/processes/{id}/messages`

| Role | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| **Admin** | ✅ Todas | ✅ Sim | ✅ Sim | ✅ Sim |
| **Atendente** | ✅ Todas | ✅ Sim | ✅ Sim | ✅ Sim |
| **Cliente** | ✅ Apenas seu processo | ✅ Apenas suas | ❌ Não | ❌ Não |

---

## 🚀 Como Aplicar as Regras

### 1. Acessar Firebase Console

1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Rules**

### 2. Colar as Regras

1. Copie todo o conteúdo do arquivo `firestore.rules`
2. Cole na área de edição do Firebase Console
3. Clique em **Publish** (Publicar)

### 3. Testar as Regras

Use o **Rules Playground** no Firebase Console para testar cenários:

**Exemplo 1: Cliente tentando ler processo de outro cliente**

```
Operation: get
Location: /processes/PROCESS_ID_1
Auth: { uid: 'CLIENT_UID_2' }
Result: ❌ DENY (client_id não corresponde)
```

**Exemplo 2: Atendente atualizando status**

```
Operation: update
Location: /processes/PROCESS_ID
Data: { status: 'valuation' }
Auth: { uid: 'ATTENDANT_UID', role: 'attendant' }
Result: ✅ ALLOW
```

**Exemplo 3: Cliente enviando mensagem**

```
Operation: create
Location: /processes/PROCESS_ID/messages/MSG_ID
Data: { sender_id: 'CLIENT_UID', content: 'Olá' }
Auth: { uid: 'CLIENT_UID' }
Result: ✅ ALLOW (se client_id do processo == CLIENT_UID)
```

---

## ⚠️ Importante: Estrutura de Dados do Usuário

As regras assumem que existe uma coleção `/users` com a seguinte estrutura:

```typescript
/users/{userId}
{
  email: string
  name: string
  role: 'admin' | 'attendant' | 'client'
}
```

**Você precisa criar esta coleção** quando um usuário se registra via Firebase Authentication.

### Exemplo de Criação de Usuário

```typescript
// Após criar usuário no Firebase Auth
const userRef = doc(db, 'users', user.uid);
await setDoc(userRef, {
  email: user.email,
  name: displayName,
  role: 'client' // ou 'admin', 'attendant'
});
```

---

## 🧪 Testes Recomendados

Após publicar as regras, teste os seguintes cenários:

### ✅ Cenários que DEVEM funcionar

1. Admin lê todos os processos
2. Atendente lê todos os processos
3. Atendente atualiza status de um processo
4. Cliente lê apenas seus processos
5. Cliente envia mensagem no chat do seu processo

### ❌ Cenários que DEVEM falhar

1. Cliente tenta ler processo de outro cliente
2. Cliente tenta editar seu processo
3. Cliente tenta deletar mensagem
4. Atendente tenta editar campo `client_id`
5. Usuário não autenticado tenta acessar qualquer dado

---

## 🔧 Troubleshooting

### Erro: "Missing or insufficient permissions"

**Causa**: Usuário não tem permissão para a operação
**Solução**: Verifique se:

1. O usuário está autenticado (`request.auth != null`)
2. O documento `/users/{uid}` existe com o campo `role` correto
3. Para clientes, o `client_id` do processo corresponde ao `uid`

### Erro: "Document not found" ao verificar role

**Causa**: Documento do usuário não existe em `/users`
**Solução**: Criar documento do usuário ao registrar:

```typescript
await setDoc(doc(db, 'users', uid), { role, email, name });
```

---

## 📝 Manutenção

### Adicionar Novo Campo Editável para Atendente

Edite a função `onlyUpdatingFields` e adicione o campo:

```javascript
allow update: if isAttendant() && 
                 onlyUpdatingFields(['status', 'notes', 'updated_at', 'extra_fields', 'documents', 'NEW_FIELD']);
```

### Adicionar Nova Coleção

Siga o mesmo padrão de verificação de role:

```javascript
match /nova_colecao/{docId} {
  allow read, write: if isAdmin();
  allow read: if isAttendant();
  // ... outras regras
}
```
