import { Resend } from 'resend';

// Inicializa o Resend pegando a chave das variáveis de ambiente
// O 'process.env' funciona aqui porque isso roda no servidor do Vercel
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(request: Request) {
    // Apenas aceita método POST (envio de dados)
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        // Lê os dados enviados pelo seu site (Frontend)
        const { to, subject, html } = await request.json();

        // Manda o Resend enviar o e-mail de verdade
        const data = await resend.emails.send({
            from: 'Prime Habitação <nao-responda@creditoprime.com.br>', // Seu domínio!
            to: [to], // Para quem vai (array de emails)
            subject: subject,
            html: html,
        });

        // Devolve a resposta de sucesso para o site
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Erro ao enviar email' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}