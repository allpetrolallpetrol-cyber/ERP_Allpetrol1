import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, RefreshCw } from 'lucide-react';

const StockTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
          <th className="py-3 px-4">Código</th>
          <th className="py-3 px-4">Descripción</th>
          <th className="py-3 px-4">Ubicación</th>
          <th className="py-3 px-4 text-right">Stock Actual</th>
          <th className="py-3 px-4">Unidad</th>
          <th className="py-3 px-4 text-center">Acciones</th>
        </tr>
      </thead>
      <tbody className="text-sm">
        {[
            {code: 'MAT-001', desc: 'Rulemán SKF 6204', loc: 'A-01-02', stock: 50, unit: 'UN'},
            {code: 'MAT-002', desc: 'Aceite 15W40', loc: 'B-02-01', stock: 200, unit: 'LT'},
            {code: 'MAT-003', desc: 'Tornillo Hex M8x40', loc: 'C-05-01', stock: 1500, unit: 'UN'},
        ].map((item, idx) => (
          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-3 px-4 font-medium text-slate-700">{item.code}</td>
            <td className="py-3 px-4 text-slate-600">{item.desc}</td>
            <td className="py-3 px-4 text-slate-600">{item.loc}</td>
            <td className={`py-3 px-4 text-right font-bold ${item.stock < 100 ? 'text-red-500' : 'text-slate-700'}`}>{item.stock}</td>
            <td className="py-3 px-4 text-slate-500">{item.unit}</td>
            <td className="py-3 px-4 text-center">
                <button className="text-accent hover:underline">Ver Mov.</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MovementForm = ({ type }: { type: 'IN' | 'OUT' | 'ADJUST' }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="col-span-1 md:col-span-2">
      <h4 className="text-md font-semibold text-slate-800 mb-4 border-b pb-2">
        {type === 'IN' && 'Ingreso de Mercadería'}
        {type === 'OUT' && 'Salida / Consumo'}
        {type === 'ADJUST' && 'Ajuste de Inventario'}
      </h4>
    </div>

    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Material</label>
        <div className="relative">
            <input className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent bg-white" placeholder="Código o descripción..." />
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
    </div>
    
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
        <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="0.00" />
    </div>

    {type === 'IN' && (
        <>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ref. Orden de Compra</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="OC-XXXX" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remito Proveedor</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="0001-00000000" />
            </div>
        </>
    )}

    {type === 'OUT' && (
        <>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ref. Orden de Trabajo / Aviso</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="OT-XXXX" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destino / Centro de Costo</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" />
            </div>
        </>
    )}
    
    {type === 'ADJUST' && (
        <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo del Ajuste</label>
            <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={2}></textarea>
        </div>
    )}

    <div className="col-span-1 md:col-span-2 flex justify-end pt-4">
        <button className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            Registrar Movimiento
        </button>
    </div>
  </div>
);

export default function Warehouse() {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'IN' | 'OUT' | 'ADJUST'>('STOCK');

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button 
            onClick={() => setActiveTab('STOCK')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'STOCK' ? 'bg-white border-accent shadow-md text-accent' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
            <Search size={24} className="mb-2" />
            <span className="font-semibold">Consultar Stock</span>
        </button>
        <button 
            onClick={() => setActiveTab('IN')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'IN' ? 'bg-white border-green-500 shadow-md text-green-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
            <ArrowDownLeft size={24} className="mb-2" />
            <span className="font-semibold">Ingreso (Entrada)</span>
        </button>
        <button 
            onClick={() => setActiveTab('OUT')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'OUT' ? 'bg-white border-orange-500 shadow-md text-orange-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
            <ArrowUpRight size={24} className="mb-2" />
            <span className="font-semibold">Salida (Consumo)</span>
        </button>
        <button 
            onClick={() => setActiveTab('ADJUST')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'ADJUST' ? 'bg-white border-blue-500 shadow-md text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
            <RefreshCw size={24} className="mb-2" />
            <span className="font-semibold">Ajustes</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
        {activeTab === 'STOCK' && <StockTable />}
        {activeTab === 'IN' && <MovementForm type="IN" />}
        {activeTab === 'OUT' && <MovementForm type="OUT" />}
        {activeTab === 'ADJUST' && <MovementForm type="ADJUST" />}
      </div>
    </div>
  );
}