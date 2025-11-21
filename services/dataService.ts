import { supabase } from '../lib/supabaseClient';
import { Process, ProcessDocument, KPIMetrics } from '../types';
import { notificationService } from './notificationService';

export const dataService = {

  // --- PROCESSES ---

  async getProcesses(userRole: string, userId: string, userEmail?: string): Promise<Process[]> {
    let query = supabase.from('processes').select(`
      *,
      process_documents (*)
    `);

    // Filtragem baseada na role
    if (userRole === 'client') {
      // Importante: Busca por ID (se já vinculado) OU pelo Email (se cadastrado previamente pelo Admin)
      if (userEmail) {
        // Usa ilike para garantir que email maiúsculo/minúsculo não atrapalhe
        query = query.or(`client_id.eq.${userId},client_email.ilike.${userEmail}`);
      } else {
        query = query.eq('client_id', userId);
      }
    }
    // Se for atendente ou admin, vê tudo (ou filtra por ID se implementado no futuro)

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching processes:', error);
      return [];
    }

    // Map DB structure to Typescript Interface
    return data.map((p: any) => ({
      id: p.id,
      client_id: p.client_id,
      client_name: p.client_name,
      client_email: p.client_email,
      client_cpf: p.client_cpf,
      attendant_id: p.attendant_id,
      type: p.type,
      status: p.status,
      value: p.value,
      created_at: p.created_at,
      updated_at: p.updated_at,
      extra_fields: p.extra_fields || [],
      timeline: [], // Timeline ainda não implementada no banco
      documents: p.process_documents ? p.process_documents.map((d: any) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        url: d.url,
        uploaded_at: d.uploaded_at,
        feedback: d.feedback,
        is_extra: d.is_extra
      })) : []
    }));
  },

  async createProcess(process: Partial<Process>): Promise<{ success: boolean; error?: string }> {
    // Segurança: Garante que client_id é tratado corretamente
    const clientId = (process.client_id && !process.client_id.startsWith('temp')) ? process.client_id : null;

    // 1. Insert Process
    const { data: procData, error: procError } = await supabase
      .from('processes')
      .insert({
        id: process.id,
        client_name: process.client_name,
        client_email: process.client_email,
        client_cpf: process.client_cpf,
        type: process.type,
        status: 'analysis',
        value: process.value,
        extra_fields: process.extra_fields,
        client_id: clientId
      })
      .select()
      .single();

    if (procError) return { success: false, error: procError.message };

    // 2. Insert Initial Documents
    if (process.documents && process.documents.length > 0) {
      const docsToInsert = process.documents.map(d => ({
        process_id: process.id,
        name: d.name,
        status: 'pending'
      }));

      const { error: docError } = await supabase
        .from('process_documents')
        .insert(docsToInsert);

      if (docError) console.error("Error creating docs:", docError);
    }

    return { success: true };
  },

  async updateProcessStatus(processId: string, status: string) {
    await supabase.from('processes').update({ status, updated_at: new Date() }).eq('id', processId);

    // Notify Client
    const { data: process } = await supabase.from('processes').select('client_id').eq('id', processId).single();
    if (process && process.client_id) {
      const statusMap: Record<string, string> = {
        'analysis': 'Em Análise',
        'pending_docs': 'Pendência de Documentos',
        'approved': 'Aprovado',
        'rejected': 'Reprovado',
        'contract': 'Contrato'
      };
      await notificationService.createNotification(
        process.client_id,
        'Atualização de Status',
        `Seu processo mudou para: ${statusMap[status] || status}`,
        status === 'rejected' ? 'error' : status === 'approved' ? 'success' : 'info'
      );
    }
  },

  async updateProcessFields(processId: string, extraFields: any[]) {
    const { error } = await supabase
      .from('processes')
      .update({ extra_fields: extraFields, updated_at: new Date() })
      .eq('id', processId);

    if (error) throw error;
  },

  // --- DOCUMENTS ---

  async updateDocument(docId: string, updates: Partial<ProcessDocument>) {
    const { error } = await supabase
      .from('process_documents')
      .update({
        status: updates.status,
        url: updates.url,
        feedback: updates.feedback,
        uploaded_at: updates.uploaded_at
      })
      .eq('id', docId);

    if (error) throw error;

    // Notify Client if rejected or approved
    if (updates.status === 'rejected' || updates.status === 'approved') {
      const { data: doc } = await supabase.from('process_documents').select('process_id, name').eq('id', docId).single();
      if (doc) {
        const { data: process } = await supabase.from('processes').select('client_id').eq('id', doc.process_id).single();
        if (process && process.client_id) {
          const title = updates.status === 'rejected' ? 'Documento Recusado' : 'Documento Aprovado';
          const msg = updates.status === 'rejected'
            ? `O documento "${doc.name}" foi recusado. Motivo: ${updates.feedback || 'Não informado'}`
            : `O documento "${doc.name}" foi aprovado.`;

          await notificationService.createNotification(
            process.client_id,
            title,
            msg,
            updates.status === 'rejected' ? 'error' : 'success'
          );
        }
      }
    }
  },

  async addDocument(processId: string, name: string) {
    const { error } = await supabase
      .from('process_documents')
      .insert({
        process_id: processId,
        name: name,
        status: 'pending',
        is_extra: true
      });
    if (error) throw error;
  },

  // --- METRICS ---

  async addAttendantEmail(email: string) {
    const { error } = await supabase
      .from('attendant_emails')
      .insert({ email });

    if (error) throw error;
  },

  async getMetrics(): Promise<KPIMetrics> {
    const { data } = await supabase.from('processes').select('status');

    if (!data) return { total: 0, analysis: 0, approved: 0, rejected: 0, monthly_volume: [] };

    const total = data.length;
    const analysis = data.filter(p => p.status === 'analysis').length;
    const approved = data.filter(p => p.status === 'approved').length;
    const rejected = data.filter(p => p.status === 'rejected').length;

    return {
      total, analysis, approved, rejected,
      monthly_volume: [
        // Mock simples para gráfico
        { name: 'Jan', value: 12 }, { name: 'Fev', value: 19 }, { name: 'Mar', value: 30 }
      ]
    };
  }
};