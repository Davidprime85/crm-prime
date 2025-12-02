import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentList } from '../components/DocumentList';
import { ChatWidget } from '../components/ChatWidget';
import { KanbanBoard } from '../components/KanbanBoard';

import { StageInputModal } from '../components/StageInputModal';
import { NotificationSelector } from '../components/NotificationSelector';
import { notificationService } from '../services/notificationService';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import { emailService } from '../services/emailService';
import {
    BarChart as BarChartIcon, Users, FileText, AlertCircle, CheckCircle, Search, Filter,
    Plus, Printer, ArrowLeft, Save, Trash2, Briefcase, Settings as SettingsIcon, UserPlus, Loader2, Upload, ScanLine, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Process, CustomField, ProcessDocument, KPIMetrics, ProcessStatus } from '../types';
import { useLocation } from 'react-router-dom';

type AdminTab = 'dashboard' | 'processes' | 'new_client' | 'settings';

interface AdminDashboardProps {
    initialTab?: AdminTab;
}

interface Participant {
    name: string;
    cpf: string;
    income: string;
    role: 'Conjuge' | 'Composicao' | 'Outro';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'dashboard' }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
    const [metrics, setMetrics] = useState<KPIMetrics>({
        total: 0,
        credit_analysis: 0,
        valuation: 0,
        legal_analysis: 0,
        itbi_emission: 0,
        contract_signing: 0,
        pending: 0,
        monthly_volume: []
    });
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // New Client Form State
    const [newClient, setNewClient] = useState({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        value: '',
        type: 'Minha Casa Minha Vida'
    });
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
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

    // Settings State
    const [inviteEmail, setInviteEmail] = useState('');

    // Initial Data Load
    useEffect(() => {
        loadData();

        // Check for tab in URL
        if (location.state && (location.state as any).tab) {
            setActiveTab((location.state as any).tab);
        }
    }, [location]);

    const loadData = async () => {
        setLoading(true);
        try {
            const procs = await dataService.getProcesses('admin', '1');
            setProcesses(procs);
            const mets = await dataService.getMetrics();
            setMetrics(mets);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- Logic for Process Management ---
    const handleDocumentUpdate = async (docId: string, newStatus: 'uploaded' | 'approved' | 'rejected', url?: string, feedback?: string) => {
        if (!selectedProcessId) return;

        // Optimistic Update
        const updatedProcesses = processes.map(proc => {
            if (proc.id === selectedProcessId) {
                return {
                    ...proc,
                    documents: proc.documents.map(doc => doc.id === docId ? { ...doc, status: newStatus, url: url || doc.url, feedback } : doc)
                };
            }
            return proc;
        });
        setProcesses(updatedProcesses);

        try {
            await dataService.updateDocument(docId, { status: newStatus, feedback });
            if (url) {
                // In a real app, we would upload the file here or just save the URL
            }

            // Check for auto-approval
            const currentProc = updatedProcesses.find(p => p.id === selectedProcessId);
            if (currentProc) {
                const allApproved = currentProc.documents.every(d => d.status === 'approved');
                // Auto-approve process if all documents are approved
                if (allApproved && currentProc.status === 'credit_analysis') {
                    await dataService.updateProcessStatus(selectedProcessId, 'valuation');
                    loadData(); // Refresh to show new status
                }
            }
        } catch (err) {
            alert('Erro ao atualizar documento no banco de dados.');
            loadData(); // Revert on error
        }
    };

    const handleAddDocument = async (docName: string) => {
        if (!selectedProcessId) return;
        try {
            await dataService.addDocument(selectedProcessId, docName);
            loadData();
        } catch (e) {
            alert("Erro ao adicionar documento.");
        }
    };

    // --- Logic for New Client ---
    const handleAddField = () => {
        setCustomFields([...customFields, { label: '', value: '' }]);
    };

    const handleFieldChange = (index: number, field: 'label' | 'value', text: string) => {
        const newFields = [...customFields];
        newFields[index][field] = text;
        setCustomFields(newFields);
    };

    const handleRemoveField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleAddParticipant = () => {
        setParticipants([...participants, { name: '', cpf: '', income: '', role: 'Conjuge' }]);
    };

    const handleParticipantChange = (index: number, field: keyof Participant, value: string) => {
        const newParts = [...participants];
        newParts[index] = { ...newParts[index], [field]: value };
        setParticipants(newParts);
    };

    const handleRemoveParticipant = (index: number) => {
        setParticipants(participants.filter((_, i) => i !== index));
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            // 1. Create Auth User (via API/Supabase Auth)
            // Note: In a real app with Supabase, we'd use a server function to create the user
            // without logging out the admin. For this demo, we simulate success or use a specific endpoint.
            // Assuming authService.register handles this or we just create DB record first.

            const { user, error } = await authService.register(newClient.email, '123456', newClient.name);

            if (error) throw error;

            if (user) {
                // 2. Create Process
                const processData: Partial<Process> = {
                    client_name: newClient.name,
                    client_id: user.id,
                    client_email: newClient.email,
                    client_cpf: newClient.cpf,
                    type: newClient.type,
                    value: parseFloat(newClient.value) || 0,
                    status: 'credit_analysis', // Start at 20%
                    extra_fields: [
                        ...customFields,
                        { label: 'Telefone', value: newClient.phone },
                        ...participants.map((p, i) => ({ label: `Participante ${i + 1} (${p.role})`, value: `${p.name} - CPF: ${p.cpf}` }))
                    ]
                };

                await dataService.createProcess(processData);

                // 3. Send Welcome Email
                await emailService.sendWelcomeEmail(newClient.email, newClient.name);

                alert('Cliente cadastrado com sucesso! E-mail de boas-vindas enviado.');
                setActiveTab('processes');
                loadData();

                // Reset form
                setNewClient({ name: '', cpf: '', email: '', phone: '', value: '', type: 'Minha Casa Minha Vida' });
                setCustomFields([]);
                setParticipants([]);
            }

        } catch (err: any) {
            console.error(err);
            alert('Erro ao cadastrar cliente: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setCreating(false);
        }
    };

    const handleInviteAttendant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dataService.addAttendantEmail(inviteEmail);
            alert(`Email ${inviteEmail} autorizado! Peça para o atendente criar uma conta no site.`);
            setInviteEmail('');
        } catch (e) {
            alert('Erro ao autorizar email (talvez já esteja autorizado).');
        }
    };

    // --- Render Functions ---

    const renderOverview = () => {
        // Calculate Sums (Simplified for new statuses)
        const totalValue = processes.reduce((acc, p) => acc + p.value, 0);
        const activeProcesses = processes.filter(p => p.status !== 'contract_signing').length;

        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total de Processos"
                        value={processes.length.toString()}
                        icon={Briefcase}
                        trend="+12% este mês"
                    />
                    <StatCard
                        title="Volume em Carteira"
                        value={`R$ ${(totalValue / 1000000).toFixed(1)}M`}
                        icon={BarChartIcon}
                        trend="VGV Total"
                    />
                    <StatCard
                        title="Processos Ativos"
                        value={activeProcesses.toString()}
                        icon={Activity}
                        trend="Em andamento"
                    />
                    <StatCard
                        title="Taxa de Conversão"
                        value="68%"
                        icon={CheckCircle}
                        trend="Últimos 30 dias"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Volume de Vendas (Últimos 6 meses)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.monthly_volume}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderProcesses = () => {
        if (selectedProcessId) {
            const selectedProcess = processes.find(p => p.id === selectedProcessId);
            if (!selectedProcess) return <div>Processo não encontrado</div>;

            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between print:hidden">
                        <button onClick={() => setSelectedProcessId(null)} className="flex items-center text-slate-500 hover:text-slate-800">
                            <ArrowLeft size={20} className="mr-1" /> Voltar
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
                            <Printer size={18} /> Imprimir Ficha
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">{selectedProcess.client_name}</h2>
                                        <p className="text-slate-500">{selectedProcess.type}</p>
                                    </div>
                                    <StatusBadge status={selectedProcess.status} />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">CPF</p>
                                        <p className="font-medium">{selectedProcess.client_cpf || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Email</p>
                                        <p className="font-medium">{selectedProcess.client_email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Valor do Imóvel</p>
                                        <p className="font-medium">R$ {selectedProcess.value.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Data de Entrada</p>
                                        <p className="font-medium">{new Date(selectedProcess.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {selectedProcess.extra_fields
                                        ?.filter(field => {
                                            const label = field.label.trim().toLowerCase();
                                            const value = field.value.trim();
                                            return !value.startsWith('[{');
                                        })
                                        .map((field, idx) => (
                                            <div key={idx}>
                                                <p className="text-xs text-slate-500 uppercase">{field.label}</p>
                                                <p className="font-medium">{field.value}</p>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className="print:hidden">
                                <DocumentList
                                    processId={selectedProcess.id}
                                    documents={selectedProcess.documents}
                                    userRole="admin"
                                    onDocumentUpdate={handleDocumentUpdate}
                                    onAddDocument={handleAddDocument}
                                />
                            </div>
                            <div className="hidden print:block mt-4">
                                <h3 className="font-bold text-slate-900 mb-2 border-b pb-1">Checklist de Documentos</h3>
                                <ul className="list-disc pl-5 text-sm">
                                    {selectedProcess.documents.map(d => (
                                        <li key={d.id} className="mb-1">
                                            <span className="font-medium">{d.name}</span>:
                                            <span className="ml-2 uppercase text-xs">{d.status === 'approved' ? 'OK' : d.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>



                        </div>

                        <div className="print:hidden">
                            <div className="bg-slate-50 p-4 rounded-lg mb-4">
                                <h3 className="font-bold text-slate-900 mb-2">Chat Interno</h3>
                                <p className="text-xs text-slate-500 mb-4">Comunicação direta com o cliente.</p>
                                <ChatWidget
                                    processId={selectedProcess.id}
                                    currentUser={{ id: '1', name: 'Admin', role: 'admin', email: 'admin@prime.com' }}
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

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Processos</h2>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                            <Filter size={20} /> Filtros
                        </button>
                    </div>
                </div>

                {/* Toggle View Mode */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-full text-sm font-bold ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                        Todos
                    </button>
                    {/* Add more filters if needed */}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-slate-400" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Kanban View is default now */}
                        <KanbanBoard
                            processes={processes}
                            onProcessMove={(id, status) => {
                                // Open modal to collect stage-specific data
                                setStageModal({
                                    isOpen: true,
                                    processId: id,
                                    targetStage: status
                                });
                            }}
                            onProcessSelect={setSelectedProcessId}
                        />
                    </>
                )}
            </div>
        );
    };

    // Handle stage transition with collected data
    const handleStageTransition = async (data: Record<string, string>) => {
        const { processId, targetStage } = stageModal;

        try {
            // Optimistic update
            const updated = processes.map(p =>
                p.id === processId ? { ...p, status: targetStage } : p
            );
            setProcesses(updated);

            // Save stage-specific data to extra_fields
            const process = processes.find(p => p.id === processId);
            if (process) {
                // Filter out empty values
                const validData = Object.entries(data).filter(([_, v]) => v !== '');

                const newExtraFields = [
                    ...(process.extra_fields || []),
                    ...validData.map(([label, value]) => ({ label, value }))
                ];

                // Update process with new status and data
                await dataService.updateProcessStatus(processId, targetStage, data);
            }

            // Close modal
            setStageModal({ isOpen: false, processId: '', targetStage: 'credit_analysis' });

            // Reload to get updated data
            loadData();

            // Auto-open notification modal after successful transition
            const updatedProcess = processes.find(p => p.id === processId);
            if (updatedProcess) {
                setNotificationModal({ isOpen: true, process: { ...updatedProcess, status: targetStage } });
            }
        } catch (e) {
            alert('Erro ao mover processo.');
            loadData(); // Revert
        }
    };

    // Handle notification sending
    const handleNotificationSend = async (channel: 'email' | 'sms' | 'chat', message: string) => {
        if (!notificationModal.process) return;

        try {
            // TODO: Implement actual email/SMS sending via backend
            console.log(`Sending ${channel} notification:`, message);

            // For now, just show success message
            alert(`Notificação enviada via ${channel.toUpperCase()}!`);

            // Close modal
            setNotificationModal({ isOpen: false, process: null });
        } catch (e) {
            alert('Erro ao enviar notificação.');
        }
    };

    const renderNewClient = () => (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Plus className="text-amber-500" /> Novo Cadastro
            </h3>

            <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2 border rounded-lg"
                            value={newClient.name}
                            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">CPF</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2 border rounded-lg"
                            value={newClient.cpf}
                            onChange={e => setNewClient({ ...newClient, cpf: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full p-2 border rounded-lg"
                            value={newClient.email}
                            onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Telefone (WhatsApp)</label>
                        <input
                            required
                            type="tel"
                            className="w-full p-2 border rounded-lg"
                            value={newClient.phone}
                            onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Valor do Imóvel (R$)</label>
                        <input
                            required
                            type="number"
                            className="w-full p-2 border rounded-lg"
                            value={newClient.value}
                            onChange={e => setNewClient({ ...newClient, value: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Financiamento</label>
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

                {/* Participants Section */}
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">Participantes / Cônjuge</h4>
                        <button type="button" onClick={handleAddParticipant} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <Plus size={16} /> Adicionar
                        </button>
                    </div>
                    <div className="space-y-3">
                        {participants.map((part, index) => (
                            <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                                    <input
                                        type="text" placeholder="Nome"
                                        className="text-xs p-2 border rounded"
                                        value={part.name}
                                        onChange={e => handleParticipantChange(index, 'name', e.target.value)}
                                    />
                                    <input
                                        type="text" placeholder="CPF"
                                        className="text-xs p-2 border rounded"
                                        value={part.cpf}
                                        onChange={e => handleParticipantChange(index, 'cpf', e.target.value)}
                                    />
                                    <input
                                        type="text" placeholder="Renda Mensal"
                                        className="text-xs p-2 border rounded"
                                        value={part.income}
                                        onChange={e => handleParticipantChange(index, 'income', e.target.value)}
                                    />
                                    <select
                                        className="text-xs p-2 border rounded"
                                        value={part.role}
                                        onChange={e => handleParticipantChange(index, 'role', e.target.value as any)}
                                    >
                                        <option>Conjuge</option>
                                        <option>Composicao</option>
                                        <option>Outro</option>
                                    </select>
                                </div>
                                <button type="button" onClick={() => handleRemoveParticipant(index)} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Fields Section */}
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">Campos Personalizados</h4>
                        <button type="button" onClick={handleAddField} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <Plus size={16} /> Adicionar Campo
                        </button>
                    </div>
                    <div className="space-y-2">
                        {customFields.map((field, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nome do Campo (ex: Data de Nascimento)"
                                    className="flex-1 p-2 border rounded-lg text-sm"
                                    value={field.label}
                                    onChange={e => handleFieldChange(index, 'label', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Valor"
                                    className="flex-1 p-2 border rounded-lg text-sm"
                                    value={field.value}
                                    onChange={e => handleFieldChange(index, 'value', e.target.value)}
                                />
                                <button type="button" onClick={() => handleRemoveField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <button
                        type="submit"
                        disabled={creating}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                    >
                        {creating ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Cadastrar Cliente
                    </button>
                </div>
            </form>
        </div>
    );

    const renderSettings = () => (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <UserPlus className="text-amber-500" /> Cadastro de Atendente
                </h3>
                <p className="text-sm text-slate-500 mb-4">Adicione o e-mail do atendente abaixo. Quando ele criar uma conta no site, receberá automaticamente o acesso de atendente.</p>

                <form onSubmit={handleInviteAttendant} className="flex gap-2">
                    <input
                        required
                        type="email"
                        placeholder="Email do novo atendente"
                        className="flex-1 p-2 border rounded-lg"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                    />
                    <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800">
                        Autorizar
                    </button>
                </form>
            </div>

            {/* Migration Tool */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <SettingsIcon className="text-slate-500" /> Ferramentas de Sistema
                </h3>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2">Migração de Dados Legados</h4>
                    <p className="text-sm text-blue-600 mb-4">
                        Use esta ferramenta para atualizar processos antigos para o novo fluxo de porcentagem (20% - 100%).
                        <br />
                        Analysis {'->'} Crédito (20%) | Approved {'->'} Avaliação (40%) | Contract {'->'} Contrato (100%)
                    </p>
                    <button
                        onClick={async () => {
                            if (confirm('Tem certeza? Isso atualizará os status dos processos antigos.')) {
                                const res = await dataService.migrateLegacyProcesses();
                                alert(res.message);
                                loadData();
                            }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                        Executar Migração
                    </button>
                </div>
            </div>
        </div >
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-8">
            {/* Top Navigation */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Bem-vindo ao CRM Prime Habitação</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('processes')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'processes' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Processos
                    </button>
                    <button
                        onClick={() => setActiveTab('new_client')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'new_client' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        + Novo Cliente
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Configurações
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' && renderOverview()}
            {activeTab === 'processes' && renderProcesses()}
            {activeTab === 'new_client' && renderNewClient()}
            {activeTab === 'settings' && renderSettings()}

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
        </div>
    );
};