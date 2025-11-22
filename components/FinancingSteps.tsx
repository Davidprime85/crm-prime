import React from 'react';
import { CheckCircle, FileText, Home, PenTool, UserCheck, Building } from 'lucide-react';

export const FinancingSteps: React.FC = () => {
    const steps = [
        {
            icon: FileText,
            title: "1. Simulação",
            description: "O primeiro passo é realizar a simulação para entender as condições de financiamento, prazos e valores de parcelas adequados ao seu perfil."
        },
        {
            icon: UserCheck,
            title: "2. Análise de Crédito",
            description: "A Caixa avalia sua renda e capacidade de pagamento. Nesta etapa, é necessário o envio de toda a documentação pessoal e de renda solicitada."
        },
        {
            icon: Home,
            title: "3. Avaliação do Imóvel",
            description: "A engenharia da Caixa realiza a avaliação do imóvel para verificar suas condições de habitabilidade e determinar seu valor de mercado."
        },
        {
            icon: Building,
            title: "4. Análise Jurídica",
            description: "Análise detalhada da documentação do imóvel e dos vendedores pelo setor jurídico da Caixa, garantindo a segurança da operação."
        },
        {
            icon: PenTool,
            title: "5. Assinatura do Contrato",
            description: "Com tudo aprovado, é feita a entrevista (se necessário), emissão do ITBI e agendamento para assinatura do contrato na agência."
        },
        {
            icon: CheckCircle,
            title: "6. Registro e Pagamento",
            description: "O contrato assinado é enviado ao cartório para registro. Após o retorno, a Caixa libera o pagamento ao vendedor em 3 a 4 dias. Processo concluído!"
        }
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Etapas do Financiamento</h3>
            <div className="relative">
                {/* Line connecting steps (Desktop) */}
                <div className="hidden md:block absolute top-6 left-0 w-full h-1 bg-slate-100 -z-10"></div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center md:text-left md:items-start relative group">
                            <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center mb-4 group-hover:border-amber-500 transition-colors z-10">
                                <step.icon size={20} className="text-slate-500 group-hover:text-amber-600" />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-2">{step.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
