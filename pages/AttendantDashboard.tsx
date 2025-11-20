import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Filter, Plus, Clock, ChevronLeft, Loader2 } from 'lucide-react';
import { ProcessStatus, Process } from '../types';
import { DocumentList } from '../components/DocumentList';
import { ChatWidget } from '../components/ChatWidget';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

export const AttendantDashboard: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProcessStatus | 'all'>('all');

  useEffect(() => {
    const load = async () => {
        const user = await authService.getCurrentUser();
        if(user) {
            const data = await dataService.getProcesses('attendant', user.id);
            setProcesses(data);
        }
        setLoading(false);
    };
    load();
  }, []);

  const selectedProcess = processes.find(p => p.id === selectedProcessId);

  const filteredProcesses = filterStatus === 'all' 
    ? processes 
    : processes.filter(p => p.status === filterStatus);

  // Handler for Document Updates
  const handleDocumentUpdate = async (docId: string, newStatus: 'uploaded' | 'approved' | 'rejected', url?: string, feedback?: string) => {
    if (!selectedProcessId) return;
    
    // Optimistic UI
    setProcesses(prev => prev.map(proc => {
        if (proc.id === selectedProcessId) {
            return {
                ...proc,
                documents: proc.documents.map(doc => doc.id === docId ? { ...doc, status: newStatus, url: url || doc.url, feedback } : doc)
            };
        }
        return proc;
    }));

    // Real Update
    try {
        await dataService.updateDocument(docId, { status: newStatus, url, feedback });
    } catch (e) {
        alert('Erro ao salvar alteração.');
    }
  };

  const handleAddDocument = async (docName: string) => {
    if (!selectedProcessId) return;
    try {
        await dataService.addDocument(selectedProcessId, docName);
        // Reload needed to get the new ID
        const user = await authService.getCurrentUser();
        if(user) {
            const data = await dataService.getProcesses('attendant', user.id);
            setProcesses(data);
        }
    } catch (e) {
        alert("Erro ao adicionar documento.");
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  if (selectedProcess) {
    return (
        <div className="space-y-6">
            <button 
                onClick={() => setSelectedProcessId(null)}
                className="flex items-center text-slate-500 hover:text-slate-800 mb-4"
            >
                <ChevronLeft size={20} /> Voltar para lista
            </button>

            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedProcess.client_name}</h2>
                    <p className="text-slate-500">Processo #{selectedProcess.id} • {selectedProcess.type}</p>
                </div>
                <StatusBadge status={selectedProcess.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <DocumentList 
                        processId={selectedProcess.id}
                        documents={selectedProcess.documents}
                        userRole="attendant"
                        onDocumentUpdate={handleDocumentUpdate}
                        onAddDocument={handleAddDocument}
                     />
                </div>
                <div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-4">Dados do Cliente</h3>
                        <div className="space-y-3 text-sm">
                             <div>
                                 <p className="text-slate-400 text-xs">Email</p>
                                 <p className="font-medium">{selectedProcess.client_email || '-'}</p>
                             </div>
                             <div>
                                 <p className="text-slate-400 text-xs">CPF</p>
                                 <p className="font-medium">{selectedProcess.client_cpf || '-'}</p>
                             </div>
                             <div>
                                 <p className="text-slate-400 text-xs">Valor Imóvel</p>
                                 <p className="font-medium">R$ {selectedProcess.value.toLocaleString()}</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <ChatWidget 
               processId={selectedProcess.id} 
               currentUser={{id: '2', name: 'Ana', role: 'attendant', email: ''}} 
               recipientName={selectedProcess.client_name}
            />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Meus Atendimentos</h2>
          <p className="text-slate-500">Gerencie os processos sob sua responsabilidade.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button 
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilterStatus('analysis')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterStatus === 'analysis' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200'}`}
        >
          Em Análise
        </button>
        <button 
          onClick={() => setFilterStatus('pending_docs')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterStatus === 'pending_docs' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-200'}`}
        >
          Pendências
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProcesses.map((process) => (
          <div 
            key={process.id} 
            onClick={() => setSelectedProcessId(process.id)}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                 <Clock size={20} />
              </div>
              <StatusBadge status={process.status} />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{process.client_name}</h3>
            <p className="text-sm text-slate-500 mb-4">{process.type}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Valor:</span>
                <span className="font-medium text-slate-700">R$ {process.value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">ID:</span>
                <span className="font-mono text-slate-700">{process.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Atualizado:</span>
                <span className="text-slate-700">{new Date(process.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
               <span className="text-xs font-medium text-slate-400">
                 Ver Detalhes
               </span>
               <span className="text-slate-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};