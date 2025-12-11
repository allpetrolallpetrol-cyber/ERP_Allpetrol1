
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bell, AlertCircle, Wrench, ChevronRight, CheckSquare } from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { useAuth } from '../contexts/AuthContext';
import { OrderStatus, MaintenanceStatus } from '../types';
import { useNavigate } from 'react-router-dom';

export const NotificationsBtn = () => {
    const { rfqs, users } = useMasterData(); // Usamos users para tener contexto si hiciera falta
    // Nota: Para mantenimiento deberíamos exponer 'orders' en el contexto o hacer un fetch aquí.
    // Para simplificar y no refactorizar todo el Contexto gigante ahora, asumiremos que las notificaciones
    // de mantenimiento se basan en una lógica local o simplificada, PERO, 
    // lo ideal es exponer 'maintenanceOrders' en MasterDataContext.
    // *HOTFIX*: Vamos a leer orders directamente de firestore aquí para las notificaciones para no romper el MasterDataContext grande.
    
    const [maintenanceOrders, setMaintenanceOrders] = useState<any[]>([]);
    const { userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Effect para cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Simulación de fetch de órdenes de mantenimiento solo para notificaciones
    // En producción real, esto vendría del MasterDataContext
    useEffect(() => {
        if(!userProfile) return;
        import('../lib/firebase').then(({ db }) => {
            import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
                // Traer órdenes asignadas a MÍ y que no estén cerradas
                const q = query(
                    collection(db, 'maintenance_orders'), 
                    where('technician', '==', userProfile.id),
                    where('status', '!=', 'Cerrado') // MaintenanceStatus.CLOSED
                );
                // También podríamos querer ver las que no tienen técnico si soy supervisor, pero simplifiquemos.
                onSnapshot(q, (snap) => {
                    const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
                    setMaintenanceOrders(data);
                });
            });
        });
    }, [userProfile]);

    const notifications = useMemo(() => {
        if (!userProfile) return [];
        const notifs = [];

        // 1. APROBACIONES DE COMPRA (RFQs)
        // Lógica: Si soy aprobador asignado en la RFQ
        const pendingRfqs = rfqs.filter(r => 
            r.status === OrderStatus.PENDING_APPROVAL && 
            (r.requiredApproverId === userProfile.id || userProfile.role === 'ADMIN') // Admin ve todo por seguridad
        );

        pendingRfqs.forEach(rfq => {
            notifs.push({
                id: rfq.id,
                type: 'COMMERCIAL',
                title: 'Aprobación Pendiente',
                message: `RFQ #${rfq.number} requiere su autorización.`,
                date: rfq.date,
                link: '/commercial',
                state: { view: 'PROCUREMENT', tab: 'APPROVAL' }
            });
        });

        // 2. MANTENIMIENTO ASIGNADO
        maintenanceOrders.forEach(order => {
            notifs.push({
                id: order.id,
                type: 'MAINTENANCE',
                title: 'Orden Asignada',
                message: `${order.type === 'Preventivo' ? 'PM' : 'Correctivo'}: ${order.assetId} - ${order.description.substring(0, 30)}...`,
                date: order.reportedDate,
                link: '/maintenance',
                state: { view: 'ORDERS', orderId: order.id }
            });
        });

        return notifs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [userProfile, rfqs, maintenanceOrders]);

    const handleNavigate = (n: any) => {
        setIsOpen(false);
        navigate(n.link, { state: n.state });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 relative text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-700">Notificaciones</h4>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{notifications.length}</span>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {notifications.map(notif => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => handleNavigate(notif)}
                                        className="p-3 hover:bg-blue-50 cursor-pointer transition-colors group flex items-start"
                                    >
                                        <div className={`mt-1 p-1.5 rounded-full shrink-0 mr-3 ${notif.type === 'COMMERCIAL' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {notif.type === 'COMMERCIAL' ? <CheckSquare size={16}/> : <Wrench size={16}/>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                                                <span className="text-[10px] text-slate-400">{notif.date}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-accent mt-2 ml-1" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Bell size={20} className="text-slate-300"/>
                                </div>
                                <p className="text-xs">No tienes tareas pendientes.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
