
import React, { useState, useMemo } from 'react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { MaintenanceOrder, MaintenanceType, MaintenanceStatus } from '../../types';
import { Siren, AlertTriangle, Clock, Link as LinkIcon, ArrowRight } from 'lucide-react';

export const WorkRequestForm = ({ existingOrders, onSave, onCancel, initialData }: { existingOrders: MaintenanceOrder[], onSave: (o: MaintenanceOrder) => void, onCancel: () => void, initialData?: { assetId: string, description: string } }) => {
    const { assets } = useMasterData();
    const [assetId, setAssetId] = useState(initialData?.assetId || '');
    const [desc, setDesc] = useState(initialData?.description || '');
    const [priority, setPriority] = useState('Medium');
    
    // Origin Logic
    const [originType, setOriginType] = useState<'INDEPENDENT' | 'DERIVED'>('INDEPENDENT');
    const [parentOrderId, setParentOrderId] = useState('');

    const openOrdersForAsset = useMemo(() => {
        if (!assetId) return [];
        return existingOrders.filter(o => o.assetId === assetId && o.status !== MaintenanceStatus.CLOSED);
    }, [assetId, existingOrders]);

    // Filter active Preventive orders to link to
    const activePreventiveOrders = useMemo(() => {
        return existingOrders.filter(o => 
            o.type === MaintenanceType.PREVENTIVE && 
            o.status !== MaintenanceStatus.CLOSED
        );
    }, [existingOrders]);

    const handleSubmit = () => {
        if(!assetId || !desc) return alert("Complete los campos obligatorios");
        if(originType === 'DERIVED' && !parentOrderId) return alert("Debe seleccionar la Orden Preventiva de origen.");

        const order: MaintenanceOrder = {
            id: `REQ-${Date.now()}`,
            number: `AVISO-${Math.floor(Math.random()*1000)}`,
            assetId,
            description: desc,
            type: MaintenanceType.CORRECTIVE,
            status: MaintenanceStatus.PENDING,
            priority: priority as any,
            reportedDate: new Date().toISOString().split('T')[0],
            assignedMaterials: [],
            origin: 'MANUAL',
            relatedOrderId: originType === 'DERIVED' ? parentOrderId : undefined
        };
        onSave(order);
        
        // Reset form to stay on screen
        if(!initialData) {
            setAssetId('');
            setDesc('');
            setOriginType('INDEPENDENT');
            setParentOrderId('');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 max-w-2xl mx-auto shadow-sm animate-in zoom-in-95 flex flex-col" style={{ height: 'calc(100vh - 150px)' }}>
            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl shrink-0">
                <h3 className="text-xl font-bold text-slate-800 flex items-center"><Siren className="mr-2 text-rose-500"/> Nuevo Aviso de Avería</h3>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                
                {/* 1. Origin Selection */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-3">Origen del Aviso</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${originType === 'INDEPENDENT' ? 'bg-white border-rose-500 shadow-sm text-rose-700' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-white hover:border-slate-300'}`}>
                            <input type="radio" name="origin" className="hidden" checked={originType === 'INDEPENDENT'} onChange={() => setOriginType('INDEPENDENT')} />
                            <div className="flex flex-col items-center">
                                <AlertTriangle size={20} className="mb-1"/>
                                <span className="text-xs font-bold">Falla Imprevista</span>
                            </div>
                        </label>
                        <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${originType === 'DERIVED' ? 'bg-white border-blue-500 shadow-sm text-blue-700' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-white hover:border-slate-300'}`}>
                            <input type="radio" name="origin" className="hidden" checked={originType === 'DERIVED'} onChange={() => setOriginType('DERIVED')} />
                            <div className="flex flex-col items-center">
                                <LinkIcon size={20} className="mb-1"/>
                                <span className="text-xs font-bold">Hallazgo en Preventivo</span>
                            </div>
                        </label>
                    </div>

                    {originType === 'DERIVED' && (
                        <div className="mt-4 animate-in fade-in">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Vincular a Orden Preventiva (En Curso)</label>
                            <select 
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                value={parentOrderId}
                                onChange={(e) => {
                                    setParentOrderId(e.target.value);
                                    // Auto-select asset if parent selected
                                    const parent = activePreventiveOrders.find(o => o.id === e.target.value);
                                    if(parent) setAssetId(parent.assetId);
                                }}
                            >
                                <option value="">Seleccione la orden PM...</option>
                                {activePreventiveOrders.map(o => (
                                    <option key={o.id} value={o.id}>
                                        {o.number} - {o.assetId} ({o.description.substring(0, 30)}...)
                                    </option>
                                ))}
                            </select>
                            {activePreventiveOrders.length === 0 && <p className="text-xs text-red-500 mt-1">No hay órdenes preventivas activas para vincular.</p>}
                        </div>
                    )}
                </div>

                {/* 2. Asset Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Activo Afectado</label>
                    <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100" 
                        value={assetId} 
                        onChange={e => setAssetId(e.target.value)}
                        disabled={originType === 'DERIVED' && !!parentOrderId} // Locked if derived from parent
                    >
                        <option value="">Seleccionar Equipo...</option>
                        {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                    </select>
                </div>

                {/* Warning for open orders */}
                {openOrdersForAsset.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 animate-in fade-in">
                        <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} />
                            Atención: Este activo ya tiene órdenes abiertas
                        </h4>
                        <div className="max-h-32 overflow-y-auto custom-scrollbar">
                            <ul className="space-y-2">
                                {openOrdersForAsset.map(o => (
                                    <li key={o.id} className="text-xs text-orange-700 bg-white p-2 rounded border border-orange-100 shadow-sm">
                                        <div className="flex justify-between font-bold mb-1">
                                            <span>{o.number}</span>
                                            <span className="bg-orange-100 px-1.5 rounded">{o.status}</span>
                                        </div>
                                        <p className="line-clamp-2">{o.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* 3. Details */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de la Falla</label>
                    <textarea 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white h-32 focus:ring-2 focus:ring-accent outline-none resize-none" 
                        placeholder="Describa el problema, ruidos, códigos de error, etc."
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad Percibida</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={priority} onChange={e => setPriority(e.target.value)}>
                        <option value="Low">Baja (Puede esperar)</option>
                        <option value="Medium">Media (Afecta producción parcial)</option>
                        <option value="High">Alta (Máquina parada / Seguridad)</option>
                    </select>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl shrink-0 z-10 relative">
                <button onClick={onCancel} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button onClick={handleSubmit} className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-md flex items-center">
                    Generar Aviso <ArrowRight size={16} className="ml-2"/>
                </button>
            </div>
        </div>
    );
};
