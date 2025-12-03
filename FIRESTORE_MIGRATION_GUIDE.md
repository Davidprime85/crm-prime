# Guia de Migração: Supabase → Firestore

## 📊 Diferenças de Estrutura de Dados

### Timestamps
**Supabase (PostgreSQL)**:
```typescript
created_at: "2025-12-02T20:00:00Z" // String ISO
```

**Firestore**:
```typescript
import { Timestamp } from 'firebase/firestore';
created_at: Timestamp.now() // Firestore Timestamp object
```

**Solução**: Converter timestamps ao ler/escrever:
```typescript
// Ao escrever no Firestore
const data = {
  ...process,
  created_at: Timestamp.fromDate(new Date(process.created_at))
};

// Ao ler do Firestore
const process = {
  ...doc.data(),
  created_at: doc.data().created_at.toDate().toISOString()
};
```

---

## 🗂️ Estrutura de Coleções

### Coleção: `/processes`
```typescript
{
  id: string (auto-gerado ou custom)
  client_name: string
  client_id: string
  client_email: string
  status: ProcessStatus
  value: number
  created_at: Timestamp
  updated_at: Timestamp
  documents: ProcessDocument[] // Array nativo
  extra_fields: CustomField[] // Array nativo
}
```

### Coleção: `/messages`
```typescript
{
  id: string (auto-gerado)
  process_id: string // Referência ao processo
  sender_id: string
  sender_name: string
  role: 'admin' | 'attendant' | 'client'
  content: string
  created_at: Timestamp
}
```

### Coleção: `/users`
```typescript
{
  id: string (Firebase Auth UID)
  email: string
  name: string
  role: 'admin' | 'attendant' | 'client'
  avatar_url?: string
}
```

---

## 🔄 Queries Comuns

### Buscar processos de um cliente
**Supabase**:
```typescript
const { data } = await supabase
  .from('processes')
  .select('*')
  .eq('client_id', userId);
```

**Firestore**:
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'processes'),
  where('client_id', '==', userId)
);
const snapshot = await getDocs(q);
const processes = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Realtime Subscriptions
**Supabase**:
```typescript
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
  .subscribe();
```

**Firestore**:
```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const q = query(
  collection(db, 'messages'),
  where('process_id', '==', processId)
);
const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      callback(change.doc.data());
    }
  });
});
```

---

## ⚠️ Pontos de Atenção

1. **IDs**: Firestore gera IDs automaticamente. Para manter compatibilidade, podemos usar `.doc(customId)` se necessário.

2. **Arrays**: Firestore suporta arrays nativamente, mas atualizações parciais requerem `arrayUnion` ou `arrayRemove`.

3. **Transações**: Firestore tem limite de 500 documentos por transação.

4. **Índices**: Queries complexas podem requerer índices compostos (Firestore sugere automaticamente).

5. **Custo**: Firestore cobra por leitura/escrita. Otimizar queries é essencial.

---

## 🛠️ Helpers Úteis

### Converter Timestamp
```typescript
// services/firestoreHelpers.ts
import { Timestamp } from 'firebase/firestore';

export const toFirestoreTimestamp = (isoString: string): Timestamp => {
  return Timestamp.fromDate(new Date(isoString));
};

export const fromFirestoreTimestamp = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString();
};
```

### Converter Process para Firestore
```typescript
export const processToFirestore = (process: Process) => {
  return {
    ...process,
    created_at: toFirestoreTimestamp(process.created_at),
    updated_at: toFirestoreTimestamp(process.updated_at),
    documents: process.documents.map(doc => ({
      ...doc,
      uploaded_at: doc.uploaded_at ? toFirestoreTimestamp(doc.uploaded_at) : null
    }))
  };
};
```
