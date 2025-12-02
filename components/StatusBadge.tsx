import React from 'react';
import { ProcessStatus, getStageTitle, getStageColor } from '../types';

interface StatusBadgeProps {
  status: ProcessStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Mapeamento de cores para badges (mais vibrantes que as colunas)
  const badgeStyles: Record<ProcessStatus, string> = {
    credit_analysis: 'bg-blue-100 text-blue-800 border-blue-300',
    valuation: 'bg-purple-100 text-purple-800 border-purple-300',
    legal_analysis: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    itbi_emission: 'bg-amber-100 text-amber-800 border-amber-300',
    contract_signing: 'bg-green-100 text-green-800 border-green-300',
    registry_service: 'bg-teal-100 text-teal-800 border-teal-300',
    pending_client: 'bg-orange-100 text-orange-800 border-orange-300',
    pending_internal: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[status]}`}>
      {getStageTitle(status)}
    </span>
  );
};