import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from './firebaseConfig';

const storage = getStorage(app);

export const storageService = {
  /**
   * Uploads a document to Firebase Storage
   */
  uploadDocument: async (processId: string, documentId: string, file: File): Promise<{ url: string; error: string | null }> => {
    try {
      // Sanitize filename
      const fileExt = file.name.split('.').pop();
      const fileName = `documents/${processId}/${documentId}_${Date.now()}.${fileExt}`;

      // 1. Create a storage reference
      const storageRef = ref(storage, fileName);

      // 2. Upload file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          processId,
          documentId,
          uploadedAt: new Date().toISOString()
        }
      });

      // 3. Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { url: downloadURL, error: null };

    } catch (err: any) {
      console.error("Upload Exception:", err);
      return { url: '', error: err.message || 'Erro ao salvar arquivo no servidor.' };
    }
  }
};