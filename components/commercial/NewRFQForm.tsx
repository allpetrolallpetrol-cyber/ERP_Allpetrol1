
import React, { useState, useEffect, useMemo } from 'react';
import { Package, X, CheckCircle, Edit2, Trash2, Mail, Archive, FileText, Briefcase, Search, Eraser, Plus, PenTool, AlertCircle } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { RFQ, OrderStatus, RFQItem, Supplier } from '../../types';

export const NewRFQForm = ({ initialData, onSave, onCancel }: { initialData?: RFQ | { items: RFQItem[] }, onSave: (rfq: any) => void, onCancel: () => void }) => {
    const { suppliers, materials, getNextId } = useMasterData();
    const [items, setItems] = useState<RFQItem[]>((initialData as any)?.items || []);
    
    // Temp item state
    const [itemMode, setItemMode] = useState<'CODIFIED' | 'FREE_TEXT'>('CODIFIED');
    
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [freeTextDescription, setFreeTextDescription] = useState('');
    
    const [searchMaterialTerm, setSearchMaterialTerm] = useState('');
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
    
    const [quantity, setQuantity] = useState(1);
    const [selectedItemSuppliers, setSelectedItemSuppliers] = useState<string[]>([]); 

    // Reset item suppliers when material changes (Only for CODIFIED)
    useEffect(() => {
        if (itemMode === 'CODIFIED' && selectedMaterialId) {
            const mat = materials.find(m => m.id === selectedMaterialId);
            if (mat) {
                // Automatically pre-select the assigned suppliers from Master Data
                setSelectedItemSuppliers(mat.assignedSupplierIds || []);
                // Also update the search term to match the selected item for visual consistency
                setSearchMaterialTerm(`${mat.code} - ${mat.description}`);
            }
        } else if (itemMode === 'CODIFIED' && !selectedMaterialId) {
            setSelectedItemSuppliers([]);
        }
    }, [selectedMaterialId, materials, itemMode]);

    // Filter materials for the dropdown
    const filteredMaterials = useMemo(() => {
        if (!searchMaterialTerm) return materials.slice(0, 50); // Show first 50 if empty
        const lowerTerm = searchMaterialTerm.toLowerCase();
        return materials.filter(m => 
            m.code.toLowerCase().includes(lowerTerm) || 
            m.description.toLowerCase().includes(lowerTerm)
        ).slice(0, 50); // Limit results for performance
    }, [materials, searchMaterialTerm]);

    // Sorted suppliers for display
    const sortedSuppliersForSelection = useMemo(() => {
        // If codified, prioritize assigned suppliers
        if (itemMode === 'CODIFIED' && selectedMaterialId) {
            const mat = materials.find(m => m.id === selectedMaterialId);
            return [...suppliers].sort((a, b) => {
                const isLinkedA = mat?.assignedSupplierIds?.includes(a.id) ? 1 : 0;
                const isLinkedB = mat?.assignedSupplierIds?.includes(b.id) ? 1 : 0;
                if (isLinkedA > isLinkedB) return -1;
                if (isLinkedA < isLinkedB) return 1;
                const nameA = (a as any).name || a.businessName || '';
                const nameB = (b as any).name || b.businessName || '';
                return nameA.localeCompare(nameB);
            });
        }
        // If free text, just alphabetical
        return [...suppliers].sort((a, b) => {
            const nameA = (a as any).name || a.businessName || '';
            const nameB = (b as any).name || b.businessName || '';
            return nameA.localeCompare(nameB);
        });
    }, [suppliers, selectedMaterialId, materials, itemMode]);

    const handleSelectMaterial = (materialId: string) => {
        setSelectedMaterialId(materialId);
        setShowMaterialDropdown(false);
    };

    const clearMaterialSelection = () => {
        setSelectedMaterialId('');
        setSearchMaterialTerm('');
        setFreeTextDescription('');
        setSelectedItemSuppliers([]);
        setShowMaterialDropdown(true);
        setItemMode('CODIFIED'); // Reset to default
    };

    const toggleItemSupplier = (supplierId: string) => {
        if (selectedItemSuppliers.includes(supplierId)) {
            setSelectedItemSuppliers(selectedItemSuppliers.filter(id => id !== supplierId));
        } else {
            setSelectedItemSuppliers([...selectedItemSuppliers, supplierId]);
        }
    };

    const addItem = () => {
        let description = '';
        let materialId: string | undefined = undefined;

        if (itemMode === 'CODIFIED') {
            if(!selectedMaterialId) return;
            const mat = materials.find(m => m.id === selectedMaterialId);
            if(!mat) return;
            materialId = mat.id;
            description = mat.description;
        } else {
            if(!freeTextDescription.trim()) return;
            description = freeTextDescription;
        }

        if(selectedItemSuppliers.length === 0) {
            alert("Debe seleccionar al menos un proveedor para este item.");
            return;
        }

        // Create Item
        const newItem: RFQItem = { 
            materialId, 
            description, 
            quantity: quantity,
            targetSupplierIds: selectedItemSuppliers 
        };

        // If codified, check if exists to update qty. If free text, always add new.
        if (materialId) {
            const existingIndex = items.findIndex(i => i.materialId === materialId);
            if (existingIndex >= 0) {
                const newItems = [...items];
                // Overwrite or sum? Let's overwrite as it might be an edit
                newItems[existingIndex] = newItem;
                setItems(newItems);
            } else {
                setItems([...items, newItem]);
            }
        } else {
            setItems([...items, newItem]);
        }
        
        // Reset form
        clearMaterialSelection();
        setQuantity(1);
    };

    const editItem = (index: number) => {
        const itemToEdit = items[index];
        setQuantity(itemToEdit.quantity);
        setSelectedItemSuppliers(itemToEdit.targetSupplierIds || []);
        
        if (itemToEdit.materialId) {
            setItemMode('CODIFIED');
            setSelectedMaterialId(itemToEdit.materialId);
            const mat = materials.find(m => m.id === itemToEdit.materialId);
            if(mat) setSearchMaterialTerm(`${mat.code} - ${mat.description}`);
        } else {
            setItemMode('FREE_TEXT');
            setFreeTextDescription(itemToEdit.description);
        }
    };

    const removeItem = (idx: number) => {
        const newItems = [...items];
        newItems.splice(idx, 1);
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

    const createRFQObject = async (status: OrderStatus) => {
        const selectedSupplierObjs = uniqueSuppliers.map(s => ({
            id: s.id, 
            name: (s as any).name || s.businessName || 'Proveedor'
        }));
        
        // Generate ID only if it's a new record (and not just an object with items passed from grouping)
        let number = (initialData as RFQ)?.number;
        if (!number) {
            number = await getNextId('RFQ');
        }

        const rfqId = (initialData as RFQ)?.id || `RFQ-${Date.now()}`;

        return {
            id: rfqId,
            number: number,
            date: (initialData as RFQ)?.date || new Date().toISOString().split('T')[0],
            items: items,
            selectedSuppliers: selectedSupplierObjs,
            quotes: (initialData as RFQ)?.quotes || [],
            status: status
        };
    };

    const validateAndSave = async (status: OrderStatus) => {
        if(items.length === 0) { 
            alert("Debe agregar al menos un item."); 
            return; 
        }

        // VALIDATION: Check if ALL items have at least one supplier
        const itemsWithoutSuppliers = items.filter(i => !i.targetSupplierIds || i.targetSupplierIds.length === 0);
        
        if (itemsWithoutSuppliers.length > 0) {
            alert(`Error: Hay ${itemsWithoutSuppliers.length} item(s) sin proveedores asignados. Debe editar los items marcados en rojo y asignarles proveedores.`);
            return;
        }

        if (uniqueSuppliers.length === 0) {
            alert("Error crítico: No hay proveedores seleccionados en el global.");
            return;
        }

        const rfq = await createRFQObject(status);
        
        if (status === OrderStatus.SENT) {
            alert(`📧 Enviando solicitudes de cotización a:\n${rfq.selectedSuppliers.map(s => s.name).join('\n')}`);
        }
        
        onSave(rfq);
    };

    const handleSend = () => validateAndSave(OrderStatus.SENT);
    const handleDraft = () => validateAndSave(OrderStatus.DRAFT);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-in fade-in h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b pb-3 shrink-0">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <FileText className="mr-2 text-slate-600" /> {(initialData as RFQ)?.id ? 'Editar Borrador' : 'Nueva RFQ'}
                </h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6 pb-2">
                {/* Left Column: Add Items - Flex container to control heights */}
                <div className="lg:col-span-2 flex flex-col space-y-4 overflow-hidden">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner shrink-0">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center"><Package className="mr-1.5" size={14}/> 1. Agregar / Editar Ítem</h4>
                            
                            {/* Toggle Mode */}
                            <div className="flex bg-slate-200 p-1 rounded-lg">
                                <button onClick={() => { setItemMode('CODIFIED'); setFreeTextDescription(''); }} className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${itemMode === 'CODIFIED' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Catálogo</button>
                                <button onClick={() => { setItemMode('FREE_TEXT'); setSelectedMaterialId(''); setSearchMaterialTerm(''); }} className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${itemMode === 'FREE_TEXT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Libre</button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                            <div className="md:col-span-8 relative">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{itemMode === 'CODIFIED' ? 'Material' : 'Descripción'}</label>
                                {itemMode === 'CODIFIED' ? (
                                    <div className="relative">
                                        <input type="text" className={`w-full pl-8 pr-8 py-1.5 border rounded-lg outline-none text-sm transition-all ${selectedMaterialId ? 'bg-green-50 border-green-200 text-green-800 font-bold' : 'bg-white border-slate-300'}`} placeholder="Escriba para buscar..." value={searchMaterialTerm} onChange={(e) => { setSearchMaterialTerm(e.target.value); setShowMaterialDropdown(true); if(selectedMaterialId) { setSelectedMaterialId(''); setSelectedItemSuppliers([]); } }} onFocus={() => setShowMaterialDropdown(true)} />
                                        <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                        {searchMaterialTerm && <button onClick={clearMaterialSelection} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
                                        {showMaterialDropdown && searchMaterialTerm && !selectedMaterialId && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                {filteredMaterials.length > 0 ? filteredMaterials.map(m => (
                                                    <div key={m.id} onClick={() => handleSelectMaterial(m.id)} className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-xs">
                                                        <div className="font-bold text-slate-800">{m.description}</div>
                                                        <div className="text-[10px] text-slate-500">Cod: {m.code} | Stock: {m.stock}</div>
                                                    </div>
                                                )) : <div className="px-3 py-2 text-[10px] text-slate-400 italic text-center">No encontrado.</div>}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input type="text" className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white outline-none" placeholder="Servicio o item libre..." value={freeTextDescription} onChange={(e) => setFreeTextDescription(e.target.value)} />
                                        <PenTool size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Cantidad</label>
                                <div className="flex gap-2">
                                    <input className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-right" type="number" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value))} min="0.1" />
                                    <button onClick={addItem} className="bg-slate-900 text-white px-3 rounded-lg hover:bg-black flex items-center justify-center transition-all transform active:scale-95 shadow-sm" title="Agregar item a la lista"><Plus size={18}/></button>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Selection for item - Controlled height */}
                        {(selectedMaterialId || freeTextDescription) && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200 animate-in fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest">Proveedores invitados:</label>
                                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">{selectedItemSuppliers.length} Seleccionados</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1">
                                    {sortedSuppliersForSelection.map(sup => {
                                        const mat = itemMode === 'CODIFIED' ? materials.find(m => m.id === selectedMaterialId) : null;
                                        const isLinked = mat?.assignedSupplierIds?.includes(sup.id);
                                        const isSelected = selectedItemSuppliers.includes(sup.id);
                                        const supplierName = (sup as any).name || sup.businessName || 'Prov.';
                                        return (
                                            <button key={sup.id} onClick={() => toggleItemSupplier(sup.id)} className={`text-[10px] px-2 py-1 rounded-md border flex items-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white font-bold' : isLinked ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                                {isSelected ? <CheckCircle size={10} className="mr-1"/> : isLinked ? <Briefcase size={10} className="mr-1"/> : <div className="w-2.5 mr-1"/>}
                                                {supplierName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table - Elastic and responsive */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-[150px]">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Items Agregados ({items.length})</h4>
                        {items.length > 0 ? (
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1 bg-white">
                                <div className="overflow-y-auto no-scrollbar flex-1">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold border-b sticky top-0 z-10 uppercase text-[9px] tracking-tighter">
                                            <tr>
                                                <th className="p-3">Descripción</th>
                                                <th className="p-3 text-center">Cant.</th>
                                                <th className="p-3">Proveedores</th>
                                                <th className="p-3 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {items.map((it, idx) => {
                                                const hasSuppliers = it.targetSupplierIds && it.targetSupplierIds.length > 0;
                                                return (
                                                    <tr key={idx} className={`hover:bg-slate-50 transition-colors ${!hasSuppliers ? 'bg-red-50' : ''}`}>
                                                        <td className="p-3 font-medium text-slate-700">
                                                            {it.description}
                                                            <span className={`ml-2 text-[9px] px-1 rounded ${it.materialId ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{it.materialId ? 'COD' : 'LIB'}</span>
                                                        </td>
                                                        <td className="p-3 text-center font-bold">{it.quantity}</td>
                                                        <td className="p-3">
                                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                {it.targetSupplierIds?.map(sid => {
                                                                    const sName = suppliers.find(s => s.id === sid)?.businessName?.substring(0, 10) || 'Prov.';
                                                                    return <span key={sid} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{sName}..</span>;
                                                                })}
                                                                {!hasSuppliers && <span className="text-[9px] text-red-500 font-bold">Sin proveedores!</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button onClick={() => editItem(idx)} className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                                                                <button onClick={() => removeItem(idx)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                                <AlertCircle size={24} className="mb-2 opacity-20"/>
                                <p className="text-xs">No hay ítems cargados.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Summary - Responsive Height */}
                <div className="lg:col-span-1 overflow-hidden flex flex-col">
                    <div className="bg-slate-900 p-5 rounded-2xl shadow-xl flex flex-col flex-1 text-white overflow-hidden">
                        <h4 className="text-xs font-bold uppercase mb-4 flex items-center tracking-widest"><Briefcase className="mr-2" size={16}/> Resumen Petición</h4>
                        
                        <div className="flex-1 overflow-y-auto no-scrollbar mb-4 pr-1">
                            <p className="text-[10px] text-slate-400 mb-3 uppercase font-bold tracking-tighter">Proveedores Invitados:</p>
                            {uniqueSuppliers.length > 0 ? (
                                <ul className="space-y-2">
                                    {uniqueSuppliers.map(s => (
                                        <li key={s.id} className="flex items-center text-xs bg-white/10 p-2 rounded-lg border border-white/5 backdrop-blur-md">
                                            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold mr-2">
                                                {(s as any).name?.substring(0, 1) || s.businessName?.substring(0,1)}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-bold truncate text-[11px]">{s.businessName}</div>
                                                <div className="text-[9px] text-slate-400 font-mono">CUIT: {s.cuit}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-xs text-slate-500 italic text-center py-6 border border-white/10 rounded-xl">Sin proveedores asignados.</div>
                            )}
                        </div>

                        <div className="border-t border-white/10 pt-4 shrink-0">
                            <div className="flex justify-between items-center mb-1 text-xs">
                                <span className="text-slate-400">Total Ítems:</span>
                                <span className="font-bold">{items.length}</span>
                            </div>
                            <div className="flex justify-between items-center mb-6 text-xs">
                                <span className="text-slate-400">Total Proveedores:</span>
                                <span className="font-bold">{uniqueSuppliers.length}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <button onClick={handleDraft} disabled={items.length === 0} className="bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 font-bold text-xs transition-all disabled:opacity-30 border border-white/10 shadow-lg flex items-center justify-center"><Archive size={16} className="mr-1.5"/> Borrador</button>
                                <button onClick={handleSend} disabled={items.length === 0} className="bg-accent text-white py-3 rounded-xl hover:bg-teal-700 font-bold text-xs transition-all disabled:opacity-30 shadow-lg flex items-center justify-center"><Mail size={16} className="mr-1.5"/> Enviar</button>
                            </div>
                            <button onClick={onCancel} className="w-full text-slate-400 py-1.5 text-[10px] font-bold hover:text-white transition-colors">DESCARTAR / CANCELAR</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
