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

  // New Process Modal State
  const [isNewProcessModalOpen, setIsNewProcessModalOpen] = useState(false);
  const [newProcessData, setNewProcessData] = useState({
    client_name: '',
    client_email: '',
    client_cpf: '',
    value: '',
    type: 'Minha Casa Minha Vida'
  });

  // Extra Fields State
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
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
      if (user) {
        const data = await dataService.getProcesses('attendant', user.id);
        setProcesses(data);
      }
    } catch (e) {
      alert("Erro ao adicionar documento.");
    }
  };

  const handleCreateProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = Math.floor(Math.random() * 10000).toString(); // Temp ID gen
      await dataService.createProcess({
        id,
        client_name: newProcessData.client_name,
        client_email: newProcessData.client_email,
        client_cpf: newProcessData.client_cpf,
        value: parseFloat(newProcessData.value),
        type: newProcessData.type,
        client_id: 'temp_' + Date.now(), // Will be linked later or by email
        documents: [
          { id: 'doc1', name: 'RG e CPF', status: 'pending' },
          { id: 'doc2', name: 'Comprovante de Renda', status: 'pending' },
          { id: 'doc3', name: 'Comprovante de Residência', status: 'pending' }
        ]
      });

      setIsNewProcessModalOpen(false);
      setNewProcessData({ client_name: '', client_email: '', client_cpf: '', value: '', type: 'Minha Casa Minha Vida' });

      // Reload
      const user = await authService.getCurrentUser();
      if (user) {
        const data = await dataService.getProcesses('attendant', user.id);
        setProcesses(data);
      }
      alert('Processo criado com sucesso!');
    } catch (e) {
      alert('Erro ao criar processo.');
    }
  };

  const handleAddExtraField = async () => {
    if (!selectedProcessId || !selectedProcess) return;
    if (!newFieldName || !newFieldValue) return;

    const updatedFields = [...(selectedProcess.extra_fields || []), { label: newFieldName, value: newFieldValue }];

    // Optimistic
    setProcesses(prev => prev.map(p => p.id === selectedProcessId ? { ...p, extra_fields: updatedFields } : p));

    try {
      await dataService.updateProcessFields(selectedProcessId, updatedFields);
      setNewFieldName('');
      setNewFieldValue('');
      setIsAddingField(false);
    } catch (e) {
      alert('Erro ao adicionar campo.');
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

            {/* Extra Fields Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">Informações Adicionais</h3>
                {!isAddingField && (
                  <button onClick={() => setIsAddingField(true)} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                    <Plus size={12} /> Adicionar
                  </button>
                )}
              </div>

              <div className="space-y-3 text-sm">
                {selectedProcess.extra_fields?.map((field, idx) => (
                  <div key={idx}>
                    <p className="text-slate-400 text-xs">{field.label}</p>
                    <p className="font-medium">{field.value}</p>
                  </div>
                ))}
                {(!selectedProcess.extra_fields || selectedProcess.extra_fields.length === 0) && !isAddingField && (
                  <p className="text-slate-400 text-xs italic">Nenhuma informação extra.</p>
                )}
              </div>

              {isAddingField && (
                <div className="mt-4 bg-slate-50 p-3 rounded border border-slate-200 animate-in fade-in">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nome do Campo (ex: Profissão)"
                      className="w-full text-xs p-2 border rounded"
                      value={newFieldName}
                      onChange={e => setNewFieldName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Valor (ex: Autônomo)"
                      className="w-full text-xs p-2 border rounded"
                      value={newFieldValue}
                      onChange={e => setNewFieldValue(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setIsAddingField(false)} className="text-xs text-slate-500">Cancelar</button>
                      <button onClick={handleAddExtraField} className="text-xs bg-slate-900 text-white px-3 py-1 rounded">Salvar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <ChatWidget
          processId={selectedProcess.id}
          currentUser={{ id: '2', name: 'Ana', role: 'attendant', email: '' }}
          recipientName={selectedProcess.client_name}
        />
      </div >
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Meus Atendimentos</h2>
          <p className="text-slate-500">Gerencie os processos sob sua responsabilidade.</p>
        </div>

        {/* Desktop Button */}
        <button
          onClick={() => setIsNewProcessModalOpen(true)}
          className="hidden md:flex bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus size={20} /> Novo Atendimento
        </button>
      </div>

      {/* Mobile Floating Button */}
      <button
        onClick={() => setIsNewProcessModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-amber-500 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
      >
        <Plus size={24} />
      </button>

      {/* New Process Modal */}
      {isNewProcessModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Novo Atendimento</h3>
              <button onClick={() => setIsNewProcessModalOpen(false)} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="rotate-180" size={20} /></button>
            </div>
            <form onSubmit={handleCreateProcess} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={newProcessData.client_name} onChange={e => setNewProcessData({ ...newProcessData, client_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input required type="email" className="w-full border rounded-lg p-2" value={newProcessData.client_email} onChange={e => setNewProcessData({ ...newProcessData, client_email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={newProcessData.client_cpf} onChange={e => setNewProcessData({ ...newProcessData, client_cpf: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor Imóvel</label>
                  <input required type="number" className="w-full border rounded-lg p-2" value={newProcessData.value} onChange={e => setNewProcessData({ ...newProcessData, value: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Financiamento</label>
                <select className="w-full border rounded-lg p-2" value={newProcessData.type} onChange={e => setNewProcessData({ ...newProcessData, type: e.target.value })}>
                  <option>Minha Casa Minha Vida</option>
                  <option>SBPE</option>
                  <option>Pró-Cotista</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg mt-4">
                Criar Processo
              </button>
            </form>
          </div>
        </div>
      )}

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