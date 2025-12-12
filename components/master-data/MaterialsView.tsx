
import React, { useState, useMemo } from 'react';
import { Package, Edit2, Plus, Search, ArrowLeft } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';

const MaterialForm = ({ initialData, onSave, onCancel }: any) => {
    const { uoms, warehouses, warehouseLocations } = useMasterData();
    const { showToast } = useUI();
    const [formData, setFormData] = useState(initialData || {
        description: '',
        unitOfMeasure: 'UN',
        stock: 0,
        minStock: 0,
        cost: 0,
        warehouse: '',
        location: ''
    });

    const handleSubmit = () => {
        if (!formData.description) return showToast("Descripción obligatoria", 'error');
        onSave(formData);
    };

    // Filter locations based on selected warehouse
    const availableLocations = useMemo(() => {
        if (!formData.warehouse) return [];
        return warehouseLocations.filter(l => l.warehouseId === formData.warehouse);
    }, [formData.warehouse, warehouseLocations]);

    const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newWh = e.target.value;
        setFormData({ 
            ...formData, 
            warehouse: newWh, 
            location: '' // Reset location when warehouse changes
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-lg font-bold text-slate-800">{initialData ? 'Editar Material' : 'Nuevo Material'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.description} onChange={(e:any) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidad Medida</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.unitOfMeasure} onChange={(e:any) => setFormData({...formData, unitOfMeasure: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        {uoms.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial</label>
                    <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.stock} onChange={(e:any) => setFormData({...formData, stock: parseFloat(e.target.value)})} />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label>
                    <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.minStock} onChange={(e:any) => setFormData({...formData, minStock: parseFloat(e.target.value)})} />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Costo Unitario</label>
                    <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.cost} onChange={(e:any) => setFormData({...formData, cost: parseFloat(e.target.value)})} />
                </div>
                
                {/* WAREHOUSE SELECTION */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Almacén</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.warehouse} onChange={handleWarehouseChange}>
                        <option value="">Seleccionar Almacén...</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>

                {/* DYNAMIC LOCATION SELECTION */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
                    <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400" 
                        value={formData.location} 
                        onChange={(e:any) => setFormData({...formData, location: e.target.value})}
                        disabled={!formData.warehouse}
                    >
                        <option value="">{formData.warehouse ? 'Seleccionar Ubicación...' : 'Seleccione Almacén primero'}</option>
                        {availableLocations.map(loc => (
                            <option key={loc.id} value={loc.code}>{loc.code} {loc.description ? `- ${loc.description}` : ''}</option>
                        ))}
                    </select>
                </div>
                
                <div className="md:col-span-2 flex justify-end mt-4">
                    <button onClick={handleSubmit} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md w-full md:w-auto">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export const MaterialsView = () => {
    const { materials, addMaterial, getNextId, updateMaterial } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selected, setSelected] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (data: any) => {
        try {
            if (selected) {
                await updateMaterial({ ...selected, ...data });
            } else {
                const id = await getNextId('MATERIAL');
                await addMaterial({ id, code: id, ...data });
            }
            showToast('Material guardado', 'success');
            setViewMode('LIST');
        } catch (e) {
            console.error(e);
            showToast('Error', 'error');
        }
    };

    const filtered = materials.filter(m => m.description.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase()));

    if (viewMode === 'FORM') return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-auto">
            <MaterialForm initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Package className="mr-2 text-slate-500" size={20} /> Maestro de Materiales
                </h3>
                <button onClick={() => { setSelected(null); setViewMode('FORM'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium transition-colors">
                    <Plus size={18} className="mr-2"/> Nuevo
                </button>
            </div>
            
            <div className="mb-4 relative">
                <input type="text" placeholder="Buscar por código o descripción..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="border rounded-lg overflow-hidden flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0">
                        <tr>
                            <th className="p-3">Código</th>
                            <th className="p-3">Descripción</th>
                            <th className="p-3 text-right">Stock</th>
                            <th className="p-3 text-right">Costo</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono text-slate-600">{m.code}</td>
                                <td className="p-3 font-medium">{m.description}</td>
                                <td className="p-3 text-right">{m.stock} {m.unitOfMeasure}</td>
                                <td className="p-3 text-right">${m.cost}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setSelected(m); setViewMode('FORM'); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
