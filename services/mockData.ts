import { Process, KPIMetrics, User } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', email: 'david@creditoprime.com.br', name: 'David Admin', role: 'admin' },
  { id: '2', email: 'attendant@prime.com', name: 'Ana Atendente', role: 'attendant' },
  { id: '3', email: 'client@prime.com', name: 'Carlos Cliente', role: 'client' },
];

export const MOCK_PROCESSES: Process[] = [
  {
    id: 'PROC-001',
    client_id: '3',
    client_name: 'Carlos Cliente',
    type: 'Minha Casa Minha Vida',
    status: 'credit_analysis',
    value: 180000,
    created_at: '2023-10-15T10:00:00Z',
    updated_at: '2023-10-20T14:30:00Z',
    attendant_id: '2',
    documents: [
      { id: 'doc1', name: 'RG e CPF', status: 'uploaded', url: 'mock_url', uploaded_at: '2023-10-15' },
      { id: 'doc2', name: 'Comprovante de Residência', status: 'uploaded', url: 'mock_url', uploaded_at: '2023-10-15' },
      { id: 'doc3', name: 'Comprovante de Renda (3 meses)', status: 'pending' },
      { id: 'doc4', name: 'Certidão de Estado Civil', status: 'pending' },
    ]
  },
  {
    id: 'PROC-002',
    client_id: '4',
    client_name: 'Maria Silva',
    type: 'SBPE',
    status: 'valuation',
    value: 350000,
    created_at: '2023-09-10T09:00:00Z',
    updated_at: '2023-09-25T11:00:00Z',
    attendant_id: '2',
    documents: [
      { id: 'doc1', name: 'RG e CPF', status: 'approved', url: 'mock_url', uploaded_at: '2023-09-10' },
      { id: 'doc2', name: 'Imposto de Renda', status: 'approved', url: 'mock_url', uploaded_at: '2023-09-11' },
    ]
  },
  {
    id: 'PROC-003',
    client_id: '5',
    client_name: 'João Souza',
    type: 'Pró-Cotista',
    status: 'legal_analysis',
    value: 220000,
    created_at: '2023-11-01T16:00:00Z',
    updated_at: '2023-11-02T09:00:00Z',
    attendant_id: '2',
    documents: [
      { id: 'doc1', name: 'RG e CPF', status: 'rejected', feedback: 'Documento ilegível, favor reenviar escaneado.', url: 'mock_url', uploaded_at: '2023-11-01' },
      { id: 'doc2', name: 'Carteira de Trabalho', status: 'pending' },
    ]
  },
  {
    id: 'PROC-004',
    client_id: '6',
    client_name: 'Fernanda Lima',
    type: 'MCMV',
    status: 'contract_signing',
    value: 150000,
    created_at: '2023-08-20T10:00:00Z',
    updated_at: '2023-08-22T15:00:00Z',
    attendant_id: '2',
    documents: []
  }
];

export const MOCK_METRICS: KPIMetrics = {
  total: 124,
  credit_analysis: 15,
  valuation: 25,
  legal_analysis: 20,
  itbi_emission: 12,
  contract_signing: 28,
  pending: 24,
  monthly_volume: [
    { name: 'Jan', value: 12 },
    { name: 'Fev', value: 19 },
    { name: 'Mar', value: 15 },
    { name: 'Abr', value: 22 },
    { name: 'Mai', value: 28 },
    { name: 'Jun', value: 24 },
  ]
};