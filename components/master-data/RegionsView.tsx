
import React, { useState } from 'react';
import { Trash2, MapPin, Plus } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';

export const RegionsView = () => {
    const { regions, addRegion, deleteRegion } = useMasterData();
    const { showToast } = useUI();
    const [name, setName] = useState('');

    const handleAdd = async () => {
        if (!name.trim()) return;
        if (regions.includes(name.trim())) {
            showToast('Esa región ya existe', 'error');
            return;
        }
        await addRegion(name.trim());
        setName('');
        showToast('Región agregada', 'success');
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <MapPin className="mr-2 text-slate-500" size={20} />
                    Provincias / Regiones
                </h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 mb-6 shrink-0">
                <input 
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white shadow-sm"
                    placeholder="Nombre de la provincia/región..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <button onClick={handleAdd} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center">
                    <Plus size={18} className="mr-1"/> Agregar
                </button>
            </div>

            <div className="border rounded-xl overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-sm min-w-[400px]">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4">Nombre de la Jurisdicción</th>
                            <th className="p-4 text-right w-24">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {regions.map(region => (
                            <tr key={region} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-700">{region}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => deleteRegion(region)} 
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {regions.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic">Cargando provincias...</div>
                )}
            </div>
        </div>
    );
};
