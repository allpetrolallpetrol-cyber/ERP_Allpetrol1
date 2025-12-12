
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

        // Using Semicolon (;) for better Excel compatibility in Spanish regions
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

        // Add Byte Order Mark (BOM) for Excel to recognize UTF-8
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
            // Process sequentially to ensure ID generation order
            for (const row of fileData) {
                if (importType === 'MATERIAL') {
                    if (!row.descripcion) continue;
                    
                    // Generate ID sequentially from DB Root (e.g. 3000000)
                    const newId = await getNextId('MATERIAL');
                    
                    await addMaterial({
                        id: newId,
                        code: row.codigo || newId, // If code provided in CSV use it, else use generated ID
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
                    
                    // Generate ID sequentially from DB Root (e.g. 1100000)
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
                    
                    // Generate ID sequentially from DB Root (e.g. 1400000)
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
            showToast(`Importación exitosa: ${count} registros procesados con su numeración correspondiente.`, 'success');
            setFileData([]);
            if(fileInputRef.current) fileInputRef.current.value = '';
        } catch (e) {
            console.error(e);
            showToast('Error durante la importación. Revise la consola.', 'error');
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
                <p className="text-slate-500 text-sm mt-1">Cargue grandes volúmenes de datos. El sistema asignará automáticamente la numeración correlativa.</p>
            </div>
            
            <div className="p-6 space-y-8">
                {/* Step 1: Select Type */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">1. ¿Qué datos desea importar?</label>
                    <div className="flex gap-4">
                        {['MATERIAL', 'CLIENT', 'SUPPLIER'].map(t => (
                            <button 
                                key={t}
                                onClick={() => { setImportType(t as any); setFileData([]); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                className={`px-6 py-3 rounded-lg border text-sm font-medium transition-all ${importType === t ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {t === 'MATERIAL' ? 'Materiales' : t === 'CLIENT' ? 'Clientes' : 'Proveedores'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Download Template */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-blue-800 mb-1">2. Prepare su archivo CSV</p>
                        <p className="text-xs text-blue-600">Descargue la plantilla, complete los datos en Excel y guárdelo como "CSV (delimitado por comas)". <br/>El sistema soporta separadores de coma (,) y punto y coma (;).</p>
                    </div>
                    <button onClick={handleDownloadTemplate} className="flex items-center px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 text-xs font-bold hover:bg-blue-50 shadow-sm transition-colors">
                        <Download size={16} className="mr-2"/> Descargar Plantilla (Excel)
                    </button>
                </div>

                {/* Step 3: Upload */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">3. Subir archivo (.csv)</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Step 4: Preview & Confirm */}
                {fileData.length > 0 && (
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500 uppercase flex justify-between items-center border-b border-slate-200">
                            <span>Vista Previa ({fileData.length} filas detectadas)</span>
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">Verifique los datos antes de importar</span>
                        </div>
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
                            {fileData.length > 10 && <div className="p-2 text-center text-xs text-slate-400 italic bg-slate-50 border-t">... y {fileData.length - 10} filas más</div>}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                    onClick={executeImport} 
                    disabled={fileData.length === 0 || isImporting}
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md disabled:opacity-50 flex items-center transition-all transform active:scale-95"
                >
                    {isImporting ? 'Procesando...' : <><Upload size={20} className="mr-2"/> Importar {fileData.length} Registros</>}
                </button>
            </div>
        </div>
    );
};

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
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent bg-white"
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
                                <td className="px-4 py-3 font-mono text-slate-500 font-bold text-xs">{c.id}</td>
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
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay clientes registrados con ese criterio.</td></tr>
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
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-accent bg-white"
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
                                <td className="px-4 py-3 font-mono text-slate-500 font-bold text-xs">{s.id}</td>
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
                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">No hay proveedores registrados con ese criterio.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

// ... (Rest of the component remains unchanged: AreasMasterView, AssetForm, AssetMasterView, MaterialForm, MaterialMasterView, WarehouseMasterView, LocationMasterView, ChecklistModelForm, ChecklistManager, NumeratorManager, MasterData Component) ...
