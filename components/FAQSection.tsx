import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
    link?: string;
}

export const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs: FAQItem[] = [
        {
            question: "Posso usar meu FGTS no financiamento?",
            answer: "Sim! O FGTS pode ser utilizado como entrada, para amortizar o saldo devedor (reduzindo o prazo ou o valor da parcela) ou para pagar parte das prestações (até 80% do valor da parcela por 12 meses). É necessário se enquadrar nas regras do SFH."
        },
        {
            question: "Como funciona a composição da prestação?",
            answer: "A prestação é composta pela parcela de amortização (que reduz a dívida), juros mensais e encargos acessórios, como taxas administrativas e seguros obrigatórios (Morte e Invalidez Permanente - MIP e Danos Físicos ao Imóvel - DFI)."
        },
        {
            question: "Posso antecipar pagamentos?",
            answer: "Com certeza. Você pode amortizar o saldo devedor a qualquer momento, escolhendo entre reduzir o valor das parcelas mensais ou diminuir o prazo total do financiamento. Isso pode ser feito pelo App Habitação Caixa."
        },
        {
            question: "O que acontece se eu atrasar uma parcela?",
            answer: "Após o vencimento, o pagamento pode ser feito em lotéricas ou correspondentes. Juros e multa serão cobrados. É importante manter em dia para evitar restrições e risco ao imóvel."
        },
        {
            question: "Qual o prazo máximo de financiamento?",
            answer: "O prazo máximo pode chegar a até 35 anos (420 meses), dependendo da modalidade de crédito e da idade do proponente (a soma da idade + prazo não pode exceder 80 anos e 6 meses)."
        },
        {
            question: "Saiba Mais",
            answer: "Para mais dúvidas, acesse o portal oficial da Caixa.",
            link: "https://www.caixa.gov.br/voce/habitacao/perguntas-frequentes-novos-financiamentos/Paginas/default.aspx"
        }
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <HelpCircle className="text-amber-500" /> Perguntas Frequentes
            </h3>
            <div className="space-y-2">
                {faqs.map((faq, index) => (
                    <div key={index} className="border border-slate-100 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                        >
                            <span className="font-medium text-slate-800">{faq.question}</span>
                            {openIndex === index ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                        </button>
                        {openIndex === index && (
                            <div className="p-4 bg-white text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                                {faq.answer}
                                {faq.link && (
                                    <a
                                        href={faq.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        Acessar Portal da Caixa →
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
