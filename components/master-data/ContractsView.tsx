
import React, { useState } from 'react';
import { Plus, Search, FileText, Calendar, Trash2, Edit2, CheckCircle, X, DollarSign } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { Contract } from '../../types';

export const ContractsView = () => {
    const { contracts, materials, suppliers, addContract, updateContract, deleteContract } = useMasterData();
    const { showToast, showConfirm } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<Partial<Contract>>({
        materialId: '',
        supplierId: '',
        price: 0,
        currency: 'ARS',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // +1 year
        isActive: true
    });

    const handleSave = async () => {
        if (!formData.materialId || !formData.supplierId || !formData.price) {
            showToast("Complete los campos obligatorios", 'error');
            return;
        }

        const mat = materials.find(m => m.id === formData.materialId);
        const sup = suppliers.find(s => s.id === formData.supplierId);

        const contract: Contract = {
            id: selectedContract?.id || `CTR-${Date.now()}`,
            materialId: formData.materialId,
            materialName: mat?.description || 'Material desconocido',
            supplierId: formData.supplierId,
            supplierName: sup?.businessName || 'Proveedor desconocido',
            price: formData.price,
            currency: formData.currency || 'ARS',
            validFrom: formData.validFrom || '',
            validTo: formData.validTo || '',
            isActive: formData.isActive ?? true
        };

        if (selectedContract) await updateContract(contract);
        else await addContract(contract);

        showToast("Contrato guardado correctamente", 'success');
        setViewMode('LIST');
        setSelectedContract(null);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm("Eliminar Contrato", "¿Está seguro que desea eliminar este acuerdo de precios?", 'danger');
        if (confirmed) {
            await deleteContract(id);
            showToast("Contrato eliminado");
        }
    };

    if (viewMode === 'FORM') {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <FileText className="mr-2 text-accent" /> {selectedContract ? 'Editar Contrato Marco' : 'Nuevo Contrato Marco'}
                    </h3>
                    <button onClick={() => setViewMode('LIST')}><X /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Material / Materia Prima</label>
                        <select className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.materialId} onChange={e => setFormData({...formData, materialId: e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.description} ({m.code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Proveedor Adjudicado</label>
                        <select className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.businessName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Precio Pactado</label>
                        <div className="flex gap-2">
                            <select className="w-24 px-2 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                                <option value="ARS">ARS</option>
                                <option value="USD">USD</option>
                            </select>
                            <input type="number" className="flex-1 px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Vigencia Desde</label>
                            <input type="date" className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.validFrom} onChange={e => setFormData({...formData, validFrom: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Vigencia Hasta</label>
                            <input type="date" className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.validTo} onChange={e => setFormData({...formData, validTo: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={() => setViewMode('LIST')} className="px-6 py-2 text-slate-500 font-medium">Cancelar</button>
                    <button onClick={handleSave} className="px-8 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-md hover:bg-slate-800">Guardar Acuerdo</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <FileText className="mr-2 text-slate-500" size={20}/> Acuerdos de Precios (Contratos Marco)
                </h3>
                <button onClick={() => { setSelectedContract(null); setFormData({isActive:true, validFrom: new Date().toISOString().split('T')[0], validTo: new Date(Date.now() + 31536000000).toISOString().split('T')[0]}); setViewMode('FORM'); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center font-bold shadow-sm">
                    <Plus size={18} className="mr-2"/> Nuevo Acuerdo
                </button>
            </div>

            <div className="mb-4 relative shrink-0">
                <input type="text" placeholder="Buscar por material o proveedor..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>

            <div className="border rounded-xl overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b sticky top-0 font-bold text-slate-600 z-10">
                        <tr>
                            <th className="p-4">Material</th>
                            <th className="p-4">Proveedor</th>
                            <th className="p-4">Precio Pactado</th>
                            <th className="p-4">Vigencia</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {contracts.filter(c => c.materialName.toLowerCase().includes(searchTerm.toLowerCase()) || c.supplierName.toLowerCase().includes(searchTerm.toLowerCase())).map(contract => (
                            <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-700">{contract.materialName}</td>
                                <td className="p-4 text-slate-600">{contract.supplierName}</td>
                                <td className="p-4 font-mono font-bold text-accent">{contract.currency} {contract.price.toLocaleString()}</td>
                                <td className="p-4 text-slate-400 text-xs">{contract.validFrom} al {contract.validTo}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${contract.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {contract.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setSelectedContract(contract); setFormData(contract); setViewMode('FORM'); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16}/></button>
                                        <button onClick={() => handleDelete(contract.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
