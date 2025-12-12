
import React, { useState } from 'react';
import { Trash2, Briefcase } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';

export const AreasView = () => {
    const { areas, addArea, deleteArea } = useMasterData();
    const [name, setName] = useState('');

    const handleAdd = async () => {
        if (!name) return;
        await addArea({ id: `AREA-${Date.now()}`, name });
        setName('');
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Briefcase className="mr-2 text-slate-500" size={20} />
                    Áreas de la Empresa
                </h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                    placeholder="Nombre del área (ej: Producción, Ventas)..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <button onClick={handleAdd} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors w-full md:w-auto">
                    Agregar
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0">
                        <tr>
                            <th className="p-4">Nombre del Área</th>
                            <th className="p-4 text-right hidden md:table-cell">ID Sistema</th>
                            <th className="p-4 text-right w-24">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {areas.map(area => (
                            <tr key={area.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-700">
                                    {area.name}
                                    <div className="md:hidden text-xs text-slate-400 font-mono mt-1">{area.id}</div>
                                </td>
                                <td className="p-4 text-right text-slate-400 font-mono text-xs hidden md:table-cell">{area.id}</td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => deleteArea(area.id)} 
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar Área"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {areas.length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">No hay áreas definidas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
