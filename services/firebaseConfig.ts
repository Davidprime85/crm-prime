// Firebase Configuration
// Configuração do projeto: crm-prime-habitacao-af481

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB4xfQznWEaMt2n_YapcWKigNObpjxVL6A",
    authDomain: "crm-prime-habitacao-af481.firebaseapp.com",
    projectId: "crm-prime-habitacao-af481",
    storageBucket: "crm-prime-habitacao-af481.firebasestorage.app",
    messagingSenderId: "785256680426",
    appId: "1:785256680426:web:b37836b60a7148dd884093"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços - CONEXÃO PADRÃO (Database ID: default)
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export app para uso em outros serviços se necessário
export default app;
