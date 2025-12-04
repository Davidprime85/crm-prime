// Firestore Service - Substitui o dataService.ts do Supabase
// Implementa CRUD completo com mapeamento inteligente de dados

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Process, ProcessDocument, ChatMessage, ProcessStatus, CustomField } from '../types';

// ============================================
// HELPERS - Conversão e Sanitização de Dados
// ============================================

/**
 * Remove valores undefined de um objeto (Firestore não aceita undefined)
 * Converte undefined → null recursivamente
 */
const cleanData = (data: any): any => {
    if (data === null || data === undefined) {
        return null;
    }

    if (Array.isArray(data)) {
        return data.map(item => cleanData(item));
    }

    if (typeof data === 'object' && data !== null) {
        const cleaned: any = {};
        Object.keys(data).forEach(key => {
            const value = data[key];
            // Remove undefined, mantém null
            if (value !== undefined) {
                cleaned[key] = cleanData(value);
            } else {
                cleaned[key] = null;
            }
        });
        return cleaned;
    }

    return data;
};

/**
 * Converte Firestore Timestamp para ISO string
 */
const timestampToISO = (timestamp: any): string => {
    if (!timestamp) return new Date().toISOString();
    if (timestamp.toDate) return timestamp.toDate().toISOString();
    return timestamp;
};

/**
 * Converte ISO string para Firestore Timestamp
 */
const isoToTimestamp = (isoString: string): Timestamp => {
    return Timestamp.fromDate(new Date(isoString));
};

/**
 * Converte documento Firestore para Process
 * Mescla extra_fields na raiz e converte timestamps
 */
const firestoreToProcess = (doc: QueryDocumentSnapshot<DocumentData>): Process => {
    const data = doc.data();

    // Extrair extra_fields se existir (pode ser Map ou Array)
    let extraFields: CustomField[] = [];
    if (data.extra_fields) {
        if (Array.isArray(data.extra_fields)) {
            extraFields = data.extra_fields;
        } else if (typeof data.extra_fields === 'object') {
            // Converter Map para Array
            extraFields = Object.entries(data.extra_fields).map(([label, value]) => ({
                label,
                value: String(value)
            }));
        }
    }

    return {
        id: doc.id,
        client_name: data.client_name || '',
        client_id: data.client_id || '',
        client_email: data.client_email,
        client_cpf: data.client_cpf,
        type: data.type || '',
        status: data.status || 'credit_analysis',
        value: data.value || 0,
        created_at: timestampToISO(data.created_at),
        updated_at: timestampToISO(data.updated_at),
        attendant_id: data.attendant_id,
        documents: data.documents || [],
        extra_fields: extraFields,
        has_unread: data.has_unread || false,
        progress: data.progress,
        auto_notifications_sent: data.auto_notifications_sent || []
    };
};

/**
 * Converte Process para formato Firestore
 * Mescla extra_fields como Map na raiz do documento
 * Sanitiza valores undefined para null (Firestore não aceita undefined)
 */
const processToFirestore = (process: Partial<Process>): DocumentData => {
    const data: DocumentData = {
        client_name: process.client_name ?? null,
        client_id: process.client_id ?? null,
        client_email: process.client_email ?? null,
        client_cpf: process.client_cpf ?? null,
        type: process.type ?? null,
        status: process.status ?? 'credit_analysis',
        value: process.value ?? 0,
        attendant_id: process.attendant_id ?? null, // CRÍTICO: undefined → null
        documents: process.documents || [],
        has_unread: process.has_unread ?? false,
        progress: process.progress ?? null,
        auto_notifications_sent: process.auto_notifications_sent || []
    };

    // Converter extra_fields para Map (melhor para Firestore)
    if (process.extra_fields && Array.isArray(process.extra_fields)) {
        const extraFieldsMap: Record<string, string> = {};
        process.extra_fields.forEach(field => {
            extraFieldsMap[field.label] = field.value;
        });
        data.extra_fields = extraFieldsMap;
    }

    // Adicionar timestamps
    if (process.created_at) {
        data.created_at = isoToTimestamp(process.created_at);
    }
    if (process.updated_at) {
        data.updated_at = isoToTimestamp(process.updated_at);
    }

    return data;
};

// ============================================
// CRUD - Processos
// ============================================

export const firestoreService = {
    /**
     * Buscar processos com filtros
     */
    getProcesses: async (role: 'admin' | 'attendant' | 'client', userId: string, userEmail?: string): Promise<Process[]> => {
        try {
            const processesRef = collection(db, 'processes');
            let q;

            if (role === 'admin') {
                // Admin vê todos os processos
                q = query(processesRef, orderBy('updated_at', 'desc'));
            } else if (role === 'attendant') {
                // Atendente vê processos atribuídos a ele
                q = query(
                    processesRef,
                    where('attendant_id', '==', userId),
                    orderBy('updated_at', 'desc')
                );
            } else {
                // Cliente vê apenas seus processos (por ID ou email)
                q = query(
                    processesRef,
                    where('client_id', '==', userId),
                    orderBy('updated_at', 'desc')
                );
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(firestoreToProcess);
        } catch (error) {
            console.error('Erro ao buscar processos:', error);
            return [];
        }
    },

    /**
     * Criar novo processo
     */
    createProcess: async (processData: Partial<Process>): Promise<string> => {
        try {
            const data = processToFirestore({
                ...processData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: processData.status || 'credit_analysis',
                attendant_id: processData.attendant_id || null, // Força null se undefined
                documents: processData.documents || [
                    { id: 'doc1', name: 'RG e CPF', status: 'pending' },
                    { id: 'doc2', name: 'Comprovante de Renda', status: 'pending' },
                    { id: 'doc3', name: 'Comprovante de Residência', status: 'pending' }
                ]
            });

            // SANITIZAÇÃO CRÍTICA: Remove todos os undefined
            const safeData = cleanData(data);

            const docRef = await addDoc(collection(db, 'processes'), safeData);
            return docRef.id;
        } catch (error) {
            console.error('Erro ao criar processo:', error);
            throw error;
        }
    },

    /**
     * Atualizar status do processo com dados da etapa
     */
    updateProcessStatus: async (
        processId: string,
        newStatus: ProcessStatus,
        stageData: Record<string, string>
    ): Promise<void> => {
        try {
            const processRef = doc(db, 'processes', processId);
            const processSnap = await getDoc(processRef);

            if (!processSnap.exists()) {
                throw new Error('Processo não encontrado');
            }

            const currentData = processSnap.data();
            const currentExtraFields = currentData.extra_fields || {};

            // Mesclar novos dados com extra_fields existentes
            const updatedExtraFields = {
                ...currentExtraFields,
                ...stageData
            };

            // SANITIZAÇÃO: Remove undefined
            const updateData = cleanData({
                status: newStatus,
                extra_fields: updatedExtraFields,
                updated_at: serverTimestamp()
            });

            await updateDoc(processRef, updateData);
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            throw error;
        }
    },

    /**
     * Atualizar campos personalizados
     */
    updateProcessFields: async (processId: string, fields: CustomField[]): Promise<void> => {
        try {
            const processRef = doc(db, 'processes', processId);

            // Converter array para Map
            const fieldsMap: Record<string, string> = {};
            fields.forEach(field => {
                fieldsMap[field.label] = field.value;
            });

            await updateDoc(processRef, {
                extra_fields: fieldsMap,
                updated_at: serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao atualizar campos:', error);
            throw error;
        }
    },

    /**
     * Atualizar documento específico
     */
    updateDocument: async (
        processId: string,
        docId: string,
        updates: Partial<ProcessDocument>
    ): Promise<void> => {
        try {
            const processRef = doc(db, 'processes', processId);
            const processSnap = await getDoc(processRef);

            if (!processSnap.exists()) {
                throw new Error('Processo não encontrado');
            }

            const documents = processSnap.data().documents || [];
            const updatedDocuments = documents.map((doc: ProcessDocument) =>
                doc.id === docId ? { ...doc, ...cleanData(updates) } : doc
            );

            // SANITIZAÇÃO: Remove undefined
            const updateData = cleanData({
                documents: updatedDocuments,
                updated_at: serverTimestamp()
            });

            await updateDoc(processRef, updateData);
        } catch (error) {
            console.error('Erro ao atualizar documento:', error);
            throw error;
        }
    },

    /**
     * Adicionar novo documento ao processo
     */
    addDocument: async (processId: string, docName: string): Promise<void> => {
        try {
            const processRef = doc(db, 'processes', processId);
            const processSnap = await getDoc(processRef);

            if (!processSnap.exists()) {
                throw new Error('Processo não encontrado');
            }

            const documents = processSnap.data().documents || [];
            const newDoc: ProcessDocument = {
                id: `doc_${Date.now()}`,
                name: docName,
                status: 'pending',
                is_extra: true
            };

            await updateDoc(processRef, {
                documents: [...documents, newDoc],
                updated_at: serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao adicionar documento:', error);
            throw error;
        }
    },

    // ============================================
    // CHAT - Subcoleção de Mensagens
    // ============================================

    /**
     * Buscar histórico de chat de um processo
     */
    getChatHistory: async (processId: string): Promise<ChatMessage[]> => {
        try {
            const messagesRef = collection(db, 'processes', processId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                process_id: processId,
                sender_id: doc.data().sender_id,
                sender_name: doc.data().sender_name,
                role: doc.data().role,
                content: doc.data().content,
                timestamp: timestampToISO(doc.data().timestamp)
            }));
        } catch (error) {
            console.error('Erro ao buscar chat:', error);
            return [];
        }
    },

    /**
     * Enviar mensagem no chat
     */
    sendMessage: async (
        processId: string,
        senderId: string,
        senderName: string,
        role: 'admin' | 'attendant' | 'client',
        content: string
    ): Promise<ChatMessage> => {
        try {
            const messagesRef = collection(db, 'processes', processId, 'messages');
            const messageData = {
                sender_id: senderId,
                sender_name: senderName,
                role,
                content,
                timestamp: serverTimestamp()
            };

            const docRef = await addDoc(messagesRef, messageData);

            return {
                id: docRef.id,
                process_id: processId,
                sender_id: senderId,
                sender_name: senderName,
                role,
                content,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    },

    // ============================================
    // OUTROS MÉTODOS (Compatibilidade)
    // ============================================

    /**
     * Adicionar email de atendente (placeholder)
     */
    addAttendantEmail: async (email: string): Promise<void> => {
        console.log('addAttendantEmail não implementado ainda:', email);
        // TODO: Implementar lógica de convite
    }
};

export default firestoreService;
