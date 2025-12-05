
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MaintenanceOrder, MaintenanceStatus, MaintenanceType } from '../../types';
import { useMasterData } from '../../contexts/MasterDataContext';
import { Siren, LayoutDashboard, CalendarClock, ClipboardList, ArrowRight, Kanban, History, CalendarDays, FileBarChart } from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';
import { CalendarView } from './CalendarView';
import { PMPlanner } from './PMPlanner';
import { WorkRequestForm } from './WorkRequestForm';
import { ChecklistExecution } from './ChecklistExecution';
import { OrderDetailModal } from './OrderDetailModal';
import { ChecklistReport } from './ChecklistReport';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, setDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';

const TODAY = new Date().toISOString().split('T')[0];

type ModuleView = 'MENU' | 'ORDERS' | 'PLANNER' | 'REQUESTS' | 'CHECKLISTS';

export default function Maintenance() {
    const { routines, updateRoutine, getNextId } = useMasterData();
    const [activeModule, setActiveModule] = useState<ModuleView>('MENU');
    const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
    const location = useLocation();
    
    // Global Selection State
    const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);

    // View state for Orders dashboard
    const [orderViewMode, setOrderViewMode] = useState<'KANBAN' | 'CALENDAR' | 'HISTORY'>('KANBAN');

    // Data passing for checklist -> corrective
    const [requestInitialData, setRequestInitialData] = useState<{assetId: string, description: string} | undefined>(undefined);

    // FETCH ORDERS FROM DB
    useEffect(() => {
        // Query Maintenance Orders. We might want to filter active ones for speed, but for now grab all.
        // Assuming 'maintenance_orders' collection
        const q = query(collection(db, 'maintenance_orders'), orderBy('reportedDate', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as MaintenanceOrder));
            setOrders(data);
        });
        return () => unsub();
    }, []);

    // Reset view when clicking the sidebar link
    useEffect(() => {
        if (location.pathname === '/maintenance') {
            setActiveModule('MENU');
        }
    }, [location.key, location.pathname]);

    const handleCreateOrders = async (newOrders: MaintenanceOrder[]) => {
        // Batch write preferred, but simple loop fine for now
        for(const order of newOrders) {
            await setDoc(doc(db, 'maintenance_orders', order.id), order);
        }
        setActiveModule('ORDERS');
        setOrderViewMode('KANBAN');
        alert(`${newOrders.length} Órdenes generadas exitosamente.`);
    };

    const handleUpdateOrder = async (updatedOrder: MaintenanceOrder) => {
        // Update DB
        await updateDoc(doc(db, 'maintenance_orders', updatedOrder.id), { ...updatedOrder });
        
        // Update local selection if needed
        if (selectedOrder && selectedOrder.id === updatedOrder.id) {
            setSelectedOrder(updatedOrder);
        }

        // Logic for Closed PM Orders -> Update Routine Cycle
        if (updatedOrder.status === MaintenanceStatus.CLOSED && updatedOrder.routineId) {
            const relatedRoutine = routines.find(r => r.id === updatedOrder.routineId);
            if (relatedRoutine) {
                // Update the lastExecutionDate to Today (or the close date)
                updateRoutine({
                    ...relatedRoutine,
                    lastExecutionDate: updatedOrder.closedDate || TODAY
                });
                console.log(`Rutina ${relatedRoutine.name} actualizada. Nueva fecha base: ${updatedOrder.closedDate}`);
            }
        }
    };

    const handleCreateRequest = async (newOrder: MaintenanceOrder) => {
        await setDoc(doc(db, 'maintenance_orders', newOrder.id), newOrder);
        // Intentionally NOT navigating away. 
        // Logic moved to WorkRequestForm to clear itself.
        setRequestInitialData(undefined);
        alert("Aviso de avería creado correctamente. Puede cargar otro si lo desea.");
    };

    const handleQuickCorrectiveOrder = async (assetId: string, description: string) => {
        // Use the Work Request Numerator for quick orders from checklists
        const number = await getNextId('WORK_REQUEST');

        const order: MaintenanceOrder = {
            id: `REQ-${Date.now()}`,
            number: number,
            assetId,
            description,
            type: MaintenanceType.CORRECTIVE,
            status: MaintenanceStatus.PENDING,
            priority: 'High',
            reportedDate: new Date().toISOString().split('T')[0],
            assignedMaterials: [],
            origin: 'MANUAL'
        };
        await setDoc(doc(db, 'maintenance_orders', order.id), order);
    };

    const LandingMenu = () => (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-300 py-10">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Mantenimiento y Activos</h1>
                    <p className="text-slate-500 text-lg">Seleccione una operación para comenzar</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                     <button onClick={() => setActiveModule('REQUESTS')} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-rose-500 transition-all text-left flex flex-col">
                        <div className="bg-rose-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-rose-100 transition-colors"><Siren size={32} className="text-rose-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Avisos de Avería</h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">Reporte de fallas, solicitud de reparaciones correctivas.</p>
                        <span className="text-rose-600 font-semibold text-sm flex items-center">Crear Solicitud <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1"/></span>
                    </button>

                    <button onClick={() => setActiveModule('ORDERS')} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-500 transition-all text-left flex flex-col">
                        <div className="bg-blue-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-blue-100 transition-colors"><LayoutDashboard size={32} className="text-blue-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Gestión de Órdenes</h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">Tablero Kanban, calendario y cierre de OTs.</p>
                        <span className="text-blue-600 font-semibold text-sm flex items-center">Ir al Tablero <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1"/></span>
                    </button>

                    <button onClick={() => setActiveModule('PLANNER')} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-500 transition-all text-left flex flex-col">
                        <div className="bg-indigo-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-indigo-100 transition-colors"><CalendarClock size={32} className="text-indigo-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Planificador PM</h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">Generación masiva de órdenes preventivas según rutinas.</p>
                        <span className="text-indigo-600 font-semibold text-sm flex items-center">Planificar <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1"/></span>
                    </button>

                     <button onClick={() => setActiveModule('CHECKLISTS')} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-green-500 transition-all text-left flex flex-col">
                        <div className="bg-green-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-green-100 transition-colors"><ClipboardList size={32} className="text-green-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Inspecciones / Checklist</h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">Ejecutar inspecciones y ver reportes históricos.</p>
                        <span className="text-green-600 font-semibold text-sm flex items-center">Iniciar Inspección <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1"/></span>
                    </button>
                </div>
            </div>
        </div>
    );

    if (activeModule === 'MENU') return <LandingMenu />;

    if (activeModule === 'REQUESTS') {
        return <WorkRequestForm existingOrders={orders} onSave={handleCreateRequest} onCancel={() => setActiveModule('MENU')} initialData={requestInitialData} />;
    }

    if (activeModule === 'PLANNER') {
        return <PMPlanner onGenerateOrders={handleCreateOrders} onCancel={() => setActiveModule('MENU')} />;
    }

    if (activeModule === 'CHECKLISTS') {
        return <ChecklistExecution onQuickCorrectiveOrder={handleQuickCorrectiveOrder} onBack={() => setActiveModule('MENU')} />;
    }

    // ORDERS MODULE (Dashboard)
    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center">
                     <button onClick={() => setActiveModule('MENU')} className="mr-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"><ArrowRight className="rotate-180" size={20}/></button>
                     <h2 className="text-xl font-bold text-slate-800">Tablero de Órdenes</h2>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setOrderViewMode('KANBAN')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${orderViewMode === 'KANBAN' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Kanban size={16} className="mr-2"/> Kanban
                    </button>
                    <button 
                        onClick={() => setOrderViewMode('CALENDAR')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${orderViewMode === 'CALENDAR' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CalendarDays size={16} className="mr-2"/> Calendario
                    </button>
                    <button 
                        onClick={() => setOrderViewMode('HISTORY')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${orderViewMode === 'HISTORY' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} className="mr-2"/> Histórico
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {orderViewMode === 'KANBAN' && <KanbanBoard orders={orders} onSelectOrder={setSelectedOrder} />}
                {orderViewMode === 'CALENDAR' && <CalendarView orders={orders} onSelectOrder={setSelectedOrder} />}
                {orderViewMode === 'HISTORY' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col animate-in fade-in">
                        <div className="p-4 bg-slate-50 border-b border-slate-200">
                             <h3 className="font-bold text-slate-800 text-lg flex items-center">
                                <History className="mr-2 text-slate-500" size={20}/> Órdenes Cerradas
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                                    <tr>
                                        <th className="p-3">Nro Orden</th>
                                        <th className="p-3">Activo</th>
                                        <th className="p-3">Descripción</th>
                                        <th className="p-3">Fecha Cierre</th>
                                        <th className="p-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.filter(o => o.status === MaintenanceStatus.CLOSED).map(order => (
                                        <tr key={order.id} className="hover:bg-slate-50 group">
                                            <td className="p-3 font-mono text-slate-600">{order.number}</td>
                                            <td className="p-3 font-medium text-slate-800">{order.assetId}</td>
                                            <td className="p-3 text-slate-600 truncate max-w-xs">{order.description}</td>
                                            <td className="p-3 text-slate-500">{order.closedDate}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => setSelectedOrder(order)} className="text-blue-600 hover:underline font-medium">Ver Detalle</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.filter(o => o.status === MaintenanceStatus.CLOSED).length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No hay órdenes históricas cerradas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {selectedOrder && (
                <OrderDetailModal 
                    order={selectedOrder} 
                    allOrders={orders}
                    onClose={() => setSelectedOrder(null)} 
                    onUpdateOrder={handleUpdateOrder} 
                    readOnly={orderViewMode === 'CALENDAR' || orderViewMode === 'HISTORY'}
                />
            )}
        </div>
    );
}
