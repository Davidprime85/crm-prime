import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentList } from '../components/DocumentList';
import { ChatWidget } from '../components/ChatWidget';
import { KanbanBoard } from '../components/KanbanBoard';
import { StageInputModal } from '../components/StageInputModal';
import { NotificationSelector } from '../components/NotificationSelector';
import notificationService from '../services/notificationService';
import { firestoreService } from '../services/firestoreService'; // Migrado para Firestore
import { authService } from '../services/authService';
import { emailService } from '../services/emailService';
import {
  Search, Filter, Loader2, LayoutGrid, List, Plus, X
} from 'lucide-react';
import { Process, ProcessStatus } from '../types';

export const AttendantDashboard: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');

  // New Client Modal State
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    value: '',
    type: 'Minha Casa Minha Vida'
  });
  const [creating, setCreating] = useState(false);

  // Stage Input Modal State
  const [stageModal, setStageModal] = useState<{
    isOpen: boolean;
    processId: string;
    targetStage: ProcessStatus;
  }>({
    isOpen: false,
    processId: '',
    targetStage: 'credit_analysis'
  });

  // Notification Selector State
  const [notificationModal, setNotificationModal] = useState<{
    isOpen: boolean;
    process: Process | null;
  }>({
    isOpen: false,
    process: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      const data = await firestoreService.getProcesses('attendant', user.id);
      setProcesses(data);
    }
    setLoading(false);
  };

  const selectedProcess = processes.find(p => p.id === selectedProcessId);

  const handleDocumentUpdate = async (docId: string, newStatus: 'uploaded' | 'approved' | 'rejected', url?: string, feedback?: string) => {
    if (!selectedProcessId) return;

    setProcesses(prev => prev.map(proc => {
      if (proc.id === selectedProcessId) {
        return {
          ...proc,
          documents: proc.documents.map(doc => doc.id === docId ? { ...doc, status: newStatus, url: url || doc.url, feedback } : doc)
        };
      }
      return proc;
    }));

    try {
      await firestoreService.updateDocument(selectedProcessId, docId, { status: newStatus, url, feedback });
    } catch (e) {
      alert('Erro ao salvar alteração.');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { user, error } = await authService.register(newClient.email, '123456', newClient.name);

      if (error) throw error;

      if (user) {
        const processData: Partial<Process> = {
          client_name: newClient.name,
          client_id: user.id,
          client_email: newClient.email,
          client_cpf: newClient.cpf,
          type: newClient.type,
          value: parseFloat(newClient.value) || 0,
          status: 'credit_analysis',
          extra_fields: [
            { label: 'Telefone', value: newClient.phone }
          ]
        };

        await firestoreService.createProcess(processData);
        await emailService.sendWelcomeEmail(newClient.email, newClient.name);

        alert('Cliente cadastrado com sucesso!');
        setIsNewClientModalOpen(false);
        loadData();

        setNewClient({ name: '', cpf: '', email: '', phone: '', value: '', type: 'Minha Casa Minha Vida' });
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao cadastrar cliente: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setCreating(false);
    }
  };

  const handleAddDocument = async (docName: string) => {
    if (!selectedProcessId) return;
    try {
      await firestoreService.addDocument(selectedProcessId, docName);
      loadData();
    } catch (e) {
      alert("Erro ao adicionar documento.");
    }
  };

  const handleStageTransition = async (data: Record<string, string>) => {
    const { processId, targetStage } = stageModal;

    try {
      const updated = processes.map(p =>
        p.id === processId ? { ...p, status: targetStage } : p
      );
      setProcesses(updated);

      const process = processes.find(p => p.id === processId);
      if (process) {
        await firestoreService.updateProcessStatus(processId, targetStage, data);
      }

      setStageModal({ isOpen: false, processId: '', targetStage: 'credit_analysis' });
      loadData();

      const updatedProcess = processes.find(p => p.id === processId);
      if (updatedProcess) {
        setNotificationModal({ isOpen: true, process: { ...updatedProcess, status: targetStage } });
      }
    } catch (e) {
      alert('Erro ao mover processo.');
      loadData();
    }
  };

  const handleNotificationSend = async (channel: 'email' | 'sms' | 'chat', message: string) => {
    if (!notificationModal.process) return;

    try {
      if (channel === 'chat') {
        await notificationService.saveChatMessage(
          notificationModal.process.id,
          message,
          'attendant',
          'attendant'
        );
        alert('Mensagem salva no chat do processo!');
      } else {
        console.log(`Sending ${channel} notification:`, message);
        alert(`Notificação enviada via ${channel.toUpperCase()}!`);
      }

      setNotificationModal({ isOpen: false, process: null });
    } catch (e) {
      alert('Erro ao enviar notificação.');
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  if (selectedProcess) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProcessId(null)}
          className="text-slate-500 hover:text-slate-800 mb-4"
        >
          ← Voltar para lista
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedProcess.client_name}</h2>
                  <p className="text-slate-500">{selectedProcess.type}</p>
                </div>
                <StatusBadge status={selectedProcess.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Valor do Imóvel</p>
                  <p className="font-medium">R$ {selectedProcess.value.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Data de Entrada</p>
                  <p className="font-medium">{new Date(selectedProcess.created_at).toLocaleDateString()}</p>
                </div>
                {selectedProcess.extra_fields
                  ?.filter(field => !['timeline_data', 'chat_history'].includes(field.label))
                  .map((field, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-slate-500 uppercase">{field.label}</p>
                      <p className="font-medium">{field.value}</p>
                    </div>
                  ))}
              </div>

              <DocumentList
                processId={selectedProcess.id}
                documents={selectedProcess.documents}
                userRole="attendant"
                onDocumentUpdate={handleDocumentUpdate}
                onAddDocument={handleAddDocument}
              />
            </div>
          </div>

          <div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-bold text-slate-900 mb-2">Chat Interno</h3>
              <p className="text-xs text-slate-500 mb-4">Comunicação direta com o cliente.</p>
              <ChatWidget
                processId={selectedProcess.id}
                currentUser={{ id: '2', name: 'Atendente', role: 'attendant', email: '' }}
                recipientName={selectedProcess.client_name}
              />

              {selectedProcess.client_email && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setNotificationModal({ isOpen: true, process: selectedProcess })}
                    className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
                  >
                    📧 Notificar Cliente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredProcesses = processes.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Meus Atendimentos</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter size={20} /> Filtros
          </button>
          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors shadow-lg"
          >
            <Plus size={20} /> Novo Cliente
          </button>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Grade (Kanban)"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Todos
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          processes={filteredProcesses}
          onProcessMove={(id, status) => {
            setStageModal({
              isOpen: true,
              processId: id,
              targetStage: status
            });
          }}
          onProcessSelect={setSelectedProcessId}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold">
                <th className="p-4">Cliente</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4">Atualizado em</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProcesses.map((process) => (
                <tr
                  key={process.id}
                  onClick={() => setSelectedProcessId(process.id)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="p-4 font-medium text-slate-900">{process.client_name}</td>
                  <td className="p-4 text-slate-600">{process.type}</td>
                  <td className="p-4 text-slate-600">R$ {process.value.toLocaleString()}</td>
                  <td className="p-4">
                    <StatusBadge status={process.status} />
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {new Date(process.updated_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-slate-400 group-hover:text-blue-600 transition-colors text-sm font-medium">
                      Ver Detalhes →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProcesses.length === 0 && (
            <div className="p-8 text-center text-slate-400 italic">
              Nenhum processo encontrado.
            </div>
          )}
        </div>
      )}

      {/* Stage Input Modal */}
      <StageInputModal
        isOpen={stageModal.isOpen}
        stage={stageModal.targetStage}
        onClose={() => setStageModal({ isOpen: false, processId: '', targetStage: 'credit_analysis' })}
        onSubmit={handleStageTransition}
      />

      {/* Notification Selector Modal */}
      {notificationModal.process && (
        <NotificationSelector
          process={notificationModal.process}
          onClose={() => setNotificationModal({ isOpen: false, process: null })}
          onSend={handleNotificationSend}
        />
      )}

      {/* New Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 flex items-center justify-between sticky top-0">
              <h3 className="text-xl font-bold text-white">Novo Cliente</h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={newClient.name}
                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">CPF *</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={newClient.cpf}
                    onChange={e => setNewClient({ ...newClient, cpf: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    className="w-full p-2 border rounded-lg"
                    value={newClient.email}
                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefone (WhatsApp) *</label>
                  <input
                    required
                    type="tel"
                    className="w-full p-2 border rounded-lg"
                    value={newClient.phone}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor do Imóvel (R$) *</label>
                  <input
                    required
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={newClient.value}
                    onChange={e => setNewClient({ ...newClient, value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Financiamento *</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={newClient.type}
                    onChange={e => setNewClient({ ...newClient, type: e.target.value })}
                  >
                    <option>Minha Casa Minha Vida</option>
                    <option>SBPE</option>
                    <option>Pró-Cotista</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-bold hover:from-amber-600 hover:to-amber-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {creating ? 'Cadastrando...' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};