import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { Loader2, Lock, Mail, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isRegistering) {
        // FLUXO DE CADASTRO
        const { user, error: regError } = await authService.register(email, password, name);
        if (regError) {
          setError(regError);
        } else {
          setSuccessMsg("Conta criada com sucesso! Você já pode entrar.");
          setIsRegistering(false); // Volta para login
          // Se o Supabase estiver com "Confirm Email" desligado, poderíamos logar direto aqui.
          // Para garantir, mandamos o usuário logar.
        }
      } else {
        // FLUXO DE LOGIN
        const { user, error: authError } = await authService.loginWithPassword(email, password);
        if (authError) {
          setError(authError);
        } else if (user) {
          onLoginSuccess(user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Side - Visual / Branding */}
      <div className="hidden md:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10"></div>

        {/* Top Logo Left */}
        <div className="relative z-10">
          <img
            src="/logo-grupo-prime.png"
            alt="Grupo Prime"
            className="h-40 w-auto object-contain mb-8"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = document.getElementById('logo-fallback-login-left');
              if (fb) fb.style.display = 'block';
            }}
          />
          <div id="logo-fallback-login-left" style={{ display: 'none' }} className="mb-8">
            <h2 className="text-4xl font-extrabold text-white tracking-tighter">GRUPO <span className="text-amber-500">PRIME</span></h2>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Transformando sonhos em <span className="text-amber-500">realidade</span>.
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            Sistema exclusivo para gestão de financiamento habitacional Caixa.
            Segurança, agilidade e transparência em cada etapa do processo.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Grupo Prime. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:text-left">
            <img
              src="/logo-prime-horizontal.png"
              alt="Prime Correspondente Caixa"
              className="h-48 w-auto object-contain mb-6 mx-auto md:mx-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fb = document.getElementById('logo-fallback-login-right');
                if (fb) fb.style.display = 'block';
              }}
            />
            <div id="logo-fallback-login-right" style={{ display: 'none' }} className="mb-6">
              <h2 className="text-2xl font-bold text-amber-600 tracking-tight">PRIME CORRESPONDENTE</h2>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              {isRegistering ? 'Crie sua conta' : 'Acesse sua conta'}
            </h2>
            <p className="text-slate-500 mt-2">
              {isRegistering ? 'Preencha seus dados para acompanhar seu processo.' : 'Bem-vindo ao portal do cliente e parceiro.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r flex items-start gap-2">
              <div className="mt-0.5 font-bold">!</div>
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-r flex items-start gap-2">
              <div className="mt-0.5 font-bold">✓</div>
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {isRegistering && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-3 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all bg-slate-50 focus:bg-white"
                    placeholder="Seu nome"
                    required={isRegistering}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  placeholder="nome@exemplo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Senha</label>
                {!isRegistering && <a href="#" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Esqueceu a senha?</a>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-slate-900/20 hover:shadow-slate-900/40 transform active:scale-[0.99]"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : (isRegistering ? 'Criar Conta' : 'Entrar no Sistema')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="ml-2 text-amber-600 font-bold hover:text-amber-700 underline decoration-transparent hover:decoration-amber-600 transition-all"
              >
                {isRegistering ? 'Fazer Login' : 'Cadastre-se'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};