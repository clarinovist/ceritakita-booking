import React from 'react';
// Removed duplicate Phone import
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Lead, LeadStatus } from '@/lib/types';
import { LEAD_STATUSES, getLeadStatusColor, getLeadSourceIcon } from '@/lib/types/leads';
import { formatDate } from '@/utils/dateFormatter';
import { MessageCircle, Phone, Calendar } from 'lucide-react';

interface LeadsKanbanProps {
    leads: Lead[];
    onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
    onOpenModal: (lead?: Lead) => void;
    onWhatsApp: (whatsapp: string) => void;
}

export const LeadsKanban: React.FC<LeadsKanbanProps> = ({
    leads,
    onUpdateStatus,
    onOpenModal,
    onWhatsApp
}) => {
    // Group leads by status
    const leadsByStatus = React.useMemo(() => {
        const groups: Record<string, Lead[]> = {};
        LEAD_STATUSES.forEach(status => {
            groups[status] = [];
        });
        leads.forEach(lead => {
            const group = groups[lead.status];
            if (group) {
                group.push(lead);
            }
        });
        return groups;
    }, [leads]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) {
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId as LeadStatus;
        onUpdateStatus(draggableId, newStatus);
    };

    return (
        <div className="h-full overflow-x-auto overflow-y-hidden pb-4 bg-cream-50">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex h-full gap-4 min-w-[1200px]">
                    {LEAD_STATUSES.map(status => (
                        <div key={status} className="flex flex-col w-72 bg-gray-50/50 rounded-xl border border-gray-200 h-full max-h-[calc(100vh-220px)]">
                            {/* Column Header */}
                            <div className={`p-3 border-b border-warmBrown-200 flex items-center justify-between rounded-t-xl bg-white sticky top-0 z-10`}>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm text-gray-700">{status}</h3>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                        {leadsByStatus[status]?.length || 0}
                                    </span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${(getLeadStatusColor(status).split(' ')[0] ?? '').replace('bg-', 'bg-') || 'bg-gray-400'}`} />
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 p-2 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                                            }`}
                                    >
                                        {leadsByStatus[status]?.map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => onOpenModal(lead)}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            opacity: snapshot.isDragging ? 0.8 : 1
                                                        }}
                                                        className={`bg-white p-3 rounded-lg border shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow group ${snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-200'
                                                            }`}
                                                    >
                                                        {/* Card Content */}
                                                        <div className="flex flex-col gap-2">
                                                            {/* Header: Name + Date */}
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-medium text-sm text-olive-900 line-clamp-1 font-display" title={lead.name}>
                                                                    {lead.name}
                                                                </h4>
                                                            </div>

                                                            {/* Contact */}
                                                            <div
                                                                className="flex items-center gap-1.5 text-xs text-olive-600 font-medium hover:text-olive-800 w-fit p-1 -ml-1 rounded hover:bg-cream-100 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onWhatsApp(lead.whatsapp);
                                                                }}
                                                            >
                                                                <Phone size={12} className="fill-current" />
                                                                <span>{lead.whatsapp}</span>
                                                            </div>

                                                            {/* Metadata Row */}
                                                            <div className="flex items-center gap-2 mt-1 pt-2 border-t border-gray-50">
                                                                <span className="flex items-center gap-1 text-[10px] text-olive-600 bg-cream-50 px-1.5 py-0.5 rounded border border-warmBrown-100" title={`Source: ${lead.source}`}>
                                                                    <span>{getLeadSourceIcon(lead.source)}</span>
                                                                    <span className="truncate max-w-[60px]">{lead.source}</span>
                                                                </span>

                                                                {/* Notes Indicator */}
                                                                {lead.notes && (
                                                                    <span className="text-olive-400" title={lead.notes}>
                                                                        <MessageCircle size={12} />
                                                                    </span>
                                                                )}

                                                                <span className="text-[10px] text-olive-400 ml-auto flex items-center gap-1 font-serif" title={`Created: ${formatDate(lead.created_at)}`}>
                                                                    <Calendar size={10} />
                                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>

                                                            {/* Tags/Interest */}
                                                            {lead.interest && lead.interest.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {lead.interest.slice(0, 2).map((tag, i) => (
                                                                        <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                    {lead.interest.length > 2 && (
                                                                        <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">
                                                                            +{lead.interest.length - 2}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};
