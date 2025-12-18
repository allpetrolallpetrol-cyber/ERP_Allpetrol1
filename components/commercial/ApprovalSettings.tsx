
import React, { useState } from 'react';
import { ShieldCheck, Trash2, Plus, Shield } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';

export const ApprovalSettings = () => {
    const { approvalRules, users, addApprovalRule, deleteApprovalRule } = useMasterData();
    const [min, setMin] = useState('');
    const [max, setMax] = useState('');
    const [approver, setApprover] = useState('');

    // Filter users who are marked as approvers
    const approverUsers = users.filter(u => u.isApprover);

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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center shrink-0">
                <ShieldCheck className="mr-2 text-accent" /> Esquema de Liberación de Compras
            </h3>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 shrink-0 shadow-inner">
                <h4 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">Configurar Nueva Regla</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Monto Mínimo</label>
                        <input type="number" className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-accent" value={min} onChange={(e) => setMin(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Monto Máximo</label>
                        <input type="number" className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-accent" value={max} onChange={(e) => setMax(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Aprobador Asignado</label>
                        <select className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-accent" value={approver} onChange={(e) => setApprover(e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {approverUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.lastName}, {u.firstName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleAdd} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center">
                        <Plus size={18} className="mr-1"/> Agregar
                    </button>
                </div>
                {approverUsers.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-2 font-bold uppercase italic">No hay usuarios habilitados como aprobadores en el maestro de usuarios.</p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar border rounded-xl shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0">
                        <tr>
                            <th className="p-4">Rango de Importe</th>
                            <th className="p-4">Responsable de Firma</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {approvalRules.map(rule => {
                            const approverUser = users.find(u => u.id === rule.approverId);
                            return (
                                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono font-bold text-slate-700">${rule.minAmount.toLocaleString()} → ${rule.maxAmount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <Shield size={14} className="mr-2 text-blue-500" />
                                            {approverUser ? `${approverUser.lastName}, ${approverUser.firstName}` : <span className="text-red-400 italic">Desvinculado</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => deleteApprovalRule(rule.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {approvalRules.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic">No hay reglas de liberación configuradas.</div>
                )}
            </div>
        </div>
    );
};
