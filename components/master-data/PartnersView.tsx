
import React, { useState } from 'react';
import { Users, Truck, Edit2, Plus, Search, ArrowLeft } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';

const PartnerForm = ({ type, initialData, onSave, onCancel }: any) => {
  const { showToast } = useUI();
  const [formData, setFormData] = useState(initialData || {
      businessName: '',
      cuit: '',
      address: '',
      contactName: '',
      email: '',
      conditionIVA: 'Responsable Inscripto',
      paymentTerms: '',
  });

  const handleSubmit = () => {
    if (!formData.businessName || !formData.cuit) {
        showToast("Razón Social y CUIT son obligatorios", 'error');
        return;
    }
    onSave(formData);
  };

  return (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
            <h3 className="text-lg font-bold text-slate-800">
                {initialData ? `Editar ${type === 'CLIENT' ? 'Cliente' : 'Proveedor'}` : `Nuevo ${type === 'CLIENT' ? 'Cliente' : 'Proveedor'}`}
            </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.businessName} onChange={(e:any) => setFormData({...formData, businessName: e.target.value})} />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.cuit} onChange={(e:any) => setFormData({...formData, cuit: e.target.value})} />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.address} onChange={(e:any) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Contacto</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.contactName} onChange={(e:any) => setFormData({...formData, contactName: e.target.value})} />
            </div>
            {type === 'SUPPLIER' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cond. Pago</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={formData.paymentTerms} onChange={(e:any) => setFormData({...formData, paymentTerms: e.target.value})} />
                </div>
            )}
            
            <div className="col-span-2 flex justify-end mt-4">
                <button onClick={handleSubmit} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md">Guardar</button>
            </div>
        </div>
    </div>
  );
};

export const PartnersView = ({ type }: { type: 'CLIENT' | 'SUPPLIER' }) => {
    const { clients, suppliers, addClient, addSupplier, getNextId } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selected, setSelected] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const list = type === 'CLIENT' ? clients : suppliers;

    const handleSave = async (data: any) => {
        try {
            const id = selected?.id || await getNextId(type);
            if (type === 'CLIENT') await addClient({ id, ...data });
            else await addSupplier({ id, ...data });
            showToast('Guardado correctamente', 'success');
            setViewMode('LIST');
        } catch (e) {
            console.error(e);
            showToast('Error al guardar', 'error');
        }
    };

    const filtered = list.filter((i:any) => (i.businessName || i.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

    if (viewMode === 'FORM') return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-auto">
            <PartnerForm type={type} initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    {type === 'CLIENT' ? <Users className="mr-2 text-slate-500" size={20}/> : <Truck className="mr-2 text-slate-500" size={20}/>}
                    {type === 'CLIENT' ? 'Maestro de Clientes' : 'Maestro de Proveedores'}
                </h3>
                <button onClick={() => { setSelected(null); setViewMode('FORM'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium transition-colors">
                    <Plus size={18} className="mr-2"/> Nuevo {type === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                </button>
            </div>
            
            <div className="mb-4 relative">
                <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0">
                        <tr>
                            <th className="p-3">Razón Social</th>
                            <th className="p-3">CUIT</th>
                            <th className="p-3">Contacto</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((item:any) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">{item.businessName || item.name}</td>
                                <td className="p-3">{item.cuit}</td>
                                <td className="p-3">{item.contactName}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setSelected(item); setViewMode('FORM'); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
