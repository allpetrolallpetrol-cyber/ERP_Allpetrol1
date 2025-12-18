
import React, { useState, useMemo } from 'react';
import { Package, Edit2, Plus, Search, ArrowLeft, Truck, X, Tags, Users, FileText, Info, Eye } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { MaterialCategory, Material } from '../../types';

const CATEGORIES: { value: MaterialCategory, label: string, color: string, numType: string }[] = [
    { value: 'FINISHED_PRODUCT', label: 'Producto Terminado', color: 'bg-green-100 text-green-800 border-green-200', numType: 'MATERIAL_PRODUCT' },
    { value: 'RAW_MATERIAL', label: 'Materia Prima', color: 'bg-purple-100 text-purple-800 border-purple-200', numType: 'MATERIAL_RAW' },
    { value: 'SUPPLY', label: 'Insumo / Repuesto', color: 'bg-blue-100 text-blue-800 border-blue-200', numType: 'MATERIAL_SUPPLY' },
    { value: 'SERVICE', label: 'Servicios', color: 'bg-orange-100 text-orange-800 border-orange-200', numType: 'MATERIAL_SERVICE' },
];

const ExtendedInfoModal = ({ material, onClose }: { material: Material, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Ficha Técnica / Info Adicional</h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">{material.code} - {material.description}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
                    <div className="prose prose-slate max-w-none">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Especificaciones</span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">
                            {material.extendedDescription || "No hay información adicional cargada para este material."}
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md transition-all active:scale-95"
                    >
                        Cerrar Ficha
                    </button>
                </div>
            </div>
        </div>
    );
};

const MaterialForm = ({ initialData, onSave, onCancel }: any) => {
    const { uoms, warehouses, warehouseLocations, suppliers } = useMasterData();
    const { showToast } = useUI();
    
    const [formData, setFormData] = useState(initialData || {
        description: '',
        extendedDescription: '',
        category: 'SUPPLY',
        unitOfMeasure: 'UN',
        stock: 0,
        minStock: 0,
        cost: 0,
        warehouse: '',
        location: '',
        assignedSupplierIds: []
    });

    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierResults, setShowSupplierResults] = useState(false);

    const handleSubmit = () => {
        if (!formData.description) return showToast("Descripción obligatoria", 'error');
        onSave(formData);
    };

    const availableLocations = useMemo(() => {
        if (!formData.warehouse) return [];
        return warehouseLocations.filter(l => l.warehouseId === formData.warehouse);
    }, [formData.warehouse, warehouseLocations]);

    const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({ ...formData, warehouse: e.target.value, location: '' });
    };

    const toggleSupplier = (supplierId: string) => {
        const current = formData.assignedSupplierIds || [];
        const isAssigned = current.includes(supplierId);
        const newList = isAssigned ? current.filter((id: string) => id !== supplierId) : [...current, supplierId];
        setFormData({ ...formData, assignedSupplierIds: newList });
        setSupplierSearch('');
        setShowSupplierResults(false);
    };

    const filteredSuppliers = useMemo(() => {
        if (!supplierSearch) return [];
        const term = supplierSearch.toLowerCase();
        return suppliers.filter(s => 
            (s.businessName || s.name || '').toLowerCase().includes(term) ||
            s.id.toLowerCase().includes(term)
        ).filter(s => !(formData.assignedSupplierIds || []).includes(s.id));
    }, [suppliers, supplierSearch, formData.assignedSupplierIds]);

    return (
        <div className="h-full flex flex-col animate-in slide-in-from-right-4">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm font-medium"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-xl font-bold text-slate-800">{initialData ? 'Editar Material' : 'Nuevo Material'}</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto flex-1 pr-2 pb-6 custom-scrollbar">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Clasificación e Información</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Material</label>
                                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.description} onChange={(e:any) => setFormData({...formData, description: e.target.value})} placeholder="Ej: Cable de Cobre 2mm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Ampliada / Ficha Técnica</label>
                                <textarea 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent resize-none font-sans" 
                                    rows={6}
                                    value={formData.extendedDescription} 
                                    onChange={(e:any) => setFormData({...formData, extendedDescription: e.target.value})} 
                                    placeholder="Ingrese especificaciones técnicas detalladas, composición, normas de seguridad o información adicional relevante..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                <div className="relative">
                                    <Tags size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <select className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.category} onChange={(e:any) => setFormData({...formData, category: e.target.value})}>
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unidad Medida</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.unitOfMeasure} onChange={(e:any) => setFormData({...formData, unitOfMeasure: e.target.value})}>
                                    {uoms.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Stock y Almacenamiento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial / Actual</label>
                                <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.stock} onChange={(e:any) => setFormData({...formData, stock: parseFloat(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock de Seguridad (Mín.)</label>
                                <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.minStock} onChange={(e:any) => setFormData({...formData, minStock: parseFloat(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Depósito</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.warehouse} onChange={handleWarehouseChange}>
                                    <option value="">Seleccionar...</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.location} onChange={(e:any) => setFormData({...formData, location: e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    {availableLocations.map(loc => <option key={loc.id} value={loc.code}>{loc.code}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border-2 border-slate-100 flex flex-col h-fit shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center uppercase tracking-wider"><Users size={18} className="mr-2 text-accent"/> Proveedores del Material</h4>
                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-accent" placeholder="Buscar para asignar..." value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setShowSupplierResults(true); }} />
                        {showSupplierResults && supplierSearch && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {filteredSuppliers.map(s => (
                                    <button key={s.id} onClick={() => toggleSupplier(s.id)} className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b last:border-0 text-sm">
                                        {s.businessName || s.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {(formData.assignedSupplierIds || []).map((sid: string) => {
                            const sup = suppliers.find(s => s.id === sid);
                            return (
                                <div key={sid} className="flex justify-between items-center bg-blue-50 p-2 rounded-lg border border-blue-100 group">
                                    <div className="text-[11px] font-bold text-blue-900 truncate">{sup?.businessName || sid}</div>
                                    <button onClick={() => toggleSupplier(sid)} className="text-blue-300 hover:text-red-500"><X size={12}/></button>
                                </div>
                            );
                        })}
                        {(formData.assignedSupplierIds?.length === 0) && (
                            <p className="text-xs text-slate-400 italic text-center py-4">Sin proveedores asignados.</p>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
                <button onClick={onCancel} className="px-6 py-2 text-slate-600 font-medium">Cancelar</button>
                <button onClick={handleSubmit} className="px-8 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-md hover:bg-slate-800 transition-all transform active:scale-95">Guardar Material</button>
            </div>
        </div>
    );
};

export const MaterialsView = () => {
    const { materials, suppliers, addMaterial, getNextId, updateMaterial } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selected, setSelected] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for viewing extended description modal
    const [viewingExtendedInfo, setViewingExtendedInfo] = useState<Material | null>(null);

    const handleSave = async (data: any) => {
        try {
            if (selected) {
                await updateMaterial({ ...selected, ...data });
            } else {
                // Seleccionar Numerador basado en categoría
                const categoryDef = CATEGORIES.find(c => c.value === data.category);
                const numType = categoryDef ? categoryDef.numType : 'MATERIAL';
                const id = await getNextId(numType as any);
                await addMaterial({ id, code: id, ...data });
            }
            showToast('Guardado con éxito', 'success');
            setViewMode('LIST');
        } catch (e) { 
            console.error(e); 
            showToast('Error al procesar el material', 'error'); 
        }
    };

    const groupedMaterials = useMemo(() => {
        const groups: Record<MaterialCategory, any[]> = {
            FINISHED_PRODUCT: [],
            RAW_MATERIAL: [],
            SUPPLY: [],
            SERVICE: []
        };
        
        materials.forEach(m => {
            if (groups[m.category]) {
                if (!searchTerm || m.description.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase())) {
                    groups[m.category].push(m);
                }
            }
        });
        return groups;
    }, [materials, searchTerm]);

    if (viewMode === 'FORM') return <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden"><MaterialForm initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} /></div>;

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Package className="mr-2 text-slate-500" size={20} /> Maestro de Materiales
                </h3>
                <button onClick={() => { setSelected(null); setViewMode('FORM'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg font-medium shadow-sm hover:bg-slate-800 transition-colors"><Plus size={18} className="mr-2"/> Nuevo Material</button>
            </div>
            
            <div className="mb-4 relative shrink-0">
                <input type="text" placeholder="Buscar por código o descripción..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="border rounded-lg overflow-auto flex-1 custom-scrollbar">
                {CATEGORIES.map(cat => {
                    const group = groupedMaterials[cat.value];
                    if (group.length === 0 && !searchTerm) return null;
                    if (group.length === 0 && searchTerm) return null;

                    return (
                        <div key={cat.value} className="mb-8 last:mb-0">
                            <div className={`sticky top-0 z-10 px-4 py-2 border-b font-bold text-xs uppercase tracking-widest flex items-center justify-between ${cat.color}`}>
                                <span>{cat.label}</span>
                                <span>{group.length} items</span>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b font-semibold text-slate-600">
                                    <tr>
                                        <th className="p-3 w-32">Código</th>
                                        <th className="p-3 w-1/3">Descripción</th>
                                        <th className="p-3">Proveedores Asignados</th>
                                        <th className="p-3 text-right">Stock</th>
                                        <th className="p-3 text-right w-20">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {group.map(m => {
                                        const assignedSuppliers = (m.assignedSupplierIds || []).map(sid => suppliers.find(s => s.id === sid)?.businessName).filter(Boolean);
                                        
                                        return (
                                            <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-3 font-mono text-slate-600 font-bold">{m.code}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-800">{m.description}</span>
                                                        {m.extendedDescription && (
                                                            <button 
                                                                onClick={() => setViewingExtendedInfo(m)}
                                                                className="p-1 hover:bg-blue-100 rounded-full transition-colors text-blue-500"
                                                                title="Ver Ficha Técnica"
                                                            >
                                                                <Info size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {assignedSuppliers.length > 0 ? assignedSuppliers.map((s, idx) => (
                                                            <span key={idx} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">{s}</span>
                                                        )) : <span className="text-[10px] text-slate-300 italic">Sin asignar</span>}
                                                    </div>
                                                </td>
                                                <td className={`p-3 text-right font-bold ${m.stock <= m.minStock ? 'text-red-500' : 'text-slate-700'}`}>{m.stock} <span className="text-[10px] opacity-60 uppercase">{m.unitOfMeasure}</span></td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => { setSelected(m); setViewMode('FORM'); }} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
                {materials.length === 0 && (
                    <div className="p-20 text-center text-slate-400 italic bg-slate-50 rounded-lg">
                        <Package size={48} className="mx-auto mb-4 opacity-20"/>
                        No se encontraron materiales cargados.
                    </div>
                )}
            </div>

            {/* Extended Info Modal Overlay */}
            {viewingExtendedInfo && (
                <ExtendedInfoModal 
                    material={viewingExtendedInfo} 
                    onClose={() => setViewingExtendedInfo(null)} 
                />
            )}
        </div>
    );
};
