
import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';

const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const obj: any = {};
        const currentLine = lines[i].split(delimiter); 
        
        if (currentLine.length <= 1 && !currentLine[0]) continue;

        headers.forEach((header, index) => {
            const val = currentLine[index]?.trim().replace(/"/g, '');
            obj[header] = val;
        });
        result.push(obj);
    }
    return result;
};

export const DataImporter = () => {
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
            // Updated Headers
            headers = 'razon_social;cuit;direccion;emails_separados_coma;nombre_contacto;telefono_contacto';
            filename = 'template_clientes.csv';
        } else {
            // Updated Headers
            headers = 'razon_social;cuit;direccion;condicion_pago;emails_separados_coma;nombre_contacto;telefono_contacto';
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
                    
                    // Parse Multiple Emails
                    const emailString = row.emails_separados_coma || row.email || '';
                    const emails = emailString.split(',').map((e:string) => e.trim()).filter((e:string) => e.length > 0);
                    
                    // Parse Contact
                    const contacts = [];
                    if (row.nombre_contacto || row.telefono_contacto) {
                        contacts.push({
                            name: row.nombre_contacto || 'Contacto Principal',
                            phone: row.telefono_contacto || '',
                            email: emails[0] || '', // Default first email to first contact
                            role: 'Importado'
                        });
                    }

                    await addClient({
                        id: newId,
                        businessName: row.razon_social,
                        cuit: row.cuit || '',
                        address: row.direccion || '',
                        conditionIVA: 'Responsable Inscripto',
                        emails: emails,
                        contacts: contacts,
                        // Legacy support
                        contactName: row.nombre_contacto || '',
                        email: emails[0] || ''
                    });
                } else if (importType === 'SUPPLIER') {
                    if (!row.razon_social) continue;
                    const newId = await getNextId('SUPPLIER');
                    
                    // Parse Multiple Emails
                    const emailString = row.emails_separados_coma || row.email || '';
                    const emails = emailString.split(',').map((e:string) => e.trim()).filter((e:string) => e.length > 0);
                    
                    // Parse Contact
                    const contacts = [];
                    if (row.nombre_contacto || row.telefono_contacto) {
                        contacts.push({
                            name: row.nombre_contacto || 'Contacto Principal',
                            phone: row.telefono_contacto || '',
                            email: emails[0] || '', 
                            role: 'Importado'
                        });
                    }

                    await addSupplier({
                        id: newId,
                        businessName: row.razon_social,
                        cuit: row.cuit || '',
                        address: row.direccion || '',
                        paymentTerms: row.condicion_pago || '',
                        conditionIVA: 'Responsable Inscripto',
                        emails: emails,
                        contacts: contacts,
                        // Legacy support
                        contactName: row.nombre_contacto || '',
                        email: emails[0] || ''
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in h-full flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <FileSpreadsheet className="mr-2 text-green-600"/> Importación Masiva
                </h3>
                <p className="text-slate-500 text-sm mt-1">Carga de datos desde Excel/CSV.</p>
            </div>
            
            <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">1. Seleccionar Entidad</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {['MATERIAL', 'CLIENT', 'SUPPLIER'].map(t => (
                            <button 
                                key={t}
                                onClick={() => { setImportType(t as any); setFileData([]); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${importType === t ? 'bg-green-50 border-green-500 text-green-700 shadow-sm ring-1 ring-green-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {t === 'MATERIAL' ? 'Materiales' : t === 'CLIENT' ? 'Clientes' : 'Proveedores'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 p-4 md:p-5 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-sm font-bold text-blue-800 mb-1">2. Descargar Plantilla</p>
                        <p className="text-xs text-blue-600">Formato CSV correcto para {importType === 'MATERIAL' ? 'Materiales' : importType === 'CLIENT' ? 'Clientes' : 'Proveedores'}.</p>
                    </div>
                    <button onClick={handleDownloadTemplate} className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 text-xs font-bold shadow-sm hover:bg-blue-50 active:scale-95 transition-transform">
                        <Download size={16} className="mr-2"/> Descargar Plantilla
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">3. Subir Archivo CSV</label>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-lg"
                    />
                </div>

                {fileData.length > 0 && (
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500">Vista Previa ({fileData.length} filas)</div>
                        <div className="max-h-60 overflow-auto bg-white custom-scrollbar">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 font-bold border-b sticky top-0">
                                    <tr>
                                        {Object.keys(fileData[0]).map(k => <th key={k} className="p-3 text-slate-700 whitespace-nowrap">{k}</th>)}
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

            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                <button 
                    onClick={executeImport} 
                    disabled={fileData.length === 0 || isImporting}
                    className="w-full md:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md disabled:opacity-50 flex items-center justify-center transition-all active:scale-95"
                >
                    {isImporting ? 'Procesando...' : <><Upload size={20} className="mr-2"/> Importar {fileData.length} Registros</>}
                </button>
            </div>
        </div>
    );
};
