
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, Trash2, Edit2, Search, List, MapPin, Ruler, Tag, Hash, CheckSquare, X, CheckCircle, CalendarClock, Cog, Truck, Settings, ArrowLeft, AlertTriangle, FileDigit, Users, Eye, Package } from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { Material, MaintenanceRoutine, AssetType, Asset, ChecklistModel, ChecklistItemDefinition, Numerator, DocumentType, Warehouse, WarehouseLocation } from '../types';

// --- Reusable UI Components ---

const Input = ({ label, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-500" {...props} />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white" {...props}>
      <option value="">Seleccionar...</option>
      {options.map((opt: any) => (
          <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
              {typeof opt === 'object' ? opt.label : opt}
          </option>
      ))}
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

const ClientForm = ({ type, onSave }: { type: 'CLIENT' | 'SUPPLIER', onSave: (data: any) => void }) => {
  const { regions } = useMasterData();
  const [formData, setFormData] = useState({
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
    if (!formData.businessName || !formData.cuit) {
        alert("Razón Social y CUIT son obligatorios");
        return;
    }
    onSave(formData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Razón Social" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Ej. Empresa S.A." />
      <Input label="CUIT" name="cuit" value={formData.cuit} onChange={handleChange} placeholder="XX-XXXXXXXX-X" />
      <Input label="Dirección" name="address" value={formData.address} onChange={handleChange} placeholder="Calle, Número, Localidad" />
      
      <div>
        <Input label="Email(s) para Pedidos" name="email" value={formData.email} onChange={handleChange} placeholder="ventas@prov.com, juan@prov.com" />
        <p className="text-xs text-slate-500 -mt-3 mb-3">Para múltiples destinatarios, separe las direcciones con comas.</p>
      </div>

      <Input label="Contacto Principal" name="contactName" value={formData.contactName} onChange={handleChange} />
      <Select label="Condición IVA" name="conditionIVA" value={formData.conditionIVA} onChange={handleChange} options={['Responsable Inscripto', 'Monotributo', 'Exento', 'Consumidor Final']} />
      
      {type === 'SUPPLIER' && (
          <Input label="Condición de Pago" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} placeholder="Ej. 30 Días FF" />
      )}
      
      <Select label="Provincia / Región" name="region" value={formData.region} onChange={handleChange} options={regions} />
      
      <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
        <button onClick={handleSubmit} className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
            <Save size={18} className="mr-2"/> Guardar {type === 'CLIENT' ? 'Cliente' : 'Proveedor'}
        </button>
      </div>
    </div>
  );
};

// --- New Asset Manager Components ---

const InlineRoutineManager = ({ assetId }: { assetId: string }) => {
    const { routines, addRoutine, updateRoutine } = useMasterData();
    const assetRoutines = routines.filter(r => r.assetId === assetId);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState('');
    const [discipline, setDiscipline] = useState('');
    const [hours, setHours] = useState('');

    const handleEditClick = (routine: MaintenanceRoutine) => {
        setEditingId(routine.id);
        setName(routine.name);
        setDescription(routine.description || '');
        setFrequency(routine.frequencyDays.toString());
        setDiscipline(routine.discipline);
        setHours(routine.estimatedHours.toString());
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setFrequency('');
        setDiscipline('');
        setHours('');
    };

    const handleSaveRoutine = async () => {
        if (!name || !frequency || !discipline) {
            alert("Complete los campos requeridos");
            return;
        }

        const routineData: MaintenanceRoutine = {
            id: editingId || `RT-${Date.now()}`,
            assetId: assetId,
            name,
            description,
            frequencyDays: parseInt(frequency),
            discipline: discipline as any,
            estimatedHours: parseFloat(hours) || 1,
            lastExecutionDate: editingId 
                ? (routines.find(r => r.id === editingId)?.lastExecutionDate || new Date().toISOString().split('T')[0]) 
                : new Date().toISOString().split('T')[0]
        };

        try {
            if (editingId) {
                await updateRoutine(routineData);
            } else {
                await addRoutine(routineData);
            }
            handleCancelEdit(); // Reset form
        } catch (e) {
            console.error(e);
            alert("Error al guardar rutina");
        }
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
                                <th className="px-4 py-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assetRoutines.map(r => (
                                <tr key={r.id} className={`bg-white ${editingId === r.id ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-2 font-medium text-slate-800">{r.name}</td>
                                    <td className="px-4 py-2 text-slate-500 max-w-xs truncate" title={r.description}>{r.description || '-'}</td>
                                    <td className="px-4 py-2 text-slate-500">{r.discipline}</td>
                                    <td className="px-4 py-2">Cada {r.frequencyDays} días</td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => handleEditClick(r)} className="text-accent hover:text-blue-700 p-1 rounded">
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
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

            {/* Add/Edit Routine Form */}
            <div className={`p-4 rounded-xl border transition-all ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-100'}`}>
                <h4 className={`text-sm font-bold mb-3 flex items-center ${editingId ? 'text-yellow-800' : 'text-blue-800'}`}>
                    {editingId ? <Edit2 size={16} className="mr-1"/> : <Plus size={16} className="mr-1"/>} 
                    {editingId ? 'Editando Rutina' : 'Agregar Nueva Rutina'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Tarea</label>
                        <input className="w-full px-2 py-1.5 border border-white/50 rounded text-sm focus:ring-1 focus:ring-accent bg-white" placeholder="Ej. Cambio Aceite" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="md:col-span-1">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Disciplina</label>
                        <select className="w-full px-2 py-1.5 border border-white/50 rounded text-sm bg-white" value={discipline} onChange={e => setDiscipline(e.target.value)}>
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
                        <input type="number" className="w-full px-2 py-1.5 border border-white/50 rounded text-sm bg-white" placeholder="1" value={hours} onChange={e => setHours(e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Descripción / Instrucciones (Qué revisar)</label>
                        <input className="w-full px-2 py-1.5 border border-white/50 rounded text-sm focus:ring-1 focus:ring-accent bg-white" placeholder="Detalle de la tarea..." value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Frec. (Días)</label>
                        <input type="number" className="w-full px-2 py-1.5 border border-white/50 rounded text-sm bg-white" placeholder="90" value={frequency} onChange={e => setFrequency(e.target.value)} />
                    </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                    {editingId && (
                        <button onClick={handleCancelEdit} className="text-slate-500 px-3 py-1.5 text-sm font-medium hover:text-slate-800">
                            Cancelar
                        </button>
                    )}
                    <button onClick={handleSaveRoutine} className={`text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm ${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {editingId ? 'Actualizar Rutina' : 'Guardar Rutina'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AssetDetailView = ({ asset, onSave, onCancel }: { asset: Partial<Asset> | null, onSave: (a: Asset) => void, onCancel: () => void }) => {
    const { machineTypes, warehouses, vehicleTypes } = useMasterData();
    const isNew = !asset?.id;
    
    // Local state for form
    const [formData, setFormData] = useState<Partial<Asset>>(asset || { type: AssetType.MACHINE });
    const [activeTab, setActiveTab] = useState<'INFO' | 'ROUTINES'>('INFO');

    // Mapped Warehouse Options for Select
    const warehouseOptions = useMemo(() => warehouses.map(w => ({ value: w.name, label: w.name })), [warehouses]);

    const handleChange = (field: keyof Asset, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.code || !formData.name) {
            alert("Código y Nombre son obligatorios");
            return;
        }
        
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
                                        options={warehouseOptions} 
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

    const handleSaveAsset = async (asset: Asset) => {
        try {
            await addAsset(asset);
            setViewMode('LIST');
            setSelectedAsset(null);
        } catch(e) {
            console.error(e);
            alert("Error al guardar activo");
        }
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

// --- Material & Warehouse Forms ---

const MaterialForm = ({ initialData, onSave, onCancel }: { initialData?: Material | null, onSave: (m: any) => void, onCancel: () => void }) => {
    const { uoms, suppliers, warehouses, warehouseLocations, getNextId } = useMasterData();
    const [formData, setFormData] = useState<Partial<Material>>(initialData || { assignedSupplierIds: [] });
    const [generatedCode, setGeneratedCode] = useState(initialData?.code || 'Calculando...');
    const [supplierSearch, setSupplierSearch] = useState('');

    useEffect(() => {
        if (!initialData) {
            // Fetch next ID for display only if new
            getNextId('MATERIAL').then(id => {
                setGeneratedCode(id);
                setFormData(prev => ({ ...prev, code: id }));
            });
        }
    }, [initialData]);

    // Map Warehouses objects to options
    const warehouseOptions = useMemo(() => warehouses.map(w => ({ value: w.name, label: w.name })), [warehouses]);
    
    // Filter locations based on selected warehouse name
    const locationOptions = useMemo(() => {
        if (!formData.warehouse) return [];
        // Note: formData.warehouse stores the Name currently (legacy compat), ideally should store ID
        const wh = warehouses.find(w => w.name === formData.warehouse);
        if (!wh) return [];
        return warehouseLocations
            .filter(l => l.warehouseId === wh.id)
            .map(l => ({ value: l.code, label: `${l.code} - ${l.description || ''}` }));
    }, [formData.warehouse, warehouses, warehouseLocations]);

    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const toggleSupplier = (supplierId: string) => {
        const current = formData.assignedSupplierIds || [];
        if (current.includes(supplierId)) {
            setFormData({ ...formData, assignedSupplierIds: current.filter(id => id !== supplierId) });
        } else {
            setFormData({ ...formData, assignedSupplierIds: [...current, supplierId] });
        }
    };

    // Filter suppliers based on search
    const filteredSuppliers = useMemo(() => {
        if(!supplierSearch) return suppliers;
        const term = supplierSearch.toLowerCase();
        return suppliers.filter(s => s.name.toLowerCase().includes(term) || s.cuit.includes(term));
    }, [suppliers, supplierSearch]);

    const handleSubmit = () => {
        if (!formData.description) {
            alert("El nombre del material es obligatorio.");
            return;
        }
        onSave({...formData, code: generatedCode});
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver a la lista</button>
                <h3 className="text-lg font-bold text-slate-800">{initialData ? 'Editar Material' : 'Nuevo Material'}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="col-span-1">
                     <Input label="Código (Automático)" name="code" value={generatedCode} disabled />
                     <Input label="Nombre del Material" name="description" value={formData.description || ''} onChange={handleChange} placeholder="Ej. Rodamiento 6204 SKF" />
                     
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Técnica / Detalle</label>
                        <textarea 
                            name="technicalDescription"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white min-h-[100px] resize-none"
                            onChange={handleChange}
                            value={formData.technicalDescription || ''}
                            placeholder="Especificaciones técnicas, medidas, material, etc."
                        ></textarea>
                     </div>

                     <Select label="Unidad" name="unitOfMeasure" value={formData.unitOfMeasure || ''} options={uoms} onChange={handleChange} />
                     
                     <div className="grid grid-cols-2 gap-4">
                        <Select label="Almacén Principal" name="warehouse" value={formData.warehouse || ''} options={warehouseOptions} onChange={handleChange} />
                        {/* Conditional select if warehouse is chosen and locations exist, else text input */}
                        {locationOptions.length > 0 ? (
                            <Select label="Ubicación (Rack/Estante)" name="location" value={formData.location || ''} options={locationOptions} onChange={handleChange} />
                        ) : (
                            <Input label="Ubicación (Rack/Estante)" name="location" value={formData.location || ''} onChange={handleChange} placeholder="Ej. Estante A-01" />
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <Input label="Stock Min" name="minStock" type="number" value={formData.minStock || ''} onChange={handleChange} placeholder="10" />
                         <Input label="Costo Estimado" name="cost" type="number" value={formData.cost || ''} onChange={handleChange} placeholder="0.00" />
                     </div>
                 </div>

                 <div className="col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                     <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center"><Users size={16} className="mr-2"/> Proveedores Habilitados</h4>
                     <p className="text-xs text-slate-500 mb-3">Seleccione los proveedores que suministran este material.</p>
                     
                     <div className="relative mb-2">
                        <input 
                            type="text" 
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-accent"
                            placeholder="Buscar por Nombre o CUIT..."
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                        />
                        <Search size={14} className="absolute left-2.5 top-2 text-slate-400"/>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-2 rounded border border-slate-200 max-h-[400px]">
                         {filteredSuppliers.length > 0 ? filteredSuppliers.map(sup => (
                             <div key={sup.id} className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-50 last:border-0" onClick={() => toggleSupplier(sup.id)}>
                                 <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${formData.assignedSupplierIds?.includes(sup.id) ? 'bg-accent border-accent text-white' : 'border-slate-300'}`}>
                                     {formData.assignedSupplierIds?.includes(sup.id) && <CheckSquare size={12}/>}
                                 </div>
                                 <div>
                                     <div className={`text-sm font-medium ${formData.assignedSupplierIds?.includes(sup.id) ? 'text-accent' : 'text-slate-700'}`}>{sup.name}</div>
                                     <div className="text-xs text-slate-400">CUIT: {sup.cuit}</div>
                                 </div>
                             </div>
                         )) : (
                             <div className="p-4 text-center text-slate-400 text-xs">
                                 No se encontraron proveedores.
                             </div>
                         )}
                     </div>
                     <div className="mt-2 text-right text-xs text-slate-500">
                        {formData.assignedSupplierIds?.length || 0} seleccionados
                     </div>
                 </div>

                 <div className="col-span-1 md:col-span-2 flex justify-end">
                     <button onClick={handleSubmit} className="bg-success text-white px-6 py-2 rounded-lg flex items-center shadow-md hover:bg-green-600 transition-colors">
                         <Save size={18} className="mr-2"/> Guardar Material
                     </button>
                 </div>
            </div>
        </div>
    );
};

const MaterialMasterView = () => {
    const { materials, addMaterial } = useMasterData();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleCreate = () => {
        setSelectedMaterial(null);
        setViewMode('FORM');
    };

    const handleEdit = (m: Material) => {
        setSelectedMaterial(m);
        setViewMode('FORM');
    };

    const handleSave = async (data: any) => {
        try {
            await addMaterial({ 
                stock: 0, // Default stock if new, usually stock is handled by warehouse, but logic kept from previous form
                ...data 
            });
            setViewMode('LIST');
            setSelectedMaterial(null);
        } catch(e) {
            console.error(e);
            alert("Error al guardar material");
        }
    };

    const filteredMaterials = useMemo(() => {
        if(!searchTerm) return materials;
        const term = searchTerm.toLowerCase();
        return materials.filter(m => m.code.toLowerCase().includes(term) || m.description.toLowerCase().includes(term));
    }, [materials, searchTerm]);

    if (viewMode === 'FORM') {
        return <MaterialForm initialData={selectedMaterial} onSave={handleSave} onCancel={() => setViewMode('LIST')} />;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center"><Tag size={20} className="mr-2 text-slate-500"/> Maestro de Materiales</h3>
                    <div className="bg-yellow-50 px-2 py-1 rounded border border-yellow-200 text-xs text-yellow-800 flex items-center mt-2 w-fit">
                        <FileDigit size={12} className="mr-1"/> Numeración automática (Rango 3xxxxxx).
                    </div>
                </div>
                <button onClick={handleCreate} className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md transition-all">
                    <Plus size={18} className="mr-2"/> Nuevo Material
                </button>
             </div>

             <div className="mb-4 relative">
                <input 
                    type="text" 
                    placeholder="Buscar por código o nombre..." 
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
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Almacén</th>
                            <th className="px-4 py-3">Ubicación</th>
                            <th className="px-4 py-3">Unidad</th>
                            <th className="px-4 py-3 text-right">Stock Min</th>
                            <th className="px-4 py-3 text-right">Costo Est.</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredMaterials.map(mat => (
                            <tr key={mat.id} className="hover:bg-slate-50 group">
                                <td className="px-4 py-3 font-mono text-slate-600">{mat.code}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">
                                    {mat.description}
                                    {mat.technicalDescription && <div className="text-xs text-slate-400 truncate max-w-xs">{mat.technicalDescription}</div>}
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-medium">{mat.warehouse || '-'}</td>
                                <td className="px-4 py-3 text-slate-500">{mat.location || '-'}</td>
                                <td className="px-4 py-3 text-slate-500">{mat.unitOfMeasure}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{mat.minStock}</td>
                                <td className="px-4 py-3 text-right text-slate-600">${mat.cost}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(mat)} className="text-accent hover:text-blue-700 font-medium flex items-center justify-end">
                                        <Edit2 size={16} className="mr-1"/> Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {filteredMaterials.length === 0 && (
                            <tr><td colSpan={8} className="p-8 text-center text-slate-400">No hay materiales registrados con ese criterio.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

// --- Warehouse Manager ---

const WarehouseMasterView = () => {
    const { warehouses, addWarehouse, updateWarehouse } = useMasterData();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [responsible, setResponsible] = useState('');

    const handleEdit = (w: Warehouse) => {
        setEditingId(w.id);
        setName(w.name);
        setResponsible(w.responsible || '');
    };

    const handleCancel = () => {
        setEditingId(null);
        setName('');
        setResponsible('');
    };

    const handleSave = async () => {
        if(!name.trim()) return alert("El nombre es obligatorio");
        
        const data: Warehouse = {
            id: editingId || `WH-${Date.now()}`,
            name,
            responsible
        };

        try {
            if(editingId) await updateWarehouse(data);
            else await addWarehouse(data);
            handleCancel();
        } catch(e) {
            console.error(e);
            alert("Error al guardar");
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader title="Maestro de Almacenes" icon={Package} />
            
            {/* Form */}
            <div className={`p-5 rounded-xl border transition-all ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`text-sm font-bold mb-4 flex items-center ${editingId ? 'text-yellow-800' : 'text-slate-800'}`}>
                    {editingId ? <Edit2 size={16} className="mr-2"/> : <Plus size={16} className="mr-2"/>} 
                    {editingId ? 'Editar Almacén' : 'Crear Nuevo Almacén'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Almacén</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="Ej. Depósito Central" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Responsable</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="Ej. Juan Perez" value={responsible} onChange={e => setResponsible(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        {editingId && <button onClick={handleCancel} className="px-4 py-2 bg-white border border-slate-300 text-slate-500 rounded-lg hover:bg-slate-50">Cancelar</button>}
                        <button onClick={handleSave} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Guardar</button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Responsable</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {warehouses.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{w.name}</td>
                                <td className="px-4 py-3 text-slate-600">{w.responsible || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(w)} className="text-accent hover:text-blue-700 font-medium p-1">
                                        <Edit2 size={16} />
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

// --- Location Manager ---

const LocationMasterView = () => {
    const { warehouses, warehouseLocations, addWarehouseLocation, updateWarehouseLocation } = useMasterData();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [warehouseId, setWarehouseId] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    const handleEdit = (l: WarehouseLocation) => {
        setEditingId(l.id);
        setWarehouseId(l.warehouseId);
        setCode(l.code);
        setDescription(l.description || '');
    };

    const handleCancel = () => {
        setEditingId(null);
        setWarehouseId('');
        setCode('');
        setDescription('');
    };

    const handleSave = async () => {
        if(!warehouseId || !code) return alert("Almacén y Código son obligatorios");
        
        const data: WarehouseLocation = {
            id: editingId || `LOC-${Date.now()}`,
            warehouseId,
            code,
            description
        };

        try {
            if(editingId) await updateWarehouseLocation(data);
            else await addWarehouseLocation(data);
            handleCancel();
        } catch(e) {
            console.error(e);
            alert("Error al guardar");
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader title="Gestión de Ubicaciones" icon={MapPin} />
            
            {/* Form */}
            <div className={`p-5 rounded-xl border transition-all ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`text-sm font-bold mb-4 flex items-center ${editingId ? 'text-yellow-800' : 'text-slate-800'}`}>
                    {editingId ? <Edit2 size={16} className="mr-2"/> : <Plus size={16} className="mr-2"/>} 
                    {editingId ? 'Editar Ubicación' : 'Crear Nueva Ubicación'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Almacén Padre</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Código (Rack/Fila)</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="Ej. RACK-A-01" value={code} onChange={e => setCode(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Descripción / Notas</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="Opcional" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-2">
                        {editingId && <button onClick={handleCancel} className="px-4 py-2 bg-white border border-slate-300 text-slate-500 rounded-lg hover:bg-slate-50">Cancelar</button>}
                        <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Guardar Ubicación</button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Almacén</th>
                            <th className="px-4 py-3">Descripción</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {warehouseLocations.map(l => {
                            const whName = warehouses.find(w => w.id === l.warehouseId)?.name || 'Desconocido';
                            return (
                                <tr key={l.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono font-medium text-slate-700">{l.code}</td>
                                    <td className="px-4 py-3 text-slate-600"><span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs">{whName}</span></td>
                                    <td className="px-4 py-3 text-slate-500">{l.description || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleEdit(l)} className="text-accent hover:text-blue-700 font-medium p-1">
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        {warehouseLocations.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400">No hay ubicaciones creadas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- CHECKLIST MODEL MANAGER ---
// (No changes needed for Checklist logic, keeping existing)

const ChecklistModelForm = ({ modelToEdit, onSave, onCancel }: { modelToEdit: ChecklistModel | null, onSave: (m: ChecklistModel) => void, onCancel: () => void }) => {
    // ... existing checklist form logic ...
    const { machineTypes, vehicleTypes } = useMasterData();
    const [name, setName] = useState(modelToEdit?.name || '');
    const [assetType, setAssetType] = useState<AssetType>(modelToEdit?.assetType || AssetType.MACHINE);
    const [assetSubtype, setAssetSubtype] = useState(modelToEdit?.assetSubtype || '');
    const [items, setItems] = useState<ChecklistItemDefinition[]>(modelToEdit?.items || []);
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
             {/* Simplified UI for brevity in this response, functionally same as before */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver a la lista</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                    <Input label="Nombre del Modelo" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Ej. Inspección Diaria Autoelevador" />
                </div>
                 {/* ...rest of inputs... */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Activo</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
                        <option value={AssetType.MACHINE}>Máquina</option>
                        <option value={AssetType.VEHICLE}>Vehículo</option>
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Subtipo</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={assetSubtype} onChange={(e) => setAssetSubtype(e.target.value)}>
                        <option value="">Cualquiera</option>
                        {assetType === AssetType.MACHINE ? machineTypes.map(t => <option key={t} value={t}>{t}</option>) : vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center"><CheckSquare size={16} className="mr-2"/> Items del Checklist</h4>
                <div className="flex gap-2 mb-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Descripción del Item</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="Ej. Verificar nivel de aceite" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} />
                    </div>
                     <div className="flex items-center pb-2 px-2 bg-white border border-slate-200 rounded-lg h-[42px]">
                         <input type="checkbox" checked={newItemCritical} onChange={(e) => setNewItemCritical(e.target.checked)} className="mr-2"/>
                        <label className="text-sm text-slate-700 font-medium">Es Crítico</label>
                    </div>
                    <button onClick={handleAddItem} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 h-[42px]">Agregar</button>
                </div>
                 <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200">
                             <span className="text-slate-700">{idx+1}. {item.label} {item.isCritical && '(Critico)'}</span>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
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

const ChecklistManager = () => {
    const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedModel, setSelectedModel] = useState<ChecklistModel | null>(null);
    const { checklistModels, addChecklistModel, updateChecklistModel } = useMasterData();

    const handleEdit = (m: ChecklistModel | null) => {
        setSelectedModel(m);
        setView('FORM');
    };

    const handleSave = async (m: ChecklistModel) => {
        if (selectedModel) await updateChecklistModel(m);
        else await addChecklistModel(m);
        setView('LIST');
    };

    if (view === 'FORM') return <ChecklistModelForm modelToEdit={selectedModel} onSave={handleSave} onCancel={() => setView('LIST')} />;
    
    // Simple List View
    return (
        <div>
             <SectionHeader title="Modelos de Checklist" actionLabel="Nuevo Modelo" icon={CheckSquare} onAction={() => handleEdit(null)} />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checklistModels.map(model => (
                    <div key={model.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-accent" onClick={() => handleEdit(model)}>
                        <h4 className="font-bold text-slate-800">{model.name}</h4>
                        <p className="text-xs text-slate-500">{model.items.length} items</p>
                    </div>
                ))}
             </div>
        </div>
    )
};


// --- NUMERATOR MANAGER ---

const NumeratorManager = () => {
    const { numerators, addNumerator, updateNumerator } = useMasterData();
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form State
    const [name, setName] = useState('');
    const [prefix, setPrefix] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [length, setLength] = useState('4');
    const [assignedType, setAssignedType] = useState<DocumentType>('PURCHASE_ORDER');

    const handleEdit = (n: Numerator) => {
        setEditingId(n.id);
        setName(n.name);
        setPrefix(n.prefix);
        setCurrentValue(n.currentValue.toString());
        setLength(n.length.toString());
        setAssignedType(n.assignedType);
    };

    const handleCancel = () => {
        setEditingId(null);
        setName('');
        setPrefix('');
        setCurrentValue('');
    };

    const handleSave = async () => {
        if (!name) {
            alert("Complete nombre.");
            return;
        }

        const numData: Numerator = {
            id: editingId || `NUM-${Date.now()}`,
            name,
            prefix,
            currentValue: parseInt(currentValue),
            length: parseInt(length) || 4,
            assignedType
        };

        try {
            if (editingId) {
                await updateNumerator(numData);
            } else {
                await addNumerator(numData);
            }
            handleCancel();
        } catch (e) {
            console.error(e);
            alert("Error al guardar numerador");
        }
    };

    const docTypeOptions: {value: DocumentType, label: string}[] = [
        { value: 'RFQ', label: 'Petición de Oferta (RFQ)' },
        { value: 'PURCHASE_ORDER', label: 'Orden de Compra (OC)' },
        { value: 'MAINTENANCE_ORDER', label: 'Orden de Mantenimiento (OT)' },
        { value: 'WORK_REQUEST', label: 'Aviso de Avería / Solicitud' },
        { value: 'STOCK_MOVEMENT', label: 'Movimiento de Stock' },
        { value: 'MATERIAL', label: 'Maestro de Materiales' },
        { value: 'SUPPLIER', label: 'Maestro de Proveedores' },
        { value: 'CLIENT', label: 'Maestro de Clientes' },
    ];

    return (
        <div className="space-y-6">
            <SectionHeader title="Gestión de Numeradores" icon={FileDigit} />
            
            {/* Form */}
            <div className={`p-5 rounded-xl border transition-all ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`text-sm font-bold mb-4 flex items-center ${editingId ? 'text-yellow-800' : 'text-slate-800'}`}>
                    {editingId ? <Edit2 size={16} className="mr-2"/> : <Plus size={16} className="mr-2"/>} 
                    {editingId ? 'Editar Numerador' : 'Crear Nuevo Numerador'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre / Descripción</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="Ej. Orden de Compra Planta A" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Funcionalidad Asignada</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={assignedType} onChange={e => setAssignedType(e.target.value as DocumentType)}>
                            {docTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Prefijo</label>
                        <input className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="Ej. OC-24-" value={prefix} onChange={e => setPrefix(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Último Valor Usado</label>
                        <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="0" value={currentValue} onChange={e => setCurrentValue(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Longitud (Ceros)</label>
                        <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="4" value={length} onChange={e => setLength(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                        <div className="flex gap-2 w-full">
                            {editingId && <button onClick={handleCancel} className="flex-1 py-2 text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>}
                            <button onClick={handleSave} className="flex-1 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm font-medium">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Funcionalidad</th>
                            <th className="px-4 py-3">Formato Ejemplo</th>
                            <th className="px-4 py-3 text-right">Último Nro</th>
                            <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {numerators.map(num => (
                            <tr key={num.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{num.name}</td>
                                <td className="px-4 py-3 text-slate-600">
                                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                                        {docTypeOptions.find(o => o.value === num.assignedType)?.label || num.assignedType}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-500">
                                    {num.prefix}{String(num.currentValue + 1).padStart(num.length, '0')}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-700">{num.currentValue}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(num)} className="text-accent hover:text-blue-700 font-medium">
                                        <Edit2 size={16} />
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


// --- Main Component ---

type Tab = 'CLIENTS' | 'SUPPLIERS' | 'ASSETS' | 'PARAMS' | 'WAREHOUSES' | 'MATERIALS' | 'CHECKLISTS' | 'NUMERATORS';
type SubTab = 'PARAM_REGIONS' | 'PARAM_UOM' | 'PARAM_TYPE_M' | 'PARAM_TYPE_V' | 'WH_CREATE' | 'WH_LOC' | 'NUM_CREATE' | 'NUM_ASSIGN';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<Tab>('CLIENTS');
  const [activeSubTab, setActiveSubTab] = useState<string>('PARAM_REGIONS');
  
  const [newParamValue, setNewParamValue] = useState('');
  const { 
    regions, uoms, machineTypes, vehicleTypes,
    addRegion, addUom, addMachineType, addVehicleType, addMaterial,
    addClient, addSupplier, getNextId
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

  const handleSaveClient = async (data: any) => {
      try {
          const id = await getNextId('CLIENT');
          await addClient({ id, ...data });
          alert(`Cliente creado con ID: ${id}`);
      } catch (e) {
          console.error(e);
          alert("Error al crear cliente");
      }
  }

  const handleSaveSupplier = async (data: any) => {
      try {
          const id = await getNextId('SUPPLIER');
          await addSupplier({ id, ...data });
          alert(`Proveedor creado con ID: ${id}`);
      } catch (e) {
          console.error(e);
          alert("Error al crear proveedor");
      }
  }

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
            <SectionHeader title="Maestro de Clientes" />
            <div className="bg-yellow-50 p-3 mb-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 flex items-center">
                <FileDigit size={16} className="mr-2"/> La numeración se asignará automáticamente (Rango 11xxxxxx).
            </div>
            <ClientForm type="CLIENT" onSave={handleSaveClient} />
          </div>
        );
      
      case 'SUPPLIERS':
         return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <SectionHeader title="Maestro de Proveedores" />
             <div className="bg-yellow-50 p-3 mb-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 flex items-center">
                <FileDigit size={16} className="mr-2"/> La numeración se asignará automáticamente (Rango 14xxxxxx).
            </div>
            <ClientForm type="SUPPLIER" onSave={handleSaveSupplier} /> 
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
                        {id: 'WH_CREATE', label: 'Almacenes (Depósitos)'}, 
                        {id: 'WH_LOC', label: 'Ubicaciones'}
                    ]} 
                    current={activeSubTab} 
                    onChange={setActiveSubTab} 
                />
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    {activeSubTab === 'WH_CREATE' ? <WarehouseMasterView /> : <LocationMasterView />}
                </div>
            </div>
        );

      case 'MATERIALS':
        return <MaterialMasterView />;

      case 'CHECKLISTS':
          return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <ChecklistManager />
            </div>
          );

      case 'NUMERATORS':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <NumeratorManager />
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
          { id: 'MATERIALS', label: 'Materiales' },
          { id: 'WAREHOUSES', label: 'Almacenes' },
          { id: 'PARAMS', label: 'Parámetros' },
          { id: 'CHECKLISTS', label: 'Modelos Checklist' },
          { id: 'NUMERATORS', label: 'Numeradores' },
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
