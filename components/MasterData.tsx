
import React, { useState } from 'react';
import { Plus, Save, Trash2, Edit2, Search, List, MapPin, Ruler, Tag, Hash, CheckSquare, X, CheckCircle } from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { Material } from '../types';

// Reusable Components
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

const SectionHeader = ({ title, actionLabel, icon: Icon }: any) => (
  <div className="flex justify-between items-center mb-6">
    <h3 className="text-lg font-bold text-slate-800 flex items-center">
        {Icon && <Icon className="mr-2 text-slate-500" size={20} />}
        {title}
    </h3>
    {actionLabel && (
        <button className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md transition-all">
            <Plus size={18} className="mr-2"/> {actionLabel}
        </button>
    )}
  </div>
);

// --- Dynamic Forms using Context ---

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

const MachineForm = () => {
    const { machineTypes, warehouses } = useMasterData();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Código Interno" placeholder="MAQ-001" />
            <Input label="Nombre Máquina" placeholder="Torno CNC" />
            <Input label="Marca" />
            <Input label="Modelo" />
            <Input label="Número de Serie" />
            <Input label="Año Fabricación" type="number" />
            <Select label="Tipo de Máquina" options={machineTypes} />
            <Select label="Ubicación Física (Nave/Almacén)" options={warehouses} />
        </div>
    );
};

const VehicleForm = () => {
    const { vehicleTypes } = useMasterData();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Patente (Dominio)" placeholder="AA 123 BB" />
            <Input label="Marca" />
            <Input label="Modelo" />
            <Input label="Versión" />
            <Select label="Tipo de Vehículo" options={vehicleTypes} />
            <Input label="Kilometraje Actual" type="number" />
            <Input label="Vencimiento VTV" type="date" />
            <Input label="Nro Póliza Seguro" />
        </div>
    );
};

const MaterialForm = ({ onSave }: { onSave: (m: any) => void }) => {
    const { uoms, warehouses, suppliers } = useMasterData();
    const [formData, setFormData] = useState<Partial<Material>>({
        assignedSupplierIds: []
    });
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleSupplier = (supplierId: string) => {
        const current = formData.assignedSupplierIds || [];
        if (current.includes(supplierId)) {
            setFormData({ ...formData, assignedSupplierIds: current.filter(id => id !== supplierId) });
        } else {
            setFormData({ ...formData, assignedSupplierIds: [...current, supplierId] });
        }
    };

    const handleSave = () => {
        onSave(formData);
        // Reset (Simplified)
        setFormData({ assignedSupplierIds: [] });
        setSearchTerm('');
    };

    // Filter suppliers logic
    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.cuit.includes(searchTerm)
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Código Artículo</label>
                <input name="code" onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="MAT-0001" />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <input name="description" onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" placeholder="Ej. Aceite 15W40 Tambor" />
            </div>
            <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de Medida</label>
                 <select name="unitOfMeasure" onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="">Seleccionar...</option>
                    {uoms.map(u => <option key={u} value={u}>{u}</option>)}
                 </select>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo de Reposición (ARS)</label>
                <input name="cost" type="number" onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label>
                <input name="minStock" type="number" onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" />
            </div>
             <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación Sugerida</label>
                 <select name="location" onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="">Seleccionar...</option>
                    {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                 </select>
            </div>
            
            <div className="col-span-1 md:col-span-2 mt-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3">Asignación de Proveedores (¿Quién lo vende?)</label>
                
                {/* Search Bar */}
                <div className="relative mb-3">
                    <input 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-accent outline-none text-sm"
                        placeholder="Buscar proveedor por nombre o CUIT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>

                {/* Selected Tags */}
                {formData.assignedSupplierIds && formData.assignedSupplierIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {formData.assignedSupplierIds.map(id => {
                            const sup = suppliers.find(s => s.id === id);
                            return (
                                <span key={id} className="bg-white border border-slate-300 text-slate-700 text-xs px-2 py-1 rounded-full flex items-center shadow-sm">
                                    <span className="font-semibold mr-1">{sup?.name}</span>
                                    <button onClick={() => toggleSupplier(id)} className="text-slate-400 hover:text-red-500 ml-1"><X size={12}/></button>
                                </span>
                            )
                        })}
                    </div>
                )}

                {/* Scrollable List */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                    {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map(sup => {
                            const isSelected = formData.assignedSupplierIds?.includes(sup.id);
                            return (
                                <div 
                                    key={sup.id} 
                                    onClick={() => toggleSupplier(sup.id)}
                                    className={`flex items-center justify-between p-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                >
                                    <div>
                                        <p className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{sup.name}</p>
                                        <p className="text-xs text-slate-500">CUIT: {sup.cuit}</p>
                                    </div>
                                    {isSelected ? 
                                        <CheckCircle size={18} className="text-accent" /> : 
                                        <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                    }
                                </div>
                            )
                        })
                    ) : (
                        <div className="p-4 text-center text-xs text-slate-400">No se encontraron proveedores</div>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">Mostrando {filteredSuppliers.length} de {suppliers.length} proveedores</p>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
                <button onClick={handleSave} className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                    <Save size={18} className="mr-2"/> Guardar Material
                </button>
            </div>
        </div>
    );
};

const WarehouseForm = () => (
    <div className="grid grid-cols-1 gap-4">
        <Input label="Nombre del Almacén" placeholder="Ej. Depósito Central" />
        <Input label="Dirección / Ubicación Física" placeholder="Planta Industrial - Nave 1" />
        <Input label="Responsable" placeholder="Nombre del jefe de depósito" />
        <Select label="Es Almacén de Tránsito?" options={['No', 'Si']} />
    </div>
);

const LocationForm = () => {
    const { warehouses } = useMasterData();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Almacén Padre" options={warehouses} />
            <Input label="Código Ubicación" placeholder="Ej. RACK-A-01" />
            <Input label="Descripción" placeholder="Rack A, Nivel 1" />
            <Select label="Tipo" options={['Estantería', 'Rack Paletizado', 'Piso', 'Zona de Carga']} />
        </div>
    );
};

const ChecklistModelForm = () => {
    const { machineTypes, vehicleTypes } = useMasterData();
    // Combine types for generic checklist assignment
    const allTypes = [...machineTypes, ...vehicleTypes, 'Edificio', 'Instalación'];
    
    return (
        <div className="space-y-4">
            <Input label="Nombre del Modelo de Checklist" placeholder="Ej. Inspección Diaria Autoelevador" />
            <Select label="Aplica a Tipo de Activo" options={allTypes} />
            
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Items de Verificación</h4>
                <div className="space-y-2 mb-3">
                    <div className="flex gap-2">
                        <input className="flex-1 px-3 py-2 border rounded-md text-sm bg-white" placeholder="Ej. Verificar nivel de aceite" value="Verificar nivel de aceite" readOnly />
                        <button className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex gap-2">
                        <input className="flex-1 px-3 py-2 border rounded-md text-sm bg-white" placeholder="Ej. Verificar presión de neumáticos" value="Verificar presión de neumáticos" readOnly />
                        <button className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-accent outline-none bg-white" placeholder="Nuevo punto de control..." />
                    <button className="bg-slate-200 text-slate-700 px-3 py-2 rounded-md hover:bg-slate-300 font-medium text-sm">Agregar</button>
                </div>
            </div>
        </div>
    );
};

const NumeratorForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Tipo de Documento" options={['Orden de Compra', 'Pedido de Venta', 'Orden de Mantenimiento', 'Remito Interno']} />
        <Input label="Prefijo" placeholder="Ej. OC-2024" />
        <Input label="Próximo Número" type="number" placeholder="1" />
        <Select label="Reinicia Anualmente?" options={['Si', 'No']} />
    </div>
);

// --- Main Component ---

type Tab = 'CLIENTS' | 'SUPPLIERS' | 'ASSETS' | 'PARAMS' | 'WAREHOUSES' | 'MATERIALS' | 'CHECKLISTS' | 'NUMERATORS';
type SubTab = 'ASSET_MACHINE' | 'ASSET_VEHICLE' | 'PARAM_REGIONS' | 'PARAM_UOM' | 'PARAM_TYPE_M' | 'PARAM_TYPE_V' | 'WH_CREATE' | 'WH_LOC' | 'NUM_CREATE' | 'NUM_ASSIGN';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<Tab>('CLIENTS');
  const [activeSubTab, setActiveSubTab] = useState<string>('ASSET_MACHINE');
  
  // State for adding new parameters
  const [newParamValue, setNewParamValue] = useState('');
  const { 
    regions, uoms, machineTypes, vehicleTypes,
    addRegion, addUom, addMachineType, addVehicleType, addMaterial 
  } = useMasterData();

  // SubTab Navigation Helper
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
    // Generate ID for mock
    const newMaterial: Material = {
        id: `MAT-${Date.now()}`,
        stock: 0,
        ...data
    };
    addMaterial(newMaterial);
    alert("Material guardado y proveedores vinculados correctamente.");
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
            <div className="mt-4 pt-4 border-t border-slate-100">
               <h4 className="text-sm font-semibold mb-3 text-slate-700">Datos Comerciales</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Input label="Condiciones de Pago" placeholder="Ej. 30/60 días fecha factura" />
                   <Input label="Límite de Crédito" type="number" />
               </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                  <Save size={18} className="mr-2"/> Guardar Proveedor
                </button>
            </div>
          </div>
        );

      case 'ASSETS':
        return (
          <div>
            <SubTabs 
                tabs={[{id: 'ASSET_MACHINE', label: 'Máquinas'}, {id: 'ASSET_VEHICLE', label: 'Vehículos'}]} 
                current={activeSubTab} 
                onChange={setActiveSubTab} 
            />
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">
                {activeSubTab === 'ASSET_MACHINE' ? 'Alta de Máquina / Equipo' : 'Alta de Vehículo'}
              </h3>
              {activeSubTab === 'ASSET_MACHINE' ? <MachineForm /> : <VehicleForm />}
              <div className="mt-6 flex justify-end">
                <button className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                  <Save size={18} className="mr-2"/> Guardar Activo
                </button>
              </div>
            </div>
          </div>
        );

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
                    {/* List preview */}
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Valores Existentes ({currentList.length})</p>
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
                    {activeSubTab === 'WH_CREATE' ? (
                        <>
                            <SectionHeader title="Alta de Almacenes Físicos" icon={MapPin} />
                            <WarehouseForm />
                        </>
                    ) : (
                        <>
                            <SectionHeader title="Gestión de Ubicaciones (Racks/Filas)" icon={Ruler} />
                            <LocationForm />
                        </>
                    )}
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
                <SectionHeader title="Modelos de Checklist (Mantenimiento)" actionLabel="Nuevo Modelo" icon={CheckSquare} />
                <ChecklistModelForm />
                <div className="mt-6 flex justify-end">
                    <button className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                        <Save size={18} className="mr-2"/> Guardar Modelo
                    </button>
                </div>
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
                    {activeSubTab === 'NUM_CREATE' ? (
                        <>
                            <SectionHeader title="Configuración de Numeradores" icon={Hash} />
                            <NumeratorForm />
                            <div className="mt-6 flex justify-end">
                                <button className="flex items-center px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">
                                    <Save size={18} className="mr-2"/> Guardar Numerador
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                             <SectionHeader title="Asignación de Numeradores a Usuarios/Puntos de Venta" icon={Hash} />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select label="Usuario / Punto de Venta" options={['Admin (Pto Vta 1)', 'Ventas (Pto Vta 2)']} />
                                <Select label="Numerador Disponible" options={['Remito Venta - 0001', 'Orden Compra - 0001']} />
                             </div>
                             <div className="mt-6 flex justify-end">
                                <button className="flex items-center px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md">
                                    <Save size={18} className="mr-2"/> Asignar
                                </button>
                            </div>
                        </>
                    )}
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
                // Reset subtab defaults when switching mother tab
                if(tab.id === 'ASSETS') setActiveSubTab('ASSET_MACHINE');
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
