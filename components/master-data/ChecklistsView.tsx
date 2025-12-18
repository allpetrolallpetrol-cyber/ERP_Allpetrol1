
import React, { useState } from 'react';
import { CheckSquare, Edit2, Plus, X, Trash2 } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { ChecklistModel, AssetType, ChecklistItemDefinition } from '../../types';

export const ChecklistsView = () => {
    const { checklistModels, addChecklistModel, updateChecklistModel } = useMasterData();
    const [view, setView] = useState<'LIST' | 'EDIT'>('LIST');
    const [currentModel, setCurrentModel] = useState<Partial<ChecklistModel>>({
        name: '',
        assetType: AssetType.MACHINE,
        items: []
    });

    const addItem = () => {
        const newItem: ChecklistItemDefinition = { id: `ITM-${Date.now()}`, label: '', isCritical: false };
        setCurrentModel(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    };

    const updateItem = (idx: number, field: keyof ChecklistItemDefinition, val: any) => {
        const newItems = [...(currentModel.items || [])];
        newItems[idx] = { ...newItems[idx], [field]: val };
        setCurrentModel(prev => ({ ...prev, items: newItems }));
    };

    const saveModel = async () => {
        if (!currentModel.name) return;
        const model: ChecklistModel = {
            id: currentModel.id || `CHK-${Date.now()}`,
            name: currentModel.name!,
            assetType: currentModel.assetType || AssetType.MACHINE,
            items: currentModel.items || []
        };
        if (currentModel.id) await updateChecklistModel(model);
        else await addChecklistModel(model);
        
        setView('LIST');
        setCurrentModel({ name: '', assetType: AssetType.MACHINE, items: [] });
    };

    if (view === 'EDIT') {
        return (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in slide-in-from-right-4 overflow-hidden">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">{currentModel.id ? 'Editar Modelo' : 'Nuevo Modelo de Checklist'}</h3>
                    <button onClick={() => setView('LIST')} className="text-slate-500 hover:text-slate-800"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre del Modelo</label>
                             <input className="w-full px-3 py-2 border rounded-lg" value={currentModel.name} onChange={(e:any) => setCurrentModel({...currentModel, name: e.target.value})} placeholder="Ej: Inspección Diaria Autoelevador" />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo de Activo</label>
                             <select className="w-full px-3 py-2 border rounded-lg bg-white" value={currentModel.assetType} onChange={(e:any) => setCurrentModel({...currentModel, assetType: e.target.value})}>
                                <option value="MACHINE">Máquina / Equipo</option>
                                <option value="VEHICLE">Vehículo</option>
                             </select>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Puntos de Control ({currentModel.items?.length || 0})</h4>
                        <button onClick={addItem} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center hover:bg-slate-800 transition-colors"><Plus size={14} className="mr-1"/> Agregar Punto</button>
                    </div>

                    <div className="space-y-3">
                        {currentModel.items?.map((item, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
                                <div className="flex-1">
                                    <input 
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white" 
                                        placeholder="Descripción del punto a revisar..."
                                        value={item.label}
                                        onChange={e => updateItem(idx, 'label', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                                    <label className="flex items-center text-xs text-red-600 font-bold whitespace-nowrap cursor-pointer select-none">
                                        <input type="checkbox" className="mr-1.5 w-4 h-4 rounded text-red-600" checked={item.isCritical} onChange={e => updateItem(idx, 'isCritical', e.target.checked)} />
                                        Es Crítico
                                    </label>
                                    <button onClick={() => {
                                        const newItems = [...currentModel.items!];
                                        newItems.splice(idx, 1);
                                        setCurrentModel({...currentModel, items: newItems});
                                    }} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                        {(!currentModel.items || currentModel.items.length === 0) && (
                            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">Agregue puntos de control para iniciar el modelo.</div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end shrink-0">
                    <button onClick={saveModel} disabled={!currentModel.name || !currentModel.items?.length} className="px-10 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-all active:scale-95 disabled:opacity-50">Guardar Modelo</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <CheckSquare className="mr-2 text-slate-500" size={20}/> Modelos de Inspección
                </h3>
                <button onClick={() => { setCurrentModel({name:'', assetType: AssetType.MACHINE, items:[]}); setView('EDIT'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors">
                    <Plus size={18} className="mr-2"/> Nuevo Modelo
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                    {checklistModels.map(m => (
                        <div key={m.id} className="border p-5 rounded-2xl hover:shadow-lg transition-all bg-white border-slate-100 flex flex-col group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-accent transition-colors"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 leading-tight mb-1">{m.name}</h4>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.assetType}</span>
                                </div>
                                <button onClick={() => { setCurrentModel(m); setView('EDIT'); }} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition-colors shrink-0 ml-2"><Edit2 size={16}/></button>
                            </div>
                            <div className="mt-auto flex items-center text-xs text-slate-500 font-medium">
                                <CheckSquare size={14} className="mr-1.5 text-slate-400"/> {m.items.length} puntos definidos
                            </div>
                        </div>
                    ))}
                    {checklistModels.length === 0 && (
                        <div className="col-span-full p-20 text-center text-slate-400 italic bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">No hay modelos de checklist creados.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
