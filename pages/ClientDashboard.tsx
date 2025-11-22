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
    if (currentUser) {
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
  <div>
    <h4 className={`font-bold ${state === 'current' ? 'text-amber-600' : state === 'completed' ? 'text-green-700' : 'text-slate-400'}`}>
      {step.title}
    </h4>
    <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
  </div>
                    </div >
                  );
                })}
              </div >
            </div >
          </div >
        )}
      </div >

  {/* Fixed Elements - Always Rendered */ }
  < WhatsAppButton />

  { selectedProcess && (
    <ChatWidget
      processId={selectedProcess.id}
      currentUser={currentUser}
      recipientName="Atendimento Prime"
    />
  )}
    </div >
  );
};