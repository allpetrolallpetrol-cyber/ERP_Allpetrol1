
import React, { useState } from 'react';
import { Users, Truck, Edit2, Plus, Search, ArrowLeft, Mail, Phone, Trash2, User, Hash, X, MapPin } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { ContactPerson } from '../../types';

const PartnerForm = ({ type, initialData, onSave, onCancel }: any) => {
  const { showToast } = useUI();
  const { regions } = useMasterData();
  
  const [formData, setFormData] = useState(initialData || {
      businessName: '',
      cuit: '',
      address: '',
      region: '',
      conditionIVA: 'Responsable Inscripto',
      paymentTerms: '',
      emails: [], 
      contacts: [] 
  });

  const [newEmail, setNewEmail] = useState('');
  const [newContact, setNewContact] = useState<ContactPerson>({ name: '', phone: '', email: '', role: '' });

  const addEmail = () => {
      if (!newEmail.includes('@')) return showToast("Email inválido", 'error');
      if (formData.emails?.includes(newEmail)) return;
      setFormData({ ...formData, emails: [...(formData.emails || []), newEmail] });
      setNewEmail('');
  };

  const removeEmail = (email: string) => {
      setFormData({ ...formData, emails: formData.emails.filter((e: string) => e !== email) });
  };

  const addContact = () => {
      if (!newContact.name || !newContact.phone) return showToast("Nombre y Teléfono requeridos", 'error');
      setFormData({ ...formData, contacts: [...(formData.contacts || []), newContact] });
      setNewContact({ name: '', phone: '', email: '', role: '' });
  };

  const removeContact = (idx: number) => {
      const newList = [...formData.contacts];
      newList.splice(idx, 1);
      setFormData({ ...formData, contacts: newList });
  };

  const handleSubmit = () => {
    if (!formData.businessName || !formData.cuit) {
        showToast("Razón Social y CUIT obligatorios", 'error');
        return;
    }
    onSave(formData);
  };

  return (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver al listado</button>
            <h3 className="text-lg font-bold text-slate-800">
                {initialData ? `Editar ${type === 'CLIENT' ? 'Cliente' : 'Proveedor'}` : `Nuevo ${type === 'CLIENT' ? 'Cliente' : 'Proveedor'}`}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="mb-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.businessName} onChange={(e:any) => setFormData({...formData, businessName: e.target.value})} placeholder="Ej: Empresa S.A." />
                </div>
                <div className="mb-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.cuit} onChange={(e:any) => setFormData({...formData, cuit: e.target.value})} placeholder="Ej: 30-12345678-9" />
                </div>
                <div className="mb-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Fiscal</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.address} onChange={(e:any) => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="mb-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Región / Provincia</label>
                    <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                        <select 
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent appearance-none" 
                            value={formData.region} 
                            onChange={(e:any) => setFormData({...formData, region: e.target.value})}
                        >
                            <option value="">Seleccionar Provincia...</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>
                {type === 'SUPPLIER' && (
                    <div className="mb-1 col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Condición de Pago</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent" value={formData.paymentTerms} onChange={(e:any) => setFormData({...formData, paymentTerms: e.target.value})} placeholder="Ej: 30 días FF" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><Mail size={16} className="mr-2"/> Correos para Notificaciones</h4>
                    <div className="flex gap-2 mb-3">
                        <input className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white" placeholder="email@empresa.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEmail()} />
                        <button onClick={addEmail} className="bg-white border border-slate-300 hover:bg-slate-100 px-3 rounded-lg"><Plus size={18} className="text-slate-600"/></button>
                    </div>
                    <div className="space-y-2">
                        {formData.emails?.map((email: string, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                <span className="truncate text-slate-700">{email}</span>
                                <button onClick={() => removeEmail(email)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><Phone size={16} className="mr-2"/> Agenda de Contactos</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input className="px-2 py-1.5 text-sm border rounded bg-white" placeholder="Nombre" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                        <input className="px-2 py-1.5 text-sm border rounded bg-white" placeholder="Teléfono" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                    </div>
                    <button onClick={addContact} className="w-full py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded hover:bg-slate-100 mb-3">Agregar Persona</button>
                    <div className="space-y-2">
                        {formData.contacts?.map((c: ContactPerson, idx: number) => (
                            <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-xs">
                                <div className="flex justify-between font-bold text-slate-800">
                                    <span>{c.name}</span>
                                    <button onClick={() => removeContact(idx)} className="text-red-400"><Trash2 size={12}/></button>
                                </div>
                                <div className="text-slate-500 mt-1 flex gap-2"><span>{c.phone}</span> {c.email && <span>| {c.email}</span>}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 shrink-0 flex justify-end">
            <button onClick={handleSubmit} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md">Guardar</button>
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
            showToast('Error al guardar', 'error');
        }
    };

    const filtered = list.filter((i:any) => 
        (i.businessName || i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.cuit || '').includes(searchTerm)
    );

    if (viewMode === 'FORM') return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden">
            <PartnerForm type={type} initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />
        </div>
    );

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    {type === 'CLIENT' ? <Users className="mr-2 text-slate-500" size={20}/> : <Truck className="mr-2 text-slate-500" size={20}/>}
                    {type === 'CLIENT' ? 'Clientes' : 'Proveedores'}
                </h3>
                <button onClick={() => { setSelected(null); setViewMode('FORM'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium transition-colors">
                    <Plus size={18} className="mr-2"/> Nuevo
                </button>
            </div>
            
            <div className="mb-4 relative shrink-0">
                <input type="text" placeholder="Buscar por nombre, número o CUIT..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="border rounded-lg overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-32">Nro Partner</th>
                            <th className="p-3">Razón Social</th>
                            <th className="p-3">Provincia</th>
                            <th className="p-3">CUIT</th>
                            <th className="p-3">Contactos</th>
                            <th className="p-3 text-right w-20">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((item:any) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono text-slate-500 font-bold">{item.id}</td>
                                <td className="p-3">
                                    <div className="font-medium text-slate-800">{item.businessName || item.name}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{item.address}</div>
                                </td>
                                <td className="p-3">
                                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{item.region || 'Sin región'}</span>
                                </td>
                                <td className="p-3 font-mono text-slate-600">{item.cuit}</td>
                                <td className="p-3">
                                    {item.contacts?.length > 0 ? (
                                        <div className="text-xs">
                                            <div className="font-bold text-slate-700 truncate max-w-[150px]">{item.contacts[0].name}</div>
                                            <div className="text-slate-500">{item.contacts[0].phone}</div>
                                        </div>
                                    ) : <span className="text-slate-400 italic text-xs">-</span>}
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setSelected(item); setViewMode('FORM'); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic">No se encontraron interlocutores.</div>
                )}
            </div>
        </div>
    );
};
