import React, { useState } from 'react';
import { Process, ProcessStatus, getOrderedStages, getProgressPercentage, isPending } from '../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, DollarSign, AlertCircle, AlertTriangle } from 'lucide-react';

interface KanbanBoardProps {
  processes: Process[];
  onProcessMove: (processId: string, newStatus: ProcessStatus) => void;
  onProcessSelect: (processId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ processes, onProcessMove, onProcessSelect }) => {
  const [draggedProcessId, setDraggedProcessId] = useState<string | null>(null);

  // Usar etapas ordenadas (excluindo pendências)
  const mainStages = getOrderedStages();

  const handleDragStart = (e: React.DragEvent, processId: string) => {
    setDraggedProcessId(processId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', processId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: ProcessStatus) => {
    e.preventDefault();
    if (draggedProcessId) {
      onProcessMove(draggedProcessId, status);
      setDraggedProcessId(null);
    }
  };

  /**
   * Verifica se o processo tem pendência (cliente ou interna)
   */
  const getPendencyInfo = (process: Process) => {
    // Verifica nos extra_fields se há marcação de pendência
    const pendencyField = process.extra_fields?.find(
      f => f.label === 'pendency_type' || f.label === 'tipo_pendencia'
    );

    if (pendencyField) {
      return {
        hasPendency: true,
        isClient: pendencyField.value === 'client' || pendencyField.value === 'cliente',
        isInternal: pendencyField.value === 'internal' || pendencyField.value === 'interna'
      };
    }

    return { hasPendency: false, isClient: false, isInternal: false };
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {mainStages.map(stage => {
        const columnProcesses = processes.filter(p => p.status === stage.id);

        return (
          <div
            key={stage.id}
            className={`min-w-[320px] rounded-xl border p-4 flex flex-col gap-3 transition-colors ${stage.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Header da coluna */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                  {stage.title}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">{stage.description}</p>
              </div>
              <span className="bg-white/50 px-2 py-1 rounded-full text-xs font-bold text-slate-600">
                {columnProcesses.length}
              </span>
            </div>

            {/* Barra de progresso da coluna */}
            <div className="mb-3">
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-1 text-center font-bold">{stage.percentage}%</p>
            </div>

            {/* Cards dos processos */}
            <div className="flex-1 flex flex-col gap-3">
              {columnProcesses.map(process => {
                const pendencyInfo = getPendencyInfo(process);
                const progressPercentage = getProgressPercentage(process.status);

                return (
                  <div
                    key={process.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, process.id)}
                    onClick={() => onProcessSelect(process.id)}
                    className={`
                      bg-white rounded-lg shadow-sm border border-slate-100 
                      cursor-move hover:shadow-md transition-all active:cursor-grabbing
                      ${draggedProcessId === process.id ? 'opacity-50' : 'opacity-100'}
                    `}
                  >
                    {/* Barra de progresso do card */}
                    <div className="h-1.5 bg-slate-100 rounded-t-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    <div className="p-4">
                      {/* Indicador de mensagem não lida */}
                      {process.has_unread && (
                        <div className="flex justify-end mb-2">
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            Nova Mensagem
                          </span>
                        </div>
                      )}

                      {/* Indicador de Pendência (apenas na etapa Jurídico - 60%) */}
                      {stage.id === 'legal_analysis' && pendencyInfo.hasPendency && (
                        <div className="mb-3 p-2 rounded-lg border-l-4 bg-opacity-10"
                          style={{
                            borderColor: pendencyInfo.isClient ? '#f59e0b' : '#ef4444',
                            backgroundColor: pendencyInfo.isClient ? '#fef3c7' : '#fee2e2'
                          }}>
                          <div className="flex items-center gap-2">
                            {pendencyInfo.isClient ? (
                              <>
                                <AlertCircle size={14} className="text-orange-600" />
                                <span className="text-[10px] font-bold text-orange-700">
                                  Pendência do Cliente
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={14} className="text-red-600" />
                                <span className="text-[10px] font-bold text-red-700">
                                  Pendência Interna
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Informações do cliente */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">
                            {process.client_name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{process.type}</p>
                        </div>
                      </div>

                      {/* Detalhes financeiros e data */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <DollarSign size={14} className="text-slate-400" />
                          <span className="font-mono font-semibold">
                            R$ {process.value.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Calendar size={14} className="text-slate-400" />
                          <span>{new Date(process.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      {/* Footer com badge e ID */}
                      <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                        <StatusBadge status={process.status} />
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{process.id.slice(0, 6).toUpperCase()}
                        </div>
                      </div>

                      {/* Indicador de progresso numérico */}
                      <div className="mt-2 text-center">
                        <span className="text-[10px] font-bold text-slate-500">
                          {progressPercentage}% concluído
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mensagem quando coluna vazia */}
              {columnProcesses.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="text-xs text-slate-400 italic text-center">
                    Nenhum processo nesta etapa
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
