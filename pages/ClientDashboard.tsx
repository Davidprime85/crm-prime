import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentList } from '../components/DocumentList';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { ChatWidget } from '../components/ChatWidget';
import { FinancingSteps } from '../components/FinancingSteps';
import { FAQSection } from '../components/FAQSection';
import { CheckCircle2, Circle, MessageSquare, Loader2, MessageCircle } from 'lucide-react';
import { Process, ProcessDocument } from '../types';
import { firestoreService } from '../services/firestoreService';
import { authService } from '../services/authService';

export const ClientDashboard: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        // Passamos user.email para garantir que encontre processos criados pelo Admin usando apenas o email
        const data = await firestoreService.getProcesses('client', user.id, user.email);
        setProcesses(data);
        if (data.length > 0) setSelectedProcessId(data[0].id);
      }
      setLoading(false);
    };
    load();
  }, []);

  const selectedProcess = processes.find(p => p.id === selectedProcessId);

  const handleDocumentUpdate = async (docId: string, newStatus: 'uploaded' | 'approved' | 'rejected', url?: string, feedback?: string) => {
    if (!selectedProcessId) return;
    const finalUrl = url || '';

    // Optimistic
    setProcesses(prev => prev.map(proc => {
      if (proc.id === selectedProcessId) {
        return {
          ...proc,
          documents: proc.documents.map(doc => doc.id === docId ? { ...doc, status: newStatus, url: finalUrl, uploaded_at: new Date().toISOString(), feedback } : doc)
        };
      }
      return proc;
    }));

    await firestoreService.updateDocument(selectedProcessId, docId, { status: newStatus, url: finalUrl, uploaded_at: new Date().toISOString(), feedback });
  };

  const handleAddDocument = async (docName: string) => {
    if (!selectedProcessId) return;
    await firestoreService.addDocument(selectedProcessId, docName);
    // reload
    if (currentUser) {
      const data = await firestoreService.getProcesses('client', currentUser.id, currentUser.email);
      setProcesses(data);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (processes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
          <p className="text-lg font-medium mb-2">Nenhum processo encontrado.</p>
          <p className="text-sm max-w-md mx-auto mb-6">
            Se você já contratou o serviço, confirme se o e-mail cadastrado com o atendente é o mesmo que você utilizou para entrar aqui ({currentUser?.email}).
          </p>
          <p className="text-xs text-slate-400">Fale com seu atendente pelo WhatsApp para vincular seu cadastro.</p>
        </div>
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Olá, {currentUser?.name || 'Cliente'}!</h1>
          <p className="text-slate-300">Acompanhe o progresso do seu sonho da casa própria.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-amber-500/20 to-transparent"></div>
      </div>

      {/* Financing Steps Banner */}
      <FinancingSteps />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Process Details */}
        <div className="lg:col-span-2 space-y-8">
          {selectedProcess ? (
            <>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Processo #{selectedProcess.id}</h2>
                    <p className="text-slate-500">{selectedProcess.type}</p>
                  </div>
                  <StatusBadge status={selectedProcess.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase mb-1">Valor do Imóvel</p>
                    <p className="font-bold text-lg">R$ {selectedProcess.value.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase mb-1">Data de Início</p>
                    <p className="font-bold text-lg">{new Date(selectedProcess.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 mb-4">Seus Documentos</h3>
                <DocumentList
                  processId={selectedProcess.id}
                  documents={selectedProcess.documents}
                  userRole="client"
                  onDocumentUpdate={handleDocumentUpdate}
                  onAddDocument={handleAddDocument}
                />
              </div>

              {/* FAQ Section */}
              <FAQSection />
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
              <p className="text-slate-500">Selecione um processo para ver os detalhes.</p>
            </div>
          )}
        </div>

        {/* Right Column: Chat & Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageCircle size={20} className="text-amber-500" /> Fale com seu Consultor
            </h3>
            {selectedProcess && (
              <ChatWidget
                processId={selectedProcess.id}
                currentUser={currentUser}
                recipientName="Consultor Prime"
              />
            )}
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <h3 className="font-bold text-green-900 mb-2">Precisa de ajuda urgente?</h3>
            <p className="text-sm text-green-700 mb-4">Fale diretamente conosco pelo WhatsApp.</p>
            <WhatsAppButton />
          </div>
        </div>
      </div>
    </div>
  );
};