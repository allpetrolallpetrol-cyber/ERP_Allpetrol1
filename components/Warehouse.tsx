

import React, { useState, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, RefreshCw, Lock, BarChart3, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMasterData } from '../contexts/MasterDataContext';
import { MaintenanceStatus, PurchaseRequest, RequestStatus } from '../types';
import { useUI } from '../contexts/UIContext';

const StockTable = () => {
    const { materials, warehouses, warehouseLocations } = useMasterData();
    const [term, setTerm] = useState('');

    const filtered = materials.filter(m => m.description.toLowerCase().includes(term.toLowerCase()) || m.code.toLowerCase().includes(term.toLowerCase()));

    return (
        <div>
            <div className="mb-4 relative">
                <input 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Buscar material..."
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Almacén / Ubicación</th>
                    <th className="py-3 px-4 text-right">Stock Actual</th>
                    <th className="py-3 px-4 text-right">Mínimo</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {filtered.map((item, idx) => {
                        const whName = warehouses.find(w => w.id === item.warehouse)?.name || '-';
                        return (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 font-medium text-slate-700">{item.code}</td>
                                <td className="py-3 px-4 text-slate-600">{item.description}</td>
                                <td className="py-3 px-4 text-slate-600 text-xs">
                                    {whName} <span className="font-bold text-slate-400">/</span> {item.location}
                                </td>
                                <td className={`py-3 px-4 text-right font-bold ${item.stock <= item.minStock ? 'text-red-500' : 'text-slate-700'}`}>
                                    {item.stock} <span className="text-xs font-normal text-slate-400">{item.unitOfMeasure}</span>
                                </td>
                                <td className="py-3 px-4 text-right text-slate-500">{item.minStock}</td>
                                <td className="py-3 px-4 text-center">
                                    <button className="text-accent hover:underline text-xs font-bold">Ver Mov.</button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
                </table>
            </div>
        </div>
    );
};

const ReplenishmentAnalysis = () => {
    const { userProfile } = useAuth();
    const { materials, maintenanceOrders, addPurchaseRequest, getNextId } = useMasterData();
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

    // 1. Calculate Demand from OPEN Maintenance Orders
    const analysis = useMemo(() => {
        const demandMap: Record<string, number> = {};
        
        // Sum reserved quantities
        maintenanceOrders.forEach(order => {
            if (order.status !== MaintenanceStatus.CLOSED && order.assignedMaterials) {
                order.assignedMaterials.forEach(m => {
                    demandMap[m.materialId] = (demandMap[m.materialId] || 0) + m.quantity;
                });
            }
        });

        // Compare with stock
        const suggestions = [];
        for (const mat of materials) {
            const reserved = demandMap[mat.id] || 0;
            const available = mat.stock - reserved;
            
            if (available < mat.minStock) {
                const deficit = mat.minStock - available;
                suggestions.push({
                    material: mat,
                    reserved,
                    available,
                    suggestedQty: deficit
                });
            }
        }
        return suggestions;
    }, [materials, maintenanceOrders]);

    const toggleSelection = (id: string) => {
        if (selectedMaterialIds.includes(id)) setSelectedMaterialIds(prev => prev.filter(i => i !== id));
        else setSelectedMaterialIds(prev => [...prev, id]);
    };

    const handleGenerateSolPeds = async () => {
        if (selectedMaterialIds.length === 0) return;

        const itemsToRequest = analysis
            .filter(a => selectedMaterialIds.includes(a.material.id))
            .map(a => ({
                materialId: a.material.id,
                description: `${a.material.code} - ${a.material.description}`,
                quantity: a.suggestedQty,
                unit: a.material.unitOfMeasure
            }));

        const number = await getNextId('PURCHASE_REQUEST');
        const newReq: PurchaseRequest = {
            id: `PR-AUTO-${Date.now()}`,
            number,
            date: new Date().toISOString().split('T')[0],
            requesterId: userProfile?.id || 'SYSTEM',
            requesterName: 'Sistema (Reposición Automática)',
            origin: 'WAREHOUSE',
            status: RequestStatus.PENDING,
            items: itemsToRequest
        };

        await addPurchaseRequest(newReq);
        alert(`Solicitud ${number} generada correctamente con ${itemsToRequest.length} items.`);
        setSelectedMaterialIds([]);
    };

    return (
        <div className="animate-in fade-in">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
                <AlertTriangle className="text-yellow-600 mr-3 flex-shrink-0" size={20} />
                <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">Análisis de Quiebre de Stock</p>
                    <p>
                        Este reporte calcula el <strong>Stock Disponible</strong> (Físico - Reservas de Mantenimiento).
                        Si el disponible es menor al mínimo, se sugiere una compra.
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-700">Sugerencias de Compra ({analysis.length})</h4>
                <button 
                    onClick={handleGenerateSolPeds}
                    disabled={selectedMaterialIds.length === 0}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 disabled:opacity-50 flex items-center transition-all"
                >
                    Generar Solicitud ({selectedMaterialIds.length}) <ArrowRight size={16} className="ml-2"/>
                </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-3 w-10 text-center">
                                <input type="checkbox" onChange={(e) => setSelectedMaterialIds(e.target.checked ? analysis.map(a => a.material.id) : [])} checked={selectedMaterialIds.length === analysis.length && analysis.length > 0} />
                            </th>
                            <th className="p-3">Material</th>
                            <th className="p-3 text-right">Físico</th>
                            <th className="p-3 text-right text-orange-600">Reservado</th>
                            <th className="p-3 text-right font-bold">Disponible</th>
                            <th className="p-3 text-right text-slate-400">Mínimo</th>
                            <th className="p-3 text-right bg-green-50 text-green-700 font-bold border-l border-green-100">Sugerido</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {analysis.map((item, idx) => (
                            <tr key={idx} className={`hover:bg-slate-50 ${selectedMaterialIds.includes(item.material.id) ? 'bg-blue-50' : ''}`}>
                                <td className="p-3 text-center">
                                    <input type="checkbox" checked={selectedMaterialIds.includes(item.material.id)} onChange={() => toggleSelection(item.material.id)} />
                                </td>
                                <td className="p-3">
                                    <div className="font-medium text-slate-700">{item.material.description}</div>
                                    <div className="text-xs text-slate-400">{item.material.code}</div>
                                </td>
                                <td className="p-3 text-right">{item.material.stock}</td>
                                <td className="p-3 text-right text-orange-600 font-medium">{item.reserved > 0 ? `-${item.reserved}` : '-'}</td>
                                <td className={`p-3 text-right font-bold ${item.available < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                    {item.available}
                                </td>
                                <td className="p-3 text-right text-slate-400">{item.material.minStock}</td>
                                <td className="p-3 text-right bg-green-50 text-green-700 font-bold border-l border-green-100">
                                    +{item.suggestedQty} {item.material.unitOfMeasure}
                                </td>
                            </tr>
                        ))}
                        {analysis.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-400 italic">No hay quiebres de stock detectados actualmente.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MovementForm = ({ type }: { type: 'IN' | 'OUT' | 'ADJUST' }) => {
    const { materials, updateMaterial, checkAutomaticReplenishment } = useMasterData();
    const { showToast } = useUI();
    
    // Form State
    const [searchCode, setSearchCode] = useState('');
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reference, setReference] = useState('');
    const [reason, setReason] = useState('');

    const selectedMaterial = useMemo(() => materials.find(m => m.id === selectedMaterialId), [materials, selectedMaterialId]);

    const filteredMaterials = useMemo(() => {
        if(!searchCode) return [];
        return materials.filter(m => m.code.toLowerCase().includes(searchCode.toLowerCase()) || m.description.toLowerCase().includes(searchCode.toLowerCase())).slice(0,5);
    }, [materials, searchCode]);

    const handleSelect = (m: any) => {
        setSelectedMaterialId(m.id);
        setSearchCode(`${m.code} - ${m.description}`);
    };

    const handleSubmit = async () => {
        if(!selectedMaterialId || !quantity || parseFloat(quantity) <= 0) {
            showToast("Complete el material y una cantidad válida", "error");
            return;
        }
        
        const qtyNum = parseFloat(quantity);
        const newStock = type === 'IN' 
            ? (selectedMaterial!.stock + qtyNum) 
            : (selectedMaterial!.stock - qtyNum);

        if (newStock < 0) {
            showToast("Stock insuficiente para realizar esta operación", "error");
            return;
        }

        try {
            await updateMaterial({ ...selectedMaterial!, stock: newStock });
            showToast("Movimiento registrado correctamente", "success");
            
            // Check Auto-Replenishment ONLY if stock was reduced
            if (type === 'OUT' || (type === 'ADJUST' && qtyNum > 0)) { 
                // Note: For ADJUST, assumed negative impact if user says "quantity" as removal, 
                // but usually Adjust can be + or -. Keeping simple: Trigger check anyway.
                const messages = await checkAutomaticReplenishment([selectedMaterialId]);
                messages.forEach(msg => showToast(msg, 'info'));
            }

            // Reset
            setSearchCode('');
            setSelectedMaterialId('');
            setQuantity('');
            setReference('');
            setReason('');
        } catch (e) {
            console.error(e);
            showToast("Error al actualizar stock", "error");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <div className="col-span-1 md:col-span-2">
            <h4 className="text-md font-semibold text-slate-800 mb-4 border-b pb-2">
                {type === 'IN' && 'Ingreso de Mercadería'}
                {type === 'OUT' && 'Salida / Consumo'}
                {type === 'ADJUST' && 'Ajuste de Inventario'}
            </h4>
            </div>

            <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Material</label>
                <div className="relative">
                    <input 
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent bg-white" 
                        placeholder="Código o descripción..." 
                        value={searchCode}
                        onChange={e => { setSearchCode(e.target.value); setSelectedMaterialId(''); }}
                    />
                    <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                {searchCode && !selectedMaterialId && filteredMaterials.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg">
                        {filteredMaterials.map(m => (
                            <div key={m.id} onClick={() => handleSelect(m)} className="p-2 hover:bg-slate-50 cursor-pointer text-sm">
                                <span className="font-bold">{m.code}</span> - {m.description} (Stock: {m.stock})
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" 
                    placeholder="0.00" 
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                />
            </div>

            {type === 'IN' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ref. Orden de Compra</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="OC-XXXX" value={reference} onChange={e => setReference(e.target.value)} />
                    </div>
                </>
            )}

            {type === 'OUT' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ref. Orden de Trabajo / Aviso</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="OT-XXXX" value={reference} onChange={e => setReference(e.target.value)} />
                    </div>
                </>
            )}
            
            {type === 'ADJUST' && (
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motivo del Ajuste</label>
                    <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" rows={2} value={reason} onChange={e => setReason(e.target.value)}></textarea>
                </div>
            )}

            <div className="col-span-1 md:col-span-2 flex justify-end pt-4">
                <button onClick={handleSubmit} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                    Registrar Movimiento
                </button>
            </div>
        </div>
    );
};

export default function Warehouse() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'IN' | 'OUT' | 'ADJUST' | 'REPLENISH'>('STOCK');

  const permissions = useMemo(() => {
      const perms = userProfile?.permissions || {};
      const isAdmin = userProfile?.role === 'ADMIN';
      
      return {
          viewStock: isAdmin || perms['WAREHOUSE_VIEW'] !== 'NONE',
          operations: isAdmin || ['CREATE', 'EDIT', 'ADMIN'].includes(perms['WAREHOUSE_OPERATIONS'] || 'NONE')
      };
  }, [userProfile]);

  // Si no tiene permiso ni de ver stock, bloqueamos el componente entero
  if (!permissions.viewStock) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-in fade-in">
              <Lock size={64} className="mb-4 text-slate-300"/>
              <h2 className="text-xl font-bold text-slate-600">Acceso Restringido</h2>
              <p>No tiene permisos para visualizar el módulo de Almacenes.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <button 
            onClick={() => setActiveTab('STOCK')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'STOCK' ? 'bg-white border-accent shadow-md text-accent' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
            <Search size={24} className="mb-2" />
            <span className="font-semibold">Consultar Stock</span>
        </button>
        
        {/* Operations Buttons - Protected (Hidden if View Only) */}
        {permissions.operations && (
            <>
                <button 
                    onClick={() => setActiveTab('IN')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'IN' ? 'bg-white border-green-500 shadow-md text-green-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <ArrowDownLeft size={24} className="mb-2" />
                    <span className="font-semibold">Ingreso</span>
                </button>
                <button 
                    onClick={() => setActiveTab('OUT')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'OUT' ? 'bg-white border-orange-500 shadow-md text-orange-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <ArrowUpRight size={24} className="mb-2" />
                    <span className="font-semibold">Salida</span>
                </button>
                <button 
                    onClick={() => setActiveTab('ADJUST')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'ADJUST' ? 'bg-white border-blue-500 shadow-md text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <RefreshCw size={24} className="mb-2" />
                    <span className="font-semibold">Ajustes</span>
                </button>
                
                {/* REPLENISHMENT ANALYSIS TAB */}
                <button 
                    onClick={() => setActiveTab('REPLENISH')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'REPLENISH' ? 'bg-white border-yellow-500 shadow-md text-yellow-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <BarChart3 size={24} className="mb-2" />
                    <span className="font-semibold text-center leading-tight">Analizar Reposición</span>
                </button>
            </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
        {activeTab === 'STOCK' && <StockTable />}
        {activeTab === 'IN' && permissions.operations && <MovementForm type="IN" />}
        {activeTab === 'OUT' && permissions.operations && <MovementForm type="OUT" />}
        {activeTab === 'ADJUST' && permissions.operations && <MovementForm type="ADJUST" />}
        {activeTab === 'REPLENISH' && permissions.operations && <ReplenishmentAnalysis />}
      </div>
    </div>
  );
}