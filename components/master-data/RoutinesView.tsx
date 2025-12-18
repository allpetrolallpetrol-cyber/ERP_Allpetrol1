
import React, { useState } from 'react';
import { Trash2, Edit2, CalendarClock, Plus, X } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { MaintenanceRoutine } from '../../types';

export const RoutinesView = () => {
    const { routines, assets, addRoutine, updateRoutine, deleteRoutine } = useMasterData();
    const { showToast } = useUI();
    
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

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
        if (!form.assetId || !form.name) return showToast("Complete los datos requeridos", 'error');
        
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
        showToast("Plan guardado", 'success');
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <CalendarClock className="mr-2 text-slate-500" size={20} />
                    Planes Preventivos
                </h3>
                {!isEditing && (
                    <button onClick={handleNew} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors shadow-sm">
                        <Plus size={18} className="mr-2"/> Nuevo Plan
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                {isEditing ? (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-4 border-b pb-2 shrink-0">
                             <h4 className="font-bold text-slate-700">{editingId ? 'Editar Plan' : 'Nuevo Plan Preventivo'}</h4>
                             <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Activo Asociado</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white" value={form.assetId} onChange={(e) => setForm({...form, assetId: e.target.value})}>
                                        <option value="">Seleccionar equipo...</option>
                                        {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre de Tarea</label>
                                    <input className="w-full px-3 py-2 border rounded-lg" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Ej: Engrase General" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Disciplina</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white" value={form.discipline} onChange={(e:any) => setForm({...form, discipline: e.target.value})}>
                                        {['Mecánica', 'Eléctrica', 'Hidráulica', 'Neumática', 'General'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Frecuencia (Días)</label>
                                        <input type="number" className="w-full px-3 py-2 border rounded-lg" value={form.frequencyDays} onChange={(e) => setForm({...form, frequencyDays: parseInt(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Horas Est.</label>
                                        <input type="number" className="w-full px-3 py-2 border rounded-lg" value={form.estimatedHours} onChange={(e) => setForm({...form, estimatedHours: parseFloat(e.target.value)})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-sm">Guardar Plan</button>
                        </div>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-auto h-full custom-scrollbar">
                        <table className="w-full text-sm text-left min-w-[650px]">
                            <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0 z-10 border-b">
                                <tr>
                                    <th className="p-3">Equipo</th>
                                    <th className="p-3">Tarea Preventiva</th>
                                    <th className="p-3 text-center">Frecuencia</th>
                                    <th className="p-3 text-right w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {routines.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3">
                                            <div className="font-bold text-slate-800">{assets.find(a => a.id === r.assetId)?.name || 'Activo s/n'}</div>
                                            <div className="text-[10px] text-slate-400">{r.discipline}</div>
                                        </td>
                                        <td className="p-3 text-slate-700">{r.name}</td>
                                        <td className="p-3 text-center font-mono font-bold text-blue-600 bg-blue-50/30">{r.frequencyDays}d</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                                <button onClick={() => deleteRoutine(r.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {routines.length === 0 && <div className="p-12 text-center text-slate-400 italic">Sin planes definidos.</div>}
                    </div>
                )}
            </div>
        </div>
    );
};
