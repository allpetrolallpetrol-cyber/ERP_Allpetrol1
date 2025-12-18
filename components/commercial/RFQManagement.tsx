
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
    const effectiveSuppliers = useMemo(() => {
        if (!selectedRfq) return [];
        if (selectedRfq.selectedSuppliers && selectedRfq.selectedSuppliers.length > 0) {
            return selectedRfq.selectedSuppliers;
        }
        const recoveredIds = new Set<string>();
        selectedRfq.items.forEach(item => {
            if (item.targetSupplierIds) {
                item.targetSupplierIds.forEach(id => recoveredIds.add(id));
            }
        });
        if (recoveredIds.size > 0) {
            return suppliers.filter(s => recoveredIds.has(s.id)).map(s => ({
                id: s.id,
                name: (s as any).name || s.businessName || 'Proveedor'
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
        onEditDraft(draft);
    };

    const handleLoadPrices = (rfq: RFQ) => {
        const newQuotes: SupplierQuote[] = effectiveSuppliers.map(s => {
            const supplierItems = rfq.items.filter(i => !i.targetSupplierIds || i.targetSupplierIds.length === 0 || i.targetSupplierIds.includes(s.id));
            const quoteItems: QuoteItemDetail[] = [];
            let totalQuotePrice = 0;
            supplierItems.forEach(item => {
                const key = getItemKey(item);
                const unitPrice = parseFloat(tempUnitPrices[s.id]?.[key] || '0');
                totalQuotePrice += unitPrice * item.quantity;
                quoteItems.push({ materialId: item.materialId || '', description: item.description, unitPrice });
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
        const updated = { ...rfq, quotes: newQuotes, selectedSuppliers: effectiveSuppliers, status: OrderStatus.QUOTED };
        onUpdate(updated);
        setSelectedRfq(null); 
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
                const supplierItems = rfq.items.filter(i => !i.targetSupplierIds || i.targetSupplierIds.length === 0 || i.targetSupplierIds.includes(supplierId));
                const newItems: QuoteItemDetail[] = [];
                let total = 0;
                supplierItems.forEach(item => {
                     const key = getItemKey(item);
                     const unitPrice = parseFloat(tempUnitPrices[supplierId]?.[key] || '0');
                     total += unitPrice * item.quantity;
                     newItems.push({ materialId: item.materialId || '', description: item.description, unitPrice });
                });
                return { ...q, quoteReference: tempReferences[supplierId], items: newItems, price: total };
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
        const newSelection = isSelected ? currentSelection.filter(id => id !== itemKey) : [...currentSelection, itemKey];
        setSelectedItemsForAdjudication({ ...selectedItemsForAdjudication, [supplierId]: newSelection });
    };

    useEffect(() => {
        if(selectedRfq && selectedRfq.status === OrderStatus.QUOTED) {
             const bestPrices: {[key: string]: number} = {};
             selectedRfq.items.forEach(requestedItem => {
                let minPrice = Infinity;
                const reqKey = getItemKey(requestedItem);
                selectedRfq.quotes.forEach(quote => {
                    const quoteItem = quote.items?.find(qi => getItemKey(qi) === reqKey);
                    if (quoteItem && quoteItem.unitPrice > 0 && quoteItem.unitPrice < minPrice) minPrice = quoteItem.unitPrice;
                });
                if (minPrice !== Infinity) bestPrices[reqKey] = minPrice;
             });
             const initialSelection: Record<string, string[]> = {};
             selectedRfq.quotes.forEach(quote => {
                 const bestItems = quote.items?.filter(qi => {
                     const key = getItemKey(qi);
                     return qi.unitPrice > 0 && qi.unitPrice === bestPrices[key];
                 }).map(qi => getItemKey(qi)) || [];
                 initialSelection[quote.supplierId] = bestItems;
             });
             setSelectedItemsForAdjudication(initialSelection);
        }
    }, [selectedRfq]);

    if (selectedRfq) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in h-full flex flex-col overflow-hidden">
                <button onClick={() => setSelectedRfq(null)} className="mb-4 text-sm text-slate-500 hover:text-slate-800 flex items-center shrink-0"><ArrowRight className="rotate-180 mr-1" size={14}/> Volver al listado</button>
                <div className="flex justify-between items-start mb-6 border-b pb-4 shrink-0">
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

                <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                    {selectedRfq.status === OrderStatus.DRAFT && (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                            <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
                            <h4 className="text-lg font-bold text-slate-700">Solicitud en Borrador</h4>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">Esta solicitud aún no ha sido enviada. Puede corregir items o proveedores antes de lanzarla al mercado.</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => onEditDraft(selectedRfq)} className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-100">Editar</button>
                                <button onClick={() => handleSendDraft(selectedRfq)} className="bg-accent text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 shadow-md">Enviar RFQ</button>
                            </div>
                        </div>
                    )}

                    {selectedRfq.status === OrderStatus.SENT && (
                        <div className="space-y-6">
                            {effectiveSuppliers.map(s => {
                                const supplierItems = selectedRfq.items.filter(i => !i.targetSupplierIds || i.targetSupplierIds.length === 0 || i.targetSupplierIds.includes(s.id));
                                const currentTotal = supplierItems.reduce((acc, item) => {
                                    const key = getItemKey(item);
                                    const price = parseFloat(tempUnitPrices[s.id]?.[key] || '0');
                                    return acc + (price * item.quantity);
                                }, 0);
                                return (
                                    <div key={s.id} className="border rounded-xl bg-white shadow-sm overflow-hidden border-slate-200">
                                        <div className="bg-slate-50 p-4 border-b flex flex-wrap justify-between items-center gap-3">
                                            <h4 className="font-bold text-slate-800">{s.name}</h4>
                                            <input className="w-full sm:w-64 px-3 py-1.5 border rounded-lg text-sm" placeholder="Ref. Cotización / Presupuesto" value={tempReferences[s.id] || ''} onChange={e => setTempReferences({...tempReferences, [s.id]: e.target.value})} />
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead><tr className="bg-white text-slate-500 font-bold border-b"><th className="p-4 text-left">Item</th><th className="p-4 text-center">Cant.</th><th className="p-4 text-right">P.Unit ($)</th></tr></thead>
                                            <tbody>
                                                {supplierItems.map((i, idx) => (
                                                    <tr key={idx} className="border-b last:border-0"><td className="p-4 font-medium">{i.description}</td><td className="p-4 text-center bg-slate-50 font-mono">x{i.quantity}</td><td className="p-4 text-right"><input type="number" className="w-32 border rounded px-2 py-1 text-right font-bold" value={tempUnitPrices[s.id]?.[getItemKey(i)] || ''} onChange={e => handleUnitPriceChange(s.id, getItemKey(i), e.target.value)} /></td></tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-50"><tr className="font-bold"><td colSpan={2} className="p-4 text-right">Total:</td><td className="p-4 text-right text-lg">${currentTotal.toLocaleString()}</td></tr></tfoot>
                                        </table>
                                    </div>
                                );
                            })}
                            <div className="flex justify-end pt-4"><button onClick={() => handleLoadPrices(selectedRfq)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Guardar Cotizaciones</button></div>
                        </div>
                    )}

                    {selectedRfq.status === OrderStatus.QUOTED && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {selectedRfq.quotes.map(q => {
                                const selection = selectedItemsForAdjudication[q.supplierId] || [];
                                const total = q.items?.reduce((acc, it) => selection.includes(getItemKey(it)) ? acc + (it.unitPrice * (selectedRfq.items.find(ri => getItemKey(ri) === getItemKey(it))?.quantity || 0)) : acc, 0) || 0;
                                return (
                                    <div key={q.supplierId} className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
                                        <div className="p-4 bg-slate-50 border-b flex justify-between"><h4 className="font-bold text-slate-800">{q.supplierName}</h4><span className="text-xs font-mono">Ref: {q.quoteReference || 'N/A'}</span></div>
                                        <div className="p-4 flex-1">
                                            <div className="text-2xl font-bold mb-4">${q.price.toLocaleString()} <span className="text-xs font-normal text-slate-400 block">Total Cotizado</span></div>
                                            <div className="space-y-1.5">{selectedRfq.items.filter(i => !i.targetSupplierIds || i.targetSupplierIds.length === 0 || i.targetSupplierIds.includes(q.supplierId)).map(i => (
                                                <div key={getItemKey(i)} onClick={() => toggleAdjudicationItem(q.supplierId, getItemKey(i))} className={`p-2 rounded text-xs cursor-pointer border flex justify-between items-center ${selection.includes(getItemKey(i)) ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent'}`}>
                                                    <span className="truncate flex-1 mr-2">{i.description}</span>
                                                    <span className="font-mono font-bold">${q.items?.find(qi => getItemKey(qi) === getItemKey(i))?.unitPrice}</span>
                                                </div>
                                            ))}</div>
                                        </div>
                                        <div className="p-3 bg-slate-50 border-t flex justify-between items-center">
                                            <span className="text-xs font-bold">Sel: ${total.toLocaleString()}</span>
                                            <button onClick={() => onSplitAdjudicate(selectedRfq, q.supplierId, selection, total)} disabled={total === 0} className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50">Adjudicar</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {visibleRfqs.map(rfq => (
                    <div key={rfq.id} className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                        <div>
                            <div className="flex items-center space-x-3 mb-1">
                                <span className="font-bold text-slate-800 text-lg">{rfq.number}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase ${
                                    rfq.status === OrderStatus.SENT ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    rfq.status === OrderStatus.QUOTED ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {rfq.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">{rfq.items.length} items • {rfq.selectedSuppliers.length} proveedores invitados</p>
                        </div>
                        <button onClick={() => setSelectedRfq(rfq)} className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                            Gestionar <ArrowRight size={16} className="ml-2"/>
                        </button>
                    </div>
                ))}
                {visibleRfqs.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                        <AlertCircle className="mx-auto mb-4 opacity-10" size={48} />
                        No hay peticiones en curso.
                    </div>
                )}
            </div>
        </div>
    );
};
