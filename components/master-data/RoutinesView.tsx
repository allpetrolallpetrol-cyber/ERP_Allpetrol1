
import React, { useState } from 'react';
import { Trash2, Edit2, CalendarClock, Plus, X } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { MaintenanceRoutine } from '../../types';

export const RoutinesView = () => {
    const { routines, assets, addRoutine, updateRoutine, deleteRoutine } = useMasterData();
    const { showToast } = useUI();
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [form, setForm] = useState<Partial<MaintenanceRoutine>>({
        assetId: '',
        name: '',
        frequencyDays: 30,
        discipline: 'Mecánica',
        estimatedHours: 1
    });

    const handleNew = () => {
        setEditingId(null);
        setForm({ assetId: '', name: '', frequencyDays: 30, discipline: 'Mecánica', estimatedHours: 1 });
        setIsEditing(true);
    };

    const handleEdit = (r: MaintenanceRoutine) => {
        setEditingId(r.id);
        setForm(r);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!form.assetId || !form.name) return showToast("Complete activo y nombre de tarea", 'error');
        
        const routine: MaintenanceRoutine = {
            id: editingId || `ROUTINE-${Date.now()}`,
            assetId: form.assetId,
            name: form.name,
            description: form.description || '',
            frequencyDays: form.frequencyDays || 30,
            discipline: form.discipline as any,
            estimatedHours: form.estimatedHours || 1,
            lastExecutionDate: (form as any).lastExecutionDate || new Date().toISOString().split('T')[0]
        };

        if (editingId) await updateRoutine(routine);
        else await addRoutine(routine);
        
        setIsEditing(false);
        setEditingId(null);
        showToast("Plan guardado correctamente", 'success');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingId(null);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <CalendarClock className="mr-2 text-slate-500" size={20} />
                    Planes de Mantenimiento (Preventivos)
                </h3>
                {!isEditing && (
                    <button onClick={handleNew} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium transition-colors">
                        <Plus size={18} className="mr-2"/> Nuevo Plan
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col relative">
                {/* Form Overlay or Inline */}
                {isEditing ? (
                    <div className="absolute inset-0 bg-white z-10 flex flex-col animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                             <h4 className="font-bold text-slate-700">{editingId ? 'Editar Plan' : 'Nuevo Plan'}</h4>
                             <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Activo</label>
                                    <select 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white" 
                                        value={form.assetId} 
                                        onChange={(e) => setForm({...form, assetId: e.target.value})}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Tarea</label>
                                    <input 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none" 
                                        value={form.name} 
                                        onChange={(e) => setForm({...form, name: e.target.value})} 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina</label>
                                    <select 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white"
                                        value={form.discipline} 
                                        onChange={(e:any) => setForm({...form, discipline: e.target.value})}
                                    >
                                        {['Mecánica', 'Eléctrica', 'Hidráulica', 'Neumática', 'General'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia (Días)</label>
                                        <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={form.frequencyDays} onChange={(e) => setForm({...form, frequencyDays: parseInt(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Horas Est.</label>
                                        <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={form.estimatedHours} onChange={(e) => setForm({...form, estimatedHours: parseFloat(e.target.value)})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t flex justify-end gap-3 mt-auto shrink-0">
                            <button onClick={handleCancel} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">Guardar Plan</button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-y-auto flex-1 border rounded-lg">
                        <table className="w-full text-sm text-left relative">
                            <thead className="bg-slate-50 font-semibold text-slate-500 sticky top-0 z-10 shadow-sm border-b">
                                <tr>
                                    <th className="p-3 bg-slate-50">Activo</th>
                                    <th className="p-3 bg-slate-50">Tarea</th>
                                    <th className="p-3 bg-slate-50">Disciplina</th>
                                    <th className="p-3 bg-slate-50">Frec.</th>
                                    <th className="p-3 bg-slate-50 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {routines.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3">{assets.find(a => a.id === r.assetId)?.name || <span className="text-red-400">Activo Eliminado</span>}</td>
                                        <td className="p-3 font-medium text-slate-700">{r.name}</td>
                                        <td className="p-3">{r.discipline}</td>
                                        <td className="p-3">{r.frequencyDays} días</td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteRoutine(r.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {routines.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay rutinas definidas.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
