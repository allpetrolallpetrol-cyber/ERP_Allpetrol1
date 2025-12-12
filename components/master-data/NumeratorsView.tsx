
import React, { useState } from 'react';
import { Hash, Edit2, Save } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { Numerator } from '../../types';

export const NumeratorsView = () => {
    const { numerators, updateNumerator } = useMasterData();
    const [editing, setEditing] = useState<string | null>(null);
    const [val, setVal] = useState<number>(0);

    const handleEdit = (n: Numerator) => {
        setEditing(n.id);
        setVal(n.currentValue);
    };

    const handleSave = (n: Numerator) => {
        updateNumerator({ ...n, currentValue: val });
        setEditing(null);
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><Hash className="mr-2 text-slate-500" size={20}/> Configuración de Numeradores</h3>
            <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0">
                        <tr>
                            <th className="p-4">Documento</th>
                            <th className="p-4 hidden md:table-cell">Prefijo</th>
                            <th className="p-4 text-right">Valor Actual</th>
                            <th className="p-4 text-right w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {numerators.map(n => (
                            <tr key={n.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-medium text-slate-700">{n.name}</div>
                                    <div className="md:hidden text-xs text-slate-500 font-mono mt-0.5">Prefijo: {n.prefix || '-'}</div>
                                </td>
                                <td className="p-4 font-mono text-slate-500 hidden md:table-cell">{n.prefix || '-'}</td>
                                <td className="p-4 text-right">
                                    {editing === n.id ? (
                                        <input 
                                            type="number" 
                                            className="w-24 md:w-32 border border-blue-300 rounded px-2 py-1 text-right bg-white focus:ring-2 focus:ring-accent outline-none" 
                                            value={val} 
                                            onChange={e => setVal(parseInt(e.target.value))} 
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="font-mono font-bold text-slate-800">{n.currentValue}</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {editing === n.id ? (
                                        <button onClick={() => handleSave(n)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"><Save size={18}/></button>
                                    ) : (
                                        <button onClick={() => handleEdit(n)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={18}/></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
