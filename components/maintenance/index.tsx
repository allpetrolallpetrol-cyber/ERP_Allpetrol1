
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MaintenanceOrder, MaintenanceStatus, MaintenanceType } from '../../types';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Siren, LayoutDashboard, CalendarClock, ClipboardList, ArrowRight, Kanban, History, CalendarDays, FileBarChart, Lock } from 'lucide-react';
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
    const { userProfile } = useAuth();
    const [activeModule, setActiveModule] = useState<ModuleView>('MENU');
    const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
    const location = useLocation();
    
    // Global Selection State
    const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);

    // View state for Orders dashboard
    const [orderViewMode, setOrderViewMode] = useState<'KANBAN' | 'CALENDAR' | 'HISTORY'>('KANBAN');

    // Data passing for checklist -> corrective
    const [requestInitialData, setRequestInitialData] = useState<{assetId: string, description: string} | undefined>(undefined);

    // --- GRANULAR PERMISSION LOGIC ---
    const permissions = useMemo(() => {
        if (!userProfile) return { 
            dashboard: 'NONE', 
            planner: 'NONE', 
            execution: 'NONE' 
        };
        
        const perms = userProfile.permissions || {};
        
        return {
            dashboard: userProfile.role === 'ADMIN' ? 'ADMIN' : (perms['MAINTENANCE_DASHBOARD'] || 'NONE'),
            planner: userProfile.role === 'ADMIN' ? 'ADMIN' : (perms['MAINTENANCE_PLANNER'] || 'NONE'),
            execution: userProfile.role === 'ADMIN' ? 'ADMIN' : (perms['MAINTENANCE_EXECUTION'] || 'NONE')
        };
    }, [userProfile]);

    const canAccessDashboard = permissions.dashboard !== 'NONE';
    const canAccessPlanner = permissions.planner !== 'NONE'; // VIEW can see, EDIT/CREATE can generate
    const canAccessExecution = permissions.execution !== 'NONE'; // VIEW can see history, CREATE/EDIT can execute

    const canEditOrders = ['EDIT', 'ADMIN'].includes(permissions.dashboard);
    const canGeneratePM = ['CREATE', 'EDIT', 'ADMIN'].includes(permissions.planner);
    const canCreateRequests = ['CREATE', 'EDIT', 'ADMIN'].includes(permissions.execution);

    // Check Global Access to Module
    const hasAnyAccess = canAccessDashboard || canAccessPlanner || canAccessExecution;

    // FETCH ORDERS FROM DB
    useEffect(() => {
        if (!hasAnyAccess) return;
        const q = query(collection(db, 'maintenance_orders'), orderBy('reportedDate', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as MaintenanceOrder));
            setOrders(data);
        });
        return () => unsub();
    }, [hasAnyAccess]);

    // Handle Auto-Navigation from Notifications
    useEffect(() => {
        const state = location.state as any;
        if (state && state.view === 'ORDERS') {
            setActiveModule('ORDERS');
            if (state.orderId) {
                // Try to find order in already loaded list (might race with fetch)
                // We'll rely on the user clicking "Ver detalle" if it's not immediately open, 
                // OR we can add a logic to open modal once `orders` is populated.
            }
        } else if (location.pathname === '/maintenance') {
            // Default only if NO state passed (normal click)
            if(!state) setActiveModule('MENU');
        }
    }, [location.key, location.pathname, location.state]);

    // Effect to open specific order if requested via notification
    useEffect(() => {
        const state = location.state as any;
        if(state && state.orderId && orders.length > 0 && !selectedOrder) {
            const target = orders.find(o => o.id === state.orderId);
            if(target) setSelectedOrder(target);
        }
    }, [orders, location.state, selectedOrder]);

    // --- BLOCK IF NO ACCESS ---
    if (!hasAnyAccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-in fade-in">
                <Lock size={64} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-bold text-slate-600">Acceso Restringido</h2>
                <p>No tiene permisos para visualizar el módulo de Mantenimiento.</p>
            </div>
        );
    }

    const handleCreateOrders = async (newOrders: MaintenanceOrder[]) => {
        for(const order of newOrders) {
            await setDoc(doc(db, 'maintenance_orders', order.id), order);
        }
        setActiveModule('ORDERS');
        setOrderViewMode('KANBAN');
        alert(`${newOrders.length} Órdenes generadas exitosamente.`);
    };

    const handleUpdateOrder = async (updatedOrder: MaintenanceOrder) => {
        // Double check permission before writing
        if (!canEditOrders) {
            alert("No tiene permisos para modificar órdenes (Se requiere nivel EDIT o ADMIN en Dashboard).");
            return;
        }

        await updateDoc(doc(db, 'maintenance_orders', updatedOrder.id), { ...updatedOrder });
        
        if (selectedOrder && selectedOrder.id === updatedOrder.id) {
            setSelectedOrder(updatedOrder);
        }

        if (updatedOrder.status === MaintenanceStatus.CLOSED && updatedOrder.routineId) {
            const relatedRoutine = routines.find(r => r.id === updatedOrder.routineId);
            if (relatedRoutine) {
                updateRoutine({
                    ...relatedRoutine,
                    lastExecutionDate: updatedOrder.closedDate || TODAY
                });
            }
        }
    };

    const handleCreateRequest = async (newOrder: MaintenanceOrder) => {
        if (!canCreateRequests) return;
        await setDoc(doc(db, 'maintenance_orders', newOrder.id), newOrder);
        setRequestInitialData(undefined);
        alert("Aviso de avería creado correctamente. Puede cargar otro si lo desea.");
    };

    const handleQuickCorrectiveOrder = async (assetId: string, description: string) => {
        if (!canCreateRequests) return;
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
                     {/* 1. WORK REQUESTS */}
                     <button 
                        onClick={() => canAccessExecution && setActiveModule('REQUESTS')} 
                        disabled={!canAccessExecution}
                        className={`group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all text-left flex flex-col ${canAccessExecution ? 'hover:shadow-xl hover:border-rose-500' : 'opacity-60 cursor-not-allowed grayscale'}`}
                    >
                        <div className="bg-rose-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-rose-100 transition-colors"><Siren size={32} className="text-rose-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 flex justify-between">
                            Avisos de Avería
                            {!canAccessExecution && <Lock size={18} className="text-slate-400"/>}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">Reporte de fallas, solicitud de reparaciones correctivas.</p>
                        <span className="text-rose-600 font-semibold text-sm flex items-center">Crear Solicitud <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1"/></span>
                    </button>

                    {/* 2. ORDERS DASHBOARD */}
                    <button 
                        onClick={() => canAccessDashboard && setActiveModule('ORDERS')} 
                        disabled={!canAccessDashboard}
                        className={`group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all text-left flex flex-col ${canAccessDashboard ? 'hover:shadow-xl hover:border-blue-500' : 'opacity-60 cursor-not-allowed grayscale'}`}
                    >
                        <div className="bg-blue-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-blue-100 transition-colors"><LayoutDashboard size={32} className="text-blue-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 flex justify-between">
                            Gestión de Órdenes
                            {!canAccessDashboard && <Lock size={18} className="text-slate-400"/>}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">Tablero Kanban, calendario y cierre de OTs.</p>
                        <span className="text-blue-600 font-semibold text-sm flex items-center">Ir al Tablero <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1"/></span>
                    </button>

                    {/* 3. PLANNER */}
                    <button 
                        onClick={() => canAccessPlanner && setActiveModule('PLANNER')} 
                        disabled={!canAccessPlanner}
                        className={`group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all text-left flex flex-col ${canAccessPlanner ? 'hover:shadow-xl hover:border-indigo-500' : 'opacity-60 cursor-not-allowed grayscale'}`}
                    >
                        <div className="bg-indigo-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-indigo-100 transition-colors"><CalendarClock size={32} className="text-indigo-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 flex justify-between">
                            Planificador PM
                            {!canAccessPlanner && <Lock size={18} className="text-slate-400"/>}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">Generación masiva de órdenes preventivas según rutinas.</p>
                        <span className="text-indigo-600 font-semibold text-sm flex items-center">Planificar <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1"/></span>
                    </button>

                     {/* 4. CHECKLISTS */}
                     <button 
                        onClick={() => canAccessExecution && setActiveModule('CHECKLISTS')} 
                        disabled={!canAccessExecution}
                        className={`group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all text-left flex flex-col ${canAccessExecution ? 'hover:shadow-xl hover:border-green-500' : 'opacity-60 cursor-not-allowed grayscale'}`}
                    >
                        <div className="bg-green-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-green-100 transition-colors"><ClipboardList size={32} className="text-green-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 flex justify-between">
                            Inspecciones
                            {!canAccessExecution && <Lock size={18} className="text-slate-400"/>}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 flex-1">Ejecutar inspecciones y ver reportes históricos.</p>
                        <span className="text-green-600 font-semibold text-sm flex items-center">Iniciar Inspección <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1"/></span>
                    </button>
                </div>
            </div>
        </div>
    );

    if (activeModule === 'MENU') return <LandingMenu />;

    if (activeModule === 'REQUESTS' && canAccessExecution) {
        return <WorkRequestForm existingOrders={orders} onSave={handleCreateRequest} onCancel={() => setActiveModule('MENU')} initialData={requestInitialData} />;
    }

    if (activeModule === 'PLANNER' && canAccessPlanner) {
        if (!canGeneratePM) {
             return (
                 <div className="p-8 text-center">
                     <Lock size={48} className="mx-auto text-slate-300 mb-4"/>
                     <h3 className="text-lg font-bold text-slate-600">Acceso Restringido</h3>
                     <p className="text-slate-500">Su nivel de acceso (Lectura) no permite generar preventivos.</p>
                     <button onClick={() => setActiveModule('MENU')} className="mt-4 text-blue-500 underline">Volver</button>
                 </div>
             )
        }
        return <PMPlanner onGenerateOrders={handleCreateOrders} onCancel={() => setActiveModule('MENU')} />;
    }

    if (activeModule === 'CHECKLISTS' && canAccessExecution) {
        return <ChecklistExecution onQuickCorrectiveOrder={handleQuickCorrectiveOrder} onBack={() => setActiveModule('MENU')} />;
    }

    // ORDERS MODULE (Dashboard)
    if (activeModule === 'ORDERS' && canAccessDashboard) {
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
                        // READ ONLY if view mode is History/Calendar OR user permission for dashboard is not EDIT/ADMIN
                        readOnly={orderViewMode === 'CALENDAR' || orderViewMode === 'HISTORY' || !canEditOrders}
                    />
                )}
            </div>
        );
    }

    return <LandingMenu />; // Fallback
}
