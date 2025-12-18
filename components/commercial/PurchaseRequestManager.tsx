
import React, { useState, useMemo } from 'react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { PurchaseRequest, RequestStatus, RFQItem, RFQ, OrderStatus } from '../../types';
import { Plus, Search, ShoppingCart, Calendar, User, CheckSquare, Square, ArrowRight, X, FileText, BadgeCheck, Zap, Trash2, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

// --- MODULAR COMPONENTS ---

const RequestItemBadge = ({ materialId }: { materialId?: string }) => {
    const { materials, getContractForMaterial } = useMasterData();
    if (!materialId) return null;
    const mat = materials.find(m => m.id === materialId);
    const contract = getContractForMaterial(materialId);
    
    return (
        <div className="flex gap-1 mt-1">
            {mat?.category === 'RAW_MATERIAL' && (
                <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold border border-purple-200">MATERIA PRIMA</span>
            )}
            {contract && (
                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold border border-amber-200 flex items-center">
                    <BadgeCheck size={10} className="mr-1"/> CONTRATO VIGENTE
                </span>
            )}
        </div>
    );
};

// --- NEW REQUEST MODAL FORM ---
const NewRequestModal = ({ onClose, onSave }: { onClose: () => void, onSave: (pr: PurchaseRequest) => void }) => {
    const { materials, getNextId } = useMasterData();
    const { userProfile } = useAuth();
    const { showToast } = useUI();
    
    const [items, setItems] = useState<{materialId?: string, description: string, quantity: number, unit: string}[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);

    const filteredMaterials = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        return materials.filter(m => m.description.toLowerCase().includes(term) || m.code.toLowerCase().includes(term)).slice(0, 10);
    }, [materials, searchTerm]);

    const handleSelectItem = (m: any) => {
        setItems([...items, { materialId: m.id, description: m.description, quantity: 1, unit: m.unitOfMeasure }]);
        setSearchTerm('');
        setShowResults(false);
    };

    const addFreeTextItem = () => {
        if (!searchTerm.trim()) return;
        setItems([...items, { description: searchTerm, quantity: 1, unit: 'UN' }]);
        setSearchTerm('');
        setShowResults(false);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (items.length === 0) return showToast("Agregue al menos un item", "error");
        
        const number = await getNextId('PURCHASE_REQUEST');
        const pr: PurchaseRequest = {
            id: `PR-${Date.now()}`,
            number,
            date: new Date().toISOString().split('T')[0],
            requesterId: userProfile?.id || 'ANON',
            requesterName: userProfile ? `${userProfile.lastName}, ${userProfile.firstName}` : 'Usuario Externo',
            origin: 'MANUAL',
            status: RequestStatus.PENDING,
            items
        };
        
        onSave(pr);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <Plus className="mr-2 text-orange-600" size={24}/> Nueva SolPed
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Buscar Material o Describir Necesidad</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                                <input 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm"
                                    placeholder="Ej: Rodamiento, Chapa, etc..."
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
                                    onKeyDown={e => e.key === 'Enter' && addFreeTextItem()}
                                />
                                {showResults && searchTerm && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                        {filteredMaterials.map(m => (
                                            <button key={m.id} onClick={() => handleSelectItem(m)} className="w-full px-4 py-2 text-left hover:bg-orange-50 border-b last:border-0 text-sm flex justify-between">
                                                <span className="font-bold">{m.description}</span>
                                                <span className="text-slate-400 text-xs font-mono">{m.code}</span>
                                            </button>
                                        ))}
                                        <button onClick={addFreeTextItem} className="w-full px-4 py-2 text-left bg-slate-50 hover:bg-slate-100 text-xs font-bold text-orange-600">
                                            + Usar como texto libre: "{searchTerm}"
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="p-3">Item / Descripción</th>
                                    <th className="p-3 w-24">Cantidad</th>
                                    <th className="p-3 w-20 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((it, idx) => (
                                    <tr key={idx} className="bg-white">
                                        <td className="p-3 font-medium text-slate-800">
                                            {it.description}
                                            {it.materialId && <div className="text-[10px] text-slate-400 font-mono">{it.materialId}</div>}
                                        </td>
                                        <td className="p-3">
                                            <input 
                                                type="number" 
                                                className="w-full border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500" 
                                                value={it.quantity} 
                                                onChange={e => {
                                                    const newItems = [...items];
                                                    newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                                    setItems(newItems);
                                                }}
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan={3} className="p-10 text-center text-slate-300 italic">No hay items agregados</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
                    <button onClick={handleSubmit} className="px-8 py-2 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition-all transform active:scale-95">Guardar Solicitud</button>
                </div>
            </div>
        </div>
    );
};

export const PurchaseRequestManager = ({ onCreateRFQ }: { onCreateRFQ: (items: RFQItem[]) => void }) => {
    const { purchaseRequests, materials, getNextId, addPurchaseRequest, updatePurchaseRequest, getContractForMaterial, addRFQ } = useMasterData();
    const { userProfile } = useAuth();
    const { showToast, showConfirm } = useUI();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

    const toggleRequestSelection = (id: string) => {
        setSelectedRequestIds(prev => 
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        );
    };

    const pendingRequests = useMemo(() => {
        return purchaseRequests.filter(pr => pr.status === RequestStatus.PENDING)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [purchaseRequests]);

    const filteredRequests = useMemo(() => {
        if (!searchTerm) return pendingRequests;
        const term = searchTerm.toLowerCase();
        return pendingRequests.filter(pr => 
            pr.number.toLowerCase().includes(term) ||
            pr.requesterName.toLowerCase().includes(term) ||
            pr.items.some(i => i.description.toLowerCase().includes(term))
        );
    }, [pendingRequests, searchTerm]);

    const handleSaveNewRequest = async (pr: PurchaseRequest) => {
        await addPurchaseRequest(pr);
        showToast("Solicitud generada correctamente", "success");
        setIsCreateModalOpen(false);
    };

    const handleGenerateDirectPO = async (requestId: string) => {
        const req = pendingRequests.find(r => r.id === requestId);
        if (!req) return;

        const contractInfo = req.items.map(it => it.materialId ? getContractForMaterial(it.materialId) : null);
        const allHaveContract = contractInfo.every(c => !!c);

        if (!allHaveContract) {
            showToast("No todos los items tienen un contrato vigente.", 'error');
            return;
        }

        const confirmed = await showConfirm(
            "Generar OC Directa", 
            `Esta acción generará una Orden de Compra directa usando los precios del Contrato Marco. Requiere aprobación posterior.`,
            'info', 'Generar OC'
        );

        if (confirmed) {
            try {
                const supplierId = contractInfo[0]!.supplierId;
                const poNumber = await getNextId('PURCHASE_ORDER');
                
                const poItems: RFQItem[] = req.items.map(it => ({
                    materialId: it.materialId,
                    description: it.description,
                    quantity: it.quantity,
                    purchaseRequestId: req.id
                }));

                const winnerQuote = {
                    supplierId: supplierId,
                    supplierName: contractInfo[0]!.supplierName,
                    price: req.items.reduce((acc, it, idx) => acc + (it.quantity * contractInfo[idx]!.price), 0),
                    items: req.items.map((it, idx) => ({
                        materialId: it.materialId || '',
                        description: it.description,
                        unitPrice: contractInfo[idx]!.price
                    })),
                    isSelected: true
                };

                const newPO: RFQ = {
                    id: `PO-CTR-${Date.now()}`,
                    number: poNumber,
                    date: new Date().toISOString().split('T')[0],
                    items: poItems,
                    selectedSuppliers: [{ id: supplierId, name: winnerQuote.supplierName }],
                    quotes: [winnerQuote],
                    status: OrderStatus.PENDING_APPROVAL,
                    winnerSupplierId: supplierId,
                    origin: 'CONTRACT'
                };

                await addRFQ(newPO);
                await updatePurchaseRequest({ ...req, status: RequestStatus.PROCESSED });
                showToast(`OC ${poNumber} generada exitosamente.`, 'success');
            } catch (e) {
                showToast("Error al generar OC directa", 'error');
            }
        }
    };

    const handleProcessToRFQ = async () => {
        if (selectedRequestIds.length === 0) return;
        const selectedRequests = pendingRequests.filter(pr => selectedRequestIds.includes(pr.id));
        const combinedItems: RFQItem[] = [];

        selectedRequests.forEach(req => {
            req.items.forEach(reqItem => {
                const existingIdx = combinedItems.findIndex(ci => {
                    if (reqItem.materialId && ci.materialId === reqItem.materialId) return true;
                    if (!reqItem.materialId && !ci.materialId && ci.description === reqItem.description) return true;
                    return false;
                });
                if (existingIdx >= 0) combinedItems[existingIdx].quantity += reqItem.quantity;
                else combinedItems.push({ materialId: reqItem.materialId, description: reqItem.description, quantity: reqItem.quantity, purchaseRequestId: req.id });
            });
        });

        for (const req of selectedRequests) {
            await updatePurchaseRequest({ ...req, status: RequestStatus.PROCESSED });
        }
        onCreateRFQ(combinedItems);
        setSelectedRequestIds([]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <ShoppingCart className="mr-2 text-orange-600" /> Solicitudes de Pedido (SolPed)
                </h3>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-orange-600 text-white px-5 py-2 rounded-lg font-bold shadow-md hover:bg-orange-700 transition-all flex items-center active:scale-95"
                >
                    <Plus size={20} className="mr-2"/> Nueva Solicitud
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <input className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-orange-400" placeholder="Buscar por número, solicitante o item..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                    {selectedRequestIds.length > 0 && (
                        <button onClick={handleProcessToRFQ} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 flex items-center animate-in slide-in-from-right-2">
                            Agrupar en RFQ ({selectedRequestIds.length}) <ArrowRight size={16} className="ml-2"/>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-10"></th>
                                <th className="p-4">Solicitud</th>
                                <th className="p-4">Origen</th>
                                <th className="p-4">Items y Contratos</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredRequests.map(pr => {
                                const allHaveContract = pr.items.every(it => it.materialId && !!getContractForMaterial(it.materialId));
                                
                                return (
                                    <tr key={pr.id} className={`hover:bg-slate-50 transition-colors ${selectedRequestIds.includes(pr.id) ? 'bg-orange-50' : ''}`}>
                                        <td className="p-4 text-center">
                                            <button onClick={() => toggleRequestSelection(pr.id)} className="text-slate-400 hover:text-orange-500 transition-colors">
                                                {selectedRequestIds.includes(pr.id) ? <CheckSquare size={20} className="text-orange-600"/> : <Square size={20}/>}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{pr.number}</div>
                                            <div className="text-[10px] text-slate-400">{pr.date} • {pr.requesterName}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-100 uppercase text-slate-600">{pr.origin}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5 max-w-xs">
                                                {pr.items.map((it, idx) => (
                                                    <div key={idx} className="bg-slate-50 border border-slate-100 p-2 rounded shadow-sm">
                                                        <span className="font-medium text-slate-700 text-xs">{it.quantity} {it.unit} - {it.description}</span>
                                                        <RequestItemBadge materialId={it.materialId} />
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            {allHaveContract && (
                                                <button 
                                                    onClick={() => handleGenerateDirectPO(pr.id)}
                                                    className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center ml-auto transition-colors"
                                                    title="Generar OC directa por contrato (Sin RFQ)"
                                                >
                                                    <Zap size={14} className="mr-1.5"/> Generar OC Directa
                                                </button>
                                            )}
                                            {!allHaveContract && <span className="text-[10px] text-slate-400 italic">Requiere RFQ</span>}
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredRequests.length === 0 && (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">
                                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-10"/>
                                    No hay solicitudes pendientes.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreateModalOpen && (
                <NewRequestModal onClose={() => setIsCreateModalOpen(false)} onSave={handleSaveNewRequest} />
            )}
        </div>
    );
};
