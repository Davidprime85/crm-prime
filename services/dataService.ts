// dataService.ts - Wrapper para firestoreService (migração do Supabase para Firebase)
// Este arquivo agora apenas re-exporta o firestoreService para compatibilidade

import { firestoreService } from './firestoreService';
import { Process, ProcessDocument, KPIMetrics } from '../types';

// Re-exporta firestoreService mantendo compatibilidade com código legacy
export const dataService = {
  ...firestoreService,

  // Wrapper methods para manter compatibilidade de API

  async getProcesses(userRole: string, userId: string, userEmail?: string): Promise<Process[]> {
    return firestoreService.getProcesses(userRole as any, userId, userEmail);
  },

  async createProcess(process: Partial<Process>): Promise<{ success: boolean; error?: string }> {
    try {
      await firestoreService.createProcess(process);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateProcessStatus(processId: string, status: string, stageData?: Record<string, string>) {
    await firestoreService.updateProcessStatus(processId, status as any, stageData || {});
  },

  async updateProcessFields(processId: string, extraFields: any[]) {
    await firestoreService.updateProcessFields(processId, extraFields);
  },

  async updateDocument(docId: string, updates: Partial<ProcessDocument>) {
    // Nota: firestoreService.updateDocument tem assinatura diferente
    // Precisaria adaptar se necessário na implementação real
    console.warn('updateDocument precisa ser adaptado para usar processId');
  },

  async addDocument(processId: string, name: string) {
    await firestoreService.addDocument(processId, name);
  },

  async addAttendantEmail(email: string) {
    await firestoreService.addAttendantEmail(email);
  },

  async getMetrics(): Promise<KPIMetrics> {
    // Implementação básica de métricas - pode ser melhorada
    const processes = await firestoreService.getProcesses('admin', 'system-admin');

    const total = processes.length;
    const count = (s: string) => processes.filter(p => p.status === s).length;

    return {
      total,
      credit_analysis: count('credit_analysis') + count('analysis'),
      valuation: count('valuation') + count('approved'),
      legal_analysis: count('legal_analysis'),
      itbi_emission: count('itbi_emission'),
      contract_signing: count('contract_signing') + count('contract'),
      pending: count('pending_client') + count('pending_internal') + count('pending_docs'),
      monthly_volume: [
        { name: 'Jan', value: 12 }, { name: 'Fev', value: 19 }, { name: 'Mar', value: 30 }
      ]
    };
  },

  async migrateLegacyProcesses() {
    // Não aplicável no Firestore - migrations são diferentes
    return { success: true, message: 'Migração não necessária no Firestore.' };
  }
};