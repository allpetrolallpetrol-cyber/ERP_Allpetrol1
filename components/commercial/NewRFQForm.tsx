
import React, { useState, useEffect, useMemo } from 'react';
import { Package, X, CheckCircle, Edit2, Trash2, Mail, Archive, FileText, Briefcase, Search, Eraser, Plus, PenTool } from 'lucide-react';
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

    const handleSend = async () => {
        if(items.length === 0) { alert("Debe agregar items."); return; }
        const rfq = await createRFQObject(OrderStatus.SENT);
        alert(`📧 Enviando solicitudes de cotización a:\n${rfq.selectedSuppliers.map(s => s.name).join('\n')}`);
        onSave(rfq);
    };

    const handleDraft = async () => {
        if(items.length === 0) { alert("Debe agregar items."); return; }
        const rfq = await createRFQObject(OrderStatus.DRAFT);
        onSave(rfq);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <FileText className="mr-2 text-slate-600" /> {(initialData as RFQ)?.id ? 'Editar Borrador' : 'Nueva RFQ'}
                </h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Add Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                            <h4 className="text-sm font-bold text-slate-700 uppercase flex items-center"><Package className="mr-2" size={16}/> 1. Agregar / Editar Ítem</h4>
                            
                            {/* Toggle Mode */}
                            <div className="flex bg-slate-200 p-1 rounded-lg self-start">
                                <button 
                                    onClick={() => { setItemMode('CODIFIED'); setFreeTextDescription(''); }}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${itemMode === 'CODIFIED' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Catálogo
                                </button>
                                <button 
                                    onClick={() => { setItemMode('FREE_TEXT'); setSelectedMaterialId(''); setSearchMaterialTerm(''); }}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${itemMode === 'FREE_TEXT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Libre
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                            <div className="md:col-span-8 relative">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">
                                    {itemMode === 'CODIFIED' ? 'Buscar Material (Código o Nombre)' : 'Descripción del Material / Servicio'}
                                </label>
                                
                                {itemMode === 'CODIFIED' ? (
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            className={`w-full pl-9 pr-8 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-accent transition-all ${selectedMaterialId ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-white border-slate-300'}`}
                                            placeholder="Escriba para buscar..."
                                            value={searchMaterialTerm}
                                            onChange={(e) => {
                                                setSearchMaterialTerm(e.target.value);
                                                setShowMaterialDropdown(true);
                                                if(selectedMaterialId) {
                                                    setSelectedMaterialId(''); 
                                                    setSelectedItemSuppliers([]);
                                                }
                                            }}
                                            onFocus={() => setShowMaterialDropdown(true)}
                                        />
                                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                        {searchMaterialTerm && (
                                            <button 
                                                onClick={clearMaterialSelection} 
                                                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                        
                                        {/* Dropdown Results */}
                                        {showMaterialDropdown && searchMaterialTerm && !selectedMaterialId && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {filteredMaterials.length > 0 ? (
                                                    filteredMaterials.map(m => (
                                                        <div 
                                                            key={m.id} 
                                                            onClick={() => handleSelectMaterial(m.id)}
                                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                        >
                                                            <div className="font-bold text-slate-800 text-sm">{m.description}</div>
                                                            <div className="text-xs text-slate-500 flex justify-between">
                                                                <span>Cod: {m.code}</span>
                                                                <span>Stock: {m.stock} {m.unitOfMeasure}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-slate-400 italic text-center">
                                                        No se encontraron materiales.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent bg-white"
                                            placeholder="Ej. Servicio de Mantenimiento..."
                                            value={freeTextDescription}
                                            onChange={(e) => setFreeTextDescription(e.target.value)}
                                        />
                                        <PenTool size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-4">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Cantidad</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-accent outline-none" 
                                        type="number" 
                                        placeholder="Cant." 
                                        value={quantity}
                                        onChange={e => setQuantity(parseFloat(e.target.value))}
                                        min="0.1"
                                    />
                                    <button 
                                        onClick={addItem} 
                                        className="bg-slate-900 text-white px-4 rounded-lg hover:bg-slate-800 font-medium shadow-sm transition-transform active:scale-95 whitespace-nowrap flex items-center justify-center flex-1 md:flex-none"
                                        title={items.find(i => i.materialId === selectedMaterialId && selectedMaterialId) ? 'Actualizar Item' : 'Agregar Item'}
                                    >
                                        {items.find(i => i.materialId === selectedMaterialId && selectedMaterialId) ? <Edit2 size={18}/> : <Plus size={20}/>} <span className="md:hidden ml-2">Agregar</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Selection Area for Current Item */}
                        {(selectedMaterialId || freeTextDescription) && (
                            <div className="bg-white p-4 rounded-lg border border-slate-200 animate-in fade-in">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-bold text-slate-700">Proveedores para este ítem:</label>
                                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">
                                        {selectedItemSuppliers.length} seleccionados
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                    {sortedSuppliersForSelection.map(sup => {
                                        const mat = itemMode === 'CODIFIED' ? materials.find(m => m.id === selectedMaterialId) : null;
                                        const isLinked = mat?.assignedSupplierIds?.includes(sup.id);
                                        const isSelected = selectedItemSuppliers.includes(sup.id);
                                        
                                        // Safe name access
                                        const supplierName = (sup as any).name || sup.businessName || 'Proveedor s/n';

                                        return (
                                            <button 
                                                key={sup.id}
                                                onClick={() => toggleItemSupplier(sup.id)}
                                                className={`text-xs px-3 py-2 rounded-lg border flex items-center transition-all shadow-sm ${
                                                    isSelected 
                                                    ? 'bg-blue-600 border-blue-600 text-white font-semibold' 
                                                    : isLinked 
                                                        ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                {isSelected ? <CheckCircle size={14} className="mr-1.5"/> : isLinked ? <Briefcase size={14} className="mr-1.5"/> : <div className="w-3.5 mr-1.5"/>}
                                                {supplierName}
                                                {isLinked && !isSelected && <span className="ml-1.5 text-[9px] bg-white/50 border border-green-200 px-1 rounded uppercase tracking-wider">Sugerido</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {suppliers.length === 0 && <p className="text-xs text-slate-400 italic">No hay proveedores registrados en el sistema.</p>}
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">Items Agregados ({items.length})</h4>
                        {items.length > 0 ? (
                            <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
                                <table className="w-full text-sm bg-white">
                                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="text-left px-4 py-2 min-w-[200px]">Descripción</th>
                                            <th className="text-center px-4 py-2">Cant.</th>
                                            <th className="text-left px-4 py-2 min-w-[200px]">Proveedores Asignados</th>
                                            <th className="px-4 py-2 w-20 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((it, idx) => (
                                            <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-700">
                                                    {it.description}
                                                    {it.materialId ? 
                                                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">COD</span>
                                                        : 
                                                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">LIBRE</span>
                                                    }
                                                </td>
                                                <td className="text-center px-4 py-3 font-mono bg-slate-50">{it.quantity}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {it.targetSupplierIds?.map(sid => {
                                                            const sup = suppliers.find(s => s.id === sid);
                                                            const sName = (sup as any)?.name || sup?.businessName || 'Desc.';
                                                            return (
                                                                <span key={sid} className="group relative text-[10px] bg-blue-50 border border-blue-100 px-2 py-1 rounded text-blue-700 flex items-center hover:bg-blue-100 cursor-default transition-colors">
                                                                    {sName}
                                                                    <button 
                                                                        onClick={() => removeSupplierFromItem(idx, sid)}
                                                                        className="ml-1 text-blue-400 hover:text-red-500 hidden group-hover:inline-block"
                                                                        title="Quitar este proveedor"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <button onClick={() => editItem(idx)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar Item">
                                                            <Edit2 size={16}/>
                                                        </button>
                                                        <button onClick={() => removeItem(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar Item">
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
                    <div className="bg-white p-5 rounded-xl border border-slate-200 sticky top-6 shadow-lg">
                        <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center"><Briefcase className="mr-2" size={16}/> Resumen de Proveedores</h4>
                        
                        <div className="mb-6">
                            <p className="text-xs text-slate-500 mb-3">
                                Los siguientes proveedores recibirán una solicitud de cotización basada en los items asignados:
                            </p>
                            {uniqueSuppliers.length > 0 ? (
                                <ul className="space-y-2">
                                    {uniqueSuppliers.map(s => {
                                        const sName = (s as any).name || s.businessName || 'Proveedor';
                                        return (
                                            <li key={s.id} className="flex items-center text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold mr-3 text-slate-600 shrink-0">
                                                    {sName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="font-semibold truncate" title={sName}>{sName}</div>
                                                    <div className="text-xs text-slate-400 truncate">CUIT: {s.cuit}</div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="text-xs text-slate-400 italic text-center p-4 border border-dashed rounded bg-slate-50">Ningún proveedor seleccionado aún.</div>
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
                            
                            <div className="flex flex-col md:flex-row gap-2">
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
