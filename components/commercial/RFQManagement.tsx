
import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Mail, Edit2, CheckCircle, Save, FileDigit, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { RFQ, OrderStatus, SupplierQuote, QuoteItemDetail } from '../../types';

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
    
    // Store unit prices: { supplierId: { materialId: price } }
    const [tempUnitPrices, setTempUnitPrices] = useState<Record<string, Record<string, string>>>({}); 
    const [tempReferences, setTempReferences] = useState<{[key: string]: string}>({}); 
    const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

    const { users, approvalRules } = useMasterData();

    // Filter Logic: Explicitly exclude converted orders
    const visibleRfqs = rfqs.filter(r => [OrderStatus.DRAFT, OrderStatus.SENT, OrderStatus.QUOTED].includes(r.status));

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
