
import React, { useState, useMemo } from 'react';
import { MaintenanceOrder, MaintenanceStatus, MaintenanceType } from '../../types';
import { useMasterData } from '../../contexts/MasterDataContext';
import { 
    CalendarClock, 
    AlertTriangle, 
    User, 
    Wrench, 
    Link as LinkIcon,
    Layers
} from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

export const KanbanBoard = ({ orders, onSelectOrder }: { orders: MaintenanceOrder[], onSelectOrder: (o: MaintenanceOrder) => void }) => {
    const { users } = useMasterData();
    
    // Filtering State
    const [filterType, setFilterType] = useState<'ALL' | 'PREVENTIVE' | 'CORRECTIVE_MANUAL' | 'CORRECTIVE_DERIVED'>('ALL');

    // Apply Filter
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (filterType === 'ALL') return true;
            if (filterType === 'PREVENTIVE') return o.type === MaintenanceType.PREVENTIVE;
            if (filterType === 'CORRECTIVE_MANUAL') return o.type === MaintenanceType.CORRECTIVE && !o.relatedOrderId;
            if (filterType === 'CORRECTIVE_DERIVED') return o.type === MaintenanceType.CORRECTIVE && !!o.relatedOrderId;
            return true;
        });
    }, [orders, filterType]);

    const activeOrders = filteredOrders.filter(o => o.status !== MaintenanceStatus.CLOSED);
    const preventivePct = activeOrders.length > 0 ? (activeOrders.filter(o => o.type === MaintenanceType.PREVENTIVE).length / activeOrders.length) * 100 : 0;

    const KanbanColumn = ({ status, color }: { status: MaintenanceStatus, color: string }) => {
        const visibleOrders = status === MaintenanceStatus.CLOSED
            ? filteredOrders.filter(o => o.status === status && o.closedDate === TODAY) 
            : filteredOrders.filter(o => o.status === status);

        return (
            <div className="min-w-[320px] w-[320px] bg-slate-100 rounded-xl flex flex-col h-full max-h-full flex-shrink-0">
                <div className={`p-4 rounded-t-xl border-b border-slate-200 flex justify-between items-center ${color} bg-opacity-10`}>
                    <h3 className={`font-bold ${color.replace('bg-', 'text-')}`}>{status}</h3>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">{visibleOrders.length}</span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                    {visibleOrders.map(order => {
                        const isOverdue = order.plannedDate && order.plannedDate < TODAY && order.status !== MaintenanceStatus.CLOSED;
                        const techName = users.find(u => u.id === order.technician)?.name;
                        
                        return (
                            <div 
                                key={order.id} 
                                onClick={() => onSelectOrder(order)}
                                className={`bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:ring-2 hover:ring-accent transition-all group ${isOverdue ? 'border-red-300' : 'border-slate-200'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-1">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            order.priority === 'High' ? 'bg-red-100 text-red-700' : 
                                            order.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>{order.priority}</span>
                                        
                                        {/* Type Badge */}
                                        {order.type === MaintenanceType.PREVENTIVE ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded border bg-indigo-50 text-indigo-700 border-indigo-100">PM</span>
                                        ) : (
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center ${order.relatedOrderId ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                {order.relatedOrderId && <LinkIcon size={8} className="mr-1"/>}
                                                CM
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 group-hover:text-accent font-mono">{order.number}</span>
                                </div>
                                <h4 className="font-medium text-slate-800 mb-1 flex items-center">
                                    <Wrench size={14} className="mr-1 text-slate-400"/> {order.assetId}
                                </h4>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{order.description}</p>
                                
                                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-50 pt-2">
                                    {order.plannedDate ? (
                                        <span className={`flex items-center font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                            <CalendarClock size={12} className="mr-1"/> {order.plannedDate}
                                        </span>
                                    ) : <span>Sin fecha</span>}
                                    
                                    {techName && (
                                        <span className="flex items-center" title={`Técnico: ${techName}`}>
                                            <User size={12} className="mr-1"/> {techName.split(' ')[0]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in">
            {/* Control Bar: KPI & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4">
                <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => setFilterType('ALL')} className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === 'ALL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Layers size={14} className="mr-2"/> Todos
                    </button>
                    <button onClick={() => setFilterType('PREVENTIVE')} className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === 'PREVENTIVE' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <CalendarClock size={14} className="mr-2"/> Preventivos
                    </button>
                    <button onClick={() => setFilterType('CORRECTIVE_MANUAL')} className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === 'CORRECTIVE_MANUAL' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <AlertTriangle size={14} className="mr-2"/> Correctivos
                    </button>
                    <button onClick={() => setFilterType('CORRECTIVE_DERIVED')} className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === 'CORRECTIVE_DERIVED' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <LinkIcon size={14} className="mr-2"/> Derivados
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-semibold uppercase">Visibles</p>
                        <p className="text-lg font-bold text-slate-800 leading-none">{activeOrders.length}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-300"></div>
                    <div className="flex flex-col justify-center w-32">
                        <div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-slate-400">
                            <span>CM</span>
                            <span>PM</span>
                        </div>
                        <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden flex">
                            <div className="bg-rose-500 h-full" style={{ width: `${100 - preventivePct}%` }}></div>
                            <div className="bg-indigo-500 h-full" style={{ width: `${preventivePct}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 overflow-hidden relative border-t border-slate-200 bg-slate-100 rounded-t-xl">
                <div className="h-full overflow-x-auto overflow-y-hidden p-4">
                    <div className="flex h-full gap-4 min-w-max">
                        <KanbanColumn status={MaintenanceStatus.PENDING} color="bg-red-500" />
                        <KanbanColumn status={MaintenanceStatus.PLANNED} color="bg-orange-500" />
                        <KanbanColumn status={MaintenanceStatus.IN_PROGRESS} color="bg-blue-500" />
                        <KanbanColumn status={MaintenanceStatus.CLOSED} color="bg-green-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};
