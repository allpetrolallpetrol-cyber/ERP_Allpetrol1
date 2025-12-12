
import React, { useState, useEffect } from 'react';
import { Grid, Plus, Edit2, MapPin, Trash2, Save, X, Box } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { Warehouse, WarehouseLocation } from '../../types';

// --- WAREHOUSE MODAL ---
const WarehouseModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: Partial<Warehouse>) => void; 
    initialData: Warehouse | null; 
}) => {
    const [name, setName] = useState('');
    const [responsible, setResponsible] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setResponsible(initialData?.responsible || '');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{initialData ? 'Editar Almacén' : 'Nuevo Almacén'}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Almacén</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent outline-none"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Depósito Central"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Responsable</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent outline-none"
                            value={responsible}
                            onChange={e => setResponsible(e.target.value)}
                            placeholder="Nombre del encargado..."
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-lg text-sm">Cancelar</button>
                    <button 
                        onClick={() => onSave({ name, responsible })}
                        disabled={!name.trim()}
                        className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-sm disabled:opacity-50"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- LOCATION MODAL ---
const LocationModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData,
    warehouseName
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: Partial<WarehouseLocation>) => void; 
    initialData: WarehouseLocation | null; 
    warehouseName: string;
}) => {
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCode(initialData?.code || '');
            setDescription(initialData?.description || '');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{initialData ? 'Editar Ubicación' : 'Nueva Ubicación'}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 mb-2">
                        Almacén: <strong>{warehouseName}</strong>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Código (Identificador)</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent outline-none"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="Ej: A-01-01, RACK-B, ZONA-3..."
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent outline-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Detalle opcional..."
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-lg text-sm">Cancelar</button>
                    <button 
                        onClick={() => onSave({ code, description })}
                        disabled={!code.trim()}
                        className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-sm disabled:opacity-50"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export const WarehousesView = () => {
    const { warehouses, warehouseLocations, addWarehouse, updateWarehouse, addWarehouseLocation, updateWarehouseLocation } = useMasterData();
    const { showToast } = useUI();
    
    // State for List selection
    const [selectedWhId, setSelectedWhId] = useState<string | null>(null);

    // Modal States
    const [whModalOpen, setWhModalOpen] = useState(false);
    const [editingWh, setEditingWh] = useState<Warehouse | null>(null);

    const [locModalOpen, setLocModalOpen] = useState(false);
    const [editingLoc, setEditingLoc] = useState<WarehouseLocation | null>(null);

    // Auto-select first warehouse if none selected
    useEffect(() => {
        if (warehouses.length > 0 && !selectedWhId) {
            setSelectedWhId(warehouses[0].id);
        }
    }, [warehouses, selectedWhId]);

    // --- Handlers for Warehouse ---
    const openNewWhModal = () => {
        setEditingWh(null);
        setWhModalOpen(true);
    };

    const openEditWhModal = (e: React.MouseEvent, w: Warehouse) => {
        e.stopPropagation();
        setEditingWh(w);
        setWhModalOpen(true);
    };

    const handleSaveWh = async (data: Partial<Warehouse>) => {
        if (editingWh) {
            await updateWarehouse({ ...editingWh, ...data });
            showToast('Almacén actualizado');
        } else {
            const newId = `WH-${Date.now()}`;
            await addWarehouse({ id: newId, name: data.name!, responsible: data.responsible });
            setSelectedWhId(newId);
            showToast('Almacén creado');
        }
        setWhModalOpen(false);
    };

    // --- Handlers for Location ---
    const openNewLocModal = () => {
        if(!selectedWhId) return;
        setEditingLoc(null);
        setLocModalOpen(true);
    };

    const openEditLocModal = (l: WarehouseLocation) => {
        setEditingLoc(l);
        setLocModalOpen(true);
    };

    const handleSaveLoc = async (data: Partial<WarehouseLocation>) => {
        if (!selectedWhId) return;

        if (editingLoc) {
            await updateWarehouseLocation({ ...editingLoc, ...data });
            showToast('Ubicación actualizada');
        } else {
            await addWarehouseLocation({
                id: `LOC-${Date.now()}`,
                warehouseId: selectedWhId,
                code: data.code!,
                description: data.description
            });
            showToast('Ubicación agregada');
        }
        setLocModalOpen(false);
    };

    const selectedWh = warehouses.find(w => w.id === selectedWhId);
    const currentLocations = warehouseLocations.filter(l => l.warehouseId === selectedWhId);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <Grid className="mr-2 text-slate-500" size={20}/> Gestión de Almacenes y Ubicaciones
            </h3>
            
            {/* Flex Container: Column on Mobile, Row on Desktop */}
            <div className="flex flex-col md:flex-row flex-1 gap-6 overflow-hidden">
                
                {/* LEFT COLUMN: Warehouses List (On Top in Mobile, Fixed Height in Mobile) */}
                <div className="w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 md:h-full h-48">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h4 className="font-bold text-slate-700 text-sm uppercase">Almacenes</h4>
                        <button 
                            onClick={openNewWhModal} 
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            title="Nuevo Almacén"
                        >
                            <Plus size={18}/>
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <div className="space-y-2">
                            {warehouses.map(w => (
                                <div 
                                    key={w.id} 
                                    onClick={() => setSelectedWhId(w.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${
                                        selectedWhId === w.id 
                                        ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div>
                                        <div className="font-bold text-sm">{w.name}</div>
                                        <div className={`text-xs ${selectedWhId === w.id ? 'text-slate-400' : 'text-slate-400'}`}>Resp: {w.responsible || '-'}</div>
                                    </div>
                                    <button 
                                        onClick={(e) => openEditWhModal(e, w)}
                                        className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                                            selectedWhId === w.id 
                                            ? 'hover:bg-slate-700 text-slate-300' 
                                            : 'hover:bg-slate-200 text-slate-400'
                                        }`}
                                    >
                                        <Edit2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Locations Management */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden h-full">
                    {selectedWh ? (
                        <>
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shadow-sm z-10 shrink-0">
                                <div>
                                    <h4 className="font-bold text-slate-800 flex items-center">
                                        <MapPin size={18} className="mr-2 text-accent"/> 
                                        {selectedWh.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">Gestión de posiciones físicas.</p>
                                </div>
                                <button 
                                    onClick={openNewLocModal}
                                    className="bg-accent text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm hover:bg-accentHover transition-colors flex items-center"
                                >
                                    <Plus size={16} className="mr-1"/> <span className="hidden md:inline">Nueva Ubicación</span><span className="md:hidden">Nueva</span>
                                </button>
                            </div>

                            {/* Locations Table (LIST VIEW) */}
                            <div className="flex-1 overflow-auto p-0">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                                        <tr>
                                            <th className="p-4 w-1/3">Código</th>
                                            <th className="p-4 hidden md:table-cell">Descripción</th>
                                            <th className="p-4 text-right w-24">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {currentLocations.map(loc => (
                                            <tr key={loc.id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="p-4 font-mono font-bold text-slate-700">
                                                    {loc.code}
                                                    <div className="md:hidden text-xs font-normal text-slate-500 mt-1">{loc.description}</div>
                                                </td>
                                                <td className="p-4 text-slate-600 hidden md:table-cell">{loc.description || '-'}</td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => openEditLocModal(loc)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar Ubicación"
                                                    >
                                                        <Edit2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentLocations.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-12 text-center text-slate-400 italic flex flex-col items-center">
                                                    <Box size={32} className="mb-2 text-slate-300"/>
                                                    No hay ubicaciones definidas para este almacén.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Seleccione un almacén para gestionar sus ubicaciones.
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            <WarehouseModal 
                isOpen={whModalOpen} 
                onClose={() => setWhModalOpen(false)} 
                onSave={handleSaveWh} 
                initialData={editingWh} 
            />
            <LocationModal 
                isOpen={locModalOpen} 
                onClose={() => setLocModalOpen(false)} 
                onSave={handleSaveLoc} 
                initialData={editingLoc}
                warehouseName={selectedWh?.name || ''}
            />
        </div>
    );
};
