import React, { useState } from 'react';
import { Process } from '../types';
import { StatusBadge } from './StatusBadge';
import { User, Calendar, DollarSign } from 'lucide-react';

interface KanbanBoardProps {
  processes: Process[];
  onProcessMove: (processId: string, newStatus: string) => void;
  onProcessSelect: (processId: string) => void;
}

const COLUMNS = [
  { id: 'analysis', title: 'Em Análise', color: 'bg-blue-50 border-blue-100' },
  { id: 'pending_docs', title: 'Pendência', color: 'bg-amber-50 border-amber-100' },
  { id: 'approved', title: 'Aprovado', color: 'bg-green-50 border-green-100' },
  { id: 'contract', title: 'Contrato', color: 'bg-purple-50 border-purple-100' },
  { id: 'rejected', title: 'Reprovado', color: 'bg-red-50 border-red-100' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ processes, onProcessMove, onProcessSelect }) => {
  const [draggedProcessId, setDraggedProcessId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, processId: string) => {
    setDraggedProcessId(processId);
    e.dataTransfer.effectAllowed = 'move';
    // Set data for compatibility
    e.dataTransfer.setData('text/plain', processId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedProcessId) {
      onProcessMove(draggedProcessId, status);
      setDraggedProcessId(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {COLUMNS.map(column => {
        const columnProcesses = processes.filter(p => 
            // Handle mapping 'pending' to 'pending_docs' if necessary, or ensure consistent IDs
            p.status === column.id || (column.id === 'pending_docs' && p.status === 'pending_docs')
        );

        return (
          <div
            key={column.id}
            className={`min-w-[300px] rounded-xl border p-4 flex flex-col gap-3 transition-colors ${column.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                {column.title}
              </h3>
              <span className="bg-white/50 px-2 py-1 rounded-full text-xs font-bold text-slate-600">
                {columnProcesses.length}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {columnProcesses.map(process => (
                <div
                  key={process.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, process.id)}
                  onClick={() => onProcessSelect(process.id)}
                  className={`
                    bg-white p-4 rounded-lg shadow-sm border border-slate-100 
                    cursor-move hover:shadow-md transition-all active:cursor-grabbing
                    ${draggedProcessId === process.id ? 'opacity-50' : 'opacity-100'}
                  `}
                >
                  {process.has_unread && (
                    <div className="flex justify-end mb-2">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            Nova Mensagem
                        </span>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{process.client_name}</h4>
                        <p className="text-xs text-slate-500">{process.type}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <DollarSign size={14} className="text-slate-400" />
                        <span className="font-mono">R$ {process.value.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{new Date(process.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <StatusBadge status={process.status} />
                    <div className="text-[10px] text-slate-400">ID: {process.id.slice(0, 6)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
