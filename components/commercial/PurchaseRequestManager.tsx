
import React, { useState, useMemo } from 'react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { PurchaseRequest, RequestStatus, RFQItem } from '../../types';
import { Plus, Search, ShoppingCart, Filter, User, Calendar, FileText, CheckSquare, Square, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const PurchaseRequestManager = ({ onCreateRFQ }: { onCreateRFQ: (items: RFQItem[]) => void }) => {
    const { purchaseRequests, materials, uoms, getNextId, addPurchaseRequest, updatePurchaseRequest } = useMasterData();
    const { userProfile } = useAuth();
    
    // View State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

    // Form State (New Request)
    const [newItemMode, setNewItemMode] = useState<'CODIFIED' | 'FREE_TEXT'>('CODIFIED');
    const [formMaterialId, setFormMaterialId] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formQuantity, setFormQuantity] = useState(1);
    const [formUnit, setFormUnit] = useState('UN');
    
    // Form Items List (Before saving request)
    const [formItems, setFormItems] = useState<{materialId?: string, description: string, quantity: number, unit?: string}[]>([]);

    // Filter Logic
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

    // Handlers
    const handleAddItemToForm = () => {
        if (newItemMode === 'CODIFIED' && !formMaterialId) return;
        if (newItemMode === 'FREE_TEXT' && !formDescription) return;

        let desc = formDescription;
        let unit = formUnit;

        if (newItemMode === 'CODIFIED') {
            const mat = materials.find(m => m.id === formMaterialId);
            if (mat) {
                desc = `${mat.code} - ${mat.description}`;
                unit = mat.unitOfMeasure;
            }
        }

        setFormItems([...formItems, {
            materialId: newItemMode === 'CODIFIED' ? formMaterialId : undefined,
            description: desc,
            quantity: formQuantity,
            unit
        }]);

        // Reset inputs
        setFormMaterialId('');
        setFormDescription('');
        setFormQuantity(1);
    };

    const handleSaveRequest = async () => {
        if (formItems.length === 0) return;
        
        const number = await getNextId('PURCHASE_REQUEST');
        const newReq: PurchaseRequest = {
            id: `PR-${Date.now()}`,
            number,
            date: new Date().toISOString().split('T')[0],
            requesterId: userProfile?.id || 'unknown',
            requesterName: userProfile ? `${userProfile.lastName}, ${userProfile.firstName}` : 'Usuario Sistema',
            origin: 'MANUAL',
            status: RequestStatus.PENDING,
            items: formItems
        };

        await addPurchaseRequest(newReq);
        setIsModalOpen(false);
        setFormItems([]);
    };

    const toggleRequestSelection = (id: string) => {
        if (selectedRequestIds.includes(id)) {
            setSelectedRequestIds(selectedRequestIds.filter(rid => rid !== id));
        } else {
            setSelectedRequestIds([...selectedRequestIds, id]);
        }
    };

    const handleProcessToRFQ = async () => {
        if (selectedRequestIds.length === 0) return;

        const selectedRequests = pendingRequests.filter(pr => selectedRequestIds.includes(pr.id));
        const combinedItems: RFQItem[] = [];

        // Logic to combine items
        selectedRequests.forEach(req => {
            req.items.forEach(reqItem => {
                // Try to find if this item already exists in combined list (by materialId OR description match)
                const existingIdx = combinedItems.findIndex(ci => {
                    if (reqItem.materialId && ci.materialId === reqItem.materialId) return true;
                    if (!reqItem.materialId && !ci.materialId && ci.description === reqItem.description) return true;
                    return false;
                });

                if (existingIdx >= 0) {
                    combinedItems[existingIdx].quantity += reqItem.quantity;
                } else {
                    combinedItems.push({
                        materialId: reqItem.materialId,
                        description: reqItem.description,
                        quantity: reqItem.quantity,
                        purchaseRequestId: req.id // We track origin, though merging makes this 1-to-many potentially. Simple traceability for now.
                    });
                }
            });
        });

        // Mark requests as PROCESSED
        for (const req of selectedRequests) {
            await updatePurchaseRequest({ ...req, status: RequestStatus.PROCESSED });
        }

        onCreateRFQ(combinedItems);
        setSelectedRequestIds([]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <ShoppingCart className="mr-2 text-orange-600" /> Solicitudes de Pedido (SolPed)
                </h3>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 shadow-sm flex items-center transition-colors"
                >
                    <Plus size={18} className="mr-2"/> <span className="hidden md:inline">Nueva Solicitud Manual</span><span className="md:hidden">Nueva</span>
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <input 
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 outline-none" 
                            placeholder="Buscar solicitud..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                    {selectedRequestIds.length > 0 && (
                        <button 
                            onClick={handleProcessToRFQ}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-orange-700 transition-colors flex items-center justify-center animate-in slide-in-from-right-4"
                        >
                            Generar RFQ ({selectedRequestIds.length}) <ArrowRight size={16} className="ml-2"/>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                            <tr>
                                <th className="p-4 w-10"></th>
                                <th className="p-4">Nro Solicitud</th>
                                <th className="p-4 hidden md:table-cell">Fecha</th>
                                <th className="p-4 hidden md:table-cell">Solicitante</th>
                                <th className="p-4">Origen</th>
                                <th className="p-4">Items</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRequests.map(pr => (
                                <tr key={pr.id} className={`hover:bg-slate-50 transition-colors ${selectedRequestIds.includes(pr.id) ? 'bg-orange-50' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => toggleRequestSelection(pr.id)} className="text-slate-400 hover:text-orange-600">
                                            {selectedRequestIds.includes(pr.id) ? <CheckSquare size={20} className="text-orange-600"/> : <Square size={20}/>}
                                        </button>
                                    </td>
                                    <td className="p-4 font-bold text-slate-800">{pr.number}</td>
                                    <td className="p-4 text-slate-500 hidden md:table-cell"><span className="flex items-center"><Calendar size={14} className="mr-1"/> {pr.date}</span></td>
                                    <td className="p-4 text-slate-600 hidden md:table-cell"><span className="flex items-center"><User size={14} className="mr-1"/> {pr.requesterName}</span></td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                            pr.origin === 'MAINTENANCE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            pr.origin === 'WAREHOUSE' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {pr.origin === 'MAINTENANCE' ? 'MANTENIMIENTO' : pr.origin === 'WAREHOUSE' ? 'STOCK' : 'MANUAL'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {pr.items.slice(0, 2).map((it, idx) => (
                                                <span key={idx} className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded truncate max-w-[200px]" title={it.description}>
                                                    {it.quantity} {it.unit || 'u'} - {it.description}
                                                </span>
                                            ))}
                                            {pr.items.length > 2 && <span className="text-[10px] text-slate-400">+{pr.items.length - 2} más...</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRequests.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No hay solicitudes pendientes.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="text-xl font-bold text-slate-800">Nueva Solicitud de Pedido</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Input Area */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                <div className="flex gap-4 mb-4 border-b border-slate-200 pb-2">
                                    <button onClick={() => setNewItemMode('CODIFIED')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${newItemMode === 'CODIFIED' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>Material Codificado</button>
                                    <button onClick={() => setNewItemMode('FREE_TEXT')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${newItemMode === 'FREE_TEXT' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>Texto Libre</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                    <div className="md:col-span-8">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                                            {newItemMode === 'CODIFIED' ? 'Buscar Material' : 'Descripción del Ítem'}
                                        </label>
                                        {newItemMode === 'CODIFIED' ? (
                                            <select 
                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                                value={formMaterialId}
                                                onChange={e => setFormMaterialId(e.target.value)}
                                            >
                                                <option value="">Seleccionar...</option>
                                                {materials.map(m => (
                                                    <option key={m.id} value={m.id}>{m.code} - {m.description}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input 
                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                                placeholder="Ej. Laptop Dell Inspiron 15..."
                                                value={formDescription}
                                                onChange={e => setFormDescription(e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Cant.</label>
                                        <input 
                                            type="number" 
                                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                            value={formQuantity}
                                            onChange={e => setFormQuantity(parseFloat(e.target.value))}
                                            min="0.1"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <button onClick={handleAddItemToForm} className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-700">Agregar</button>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500 font-semibold">
                                    <tr>
                                        <th className="p-2">Descripción</th>
                                        <th className="p-2 text-center">Cant.</th>
                                        <th className="p-2 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2">{item.description} {item.materialId && <span className="bg-slate-100 text-slate-500 text-[10px] px-1 rounded ml-2">COD</span>}</td>
                                            <td className="p-2 text-center">{item.quantity} {item.unit}</td>
                                            <td className="p-2 text-right">
                                                <button onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 font-bold">X</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {formItems.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic">Agregue items a la solicitud.</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-lg">Cancelar</button>
                            <button onClick={handleSaveRequest} disabled={formItems.length === 0} className="px-6 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-md disabled:opacity-50">Guardar Solicitud</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
