import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User as UserIcon } from 'lucide-react';
import { ChatMessage, User } from '../types';
import { chatService } from '../services/chatService';

interface ChatWidgetProps {
  processId: string;
  currentUser: User;
  recipientName: string; // For UI header
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ processId, currentUser, recipientName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Chat aberto. Process ID:', processId);
      scrollToBottom();

      // Carregar mensagens iniciais
      chatService.getMessages(processId)
        .then(msgs => {
          console.log('Mensagens carregadas:', msgs.length);
          setMessages(msgs);
        })
        .catch(err => {
          console.error('Erro ao carregar mensagens:', err);
          alert('Erro ao conectar ao chat. Verifique o console.');
        });

      // Inscrever no Realtime
      const subscription = chatService.subscribeToMessages(processId, (newMsg) => {
        console.log('Nova mensagem recebida:', newMsg);
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      });

      return () => {
        subscription(); // Unsubscribe é uma função, não um objeto
      };
    }
  }, [isOpen, processId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const tempId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: tempId,
      process_id: processId,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      role: currentUser.role,
      content: message,
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Send to backend
    chatService.sendMessage({
      process_id: processId,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      role: currentUser.role,
      content: newMessage.content
    }).then(sentMsg => {
      if (sentMsg) {
        // Update temp ID with real ID if needed, or just let realtime handle it (but we filter dups)
        setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-[90]"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-[90] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 max-h-[80vh]">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm">Chat - Processo {processId}</h3>
          <p className="text-xs text-slate-400">Conversando com {recipientName}</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 h-80 overflow-y-auto p-4 bg-slate-50 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser.id;
          const isSystem = msg.sender_id === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded-full">{msg.content}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${isMe
                ? 'bg-amber-500 text-white rounded-tr-none'
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                }`}>
                {!isMe && <p className="text-[10px] font-bold mb-1 text-slate-400">{msg.sender_name}</p>}
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-amber-100' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};