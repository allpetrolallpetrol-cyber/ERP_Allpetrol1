
import React, { useState } from 'react';
import { ShoppingBag, TrendingUp, ArrowRight } from 'lucide-react';
import { ProcurementModule } from './ProcurementModule';
import { SalesModule } from './SalesModule';

export default function Commercial() {
    const [subModule, setSubModule] = useState<'LANDING' | 'PROCUREMENT' | 'SALES'>('LANDING');

    if (subModule === 'LANDING') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Módulo Comercial</h1>
                    <p className="text-slate-500 text-lg">Seleccione el área de trabajo para comenzar</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <button 
                        onClick={() => setSubModule('PROCUREMENT')}
                        className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-accent transition-all text-left flex flex-col items-start"
                    >
                        <div className="bg-blue-50 p-4 rounded-xl mb-6 group-hover:bg-blue-100 transition-colors">
                            <ShoppingBag size={40} className="text-accent" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Gestión de Compras</h3>
                        <p className="text-slate-500 mb-6">Peticiones de oferta (RFQ), comparativas de precios, gestión de proveedores y órdenes de compra.</p>
                        <span className="text-accent font-semibold flex items-center mt-auto">Ingresar al módulo <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform"/></span>
                    </button>

                    <button 
                        onClick={() => setSubModule('SALES')}
                        className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-green-500 transition-all text-left flex flex-col items-start"
                    >
                         <div className="bg-green-50 p-4 rounded-xl mb-6 group-hover:bg-green-100 transition-colors">
                            <TrendingUp size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Gestión de Ventas</h3>
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
            {subModule === 'PROCUREMENT' && <ProcurementModule />}
            {subModule === 'SALES' && <SalesModule />}
        </div>
    );
}
