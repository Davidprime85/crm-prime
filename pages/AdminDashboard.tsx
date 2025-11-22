import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentList } from '../components/DocumentList';
import { ChatWidget } from '../components/ChatWidget';
import { notificationService } from '../services/notificationService';
import { dataService } from '../services/dataService';
import {
    BarChart as BarChartIcon, Users, FileText, AlertCircle, CheckCircle, Search, Filter,
    Plus, Printer, ArrowLeft, Save, Trash2, Briefcase, Settings as SettingsIcon, UserPlus, Loader2, Upload, ScanLine
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Process, CustomField, ProcessDocument, KPIMetrics } from '../types';
import Tesseract from 'tesseract.js';
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
    const [metrics, setMetrics] = useState<KPIMetrics>({ total: 0, analysis: 0, approved: 0, rejected: 0, monthly_volume: [] });
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
    const [ocrLoading, setOcrLoading] = useState(false);

    // Initial Data Load
    useEffect(() => {
        loadData();

        // Check URL params for tab
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['dashboard', 'processes', 'new_client', 'settings'].includes(tab)) {
            setActiveTab(tab as AdminTab);
        }
    }, [location.search]);

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

    const selectedProcess = processes.find(p => p.id === selectedProcessId);

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

        // DB Update
        try {
            await dataService.updateDocument(docId, { status: newStatus, url, feedback, uploaded_at: newStatus === 'uploaded' ? new Date().toISOString() : undefined });

            // Check for auto-approval
            const currentProc = updatedProcesses.find(p => p.id === selectedProcessId);
            if (currentProc) {
                const allApproved = currentProc.documents.every(d => d.status === 'approved');
                if (allApproved && currentProc.status === 'analysis') {
                    await dataService.updateProcessStatus(selectedProcessId, 'approved');
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

    const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrLoading(true);
        try {
            const result = await Tesseract.recognize(file, 'por', {
                logger: m => console.log(m)
            });

            const text = result.data.text;
            console.log("OCR Result:", text);

            // Simple heuristics
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let foundName = '';
            let foundCPF = '';
            let foundDob = '';
            let foundRg = '';
            let foundOrg = '';
            let foundMothersName = '';
            let foundFathersName = '';
            let foundNaturalness = '';
            let foundDispatchDate = '';

            // CPF
            const cpfRegex = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/;
            const cpfMatch = text.match(cpfRegex);
            if (cpfMatch) foundCPF = cpfMatch[0];

            // Dates (DD/MM/YYYY)
            const dateRegex = /\d{2}\/\d{2}\/\d{4}/g;
            const dates = text.match(dateRegex);
            if (dates && dates.length > 0) {
                // Heuristic: First date usually DOB, second might be dispatch date
                foundDob = dates[0];
                if (dates.length > 1) foundDispatchDate = dates[dates.length - 1]; // Last date often dispatch
            }

            // Name (Uppercase, long, not keywords)
            // Strategy: Look for the longest uppercase line that isn't a known keyword
            const ignoreWords = ['REPÚBLICA', 'FEDERATIVA', 'BRASIL', 'IDENTIDADE', 'VALIDA', 'TERRITÓRIO', 'NACIONAL', 'MINISTÉRIO', 'CARTEIRA', 'HABILITAÇÃO', 'FILIAÇÃO', 'NOME', 'DATA', 'NASCIMENTO', 'NATURALIDADE', 'DOC.'];

            const potentialNames = lines.filter(l =>
                l.length > 10 &&
                l === l.toUpperCase() &&
                !/\d/.test(l) && // No numbers
                !ignoreWords.some(w => l.includes(w))
            );

            if (potentialNames.length > 0) {
                foundName = potentialNames[0]; // Best guess for own name

                // If we have more potential names, they might be parents
                // This is very loose, but better than nothing
                if (potentialNames.length > 1) foundMothersName = potentialNames[1];
                if (potentialNames.length > 2) foundFathersName = potentialNames[2];
            }

            // RG (Simple check for digits, maybe preceded by RG)
            const rgRegex = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9X]\b/;
            const rgMatch = text.match(rgRegex);
            if (rgMatch && rgMatch[0] !== foundCPF) foundRg = rgMatch[0];

            // Orgão Emissor (SSP, DETRAN)
            if (text.includes('SSP')) foundOrg = 'SSP';
            else if (text.includes('DETRAN')) foundOrg = 'DETRAN';
            else if (text.includes('S.S.P')) foundOrg = 'SSP';

            // Naturalness (Look for city/state pattern or keywords)
            // Hard to detect without a city database, but let's look for lines with "/" that aren't dates
            const naturalnessLine = lines.find(l => l.includes('/') && !/\d/.test(l) && l.length < 30);
            if (naturalnessLine) foundNaturalness = naturalnessLine;

            if (foundName || foundCPF) {
                setNewClient(prev => ({
                    ...prev,
                    name: foundName || prev.name,
                    cpf: foundCPF || prev.cpf
                }));

                // Add extra fields
                const newExtras = [...customFields];
                if (foundDob) newExtras.push({ label: 'Data de Nascimento', value: foundDob });
                if (foundRg) newExtras.push({ label: 'RG', value: foundRg });
                if (foundOrg) newExtras.push({ label: 'Órgão Emissor', value: foundOrg });
                if (foundDispatchDate) newExtras.push({ label: 'Data de Expedição', value: foundDispatchDate });
                if (foundMothersName) newExtras.push({ label: 'Nome da Mãe', value: foundMothersName });
                if (foundFathersName) newExtras.push({ label: 'Nome do Pai', value: foundFathersName });
                if (foundNaturalness) newExtras.push({ label: 'Naturalidade', value: foundNaturalness });

                setCustomFields(newExtras);

                alert('Dados lidos! Verifique Nome, CPF e os Campos Adicionais (Filiação, Naturalidade, etc).');
            } else {
                alert('Não foi possível identificar os dados automaticamente. Por favor, preencha manualmente.');
            }

        } catch (err) {
            console.error(err);
            alert('Erro ao processar imagem. Tente uma imagem mais clara.');
        } finally {
            setOcrLoading(false);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const newId = `PROC-${Math.floor(Math.random() * 10000)}`;

        // Add participants to extra fields for now, or a specific JSON field if DB supported
        const participantFields = participants.map((p, i) => ({
            label: `Participante ${i + 1} (${p.role})`,
            value: `${p.name} - CPF: ${p.cpf} - Renda: ${p.income}`
        }));

        const newProcess: Partial<Process> = {
            id: newId,
            client_name: newClient.name,
            client_email: newClient.email,
            client_cpf: newClient.cpf,
            type: newClient.type,
            value: parseFloat(newClient.value) || 0,
            documents: [
                { id: 'temp1', name: 'RG e CPF', status: 'pending' },
                { id: 'temp2', name: 'Comprovante de Renda', status: 'pending' },
                { id: 'temp3', name: 'Comprovante de Residência', status: 'pending' }
            ],
            extra_fields: [...customFields, ...participantFields]
        };

        const result = await dataService.createProcess(newProcess);

        if (result.success) {
            alert(`Cliente ${newClient.name} pré-cadastrado com sucesso!\n\nPeça para o cliente criar uma conta no site com o e-mail: ${newClient.email} para acessar o processo.`);
            setNewClient({ name: '', cpf: '', email: '', phone: '', value: '', type: 'Minha Casa Minha Vida' });
            setCustomFields([]);
            setParticipants([]);
            setActiveTab('processes');
            loadData();
        } else {
            alert(`Erro: ${result.error}`);
        }
        setCreating(false);
    };

    // --- Logic for Attendant Invitation ---
    const [inviteEmail, setInviteEmail] = useState('');
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

    // --- Views ---

    const renderOverview = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total de Processos" value={metrics.total} icon={FileText} color="slate" />
                <StatCard title="Em Análise" value={metrics.analysis} icon={AlertCircle} color="blue" />
                <StatCard title="Aprovados" value={metrics.approved} icon={CheckCircle} color="green" />
                <StatCard title="Reprovados" value={metrics.rejected} icon={AlertCircle} color="red" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Volume Mensal (Simulado)</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.monthly_volume}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderProcesses = () => {
        if (selectedProcess) {
            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between print:hidden">
                        <button onClick={() => setSelectedProcessId(null)} className="flex items-center text-slate-500 hover:text-slate-800">
                            <ArrowLeft size={20} className="mr-1" /> Voltar
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
                            <Printer size={18} /> Exportar Ficha
                        </button>
                    </div>

                    {/* PRINTABLE AREA START */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 print:shadow-none print:border-0 print:p-0 print:w-full">
                        <div className="hidden print:flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-amber-600">PRIME CORRESPONDENTE CAIXA</div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-xl font-bold uppercase text-slate-800">Ficha do Cliente</h1>
                                <p className="text-sm text-slate-500">Processo #{selectedProcess.id}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedProcess.client_name}</h2>
                                <p className="text-slate-500 print:text-slate-700">{selectedProcess.type}</p>
                            </div>
                            <div className="print:hidden">
                                <StatusBadge status={selectedProcess.status} />
                            </div>
                            <div className="hidden print:block px-4 py-1 border border-slate-800 text-slate-800 font-bold rounded uppercase text-sm">
                                {selectedProcess.status === 'approved' ? 'APROVADO' : selectedProcess.status}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-2">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 print:bg-white print:border-slate-300">
                                    <h3 className="font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">Dados da Operação</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Valor do Imóvel</p>
                                            <p className="font-mono font-bold text-lg">R$ {selectedProcess.value.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Data Cadastro</p>
                                            <p className="font-medium">{new Date(selectedProcess.created_at).toLocaleDateString()}</p>
                                        </div>
                                        {selectedProcess.client_cpf && (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase">CPF</p>
                                                <p className="font-medium">{selectedProcess.client_cpf}</p>
                                            </div>
                                        )}
                                        {selectedProcess.client_email && (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase">E-mail</p>
                                                <p className="font-medium">{selectedProcess.client_email}</p>
                                            </div>
                                        )}
                                        {selectedProcess.extra_fields?.map((field, idx) => (
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
                                </div>
                            </div>
                        </div>

                        <div className="hidden print:block mt-12 pt-8 border-t border-slate-300">
                            <div className="flex justify-between text-xs text-slate-500">
                                <p>Impresso em {new Date().toLocaleDateString()} por Sistema Prime CRM</p>
                                <p>Assinatura do Responsável: _________________________________</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Gestão de Processos</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setFilterStatus('all')} className={`px-3 py-1 rounded-lg text-sm ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Todos</button>
                        <button onClick={() => setFilterStatus('analysis')} className={`px-3 py-1 rounded-lg text-sm ${filterStatus === 'analysis' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Análise</button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /> Carregando processos...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {processes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum processo encontrado.</td>
                                    </tr>
                                )}
                                {processes.filter(p => filterStatus === 'all' || p.status === filterStatus).map((process) => (
                                    <tr key={process.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium">{process.client_name}</td>
                                        <td className="px-6 py-4 text-slate-500">{process.type}</td>
                                        <td className="px-6 py-4"><StatusBadge status={process.status} /></td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedProcessId(process.id)}
                                                className="text-amber-600 hover:text-amber-700 font-bold"
                                            >
                                                Gerenciar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderNewClient = () => (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Plus className="text-amber-500" /> Novo Cadastro
            </h3>

            {/* OCR Section */}
            <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <ScanLine size={18} /> Preenchimento Automático (OCR)
                </h4>
                <p className="text-sm text-blue-700 mb-4">
                    Anexe uma foto do documento (RG/CNH) para preencher automaticamente o Nome e CPF.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                    <label className="cursor-pointer bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
                        {ocrLoading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        {ocrLoading ? 'Lendo imagem...' : 'Carregar Arquivo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleOCR} disabled={ocrLoading} />
                    </label>

                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200">
                        {ocrLoading ? <Loader2 className="animate-spin" size={18} /> : <ScanLine size={18} />}
                        {ocrLoading ? 'Processando...' : 'Tirar Foto'}
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOCR} disabled={ocrLoading} />
                    </label>

                    {ocrLoading && <span className="text-xs text-blue-500 animate-pulse">Isso pode levar alguns segundos...</span>}
                </div>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                        <input required type="text" className="w-full p-2 border rounded"
                            value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">CPF</label>
                        <input required type="text" className="w-full p-2 border rounded" placeholder="000.000.000-00"
                            value={newClient.cpf} onChange={e => setNewClient({ ...newClient, cpf: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                        <input required type="email" className="w-full p-2 border rounded"
                            value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Valor do Imóvel</label>
                        <input required type="number" className="w-full p-2 border rounded"
                            value={newClient.value} onChange={e => setNewClient({ ...newClient, value: e.target.value })} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Financiamento</label>
                    <select className="w-full p-2 border rounded bg-white"
                        value={newClient.type} onChange={e => setNewClient({ ...newClient, type: e.target.value })}>
                        <option>Minha Casa Minha Vida</option>
                        <option>SBPE</option>
                        <option>Pró-Cotista</option>
                    </select>
                </div>

                {/* Participants Section */}
                <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-slate-700">Participantes / Composição de Renda</label>
                        <button type="button" onClick={handleAddParticipant} className="text-xs flex items-center gap-1 text-amber-600 font-bold hover:text-amber-700">
                            <Plus size={14} /> Adicionar Pessoa
                        </button>
                    </div>

                    {participants.length === 0 && <p className="text-xs text-slate-400 italic mb-4">Nenhum participante adicional.</p>}

                    <div className="space-y-3 mb-6">
                        {participants.map((part, index) => (
                            <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-500">Participante {index + 1}</span>
                                    <button type="button" onClick={() => handleRemoveParticipant(index)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
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
                                        className="text-xs p-2 border rounded bg-white"
                                        value={part.role}
                                        onChange={e => handleParticipantChange(index, 'role', e.target.value as any)}
                                    >
                                        <option value="Conjuge">Cônjuge</option>
                                        <option value="Composicao">Composição de Renda</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dynamic Fields Section */}
                <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-slate-700">Campos Adicionais</label>
                        <button type="button" onClick={handleAddField} className="text-xs flex items-center gap-1 text-amber-600 font-bold hover:text-amber-700">
                            <Plus size={14} /> Criar Campo
                        </button>
                    </div>

                    {customFields.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum campo extra adicionado.</p>}

                    <div className="space-y-3">
                        {customFields.map((field, index) => (
                            <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded">
                                <input
                                    type="text" placeholder="Nome do Campo (Ex: Nome da Mãe)"
                                    className="flex-1 text-xs p-2 border rounded"
                                    value={field.label}
                                    onChange={e => handleFieldChange(index, 'label', e.target.value)}
                                />
                                <input
                                    type="text" placeholder="Valor"
                                    className="flex-1 text-xs p-2 border rounded"
                                    value={field.value}
                                    onChange={e => handleFieldChange(index, 'value', e.target.value)}
                                />
                                <button type="button" onClick={() => handleRemoveField(index)} className="text-red-400 hover:text-red-600">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button disabled={creating} type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2">
                    {creating ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Cadastrar Cliente</>}
                </button>
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
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Top Navigation Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    {/* Header removed to avoid duplication with Layout */}
                </div>
                <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('processes')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'processes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Gestão de Processos
                    </button>
                    <button
                        onClick={() => setActiveTab('new_client')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'new_client' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
        </div>
    );
};