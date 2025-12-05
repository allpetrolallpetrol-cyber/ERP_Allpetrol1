
import React, { useState } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';

export const ApprovalSettings = () => {
    const { approvalRules, users, addApprovalRule, deleteApprovalRule } = useMasterData();
    const [min, setMin] = useState('');
    const [max, setMax] = useState('');
    const [approver, setApprover] = useState('');

    const handleAdd = () => {
        if (!min || !max || !approver) return;
        addApprovalRule({
            id: `RULE-${Date.now()}`,
            minAmount: parseFloat(min),
            maxAmount: parseFloat(max),
            approverId: approver
        });
        setMin('');
        setMax('');
        setApprover('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <ShieldCheck className="mr-2" /> Esquema de Liberación
            </h3>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase">Nueva Regla</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Monto Mínimo</label>
                        <input type="number" className="w-full px-3 py-2 border rounded bg-white" value={min} onChange={(e) => setMin(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Monto Máximo</label>
                        <input type="number" className="w-full px-3 py-2 border rounded bg-white" value={max} onChange={(e) => setMax(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Aprobador</label>
                        <select className="w-full px-3 py-2 border rounded bg-white" value={approver} onChange={(e) => setApprover(e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAdd} className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800">Agregar</button>
                </div>
            </div>

            <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                    <tr>
                        <th className="text-left p-4">Rango</th>
                        <th className="text-left p-4">Aprobador</th>
                        <th className="text-right p-4">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {approvalRules.map(rule => (
                        <tr key={rule.id} className="border-b">
                            <td className="p-4">${rule.minAmount} - ${rule.maxAmount}</td>
                            <td className="p-4">{users.find(u => u.id === rule.approverId)?.name}</td>
                            <td className="p-4 text-right"><button onClick={() => deleteApprovalRule(rule.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
