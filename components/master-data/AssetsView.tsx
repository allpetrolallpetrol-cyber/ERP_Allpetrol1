
import React, { useState } from 'react';
import { Cog, Edit2, Plus, Search, ArrowLeft, CalendarClock, Trash2, Save } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { Asset, MaintenanceRoutine } from '../../types';

const AssetForm = ({ initialData, onSave, onCancel }: any) => {
    const { machineTypes, vehicleTypes, routines, addRoutine, deleteRoutine } = useMasterData();
    const { showToast } = useUI();
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'MAINTENANCE'>('GENERAL');
    
    const [formData, setFormData] = useState(initialData || {
        id: '',
        name: '',
        type: 'MACHINE',
        subtype: '',
        brand: '',
        model: '',
        serialNumber: '',
        plate: ''
    });

    const [newRoutine, setNewRoutine] = useState<Partial<MaintenanceRoutine>>({
        name: '',
        frequencyDays: 30,
        discipline: 'Mecánica',
        estimatedHours: 1
    });

    const assetRoutines = initialData?.id ? routines.filter(r => r.assetId === initialData.id) : [];

    const handleSubmit = () => {
        if (!formData.name) return showToast("Nombre obligatorio", 'error');
        onSave(formData);
    };

    const handleAddRoutine = async () => {
        if(!initialData?.id) {
            showToast("Guarde el activo primero.", 'error');
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
            <div className="flex justify-between items-center mb-4 shrink-0">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-lg font-bold text-slate-800">{initialData ? 'Editar Activo' : 'Nuevo Activo'}</h3>
            </div>

            <div className="flex border-b border-slate-200 mb-6 shrink-0 overflow-x-auto custom-scrollbar">
                <button 
                    onClick={() => setActiveTab('GENERAL')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'GENERAL' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Datos Generales
                </button>
                <button 
                    onClick={() => setActiveTab('MAINTENANCE')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'MAINTENANCE' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    disabled={!initialData?.id}
                >
                    Planes de Mantenimiento
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === 'GENERAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in pb-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre / Identificación</label>
                            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.type} onChange={(e:any) => setFormData({...formData, type: e.target.value, subtype: ''})}>
                                <option value="MACHINE">Máquina / Equipo</option>
                                <option value="VEHICLE">Vehículo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Subtipo</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.subtype} onChange={(e:any) => setFormData({...formData, subtype: e.target.value})}>
                                <option value="">Seleccionar...</option>
                                {(formData.type === 'MACHINE' ? machineTypes : vehicleTypes).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Marca / Modelo</label>
                            <div className="flex gap-2">
                                <input placeholder="Marca" className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg" value={formData.brand} onChange={(e:any) => setFormData({...formData, brand: e.target.value})} />
                                <input placeholder="Modelo" className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg" value={formData.model} onChange={(e:any) => setFormData({...formData, model: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nro Serie {formData.type === 'VEHICLE' && '/ Patente'}</label>
                            <div className="flex gap-2">
                                <input placeholder="Nro Serie" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg" value={formData.serialNumber} onChange={(e:any) => setFormData({...formData, serialNumber: e.target.value})} />
                                {formData.type === 'VEHICLE' && <input placeholder="Patente" className="w-1/3 px-3 py-2 border border-slate-300 rounded-lg" value={formData.plate} onChange={(e:any) => setFormData({...formData, plate: e.target.value})} />}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'MAINTENANCE' && (
                    <div className="animate-in fade-in pb-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                            <h4 className="text-xs font-bold text-blue-800 mb-4 uppercase">Nuevo Plan de Preventivo</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tarea</label>
                                    <input className="w-full px-3 py-2 border rounded-lg text-sm" value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} placeholder="Nombre tarea"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cada (Días)</label>
                                    <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={newRoutine.frequencyDays} onChange={e => setNewRoutine({...newRoutine, frequencyDays: parseInt(e.target.value)})}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Dsciplina</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white text-sm" value={newRoutine.discipline} onChange={(e:any) => setNewRoutine({...newRoutine, discipline: e.target.value})}>
                                        {['Mecánica', 'Eléctrica', 'Hidráulica', 'Neumática', 'General'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleAddRoutine} className="bg-blue-600 text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm transition-all">Agregar Plan</button>
                            </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Planes Activos ({assetRoutines.length})</h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                    <tr>
                                        <th className="p-3">Descripción Tarea</th>
                                        <th className="p-3 text-center">Frecuencia</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {assetRoutines.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50">
                                            <td className="p-3">
                                                <div className="font-bold text-slate-800">{r.name}</div>
                                                <div className="text-[10px] text-slate-400">{r.discipline}</div>
                                            </td>
                                            <td className="p-3 text-center font-mono">{r.frequencyDays}d</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => deleteRoutine(r.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {assetRoutines.length === 0 && (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic text-xs">Sin planes vinculados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t flex justify-end shrink-0">
                <button onClick={handleSubmit} className="px-10 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md">
                    {initialData ? 'Guardar Cambios' : 'Crear Activo'}
                </button>
            </div>
        </div>
    );
};

export const AssetsView = () => {
    const { assets, addAsset } = useMasterData();
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
            showToast('Error al guardar', 'error');
        }
    };

    const filtered = assets.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (viewMode === 'FORM') return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden">
            <AssetForm initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />
        </div>
    );

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Cog className="mr-2 text-slate-500" size={20} /> Maestro de Activos
                </h3>
                <button onClick={() => { setSelected(null); setViewMode('FORM'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium transition-colors">
                    <Plus size={18} className="mr-2"/> Nuevo
                </button>
            </div>
            
            <div className="mb-4 relative shrink-0">
                <input type="text" placeholder="Buscar por nombre, código o serie..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="border rounded-lg overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-32">Código</th>
                            <th className="p-3">Nombre del Activo</th>
                            <th className="p-3">Subtipo / Marca</th>
                            <th className="p-3">Nro Serie</th>
                            <th className="p-3 text-right w-20">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filtered.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono text-slate-500 font-bold">{a.code}</td>
                                <td className="p-3 font-medium text-slate-800">
                                    {a.name}
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">{a.type}</div>
                                </td>
                                <td className="p-3 text-slate-600">
                                    <div className="font-semibold">{a.subtype || '-'}</div>
                                    <div className="text-xs">{a.brand} {a.model}</div>
                                </td>
                                <td className="p-3 font-mono text-xs text-slate-500">{a.serialNumber}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setSelected(a); setViewMode('FORM'); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic">No se encontraron activos.</div>
                )}
            </div>
        </div>
    );
};
