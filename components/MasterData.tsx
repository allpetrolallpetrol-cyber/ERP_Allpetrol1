
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Trash2, Edit2, Search, List, MapPin, Ruler, Tag, Hash, CheckSquare, X, CheckCircle, CalendarClock, Cog, Truck, Settings, ArrowLeft, AlertTriangle, FileDigit, Users, Eye, Package, Briefcase, UserCircle, Grid, Lock } from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Material, MaintenanceRoutine, AssetType, Asset, ChecklistModel, ChecklistItemDefinition, Numerator, DocumentType, Warehouse, WarehouseLocation, Client, Supplier, Area } from '../types';

// --- Reusable UI Components ---

const Input = ({ label, readOnly, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input 
        disabled={readOnly}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-500" 
        {...props} 
    />
  </div>
);

const Select = ({ label, options, readOnly, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select 
        disabled={readOnly}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white disabled:bg-slate-100 disabled:text-slate-500" 
        {...props}
    >
      <option value="">Seleccionar...</option>
      {options.map((opt: any) => (
          <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
              {typeof opt === 'object' ? opt.label : opt}
          </option>
      ))}
    </select>
  </div>
);

const SectionHeader = ({ title, actionLabel, onAction, icon: Icon, readOnly }: any) => (
  <div className="flex justify-between items-center mb-6">
    <h3 className="text-lg font-bold text-slate-800 flex items-center">
        {Icon && <Icon className="mr-2 text-slate-500" size={20} />}
        {title}
    </h3>
    {!readOnly && actionLabel && (
        <button onClick={onAction} className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md transition-all">
            <Plus size={18} className="mr-2"/> {actionLabel}
        </button>
    )}
  </div>
);

// --- Forms ---

const ClientForm = ({ type, initialData, onSave, onCancel, readOnly }: { type: 'CLIENT' | 'SUPPLIER', initialData?: any, onSave: (data: any) => void, onCancel: () => void, readOnly?: boolean }) => {
  const { regions } = useMasterData();
  const { showToast } = useUI();
  const [formData, setFormData] = useState(initialData || {
      businessName: '',
      cuit: '',
      address: '',
      contactName: '',
      email: '',
      conditionIVA: 'Responsable Inscripto',
      paymentTerms: '', // Only for Supplier
      region: ''
  });

  const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = () => {
    if (readOnly) return;
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
                {readOnly ? `Ver ${type === 'CLIENT' ? 'Cliente' : 'Proveedor'}` : (initialData ? `Editar ${type === 'CLIENT' ? 'Cliente' : 'Proveedor'}` : `Nuevo ${type === 'CLIENT' ? 'Cliente' : 'Proveedor'}`)}
            </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Razón Social" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Ej. Empresa S.A." readOnly={readOnly} />
            <Input label="CUIT" name="cuit" value={formData.cuit} onChange={handleChange} placeholder="XX-XXXXXXXX-X" readOnly={readOnly} />
            <Input label="Dirección" name="address" value={formData.address} onChange={handleChange} placeholder="Calle, Número, Localidad" readOnly={readOnly} />
            
            <div>
                <Input label="Email(s) para Pedidos" name="email" value={formData.email} onChange={handleChange} placeholder="ventas@prov.com, juan@prov.com" readOnly={readOnly} />
                {!readOnly && <p className="text-xs text-slate-500 -mt-3 mb-3">Para múltiples destinatarios, separe las direcciones con comas.</p>}
            </div>

            <Input label="Contacto Principal" name="contactName" value={formData.contactName} onChange={handleChange} readOnly={readOnly} />
            <Select label="Condición IVA" name="conditionIVA" value={formData.conditionIVA} onChange={handleChange} options={['Responsable Inscripto', 'Monotributo', 'Exento', 'Consumidor Final']} readOnly={readOnly} />
            
            {type === 'SUPPLIER' && (
                <Input label="Condición de Pago" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} placeholder="Ej. 30 Días FF" readOnly={readOnly} />
            )}
            
            <Select label="Provincia / Región" name="region" value={formData.region} onChange={handleChange} options={regions} readOnly={readOnly} />
            
            {!readOnly && (
                <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
                    <button onClick={handleSubmit} className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                        <Save size={18} className="mr-2"/> Guardar {type === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

// --- Client & Supplier Master Views ---

const ClientMasterView = ({ readOnly }: { readOnly?: boolean }) => {
    const { clients, addClient, getNextId } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleCreate = () => {
        setSelectedClient(null);
        setViewMode('FORM');
    };

    const handleEdit = (c: Client) => {
        setSelectedClient(c);
        setViewMode('FORM');
    };

    const handleSave = async (data: any) => {
        try {
            const id = selectedClient?.id || await getNextId('CLIENT');
            await addClient({ id, ...data });
            showToast(`Cliente ${selectedClient ? 'actualizado' : 'creado'} correctamente.`, 'success');
            setViewMode('LIST');
        } catch (e) {
            console.error(e);
            showToast("Error al guardar cliente", 'error');
        }
    };

    const filteredList = useMemo(() => {
        if(!searchTerm) return clients;
        const term = searchTerm.toLowerCase();
        return clients.filter(c => c.businessName.toLowerCase().includes(term) || c.cuit.includes(term));
    }, [clients, searchTerm]);

    if (viewMode === 'FORM') {
        return <ClientForm type="CLIENT" initialData={selectedClient} onSave={handleSave} onCancel={() => setViewMode('LIST')} readOnly={readOnly} />;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <SectionHeader title="Maestro de Clientes" actionLabel="Nuevo Cliente" onAction={handleCreate} icon={UserCircle} readOnly={readOnly} />
             
             <div className="mb-4 relative">
                <input 
                    type="text" 
                    placeholder="Buscar por Razón Social o CUIT..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
             </div>

             <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Razón Social</th>
                            <th className="px-4 py-3">CUIT</th>
                            <th className="px-4 py-3">Contacto</th>
                            <th className="px-4 py-3">Email(s)</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredList.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50 group">
                                <td className="px-4 py-3 font-medium text-slate-800">{c.businessName}</td>
                                <td className="px-4 py-3 text-slate-600 font-mono">{c.cuit}</td>
                                <td className="px-4 py-3 text-slate-500">{c.contactName || '-'}</td>
                                <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]" title={c.email}>{c.email || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(c)} className="text-accent hover:text-blue-700 font-medium">
                                        {readOnly ? <Eye size={16}/> : <Edit2 size={16} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {filteredList.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay clientes registrados con ese criterio.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

const SupplierMasterView = ({ readOnly }: { readOnly?: boolean }) => {
    const { suppliers, addSupplier, getNextId } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleCreate = () => {
        setSelectedSupplier(null);
        setViewMode('FORM');
    };

    const handleEdit = (s: Supplier) => {
        setSelectedSupplier(s);
        setViewMode('FORM');
    };

    const handleSave = async (data: any) => {
        try {
            const id = selectedSupplier?.id || await getNextId('SUPPLIER');
            await addSupplier({ id, ...data });
            showToast(`Proveedor ${selectedSupplier ? 'actualizado' : 'creado'} correctamente.`, 'success');
            setViewMode('LIST');
        } catch (e) {
            console.error(e);
            showToast("Error al guardar proveedor", 'error');
        }
    };

    const filteredList = useMemo(() => {
        if(!searchTerm) return suppliers;
        const term = searchTerm.toLowerCase();
        return suppliers.filter(s => s.name.toLowerCase().includes(term) || s.cuit.includes(term));
    }, [suppliers, searchTerm]);

    if (viewMode === 'FORM') {
        const formInitialData = selectedSupplier ? {
            ...selectedSupplier,
            businessName: (selectedSupplier as any).name || selectedSupplier.businessName // Handle legacy/mismatch
        } : null;

        return <ClientForm type="SUPPLIER" initialData={formInitialData} onSave={handleSave} onCancel={() => setViewMode('LIST')} readOnly={readOnly} />;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <SectionHeader title="Maestro de Proveedores" actionLabel="Nuevo Proveedor" onAction={handleCreate} icon={Briefcase} readOnly={readOnly} />
             
             <div className="mb-4 relative">
                <input 
                    type="text" 
                    placeholder="Buscar por Razón Social o CUIT..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
             </div>

             <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Razón Social</th>
                            <th className="px-4 py-3">CUIT</th>
                            <th className="px-4 py-3">Contacto</th>
                            <th className="px-4 py-3">Email(s)</th>
                            <th className="px-4 py-3">Cond. Pago</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredList.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 group">
                                <td className="px-4 py-3 font-medium text-slate-800">{(s as any).name || s.businessName}</td>
                                <td className="px-4 py-3 text-slate-600 font-mono">{s.cuit}</td>
                                <td className="px-4 py-3 text-slate-500">{s.contactName || '-'}</td>
                                <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]" title={s.email}>{s.email || '-'}</td>
                                <td className="px-4 py-3 text-slate-500">{s.paymentTerms || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(s)} className="text-accent hover:text-blue-700 font-medium">
                                        {readOnly ? <Eye size={16}/> : <Edit2 size={16} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {filteredList.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay proveedores registrados con ese criterio.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

// --- Areas (Sectores) Master View ---

const AreasMasterView = ({ readOnly }: { readOnly?: boolean }) => {
    const { areas, addArea, deleteArea } = useMasterData();
    const { showToast, showConfirm } = useUI();
    const [newAreaName, setNewAreaName] = useState('');

    const handleAdd = async () => {
        if (!newAreaName.trim()) return;
        const id = `AREA-${Date.now()}`;
        try {
            await addArea({ id, name: newAreaName });
            showToast('Área agregada', 'success');
            setNewAreaName('');
        } catch (e) {
            console.error(e);
            showToast("Error al agregar área", 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm(
            'Eliminar Área', 
            '¿Está seguro de eliminar esta área? Los usuarios asignados podrían quedar inconsistentes.',
            'danger'
        );
        if (confirmed) {
            await deleteArea(id);
            showToast('Área eliminada', 'info');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <SectionHeader title="Gestión de Áreas y Sectores" icon={Grid} readOnly={readOnly} />
             
             {!readOnly && (
                 <div className="flex gap-4 items-end mb-6 border-b border-slate-100 pb-6">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Área / Departamento</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-accent" 
                            placeholder="Ej. Recursos Humanos" 
                            value={newAreaName}
                            onChange={(e) => setNewAreaName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
                    >
                        Agregar
                    </button>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map(area => (
                    <div key={area.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center group">
                        <span className="font-medium text-slate-800">{area.name}</span>
                        {!readOnly && (
                            <button onClick={() => handleDelete(area.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
                {areas.length === 0 && <p className="text-slate-400 italic">No hay áreas definidas.</p>}
             </div>
        </div>
    );
};

// --- Asset Master View ---

const RoutineInlineForm = ({ assetId, initialData, onSave, onCancel }: { assetId: string, initialData?: MaintenanceRoutine, onSave: (r: MaintenanceRoutine) => void, onCancel: () => void }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [discipline, setDiscipline] = useState<any>(initialData?.discipline || 'Mecánica');
    const [freq, setFreq] = useState(initialData?.frequencyDays || 30);
    const [hours, setHours] = useState(initialData?.estimatedHours || 1);
    
    const handleSubmit = () => {
        if(!name) return;
        onSave({
            id: initialData?.id || `RT-${Date.now()}`,
            assetId,
            name,
            discipline,
            frequencyDays: freq,
            estimatedHours: hours,
            lastExecutionDate: initialData?.lastExecutionDate || new Date().toISOString().split('T')[0],
            description: initialData?.description || ''
        });
    };

    return (
        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mt-2 mb-4 animate-in fade-in">
            <h5 className="font-bold text-slate-700 text-sm mb-3">{initialData ? 'Editar Rutina' : 'Nueva Rutina Preventiva'}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre Tarea</label>
                    <input className="w-full px-2 py-1 border rounded text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Cambio de Aceite" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Disciplina</label>
                    <select className="w-full px-2 py-1 border rounded text-sm" value={discipline} onChange={e => setDiscipline(e.target.value)}>
                        <option value="Mecánica">Mecánica</option>
                        <option value="Eléctrica">Eléctrica</option>
                        <option value="Hidráulica">Hidráulica</option>
                        <option value="Neumática">Neumática</option>
                        <option value="General">General</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Frecuencia (Días)</label>
                    <input type="number" className="w-full px-2 py-1 border rounded text-sm" value={freq} onChange={e => setFreq(Number(e.target.value))} />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Horas Est.</label>
                    <input type="number" className="w-full px-2 py-1 border rounded text-sm" value={hours} onChange={e => setHours(Number(e.target.value))} />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="text-slate-500 text-sm px-3 py-1 hover:bg-slate-200 rounded">Cancelar</button>
                <button onClick={handleSubmit} className="bg-blue-600 text-white text-sm px-3 py-1 rounded font-medium hover:bg-blue-700">Guardar Rutina</button>
            </div>
        </div>
    );
};

const AssetForm = ({ initialData, onSave, onCancel, readOnly }: { initialData?: Asset, onSave: (data: Asset) => void, onCancel: () => void, readOnly?: boolean }) => {
    const { machineTypes, vehicleTypes, routines, addRoutine, updateRoutine, deleteRoutine } = useMasterData();
    const { showToast, showConfirm } = useUI();
    
    // Asset State
    const [formData, setFormData] = useState<Partial<Asset>>(initialData || {
        code: '',
        name: '',
        type: AssetType.MACHINE,
        subtype: '',
        brand: '',
        model: '',
        serialNumber: '',
        location: '',
        plate: '',
        mileage: 0
    });

    // Routine State
    const [isAddingRoutine, setIsAddingRoutine] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<MaintenanceRoutine | null>(null);

    // Get routines for THIS asset
    const assetRoutines = useMemo(() => {
        return initialData ? routines.filter(r => r.assetId === initialData.id) : [];
    }, [routines, initialData]);

    const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = () => {
        if (!formData.code || !formData.name) {
            showToast("Código y Nombre son obligatorios", 'error');
            return;
        }
        onSave(formData as Asset);
    };

    // Routine Handlers
    const handleSaveRoutine = async (r: MaintenanceRoutine) => {
        if (!initialData) return;
        try {
            if (editingRoutine) await updateRoutine(r);
            else await addRoutine(r);
            showToast('Rutina guardada', 'success');
            setIsAddingRoutine(false);
            setEditingRoutine(null);
        } catch (e) {
            console.error(e);
            showToast('Error al guardar rutina', 'error');
        }
    };

    const handleDeleteRoutine = async (id: string) => {
        const confirm = await showConfirm("Eliminar Rutina", "¿Confirma eliminar este plan preventivo?", "danger");
        if(confirm) {
            await deleteRoutine(id);
            showToast('Rutina eliminada', 'info');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-lg font-bold text-slate-800">
                    {readOnly ? 'Ver Activo' : (initialData ? 'Editar Activo' : 'Nuevo Activo')}
                </h3>
            </div>
            
            {/* General Data Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6 shadow-sm">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center"><Cog className="mr-2" size={20}/> Datos Generales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Código Interno" name="code" value={formData.code} onChange={handleChange} readOnly={readOnly} />
                    <Input label="Nombre / Descripción" name="name" value={formData.name} onChange={handleChange} readOnly={readOnly} />
                    <Select label="Tipo de Activo" name="type" value={formData.type} onChange={handleChange} options={[{label: 'Máquina / Equipo', value: AssetType.MACHINE}, {label: 'Vehículo / Flota', value: AssetType.VEHICLE}]} readOnly={readOnly} />
                    
                    <Select 
                        label="Subtipo / Categoría" 
                        name="subtype" 
                        value={formData.subtype} 
                        onChange={handleChange} 
                        options={formData.type === AssetType.MACHINE ? machineTypes : vehicleTypes} 
                        readOnly={readOnly}
                    />

                    <Input label="Marca" name="brand" value={formData.brand} onChange={handleChange} readOnly={readOnly} />
                    <Input label="Modelo" name="model" value={formData.model} onChange={handleChange} readOnly={readOnly} />
                    <Input label="Nro. Serie / Chasis" name="serialNumber" value={formData.serialNumber} onChange={handleChange} readOnly={readOnly} />
                    
                    {formData.type === AssetType.MACHINE ? (
                        <Input label="Ubicación en Planta" name="location" value={formData.location} onChange={handleChange} readOnly={readOnly} />
                    ) : (
                        <>
                            <Input label="Patente / Dominio" name="plate" value={formData.plate} onChange={handleChange} readOnly={readOnly} />
                            <Input label="Kilometraje Actual" name="mileage" type="number" value={formData.mileage} onChange={handleChange} readOnly={readOnly} />
                        </>
                    )}
                </div>

                {!readOnly && (
                    <div className="flex justify-end mt-4">
                        <button onClick={handleSubmit} className="flex items-center px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md">
                            <Save size={18} className="mr-2"/> Guardar Activo
                        </button>
                    </div>
                )}
            </div>

            {/* Maintenance Plan Section - ONLY VISIBLE IF EDITING EXISTING ASSET */}
            {initialData && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700 flex items-center"><CalendarClock className="mr-2" size={20}/> Plan de Mantenimiento Preventivo</h4>
                        {!readOnly && !isAddingRoutine && !editingRoutine && (
                            <button onClick={() => setIsAddingRoutine(true)} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 font-medium flex items-center">
                                <Plus size={14} className="mr-1"/> Agregar Plan
                            </button>
                        )}
                    </div>

                    {(isAddingRoutine || editingRoutine) && (
                        <RoutineInlineForm 
                            assetId={initialData.id} 
                            initialData={editingRoutine || undefined} 
                            onSave={handleSaveRoutine}
                            onCancel={() => { setIsAddingRoutine(false); setEditingRoutine(null); }}
                        />
                    )}

                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Tarea / Rutina</th>
                                    <th className="px-4 py-3">Frecuencia</th>
                                    <th className="px-4 py-3">Disciplina</th>
                                    <th className="px-4 py-3">Última Ejec.</th>
                                    {!readOnly && <th className="px-4 py-3 text-right">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {assetRoutines.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{r.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{r.frequencyDays} días</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${r.discipline === 'Mecánica' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                                {r.discipline}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{r.lastExecutionDate}</td>
                                        {!readOnly && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingRoutine(r)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                                                    <button onClick={() => handleDeleteRoutine(r.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {assetRoutines.length === 0 && (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-400 italic">Este activo no tiene planes preventivos asignados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {!initialData && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-700 text-sm flex items-center">
                    <AlertTriangle size={18} className="mr-2"/>
                    Guarde el activo primero para poder asignarle planes de mantenimiento preventivo.
                </div>
            )}
        </div>
    );
};

const AssetMasterView = ({ readOnly }: { readOnly?: boolean }) => {
    const { assets, addAsset } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (data: Asset) => {
        const id = selectedAsset?.id || `ASSET-${Date.now()}`;
        await addAsset({ ...data, id });
        showToast('Activo guardado correctamente', 'success');
        // If it was a new asset, switch to edit mode to allow adding routines immediately? 
        // Or just go back to list. Let's go back to list for simplicity, user can click edit.
        // Actually, better UX: if new, set selectedAsset to the new one and keep form open?
        // For now, consistent behavior: go to list.
        setViewMode('LIST');
    };

    const filtered = assets.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (viewMode === 'FORM') return <AssetForm initialData={selectedAsset || undefined} onSave={handleSave} onCancel={() => setViewMode('LIST')} readOnly={readOnly} />;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <SectionHeader title="Maestro de Activos" actionLabel="Nuevo Activo" onAction={() => { setSelectedAsset(null); setViewMode('FORM'); }} icon={Cog} readOnly={readOnly} />
            <div className="mb-4 relative">
                <input 
                    type="text" 
                    placeholder="Buscar activo..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Marca/Modelo</th>
                            <th className="px-4 py-3">Ubicación/Patente</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-mono text-slate-600">{a.code}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                                <td className="px-4 py-3">{a.type === AssetType.MACHINE ? 'Máquina' : 'Vehículo'} <span className="text-slate-400 text-xs">({a.subtype})</span></td>
                                <td className="px-4 py-3 text-slate-600">{a.brand} {a.model}</td>
                                <td className="px-4 py-3 text-slate-600">{a.type === AssetType.MACHINE ? a.location : a.plate}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => { setSelectedAsset(a); setViewMode('FORM'); }} className="text-accent hover:text-blue-700">
                                        {readOnly ? <Eye size={16}/> : <Edit2 size={16} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Material Master View ---

const MaterialForm = ({ initialData, onSave, onCancel, readOnly }: { initialData?: Material, onSave: (data: Material) => void, onCancel: () => void, readOnly?: boolean }) => {
    const { uoms, suppliers, warehouses, warehouseLocations } = useMasterData();
    const { showToast } = useUI();
    const [formData, setFormData] = useState<Partial<Material>>(initialData || {
        code: '',
        description: '',
        unitOfMeasure: 'UN',
        stock: 0,
        minStock: 0,
        cost: 0,
        warehouse: '',
        location: '',
        assignedSupplierIds: []
    });

    const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});

    const toggleSupplier = (id: string) => {
        if(readOnly) return;
        const current = formData.assignedSupplierIds || [];
        if (current.includes(id)) {
            setFormData({...formData, assignedSupplierIds: current.filter(s => s !== id)});
        } else {
            setFormData({...formData, assignedSupplierIds: [...current, id]});
        }
    };

    const handleSubmit = () => {
        if (!formData.code || !formData.description) {
            showToast("Código y Descripción obligatorios", 'error');
            return;
        }
        onSave(formData as Material);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-lg font-bold text-slate-800">
                    {readOnly ? 'Ver Material' : (initialData ? 'Editar Material' : 'Nuevo Material')}
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Código SKU" name="code" value={formData.code} onChange={handleChange} readOnly={readOnly} />
                <Input label="Descripción" name="description" value={formData.description} onChange={handleChange} readOnly={readOnly} />
                <Select label="Unidad de Medida" name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} options={uoms} readOnly={readOnly} />
                
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Stock Actual" name="stock" type="number" value={formData.stock} onChange={handleChange} readOnly={readOnly} />
                    <Input label="Stock Mínimo" name="minStock" type="number" value={formData.minStock} onChange={handleChange} readOnly={readOnly} />
                </div>
                
                <Input label="Costo Referencia" name="cost" type="number" value={formData.cost} onChange={handleChange} readOnly={readOnly} />
                
                <Select label="Almacén Principal" name="warehouse" value={formData.warehouse} onChange={handleChange} options={warehouses.map(w => ({label: w.name, value: w.id}))} readOnly={readOnly} />
                <Select label="Ubicación Default" name="location" value={formData.location} onChange={handleChange} options={warehouseLocations.filter(l => !formData.warehouse || l.warehouseId === formData.warehouse).map(l => ({label: l.code, value: l.code}))} readOnly={readOnly} />

                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Proveedores Habilitados</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 rounded-lg bg-slate-50">
                        {suppliers.map(s => (
                            <button 
                                key={s.id} 
                                onClick={() => toggleSupplier(s.id)}
                                disabled={readOnly}
                                className={`px-2 py-1 text-xs rounded border ${formData.assignedSupplierIds?.includes(s.id) ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-slate-200 text-slate-500'} ${readOnly ? 'cursor-default' : ''}`}
                            >
                                {(s as any).name || s.businessName}
                            </button>
                        ))}
                    </div>
                </div>

                {!readOnly && (
                    <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
                        <button onClick={handleSubmit} className="flex items-center px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md">
                            <Save size={18} className="mr-2"/> Guardar Material
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const MaterialMasterView = ({ readOnly }: { readOnly?: boolean }) => {
    const { materials, addMaterial, getNextId } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (data: Material) => {
        const id = selectedMaterial?.id || await getNextId('MATERIAL');
        await addMaterial({ ...data, id });
        showToast('Material guardado correctamente', 'success');
        setViewMode('LIST');
    };

    const filtered = materials.filter(m => 
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (viewMode === 'FORM') return <MaterialForm initialData={selectedMaterial || undefined} onSave={handleSave} onCancel={() => setViewMode('LIST')} readOnly={readOnly} />;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <SectionHeader title="Maestro de Materiales" actionLabel="Nuevo Material" onAction={() => { setSelectedMaterial(null); setViewMode('FORM'); }} icon={Package} readOnly={readOnly} />
            <div className="mb-4 relative">
                <input type="text" placeholder="Buscar material..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Descripción</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3">Ubicación</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-mono text-slate-600">{m.code}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{m.description}</td>
                                <td className={`px-4 py-3 font-bold ${m.stock <= m.minStock ? 'text-red-500' : 'text-slate-700'}`}>{m.stock} {m.unitOfMeasure}</td>
                                <td className="px-4 py-3 text-slate-500">{m.location || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => { setSelectedMaterial(m); setViewMode('FORM'); }} className="text-accent hover:text-blue-700">
                                        {readOnly ? <Eye size={16}/> : <Edit2 size={16} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Warehouse & Locations ---

const WarehouseMasterView = ({ readOnly }: { readOnly?: boolean }) => {
    const { warehouses, addWarehouse, updateWarehouse } = useMasterData();
    const { showToast } = useUI();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [resp, setResp] = useState('');

    const handleSave = async () => {
        if (!name) return;
        const id = editingId || `WH-${Date.now()}`;
        if (editingId) await updateWarehouse({ id, name, responsible: resp });
        else await addWarehouse({ id, name, responsible: resp });
        showToast('Depósito guardado', 'success');
        setEditingId(null); setName(''); setResp('');
    };

    const startEdit = (w: Warehouse) => {
        setEditingId(w.id);
        setName(w.name);
        setResp(w.responsible || '');
    };

    return (
        <div>
            <h4 className="font-bold text-slate-800 mb-4">Depósitos / Almacenes Físicos</h4>
            {!readOnly && (
                <div className="flex gap-4 mb-6 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-500">Nombre Depósito</label>
                        <input className="w-full border rounded px-3 py-2 bg-white" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-500">Responsable</label>
                        <input className="w-full border rounded px-3 py-2 bg-white" value={resp} onChange={e => setResp(e.target.value)} />
                    </div>
                    <button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded font-medium">{editingId ? 'Actualizar' : 'Crear'}</button>
                    {editingId && <button onClick={() => { setEditingId(null); setName(''); setResp(''); }} className="text-slate-500 px-2">Cancelar</button>}
                </div>
            )}
            <div className="grid gap-3">
                {warehouses.map(w => (
                    <div key={w.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                        <div>
                            <p className="font-bold text-slate-800">{w.name}</p>
                            <p className="text-xs text-slate-500">Resp: {w.responsible}</p>
                        </div>
                        {!readOnly && <button onClick={() => startEdit(w)} className="text-accent"><Edit2 size={16}/></button>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const LocationMasterView = ({ readOnly }: { readOnly?: boolean }) => {
    const { warehouses, warehouseLocations, addWarehouseLocation, updateWarehouseLocation } = useMasterData();
    const { showToast } = useUI();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [whId, setWhId] = useState('');
    const [code, setCode] = useState('');

    const handleSave = async () => {
        if (!whId || !code) return;
        const id = editingId || `LOC-${Date.now()}`;
        if (editingId) await updateWarehouseLocation({ id, warehouseId: whId, code });
        else await addWarehouseLocation({ id, warehouseId: whId, code });
        showToast('Ubicación guardada', 'success');
        setEditingId(null); setCode('');
    };

    const startEdit = (l: WarehouseLocation) => {
        setEditingId(l.id);
        setWhId(l.warehouseId);
        setCode(l.code);
    };

    return (
        <div>
            <h4 className="font-bold text-slate-800 mb-4">Ubicaciones (Racks / Estantes)</h4>
            {!readOnly && (
                <div className="flex gap-4 mb-6 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-500">Almacén</label>
                        <select className="w-full border rounded px-3 py-2 bg-white" value={whId} onChange={e => setWhId(e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-500">Código Ubicación</label>
                        <input className="w-full border rounded px-3 py-2 bg-white" value={code} onChange={e => setCode(e.target.value)} placeholder="Ej. A-01-01" />
                    </div>
                    <button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded font-medium">{editingId ? 'Actualizar' : 'Crear'}</button>
                </div>
            )}
            <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 sticky top-0">
                        <tr>
                            <th className="p-2">Almacén</th>
                            <th className="p-2">Ubicación</th>
                            {!readOnly && <th className="p-2 text-right">Acción</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {warehouseLocations.map(l => (
                            <tr key={l.id} className="border-b">
                                <td className="p-2">{warehouses.find(w => w.id === l.warehouseId)?.name}</td>
                                <td className="p-2 font-mono font-bold text-slate-700">{l.code}</td>
                                {!readOnly && <td className="p-2 text-right"><button onClick={() => startEdit(l)} className="text-accent"><Edit2 size={16}/></button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Checklist Manager ---

const ChecklistModelForm = ({ initialData, onSave, onCancel, readOnly }: { initialData?: ChecklistModel, onSave: (d: ChecklistModel) => void, onCancel: () => void, readOnly?: boolean }) => {
    const { machineTypes, vehicleTypes } = useMasterData();
    const { showToast } = useUI();
    const [name, setName] = useState(initialData?.name || '');
    const [assetType, setAssetType] = useState<AssetType>(initialData?.assetType || AssetType.MACHINE);
    const [assetSubtype, setAssetSubtype] = useState(initialData?.assetSubtype || '');
    const [items, setItems] = useState<ChecklistItemDefinition[]>(initialData?.items || []);
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemCritical, setNewItemCritical] = useState(false);

    const addItem = () => {
        if (!newItemLabel.trim()) return;
        setItems([...items, { id: `IT-${Date.now()}`, label: newItemLabel, isCritical: newItemCritical }]);
        setNewItemLabel('');
        setNewItemCritical(false);
    };

    const removeItem = (idx: number) => {
        const n = [...items];
        n.splice(idx, 1);
        setItems(n);
    };

    const handleSave = () => {
        if (!name || items.length === 0) {
            showToast("Complete nombre y agregue items.", 'error');
            return;
        }
        onSave({
            id: initialData?.id || `CHK-${Date.now()}`,
            name,
            assetType,
            assetSubtype,
            items
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-lg font-bold text-slate-800">{readOnly ? 'Ver Modelo' : (initialData ? 'Editar Modelo' : 'Nuevo Modelo de Checklist')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input label="Nombre del Modelo" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Ej. Inspección Diaria Grúa" readOnly={readOnly} />
                <Select label="Tipo de Activo" value={assetType} onChange={(e: any) => setAssetType(e.target.value)} options={[{label: 'Máquina', value: AssetType.MACHINE}, {label: 'Vehículo', value: AssetType.VEHICLE}]} readOnly={readOnly} />
                <Select label="Subtipo (Opcional)" value={assetSubtype} onChange={(e: any) => setAssetSubtype(e.target.value)} options={assetType === AssetType.MACHINE ? machineTypes : vehicleTypes} readOnly={readOnly} />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-3">Puntos de Control</h4>
                {!readOnly && (
                    <div className="flex gap-2 mb-4">
                        <input className="flex-1 border rounded px-3 py-2 bg-white" placeholder="Descripción del punto a revisar..." value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} />
                        <label className="flex items-center gap-2 text-sm bg-white border px-3 rounded cursor-pointer">
                            <input type="checkbox" checked={newItemCritical} onChange={e => setNewItemCritical(e.target.checked)} /> Crítico
                        </label>
                        <button onClick={addItem} className="bg-slate-800 text-white px-4 rounded font-bold"><Plus size={18}/></button>
                    </div>
                )}
                <div className="space-y-2">
                    {items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400">#{idx + 1}</span>
                                <span>{it.label}</span>
                                {it.isCritical && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold border border-red-200">CRÍTICO</span>}
                            </div>
                            {!readOnly && <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>}
                        </div>
                    ))}
                    {items.length === 0 && <p className="text-slate-400 italic text-center text-sm py-4">Agregue puntos de control arriba.</p>}
                </div>
            </div>

            {!readOnly && (
                <div className="flex justify-end mt-6">
                    <button onClick={handleSave} className="bg-accent text-white px-6 py-2 rounded-lg font-bold shadow-md">Guardar Modelo</button>
                </div>
            )}
        </div>
    );
};

const ChecklistManager = ({ readOnly }: { readOnly?: boolean }) => {
    const { checklistModels, addChecklistModel, updateChecklistModel } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedModel, setSelectedModel] = useState<ChecklistModel | null>(null);

    const handleSave = async (data: ChecklistModel) => {
        if (selectedModel) await updateChecklistModel(data);
        else await addChecklistModel(data);
        showToast('Modelo guardado', 'success');
        setViewMode('LIST');
    };

    if (viewMode === 'FORM') return <ChecklistModelForm initialData={selectedModel || undefined} onSave={handleSave} onCancel={() => setViewMode('LIST')} readOnly={readOnly} />;

    return (
        <div>
            <SectionHeader title="Modelos de Checklist" actionLabel="Crear Modelo" onAction={() => { setSelectedModel(null); setViewMode('FORM'); }} icon={CheckSquare} readOnly={readOnly} />
            <div className="grid gap-4">
                {checklistModels.map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                        <div>
                            <h4 className="font-bold text-slate-800">{m.name}</h4>
                            <p className="text-sm text-slate-500">{m.assetType} {m.assetSubtype ? `(${m.assetSubtype})` : ''} • {m.items.length} items</p>
                        </div>
                        <button onClick={() => { setSelectedModel(m); setViewMode('FORM'); }} className="text-accent hover:bg-slate-50 p-2 rounded-lg">
                            {readOnly ? <Eye size={18}/> : <Edit2 size={18}/>}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Numerator Manager ---

const NumeratorManager = ({ readOnly }: { readOnly?: boolean }) => {
    const { numerators, updateNumerator } = useMasterData();
    const { showToast } = useUI();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [prefix, setPrefix] = useState('');
    const [current, setCurrent] = useState(0);

    const startEdit = (n: Numerator) => {
        setEditingId(n.id);
        setPrefix(n.prefix);
        setCurrent(n.currentValue);
    };

    const handleSave = async (id: string) => {
        const num = numerators.find(n => n.id === id);
        if (num) {
            await updateNumerator({ ...num, prefix, currentValue: current });
            showToast('Numerador actualizado', 'success');
            setEditingId(null);
        }
    };

    return (
        <div>
            <SectionHeader title="Numeradores de Documentos" icon={Hash} readOnly={readOnly} />
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm bg-white rounded-lg border border-slate-200">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-4">Documento</th>
                            <th className="p-4">Prefijo</th>
                            <th className="p-4">Último Valor</th>
                            {!readOnly && <th className="p-4 text-right">Acción</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {numerators.map(n => (
                            <tr key={n.id}>
                                <td className="p-4 font-medium text-slate-800">{n.name}</td>
                                <td className="p-4">
                                    {editingId === n.id ? (
                                        <input className="border rounded px-2 py-1 w-24" value={prefix} onChange={e => setPrefix(e.target.value)} />
                                    ) : (
                                        <span className="font-mono bg-slate-100 px-2 py-1 rounded">{n.prefix || '(sin)'}</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {editingId === n.id ? (
                                        <input type="number" className="border rounded px-2 py-1 w-32" value={current} onChange={e => setCurrent(parseInt(e.target.value))} />
                                    ) : (
                                        <span className="font-mono">{n.currentValue}</span>
                                    )}
                                </td>
                                {!readOnly && (
                                    <td className="p-4 text-right">
                                        {editingId === n.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleSave(n.id)} className="text-green-600 font-bold">OK</button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-400">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEdit(n)} className="text-accent hover:text-blue-700"><Edit2 size={16}/></button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main Component ---

type Tab = 'CLIENTS' | 'SUPPLIERS' | 'ASSETS' | 'PARAMS' | 'WAREHOUSES' | 'MATERIALS' | 'CHECKLISTS' | 'NUMERATORS' | 'AREAS';
type SubTab = 'PARAM_REGIONS' | 'PARAM_UOM' | 'PARAM_TYPE_M' | 'PARAM_TYPE_V' | 'WH_CREATE' | 'WH_LOC' | 'NUM_CREATE' | 'NUM_ASSIGN';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<Tab>('CLIENTS');
  const [activeSubTab, setActiveSubTab] = useState<string>('PARAM_REGIONS');
  const { userProfile } = useAuth();
  
  const [newParamValue, setNewParamValue] = useState('');
  const { 
    regions, uoms, machineTypes, vehicleTypes,
    addRegion, addUom, addMachineType, addVehicleType, addMaterial,
    addClient, addSupplier, getNextId
  } = useMasterData();

  // --- PERMISSION CHECK ---
  const permissionLevel = useMemo(() => {
      if (!userProfile) return 'NONE';
      return userProfile.role === 'ADMIN' ? 'ADMIN' : (userProfile.permissions?.['MASTER_DATA_GENERAL'] || 'NONE');
  }, [userProfile]);

  const canView = permissionLevel !== 'NONE';
  const isReadOnly = permissionLevel === 'VIEW'; // TRUE if VIEW, FALSE if CREATE/EDIT/ADMIN

  if (!canView) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-in fade-in">
              <Lock size={64} className="mb-4 text-slate-300" />
              <h2 className="text-xl font-bold text-slate-600">Acceso Restringido</h2>
              <p>No tiene permisos para visualizar el módulo de Datos Maestros.</p>
          </div>
      );
  }

  const SubTabs = ({ tabs, current, onChange }: { tabs: {id: string, label: string}[], current: string, onChange: (id: string) => void }) => (
    <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit mb-6 border border-slate-200">
      {tabs.map(t => (
          <button 
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${current === t.id ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {t.label}
          </button>
      ))}
    </div>
  );

  const handleAddParam = () => {
    if(!newParamValue.trim()) return;
    switch(activeSubTab) {
        case 'PARAM_REGIONS': addRegion(newParamValue); break;
        case 'PARAM_UOM': addUom(newParamValue); break;
        case 'PARAM_TYPE_M': addMachineType(newParamValue); break;
        case 'PARAM_TYPE_V': addVehicleType(newParamValue); break;
    }
    setNewParamValue('');
  };

  const getParamList = () => {
      switch(activeSubTab) {
        case 'PARAM_REGIONS': return regions;
        case 'PARAM_UOM': return uoms;
        case 'PARAM_TYPE_M': return machineTypes;
        case 'PARAM_TYPE_V': return vehicleTypes;
        default: return [];
      }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'CLIENTS':
        return <ClientMasterView readOnly={isReadOnly} />;
      
      case 'SUPPLIERS':
         return <SupplierMasterView readOnly={isReadOnly} />;

      case 'ASSETS':
        return <AssetMasterView readOnly={isReadOnly} />; 

      case 'PARAMS':
        const currentList = getParamList();
        return (
            <div>
                 <SubTabs 
                    tabs={[
                        {id: 'PARAM_REGIONS', label: 'Regiones'}, 
                        {id: 'PARAM_UOM', label: 'Unidades de Medida'},
                        {id: 'PARAM_TYPE_M', label: 'Tipos de Máquina'},
                        {id: 'PARAM_TYPE_V', label: 'Tipos de Vehículo'}
                    ]} 
                    current={activeSubTab} 
                    onChange={setActiveSubTab} 
                />
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="text-md font-bold mb-4">Gestión de Parámetros</h4>
                    {!isReadOnly && (
                        <div className="flex gap-4 items-end mb-6 border-b border-slate-100 pb-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Descripción</label>
                                <input 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-accent" 
                                    placeholder="Nuevo valor..." 
                                    value={newParamValue}
                                    onChange={(e) => setNewParamValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddParam()}
                                />
                            </div>
                            <button 
                                onClick={handleAddParam}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
                            >
                                Agregar
                            </button>
                        </div>
                    )}
                    <div className="bg-slate-50 rounded-lg p-4">
                        <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                            {currentList.map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b border-slate-200 pb-1 last:border-0">
                                    <span>{item}</span> 
                                    {!isReadOnly && <Edit2 size={14} className="text-slate-400 cursor-pointer hover:text-accent"/>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );

      case 'WAREHOUSES':
        return (
            <div>
                 <SubTabs 
                    tabs={[
                        {id: 'WH_CREATE', label: 'Almacenes (Depósitos)'}, 
                        {id: 'WH_LOC', label: 'Ubicaciones'}
                    ]} 
                    current={activeSubTab} 
                    onChange={setActiveSubTab} 
                />
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    {activeSubTab === 'WH_CREATE' ? <WarehouseMasterView readOnly={isReadOnly} /> : <LocationMasterView readOnly={isReadOnly} />}
                </div>
            </div>
        );

      case 'MATERIALS':
        return <MaterialMasterView readOnly={isReadOnly} />;

      case 'CHECKLISTS':
          return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <ChecklistManager readOnly={isReadOnly} />
            </div>
          );

      case 'NUMERATORS':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <NumeratorManager readOnly={isReadOnly} />
            </div>
        );

      case 'AREAS':
        return <AreasMasterView readOnly={isReadOnly} />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mother Tabs */}
      <div className="flex overflow-x-auto pb-2 space-x-2 border-b border-slate-200 custom-scrollbar">
        {[
          { id: 'CLIENTS', label: 'Clientes' },
          { id: 'SUPPLIERS', label: 'Proveedores' },
          { id: 'ASSETS', label: 'Activos' },
          { id: 'MATERIALS', label: 'Materiales' },
          { id: 'WAREHOUSES', label: 'Almacenes' },
          { id: 'PARAMS', label: 'Parámetros' },
          { id: 'CHECKLISTS', label: 'Checklists' },
          { id: 'NUMERATORS', label: 'Numeradores' },
          { id: 'AREAS', label: 'Áreas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
                setActiveTab(tab.id as Tab);
                if(tab.id === 'PARAMS') setActiveSubTab('PARAM_REGIONS');
                if(tab.id === 'WAREHOUSES') setActiveSubTab('WH_CREATE');
            }}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>
    </div>
  );
}
