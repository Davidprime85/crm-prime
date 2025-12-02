import React from 'react';
import { ProcessStatus } from '../types';
import { CheckCircle, Circle } from 'lucide-react';

interface ProcessProgressBarProps {
    status: ProcessStatus;
    className?: string;
}

// Mapeamento de status para porcentagem
const STATUS_TO_PERCENTAGE: Record<ProcessStatus, number> = {
    'credit_analysis': 20,
    'valuation': 40,
    'legal_analysis': 60,
    'pending_client': 60,
    'pending_internal': 60,
    'itbi_emission': 80,
    'contract_signing': 100,
    'registry_service': 100
};

// Definição das etapas visuais
const STAGES = [
    { percentage: 20, label: 'Análise de Crédito', shortLabel: 'Crédito' },
    { percentage: 40, label: 'Avaliação', shortLabel: 'Avaliação' },
    { percentage: 60, label: 'Análise Jurídica', shortLabel: 'Jurídico' },
    { percentage: 80, label: 'ITBI', shortLabel: 'ITBI' },
    { percentage: 100, label: 'Assinatura', shortLabel: 'Contrato' }
];

export const ProcessProgressBar: React.FC<ProcessProgressBarProps> = ({ status, className = '' }) => {
    const currentPercentage = STATUS_TO_PERCENTAGE[status] || 0;

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">Progresso do Processo</h3>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {currentPercentage}% Concluído
                </span>
            </div>

            {/* Desktop View - Horizontal */}
            <div className="hidden md:block">
                <div className="relative">
                    {/* Linha de conexão */}
                    <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 rounded-full" />
                    <div
                        className="absolute top-5 left-0 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${currentPercentage}%` }}
                    />

                    {/* Etapas */}
                    <div className="relative flex justify-between">
                        {STAGES.map((stage) => {
                            const isCompleted = stage.percentage <= currentPercentage;
                            const isCurrent = stage.percentage === currentPercentage;

                            return (
                                <div key={stage.percentage} className="flex flex-col items-center">
                                    {/* Bolinha */}
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10
                                        ${isCompleted
                                            ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-200'
                                            : 'bg-slate-200'
                                        }
                                        ${isCurrent ? 'ring-4 ring-green-200 scale-110' : ''}
                                    `}>
                                        {isCompleted ? (
                                            <CheckCircle className="text-white" size={20} />
                                        ) : (
                                            <Circle className="text-slate-400" size={20} />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="mt-3 text-center">
                                        <p className={`text-xs font-semibold ${isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                                            {stage.percentage}%
                                        </p>
                                        <p className={`text-xs mt-1 max-w-[80px] ${isCompleted ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                            {stage.shortLabel}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile View - Vertical */}
            <div className="md:hidden space-y-3">
                {STAGES.map((stage, index) => {
                    const isCompleted = stage.percentage <= currentPercentage;
                    const isCurrent = stage.percentage === currentPercentage;
                    const isLast = index === STAGES.length - 1;

                    return (
                        <div key={stage.percentage} className="relative">
                            <div className="flex items-center gap-3">
                                {/* Bolinha */}
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                                    ${isCompleted
                                        ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-md'
                                        : 'bg-slate-200'
                                    }
                                    ${isCurrent ? 'ring-4 ring-green-200' : ''}
                                `}>
                                    {isCompleted ? (
                                        <CheckCircle className="text-white" size={16} />
                                    ) : (
                                        <Circle className="text-slate-400" size={16} />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {stage.label}
                                        </p>
                                        <span className={`text-xs font-bold ${isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                                            {stage.percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Linha conectora vertical */}
                            {!isLast && (
                                <div className="ml-4 h-6 w-0.5 bg-slate-200 my-1">
                                    {isCompleted && (
                                        <div className="h-full w-full bg-green-500" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
