import emailjs from 'emailjs-com';

// Configuração do EmailJS
// Substitua pelos seus IDs reais do painel do EmailJS
const SERVICE_ID = 'service_1rz80kw'; // Ex: service_gmail
const TEMPLATE_ID = 'template_327xuk7'; // Ex: template_welcome
const PUBLIC_KEY = 'r0O3IDBecU2g66-bu'; // Ex: user_123456

export const emailService = {
    sendWelcomeEmail: async (clientName: string, clientEmail: string, password?: string) => {
        try {
            const templateParams = {
                to_name: clientName,
                to_email: clientEmail,
                password: password || '123456', // Senha padrão ou gerada
                login_link: window.location.origin + '/login', // Link para login
                company_name: 'Prime Correspondente Caixa'
            };

            const response = await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                templateParams,
                PUBLIC_KEY
            );

            console.log('E-mail enviado com sucesso!', response.status, response.text);
            return true;
        } catch (error) {
            console.error('Erro ao enviar e-mail:', error);
            // Não vamos travar o sistema se o email falhar, apenas logar
            return false;
        }
    }
};
