// Firebase Configuration
// Configuração do projeto: crm-prime-habitacao-af481

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços - CONEXÃO PADRÃO (Database ID: default)
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export app para uso em outros serviços se necessário
export default app;
