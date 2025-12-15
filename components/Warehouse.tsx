
import React, { useState, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, RefreshCw, Lock, BarChart3, AlertTriangle, ArrowRight, Truck, FileText, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMasterData } from '../contexts/MasterDataContext';
import { MaintenanceStatus, PurchaseRequest, RequestStatus, OrderStatus, RFQ } from '../types';
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

// --- MIGO STYLE RECEIPT ---
const GoodsReceiptView = () => {
    const { rfqs, materials, updateMaterial, updateRFQ } = useMasterData();
    const { showToast } = useUI();
    const [poNumber, setPoNumber] = useState('');
    const [selectedPO, setSelectedPO] = useState<RFQ | null>(null);
    const [remito, setRemito] = useState('');
    const [receiptQuantities, setReceiptQuantities] = useState<Record<string, number>>({});

    // Identify items from the winning quote
    const supplier = useMemo(() => {
        if (!selectedPO) return null;
        return selectedPO.quotes.find(q => q.isSelected);
    }, [selectedPO]);

    const handleSearch = () => {
        if (!poNumber) return;
        const found = rfqs.find(r => 
            (r.number === poNumber || r.number.endsWith(poNumber)) && 
            (r.status === OrderStatus.CONVERTED_TO_PO)
        );
        
        if (found) {
            setSelectedPO(found);
            // Init receipt quantities with full open quantity by default
            const initialQtys: Record<string, number> = {};
            found.items.forEach(item => {
                const openQty = item.quantity - (item.receivedQuantity || 0);
                if (openQty > 0) initialQtys[item.materialId || item.description] = openQty;
            });
            setReceiptQuantities(initialQtys);
        } else {
            showToast("Orden de Compra no encontrada o no está en estado válido para recepción.", "error");
            setSelectedPO(null);
        }
    };

    const handleQtyChange = (itemId: string, val: string) => {
        const num = parseFloat(val) || 0;
        setReceiptQuantities(prev => ({ ...prev, [itemId]: num }));
    };

    const handlePostReceipt = async () => {
        if (!selectedPO || !supplier) return;
        if (!remito.trim()) {
            showToast("Debe ingresar el número de remito del proveedor.", "error");
            return;
        }

        const itemsToReceive = Object.keys(receiptQuantities).filter(k => receiptQuantities[k] > 0);
        if (itemsToReceive.length === 0) {
            showToast("No hay cantidades a recibir.", "error");
            return;
        }

        try {
            // 1. Update Stock for each material
            const updatedItems = [...selectedPO.items];
            
            for (const key of itemsToReceive) {
                const qtyReceived = receiptQuantities[key];
                
                // Find item in PO
                const itemIndex = updatedItems.findIndex(i => (i.materialId || i.description) === key);
                if (itemIndex >= 0) {
                    const poItem = updatedItems[itemIndex];
                    
                    // Update Item Received Qty in PO
                    const currentReceived = poItem.receivedQuantity || 0;
                    updatedItems[itemIndex] = { ...poItem, receivedQuantity: currentReceived + qtyReceived };

                    // Update Master Data Material Stock (Only if Codified)
                    if (poItem.materialId) {
                        const mat = materials.find(m => m.id === poItem.materialId);
                        if (mat) {
                            await updateMaterial({ ...mat, stock: mat.stock + qtyReceived });
                        }
                    }
                }
            }

            // 2. Check if PO is Fully Completed
            const allCompleted = updatedItems.every(i => (i.receivedQuantity || 0) >= i.quantity);
            const newStatus = allCompleted ? OrderStatus.CLOSED : OrderStatus.CONVERTED_TO_PO;

            // 3. Update PO Status
            await updateRFQ({ ...selectedPO, items: updatedItems, status: newStatus });

            showToast(`Ingreso registrado correctamente. OC ${newStatus === OrderStatus.CLOSED ? 'Cerrada' : 'Actualizada'}.`, "success");
            
            // Reset
            setPoNumber('');
            setSelectedPO(null);
            setRemito('');
            setReceiptQuantities({});

        } catch (e) {
            console.error(e);
            showToast("Error al registrar el ingreso.", "error");
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in">
            {/* Header / Search */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Referencia Orden de Compra</label>
                    <div className="relative">
                        <FileText size={18} className="absolute left-3 top-2.5 text-slate-400"/>
                        <input 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent bg-white"
                            placeholder="Ingrese número de OC..."
                            value={poNumber}
                            onChange={e => setPoNumber(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                </div>
                <button onClick={handleSearch} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700 shadow-sm flex items-center">
                    <Search size={18} className="mr-2"/> Buscar Orden
                </button>
            </div>

            {selectedPO && supplier && (
                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Header Info */}
                    <div className="p-4 border-b border-slate-100 bg-blue-50/50 flex flex-wrap gap-6 items-center">
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Proveedor</p>
                            <p className="font-bold text-slate-800 flex items-center"><Truck size={16} className="mr-2 text-slate-400"/> {supplier.supplierName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Fecha Orden</p>
                            <p className="font-bold text-slate-800">{selectedPO.date}</p>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-blue-700 mb-1">Nro. Remito / Entrega *</label>
                            <input 
                                className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                                placeholder="Obligatorio"
                                value={remito}
                                onChange={e => setRemito(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b sticky top-0">
                                <tr>
                                    <th className="p-4">Material / Descripción</th>
                                    <th className="p-4 text-center">Cant. Pedida</th>
                                    <th className="p-4 text-center">Pendiente</th>
                                    <th className="p-4 text-right bg-green-50/50">Cant. Recibida</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedPO.items.map((item, idx) => {
                                    const key = item.materialId || item.description;
                                    const receivedSoFar = item.receivedQuantity || 0;
                                    const openQty = Math.max(0, item.quantity - receivedSoFar);
                                    const currentInput = receiptQuantities[key] ?? 0;
                                    const isFullyReceived = receivedSoFar >= item.quantity;

                                    return (
                                        <tr key={idx} className={isFullyReceived ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}>
                                            <td className="p-4">
                                                <div className="font-medium text-slate-800">{item.description}</div>
                                                {item.materialId && <div className="text-xs text-slate-400 bg-slate-100 px-1.5 rounded w-fit mt-1">{item.materialId}</div>}
                                            </td>
                                            <td className="p-4 text-center font-mono">{item.quantity}</td>
                                            <td className="p-4 text-center font-mono font-bold text-orange-600">{openQty}</td>
                                            <td className="p-4 text-right bg-green-50/30">
                                                {!isFullyReceived ? (
                                                    <div className="flex justify-end items-center">
                                                        <input 
                                                            type="number" 
                                                            className="w-24 text-right px-2 py-1.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 outline-none font-bold"
                                                            value={currentInput || ''}
                                                            onChange={e => handleQtyChange(key, e.target.value)}
                                                            max={openQty}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-green-600 font-bold flex justify-end items-center"><CheckCircle size={16} className="mr-1"/> Completo</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                        <button 
                            onClick={handlePostReceipt}
                            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-green-700 transition-transform active:scale-95 flex items-center"
                        >
                            <Package size={20} className="mr-2"/> Contabilizar Entrada
                        </button>
                    </div>
                </div>
            )}

            {!selectedPO && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Search size={48} className="mb-4 text-slate-300"/>
                    <p>Ingrese el número de Orden de Compra para iniciar la recepción.</p>
                </div>
            )}
        </div>
    );
};

// --- SIMPLE ADJUSTMENT FORM (Legacy Refactored) ---
const AdjustmentForm = ({ type }: { type: 'OUT' | 'ADJUST' }) => {
    const { materials, updateMaterial, checkAutomaticReplenishment } = useMasterData();
    const { showToast } = useUI();
    
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
        // OUT and ADJUST both reduce/change stock logic manually here for simplification in this context, 
        // usually Adjust can be pos/neg. Assuming Adjust is correction (could be pos).
        // Let's keep specific logic: OUT reduces. ADJUST replaces or adds? 
        // Standard simple logic: 
        // OUT -> Substract
        // ADJUST -> Overwrite (Stock Taking) OR Substract/Add based on sign. 
        // Let's implement: OUT substracts. ADJUST requires sign (+/-).
        
        let newStock = selectedMaterial!.stock;
        
        if (type === 'OUT') {
            newStock -= qtyNum;
        } else {
            // Adjustment implies manual correction. 
            // If user enters positive, add? If negative, substract?
            // Let's treat it as +/- adjustment.
            newStock += qtyNum; // qtyNum can be negative in input
        }

        if (newStock < 0) {
            showToast("Stock insuficiente para realizar esta operación", "error");
            return;
        }

        try {
            await updateMaterial({ ...selectedMaterial!, stock: newStock });
            showToast("Movimiento registrado correctamente", "success");
            
            // Check Auto-Replenishment ONLY if stock was reduced
            if (newStock < selectedMaterial!.stock) { 
                const messages = await checkAutomaticReplenishment([selectedMaterialId]);
                messages.forEach(msg => showToast(msg, 'info'));
            }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in max-w-4xl mx-auto">
            <div className="col-span-1 md:col-span-2">
                <div className={`p-4 rounded-lg border flex items-center ${type === 'OUT' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                    <AlertTriangle size={24} className="mr-3"/>
                    <div>
                        <h4 className="font-bold">{type === 'OUT' ? 'Salida de Mercadería' : 'Ajuste de Inventario'}</h4>
                        <p className="text-xs">{type === 'OUT' ? 'Registro de consumos internos, mermas o entregas a producción.' : 'Correcciones de stock por inventario físico (+/-).'}</p>
                    </div>
                </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad {type === 'ADJUST' ? '(+/-)' : ''}</label>
                <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" 
                    placeholder="0.00" 
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                />
            </div>

            {type === 'OUT' && (
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Referencia (OT / Centro Costo)</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="OT-XXXX" value={reference} onChange={e => setReference(e.target.value)} />
                </div>
            )}
            
            {type === 'ADJUST' && (
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motivo del Ajuste</label>
                    <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white resize-none" rows={2} value={reason} onChange={e => setReason(e.target.value)}></textarea>
                </div>
            )}

            <div className="col-span-1 md:col-span-2 flex justify-end pt-4">
                <button onClick={handleSubmit} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-md">
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button 
            onClick={() => setActiveTab('STOCK')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'STOCK' ? 'bg-white border-accent shadow-md text-accent ring-1 ring-accent' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
            <Search size={24} className="mb-2" />
            <span className="font-semibold text-sm md:text-base">Consultar Stock</span>
        </button>
        
        {permissions.operations && (
            <>
                <button 
                    onClick={() => setActiveTab('IN')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'IN' ? 'bg-white border-green-500 shadow-md text-green-600 ring-1 ring-green-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <ArrowDownLeft size={24} className="mb-2" />
                    <span className="font-semibold text-sm md:text-base">Recepción OC</span>
                </button>
                <button 
                    onClick={() => setActiveTab('OUT')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'OUT' ? 'bg-white border-orange-500 shadow-md text-orange-600 ring-1 ring-orange-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <ArrowUpRight size={24} className="mb-2" />
                    <span className="font-semibold text-sm md:text-base">Salida</span>
                </button>
                <button 
                    onClick={() => setActiveTab('ADJUST')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'ADJUST' ? 'bg-white border-blue-500 shadow-md text-blue-600 ring-1 ring-blue-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <RefreshCw size={24} className="mb-2" />
                    <span className="font-semibold text-sm md:text-base">Ajustes</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('REPLENISH')}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all col-span-2 md:col-span-1 ${activeTab === 'REPLENISH' ? 'bg-white border-yellow-500 shadow-md text-yellow-600 ring-1 ring-yellow-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <BarChart3 size={24} className="mb-2" />
                    <span className="font-semibold text-center leading-tight text-sm md:text-base">Analizar Reposición</span>
                </button>
            </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
        {activeTab === 'STOCK' && <StockTable />}
        {activeTab === 'IN' && permissions.operations && <GoodsReceiptView />}
        {activeTab === 'OUT' && permissions.operations && <AdjustmentForm type="OUT" />}
        {activeTab === 'ADJUST' && permissions.operations && <AdjustmentForm type="ADJUST" />}
        {activeTab === 'REPLENISH' && permissions.operations && <ReplenishmentAnalysis />}
      </div>
    </div>
  );
}
