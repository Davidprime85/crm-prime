import { supabase } from '../lib/supabaseClient';

export const storageService = {
  /**
   * Uploads a document to Supabase Storage
   */
  uploadDocument: async (processId: string, documentId: string, file: File): Promise<{ url: string; error: string | null }> => {
    try {
      // Sanitize filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${processId}/${documentId}_${Date.now()}.${fileExt}`;
      
      // 1. Upload file to 'documents' bucket
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

      if (error) {
        console.error('Supabase Storage Error:', error);
        return { url: '', error: 'Erro ao salvar arquivo no servidor.' };
      }

      // 2. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
        
      return { url: publicUrlData.publicUrl, error: null };

    } catch (err: any) {
      console.error("Upload Exception:", err);
      return { url: '', error: err.message };
    }
  }
};