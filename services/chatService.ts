import { db } from './firebaseConfig';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Unsubscribe
} from 'firebase/firestore';
import { ChatMessage } from '../types';

export const chatService = {
    // Buscar mensagens de um processo
    getMessages: async (processId: string): Promise<ChatMessage[]> => {
        try {
            const messagesRef = collection(db, 'processes', processId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    process_id: processId,
                    sender_id: data.sender_id,
                    sender_name: data.sender_name,
                    role: data.role,
                    content: data.content,
                    timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
                };
            });
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            return [];
        }
    },

    // Enviar mensagem
    sendMessage: async (message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage | null> => {
        try {
            const messagesRef = collection(db, 'processes', message.process_id, 'messages');

            const messageData = {
                sender_id: message.sender_id,
                sender_name: message.sender_name,
                role: message.role,
                content: message.content,
                timestamp: serverTimestamp()
            };

            const docRef = await addDoc(messagesRef, messageData);

            return {
                id: docRef.id,
                process_id: message.process_id,
                sender_id: message.sender_id,
                sender_name: message.sender_name,
                role: message.role,
                content: message.content,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return null;
        }
    },

    // Inscrever-se para novas mensagens (Realtime usando Firestore onSnapshot)
    subscribeToMessages: (processId: string, onNewMessage: (msg: ChatMessage) => void): Unsubscribe => {
        const messagesRef = collection(db, 'processes', processId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    onNewMessage({
                        id: change.doc.id,
                        process_id: processId,
                        sender_id: data.sender_id,
                        sender_name: data.sender_name,
                        role: data.role,
                        content: data.content,
                        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
                    });
                }
            });
        });
    }
};

