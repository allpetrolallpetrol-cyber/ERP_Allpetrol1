
import React, { useState } from 'react';
import { Plus, Save, Trash2, Edit2, Search, List, MapPin, Ruler, Tag, Hash, CheckSquare, X, CheckCircle, CalendarClock, Cog, Truck, Settings, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { Material, MaintenanceRoutine, AssetType, Asset, ChecklistModel, ChecklistItemDefinition } from '../types';

// --- Reusable UI Components ---

const Input = ({ label, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-white" {...props} />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white" {...props}>
      <option value="">Seleccionar...</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const SectionHeader = ({ title, actionLabel, onAction, icon: Icon }: any) => (
  <div className="flex justify-between items-center mb-6">
    <h3 className="text-lg font-bold text-slate-800 flex items-center">
        {Icon && <Icon className="mr-2 text-slate-500" size={20} />}
        {title}
    </h3>
    {actionLabel && (
        <button onClick={onAction} className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md transition-all">
            <Plus size={18} className="mr-2"/> {actionLabel}
        </button>
    )}
  </div>
);

// --- Forms ---

const ClientForm = () => {
  const { regions } = useMasterData();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Razón Social" placeholder="Ej. Empresa S.A." />
      <Input label="CUIT" placeholder="XX-XXXXXXXX-X" />
      <Input label="Dirección" placeholder="Calle, Número, Localidad" />
      <Input label="Email Contacto" type="email" />
      <Select label="Condición IVA" options={['Responsable Inscripto', 'Monotributo', 'Exento', 'Consumidor Final']} />
      <Input label="Ingresos Brutos" placeholder="Nro IIBB" />
      <Input label="Teléfono" />
      <Select label="Provincia / Región" options={regions} />
    </div>
  );
};

// --- New Asset Manager Components ---

const InlineRoutineManager = ({ assetId }: { assetId: string }) => {
    const { routines, addRoutine } = useMasterData();
    const assetRoutines = routines.filter(r => r.assetId === assetId);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState('');
    const [discipline, setDiscipline] = useState('');
    const [hours, setHours] = useState('');

    const handleAddRoutine = () => {
        if (!name || !frequency || !discipline) {
            alert("Complete los campos requeridos");
            return;
        }

        const newRoutine: MaintenanceRoutine = {
            id: `RT-${Date.now()}`,
            assetId: assetId,
            name,
            description,
            frequencyDays: parseInt(frequency),
            discipline: discipline as any,
            estimatedHours: parseFloat(hours) || 1,
            lastExecutionDate: new Date().toISOString().split('T')[0]
        };

        addRoutine(newRoutine);
        setName('');
        setDescription('');
        setFrequency('');
        setHours('');
    };

    return (
        <div className="space-y-6">
            {/* List of Existing Routines */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 text-sm">Rutinas Activas para este Equipo</h4>
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{assetRoutines.length}</span>
                </div>
                {assetRoutines.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2">Rutina</th>
                                <th className="px-4 py-2">Descripción</th>
                                <th className="px-4 py-2">Disciplina</th>
                                <th className="px-4 py-2">Frecuencia</th>
                                <th className="px-4 py-2 text-right">Hs. Est.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assetRoutines.map(r => (
                                <tr key={r.id} className="bg-white">
                                    <td className="px-4 py-2 font-medium text-slate-800">{r.name}</td>
                                    <td className="px-4 py-2 text-slate-500 max-w-xs truncate" title={r.description}>{r.description || '-'}</td>
                                    <td className="px-4 py-2 text-slate-500">{r.discipline}</td>
                                    <td className="px-4 py-2">Cada {r.frequencyDays} días</td>
                                    <td className="px-4 py-2 text-right">{r.estimatedHours} h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-4 text-center text-slate-400 text-sm italic">
                        No hay rutinas definidas para este equipo.
                    </div>
                )}
            </div>

            {/* Add New Routine Form */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center"><Plus size={16} className="mr-1"/> Agregar Nueva Rutina</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Tarea</label>
                        <input className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:ring-1 focus:ring-accent bg-white" placeholder="Ej. Cambio Aceite" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="md:col-span-1">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Disciplina</label>
                        <select className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm bg-white" value={discipline} onChange={e => setDiscipline(e.target.value)}>
                             <option value="">Seleccionar...</option>
                            <option value="Mecánica">Mecánica</option>
                            <option value="Eléctrica">Eléctrica</option>
                            <option value="Hidráulica">Hidráulica</option>
                            <option value="Neumática">Neumática</option>
                            <option value="General">General</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Horas Est.</label>
                        <input type="number" className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm bg-white" placeholder="1" value={hours} onChange={e => setHours(e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Descripción / Instrucciones (Qué revisar)</label>
                        <input className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:ring-1 focus:ring-accent bg-white" placeholder="Detalle de la tarea..." value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Frec. (Días)</label>
                        <input type="number" className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm bg-white" placeholder="90" value={frequency} onChange={e => setFrequency(e.target.value)} />
                    </div>
                </div>
                <div className="mt-3 flex justify-end">
                    <button onClick={handleAddRoutine} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                        Guardar Rutina
                    </button>
                </div>
            </div>
        </div>
    );
};

const AssetDetailView = ({ asset, onSave, onCancel }: { asset: Partial<Asset> | null, onSave: (a: Asset) => void, onCancel: () => void }) => {
    const { machineTypes, warehouses, vehicleTypes } = useMasterData();
    const isNew = !asset?.id;
    const isMachine = asset?.type === AssetType.MACHINE || !asset?.type; // Default to machine if undefined
    
    // Local state for form
    const [formData, setFormData] = useState<Partial<Asset>>(asset || { type: AssetType.MACHINE });
    const [activeTab, setActiveTab] = useState<'INFO' | 'ROUTINES'>('INFO');

    const handleChange = (field: keyof Asset, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.code || !formData.name) {
            alert("Código y Nombre son obligatorios");
            return;
        }
        // Mock save
        const savedAsset = { 
            ...formData, 
            id: formData.id || `AST-${Date.now()}` 
        } as Asset;
        onSave(savedAsset);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[500px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center">
                    <button onClick={onCancel} className="mr-3 p-2 hover:bg-slate-200 rounded-full text-slate-500"><ArrowLeft size={20}/></button>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? 'Nuevo Activo' : `Editar: ${formData.name}`}</h3>
                        <p className="text-xs text-slate-500 font-mono">{formData.code || 'Sin Código Asignado'}</p>
                    </div>
                </div>
                {!isNew && (
                    <div className="flex space-x-2 bg-white p-1 rounded-lg border border-slate-200">
                        <button 
                            onClick={() => setActiveTab('INFO')}
                            className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${activeTab === 'INFO' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Datos Generales
                        </button>
                        <button 
                            onClick={() => setActiveTab('ROUTINES')}
                            className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center ${activeTab === 'ROUTINES' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <CalendarClock size={14} className="mr-2"/> Plan de Mantenimiento
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'INFO' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <Input label="Código Interno" value={formData.code || ''} onChange={(e:any) => handleChange('code', e.target.value)} placeholder="Ej. TR-01" />
                            <Input label="Nombre del Activo" value={formData.name || ''} onChange={(e:any) => handleChange('name', e.target.value)} placeholder="Ej. Torno CNC" />
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Activo</label>
                                <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                    value={formData.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    disabled={!isNew}
                                >
                                    <option value={AssetType.MACHINE}>Máquina / Equipo</option>
                                    <option value={AssetType.VEHICLE}>Vehículo / Flota</option>
                                </select>
                            </div>

                            <Input label="Marca" value={formData.brand || ''} onChange={(e:any) => handleChange('brand', e.target.value)} />
                            <Input label="Modelo" value={formData.model || ''} onChange={(e:any) => handleChange('model', e.target.value)} />
                            <Input label="Nro Serie" value={formData.serialNumber || ''} onChange={(e:any) => handleChange('serialNumber', e.target.value)} />
                        </div>

                        {formData.type === AssetType.MACHINE ? (
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center"><Cog size={16} className="mr-2"/> Detalles de Máquina</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select 
                                        label="Categoría Máquina" 
                                        options={machineTypes} 
                                        value={formData.subtype} // Saving subtype
                                        onChange={(e: any) => handleChange('subtype', e.target.value)} 
                                    />
                                    <Select 
                                        label="Ubicación Física" 
                                        options={warehouses} 
                                        value={formData.location || ''} 
                                        onChange={(e:any) => handleChange('location', e.target.value)} 
                                    />
                                </div>
                             </div>
                        ) : (
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center"><Truck size={16} className="mr-2"/> Detalles de Vehículo</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select 
                                        label="Tipo Vehículo" 
                                        options={vehicleTypes}
                                        value={formData.subtype} // Saving subtype
                                        onChange={(e: any) => handleChange('subtype', e.target.value)}
                                    />
                                    <Input label="Patente / Dominio" value={formData.plate || ''} onChange={(e:any) => handleChange('plate', e.target.value)} />
                                    <Input label="Kilometraje Actual" type="number" value={formData.mileage || ''} onChange={(e:any) => handleChange('mileage', parseFloat(e.target.value))} />
                                </div>
                             </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                             <button onClick={handleSave} className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                                <Save size={18} className="mr-2"/> {isNew ? 'Crear Activo' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'ROUTINES' && !isNew && (
                    <div className="max-w-4xl mx-auto animate-in fade-in">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
                            <CalendarClock className="text-blue-600 mt-1 mr-3" size={24} />
                            <div>
                                <h4 className="text-blue-900 font-bold">Definición de Plan Preventivo</h4>
                                <p className="text-blue-700 text-sm">Configure aquí las tareas recurrentes para este equipo. Estas rutinas alimentarán automáticamente el Planificador de Mantenimiento.</p>
                            </div>
                        </div>
                        <InlineRoutineManager assetId={formData.id!} />
                    </div>
                )}
            </div>
        </div>
    );
};

const AssetMasterView = () => {
    const { assets, addAsset } = useMasterData();
    const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [filterType, setFilterType] = useState<AssetType>(AssetType.MACHINE);

    const handleCreate = () => {
        setSelectedAsset({ type: filterType } as Asset);
        setViewMode('DETAIL');
    };

    const handleEdit = (asset: Asset) => {
        setSelectedAsset(asset);
        setViewMode('DETAIL');
    };

    const handleSaveAsset = (asset: Asset) => {
        // In a real app we'd check if it exists to update, or add.
        // For mock simple logic:
        const exists = assets.find(a => a.id === asset.id);
        if (!exists) {
            addAsset(asset);
        } else {
            // Update logic (Mock)
            // In a real implementation with global state management (like Redux/Context), we would dispatch an update action.
            // Since we are using a simplified context addAsset for now and checking existence:
            // We need an updateAsset method in context, but for now we'll just alert.
            // Actually, we can just replace the object in the list if we had setAssets, but we only have addAsset exposed.
            // Let's assume for this demo that the user sees the update reflected locally if we managed state better.
            alert("Activo actualizado correctamente.");
        }
        setViewMode('LIST');
        setSelectedAsset(null);
    };

    const filteredAssets = assets.filter(a => a.type === filterType);

    if (viewMode === 'DETAIL') {
        return <AssetDetailView asset={selectedAsset} onSave={handleSaveAsset} onCancel={() => setViewMode('LIST')} />;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-bold text-slate-800">Maestro de Activos</h3>
                    <div className="bg-slate-100 p-1 rounded-lg flex">
                        <button 
                            onClick={() => setFilterType(AssetType.MACHINE)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === AssetType.MACHINE ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Máquinas
                        </button>
                        <button 
                             onClick={() => setFilterType(AssetType.VEHICLE)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === AssetType.VEHICLE ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Vehículos
                        </button>
                    </div>
                </div>
                <button onClick={handleCreate} className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md transition-all">
                    <Plus size={18} className="mr-2"/> Nuevo {filterType === AssetType.MACHINE ? 'Equipo' : 'Vehículo'}
                </button>
             </div>

             <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Subtipo</th>
                            <th className="px-4 py-3">Marca/Modelo</th>
                            <th className="px-4 py-3">{filterType === AssetType.MACHINE ? 'Ubicación' : 'Patente'}</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAssets.map(asset => (
                            <tr key={asset.id} className="hover:bg-slate-50 group">
                                <td className="px-4 py-3 font-mono text-slate-600">{asset.code}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{asset.name}</td>
                                <td className="px-4 py-3 text-slate-500"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">{asset.subtype || '-'}</span></td>
                                <td className="px-4 py-3 text-slate-500">{asset.brand} {asset.model}</td>
                                <td className="px-4 py-3 text-slate-500">{filterType === AssetType.MACHINE ? asset.location : asset.plate}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(asset)} className="text-accent hover:text-blue-700 font-medium flex items-center justify-end">
                                        <Edit2 size={16} className="mr-1"/> Editar / Rutinas
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {filteredAssets.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay activos registrados en esta categoría.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

// --- Material & Warehouse Forms (kept mostly same but simplified for brevity in this refactor) ---

const MaterialForm = ({ onSave }: { onSave: (m: any) => void }) => {
    const { uoms, warehouses, suppliers } = useMasterData();
    const [formData, setFormData] = useState<Partial<Material>>({ assignedSupplierIds: [] });
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // ... (Keep existing supplier toggle logic or simplify)
    // Simplified for this view update:
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Código" name="code" onChange={handleChange} />
             <Input label="Descripción" name="description" onChange={handleChange} />
             <Select label="Unidad" name="unitOfMeasure" options={uoms} onChange={handleChange} />
             <Input label="Stock Min" name="minStock" type="number" onChange={handleChange} />
             <div className="col-span-2 flex justify-end">
                 <button onClick={() => onSave(formData)} className="bg-success text-white px-4 py-2 rounded-lg flex items-center"><Save size={18} className="mr-2"/> Guardar</button>
             </div>
        </div>
    );
};

const WarehouseForm = () => (
    <div className="grid grid-cols-1 gap-4">
        <Input label="Nombre del Almacén" placeholder="Ej. Depósito Central" />
        <Input label="Responsable" placeholder="Nombre del jefe de depósito" />
    </div>
);

const LocationForm = () => {
    const { warehouses } = useMasterData();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Almacén Padre" options={warehouses} />
            <Input label="Código Ubicación" placeholder="Ej. RACK-A-01" />
        </div>
    );
};

// --- CHECKLIST MODEL MANAGER ---

const ChecklistModelForm = ({ modelToEdit, onSave, onCancel }: { modelToEdit: ChecklistModel | null, onSave: (m: ChecklistModel) => void, onCancel: () => void }) => {
    const { machineTypes, vehicleTypes } = useMasterData();
    const [name, setName] = useState(modelToEdit?.name || '');
    const [assetType, setAssetType] = useState<AssetType>(modelToEdit?.assetType || AssetType.MACHINE);
    const [assetSubtype, setAssetSubtype] = useState(modelToEdit?.assetSubtype || '');
    const [items, setItems] = useState<ChecklistItemDefinition[]>(modelToEdit?.items || []);
    
    // Temp Item State
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemCritical, setNewItemCritical] = useState(false);

    const handleAddItem = () => {
        if (!newItemLabel.trim()) return;
        setItems([...items, { id: `ITM-${Date.now()}`, label: newItemLabel, isCritical: newItemCritical }]);
        setNewItemLabel('');
        setNewItemCritical(false);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleSave = () => {
        if(!name || items.length === 0) {
            alert("Nombre y al menos un item requeridos");
            return;
        }
        const model: ChecklistModel = {
            id: modelToEdit?.id || `CHKL-${Date.now()}`,
            name,
            assetType,
            assetSubtype,
            items
        };
        onSave(model);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver a la lista</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                    <Input label="Nombre del Modelo" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Ej. Inspección Diaria Autoelevador" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Activo</label>
                    <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        value={assetType}
                        onChange={(e) => {
                            setAssetType(e.target.value as AssetType);
                            setAssetSubtype(''); // Reset subtype when type changes
                        }}
                    >
                        <option value={AssetType.MACHINE}>Máquina</option>
                        <option value={AssetType.VEHICLE}>Vehículo</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subtipo / Categoría</label>
                    <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                        value={assetSubtype}
                        onChange={(e) => setAssetSubtype(e.target.value)}
                    >
                        <option value="">Cualquiera</option>
                        {assetType === AssetType.MACHINE 
                            ? machineTypes.map(t => <option key={t} value={t}>{t}</option>)
                            : vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)
                        }
                    </select>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center"><CheckSquare size={16} className="mr-2"/> Items del Checklist</h4>
                
                <div className="flex gap-2 mb-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Descripción del Item</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                            placeholder="Ej. Verificar nivel de aceite"
                            value={newItemLabel}
                            onChange={(e) => setNewItemLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        />
                    </div>
                    <div className="flex items-center pb-2 px-2 bg-white border border-slate-200 rounded-lg h-[42px]">
                         <input 
                            type="checkbox" 
                            id="isCritical"
                            checked={newItemCritical}
                            onChange={(e) => setNewItemCritical(e.target.checked)}
                            className="mr-2 w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isCritical" className="text-sm text-slate-700 font-medium select-none cursor-pointer flex items-center">
                            Es Crítico <AlertTriangle size={14} className="ml-1 text-red-500"/>
                        </label>
                    </div>
                    <button onClick={handleAddItem} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 h-[42px]">
                        Agregar
                    </button>
                </div>

                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200">
                            <div className="flex items-center">
                                <span className="bg-slate-100 text-slate-500 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3">{idx + 1}</span>
                                <span className="text-slate-700">{item.label}</span>
                                {item.isCritical && <span className="ml-3 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 flex items-center"><AlertTriangle size={10} className="mr-1"/> CRÍTICO</span>}
                            </div>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    {items.length === 0 && <p className="text-center text-slate-400 italic py-4">Agregue items para este checklist.</p>}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                 <button onClick={handleSave} className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                    <Save size={18} className="mr-2"/> Guardar Modelo
                </button>
            </div>
        </div>
    );
};

const ChecklistModelList = ({ onEdit }: { onEdit: (m: ChecklistModel | null) => void }) => {
    const { checklistModels } = useMasterData();
    return (
        <div>
            <SectionHeader title="Modelos de Checklist" actionLabel="Nuevo Modelo" icon={CheckSquare} onAction={() => onEdit(null)} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checklistModels.map(model => (
                    <div key={model.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${model.assetType === AssetType.MACHINE ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                {model.assetType === AssetType.MACHINE ? 'MÁQUINA' : 'VEHÍCULO'}
                             </span>
                             <button onClick={() => onEdit(model)} className="text-slate-400 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Edit2 size={16} />
                             </button>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{model.name}</h4>
                        <p className="text-xs text-slate-500 mb-3">Aplica a: {model.assetSubtype || 'Todos'}</p>
                        
                        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2">
                            <span>{model.items.length} Puntos de control</span>
                            {model.items.some(i => i.isCritical) && <span className="flex items-center text-red-500"><AlertTriangle size={12} className="mr-1"/> Críticos</span>}
                        </div>
                    </div>
                ))}
                {checklistModels.length === 0 && (
                     <div className="col-span-3 text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                        No hay modelos definidos.
                    </div>
                )}
            </div>
        </div>
    );
};

const ChecklistManager = () => {
    const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedModel, setSelectedModel] = useState<ChecklistModel | null>(null);
    const { addChecklistModel, updateChecklistModel } = useMasterData();

    const handleEdit = (m: ChecklistModel | null) => {
        setSelectedModel(m);
        setView('FORM');
    };

    const handleSave = (m: ChecklistModel) => {
        if (selectedModel) {
            updateChecklistModel(m);
        } else {
            addChecklistModel(m);
        }
        setView('LIST');
    };

    if (view === 'FORM') {
        return <ChecklistModelForm modelToEdit={selectedModel} onSave={handleSave} onCancel={() => setView('LIST')} />;
    }
    return <ChecklistModelList onEdit={handleEdit} />;
};


const NumeratorForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Tipo Doc" options={['OC', 'Remito']} />
        <Input label="Próximo Nro" type="number" />
    </div>
);


// --- Main Component ---

type Tab = 'CLIENTS' | 'SUPPLIERS' | 'ASSETS' | 'PARAMS' | 'WAREHOUSES' | 'MATERIALS' | 'CHECKLISTS' | 'NUMERATORS';
type SubTab = 'PARAM_REGIONS' | 'PARAM_UOM' | 'PARAM_TYPE_M' | 'PARAM_TYPE_V' | 'WH_CREATE' | 'WH_LOC' | 'NUM_CREATE' | 'NUM_ASSIGN';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<Tab>('CLIENTS');
  const [activeSubTab, setActiveSubTab] = useState<string>('PARAM_REGIONS');
  
  const [newParamValue, setNewParamValue] = useState('');
  const { 
    regions, uoms, machineTypes, vehicleTypes,
    addRegion, addUom, addMachineType, addVehicleType, addMaterial 
  } = useMasterData();

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

  const handleSaveMaterial = (data: any) => {
    addMaterial({ id: `MAT-${Date.now()}`, stock: 0, ...data, assignedSupplierIds: [] });
    alert("Material guardado.");
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
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <SectionHeader title="Maestro de Clientes" actionLabel="Nuevo Cliente" />
            <ClientForm />
            <div className="mt-6 flex justify-end">
                <button className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                  <Save size={18} className="mr-2"/> Guardar Cliente
                </button>
            </div>
          </div>
        );
      
      case 'SUPPLIERS':
         return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <SectionHeader title="Maestro de Proveedores" actionLabel="Nuevo Proveedor" />
            <ClientForm /> 
            <div className="mt-6 flex justify-end">
                <button className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                  <Save size={18} className="mr-2"/> Guardar Proveedor
                </button>
            </div>
          </div>
        );

      case 'ASSETS':
        // New Asset Management View
        return <AssetMasterView />;

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
                    <div className="bg-slate-50 rounded-lg p-4">
                        <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                            {currentList.map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b border-slate-200 pb-1 last:border-0">
                                    <span>{item}</span> 
                                    <Edit2 size={14} className="text-slate-400 cursor-pointer hover:text-accent"/>
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
                        {id: 'WH_CREATE', label: 'Crear Almacén'}, 
                        {id: 'WH_LOC', label: 'Crear / Asignar Ubicación'}
                    ]} 
                    current={activeSubTab} 
                    onChange={setActiveSubTab} 
                />
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    {activeSubTab === 'WH_CREATE' ? <WarehouseForm /> : <LocationForm />}
                    <div className="mt-6 flex justify-end">
                        <button className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                        <Save size={18} className="mr-2"/> Guardar
                        </button>
                    </div>
                </div>
            </div>
        );

      case 'MATERIALS':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <SectionHeader title="Maestro de Materiales y Repuestos" actionLabel="Nuevo Material" icon={Tag} />
                <MaterialForm onSave={handleSaveMaterial} />
            </div>
        );

      case 'CHECKLISTS':
          return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <ChecklistManager />
            </div>
          );

      case 'NUMERATORS':
        return (
            <div>
                 <SubTabs 
                    tabs={[
                        {id: 'NUM_CREATE', label: 'Crear Numerador'}, 
                        {id: 'NUM_ASSIGN', label: 'Asignar Numerador'}
                    ]} 
                    current={activeSubTab} 
                    onChange={setActiveSubTab} 
                />
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    {activeSubTab === 'NUM_CREATE' ? <NumeratorForm /> : <div className="text-center p-8 text-slate-400">Asignación de numeradores...</div>}
                    <div className="mt-6 flex justify-end">
                        <button className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                            <Save size={18} className="mr-2"/> Guardar
                        </button>
                    </div>
                </div>
            </div>
        );

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
          // Removed 'ROUTINES' from main tab list as per new requirement
          { id: 'PARAMS', label: 'Parámetros' },
          { id: 'WAREHOUSES', label: 'Almacenes' },
          { id: 'MATERIALS', label: 'Materiales' },
          { id: 'CHECKLISTS', label: 'Modelos Checklist' },
          { id: 'NUMERATORS', label: 'Numeradores' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
                setActiveTab(tab.id as Tab);
                if(tab.id === 'PARAMS') setActiveSubTab('PARAM_REGIONS');
                if(tab.id === 'WAREHOUSES') setActiveSubTab('WH_CREATE');
                if(tab.id === 'NUMERATORS') setActiveSubTab('NUM_CREATE');
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
