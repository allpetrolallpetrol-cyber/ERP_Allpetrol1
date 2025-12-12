
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Save, Trash2, Edit2, Search, List, MapPin, Ruler, Tag, Hash, CheckSquare, X, CheckCircle, CalendarClock, Cog, Truck, Settings, ArrowLeft, AlertTriangle, FileDigit, Users, Eye, Package, Briefcase, UserCircle, Grid, Lock, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Material, MaintenanceRoutine, AssetType, Asset, ChecklistModel, ChecklistItemDefinition, Numerator, DocumentType, Warehouse, WarehouseLocation, Client, Supplier, Area } from '../types';

// --- HELPER: CSV PARSER ---
const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    // Detect delimiter: Check first line for semicolon, otherwise default to comma
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const obj: any = {};
        const currentLine = lines[i].split(delimiter); // Simple split
        
        // Skip empty lines
        if (currentLine.length <= 1 && !currentLine[0]) continue;

        headers.forEach((header, index) => {
            const val = currentLine[index]?.trim().replace(/"/g, '');
            obj[header] = val;
        });
        result.push(obj);
    }
    return result;
};

// --- DATA IMPORTER COMPONENT ---
const DataImporter = () => {
    const { addMaterial, addClient, addSupplier, getNextId } = useMasterData();
    const { showToast } = useUI();
    const [importType, setImportType] = useState<'MATERIAL' | 'CLIENT' | 'SUPPLIER'>('MATERIAL');
    const [fileData, setFileData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        let headers = '';
        let filename = '';

        if (importType === 'MATERIAL') {
            headers = 'descripcion;unidad;stock;minimo;costo;ubicacion'; 
            filename = 'template_materiales.csv';
        } else if (importType === 'CLIENT') {
            headers = 'razon_social;cuit;contacto;email;direccion';
            filename = 'template_clientes.csv';
        } else {
            headers = 'razon_social;cuit;contacto;email;condicion_pago';
            filename = 'template_proveedores.csv';
        }

        const bom = '\uFEFF'; 
        const blob = new Blob([bom + headers], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const parsed = parseCSV(text);
            if (parsed.length > 0) {
                setFileData(parsed);
                showToast(`Se detectaron ${parsed.length} registros.`, 'info');
            } else {
                showToast('El archivo parece estar vacío o mal formateado.', 'error');
            }
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
        if (fileData.length === 0) return;
        setIsImporting(true);
        let count = 0;

        try {
            for (const row of fileData) {
                if (importType === 'MATERIAL') {
                    if (!row.descripcion) continue;
                    const newId = await getNextId('MATERIAL');
                    await addMaterial({
                        id: newId,
                        code: row.codigo || newId,
                        description: row.descripcion,
                        unitOfMeasure: row.unidad || 'UN',
                        stock: parseFloat(row.stock || '0'),
                        minStock: parseFloat(row.minimo || '0'),
                        cost: parseFloat(row.costo || '0'),
                        warehouse: '', 
                        location: row.ubicacion || '',
                        assignedSupplierIds: []
                    });
                } else if (importType === 'CLIENT') {
                    if (!row.razon_social) continue;
                    const newId = await getNextId('CLIENT');
                    await addClient({
                        id: newId,
                        businessName: row.razon_social,
                        cuit: row.cuit || '',
                        contactName: row.contacto || '',
                        email: row.email || '',
                        address: row.direccion || '',
                        conditionIVA: 'Responsable Inscripto'
                    });
                } else if (importType === 'SUPPLIER') {
                    if (!row.razon_social) continue;
                    const newId = await getNextId('SUPPLIER');
                    await addSupplier({
                        id: newId,
                        businessName: row.razon_social,
                        cuit: row.cuit || '',
                        contactName: row.contacto || '',
                        email: row.email || '',
                        paymentTerms: row.condicion_pago || '',
                        conditionIVA: 'Responsable Inscripto',
                        address: ''
                    });
                }
                count++;
            }
            showToast(`Importación exitosa: ${count} registros procesados.`, 'success');
            setFileData([]);
            if(fileInputRef.current) fileInputRef.current.value = '';
        } catch (e) {
            console.error(e);
            showToast('Error durante la importación.', 'error');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <FileSpreadsheet className="mr-2 text-green-600"/> Importación Masiva de Datos
                </h3>
                <p className="text-slate-500 text-sm mt-1">Carga desde archivos CSV.</p>
            </div>
            
            <div className="p-6 space-y-8">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">1. Tipo de Datos</label>
                    <div className="flex gap-4">
                        {['MATERIAL', 'CLIENT', 'SUPPLIER'].map(t => (
                            <button 
                                key={t}
                                onClick={() => { setImportType(t as any); setFileData([]); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                className={`px-6 py-3 rounded-lg border text-sm font-medium transition-all ${importType === t ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`}
                            >
                                {t === 'MATERIAL' ? 'Materiales' : t === 'CLIENT' ? 'Clientes' : 'Proveedores'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex justify-between items-center">
                    <p className="text-sm font-bold text-blue-800">2. Plantilla CSV</p>
                    <button onClick={handleDownloadTemplate} className="flex items-center px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 text-xs font-bold shadow-sm">
                        <Download size={16} className="mr-2"/> Descargar
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">3. Cargar Archivo</label>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                </div>

                {fileData.length > 0 && (
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500">Vista Previa ({fileData.length})</div>
                        <div className="max-h-60 overflow-auto bg-white">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 font-bold border-b sticky top-0">
                                    <tr>
                                        {Object.keys(fileData[0]).map(k => <th key={k} className="p-3 text-slate-700">{k}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fileData.slice(0, 10).map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((v: any, idx) => <td key={idx} className="p-3 truncate max-w-[150px] text-slate-600">{v}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                    onClick={executeImport} 
                    disabled={fileData.length === 0 || isImporting}
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md disabled:opacity-50 flex items-center"
                >
                    {isImporting ? 'Procesando...' : <><Upload size={20} className="mr-2"/> Importar {fileData.length} Registros</>}
                </button>
            </div>
        </div>
    );
};

// --- UI Helpers ---
const Input = ({ label, readOnly, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input 
        disabled={readOnly}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white disabled:bg-slate-100" 
        {...props} 
    />
  </div>
);

const Select = ({ label, options, readOnly, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select 
        disabled={readOnly}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white disabled:bg-slate-100" 
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

// --- FORMS ---

const ClientForm = ({ type, initialData, onSave, onCancel, readOnly }: any) => {
  const { regions } = useMasterData();
  const { showToast } = useUI();
  const [formData, setFormData] = useState(initialData || {
      businessName: '',
      cuit: '',
      address: '',
      contactName: '',
      email: '',
      conditionIVA: 'Responsable Inscripto',
      paymentTerms: '',
      region: ''
  });

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
                {readOnly ? `Ver ${type}` : (initialData ? `Editar ${type}` : `Nuevo ${type}`)}
            </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Razón Social" value={formData.businessName} onChange={(e:any) => setFormData({...formData, businessName: e.target.value})} readOnly={readOnly} />
            <Input label="CUIT" value={formData.cuit} onChange={(e:any) => setFormData({...formData, cuit: e.target.value})} readOnly={readOnly} />
            <Input label="Dirección" value={formData.address} onChange={(e:any) => setFormData({...formData, address: e.target.value})} readOnly={readOnly} />
            <Input label="Email" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} readOnly={readOnly} />
            <Input label="Contacto" value={formData.contactName} onChange={(e:any) => setFormData({...formData, contactName: e.target.value})} readOnly={readOnly} />
            {type === 'SUPPLIER' && <Input label="Cond. Pago" value={formData.paymentTerms} onChange={(e:any) => setFormData({...formData, paymentTerms: e.target.value})} readOnly={readOnly} />}
            
            {!readOnly && (
                <div className="col-span-2 flex justify-end mt-4">
                    <button onClick={handleSubmit} className="px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">Guardar</button>
                </div>
            )}
        </div>
    </div>
  );
};

const MaterialForm = ({ initialData, onSave, onCancel, readOnly }: any) => {
    const { uoms, warehouses } = useMasterData();
    const { showToast } = useUI();
    const [formData, setFormData] = useState(initialData || {
        description: '',
        unitOfMeasure: 'UN',
        stock: 0,
        minStock: 0,
        cost: 0,
        warehouse: '',
        location: ''
    });

    const handleSubmit = () => {
        if (!formData.description) return showToast("Descripción obligatoria", 'error');
        onSave(formData);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-lg font-bold text-slate-800">{initialData ? 'Editar Material' : 'Nuevo Material'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Descripción" value={formData.description} onChange={(e:any) => setFormData({...formData, description: e.target.value})} readOnly={readOnly} />
                <Select label="Unidad Medida" options={uoms} value={formData.unitOfMeasure} onChange={(e:any) => setFormData({...formData, unitOfMeasure: e.target.value})} readOnly={readOnly} />
                <Input label="Stock Inicial" type="number" value={formData.stock} onChange={(e:any) => setFormData({...formData, stock: parseFloat(e.target.value)})} readOnly={readOnly} />
                <Input label="Stock Mínimo" type="number" value={formData.minStock} onChange={(e:any) => setFormData({...formData, minStock: parseFloat(e.target.value)})} readOnly={readOnly} />
                <Input label="Costo Unitario" type="number" value={formData.cost} onChange={(e:any) => setFormData({...formData, cost: parseFloat(e.target.value)})} readOnly={readOnly} />
                <Select label="Almacén" options={warehouses.map(w => ({value: w.id, label: w.name}))} value={formData.warehouse} onChange={(e:any) => setFormData({...formData, warehouse: e.target.value})} readOnly={readOnly} />
                <Input label="Ubicación" value={formData.location} onChange={(e:any) => setFormData({...formData, location: e.target.value})} readOnly={readOnly} />
                
                {!readOnly && (
                    <div className="col-span-2 flex justify-end mt-4">
                        <button onClick={handleSubmit} className="px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">Guardar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AssetForm = ({ initialData, onSave, onCancel, readOnly }: any) => {
    const { machineTypes, vehicleTypes } = useMasterData();
    const { showToast } = useUI();
    const [formData, setFormData] = useState(initialData || {
        name: '',
        type: 'MACHINE',
        subtype: '',
        brand: '',
        model: '',
        serialNumber: '',
        plate: ''
    });

    const handleSubmit = () => {
        if (!formData.name) return showToast("Nombre obligatorio", 'error');
        onSave(formData);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Volver</button>
                <h3 className="text-lg font-bold text-slate-800">{initialData ? 'Editar Activo' : 'Nuevo Activo'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nombre / Identificación" value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} readOnly={readOnly} />
                <Select label="Tipo" options={[{value: 'MACHINE', label: 'Máquina / Equipo'}, {value: 'VEHICLE', label: 'Vehículo'}]} value={formData.type} onChange={(e:any) => setFormData({...formData, type: e.target.value})} readOnly={readOnly} />
                
                {formData.type === 'MACHINE' ? (
                     <Select label="Subtipo Maquinaria" options={machineTypes} value={formData.subtype} onChange={(e:any) => setFormData({...formData, subtype: e.target.value})} readOnly={readOnly} />
                ) : (
                     <Select label="Subtipo Vehículo" options={vehicleTypes} value={formData.subtype} onChange={(e:any) => setFormData({...formData, subtype: e.target.value})} readOnly={readOnly} />
                )}

                <Input label="Marca" value={formData.brand} onChange={(e:any) => setFormData({...formData, brand: e.target.value})} readOnly={readOnly} />
                <Input label="Modelo" value={formData.model} onChange={(e:any) => setFormData({...formData, model: e.target.value})} readOnly={readOnly} />
                <Input label="Nro Serie" value={formData.serialNumber} onChange={(e:any) => setFormData({...formData, serialNumber: e.target.value})} readOnly={readOnly} />
                
                {formData.type === 'VEHICLE' && (
                    <Input label="Patente / Dominio" value={formData.plate} onChange={(e:any) => setFormData({...formData, plate: e.target.value})} readOnly={readOnly} />
                )}
                
                {!readOnly && (
                    <div className="col-span-2 flex justify-end mt-4">
                        <button onClick={handleSubmit} className="px-6 py-2 bg-success text-white rounded-lg hover:bg-green-600 shadow-md">Guardar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MASTER VIEWS ---

const ClientMasterView = ({ type }: { type: 'CLIENT' | 'SUPPLIER' }) => {
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

    if (viewMode === 'FORM') return <ClientForm type={type} initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <SectionHeader title={type === 'CLIENT' ? 'Clientes' : 'Proveedores'} actionLabel="Nuevo" onAction={() => { setSelected(null); setViewMode('FORM'); }} icon={Users} />
            <div className="mb-4 relative">
                <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="p-3">Razón Social</th>
                        <th className="p-3">CUIT</th>
                        <th className="p-3">Contacto</th>
                        <th className="p-3 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((item:any) => (
                        <tr key={item.id} className="border-b hover:bg-slate-50">
                            <td className="p-3">{item.businessName || item.name}</td>
                            <td className="p-3">{item.cuit}</td>
                            <td className="p-3">{item.contactName}</td>
                            <td className="p-3 text-right">
                                <button onClick={() => { setSelected(item); setViewMode('FORM'); }} className="text-blue-600"><Edit2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const MaterialMasterView = () => {
    const { materials, addMaterial, getNextId, updateMaterial } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selected, setSelected] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (data: any) => {
        try {
            if (selected) {
                await updateMaterial({ ...selected, ...data });
            } else {
                const id = await getNextId('MATERIAL');
                await addMaterial({ id, code: id, ...data });
            }
            showToast('Material guardado', 'success');
            setViewMode('LIST');
        } catch (e) {
            console.error(e);
            showToast('Error', 'error');
        }
    };

    const filtered = materials.filter(m => m.description.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase()));

    if (viewMode === 'FORM') return <MaterialForm initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <SectionHeader title="Maestro de Materiales" actionLabel="Nuevo Material" onAction={() => { setSelected(null); setViewMode('FORM'); }} icon={Package} />
            <div className="mb-4 relative">
                <input type="text" placeholder="Buscar por código o descripción..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
            <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b sticky top-0">
                        <tr>
                            <th className="p-3">Código</th>
                            <th className="p-3">Descripción</th>
                            <th className="p-3 text-right">Stock</th>
                            <th className="p-3 text-right">Costo</th>
                            <th className="p-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(m => (
                            <tr key={m.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-mono text-slate-600">{m.code}</td>
                                <td className="p-3 font-medium">{m.description}</td>
                                <td className="p-3 text-right">{m.stock} {m.unitOfMeasure}</td>
                                <td className="p-3 text-right">${m.cost}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setSelected(m); setViewMode('FORM'); }} className="text-blue-600"><Edit2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AssetMasterView = () => {
    const { assets, addAsset, getNextId } = useMasterData();
    const { showToast } = useUI();
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [selected, setSelected] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (data: any) => {
        try {
            const id = selected?.id || await getNextId('MAINTENANCE_ORDER'); // Reusing ID gen or specific one
            // NOTE: In types, Asset doesn't have a specific DocumentType for ID gen in the list, 
            // but we can just use timestamp or specific logic. 
            // Let's use simple ID generation.
            const finalId = selected?.id || `ASSET-${Date.now()}`;
            const code = selected?.code || `EQ-${Date.now().toString().slice(-4)}`;
            
            await addAsset({ id: finalId, code, ...data });
            showToast('Activo guardado', 'success');
            setViewMode('LIST');
        } catch (e) {
            console.error(e);
            showToast('Error', 'error');
        }
    };

    const filtered = assets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.code.toLowerCase().includes(searchTerm.toLowerCase()));

    if (viewMode === 'FORM') return <AssetForm initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} />;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <SectionHeader title="Maestro de Activos" actionLabel="Nuevo Activo" onAction={() => { setSelected(null); setViewMode('FORM'); }} icon={Cog} />
            <div className="mb-4 relative">
                <input type="text" placeholder="Buscar activo..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Marca/Modelo</th>
                        <th className="p-3 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(a => (
                        <tr key={a.id} className="border-b hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-600">{a.code}</td>
                            <td className="p-3 font-medium">{a.name}</td>
                            <td className="p-3">{a.type}</td>
                            <td className="p-3">{a.brand} {a.model}</td>
                            <td className="p-3 text-right">
                                <button onClick={() => { setSelected(a); setViewMode('FORM'); }} className="text-blue-600"><Edit2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const NumeratorManager = () => {
    const { numerators, updateNumerator } = useMasterData();
    const [editing, setEditing] = useState<string | null>(null);
    const [val, setVal] = useState<number>(0);

    const handleEdit = (n: Numerator) => {
        setEditing(n.id);
        setVal(n.currentValue);
    };

    const handleSave = (n: Numerator) => {
        updateNumerator({ ...n, currentValue: val });
        setEditing(null);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Hash className="mr-2"/> Configuración de Numeradores</h3>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="p-3">Documento</th>
                        <th className="p-3">Prefijo</th>
                        <th className="p-3 text-right">Valor Actual</th>
                        <th className="p-3 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {numerators.map(n => (
                        <tr key={n.id} className="border-b">
                            <td className="p-3 font-medium">{n.name}</td>
                            <td className="p-3 font-mono text-slate-500">{n.prefix || '-'}</td>
                            <td className="p-3 text-right">
                                {editing === n.id ? (
                                    <input type="number" className="w-24 border rounded px-2 py-1 text-right" value={val} onChange={e => setVal(parseInt(e.target.value))} />
                                ) : (
                                    <span className="font-mono font-bold">{n.currentValue}</span>
                                )}
                            </td>
                            <td className="p-3 text-right">
                                {editing === n.id ? (
                                    <button onClick={() => handleSave(n)} className="text-green-600"><Save size={16}/></button>
                                ) : (
                                    <button onClick={() => handleEdit(n)} className="text-blue-600"><Edit2 size={16}/></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const MasterData = () => {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'MATERIALS' | 'ASSETS' | 'CLIENTS' | 'SUPPLIERS' | 'IMPORT' | 'CONFIG'>('MATERIALS');

    const tabs = [
        { id: 'MATERIALS', label: 'Materiales', icon: Package },
        { id: 'ASSETS', label: 'Activos', icon: Cog },
        { id: 'CLIENTS', label: 'Clientes', icon: Users },
        { id: 'SUPPLIERS', label: 'Proveedores', icon: Truck },
        { id: 'IMPORT', label: 'Importación', icon: Upload },
        { id: 'CONFIG', label: 'Numeradores', icon: Settings },
    ];

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in">
            {/* Sidebar Menu */}
            <div className="w-full md:w-64 flex flex-col gap-2">
                {tabs.map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setActiveTab(t.id as any)}
                        className={`text-left px-4 py-3 rounded-xl flex items-center transition-all ${activeTab === t.id ? 'bg-white shadow-md text-accent font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                    >
                        <t.icon size={18} className="mr-3"/> {t.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                {activeTab === 'MATERIALS' && <MaterialMasterView />}
                {activeTab === 'ASSETS' && <AssetMasterView />}
                {activeTab === 'CLIENTS' && <ClientMasterView type="CLIENT" />}
                {activeTab === 'SUPPLIERS' && <ClientMasterView type="SUPPLIER" />}
                {activeTab === 'IMPORT' && <DataImporter />}
                {activeTab === 'CONFIG' && <NumeratorManager />}
            </div>
        </div>
    );
};
