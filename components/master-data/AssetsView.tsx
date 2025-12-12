
import React, { useState } from 'react';
import { Cog, Edit2, Plus, Search, ArrowLeft, CalendarClock, Trash2, Save } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { Asset, MaintenanceRoutine } from '../../types';

const AssetForm = ({ initialData, onSave, onCancel }: any) => {
    const { machineTypes, vehicleTypes, routines, addRoutine, deleteRoutine } = useMasterData();
    const { showToast } = useUI();
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'MAINTENANCE'>('GENERAL');
    
    // Asset Data State
    const [formData, setFormData] = useState(initialData || {
        id: '', // Will be set on save if new
        name: '',
        type: 'MACHINE',
        subtype: '',
        brand: '',
        model: '',
        serialNumber: '',
        plate: ''
    });

    // New Routine State (Inside Asset View)
    const [newRoutine, setNewRoutine] = useState<Partial<MaintenanceRoutine>>({
        name: '',
        frequencyDays: 30,
        discipline: 'Mecánica',
        estimatedHours: 1
    });

    // Filter routines for this asset (if it exists)
    const assetRoutines = initialData?.id ? routines.filter(r => r.assetId === initialData.id) : [];

    const handleSubmit = () => {
        if (!formData.name) return showToast("Nombre obligatorio", 'error');
        onSave(formData);
    };

    const handleAddRoutine = async () => {
        if(!initialData?.id) {
            showToast("Primero debe guardar el activo para asignar planes.", 'error');
            return;
        }
        if(!newRoutine.name) return;

        await addRoutine({
            id: `ROUTINE-${Date.now()}`,
            assetId: initialData.id,
            name: newRoutine.name!,
            discipline: newRoutine.discipline as any,
            frequencyDays: newRoutine.frequencyDays || 30,
            estimatedHours: newRoutine.estimatedHours || 1,
            lastExecutionDate: new Date().toISOString().split('T')[0],
            description: ''
        });
        
        setNewRoutine({ name: '', frequencyDays: 30, discipline: 'Mecánica', estimatedHours: 1 });
        showToast("Plan agregado correctamente", 'success');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-lg font-bold text-slate-800">{initialData ? 'Editar Activo' : 'Nuevo Activo'}</h3>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button 
                    onClick={() => setActiveTab('GENERAL')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'GENERAL' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Datos Generales
                </button>
                <button 
                    onClick={() => setActiveTab('MAINTENANCE')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'MAINTENANCE' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    disabled={!initialData?.id} // Disable if creating new
                    title={!initialData?.id ? "Guarde el activo primero" : ""}
                >
                    Planes de Mantenimiento
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'GENERAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Identificación</label>
                            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.type} onChange={(e:any) => setFormData({...formData, type: e.target.value})}>
                                <option value="MACHINE">Máquina / Equipo</option>
                                <option value="VEHICLE">Vehículo</option>
                            </select>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subtipo</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.subtype} onChange={(e:any) => setFormData({...formData, subtype: e.target.value})}>
                                <option value="">Seleccionar...</option>
                                {(formData.type === 'MACHINE' ? machineTypes : vehicleTypes).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.brand} onChange={(e:any) => setFormData({...formData, brand: e.target.value})} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.model} onChange={(e:any) => setFormData({...formData, model: e.target.value})} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nro Serie</label>
                            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.serialNumber} onChange={(e:any) => setFormData({...formData, serialNumber: e.target.value})} />
                        </div>
                        
                        {formData.type === 'VEHICLE' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Patente</label>
                                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.plate} onChange={(e:any) => setFormData({...formData, plate: e.target.value})} />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'MAINTENANCE' && (
                    <div className="animate-in fade-in">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                            <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center"><Plus size={16} className="mr-1"/> Agregar Nuevo Plan</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Tarea</label>
                                    <input className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-sm" value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} placeholder="Ej: Cambio Aceite"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Frecuencia (Días)</label>
                                    <input type="number" className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-sm" value={newRoutine.frequencyDays} onChange={e => setNewRoutine({...newRoutine, frequencyDays: parseInt(e.target.value)})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Disciplina</label>
                                    <select className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-sm" value={newRoutine.discipline} onChange={(e:any) => setNewRoutine({...newRoutine, discipline: e.target.value})}>
                                        {['Mecánica', 'Eléctrica', 'Hidráulica', 'Neumática', 'General'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleAddRoutine} className="bg-blue-600 text-white py-1.5 px-3 rounded font-bold text-sm hover:bg-blue-700">Agregar</button>
                            </div>
                        </div>

                        <h4 className="font-bold text-slate-700 mb-2">Planes Activos ({assetRoutines.length})</h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 font-semibold text-slate-600">
                                    <tr>
                                        <th className="p-3">Tarea</th>
                                        <th className="p-3">Frecuencia</th>
                                        <th className="p-3">Disciplina</th>
                                        <th className="p-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assetRoutines.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-medium text-slate-700">{r.name}</td>
                                            <td className="p-3 text-slate-600">{r.frequencyDays} días</td>
                                            <td className="p-3 text-slate-600">{r.discipline}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => deleteRoutine(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {assetRoutines.length === 0 && (
                                        <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic">No hay planes asignados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {activeTab === 'GENERAL' && (
                <div className="mt-4 pt-4 border-t flex justify-end">
                    <button onClick={handleSubmit} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md">
                        {initialData ? 'Guardar Cambios' : 'Crear Activo'}
                    </button>
                </div>
            )}
        </div>
    );
};

export const AssetsView = () => {
    const { assets, addAsset, getNextId } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selected, setSelected] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (data: any) => {
        try {
            const finalId = selected?.id || `ASSET-${Date.now()}`;
            const code = selected?.code || `EQ-${Date.now().toString().slice(-4)}`;
            
            await addAsset({ id: finalId, code, ...data });
            showToast('Activo guardado', 'success');
            setViewMode('LIST');
        } catch (e) {
            console.error(e);
            showToast('Error', 'error');
        }
    };

    const filtered = assets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.code.toLowerCase().includes(searchTerm.toLowerCase()));

    if (viewMode === 'FORM') return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-auto">
            <AssetForm initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Cog className="mr-2 text-slate-500" size={20} /> Maestro de Activos
                </h3>
                <button onClick={() => { setSelected(null); setViewMode('FORM'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium transition-colors">
                    <Plus size={18} className="mr-2"/> Nuevo Activo
                </button>
            </div>
            
            <div className="mb-4 relative">
                <input type="text" placeholder="Buscar activo..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0">
                        <tr>
                            <th className="p-3">Código</th>
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Marca/Modelo</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono text-slate-600">{a.code}</td>
                                <td className="p-3 font-medium">{a.name}</td>
                                <td className="p-3">{a.type}</td>
                                <td className="p-3">{a.brand} {a.model}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setSelected(a); setViewMode('FORM'); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
