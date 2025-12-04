
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { MaintenanceOrder, MaintenanceStatus, MaintenanceType } from '../../types';

export const CalendarView = ({ orders, onSelectOrder }: { orders: MaintenanceOrder[], onSelectOrder: (o: MaintenanceOrder) => void }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 (Sun) to 6 (Sat)
    
    // Adjust for Monday start (0 = Mon, 6 = Sun) if desired, but Standard JS Date is Sun=0
    // Let's stick to standard Sun-Sat grid or Mon-Sun. Let's do Mon-Sun for business.
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden animate-in fade-in">
            {/* Calendar Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center">
                    <CalIcon className="mr-2 text-slate-500" size={20}/>
                    {monthNames[month]} {year}
                </h3>
                <div className="flex space-x-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft size={20}/></button>
                    <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">Hoy</button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-200 rounded"><ChevronRight size={20}/></button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 text-center py-2">
                <div>LUN</div><div>MAR</div><div>MIE</div><div>JUE</div><div>VIE</div><div>SAB</div><div>DOM</div>
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 gap-px border-b border-slate-200">
                {/* Empty Cells */}
                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[100px]"></div>
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    
                    // Filter: Only Planned or In Progress
                    const dayOrders = orders.filter(o => 
                        ((o.plannedDate === dateStr) || (o.reportedDate === dateStr && !o.plannedDate)) &&
                        (o.status === MaintenanceStatus.PLANNED || o.status === MaintenanceStatus.IN_PROGRESS)
                    );

                    return (
                        <div key={day} className={`bg-white p-2 min-h-[100px] hover:bg-blue-50 transition-colors relative group overflow-hidden ${isToday ? 'bg-blue-50/30' : ''}`}>
                            <span className={`text-sm font-bold ${isToday ? 'text-white bg-accent w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                                {day}
                            </span>
                            
                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                {dayOrders.map(order => (
                                    <div 
                                        key={order.id} 
                                        onClick={(e) => { e.stopPropagation(); onSelectOrder(order); }}
                                        className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer transition-all hover:scale-105 shadow-sm ${
                                        order.status === MaintenanceStatus.CLOSED ? 'bg-green-100 text-green-700 border-green-200 line-through opacity-70' :
                                        order.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200 font-bold' :
                                        order.type === MaintenanceType.PREVENTIVE ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                        'bg-slate-100 text-slate-700 border-slate-200'
                                    }`} title={order.description}>
                                        {order.number} - {order.assetId}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
