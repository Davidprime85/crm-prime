// Firebase Configuration
// Substitua os placeholders pelas suas credenciais do Firebase Console

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase
// IMPORTANTE: Preencha com suas credenciais do Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID" // Opcional
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export app para uso em outros serviços se necessário
export default app;
