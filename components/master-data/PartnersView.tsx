
import React, { useState } from 'react';
import { Users, Truck, Edit2, Plus, Search, ArrowLeft, Mail, Phone, Trash2, User } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { ContactPerson } from '../../types';

const PartnerForm = ({ type, initialData, onSave, onCancel }: any) => {
  const { showToast } = useUI();
  
  // Base Data
  const [formData, setFormData] = useState(initialData || {
      businessName: '',
      cuit: '',
      address: '',
      conditionIVA: 'Responsable Inscripto',
      paymentTerms: '',
      emails: [], // New Structure
      contacts: [] // New Structure
  });

  // State for adding dynamic items
  const [newEmail, setNewEmail] = useState('');
  const [newContact, setNewContact] = useState<ContactPerson>({ name: '', phone: '', email: '', role: '' });

  // Add Email to list
  const addEmail = () => {
      if (!newEmail.includes('@')) return showToast("Email inválido", 'error');
      if (formData.emails?.includes(newEmail)) return;
      
      setFormData({ ...formData, emails: [...(formData.emails || []), newEmail] });
      setNewEmail('');
  };

  const removeEmail = (email: string) => {
      setFormData({ ...formData, emails: formData.emails.filter((e: string) => e !== email) });
  };

  // Add Contact to list
  const addContact = () => {
      if (!newContact.name || !newContact.phone) return showToast("Nombre y Teléfono son obligatorios para el contacto", 'error');
      
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
        showToast("Razón Social y CUIT son obligatorios", 'error');
        return;
    }
    
    // Fallback support for old fields if needed by other components, though we rely on arrays now
    const payload = {
        ...formData,
        // Sync legacy fields just in case
        email: formData.emails?.[0] || '',
        contactName: formData.contacts?.[0]?.name || ''
    };

    onSave(payload);
  };

  return (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
            <h3 className="text-lg font-bold text-slate-800 text-right truncate ml-2">
                {initialData ? `Editar ${type === 'CLIENT' ? 'Cliente' : 'Prov.'}` : `Nuevo ${type === 'CLIENT' ? 'Cliente' : 'Prov.'}`}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
            {/* Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="mb-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-accent" value={formData.businessName} onChange={(e:any) => setFormData({...formData, businessName: e.target.value})} placeholder="Ej: Empresa S.A." />
                </div>
                <div className="mb-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-accent" value={formData.cuit} onChange={(e:any) => setFormData({...formData, cuit: e.target.value})} placeholder="Ej: 30-12345678-9" />
                </div>
                <div className="mb-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Fiscal / Entrega</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-accent" value={formData.address} onChange={(e:any) => setFormData({...formData, address: e.target.value})} />
                </div>
                {type === 'SUPPLIER' && (
                    <div className="mb-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cond. Pago</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-accent" value={formData.paymentTerms} onChange={(e:any) => setFormData({...formData, paymentTerms: e.target.value})} placeholder="Ej: 30 días FF" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* EMAILS SECTION */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><Mail size={16} className="mr-2"/> Correos para Notificaciones</h4>
                    <div className="flex gap-2 mb-3">
                        <input 
                            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white text-slate-900" 
                            placeholder="nuevo@email.com" 
                            value={newEmail} 
                            onChange={e => setNewEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addEmail()}
                        />
                        <button onClick={addEmail} className="bg-white border border-slate-300 hover:bg-slate-100 px-3 rounded-lg"><Plus size={18} className="text-slate-600"/></button>
                    </div>
                    <div className="space-y-2">
                        {formData.emails?.map((email: string, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                <span className="truncate text-slate-700">{email}</span>
                                <button onClick={() => removeEmail(email)} className="text-slate-400 hover:text-red-500"><XIcon size={14}/></button>
                            </div>
                        ))}
                        {(!formData.emails || formData.emails.length === 0) && <p className="text-xs text-slate-400 italic">Sin emails registrados.</p>}
                    </div>
                </div>

                {/* CONTACTS SECTION */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center"><Phone size={16} className="mr-2"/> Agenda de Contactos</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input className="px-2 py-1.5 text-sm border rounded bg-white text-slate-900" placeholder="Nombre" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                        <input className="px-2 py-1.5 text-sm border rounded bg-white text-slate-900" placeholder="Teléfono" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                        <input className="px-2 py-1.5 text-sm border rounded bg-white text-slate-900" placeholder="Email Personal" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                        <input className="px-2 py-1.5 text-sm border rounded bg-white text-slate-900" placeholder="Rol / Cargo" value={newContact.role} onChange={e => setNewContact({...newContact, role: e.target.value})} />
                    </div>
                    <button onClick={addContact} className="w-full py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded hover:bg-slate-100 mb-3">Agregar Persona</button>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {formData.contacts?.map((c: ContactPerson, idx: number) => (
                            <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-xs relative group">
                                <button onClick={() => removeContact(idx)} className="absolute top-1 right-1 text-slate-300 hover:text-red-500 hidden group-hover:block"><XIcon size={14}/></button>
                                <div className="font-bold text-slate-800">{c.name} <span className="font-normal text-slate-500">- {c.role}</span></div>
                                <div className="flex gap-2 text-slate-500 mt-1">
                                    <span className="flex items-center"><Phone size={10} className="mr-1"/> {c.phone}</span>
                                    {c.email && <span className="flex items-center"><Mail size={10} className="mr-1"/> {c.email}</span>}
                                </div>
                            </div>
                        ))}
                        {(!formData.contacts || formData.contacts.length === 0) && <p className="text-xs text-slate-400 italic">Sin contactos registrados.</p>}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
            <button onClick={handleSubmit} className="w-full md:w-auto float-right px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md transition-colors">Guardar</button>
        </div>
    </div>
  );
};

// Helper Icon
const XIcon = ({size}:{size:number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);

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
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden">
            <PartnerForm type={type} initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />
        </div>
    );

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    {type === 'CLIENT' ? <Users className="mr-2 text-slate-500" size={20}/> : <Truck className="mr-2 text-slate-500" size={20}/>}
                    {type === 'CLIENT' ? 'Clientes' : 'Proveedores'}
                </h3>
                <button onClick={() => { setSelected(null); setViewMode('FORM'); }} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium transition-colors">
                    <Plus size={18} className="mr-2"/> <span className="hidden md:inline">Nuevo</span><span className="md:hidden">Crear</span>
                </button>
            </div>
            
            <div className="mb-4 relative">
                <input type="text" placeholder="Buscar por nombre..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white text-slate-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b font-semibold text-slate-600 sticky top-0">
                        <tr>
                            <th className="p-3">Razón Social</th>
                            <th className="p-3 hidden md:table-cell">CUIT</th>
                            <th className="p-3 hidden md:table-cell">Contactos</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((item:any) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">
                                    <div className="font-medium text-slate-800">{item.businessName || item.name}</div>
                                    <div className="md:hidden text-xs text-slate-500 mt-0.5">CUIT: {item.cuit}</div>
                                </td>
                                <td className="p-3 hidden md:table-cell">{item.cuit}</td>
                                <td className="p-3 hidden md:table-cell">
                                    <div className="text-xs text-slate-600">
                                        {item.contacts?.length > 0 ? (
                                            <>
                                                <div className="font-bold">{item.contacts[0].name}</div>
                                                <div>{item.contacts[0].phone}</div>
                                                {item.contacts.length > 1 && <div className="text-slate-400 italic">+{item.contacts.length - 1} más</div>}
                                            </>
                                        ) : (
                                            <span className="text-slate-400">Sin contactos</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setSelected(item); setViewMode('FORM'); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No se encontraron registros.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
