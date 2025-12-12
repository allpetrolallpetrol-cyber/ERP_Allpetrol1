
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><Hash className="mr-2 text-slate-500" size={20}/> Configuración de Numeradores</h3>
            <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4">Documento</th>
                            <th className="p-4">Prefijo</th>
                            <th className="p-4 text-right">Valor Actual</th>
                            <th className="p-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {numerators.map(n => (
                            <tr key={n.id} className="hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-700">{n.name}</td>
                                <td className="p-4 font-mono text-slate-500">{n.prefix || '-'}</td>
                                <td className="p-4 text-right">
                                    {editing === n.id ? (
                                        <input type="number" className="w-32 border rounded px-2 py-1 text-right" value={val} onChange={e => setVal(parseInt(e.target.value))} />
                                    ) : (
                                        <span className="font-mono font-bold">{n.currentValue}</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {editing === n.id ? (
                                        <button onClick={() => handleSave(n)} className="text-green-600 hover:text-green-700"><Save size={18}/></button>
                                    ) : (
                                        <button onClick={() => handleEdit(n)} className="text-blue-600 hover:text-blue-700"><Edit2 size={18}/></button>
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
