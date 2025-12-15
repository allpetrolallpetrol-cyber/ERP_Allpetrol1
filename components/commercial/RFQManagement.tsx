
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, ArrowLeft, Mail, Edit2, CheckCircle, Save, FileDigit, CheckSquare, Square, AlertCircle, DollarSign, Hash, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { RFQ, OrderStatus, SupplierQuote, QuoteItemDetail, RFQItem } from '../../types';

export const RFQManagement = ({ rfqs, onUpdate, onEditDraft, onSplitAdjudicate }: { rfqs: RFQ[], onUpdate: (rfq: RFQ) => void, onEditDraft: (rfq: RFQ) => void, onSplitAdjudicate: (originalRfq: RFQ, supplierId: string, itemIds: string[], amount: number) => void }) => {
    const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
    const [selectedItemsForAdjudication, setSelectedItemsForAdjudication] = useState<Record<string, string[]>>({}); // supplierId -> [materialIds]

    // Sync state: If selected RFQ status changes to something not visible here (like CONVERTED_TO_PO), close detail
    useEffect(() => {
        if (selectedRfq) {
            const found = rfqs.find(r => r.id === selectedRfq.id);
            if (found && found !== selectedRfq) {
                if (found.status === OrderStatus.CONVERTED_TO_PO) {
                    setSelectedRfq(null); // Close if it became a PO
                } else {
                    setSelectedRfq(found);
                }
            } else if (!found) {
                setSelectedRfq(null);
            }
        }
    }, [rfqs, selectedRfq]);
    
    // Store unit prices: { supplierId: { uniqueKey: price } }
    const [tempUnitPrices, setTempUnitPrices] = useState<Record<string, Record<string, string>>>({}); 
    const [tempReferences, setTempReferences] = useState<{[key: string]: string}>({}); 
    const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

    const { users, approvalRules, suppliers } = useMasterData();

    // Helper to get a unique key for an item (Material ID or Description for free text)
    const getItemKey = (item: RFQItem | QuoteItemDetail) => {
        return item.materialId || item.description || 'unknown';
    };

    // Filter Logic: Explicitly exclude converted orders
    const visibleRfqs = rfqs.filter(r => [OrderStatus.DRAFT, OrderStatus.SENT, OrderStatus.QUOTED].includes(r.status));

    // --- RECOVERY LOGIC ---
    // Calculates which suppliers should be displayed based on the RFQ data.
    // If selectedSuppliers is missing, it reconstructs it from the items' targetSupplierIds.
    const effectiveSuppliers = useMemo(() => {
        if (!selectedRfq) return [];
        
        // 1. If explicit list exists and is valid, use it.
        if (selectedRfq.selectedSuppliers && selectedRfq.selectedSuppliers.length > 0) {
            return selectedRfq.selectedSuppliers;
        }

        // 2. Fallback: Recover from Items
        const recoveredIds = new Set<string>();
        selectedRfq.items.forEach(item => {
            if (item.targetSupplierIds) {
                item.targetSupplierIds.forEach(id => recoveredIds.add(id));
            }
        });

        if (recoveredIds.size > 0) {
            return suppliers
                .filter(s => recoveredIds.has(s.id))
                .map(s => ({
                    id: s.id,
                    name: (s as any).name || s.businessName || 'Proveedor (Recuperado)'
                }));
        }

        return [];
    }, [selectedRfq, suppliers]);


    const handleUnitPriceChange = (supplierId: string, itemKey: string, value: string) => {
        setTempUnitPrices(prev => ({
            ...prev,
            [supplierId]: {
                ...(prev[supplierId] || {}),
                [itemKey]: value
            }
        }));
    };

    const handleSendDraft = (rfq: RFQ) => {
        const sentRfq = { ...rfq, status: OrderStatus.SENT };
        onUpdate(sentRfq);
        setSelectedRfq(null);
        alert(`📧 Enviando solicitudes de cotización a:\n${rfq.selectedSuppliers.map(s => s.name).join('\n')}`);
    };

    const handleRevertToDraft = (rfq: RFQ) => {
        const draft = { ...rfq, status: OrderStatus.DRAFT };
        onUpdate(draft);
        // We call onEditDraft to immediately switch to edit mode
        onEditDraft(draft);
    };

    const handleLoadPrices = (rfq: RFQ) => {
        // Use effectiveSuppliers to ensure we capture data even if original selectedSuppliers was empty
        const newQuotes: SupplierQuote[] = effectiveSuppliers.map(s => {
            // Filter logic reused: Show item if target includes supplier OR if no targets defined (global item)
            const supplierItems = rfq.items.filter(i => 
                !i.targetSupplierIds || 
                i.targetSupplierIds.length === 0 || 
                i.targetSupplierIds.includes(s.id)
            );

            const quoteItems: QuoteItemDetail[] = [];
            let totalQuotePrice = 0;

            supplierItems.forEach(item => {
                const key = getItemKey(item);
                const unitPrice = parseFloat(tempUnitPrices[s.id]?.[key] || '0');
                totalQuotePrice += unitPrice * item.quantity;
                quoteItems.push({ 
                    materialId: item.materialId || '', // Empty string if free text
                    description: item.description,     // Save description for free text matching
                    unitPrice 
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
        
        // When saving, we also fix the selectedSuppliers field if it was missing
        const updated = { 
            ...rfq, 
            quotes: newQuotes, 
            selectedSuppliers: effectiveSuppliers,
            status: OrderStatus.QUOTED 
        };
        
        onUpdate(updated);
        setSelectedRfq(null); // Return to list
    };

    const handleStartEdit = (quote: SupplierQuote) => {
        setEditingSupplierId(quote.supplierId);
        const prices: Record<string, string> = {};
        quote.items?.forEach(item => {
            const key = getItemKey(item);
            prices[key] = item.unitPrice.toString();
        });
        setTempUnitPrices({ [quote.supplierId]: prices });
        setTempReferences({ [quote.supplierId]: quote.quoteReference || '' });
    };

    const handleSaveEdit = (rfq: RFQ, supplierId: string) => {
        const updatedQuotes = rfq.quotes.map(q => {
            if (q.supplierId === supplierId) {
                const supplierItems = rfq.items.filter(i => 
                    !i.targetSupplierIds || 
                    i.targetSupplierIds.length === 0 || 
                    i.targetSupplierIds.includes(supplierId)
                );

                const newItems: QuoteItemDetail[] = [];
                let total = 0;
                
                supplierItems.forEach(item => {
                     const key = getItemKey(item);
                     const unitPrice = parseFloat(tempUnitPrices[supplierId]?.[key] || '0');
                     total += unitPrice * item.quantity;
                     newItems.push({ 
                        materialId: item.materialId || '',
                        description: item.description,
                        unitPrice 
                     });
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

    const toggleAdjudicationItem = (supplierId: string, itemKey: string) => {
        const currentSelection = selectedItemsForAdjudication[supplierId] || [];
        const isSelected = currentSelection.includes(itemKey);
        
        const newSelection = isSelected 
            ? currentSelection.filter(id => id !== itemKey)
            : [...currentSelection, itemKey];
            
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
                     const key = getItemKey(qi);
                     // Check if this supplier has the best price for this item
                     return qi.unitPrice > 0 && qi.unitPrice === bestPrices[key];
                 }).map(qi => getItemKey(qi)) || [];
                 initialSelection[quote.supplierId] = bestItems;
             });
             setSelectedItemsForAdjudication(initialSelection);
        }
    }, [selectedRfq]);


    // Calculate best prices map: { itemKey: minPrice }
    const calculateBestPrices = (rfq: RFQ) => {
        const bestPrices: {[key: string]: number} = {};
        
        // Iterate over all materials requested in the RFQ
        rfq.items.forEach(requestedItem => {
            let minPrice = Infinity;
            const reqKey = getItemKey(requestedItem);
            
            // Check this material across all quotes
            rfq.quotes.forEach(quote => {
                // Find if this quote has a price for the material (match by ID or Description)
                const quoteItem = quote.items?.find(qi => getItemKey(qi) === reqKey);
                if (quoteItem && quoteItem.unitPrice > 0) {
                    if (quoteItem.unitPrice < minPrice) {
                        minPrice = quoteItem.unitPrice;
                    }
                }
            });
            
            if (minPrice !== Infinity) {
                bestPrices[reqKey] = minPrice;
            }
        });
        return bestPrices;
    };


    if (selectedRfq) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in">
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
                    <div className="space-y-6">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                             <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start flex-1">
                                <AlertCircle className="text-blue-600 mr-2 mt-0.5" size={18} />
                                <div className="text-sm text-blue-800">
                                    <strong>Carga de Precios:</strong> Ingrese a continuación los valores recibidos por cada proveedor. Asegúrese de completar el número de presupuesto y los precios unitarios.
                                </div>
                             </div>
                             
                             <button 
                                onClick={() => handleRevertToDraft(selectedRfq)}
                                className="text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center transition-colors shadow-sm"
                             >
                                <RefreshCcw size={14} className="mr-2"/> Corregir / Volver a Borrador
                             </button>
                         </div>

                         {effectiveSuppliers.length === 0 && (
                             <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                                 <AlertTriangle className="mx-auto text-orange-400 mb-2" size={32} />
                                 <p className="text-slate-500 font-medium">No se encontraron proveedores asignados a esta RFQ.</p>
                                 <p className="text-xs text-slate-400 mb-4">Es probable que se haya enviado sin asignar proveedores a los items.</p>
                                 <button onClick={() => handleRevertToDraft(selectedRfq)} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-200">
                                     Volver a Borrador para Corregir
                                 </button>
                             </div>
                         )}

                         {effectiveSuppliers.map((s) => {
                                // Robust filtering: Include item if supplier is target OR if item has no targets (global/legacy)
                                const supplierItems = selectedRfq.items.filter(i => 
                                    !i.targetSupplierIds || 
                                    i.targetSupplierIds.length === 0 || 
                                    i.targetSupplierIds.includes(s.id)
                                );

                                const currentTotal = supplierItems.reduce((acc, item) => {
                                    const key = getItemKey(item);
                                    const price = parseFloat(tempUnitPrices[s.id]?.[key] || '0');
                                    return acc + (price * item.quantity);
                                }, 0);

                                return (
                                    <div key={s.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white mb-6">
                                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <h4 className="font-bold text-slate-800 flex items-center text-lg">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs mr-2 border border-slate-300">
                                                    {s.name.substring(0,2).toUpperCase()}
                                                </div>
                                                {s.name}
                                            </h4>
                                            
                                            <div className="flex items-center w-full sm:w-auto">
                                                <div className="relative w-full sm:w-64">
                                                    <Hash size={14} className="absolute left-3 top-3 text-slate-400" />
                                                    <input 
                                                        type="text" 
                                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-accent outline-none shadow-sm placeholder-slate-400" 
                                                        placeholder="Nro. Presupuesto / Cotización"
                                                        value={tempReferences[s.id] || ''}
                                                        onChange={(e) => setTempReferences({...tempReferences, [s.id]: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left">Ítem / Material</th>
                                                        <th className="px-6 py-3 text-center">Cantidad</th>
                                                        <th className="px-6 py-3 text-right">Precio Unitario ($)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {supplierItems.map((i, iIdx) => {
                                                        const key = getItemKey(i);
                                                        const unitPrice = tempUnitPrices[s.id]?.[key] || '';
                                                        return (
                                                            <tr key={iIdx} className="hover:bg-slate-50/50">
                                                                <td className="px-6 py-3 font-medium text-slate-700">
                                                                    {i.description}
                                                                    {!i.materialId && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1 rounded">Texto Libre</span>}
                                                                </td>
                                                                <td className="px-6 py-3 text-center bg-slate-50/30">
                                                                    <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">x{i.quantity}</span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <div className="relative inline-block w-40">
                                                                        <span className="absolute left-3 top-2 text-slate-400 z-10">$</span>
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full pl-6 pr-3 py-1.5 border border-slate-300 rounded-md text-right bg-white text-slate-900 font-bold focus:ring-2 focus:ring-accent outline-none shadow-sm relative z-0"
                                                                            placeholder="0.00"
                                                                            value={unitPrice}
                                                                            onChange={(e) => handleUnitPriceChange(s.id, key, e.target.value)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {supplierItems.length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic bg-slate-50/50">
                                                                No hay items asignados a este proveedor en esta petición.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="bg-slate-50 border-t border-slate-200">
                                                    <tr>
                                                        <td colSpan={2} className="px-6 py-3 text-right font-bold text-slate-600">Total Estimado:</td>
                                                        <td className="px-6 py-3 text-right font-bold text-lg text-slate-900">${currentTotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        
                        {effectiveSuppliers.length > 0 && (
                            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                                <button onClick={() => handleLoadPrices(selectedRfq)} className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all font-bold flex items-center transform active:scale-95">
                                    <Save size={20} className="mr-2"/> Guardar y Procesar Cotizaciones
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* QUOTED MODE (Bubbles) */}
                {selectedRfq.status === OrderStatus.QUOTED && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {selectedRfq.quotes.map(q => {
                                const isEditing = editingSupplierId === q.supplierId;
                                const bestPrices = calculateBestPrices(selectedRfq);
                                const selection = selectedItemsForAdjudication[q.supplierId] || [];
                                
                                // Calculate total of selected items
                                const selectedTotal = q.items?.reduce((acc, item) => {
                                    const key = getItemKey(item);
                                    if(selection.includes(key)) {
                                        // Find qty from original rfq items (matching by key)
                                        const rfqItem = selectedRfq.items.find(ri => getItemKey(ri) === key);
                                        return acc + (item.unitPrice * (rfqItem?.quantity || 0));
                                    }
                                    return acc;
                                }, 0) || 0;

                                if (isEditing) {
                                    return (
                                        <div key={q.supplierId} className="border border-blue-300 rounded-xl bg-white shadow-lg p-4 relative animate-in fade-in">
                                            <div className="flex justify-between mb-4">
                                                <h4 className="font-bold">{q.supplierName}</h4>
                                                <button onClick={() => handleSaveEdit(selectedRfq, q.supplierId)} className="text-green-600 bg-green-50 p-1 rounded hover:bg-green-100"><Save size={20}/></button>
                                            </div>
                                            <div className="mb-3">
                                                <label className="text-xs text-slate-500 font-bold">Ref. Cotización</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full border rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                                                    value={tempReferences[q.supplierId] || ''}
                                                    onChange={(e) => setTempReferences({...tempReferences, [q.supplierId]: e.target.value})}
                                                />
                                            </div>
                                            {selectedRfq.items.filter(i => !i.targetSupplierIds || i.targetSupplierIds.length === 0 || i.targetSupplierIds.includes(q.supplierId)).map(item => {
                                                const key = getItemKey(item);
                                                return (
                                                    <div key={key} className="mb-2">
                                                        <label className="text-xs text-slate-500 block truncate font-medium">{item.description}</label>
                                                        <input 
                                                            type="number" 
                                                            className="w-full border rounded px-2 py-1 bg-white text-right focus:ring-2 focus:ring-blue-200 outline-none"
                                                            value={tempUnitPrices[q.supplierId]?.[key] || ''}
                                                            onChange={(e) => handleUnitPriceChange(q.supplierId, key, e.target.value)}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                }

                                return (
                                    <div key={q.supplierId} className={`flex flex-col rounded-xl bg-white shadow-sm border overflow-hidden border-slate-200 transition-shadow hover:shadow-md`}>
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
                                                {selectedRfq.items.filter(i => !i.targetSupplierIds || i.targetSupplierIds.length === 0 || i.targetSupplierIds.includes(q.supplierId)).map(item => {
                                                     const key = getItemKey(item);
                                                     const quoteItem = q.items?.find(qi => getItemKey(qi) === key);
                                                     const unitPrice = quoteItem ? quoteItem.unitPrice : 0;
                                                     const isBestPrice = unitPrice > 0 && unitPrice === bestPrices[key];
                                                     const isSelected = selection.includes(key);

                                                     return (
                                                         <div key={key} 
                                                            className={`flex justify-between items-center text-sm p-1.5 rounded cursor-pointer transition-colors border ${isSelected ? 'bg-blue-50 border-blue-100' : 'bg-white hover:bg-slate-50 border-transparent'}`}
                                                            onClick={() => toggleAdjudicationItem(q.supplierId, key)}
                                                         >
                                                             <div className="flex items-center w-2/3">
                                                                <div className={`mr-2 ${isSelected ? 'text-accent' : 'text-slate-300'}`}>
                                                                    {isSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                                                                </div>
                                                                <span className="truncate text-slate-600 text-xs" title={item.description}>{item.description}</span>
                                                             </div>
                                                             <div className="flex items-center">
                                                                 <span className={`font-mono font-medium text-xs ${isBestPrice ? 'text-green-600' : 'text-slate-700'}`}>
                                                                     ${unitPrice.toLocaleString()}
                                                                 </span>
                                                                 <div className="w-5 ml-1 flex justify-center" title="Mejor precio unitario">
                                                                    {isBestPrice && <CheckCircle size={12} className="text-green-500" />}
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     )
                                                })}
                                            </div>

                                            <button onClick={() => handleStartEdit(q)} className="text-xs text-blue-600 hover:underline flex items-center mt-4">
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
                                                onClick={() => {
                                                    // Need to pass material IDs back to parent. For free text, we need a way to identify them.
                                                    // The parent expects materialIds[]. Since free text don't have IDs, this might be tricky if we don't map back.
                                                    // For now, we pass the selection keys (which are materialId or Description)
                                                    // The parent function `onSplitAdjudicate` needs to handle this.
                                                    // NOTE: Assuming onSplitAdjudicate can handle Keys or we filter items here.
                                                    onSplitAdjudicate(selectedRfq, q.supplierId, selection, selectedTotal);
                                                }}
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
            {visibleRfqs.map(rfq => (
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
             {visibleRfqs.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    No hay peticiones pendientes de gestión.
                </div>
             )}
        </div>
    );
};
