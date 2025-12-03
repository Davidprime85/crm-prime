
// ============================================
// FIRESTORE COMPATIBILITY NOTES
// ============================================
// Os tipos abaixo são compatíveis com Firestore.
// Timestamps: Firestore usa Timestamp objects, mas serializamos para strings ISO
// Arrays/Objects: Nativamente suportados no Firestore
// IDs: Gerados automaticamente pelo Firestore ou podem ser customizados

export type UserRole = 'admin' | 'attendant' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
}

// ============================================
// NOVO SISTEMA DE STATUS BASEADO EM PORCENTAGENS
// ============================================

/**
 * Status do processo baseado no fluxo de financiamento habitacional
 * Cada status representa uma etapa com porcentagem de conclusão
 */
export type ProcessStatus =
  | 'credit_analysis'      // 20% - Análise de Crédito
  | 'valuation'            // 40% - Avaliação/Vistoria
  | 'legal_analysis'       // 60% - Análise Jurídica
  | 'itbi_emission'        // 80% - Emissão ITBI
  | 'contract_signing'     // 100% - Assinatura de Contrato
  | 'registry_service'     // Extra - Registro/Despachante
  | 'pending_client'       // Pendência do Cliente
  | 'pending_internal';    // Pendência Interna (erro analista)

/**
 * Informações detalhadas de cada etapa do processo
 */
export interface ProcessStage {
  id: ProcessStatus;
  title: string;
  percentage: number;
  description: string;
  color: string;
  icon?: string;
}

/**
 * Mapeamento de status para porcentagens e informações
 */
export const PROCESS_STAGES: Record<ProcessStatus, ProcessStage> = {
  credit_analysis: {
    id: 'credit_analysis',
    title: '20% - Crédito',
    percentage: 20,
    description: 'Análise de crédito nos bancos',
    color: 'bg-blue-50 border-blue-200',
    icon: 'CreditCard'
  },
  valuation: {
    id: 'valuation',
    title: '40% - Avaliação',
    percentage: 40,
    description: 'Vistoria e laudo do imóvel',
    color: 'bg-purple-50 border-purple-200',
    icon: 'Home'
  },
  legal_analysis: {
    id: 'legal_analysis',
    title: '60% - Jurídico',
    percentage: 60,
    description: 'Análise jurídica e documentação',
    color: 'bg-indigo-50 border-indigo-200',
    icon: 'Scale'
  },
  itbi_emission: {
    id: 'itbi_emission',
    title: '80% - ITBI',
    percentage: 80,
    description: 'Emissão de documentos e impostos',
    color: 'bg-amber-50 border-amber-200',
    icon: 'FileText'
  },
  contract_signing: {
    id: 'contract_signing',
    title: '100% - Contrato',
    percentage: 100,
    description: 'Assinatura e conclusão',
    color: 'bg-green-50 border-green-200',
    icon: 'CheckCircle'
  },
  registry_service: {
    id: 'registry_service',
    title: 'Registro',
    percentage: 95,
    description: 'Registro em cartório',
    color: 'bg-teal-50 border-teal-200',
    icon: 'Stamp'
  },
  pending_client: {
    id: 'pending_client',
    title: 'Pendência Cliente',
    percentage: 0,
    description: 'Aguardando documentos do cliente',
    color: 'bg-orange-50 border-orange-200',
    icon: 'AlertCircle'
  },
  pending_internal: {
    id: 'pending_internal',
    title: 'Pendência Interna',
    percentage: 0,
    description: 'Erro interno - correção necessária',
    color: 'bg-red-50 border-red-200',
    icon: 'AlertTriangle'
  }
};

/**
 * Helper: Retorna a porcentagem de conclusão baseada no status
 */
export function getProgressPercentage(status: ProcessStatus): number {
  return PROCESS_STAGES[status]?.percentage || 0;
}

/**
 * Helper: Retorna informações completas da etapa
 */
export function getStageInfo(status: ProcessStatus): ProcessStage {
  return PROCESS_STAGES[status];
}

/**
 * Helper: Retorna o título formatado da etapa
 */
export function getStageTitle(status: ProcessStatus): string {
  return PROCESS_STAGES[status]?.title || status;
}

/**
 * Helper: Verifica se o status é uma pendência
 */
export function isPending(status: ProcessStatus): boolean {
  return status === 'pending_client' || status === 'pending_internal';
}

/**
 * Helper: Retorna a cor da etapa
 */
export function getStageColor(status: ProcessStatus): string {
  return PROCESS_STAGES[status]?.color || 'bg-slate-50 border-slate-200';
}

/**
 * Helper: Retorna lista de status ordenados por progresso
 */
export function getOrderedStages(): ProcessStage[] {
  return Object.values(PROCESS_STAGES)
    .filter(stage => !isPending(stage.id))
    .sort((a, b) => a.percentage - b.percentage);
}

// ============================================
// OUTROS TIPOS
// ============================================

export type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';

// Firestore: ProcessDocument será armazenado como array dentro do documento Process
export interface ProcessDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  url?: string;
  uploaded_at?: string; // ISO string - converter de/para Firestore Timestamp
  feedback?: string;
  is_extra?: boolean;
}


// Firestore: ChatMessage será armazenado em coleção separada /messages
export interface ChatMessage {
  id: string;
  process_id: string;
  sender_id: string;
  sender_name: string;
  role: UserRole;
  content: string;
  timestamp: string; // ISO string - converter de/para Firestore Timestamp
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface CustomField {
  label: string;
  value: string;
}

// Firestore: Process será armazenado em coleção /processes
// Subcoleções possíveis: /processes/{id}/documents, /processes/{id}/messages
export interface Process {
  id: string;
  client_name: string;
  client_id: string;
  client_email?: string;
  client_cpf?: string;
  type: string;
  status: ProcessStatus;
  value: number;
  updated_at: string; // ISO string - converter de/para Firestore Timestamp
  created_at: string; // ISO string - converter de/para Firestore Timestamp
  attendant_id?: string;

  documents: ProcessDocument[]; // Array nativo no Firestore
  messages?: ChatMessage[]; // Opcional - pode usar subcoleção
  extra_fields?: CustomField[]; // Array nativo no Firestore
  has_unread?: boolean;
  // Novos campos para sistema de porcentagens
  progress?: number; // Calculado automaticamente via getProgressPercentage
  auto_notifications_sent?: string[]; // IDs das notificações já enviadas
}

export interface KPIMetrics {
  total: number;
  credit_analysis: number;
  valuation: number;
  legal_analysis: number;
  itbi_emission: number;
  contract_signing: number;
  pending: number;
  monthly_volume: { name: string; value: number }[];
}
