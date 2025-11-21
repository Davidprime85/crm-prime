import { supabase } from '../lib/supabaseClient';
import { ChatMessage } from '../types';

export const chatService = {
    // Buscar mensagens de um processo
    getMessages: async (processId: string): Promise<ChatMessage[]> => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('process_id', processId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao buscar mensagens:', error);
            return [];
        }

        return data.map(msg => ({
            id: msg.id,
            process_id: msg.process_id,
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at
        }));
    },

    // Enviar mensagem
    sendMessage: async (message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage | null> => {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                process_id: message.process_id,
                sender_id: message.sender_id,
                sender_name: message.sender_name,
                role: message.role,
                content: message.content
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao enviar mensagem:', error);
            return null;
        }

        return {
            id: data.id,
            process_id: data.process_id,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
            role: data.role,
            content: data.content,
            timestamp: data.created_at
        };
    },

    // Inscrever-se para novas mensagens (Realtime)
    subscribeToMessages: (processId: string, onNewMessage: (msg: ChatMessage) => void) => {
        return supabase
            .channel(`chat:${processId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `process_id=eq.${processId}` },
                (payload) => {
                    const newMsg = payload.new;
                    onNewMessage({
                        id: newMsg.id,
                        process_id: newMsg.process_id,
                        sender_id: newMsg.sender_id,
                        sender_name: newMsg.sender_name,
                        role: newMsg.role,
                        content: newMsg.content,
                        timestamp: newMsg.created_at
                    });
                }
            )
            .subscribe();
    }
};
