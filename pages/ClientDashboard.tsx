import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentList } from '../components/DocumentList';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { ChatWidget } from '../components/ChatWidget';
import { CheckCircle2, Circle, MessageSquare, Loader2 } from 'lucide-react';
import { Process, ProcessDocument } from '../types';
import { dataService } from '../services/dataService';
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
              const data = await dataService.getProcesses('client', user.id, user.email);
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

    await dataService.updateDocument(docId, { status: newStatus, url: finalUrl, uploaded_at: new Date().toISOString(), feedback });
  };

  const handleAddDocument = async (docName: string) => {
    if (!selectedProcessId) return;
    await dataService.addDocument(selectedProcessId, docName);
    // reload
    if(currentUser) {
        const data = await dataService.getProcesses('client', currentUser.id, currentUser.email);
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
    <div className="relative min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Process List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Meus Processos</h2>
          <div className="space-y-4">
            {processes.map(process => (
              <div 
                key={process.id}
                onClick={() => setSelectedProcessId(process.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedProcessId === process.id 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${selectedProcessId === process.id ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                    {process.type}
                  </span>
                  {selectedProcessId !== process.id && <StatusBadge status={process.status} />}
                </div>
                <h3 className="font-bold text-lg mb-1">Imóvel Residencial</h3>
                <p className={`text-sm ${selectedProcessId === process.id ? 'text-slate-400' : 'text-slate-500'}`}>
                  ID: {process.id}
                </p>
              </div>
            ))}
          </div>
          
          <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl">
            <h4 className="font-bold text-amber-900 mb-2">Precisa de ajuda?</h4>
            <p className="text-sm text-amber-800 mb-4">Utilize o chat ao lado ou nosso WhatsApp.</p>
          </div>
        </div>

        {/* Right Column: Details, Timeline & Documents */}
        {selectedProcess && (
          <div className="lg:col-span-2 space-y-8">
            {/* Header Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Detalhes do Financiamento</h2>
                  <p className="text-slate-500">Atualizado em {new Date(selectedProcess.updated_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={selectedProcess.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-lg">
                   <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Valor Solicitado</span>
                   <span className="text-lg font-bold text-slate-900">R$ {selectedProcess.value.toLocaleString()}</span>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-lg">
                   <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Tipo</span>
                   <span className="text-lg font-bold text-slate-900">{selectedProcess.type}</span>
                 </div>
              </div>
            </div>

            {/* Documents Section */}
            <DocumentList 
              processId={selectedProcess.id} 
              documents={selectedProcess.documents || []} 
              userRole="client"
              onDocumentUpdate={handleDocumentUpdate}
              onAddDocument={handleAddDocument}
            />

            {/* Timeline - Hardcoded for now */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Linha do Tempo (Simulada)</h3>
              <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                  <div className="relative pl-6">
                    <div className="absolute -left-[21px] top-0 w-10 h-10 flex items-center justify-center rounded-full border-4 border-white bg-green-500 text-white">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Cadastro Inicial</h4>
                      <p className="text-sm text-slate-500 mt-1">Realizado</p>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed Elements - Always Rendered */}
      <WhatsAppButton />
      
      {selectedProcess && (
        <ChatWidget 
            processId={selectedProcess.id} 
            currentUser={currentUser}
            recipientName="Atendimento Prime"
        />
      )}
    </div>
  );
};