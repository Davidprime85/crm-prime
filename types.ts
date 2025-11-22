
export type UserRole = 'admin' | 'attendant' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
}

export type ProcessStatus = 'analysis' | 'approved' | 'rejected' | 'pending_docs' | 'contract';

export type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';

export interface ProcessDocument {
  id: string;
  name: string; // e.g., "RG e CPF", "Comprovante de Renda"
  status: DocumentStatus;
  url?: string;
  uploaded_at?: string;
  feedback?: string; // Reason for rejection
  is_extra?: boolean; // Flag for dynamically added documents
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  process_id: string;
  sender_id: string;
  sender_name: string;
  role: UserRole;
  content: string;
  timestamp: string;
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

export interface Process {
  id: string;
  client_name: string;
  client_id: string;
  client_email?: string;
  client_cpf?: string;
  type: string; // e.g., "Minha Casa Minha Vida"
  status: ProcessStatus;
  value: number;
  updated_at: string;
  created_at: string;
  attendant_id?: string;
  timeline: TimelineEvent[];
  documents: ProcessDocument[];
  messages?: ChatMessage[];
  extra_fields?: CustomField[]; // Fields added dynamically by Admin
  has_unread?: boolean; // New property for chat alerts
}

export interface KPIMetrics {
  total: number;
  analysis: number;
  approved: number;
  rejected: number;
  monthly_volume: { name: string; value: number }[];
}
