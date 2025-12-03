
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
  Save,
  Award,
  Archive,
  CheckSquare,
  Square
} from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { RFQ, OrderStatus, RFQItem, SupplierQuote, ApprovalRule, QuoteItemDetail } from '../types';

// --- Sub Components ---

// 1. New RFQ Form (Supports Creation and Editing)
const NewRFQForm = ({ initialData, onSave, onCancel }: { initialData?: RFQ, onSave: (rfq: any) => void, onCancel: () => void }) => {
    const { suppliers, materials } = useMasterData();
    const [items, setItems] = useState<RFQItem[]>(initialData?.items || []);
    
    // Temp item state
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedItemSuppliers, setSelectedItemSuppliers] = useState<string[]>([]); 

    // Reset item suppliers when material changes
    useEffect(() => {
        if (selectedMaterialId) {
            const mat = materials.find(m => m.id === selectedMaterialId);
            if (mat) {
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

        // Check if updating existing item
        const existingIndex = items.findIndex(i => i.materialId === selectedMaterialId);
        const newItem = { 
            materialId: mat.id, 
            description: mat.description, 
            quantity: quantity,
            targetSupplierIds: selectedItemSuppliers 
        };

        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex] = newItem;
            setItems(newItems);
        } else {
            setItems([...items, newItem]);
        }
        
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
            if (item.targetSupplierIds.length === 0) {
                alert("Atención: Has quitado todos los proveedores de este ítem.");
            }
        }
        setItems(newItems);
    };

    // Calculate the distinct list of all suppliers involved in this RFQ
    const uniqueSupplierIds = Array.from(new Set(items.flatMap(i => i.targetSupplierIds || [])));
    const uniqueSuppliers = suppliers.filter(s => uniqueSupplierIds.includes(s.id));

    const createRFQObject = (status: OrderStatus) => {
        const selectedSupplierObjs = uniqueSuppliers.map(s => ({id: s.id, name: s.name}));
        
        return {
            id: initialData?.id || `RFQ-${Date.now()}`,
            number: initialData?.number || `P-OFE-${Math.floor(Math.random() * 1000)}`,
            date: initialData?.date || new Date().toISOString().split('T')[0],
            items: items,
            selectedSuppliers: selectedSupplierObjs,
            quotes: initialData?.quotes || [],
            status: status
        };
    };

    const handleSend = () => {
        if(items.length === 0) { alert("Debe agregar items."); return; }
        const rfq = createRFQObject(OrderStatus.SENT);
        alert(`📧 Enviando solicitudes de cotización a:\n${rfq.selectedSuppliers.map(s => s.name).join('\n')}`);
        onSave(rfq);
    };

    const handleDraft = () => {
        if(items.length === 0) { alert("Debe agregar items."); return; }
        const rfq = createRFQObject(OrderStatus.DRAFT);
        onSave(rfq);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <FileText className="mr-2 text-slate-600" /> {initialData ? 'Editar Petición (Borrador)' : 'Nueva Petición de Oferta (RFQ)'}
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-accent outline-none" 
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
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-accent outline-none" 
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
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleDraft} 
                                    disabled={items.length === 0}
                                    className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg hover:bg-slate-50 shadow-sm flex items-center justify-center font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Archive size={18} className="mr-2"/> Borrador
                                </button>
                                <button 
                                    onClick={handleSend} 
                                    disabled={items.length === 0}
                                    className="flex-1 bg-accent text-white py-3 rounded-lg hover:bg-blue-600 shadow-md flex items-center justify-center font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Mail size={18} className="mr-2"/> Enviar
                                </button>
                            </div>
                            
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

// 2. Manage RFQs (Tracking & Adjudication)
const RFQManagement = ({ rfqs, onUpdate, onEditDraft, onSplitAdjudicate }: { rfqs: RFQ[], onUpdate: (rfq: RFQ) => void, onEditDraft: (rfq: RFQ) => void, onSplitAdjudicate: (originalRfq: RFQ, supplierId: string, itemIds: string[], amount: number) => void }) => {
    const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
    const [selectedItemsForAdjudication, setSelectedItemsForAdjudication] = useState<Record<string, string[]>>({}); // supplierId -> [materialIds]

    // Sync state
    useEffect(() => {
        if (selectedRfq) {
            const found = rfqs.find(r => r.id === selectedRfq.id);
            if (found && found !== selectedRfq) {
                setSelectedRfq(found);
            } else if (!found) {
                // If RFQ disappeared (fully adjudicated), close detail view
                setSelectedRfq(null);
            }
        }
    }, [rfqs, selectedRfq]);
    
    // Store unit prices: { supplierId: { materialId: price } }
    const [tempUnitPrices, setTempUnitPrices] = useState<Record<string, Record<string, string>>>({}); 
    const [tempReferences, setTempReferences] = useState<{[key: string]: string}>({}); 
    const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

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

    const handleSendDraft = (rfq: RFQ) => {
        const sentRfq = { ...rfq, status: OrderStatus.SENT };
        onUpdate(sentRfq);
        setSelectedRfq(null);
        alert(`📧 Enviando solicitudes de cotización a:\n${rfq.selectedSuppliers.map(s => s.name).join('\n')}`);
    };

    const handleLoadPrices = (rfq: RFQ) => {
        const newQuotes: SupplierQuote[] = rfq.selectedSuppliers.map(s => {
            const supplierItems = rfq.items.filter(i => i.targetSupplierIds?.includes(s.id));
            const quoteItems: QuoteItemDetail[] = [];
            let totalQuotePrice = 0;

            supplierItems.forEach(item => {
                const unitPrice = parseFloat(tempUnitPrices[s.id]?.[item.materialId] || '0');
                totalQuotePrice += unitPrice * item.quantity;
                quoteItems.push({ materialId: item.materialId, unitPrice });
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
        
        const updated = { ...rfq, quotes: newQuotes, status: OrderStatus.QUOTED };
        onUpdate(updated);
        setSelectedRfq(null); // Return to list
    };

    const handleStartEdit = (quote: SupplierQuote) => {
        setEditingSupplierId(quote.supplierId);
        const prices: Record<string, string> = {};
        quote.items?.forEach(item => {
            prices[item.materialId] = item.unitPrice.toString();
        });
        setTempUnitPrices({ [quote.supplierId]: prices });
        setTempReferences({ [quote.supplierId]: quote.quoteReference || '' });
    };

    const handleSaveEdit = (rfq: RFQ, supplierId: string) => {
        const updatedQuotes = rfq.quotes.map(q => {
            if (q.supplierId === supplierId) {
                const supplierItems = rfq.items.filter(i => i.targetSupplierIds?.includes(supplierId));
                const newItems: QuoteItemDetail[] = [];
                let total = 0;
                
                supplierItems.forEach(item => {
                     const unitPrice = parseFloat(tempUnitPrices[supplierId]?.[item.materialId] || '0');
                     total += unitPrice * item.quantity;
                     newItems.push({ materialId: item.materialId, unitPrice });
                });

                return {
                    ...q,
                    quoteReference: tempReferences[supplierId],
                    items: newItems,
                    price: total
                };
            }
            return q;
        });
        
        const newRfq = { ...rfq, quotes: updatedQuotes };
        onUpdate(newRfq);
        setSelectedRfq(newRfq); 
        setEditingSupplierId(null);
    };

    const toggleAdjudicationItem = (supplierId: string, materialId: string) => {
        const currentSelection = selectedItemsForAdjudication[supplierId] || [];
        const isSelected = currentSelection.includes(materialId);
        
        const newSelection = isSelected 
            ? currentSelection.filter(id => id !== materialId)
            : [...currentSelection, materialId];
            
        setSelectedItemsForAdjudication({
            ...selectedItemsForAdjudication,
            [supplierId]: newSelection
        });
    };

    // Initialize checkboxes with Best Price logic when RFQ changes
    useEffect(() => {
        if(selectedRfq && selectedRfq.status === OrderStatus.QUOTED) {
             const bestPrices = calculateBestPrices(selectedRfq);
             const initialSelection: Record<string, string[]> = {};
             
             selectedRfq.quotes.forEach(quote => {
                 const bestItems = quote.items?.filter(qi => {
                     // Check if this supplier has the best price for this item
                     return qi.unitPrice === bestPrices[qi.materialId];
                 }).map(qi => qi.materialId) || [];
                 initialSelection[quote.supplierId] = bestItems;
             });
             setSelectedItemsForAdjudication(initialSelection);
        }
    }, [selectedRfq]);


    // Calculate best prices map: { materialId: minPrice }
    const calculateBestPrices = (rfq: RFQ) => {
        const bestPrices: {[key: string]: number} = {};
        
        // Iterate over all materials requested in the RFQ
        rfq.items.forEach(requestedItem => {
            let minPrice = Infinity;
            
            // Check this material across all quotes
            rfq.quotes.forEach(quote => {
                // Find if this quote has a price for the material
                const quoteItem = quote.items?.find(qi => qi.materialId === requestedItem.materialId);
                if (quoteItem && quoteItem.unitPrice > 0) {
                    if (quoteItem.unitPrice < minPrice) {
                        minPrice = quoteItem.unitPrice;
                    }
                }
            });
            
            if (minPrice !== Infinity) {
                bestPrices[requestedItem.materialId] = minPrice;
            }
        });
        return bestPrices;
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
                    <span className={`font-bold text-slate-700 px-3 py-1 rounded-lg ${
                        selectedRfq.status === OrderStatus.DRAFT ? 'bg-slate-200 text-slate-600' :
                        selectedRfq.status === OrderStatus.PENDING_APPROVAL ? 'bg-orange-100 text-orange-700' : 
                        'bg-blue-100 text-blue-700'}`
                    }>
                        {selectedRfq.status}
                    </span>
                </div>

                {/* DRAFT MODE */}
                {selectedRfq.status === OrderStatus.DRAFT && (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                        <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
                        <h4 className="text-lg font-bold text-slate-700">Solicitud en Borrador</h4>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">Esta solicitud aún no ha sido enviada a los proveedores. Puede editar los items, eliminar o agregar nuevos.</p>
                        
                        <div className="flex justify-center gap-4">
                             <button 
                                onClick={() => onEditDraft(selectedRfq)}
                                className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-50 shadow-sm flex items-center font-bold"
                             >
                                <Edit2 size={18} className="mr-2"/> Editar Borrador
                             </button>
                             <button 
                                onClick={() => handleSendDraft(selectedRfq)}
                                className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-blue-600 shadow-md flex items-center font-bold"
                            >
                                <Mail size={18} className="mr-2"/> Enviar a Proveedores
                            </button>
                        </div>
                    </div>
                )}

                {/* SIMULATION (SENT) */}
                {selectedRfq.status === OrderStatus.SENT && (
                    <div className="space-y-4">
                         {selectedRfq.selectedSuppliers.map((s) => {
                                const supplierItems = selectedRfq.items.filter(i => i.targetSupplierIds?.includes(s.id));
                                const currentTotal = supplierItems.reduce((acc, item) => {
                                    const price = parseFloat(tempUnitPrices[s.id]?.[item.materialId] || '0');
                                    return acc + (price * item.quantity);
                                }, 0);

                                return (
                                    <div key={s.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800">{s.name}</h4>
                                            <input 
                                                type="text" 
                                                className="border border-slate-300 rounded px-3 py-1 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-accent outline-none" 
                                                placeholder="Nro. Presupuesto"
                                                onChange={(e) => setTempReferences({...tempReferences, [s.id]: e.target.value})}
                                            />
                                        </div>
                                        <div className="p-0 bg-white">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Ítem</th>
                                                        <th className="px-4 py-2 text-center">Cant.</th>
                                                        <th className="px-4 py-2 text-right">Precio Unit.</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {supplierItems.map((i, iIdx) => {
                                                        const unitPrice = tempUnitPrices[s.id]?.[i.materialId] || '';
                                                        return (
                                                            <tr key={iIdx} className="border-b border-slate-50">
                                                                <td className="px-4 py-2">{i.description}</td>
                                                                <td className="px-4 py-2 text-center">x{i.quantity}</td>
                                                                <td className="px-4 py-2 text-right">
                                                                    <input 
                                                                        type="number" 
                                                                        className="w-32 border border-slate-300 rounded px-2 py-1 text-right bg-white text-slate-900 focus:ring-accent outline-none"
                                                                        placeholder="0.00"
                                                                        value={unitPrice}
                                                                        onChange={(e) => handleUnitPriceChange(s.id, i.materialId, e.target.value)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-slate-50">
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-2 text-right font-bold">Total:</td>
                                                        <td className="px-4 py-2 text-right font-bold">${currentTotal.toLocaleString()}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        <div className="flex justify-end mt-6">
                            <button onClick={() => handleLoadPrices(selectedRfq)} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 shadow-md transition-all font-medium flex items-center">
                                <Save size={18} className="mr-2"/> Guardar Cotizaciones
                            </button>
                        </div>
                    </div>
                )}

                {/* QUOTED MODE (Bubbles) */}
                {selectedRfq.status === OrderStatus.QUOTED && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {selectedRfq.quotes.map(q => {
                                // Filter items that are relevant for this quote (not yet adjudicated elsewhere, though logic handles split at action time)
                                // In this view, we show all items available to be adjudicated from this quote.
                                
                                const isEditing = editingSupplierId === q.supplierId;
                                const bestPrices = calculateBestPrices(selectedRfq);
                                const selection = selectedItemsForAdjudication[q.supplierId] || [];
                                
                                // Calculate total of selected items
                                const selectedTotal = q.items?.reduce((acc, item) => {
                                    if(selection.includes(item.materialId)) {
                                        return acc + (item.unitPrice * (selectedRfq.items.find(ri => ri.materialId === item.materialId)?.quantity || 0));
                                    }
                                    return acc;
                                }, 0) || 0;

                                if (isEditing) {
                                    return (
                                        <div key={q.supplierId} className="border border-blue-300 rounded-xl bg-white shadow-lg p-4 relative">
                                            <div className="flex justify-between mb-4">
                                                <h4 className="font-bold">{q.supplierName}</h4>
                                                <button onClick={() => handleSaveEdit(selectedRfq, q.supplierId)} className="text-green-600"><Save size={20}/></button>
                                            </div>
                                            <div className="mb-3">
                                                <label className="text-xs text-slate-500">Ref. Cotización</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full border rounded px-2 py-1 bg-white"
                                                    value={tempReferences[q.supplierId] || ''}
                                                    onChange={(e) => setTempReferences({...tempReferences, [q.supplierId]: e.target.value})}
                                                />
                                            </div>
                                            {selectedRfq.items.filter(i => i.targetSupplierIds?.includes(q.supplierId)).map(item => (
                                                <div key={item.materialId} className="mb-2">
                                                    <label className="text-xs text-slate-500 block truncate">{item.description}</label>
                                                    <input 
                                                        type="number" 
                                                        className="w-full border rounded px-2 py-1 bg-white text-right"
                                                        value={tempUnitPrices[q.supplierId]?.[item.materialId] || ''}
                                                        onChange={(e) => handleUnitPriceChange(q.supplierId, item.materialId, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )
                                }

                                return (
                                    <div key={q.supplierId} className={`flex flex-col rounded-xl bg-white shadow-sm border overflow-hidden border-slate-200`}>
                                        {/* Header Bubble */}
                                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{q.supplierName}</h4>
                                                <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                    <FileDigit size={12} className="mr-1"/> Ref: <span className="font-mono font-semibold ml-1">{q.quoteReference || 'S/N'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content Bubble */}
                                        <div className="p-4 flex-1">
                                            <div className="flex justify-between items-end mb-4">
                                                 <div className="text-3xl font-bold text-slate-800 tracking-tight">${q.price.toLocaleString()}</div>
                                                 <div className="text-xs text-slate-500 mb-1">Total Cotizado</div>
                                            </div>
                                            
                                            {/* Item Details with Checkboxes */}
                                            <div className="space-y-2 mb-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1 flex justify-between">
                                                    <span>Selección de Ítems</span>
                                                    <span>Precio</span>
                                                </p>
                                                {selectedRfq.items.filter(i => i.targetSupplierIds?.includes(q.supplierId)).map(item => {
                                                     const quoteItem = q.items?.find(qi => qi.materialId === item.materialId);
                                                     const unitPrice = quoteItem ? quoteItem.unitPrice : 0;
                                                     const isBestPrice = unitPrice > 0 && unitPrice === bestPrices[item.materialId];
                                                     const isSelected = selection.includes(item.materialId);

                                                     return (
                                                         <div key={item.materialId} 
                                                            className={`flex justify-between items-center text-sm p-1 rounded cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}
                                                            onClick={() => toggleAdjudicationItem(q.supplierId, item.materialId)}
                                                         >
                                                             <div className="flex items-center w-2/3">
                                                                <div className={`mr-2 ${isSelected ? 'text-accent' : 'text-slate-300'}`}>
                                                                    {isSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                                                                </div>
                                                                <span className="truncate text-slate-600" title={item.description}>{item.description}</span>
                                                             </div>
                                                             <div className="flex items-center">
                                                                 <span className={`font-mono font-medium ${isBestPrice ? 'text-green-600' : 'text-slate-700'}`}>
                                                                     ${unitPrice.toLocaleString()}
                                                                 </span>
                                                                 <div className="w-5 ml-1 flex justify-center" title="Mejor precio unitario">
                                                                    {isBestPrice && <CheckCircle size={14} className="text-green-500" />}
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     )
                                                })}
                                            </div>

                                            <button onClick={() => handleStartEdit(q)} className="text-xs text-blue-600 hover:underline flex items-center mt-2">
                                                <Edit2 size={12} className="mr-1"/> Editar cotización
                                            </button>
                                        </div>

                                        {/* Footer Bubble / Action */}
                                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <span className="text-xs font-semibold text-slate-600">Total Seleccionado:</span>
                                                <span className="font-bold text-accent">${selectedTotal.toLocaleString()}</span>
                                            </div>
                                            <button 
                                                onClick={() => onSplitAdjudicate(selectedRfq, q.supplierId, selection, selectedTotal)}
                                                disabled={selectedTotal === 0}
                                                className={`w-full py-2.5 rounded-lg font-bold text-sm shadow-sm transition-transform active:scale-95 flex justify-center items-center ${
                                                    selectedTotal > 0
                                                    ? 'bg-accent text-white hover:bg-blue-600' 
                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                }`}
                                            >
                                                Adjudicar Seleccionados ({selection.length})
                                            </button>
                                        </div>
                                    </div>
                                )
                         })}
                    </div>
                )}
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-4">
            {rfqs.filter(r => [OrderStatus.DRAFT, OrderStatus.SENT, OrderStatus.QUOTED].includes(r.status)).map(rfq => (
                <div key={rfq.id} className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center space-x-3 mb-1">
                            <span className="font-bold text-slate-800 text-lg">{rfq.number}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                rfq.status === OrderStatus.SENT ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                rfq.status === OrderStatus.QUOTED ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                                {rfq.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">{rfq.items.length} items • {rfq.selectedSuppliers.length} proveedores</p>
                    </div>
                    <button 
                        onClick={() => setSelectedRfq(rfq)}
                        className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                        Gestionar <ArrowRight size={16} className="ml-2"/>
                    </button>
                </div>
            ))}
             {rfqs.filter(r => [OrderStatus.DRAFT, OrderStatus.SENT, OrderStatus.QUOTED].includes(r.status)).length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    No hay peticiones pendientes de gestión.
                </div>
             )}
        </div>
    );
};

// 3. Approval Tray
const ApprovalTray = ({ rfqs, onApprove, onRevert }: { rfqs: RFQ[], onApprove: (rfq: RFQ) => void, onRevert: (rfq: RFQ) => void }) => {
    return (
        <div className="space-y-4">
            {rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).map(rfq => {
                const winner = rfq.quotes.find(q => q.isSelected);
                return (
                    <div key={rfq.id} className="bg-white p-6 rounded-xl border-l-4 border-orange-500 shadow-sm">
                        <div className="flex justify-between mb-4">
                            <div>
                                <h4 className="font-bold text-lg">{rfq.number}</h4>
                                <p className="text-xs text-slate-500 mt-1">Items adjudicados: {rfq.items.length}</p>
                            </div>
                            <span className="text-orange-600 font-bold text-sm bg-orange-50 px-2 py-1 rounded h-fit">Pendiente Aprobación</span>
                        </div>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm text-slate-500">Proveedor Adjudicado:</p>
                                <p className="font-bold text-slate-800">{winner?.supplierName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-slate-900">${winner?.price.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        {/* Items Preview */}
                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 max-h-32 overflow-y-auto">
                            <ul className="list-disc pl-4 space-y-1">
                                {rfq.items.map(item => (
                                    <li key={item.materialId}>{item.description} (x{item.quantity})</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                             <button onClick={() => onRevert(rfq)} className="text-slate-500 hover:bg-slate-100 px-3 py-2 rounded text-sm font-medium flex items-center"><Undo2 size={16} className="mr-2"/> Reversar</button>
                             <button onClick={() => onApprove(rfq)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-bold flex items-center"><CheckCircle size={16} className="mr-2"/> Aprobar y Generar OC</button>
                        </div>
                    </div>
                )
            })}
             {rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    No hay aprobaciones pendientes.
                </div>
             )}
        </div>
    );
};

// 4. PO List
const PurchaseOrdersList = ({ rfqs }: { rfqs: RFQ[] }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="p-4">Nro OC</th>
                        <th className="p-4">Proveedor</th>
                        <th className="p-4 text-right">Total</th>
                        <th className="p-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {rfqs.filter(r => r.status === OrderStatus.CONVERTED_TO_PO).map(po => {
                        const winner = po.quotes.find(q => q.isSelected);
                        return (
                            <tr key={po.id} className="border-b">
                                <td className="p-4 font-bold">{po.number.replace('P-OFE', 'OC')}</td>
                                <td className="p-4">{winner?.supplierName}</td>
                                <td className="p-4 text-right font-bold">${winner?.price.toLocaleString()}</td>
                                <td className="p-4 text-center"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Enviada</span></td>
                            </tr>
                        )
                    })}
                </tbody>
             </table>
        </div>
    );
}

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
                <ShieldCheck className="mr-2" /> Esquema de Liberación
            </h3>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Nueva Regla</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Monto Mínimo</label>
                        <input type="number" className="w-full px-3 py-2 border rounded bg-white" value={min} onChange={(e) => setMin(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Monto Máximo</label>
                        <input type="number" className="w-full px-3 py-2 border rounded bg-white" value={max} onChange={(e) => setMax(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Aprobador</label>
                        <select className="w-full px-3 py-2 border rounded bg-white" value={approver} onChange={(e) => setApprover(e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAdd} className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800">Agregar</button>
                </div>
            </div>

            <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                    <tr>
                        <th className="text-left p-4">Rango</th>
                        <th className="text-left p-4">Aprobador</th>
                        <th className="text-right p-4">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {approvalRules.map(rule => (
                        <tr key={rule.id} className="border-b">
                            <td className="p-4">${rule.minAmount} - ${rule.maxAmount}</td>
                            <td className="p-4">{users.find(u => u.id === rule.approverId)?.name}</td>
                            <td className="p-4 text-right"><button onClick={() => deleteApprovalRule(rule.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- Main Wrappers ---

const ProcurementModule = () => {
    const [activeTab, setActiveTab] = useState<'MANAGE_RFQ' | 'APPROVAL' | 'PO_LIST' | 'SETTINGS'>('MANAGE_RFQ');
    const [rfqs, setRfqs] = useState<RFQ[]>([]);
    const [showNewForm, setShowNewForm] = useState(false);
    const [draftToEdit, setDraftToEdit] = useState<RFQ | undefined>(undefined);

    // Derived counts
    const pendingApprovals = rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).length;
    const activeRfqs = rfqs.filter(r => [OrderStatus.DRAFT, OrderStatus.SENT, OrderStatus.QUOTED].includes(r.status)).length;

    const handleCreateRFQ = (newRfq: RFQ) => {
        // If editing, replace. If new, add.
        const existingIndex = rfqs.findIndex(r => r.id === newRfq.id);
        if (existingIndex >= 0) {
            const updated = [...rfqs];
            updated[existingIndex] = newRfq;
            setRfqs(updated);
        } else {
            setRfqs([newRfq, ...rfqs]);
        }
        setShowNewForm(false);
        setDraftToEdit(undefined);
    };

    const handleEditDraft = (rfq: RFQ) => {
        setDraftToEdit(rfq);
        setShowNewForm(true);
    };

    const handleUpdateRFQ = (updatedRfq: RFQ) => {
        setRfqs(rfqs.map(r => r.id === updatedRfq.id ? updatedRfq : r));
    };

    const handleSplitAdjudicate = (originalRfq: RFQ, supplierId: string, itemIds: string[], amount: number) => {
        // 1. Create the new Child PO (Approval)
        const { approvalRules, users } = { approvalRules: [], users: [] }; // Mock access, logic handled in component usually but simplifying here
        // We need users context here really, but let's assume simple approval for now or pass context down.
        // For simplicity, hardcoded admin fallback if hook not present in this scope.
        
        const adjudicatedItems = originalRfq.items.filter(i => itemIds.includes(i.materialId));
        const quote = originalRfq.quotes.find(q => q.supplierId === supplierId);
        
        const newOrder: RFQ = {
            ...originalRfq,
            id: `PO-REQ-${Date.now()}`, // New ID
            items: adjudicatedItems,
            quotes: originalRfq.quotes.map(q => {
                 if(q.supplierId === supplierId) {
                     return { ...q, isSelected: true, price: amount }; // Mark winner only on the child
                 }
                 return { ...q, isSelected: false };
            }),
            winnerSupplierId: supplierId,
            status: OrderStatus.PENDING_APPROVAL,
            selectedSuppliers: originalRfq.selectedSuppliers.filter(s => s.id === supplierId) // Only relevant supplier
        };

        // 2. Update the Original RFQ (Remove adjudicated items)
        const remainingItems = originalRfq.items.filter(i => !itemIds.includes(i.materialId));
        
        let updatedOriginal: RFQ | null = null;
        if (remainingItems.length > 0) {
            updatedOriginal = {
                ...originalRfq,
                items: remainingItems,
                // Recalculate quote prices for remaining items? 
                // In a real app, yes. Here visually we just rely on the component re-render logic.
                // But we should clean up the quotes in the original to reflect reduced scope?
                // For simplicity, we keep full quotes but the UI filters items based on `items` array.
            };
        }

        // 3. Update State
        if (updatedOriginal) {
            setRfqs(prev => [...prev.map(r => r.id === originalRfq.id ? updatedOriginal! : r), newOrder]);
        } else {
            // Original RFQ is fully consumed
            setRfqs(prev => [...prev.filter(r => r.id !== originalRfq.id), newOrder]);
        }

        alert("Items adjudicados correctamente. Se generó una orden pendiente de aprobación.");
    };
    
    // Approval Handlers
    const handleApprove = (rfq: RFQ) => {
        const approved = { ...rfq, status: OrderStatus.CONVERTED_TO_PO };
        setRfqs(rfqs.map(r => r.id === rfq.id ? approved : r));
        alert("Orden de Compra generada y enviada.");
    };

    const handleRevert = (rfq: RFQ) => {
         // Reverting a split PO is complex. For now, just set it back to Quoted but it's detached from original.
         // A more robust system would merge it back. 
         const reverted = { 
             ...rfq, 
             status: OrderStatus.QUOTED, 
             winnerSupplierId: undefined, 
             quotes: rfq.quotes.map(q => ({...q, isSelected: false})) 
         };
         setRfqs(rfqs.map(r => r.id === rfq.id ? reverted : r));
    };

    if(showNewForm) {
        return <NewRFQForm initialData={draftToEdit} onSave={handleCreateRFQ} onCancel={() => { setShowNewForm(false); setDraftToEdit(undefined); }} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Gestión de Compras</h2>
                <button 
                    onClick={() => setShowNewForm(true)} 
                    className="bg-accent text-white px-4 py-2 rounded-lg font-medium shadow-md hover:bg-blue-600 flex items-center"
                >
                    <Plus size={18} className="mr-2"/> Crear Petición (RFQ)
                </button>
             </div>

             {/* Dashboard Navigation Cards */}
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

                 <button onClick={() => setActiveTab('SETTINGS')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'SETTINGS' ? 'bg-white border-slate-800 shadow-md ring-1 ring-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <Settings size={24} className={`mb-2 ${activeTab === 'SETTINGS' ? 'text-slate-800' : 'text-slate-400'}`} />
                    <span className="font-semibold text-slate-700">Configuración</span>
                 </button>
             </div>

             <div className="min-h-[400px]">
                {activeTab === 'MANAGE_RFQ' && <RFQManagement rfqs={rfqs} onUpdate={handleUpdateRFQ} onEditDraft={handleEditDraft} onSplitAdjudicate={handleSplitAdjudicate} />}
                {activeTab === 'APPROVAL' && <ApprovalTray rfqs={rfqs} onApprove={handleApprove} onRevert={handleRevert} />}
                {activeTab === 'PO_LIST' && <PurchaseOrdersList rfqs={rfqs} />}
                {activeTab === 'SETTINGS' && <ApprovalSettings />}
             </div>
        </div>
    );
};

const SalesModule = () => (
    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-slate-200">
        <TrendingUp size={48} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-600">Módulo de Ventas</h3>
        <p className="text-slate-400">En desarrollo...</p>
    </div>
);

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
