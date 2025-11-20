import React from 'react';
import { ProcessStatus } from '../types';

interface StatusBadgeProps {
  status: ProcessStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<ProcessStatus, string> = {
    analysis: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    pending_docs: 'bg-amber-100 text-amber-800 border-amber-200',
    contract: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const labels: Record<ProcessStatus, string> = {
    analysis: 'Em Análise',
    approved: 'Aprovado',
    rejected: 'Reprovado',
    pending_docs: 'Pendência Doc.',
    contract: 'Contrato',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};