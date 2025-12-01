import React from 'react';
import { TimelineEvent } from '../types';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface TimelineProps {
    events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
    if (!events || events.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm italic">
                Nenhum evento registrado na linha do tempo.
            </div>
        );
    }

    // Sort events by date descending (newest first)
    const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 my-6">
            {sortedEvents.map((event, index) => (
                <div key={event.id || index} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-[21px] top-0 bg-white">
                        {index === 0 ? (
                            <CheckCircle className="text-green-500" size={20} />
                        ) : (
                            <Circle className="text-slate-300 fill-slate-50" size={16} />
                        )}
                    </div>

                    <div className="pl-4">
                        <h4 className={`font-bold text-sm ${index === 0 ? 'text-slate-800' : 'text-slate-500'}`}>
                            {event.title}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <Clock size={12} />
                            <span>{new Date(event.date).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
