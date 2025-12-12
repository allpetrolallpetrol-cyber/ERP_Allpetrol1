
import React, { useState } from 'react';
import { CheckSquare, Edit2, Plus, X } from 'lucide-react';
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-auto">
                <div className="flex justify-between mb-6">
                    <h3 className="text-lg font-bold">Editor de Checklist</h3>
                    <button onClick={() => setView('LIST')} className="text-slate-500">Cancelar</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="mb-4">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Modelo</label>
                         <input className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={currentModel.name} onChange={(e:any) => setCurrentModel({...currentModel, name: e.target.value})} />
                    </div>
                    <div className="mb-4">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Activo</label>
                         <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={currentModel.assetType} onChange={(e:any) => setCurrentModel({...currentModel, assetType: e.target.value})}>
                            <option value="MACHINE">Máquina</option>
                            <option value="VEHICLE">Vehículo</option>
                         </select>
                    </div>
                </div>
                
                <h4 className="font-bold text-slate-700 mb-2">Puntos de Control</h4>
                <div className="space-y-2 mb-6">
                    {currentModel.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input 
                                className="flex-1 px-3 py-2 border rounded" 
                                placeholder="Descripción del punto a revisar..."
                                value={item.label}
                                onChange={e => updateItem(idx, 'label', e.target.value)}
                            />
                            <label className="flex items-center text-sm text-red-600 font-bold whitespace-nowrap">
                                <input type="checkbox" className="mr-1" checked={item.isCritical} onChange={e => updateItem(idx, 'isCritical', e.target.checked)} />
                                Crítico
                            </label>
                            <button onClick={() => {
                                const newItems = [...currentModel.items!];
                                newItems.splice(idx, 1);
                                setCurrentModel({...currentModel, items: newItems});
                            }} className="text-red-500"><X size={16}/></button>
                        </div>
                    ))}
                    <button onClick={addItem} className="text-sm text-blue-600 font-bold flex items-center mt-2"><Plus size={16} className="mr-1"/> Agregar Punto</button>
                </div>

                <div className="flex justify-end">
                    <button onClick={saveModel} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold">Guardar Modelo</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <CheckSquare className="mr-2 text-slate-500" size={20}/> Modelos de Checklist
                </h3>
                <button onClick={() => { setCurrentModel({name:'', assetType: AssetType.MACHINE, items:[]}); setView('EDIT'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium transition-colors">
                    <Plus size={18} className="mr-2"/> Nuevo Modelo
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                {checklistModels.map(m => (
                    <div key={m.id} className="border p-4 rounded-xl hover:shadow-md transition-shadow bg-slate-50 h-fit">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800">{m.name}</h4>
                            <button onClick={() => { setCurrentModel(m); setView('EDIT'); }} className="text-blue-600"><Edit2 size={16}/></button>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{m.assetType}</p>
                        <div className="text-sm text-slate-600">{m.items.length} puntos de control</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
