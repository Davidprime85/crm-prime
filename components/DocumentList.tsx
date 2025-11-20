import React, { useState, useRef } from 'react';
import { ProcessDocument, UserRole } from '../types';
import { FileText, Upload, Check, X, Eye, Loader2, AlertCircle, ThumbsUp, ThumbsDown, Send, Plus } from 'lucide-react';
import { storageService } from '../services/storageService';

interface DocumentListProps {
  processId: string;
  documents: ProcessDocument[];
  userRole: UserRole;
  onDocumentUpdate: (docId: string, newStatus: 'uploaded' | 'approved' | 'rejected', url?: string, feedback?: string) => void;
  onAddDocument?: (docName: string) => void; // New prop for adding docs
}

export const DocumentList: React.FC<DocumentListProps> = ({ processId, documents, userRole, onDocumentUpdate, onAddDocument }) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  
  // State for adding new document
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  const isStaff = userRole === 'admin' || userRole === 'attendant';

  const handleFileSelect = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(docId);

    try {
      // Call the real storage service
      const { url, error } = await storageService.uploadDocument(processId, docId, file);
      
      if (error) {
        alert(error);
      } else {
        onDocumentUpdate(docId, 'uploaded', url);
      }
    } catch (err) {
      alert('Erro ao enviar documento.');
    } finally {
      setUploadingId(null);
      if (fileInputRefs.current[docId]) {
        fileInputRefs.current[docId]!.value = '';
      }
    }
  };

  const handleApprove = (doc: ProcessDocument) => {
    if (window.confirm(`Confirmar aprovação do documento "${doc.name}"?`)) {
      onDocumentUpdate(doc.id, 'approved', doc.url);
    }
  };

  const handleReject = (docId: string) => {
    if (!feedbackText.trim()) {
      alert("Por favor, informe o motivo da recusa.");
      return;
    }
    onDocumentUpdate(docId, 'rejected', undefined, feedbackText);
    setRejectingId(null);
    setFeedbackText('');
  };

  const handleAddNewDoc = () => {
    if (newDocName.trim() && onAddDocument) {
        onAddDocument(newDocName);
        setNewDocName('');
        setIsAddingDoc(false);
    }
  };

  const triggerFileInput = (docId: string) => {
    fileInputRefs.current[docId]?.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return <Loader2 size={16} className="text-blue-600 animate-spin-slow" />; // Or clock
      case 'approved': return <Check size={16} className="text-green-600" />;
      case 'rejected': return <X size={16} className="text-red-600" />;
      default: return <FileText size={16} className="text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded': return 'Em análise';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Recusado';
      default: return 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'approved': return 'bg-green-50 border-green-100 text-green-700';
      case 'rejected': return 'bg-red-50 border-red-100 text-red-700';
      default: return 'bg-slate-50 border-slate-100 text-slate-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="text-lg font-bold text-slate-900">Documentação</h3>
            <p className="text-sm text-slate-500">Gerenciamento de arquivos do processo.</p>
        </div>
        {isStaff && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">Modo Gestor</span>
        )}
      </div>

      <div className="space-y-4">
        {documents.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">Nenhum documento solicitado ainda.</p>}
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className={`p-4 rounded-lg border transition-all ${getStatusColor(doc.status)}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Document Info */}
                <div className="flex items-start gap-3 flex-1">
                <div className={`mt-1 p-2 rounded-full bg-white bg-opacity-60`}>
                    {getStatusIcon(doc.status)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{doc.name}</h4>
                        {doc.is_extra && <span className="text-[10px] bg-white px-1.5 rounded border border-slate-200 text-slate-500">Extra</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs opacity-80 font-medium uppercase tracking-wide">{getStatusText(doc.status)}</span>
                        {doc.uploaded_at && <span className="text-xs opacity-60">• {new Date(doc.uploaded_at).toLocaleDateString()}</span>}
                        {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs underline hover:text-opacity-80 ml-2 flex items-center gap-1">
                                <Eye size={10} /> Visualizar
                            </a>
                        )}
                    </div>
                    
                    {/* Rejection Reason Display */}
                    {doc.status === 'rejected' && doc.feedback && (
                    <div className="flex items-start gap-1 mt-2 text-xs bg-white bg-opacity-50 p-2 rounded text-red-800 border border-red-100">
                        <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                        <span><strong>Motivo:</strong> {doc.feedback}</span>
                    </div>
                    )}

                    {/* Rejection Input Area for Staff */}
                    {rejectingId === doc.id && (
                        <div className="mt-3 bg-white p-3 rounded shadow-sm border border-red-100 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-700 mb-1 block">Motivo da Recusa:</label>
                            <textarea 
                                className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-red-500 outline-none text-slate-800"
                                rows={2}
                                placeholder="Ex: Documento ilegível, data expirada..."
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button 
                                    onClick={() => setRejectingId(null)}
                                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={() => handleReject(doc.id)}
                                    className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1"
                                >
                                    <Send size={10} /> Enviar Recusa
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                <input 
                    type="file" 
                    className="hidden" 
                    ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                    onChange={(e) => handleFileSelect(doc.id, e)}
                    accept="image/jpeg,image/png,application/pdf"
                />

                {/* Staff Actions: Approve / Reject */}
                {isStaff && doc.status === 'uploaded' && !rejectingId && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setRejectingId(doc.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-50 transition-colors"
                        >
                            <ThumbsDown size={14} /> Recusar
                        </button>
                        <button 
                            onClick={() => handleApprove(doc)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 shadow-sm transition-colors"
                        >
                            <ThumbsUp size={14} /> Aprovar
                        </button>
                    </div>
                )}

                {/* Upload Action: For Client OR Staff (Staff can attach on behalf) */}
                {(doc.status === 'pending' || doc.status === 'rejected') && (
                    <button 
                    onClick={() => triggerFileInput(doc.id)}
                    disabled={uploadingId === doc.id}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                    {uploadingId === doc.id ? (
                        <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                        </>
                    ) : (
                        <>
                        <Upload size={16} />
                        {doc.status === 'rejected' ? 'Reenviar' : (isStaff ? 'Anexar' : 'Enviar')}
                        </>
                    )}
                    </button>
                )}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Other Document Section */}
      {onAddDocument && (
        <div className="mt-4 pt-4 border-t border-slate-100">
            {!isAddingDoc ? (
                <button 
                    onClick={() => setIsAddingDoc(true)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                    <Plus size={16} /> Adicionar Outro Documento
                </button>
            ) : (
                <div className="flex items-end gap-2 bg-slate-50 p-3 rounded-lg animate-in fade-in">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Nome do Documento</label>
                        <input 
                            type="text" 
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            placeholder="Ex: Carta de Aluguel..."
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddingDoc(false)}
                        className="px-3 py-2 text-slate-500 hover:text-slate-800 text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleAddNewDoc}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded hover:bg-slate-800"
                    >
                        Adicionar
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};