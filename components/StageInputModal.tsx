import React, { useState, useEffect } from 'react';
import { ProcessStatus } from '../types';
import { X, AlertCircle, DollarSign, FileText, Building, Users, AlertTriangle } from 'lucide-react';

interface FieldConfig {
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    conditional?: string;
    conditionalValue?: string;
}

interface StageInputModalProps {
    isOpen: boolean;
    stage: ProcessStatus;
    onClose: () => void;
    onSubmit: (data: Record<string, string>) => void;
}

export const StageInputModal: React.FC<StageInputModalProps> = ({ isOpen, stage, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});

    // Reset form when modal opens or stage changes
    useEffect(() => {
        if (isOpen) {
            setFormData({});
        }
    }, [isOpen, stage]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getStageFields = (): { title: string; description: string; icon: JSX.Element; fields: FieldConfig[] } => {
        switch (stage) {
            case 'credit_analysis': // 20%
                return {
                    title: '20% - Análise de Crédito',
                    description: 'Informe os bancos aprovados e o valor da carta de crédito.',
                    icon: <DollarSign className="text-blue-500" size={24} />,
                    fields: [
                        { name: 'bank_approved', label: 'Banco(s) Aprovado(s)', type: 'text', placeholder: 'Ex: Caixa, Itaú, Bradesco', required: true },
                        { name: 'credit_value', label: 'Valor da Carta de Crédito (R$)', type: 'number', placeholder: '0,00', required: true },
                        { name: 'credit_letter_link', label: 'Link da Carta de Crédito (PDF)', type: 'url', placeholder: 'https://...', required: false }
                    ]
                };

            case 'valuation': // 40%
                return {
                    title: '40% - Avaliação do Imóvel',
                    description: 'Informe o valor da avaliação para prosseguir.',
                    icon: <Building className="text-purple-500" size={24} />,
                    fields: [
                        { name: 'valuation_value', label: 'Valor da Avaliação (R$)', type: 'number', placeholder: '0,00', required: true }
                    ]
                };

            case 'legal_analysis': // 60%
                return {
                    title: '60% - Análise Jurídica',
                    description: 'Verifique se há pendências jurídicas.',
                    icon: <AlertTriangle className="text-indigo-500" size={24} />,
                    fields: [
                        { name: 'has_pendency', label: 'Há pendências?', type: 'select', options: ['Não', 'Sim'], required: true },
                        { name: 'pendency_type', label: 'Tipo de Pendência', type: 'select', options: ['Cliente', 'Interna'], required: false, conditional: 'has_pendency', conditionalValue: 'Sim' },
                        { name: 'pendency_desc', label: 'Descrição da Pendência', type: 'textarea', placeholder: 'Descreva os documentos faltantes ou problemas...', required: false, conditional: 'has_pendency', conditionalValue: 'Sim' }
                    ]
                };

            case 'itbi_emission': // 80%
                return {
                    title: '80% - Emissão de ITBI',
                    description: 'Dados para pagamento do imposto.',
                    icon: <FileText className="text-amber-500" size={24} />,
                    fields: [
                        { name: 'itbi_value', label: 'Valor do ITBI (R$)', type: 'number', placeholder: '0,00', required: true },
                        { name: 'itbi_due_date', label: 'Data de Vencimento', type: 'date', required: true }
                    ]
                };

            case 'contract_signing': // 100%
                return {
                    title: '100% - Assinatura de Contrato',
                    description: 'Finalização do processo.',
                    icon: <Users className="text-green-500" size={24} />,
                    fields: [
                        { name: 'signing_date', label: 'Data de Assinatura', type: 'date', required: true }
                    ]
                };

            case 'registry_service': // Extra
                return {
                    title: 'Registro em Cartório',
                    description: 'Acompanhamento do registro.',
                    icon: <Building className="text-teal-500" size={24} />,
                    fields: [
                        { name: 'registry_office', label: 'Cartório', type: 'text', required: true },
                        { name: 'protocol_number', label: 'Número do Protocolo', type: 'text', required: true }
                    ]
                };

            default:
                return {
                    title: 'Mover Processo',
                    description: 'Confirme a mudança de etapa.',
                    icon: <AlertCircle className="text-slate-500" size={24} />,
                    fields: [
                        { name: 'move_obs', label: 'Observações', type: 'textarea', required: false }
                    ]
                };
        }
    };

    const config = getStageFields();

    // Lógica para processar o envio
    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const finalData = { ...formData };

        // Lógica específica para Jurídico
        if (stage === 'legal_analysis') {
            // Se não há pendência, garantir que pendency_type seja 'none'
            if (formData['has_pendency'] === 'Não') {
                finalData['pendency_type'] = 'none';
                delete finalData['pendency_desc'];
            } else if (formData['has_pendency'] === 'Sim') {
                // pendency_type já vem do select (Cliente/Interna)
                // Converter para lowercase para consistência
                if (finalData['pendency_type'] === 'Cliente') {
                    finalData['pendency_type'] = 'client';
                } else if (finalData['pendency_type'] === 'Interna') {
                    finalData['pendency_type'] = 'internal';
                }
            }
            delete finalData['has_pendency']; // Remove o campo auxiliar
        }

        onSubmit(finalData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{config.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{config.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleFinalSubmit} className="p-6 space-y-5">
                    {config.fields.map(field => {
                        // Lógica condicional: só renderiza o campo se não tiver condição OU se a condição for atendida
                        const shouldRender = !field.conditional || formData[field.conditional] === field.conditionalValue;

                        if (!shouldRender) return null;

                        return (
                            <div key={field.name}>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {field.type === 'select' ? (
                                    <select
                                        required={field.required}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-700"
                                    >
                                        <option value="">Selecione uma opção...</option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        required={field.required}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-700 resize-none"
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        required={field.required}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-700"
                                    />
                                )}
                            </div>
                        );
                    })}

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 hover:text-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                        >
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
