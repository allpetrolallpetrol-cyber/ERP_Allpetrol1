
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  FileText, 
  ShoppingBag, 
  Mail, 
  CheckCircle, 
  DollarSign, 
  Users, 
  ArrowRight,
  Settings,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Search,
  X,
  Briefcase,
  TrendingUp,
  Package,
  Truck,
  Lightbulb,
  Target,
  BarChart3,
  FileDigit,
  List,
  Edit2,
  Undo2,
  Printer,
  Layers,
  Save
} from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { RFQ, OrderStatus, RFQItem, SupplierQuote, ApprovalRule, QuoteItemDetail } from '../types';

// --- Sub Components ---

// 1. New RFQ Form with Per-Item Supplier Selection
const NewRFQForm = ({ onSave, onCancel }: { onSave: (rfq: any) => void, onCancel: () => void }) => {
    const { suppliers, materials } = useMasterData();
    const [items, setItems] = useState<RFQItem[]>([]);
    
    // Temp item state
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedItemSuppliers, setSelectedItemSuppliers] = useState<string[]>([]); // Suppliers for the current item being added

    // Reset item suppliers when material changes
    useEffect(() => {
        if (selectedMaterialId) {
            const mat = materials.find(m => m.id === selectedMaterialId);
            if (mat) {
                // Pre-select suppliers associated with this material
                setSelectedItemSuppliers(mat.assignedSupplierIds || []);
            }
        } else {
            setSelectedItemSuppliers([]);
        }
    }, [selectedMaterialId, materials]);

    const toggleItemSupplier = (supplierId: string) => {
        if (selectedItemSuppliers.includes(supplierId)) {
            setSelectedItemSuppliers(selectedItemSuppliers.filter(id => id !== supplierId));
        } else {
            setSelectedItemSuppliers([...selectedItemSuppliers, supplierId]);
        }
    };

    const addItem = () => {
        if(!selectedMaterialId) return;
        const mat = materials.find(m => m.id === selectedMaterialId);
        if(!mat) return;

        if(selectedItemSuppliers.length === 0) {
            alert("Debe seleccionar al menos un proveedor para este material.");
            return;
        }

        setItems([...items, { 
            materialId: mat.id, 
            description: mat.description, 
            quantity: quantity,
            targetSupplierIds: selectedItemSuppliers 
        }]);
        
        // Reset form
        setSelectedMaterialId('');
        setQuantity(1);
        setSelectedItemSuppliers([]);
    };

    const editItem = (index: number) => {
        const itemToEdit = items[index];
        setSelectedMaterialId(itemToEdit.materialId);
        setQuantity(itemToEdit.quantity);
        setSelectedItemSuppliers(itemToEdit.targetSupplierIds || []);
        
        // Remove from list so it can be re-added
        removeItem(index);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const removeSupplierFromItem = (itemIndex: number, supplierId: string) => {
        const newItems = [...items];
        const item = newItems[itemIndex];
        if (item.targetSupplierIds) {
            item.targetSupplierIds = item.targetSupplierIds.filter(id => id !== supplierId);
            // If no suppliers left, warn user or remove item? Let's just update
            if (item.targetSupplierIds.length === 0) {
                alert("Atención: Has quitado todos los proveedores de este ítem.");
            }
        }
        setItems(newItems);
    };

    // Calculate the distinct list of all suppliers involved in this RFQ
    const uniqueSupplierIds = Array.from(new Set(items.flatMap(i => i.targetSupplierIds || [])));
    const uniqueSuppliers = suppliers.filter(s => uniqueSupplierIds.includes(s.id));

    const handleSubmit = () => {
        if(items.length === 0) {
            alert("Debe agregar items a la lista.");
            return;
        }
        
        const selectedSupplierObjs = uniqueSuppliers.map(s => ({id: s.id, name: s.name}));
        
        const newRFQ: RFQ = {
            id: `RFQ-${Date.now()}`,
            number: `P-OFE-${Math.floor(Math.random() * 1000)}`,
            date: new Date().toISOString().split('T')[0],
            items: items,
            selectedSuppliers: selectedSupplierObjs,
            quotes: [],
            status: OrderStatus.SENT
        };

        // Simulate Email sending
        alert(`📧 Enviando solicitudes de cotización a:\n${selectedSupplierObjs.map(s => s.name).join('\n')}`);
        onSave(newRFQ);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <FileText className="mr-2 text-slate-600" /> Nueva Petición de Oferta (RFQ)
                </h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Add Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center"><Package className="mr-2" size={16}/> 1. Agregar / Editar Material</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                            <div className="md:col-span-8">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Material</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-accent outline-none" 
                                    value={selectedMaterialId}
                                    onChange={e => setSelectedMaterialId(e.target.value)}
                                >
                                    <option value="">Seleccionar Material del Maestro...</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.code} - {m.description}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Cantidad</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-accent outline-none" 
                                        type="number" 
                                        placeholder="Cant." 
                                        value={quantity}
                                        onChange={e => setQuantity(parseInt(e.target.value))}
                                    />
                                    <button onClick={addItem} className="bg-slate-900 text-white px-4 rounded-lg hover:bg-slate-800 font-medium shadow-sm transition-transform active:scale-95">
                                        {items.find(i => i.materialId === selectedMaterialId) ? 'Actualizar' : '+'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Selection Area for Current Item */}
                        {selectedMaterialId && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200 animate-in fade-in">
                                <label className="block text-xs font-semibold text-slate-500 mb-2">Seleccionar Proveedores para este ítem:</label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {suppliers.map(sup => {
                                        const mat = materials.find(m => m.id === selectedMaterialId);
                                        const isLinked = mat?.assignedSupplierIds.includes(sup.id);
                                        const isSelected = selectedItemSuppliers.includes(sup.id);
                                        
                                        return (
                                            <button 
                                                key={sup.id}
                                                onClick={() => toggleItemSupplier(sup.id)}
                                                className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center transition-all ${
                                                    isSelected 
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {isSelected && <CheckCircle size={12} className="mr-1.5"/>}
                                                {sup.name}
                                                {isLinked && <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1 rounded">Sugerido</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">Items Agregados ({items.length})</h4>
                        {items.length > 0 ? (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm bg-white">
                                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="text-left px-4 py-2">Descripción</th>
                                            <th className="text-center px-4 py-2">Cant.</th>
                                            <th className="text-left px-4 py-2">Proveedores Asignados</th>
                                            <th className="px-4 py-2 w-20 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it, idx) => (
                                            <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-700">{it.description}</td>
                                                <td className="text-center px-4 py-2 font-mono">{it.quantity}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {it.targetSupplierIds?.map(sid => {
                                                            const sName = suppliers.find(s => s.id === sid)?.name;
                                                            return (
                                                                <span key={sid} className="group relative text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 flex items-center hover:bg-slate-200 cursor-default">
                                                                    {sName}
                                                                    <button 
                                                                        onClick={() => removeSupplierFromItem(idx, sid)}
                                                                        className="ml-1 text-slate-400 hover:text-red-500 hidden group-hover:inline-block"
                                                                        title="Quitar este proveedor"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <button onClick={() => editItem(idx)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Editar Item">
                                                            <Edit2 size={16}/>
                                                        </button>
                                                        <button onClick={() => removeItem(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Eliminar Item">
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                <p className="text-slate-400 text-sm">No hay items agregados aún.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 sticky top-6 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center"><Briefcase className="mr-2" size={16}/> Resumen de Proveedores</h4>
                        
                        <div className="mb-6">
                            <p className="text-xs text-slate-500 mb-3">
                                Los siguientes proveedores recibirán una solicitud de cotización basada en los items asignados:
                            </p>
                            {uniqueSuppliers.length > 0 ? (
                                <ul className="space-y-2">
                                    {uniqueSuppliers.map(s => (
                                        <li key={s.id} className="flex items-center text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold mr-3 text-slate-600">
                                                {s.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold">{s.name}</div>
                                                <div className="text-xs text-slate-400">CUIT: {s.cuit}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-xs text-slate-400 italic">Ningún proveedor seleccionado aún.</div>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">Items Totales:</span>
                                <span className="font-bold text-slate-800">{items.length}</span>
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm text-slate-600">Proveedores Totales:</span>
                                <span className="font-bold text-slate-800">{uniqueSuppliers.length}</span>
                            </div>

                            <button 
                                onClick={handleSubmit} 
                                disabled={items.length === 0}
                                className="w-full bg-accent text-white py-3 rounded-lg hover:bg-blue-600 shadow-md flex items-center justify-center font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Mail size={18} className="mr-2"/> Generar Solicitud
                            </button>
                            <button onClick={onCancel} className="w-full mt-3 py-2 text-slate-500 font-medium hover:text-slate-800 text-sm">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. Manage RFQs (Quoting & Adjudication)
const RFQManagement = ({ rfqs, onUpdate }: { rfqs: RFQ[], onUpdate: (rfq: RFQ) => void }) => {
    const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
    
    // Store unit prices: { supplierId: { materialId: price } }
    const [tempUnitPrices, setTempUnitPrices] = useState<Record<string, Record<string, string>>>({}); 
    const [tempReferences, setTempReferences] = useState<{[key: string]: string}>({}); // key: supplierId, value: quote #
    
    const { users, approvalRules } = useMasterData();

    const handleUnitPriceChange = (supplierId: string, materialId: string, value: string) => {
        setTempUnitPrices(prev => ({
            ...prev,
            [supplierId]: {
                ...(prev[supplierId] || {}),
                [materialId]: value
            }
        }));
    };

    const handleLoadPrices = (rfq: RFQ) => {
        // Build the quote objects from the entered unit prices
        const newQuotes: SupplierQuote[] = rfq.selectedSuppliers.map(s => {
            const supplierItems = rfq.items.filter(i => i.targetSupplierIds?.includes(s.id));
            const quoteItems: QuoteItemDetail[] = [];
            let totalQuotePrice = 0;

            supplierItems.forEach(item => {
                const unitPrice = parseFloat(tempUnitPrices[s.id]?.[item.materialId] || '0');
                totalQuotePrice += unitPrice * item.quantity;
                quoteItems.push({
                    materialId: item.materialId,
                    unitPrice: unitPrice
                });
            });

            return {
                supplierId: s.id,
                supplierName: s.name,
                price: totalQuotePrice,
                items: quoteItems,
                quoteReference: tempReferences[s.id] || '',
                isSelected: false
            };
        });
        
        onUpdate({
            ...rfq,
            quotes: newQuotes,
            status: OrderStatus.QUOTED
        });
        setTempUnitPrices({});
        setTempReferences({});
        setSelectedRfq(null);
    };

    const handleAdjudicate = (rfq: RFQ, winnerId: string, totalAmount: number) => {
        // 1. Mark winner
        const updatedQuotes = rfq.quotes.map(q => ({
            ...q,
            isSelected: q.supplierId === winnerId
        }));
        
        // 2. Check Approval Schema Logic
        const matchingRule = approvalRules.find(rule => totalAmount >= rule.minAmount && totalAmount <= rule.maxAmount);

        let nextStatus = OrderStatus.APPROVED;
        let requiredApprover = undefined;

        if (matchingRule) {
            nextStatus = OrderStatus.PENDING_APPROVAL;
            requiredApprover = matchingRule.approverId;
            const approverUser = users.find(u => u.id === requiredApprover);
            alert(`ℹ️ Adjudicación Exitosa.\n\nSegún el esquema de liberación, el monto $${totalAmount} requiere aprobación de: ${approverUser?.name || 'Admin'}`);
        } else {
             nextStatus = OrderStatus.PENDING_APPROVAL;
             requiredApprover = users.find(u => u.role === 'ADMIN')?.id;
             alert(`ℹ️ Adjudicación Exitosa.\n\nSe solicita aprobación al Administrador por defecto.`);
        }
        
        onUpdate({
            ...rfq,
            quotes: updatedQuotes,
            winnerSupplierId: winnerId,
            status: nextStatus,
            requiredApproverId: requiredApprover
        });
    };

    const handleRevertAdjudication = (rfq: RFQ) => {
        const revertedRfq: RFQ = {
            ...rfq,
            status: OrderStatus.QUOTED,
            winnerSupplierId: undefined,
            requiredApproverId: undefined,
            quotes: rfq.quotes.map(q => ({...q, isSelected: false}))
        };
        onUpdate(revertedRfq);
    };

    if (selectedRfq) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <button onClick={() => setSelectedRfq(null)} className="mb-4 text-sm text-slate-500 hover:text-slate-800 flex items-center"><ArrowRight className="rotate-180 mr-1" size={14}/> Volver al listado</button>
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{selectedRfq.number}</h3>
                        <p className="text-sm text-slate-500">Gestión de Cotizaciones y Adjudicación</p>
                    </div>
                    <span className={`font-bold text-slate-700 px-3 py-1 rounded-lg ${selectedRfq.status === OrderStatus.PENDING_APPROVAL ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}`}>{selectedRfq.status}</span>
                </div>

                {/* --- 1. SIMULATION MODE (SENT) --- */}
                {selectedRfq.status === OrderStatus.SENT && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100 flex items-start">
                            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0"/>
                            <div>
                                <p className="font-bold">Modo Simulación: Carga de Precios por Ítem</p>
                                <p>Ingrese el <strong>Precio Unitario</strong> de cada material. El sistema calculará los totales.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {selectedRfq.selectedSuppliers.map((s) => {
                                // Find items for this supplier to display as a hint
                                const supplierItems = selectedRfq.items.filter(i => i.targetSupplierIds?.includes(s.id));
                                
                                // Calculate total on the fly for display
                                const currentTotal = supplierItems.reduce((acc, item) => {
                                    const price = parseFloat(tempUnitPrices[s.id]?.[item.materialId] || '0');
                                    return acc + (price * item.quantity);
                                }, 0);

                                return (
                                    <div key={s.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        {/* Supplier Header */}
                                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 flex items-center">
                                                    <Truck size={18} className="mr-2 text-slate-500"/>
                                                    {s.name}
                                                </h4>
                                                <span className="text-xs text-slate-500 ml-6">Cotiza {supplierItems.length} items</span>
                                            </div>
                                            
                                            <div className="flex items-center">
                                                <span className="bg-white border-y border-l border-slate-300 rounded-l-lg px-2 py-2 text-slate-400"><FileDigit size={14}/></span>
                                                <input 
                                                    type="text" 
                                                    className="border border-slate-300 rounded-r-lg px-3 py-2 w-48 text-sm bg-white focus:ring-2 focus:ring-accent outline-none" 
                                                    placeholder="Nro. Presupuesto (Ref)"
                                                    onChange={(e) => setTempReferences({...tempReferences, [s.id]: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Detailed Item List for this Supplier */}
                                        <div className="p-0 bg-white">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left">Ítem / Descripción</th>
                                                        <th className="px-4 py-3 text-center w-24">Cant.</th>
                                                        <th className="px-4 py-3 text-right w-40">Precio Unit.</th>
                                                        <th className="px-4 py-3 text-right w-40">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {supplierItems.map((i, iIdx) => {
                                                        const unitPrice = tempUnitPrices[s.id]?.[i.materialId] || '';
                                                        const subtotal = (parseFloat(unitPrice || '0') * i.quantity);
                                                        
                                                        return (
                                                            <tr key={iIdx} className="border-b border-slate-50 last:border-0">
                                                                <td className="px-4 py-3 text-slate-700 font-medium">{i.description}</td>
                                                                <td className="px-4 py-3 text-center text-slate-500 bg-slate-50 font-mono">x{i.quantity}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-2 text-slate-400 text-xs">$</span>
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded text-right text-sm focus:ring-2 focus:ring-accent outline-none"
                                                                            placeholder="0.00"
                                                                            value={unitPrice}
                                                                            onChange={(e) => handleUnitPriceChange(s.id, i.materialId, e.target.value)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold text-slate-700">
                                                                    ${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-slate-50 border-t border-slate-200">
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-600 uppercase text-xs">Total Presupuesto:</td>
                                                        <td className="px-4 py-3 text-right font-bold text-lg text-slate-800">
                                                            ${currentTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => handleLoadPrices(selectedRfq)} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 shadow-md transition-all font-medium flex items-center">
                                <Save size={18} className="mr-2"/> Guardar Cotizaciones
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 2. QUOTING MODE (QUOTED) - THE BUBBLES --- */}
                {selectedRfq.status === OrderStatus.QUOTED && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-end mb-2">
                            <h4 className="font-bold text-slate-700">Comparativa de Precios</h4>
                            <p className="text-xs text-slate-500">Seleccione la mejor opción para adjudicar.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {selectedRfq.quotes.map(q => {
                                // Comparator Logic
                                const myItemsIds = selectedRfq.items
                                    .filter(i => i.targetSupplierIds?.includes(q.supplierId))
                                    .map(i => i.materialId)
                                    .sort();
                                const mySignature = myItemsIds.join('|');
                                const comparableQuotes = selectedRfq.quotes.filter(otherQ => {
                                    const otherItemsIds = selectedRfq.items
                                        .filter(i => i.targetSupplierIds?.includes(otherQ.supplierId))
                                        .map(i => i.materialId)
                                        .sort();
                                    return otherItemsIds.join('|') === mySignature;
                                });
                                const isComparable = comparableQuotes.length > 1;
                                const minPriceInGroup = Math.min(...comparableQuotes.map(cq => cq.price));
                                const isCheapest = isComparable && q.price === minPriceInGroup;
                                const quoteItems = selectedRfq.items.filter(i => i.targetSupplierIds?.includes(q.supplierId));
                                
                                return (
                                    <div key={q.supplierId} className={`p-0 border rounded-xl flex flex-col justify-between bg-white shadow-sm hover:shadow-lg transition-all relative overflow-hidden ${isCheapest ? 'border-green-400 ring-2 ring-green-100' : 'border-slate-200'}`}>
                                        {isCheapest && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold z-10">MEJOR PRECIO</div>}
                                        
                                        <div className="p-5">
                                            <div className="mb-4">
                                                <div className="font-bold text-lg text-slate-800 leading-tight mb-1">{q.supplierName}</div>
                                                <div className="flex items-center text-slate-500 text-xs mt-1">
                                                    <FileDigit size={12} className="mr-1"/> 
                                                    Ref: <span className="font-mono ml-1 font-semibold text-slate-700">{q.quoteReference || 'S/N'}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">${q.price.toLocaleString()}</div>
                                            
                                            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 mb-2 border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                                                <p className="font-bold mb-1 uppercase text-slate-400 text-[10px]">Detalle Cotizado:</p>
                                                <ul className="space-y-1">
                                                    {quoteItems.map((qi, idx) => {
                                                        const detail = q.items?.find(i => i.materialId === qi.materialId);
                                                        return (
                                                            <li key={idx} className="flex justify-between border-b border-slate-200 border-dashed pb-1 last:border-0 last:pb-0">
                                                                <span className="truncate pr-2 w-1/2" title={qi.description}>{qi.description}</span>
                                                                <div className="text-right">
                                                                    <span className="font-mono text-slate-500 mr-2">x{qi.quantity}</span>
                                                                    <span className="font-bold text-slate-800">${detail?.unitPrice.toLocaleString() || '-'}</span>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                                             <button 
                                                onClick={() => handleAdjudicate(selectedRfq, q.supplierId, q.price)}
                                                className={`w-full py-2 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 ${
                                                    isCheapest 
                                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                {isCheapest ? 'Adjudicar (Mejor Opción)' : 'Adjudicar'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- 3. ADJUDICATED VIEW (PENDING APPROVAL) - BUBBLES GONE --- */}
                {selectedRfq.status === OrderStatus.PENDING_APPROVAL && (
                    <div className="animate-in zoom-in-95 duration-300">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Adjudicación Registrada!</h3>
                            <p className="text-slate-600 mb-6">
                                Se ha seleccionado al proveedor <span className="font-bold text-slate-900">{selectedRfq.quotes.find(q => q.isSelected)?.supplierName}</span> por un total de <span className="font-bold text-slate-900">${selectedRfq.quotes.find(q => q.isSelected)?.price.toLocaleString()}</span>.
                            </p>
                            
                            <div className="bg-white p-4 rounded-lg border border-green-100 text-left mb-6 shadow-sm">
                                <h5 className="text-sm font-bold text-slate-700 mb-2 uppercase flex items-center"><Layers size={14} className="mr-2"/> Estado Actual</h5>
                                <div className="flex items-center text-sm text-orange-600 font-medium">
                                    <Users size={16} className="mr-2"/> Pendiente de Aprobación (Esquema de Liberación)
                                </div>
                            </div>

                            <div className="flex justify-center space-x-4">
                                <button 
                                    onClick={() => handleRevertAdjudication(selectedRfq)}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center text-sm font-medium"
                                >
                                    <Undo2 size={16} className="mr-2"/> Hubo un error, deshacer adjudicación
                                </button>
                                <button 
                                    onClick={() => setSelectedRfq(null)}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md font-bold transition-all"
                                >
                                    Volver al Listado
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {rfqs.filter(r => r.status !== OrderStatus.APPROVED && r.status !== OrderStatus.CONVERTED_TO_PO).map(rfq => (
                <div key={rfq.id} className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center space-x-3 mb-1">
                            <span className="font-bold text-slate-800 text-lg">{rfq.number}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                rfq.status === OrderStatus.SENT ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                rfq.status === OrderStatus.QUOTED ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                                {rfq.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">{rfq.items.length} items solicitados • {rfq.selectedSuppliers.length} proveedores invitados</p>
                    </div>
                    {/* Allow managing even if pending approval to show the result screen */}
                    <button 
                        onClick={() => setSelectedRfq(rfq)}
                        className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                        {rfq.status === OrderStatus.PENDING_APPROVAL ? 'Ver Estado' : 'Gestionar'} <ArrowRight size={16} className="ml-2"/>
                    </button>
                </div>
            ))}
            {rfqs.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400">No hay peticiones de oferta activas</p>
                </div>
            )}
        </div>
    );
};

// 3. Approval Tray
const ApprovalTray = ({ rfqs, onApprove, onRevert }: { rfqs: RFQ[], onApprove: (rfq: RFQ) => void, onRevert: (rfq: RFQ) => void }) => {
    const { users } = useMasterData();

    return (
        <div className="space-y-4">
            {rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).map(rfq => {
                const winner = rfq.quotes.find(q => q.isSelected);
                const assignedApprover = users.find(u => u.id === rfq.requiredApproverId);

                return (
                    <div key={rfq.id} className="bg-white p-6 rounded-xl border border-l-4 border-l-orange-500 shadow-sm animate-in slide-in-from-left-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg text-slate-800 flex items-center">
                                    Solicitud de Aprobación: {rfq.number}
                                </h4>
                                <p className="text-slate-500 text-sm">Fecha Solicitud: {rfq.date}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-slate-900 tracking-tighter">${winner?.price.toLocaleString()}</div>
                                <div className="text-sm text-success font-bold mt-1">Ganador: {winner?.supplierName}</div>
                            </div>
                        </div>

                        <div className="flex items-center mb-6 text-sm bg-orange-50 p-3 rounded-lg border border-orange-100">
                             <div className="bg-orange-100 p-1.5 rounded-md mr-3 text-orange-600"><Users size={18}/></div>
                             <div>
                                 <span className="block text-xs text-orange-800 uppercase font-bold">Aprobador Requerido</span>
                                 <span className="text-orange-950 font-medium text-lg">{assignedApprover?.name || 'Administrador'}</span>
                             </div>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg text-sm mb-6 border border-slate-100">
                             <p className="font-bold mb-2 text-slate-700 text-xs uppercase">Items a comprar</p>
                             <ul className="space-y-1">
                                {rfq.items.map((it, i) => {
                                    // Find unit price in winning quote
                                    const quoteDetail = winner?.items?.find(qi => qi.materialId === it.materialId);
                                    
                                    return (
                                        <li key={i} className="flex justify-between text-slate-600 border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                                            <span>{it.description}</span>
                                            <div>
                                                <span className="font-mono font-bold mr-3">x{it.quantity}</span>
                                                <span className="text-xs text-slate-500">
                                                    (Unit. ${quoteDetail?.unitPrice.toLocaleString()})
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                             </ul>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                            <button 
                                onClick={() => onRevert(rfq)}
                                className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-bold transition-colors flex items-center"
                            >
                                <Undo2 size={16} className="mr-2"/> Corregir / Reversar Adjudicación
                            </button>
                            <button 
                                onClick={() => onApprove(rfq)}
                                className="px-5 py-2.5 bg-success text-white rounded-lg hover:bg-green-600 shadow-md text-sm font-bold flex items-center transition-transform active:scale-95"
                            >
                                <CheckCircle size={18} className="mr-2"/> Aprobar y Generar OC
                            </button>
                        </div>
                    </div>
                );
            })}
             {rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).length === 0 && (
                 <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                     <CheckCircle size={48} className="mx-auto text-slate-200 mb-4"/>
                     <p className="text-slate-400 font-medium">No hay aprobaciones pendientes</p>
                     <p className="text-slate-300 text-sm mt-1">¡Buen trabajo!</p>
                 </div>
             )}
        </div>
    );
};

// 4. Purchase Orders View
const PurchaseOrdersList = ({ rfqs }: { rfqs: RFQ[] }) => {
    const pos = rfqs.filter(r => r.status === OrderStatus.CONVERTED_TO_PO);
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="p-4 font-semibold text-slate-600">Nro OC</th>
                        <th className="p-4 font-semibold text-slate-600">Fecha</th>
                        <th className="p-4 font-semibold text-slate-600">Proveedor Adjudicado</th>
                        <th className="p-4 font-semibold text-slate-600 text-right">Total</th>
                        <th className="p-4 font-semibold text-slate-600 text-center">Estado</th>
                        <th className="p-4 font-semibold text-slate-600 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {pos.map(po => {
                        const winner = po.quotes.find(q => q.isSelected);
                        return (
                            <tr key={po.id} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-mono font-bold text-slate-700">{po.number.replace('P-OFE', 'OC')}</td>
                                <td className="p-4 text-slate-500">{new Date().toLocaleDateString()}</td>
                                <td className="p-4 font-medium">{winner?.supplierName}</td>
                                <td className="p-4 text-right font-bold text-slate-800">${winner?.price.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Enviada</span>
                                </td>
                                <td className="p-4 text-center">
                                    <button className="text-slate-400 hover:text-slate-700" title="Ver PDF"><Printer size={16}/></button>
                                </td>
                            </tr>
                        );
                    })}
                    {pos.length === 0 && (
                        <tr><td colSpan={6} className="p-12 text-center text-slate-400">Sin órdenes de compra generadas</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// 5. Configuration (Approval Schemas)
const ApprovalSettings = () => {
    const { approvalRules, users, addApprovalRule, deleteApprovalRule } = useMasterData();
    const [min, setMin] = useState('');
    const [max, setMax] = useState('');
    const [approver, setApprover] = useState('');

    const handleAdd = () => {
        if (!min || !max || !approver) return;
        addApprovalRule({
            id: `RULE-${Date.now()}`,
            minAmount: parseFloat(min),
            maxAmount: parseFloat(max),
            approverId: approver
        });
        setMin('');
        setMax('');
        setApprover('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <ShieldCheck className="mr-2" /> Esquema de Liberación (Aprobaciones)
            </h3>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Nueva Regla de Negocio</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Monto Mínimo</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400">$</span>
                            <input 
                                type="number" 
                                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-accent" 
                                placeholder="0" 
                                value={min}
                                onChange={(e) => setMin(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Monto Máximo</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400">$</span>
                            <input 
                                type="number" 
                                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-accent" 
                                placeholder="Ej. 1000000" 
                                value={max}
                                onChange={(e) => setMax(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Aprobador</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-accent"
                            value={approver}
                            onChange={(e) => setApprover(e.target.value)}
                        >
                            <option value="">Seleccionar Usuario...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 font-medium"
                    >
                        <Plus size={16} className="inline mr-1"/> Agregar
                    </button>
                </div>
            </div>

            <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                    <tr>
                        <th className="text-left p-4 font-semibold text-slate-600">Rango de Montos</th>
                        <th className="text-left p-4 font-semibold text-slate-600">Usuario Aprobador</th>
                        <th className="text-right p-4 font-semibold text-slate-600">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {approvalRules.map(rule => {
                        const user = users.find(u => u.id === rule.approverId);
                        return (
                            <tr key={rule.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-mono text-slate-600 font-medium">
                                    ${rule.minAmount.toLocaleString()} <span className="text-slate-400 mx-2">➔</span> ${rule.maxAmount.toLocaleString()}
                                </td>
                                <td className="p-4 font-medium">
                                    {user?.name || 'Usuario Desconocido'}
                                    <span className="ml-2 text-[10px] uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">{user?.role}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => deleteApprovalRule(rule.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-full">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// --- Modules Wrappers ---

const ProcurementModule = () => {
    // Change default state from NEW_RFQ to MANAGE_RFQ (Dashboard)
    const [activeTab, setActiveTab] = useState<'NEW_RFQ' | 'MANAGE_RFQ' | 'APPROVAL' | 'PO_LIST' | 'SETTINGS' | 'STRATEGIES'>('MANAGE_RFQ');
    const [rfqs, setRfqs] = useState<RFQ[]>([]);
    
    // Simulate Current User Role (In a real app, this comes from AuthContext)
    // Change this to 'USER' to test hiding the Settings button
    const currentUserRole = 'ADMIN';

    // Derived state for badge counts
    const pendingApprovals = rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).length;
    const activeRfqs = rfqs.filter(r => r.status === OrderStatus.SENT || r.status === OrderStatus.QUOTED).length;

    const handleCreateRFQ = (newRfq: RFQ) => {
        setRfqs([...rfqs, newRfq]);
        setActiveTab('MANAGE_RFQ');
    };

    const handleUpdateRFQ = (updatedRfq: RFQ) => {
        setRfqs(rfqs.map(r => r.id === updatedRfq.id ? updatedRfq : r));
    };

    const handleRevertAdjudication = (rfq: RFQ) => {
        const revertedRfq: RFQ = {
            ...rfq,
            status: OrderStatus.QUOTED,
            winnerSupplierId: undefined,
            requiredApproverId: undefined,
            quotes: rfq.quotes.map(q => ({...q, isSelected: false}))
        };
        handleUpdateRFQ(revertedRfq);
        setActiveTab('MANAGE_RFQ'); // Go back to management to re-quote/re-adjudicate
    };

    const handleApproveRFQ = (rfq: RFQ) => {
        const winner = rfq.quotes.find(q => q.isSelected);
        if(!winner) return;
        
        const poNumber = rfq.number.replace('P-OFE', 'OC');

        // Generate PDF
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`ORDEN DE COMPRA: ${poNumber}`, 15, 20);
        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 30);
        doc.text(`Proveedor: ${winner.supplierName}`, 15, 40);
        doc.text(`Referencia Cotización: ${winner.quoteReference || 'N/A'}`, 15, 50);

        doc.setFontSize(14);
        doc.text(`Detalle de Items`, 15, 70);
        
        let yPos = 80;
        doc.setFontSize(10);
        // Filter items for this winner (simple logic assumes winner takes all associated items or just list all if not strict)
        // For strict logic, we would filter rfq.items where targetSupplierIds includes winner.supplierId
        const winnerItems = rfq.items.filter(i => i.targetSupplierIds?.includes(winner.supplierId));

        winnerItems.forEach((item, index) => {
             // Retrieve unit price from the detailed quote info
             const quoteItem = winner.items?.find(qi => qi.materialId === item.materialId);
             const unitPrice = quoteItem ? quoteItem.unitPrice : 0;
             const subtotal = unitPrice * item.quantity;
             
             doc.text(`${item.description}`, 20, yPos);
             doc.text(`Cant: ${item.quantity}  |  Unit: $${unitPrice}  |  Sub: $${subtotal}`, 20, yPos + 5);
             yPos += 12;
        });

        doc.setFontSize(12);
        doc.text(`TOTAL: $${winner.price.toLocaleString()}`, 15, yPos + 10);
        
        doc.save(`${poNumber}.pdf`);

        alert(`✅ Aprobación Exitosa.\n\n1. Orden de Compra Generada: ${poNumber}\n2. Email enviado a: ${winner?.supplierName} (PDF Adjunto)`);
        
        const approvedRfq = { ...rfq, status: OrderStatus.CONVERTED_TO_PO };
        setRfqs(rfqs.map(r => r.id === rfq.id ? approvedRfq : r));
        setActiveTab('PO_LIST');
    };

    // Render logic for New RFQ to show/hide
    if(activeTab === 'NEW_RFQ') {
        return <NewRFQForm onSave={handleCreateRFQ} onCancel={() => setActiveTab('MANAGE_RFQ')} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Gestión de Compras (Procurement)</h2>
                <button 
                    onClick={() => setActiveTab('NEW_RFQ')} 
                    className="bg-accent text-white px-4 py-2 rounded-lg font-medium shadow-md hover:bg-blue-600 flex items-center"
                >
                    <Plus size={18} className="mr-2"/> Crear Petición (RFQ)
                </button>
             </div>

             {/* Navigation Cards */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <button onClick={() => setActiveTab('MANAGE_RFQ')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'MANAGE_RFQ' ? 'bg-white border-accent shadow-md ring-1 ring-accent' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <FileText size={24} className={`mb-2 ${activeTab === 'MANAGE_RFQ' ? 'text-accent' : 'text-slate-400'}`} />
                    <span className="font-semibold text-slate-700">Seguimiento</span>
                    <span className="text-xs text-slate-500 mt-1">{activeRfqs} activas</span>
                 </button>
                 
                 <button onClick={() => setActiveTab('APPROVAL')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'APPROVAL' ? 'bg-white border-orange-500 shadow-md ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <div className="relative">
                        <Users size={24} className={`mb-2 ${activeTab === 'APPROVAL' ? 'text-orange-500' : 'text-slate-400'}`} />
                        {pendingApprovals > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{pendingApprovals}</span>}
                    </div>
                    <span className="font-semibold text-slate-700">Aprobaciones</span>
                 </button>

                 <button onClick={() => setActiveTab('PO_LIST')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'PO_LIST' ? 'bg-white border-green-500 shadow-md ring-1 ring-green-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <ShoppingBag size={24} className={`mb-2 ${activeTab === 'PO_LIST' ? 'text-green-500' : 'text-slate-400'}`} />
                    <span className="font-semibold text-slate-700">Órdenes de Compra</span>
                 </button>

                 {currentUserRole === 'ADMIN' && (
                    <button onClick={() => setActiveTab('SETTINGS')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'SETTINGS' ? 'bg-white border-slate-800 shadow-md ring-1 ring-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <Settings size={24} className={`mb-2 ${activeTab === 'SETTINGS' ? 'text-slate-800' : 'text-slate-400'}`} />
                        <span className="font-semibold text-slate-700">Configuración</span>
                    </button>
                 )}
             </div>

             <div className="min-h-[400px]">
                {activeTab === 'MANAGE_RFQ' && <RFQManagement rfqs={rfqs} onUpdate={handleUpdateRFQ} />}
                {activeTab === 'APPROVAL' && <ApprovalTray rfqs={rfqs} onApprove={handleApproveRFQ} onRevert={handleRevertAdjudication} />}
                {activeTab === 'PO_LIST' && <PurchaseOrdersList rfqs={rfqs} />}
                {/* activeTab === 'STRATEGIES' && <PurchasingStrategies /> */}
                {activeTab === 'SETTINGS' && currentUserRole === 'ADMIN' && <ApprovalSettings />}
             </div>
        </div>
    );
};

const SalesModule = () => {
    return (
        <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Gestión de Ventas</h2>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:bg-slate-800 flex items-center">
                    <Plus size={18} className="mr-2"/> Nuevo Pedido de Venta
                </button>
             </div>
             
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
                 <TrendingUp size={48} className="mx-auto text-slate-300 mb-4"/>
                 <h3 className="text-lg font-medium text-slate-600">Módulo de Ventas</h3>
                 <p className="text-slate-400 mt-2">Funcionalidad de Pedidos de Venta en desarrollo. Aquí podrás gestionar clientes, pedidos y facturación.</p>
             </div>
        </div>
    );
};

// --- Main Commercial Component ---

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
