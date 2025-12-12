
import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, TrendingUp, ArrowRight, Lock, ShoppingCart } from 'lucide-react';
import { ProcurementModule } from './ProcurementModule';
import { SalesModule } from './SalesModule';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Commercial() {
    const { userProfile } = useAuth();
    const [subModule, setSubModule] = useState<'LANDING' | 'PROCUREMENT' | 'SALES'>('LANDING');
    const location = useLocation();

    // Auto-navigate from Notification Click
    useEffect(() => {
        if (location.state && (location.state as any).view) {
            setSubModule((location.state as any).view);
        }
    }, [location.state]);

    const permissions = useMemo(() => {
        if (!userProfile) return { procurement: 'NONE', sales: 'NONE', requests: 'NONE' };
        
        const perms = userProfile.permissions || {};
        const isAdmin = userProfile.role === 'ADMIN';

        return {
            procurement: isAdmin ? 'ADMIN' : (perms['COMMERCIAL_PROCUREMENT'] || 'NONE'),
            requests: isAdmin ? 'ADMIN' : (perms['COMMERCIAL_REQUESTS'] || 'NONE'),
            sales: isAdmin ? 'ADMIN' : (perms['COMMERCIAL_SALES'] || 'NONE')
        };
    }, [userProfile]);

    const hasAccessProcurement = permissions.procurement !== 'NONE';
    const hasAccessRequests = permissions.requests !== 'NONE';
    const hasAccessSales = permissions.sales !== 'NONE';
    
    // Can access procurement module if they have full procurement rights OR just request rights
    const canEnterProcurement = hasAccessProcurement || hasAccessRequests;
    
    const hasAnyAccess = canEnterProcurement || hasAccessSales;

    if (!hasAnyAccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-in fade-in">
                <Lock size={64} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-bold text-slate-600">Acceso Restringido</h2>
                <p>No tiene permisos para visualizar el módulo Comercial.</p>
            </div>
        );
    }

    if (subModule === 'LANDING') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Módulo Comercial</h1>
                    <p className="text-slate-500 text-lg">Seleccione el área de trabajo para comenzar</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <button 
                        onClick={() => canEnterProcurement && setSubModule('PROCUREMENT')}
                        disabled={!canEnterProcurement}
                        className={`group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 transition-all text-left flex flex-col items-start ${canEnterProcurement ? 'hover:shadow-xl hover:border-accent' : 'opacity-60 cursor-not-allowed grayscale'}`}
                    >
                        <div className="bg-blue-50 p-4 rounded-xl mb-6 group-hover:bg-blue-100 transition-colors">
                            <ShoppingBag size={40} className="text-accent" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2 flex justify-between w-full">
                            {hasAccessProcurement ? 'Gestión de Compras' : 'Solicitudes de Compra'}
                            {!canEnterProcurement && <Lock size={20} className="text-slate-400"/>}
                        </h3>
                        <p className="text-slate-500 mb-6">
                            {hasAccessProcurement 
                                ? 'Peticiones de oferta (RFQ), comparativas de precios, gestión de proveedores y órdenes de compra.' 
                                : 'Generación y seguimiento de Solicitudes de Pedido (SolPed) internas.'}
                        </p>
                        <span className="text-accent font-semibold flex items-center mt-auto">Ingresar al módulo <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform"/></span>
                    </button>

                    <button 
                        onClick={() => hasAccessSales && setSubModule('SALES')}
                        disabled={!hasAccessSales}
                        className={`group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 transition-all text-left flex flex-col items-start ${hasAccessSales ? 'hover:shadow-xl hover:border-green-500' : 'opacity-60 cursor-not-allowed grayscale'}`}
                    >
                         <div className="bg-green-50 p-4 rounded-xl mb-6 group-hover:bg-green-100 transition-colors">
                            <TrendingUp size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2 flex justify-between w-full">
                            Gestión de Ventas
                            {!hasAccessSales && <Lock size={20} className="text-slate-400"/>}
                        </h3>
                        <p className="text-slate-500 mb-6">Pedidos de venta de clientes, listas de precios, facturación y seguimiento de entregas.</p>
                        <span className="text-green-600 font-semibold flex items-center mt-auto">Ingresar al módulo <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform"/></span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <button 
                onClick={() => setSubModule('LANDING')}
                className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
                <ArrowRight className="rotate-180 mr-2" size={18} /> Volver al menú principal
            </button>
            
            {subModule === 'PROCUREMENT' && canEnterProcurement && (
                <ProcurementModule 
                    initialTab={(location.state as any)?.tab} // Pass initial tab if from notification
                />
            )}
            
            {subModule === 'SALES' && hasAccessSales && <SalesModule />}
        </div>
    );
}
