import React, { useState } from 'react';
import { Mail, MessageSquare, MessageCircle, X } from 'lucide-react';
import { Process } from '../types';

interface NotificationSelectorProps {
    process: Process;
    onClose: () => void;
    onSend: (channel: 'email' | 'sms' | 'chat', message: string) => void;
}

export const NotificationSelector: React.FC<NotificationSelectorProps> = ({ process, onClose, onSend }) => {
    const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms' | 'chat' | null>(null);
    const [customMessage, setCustomMessage] = useState('');

    // Gera mensagem automática baseada no status e dados do processo
    const generateMessage = (): string => {
        const clientName = process.client_name.split(' ')[0]; // Primeiro nome
        const status = process.status;

        // Busca dados específicos nos extra_fields
        const getField = (label: string) => process.extra_fields?.find(f => f.label === label)?.value;

        switch (status) {
            case 'credit_analysis': // 20%
                const bank = getField('bank_approved') || 'banco parceiro';
                const creditValue = getField('credit_value');
                return `Olá ${clientName}! 🎉\n\nTemos ótimas notícias! Seu crédito foi aprovado pelo ${bank}${creditValue ? ` no valor de R$ ${parseFloat(creditValue).toLocaleString('pt-BR')}` : ''}.\n\nPróxima etapa: Avaliação do imóvel.\n\nQualquer dúvida, estamos à disposição!`;

            case 'valuation': // 40%
                const valuationValue = getField('valuation_value');
                return `Olá ${clientName}! 📋\n\nA avaliação do imóvel foi concluída${valuationValue ? ` com o valor de R$ ${parseFloat(valuationValue).toLocaleString('pt-BR')}` : ''}.\n\nPróxima etapa: Análise jurídica da documentação.\n\nEstamos avançando!`;

            case 'legal_analysis': // 60%
                const pendencyType = getField('pendency_type');
                const pendencyDesc = getField('pendency_desc');

                if (pendencyType === 'client' && pendencyDesc) {
                    return `Olá ${clientName}! ⚠️\n\nIdentificamos uma pendência na documentação:\n\n${pendencyDesc}\n\nPor favor, providencie o quanto antes para darmos continuidade ao processo.\n\nEstamos à disposição para ajudar!`;
                } else if (pendencyType === 'internal') {
                    return `Olá ${clientName}! 📄\n\nSua documentação está em análise jurídica. Estamos trabalhando internamente para resolver algumas questões.\n\nEm breve retornaremos com atualizações!`;
                } else {
                    return `Olá ${clientName}! ✅\n\nAnálise jurídica concluída com sucesso! Toda a documentação está aprovada.\n\nPróxima etapa: Emissão do ITBI.\n\nEstamos quase lá!`;
                }

            case 'itbi_emission': // 80%
                const itbiValue = getField('itbi_value');
                const itbiDueDate = getField('itbi_due_date');
                return `Olá ${clientName}! 💰\n\nO ITBI foi emitido${itbiValue ? ` no valor de R$ ${parseFloat(itbiValue).toLocaleString('pt-BR')}` : ''}${itbiDueDate ? ` com vencimento em ${new Date(itbiDueDate).toLocaleDateString('pt-BR')}` : ''}.\n\nApós o pagamento, seguiremos para a assinatura do contrato!\n\nEstamos na reta final!`;

            case 'contract_signing': // 100%
                const signingDate = getField('signing_date');
                return `Olá ${clientName}! 🎊\n\nParabéns! Chegamos à etapa final!\n\n${signingDate ? `A assinatura do contrato está agendada para ${new Date(signingDate).toLocaleDateString('pt-BR')}.` : 'Em breve agendaremos a assinatura do contrato.'}\n\nSeu sonho está se tornando realidade!`;

            default:
                return `Olá ${clientName}!\n\nSeu processo está em andamento. Em breve teremos novidades!\n\nQualquer dúvida, estamos à disposição.`;
        }
    };

    const autoMessage = generateMessage();

    const handleSend = () => {
        if (!selectedChannel) return;
        const messageToSend = customMessage.trim() || autoMessage;
        onSend(selectedChannel, messageToSend);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">Notificar Cliente</h3>
                        <p className="text-blue-100 text-sm mt-1">{process.client_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Channel Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Escolha o Canal</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setSelectedChannel('email')}
                                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${selectedChannel === 'email'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 hover:border-blue-300 text-slate-600'
                                    }`}
                            >
                                <Mail size={24} />
                                <span className="text-sm font-semibold">Email</span>
                            </button>
                            <button
                                onClick={() => setSelectedChannel('sms')}
                                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${selectedChannel === 'sms'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-slate-200 hover:border-green-300 text-slate-600'
                                    }`}
                            >
                                <MessageSquare size={24} />
                                <span className="text-sm font-semibold">SMS</span>
                            </button>
                            <button
                                onClick={() => setSelectedChannel('chat')}
                                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${selectedChannel === 'chat'
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-slate-200 hover:border-purple-300 text-slate-600'
                                    }`}
                            >
                                <MessageCircle size={24} />
                                <span className="text-sm font-semibold">Chat</span>
                            </button>
                        </div>
                    </div>

                    {/* Message Preview/Edit */}
                    {selectedChannel && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                            <label className="block text-sm font-bold text-slate-700">
                                Mensagem
                                <span className="text-slate-500 font-normal ml-2">(Gerada automaticamente - você pode editar)</span>
                            </label>
                            <textarea
                                value={customMessage || autoMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-700 resize-none"
                            />
                            <p className="text-xs text-slate-500">
                                💡 Esta mensagem foi gerada com base nos dados coletados na etapa atual.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!selectedChannel}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Enviar Notificação
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
