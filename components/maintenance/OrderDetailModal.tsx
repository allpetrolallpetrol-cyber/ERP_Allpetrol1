
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { MaintenanceOrder, MaintenanceStatus, MaintenanceType } from '../../types';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { 
    X, 
    Printer, 
    Wrench, 
    ArrowRight, 
    CheckCircle, 
    Plus, 
    Trash2, 
    Link as LinkIcon 
} from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

interface OrderDetailModalProps {
    order: MaintenanceOrder;
    allOrders?: MaintenanceOrder[]; // List needed to look up parent orders
    onClose: () => void;
    onUpdateOrder: (order: MaintenanceOrder) => void;
    readOnly?: boolean;
}

export const OrderDetailModal = ({ order, allOrders, onClose, onUpdateOrder, readOnly = false }: OrderDetailModalProps) => {
    const { materials, users, assets, checkAutomaticReplenishment } = useMasterData();
    const { showToast } = useUI();
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [materialQty, setMaterialQty] = useState(1);

    // Look up parent order number if exists
    const parentOrder = order.relatedOrderId && allOrders ? allOrders.find(o => o.id === order.relatedOrderId) : null;

    // --- PDF Generation ---
    const generatePDF = () => {
        const doc = new jsPDF();
        const asset = assets.find(a => a.id === order.assetId);
        const technician = users.find(u => u.id === order.technician);

        // Header
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("ORDEN DE TRABAJO", 105, 20, { align: "center" });
        doc.setFontSize(10);
        doc.text("ArgERP Mantenimiento", 105, 30, { align: "center" });

        // Order Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Nro: ${order.number}`, 15, 55);
        doc.text(`Estado: ${order.status}`, 150, 55);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Fecha Reporte: ${order.reportedDate}`, 15, 62);
        doc.text(`Fecha Planificada: ${order.plannedDate || 'Sin fecha'}`, 15, 68);
        doc.text(`Prioridad: ${order.priority}`, 150, 62);
        doc.text(`Tipo: ${order.type}`, 150, 68);
        
        if(parentOrder) {
             doc.setTextColor(100);
             doc.text(`Vinculada a PM: ${parentOrder.number}`, 15, 74);
             doc.setTextColor(0);
        }

        // Asset Section
        doc.setFillColor(241, 245, 249); // Slate 100
        doc.rect(15, 80, 180, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL ACTIVO", 20, 85);
        
        doc.setFont("helvetica", "normal");
        doc.text(`Código: ${asset?.code || order.assetId}`, 20, 95);
        doc.text(`Equipo: ${asset?.name || 'No identificado'}`, 80, 95);
        doc.text(`Ubicación: ${asset?.location || 'N/A'}`, 150, 95);

        // Description Section
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 105, 180, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("DESCRIPCIÓN DE LA TAREA", 20, 110);
        
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(order.description, 170);
        doc.text(splitDesc, 20, 120);

        let currentY = 120 + (splitDesc.length * 5) + 10;

        // Resources Section
        doc.setFillColor(241, 245, 249);
        doc.rect(15, currentY, 180, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("RECURSOS Y MATERIALES", 20, currentY + 5);
        currentY += 15;

        doc.setFont("helvetica", "normal");
        doc.text(`Técnico Asignado: ${technician?.name || 'Sin asignar'}`, 20, currentY);
        currentY += 8;

        if (order.assignedMaterials && order.assignedMaterials.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Materiales Requeridos:", 20, currentY);
            currentY += 6;
            doc.setFont("helvetica", "normal");
            order.assignedMaterials.forEach(m => {
                const matInfo = materials.find(mat => mat.id === m.materialId);
                doc.text(`- ${matInfo?.description || m.materialId} (Cant: ${m.quantity})`, 25, currentY);
                currentY += 5;
            });
        } else {
            doc.text("No se han cargado materiales.", 20, currentY);
            currentY += 5;
        }

        // Footer Signatures
        currentY = 250;
        doc.setLineWidth(0.5);
        doc.line(20, currentY, 80, currentY);
        doc.line(130, currentY, 190, currentY);
        doc.setFontSize(8);
        doc.text("Firma Técnico / Responsable", 50, currentY + 5, { align: "center" });
        doc.text("Firma Supervisor / Cierre", 160, currentY + 5, { align: "center" });

        // Save
        doc.save(`OT-${order.number}.pdf`);
    };

    const handleAddMaterial = async () => {
        if (!selectedMaterialId) return;
        
        const existingIdx = order.assignedMaterials.findIndex(m => m.materialId === selectedMaterialId);
        let newMaterials;

        if (existingIdx >= 0) {
            newMaterials = [...order.assignedMaterials];
            newMaterials[existingIdx].quantity += materialQty;
        } else {
            newMaterials = [...order.assignedMaterials, { materialId: selectedMaterialId, quantity: materialQty }];
        }

        const updatedOrder = { ...order, assignedMaterials: newMaterials };
        
        // 1. Update Order
        onUpdateOrder(updatedOrder);
        
        // 2. Trigger Auto-Replenishment Check (Async)
        // We pass ALL assigned material IDs to check, in case adding this one triggers the limit
        const messages = await checkAutomaticReplenishment([selectedMaterialId]);
        if (messages.length > 0) {
            messages.forEach(msg => showToast(msg, 'info'));
        }

        setSelectedMaterialId('');
        setMaterialQty(1);
    };

    const handleRemoveMaterial = (idx: number) => {
        const newMaterials = [...order.assignedMaterials];
        newMaterials.splice(idx, 1);
        const updatedOrder = { ...order, assignedMaterials: newMaterials };
        onUpdateOrder(updatedOrder);
    };

    const handleFieldChange = (field: keyof MaintenanceOrder, value: any) => {
        const updatedOrder = { ...order, [field]: value };
        onUpdateOrder(updatedOrder);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center">
                            {order.number} 
                            <span className="ml-3 text-sm font-normal bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{order.status}</span>
                        </h3>
                        <div className="flex items-center text-sm text-slate-500 mt-1 space-x-3">
                            <span>{order.type}</span>
                            <span>•</span>
                            <span>{order.priority}</span>
                            {parentOrder && (
                                <span className="flex items-center text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-semibold shadow-sm animate-pulse">
                                    <LinkIcon size={12} className="mr-1"/> Vinculada a PM: {parentOrder.number}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={generatePDF} className="text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-200 rounded-full" title="Imprimir Orden">
                            <Printer size={20}/>
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-200 rounded-full">
                            <X size={24}/>
                        </button>
                    </div>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Top Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Activo</p>
                            <div className="font-semibold text-slate-800 flex items-center">
                                <Wrench size={16} className="mr-2 text-slate-400"/> 
                                {assets.find(a => a.id === order.assetId)?.name || order.assetId}
                            </div>
                            <p className="text-xs text-slate-400 ml-6">{assets.find(a => a.id === order.assetId)?.code}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Planificación</p>
                            <div className="text-sm text-slate-700 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>Fecha Ejecución:</span>
                                    {!readOnly && order.status !== MaintenanceStatus.CLOSED ? (
                                        <input 
                                            type="date" 
                                            className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white focus:ring-2 focus:ring-accent outline-none"
                                            value={order.plannedDate || ''}
                                            onChange={(e) => handleFieldChange('plannedDate', e.target.value)}
                                        />
                                    ) : (
                                        <b>{order.plannedDate || 'N/A'}</b>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Técnico:</span>
                                    {!readOnly && order.status !== MaintenanceStatus.CLOSED ? (
                                        <select 
                                            className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white max-w-[120px] focus:ring-2 focus:ring-accent outline-none"
                                            value={order.technician || ''}
                                            onChange={(e) => handleFieldChange('technician', e.target.value)}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <b>{users.find(u => u.id === order.technician)?.name || 'N/A'}</b>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción del Trabajo</label>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap">
                            {order.description}
                        </div>
                    </div>

                    {/* Materials Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-slate-700">Materiales y Repuestos</label>
                            {!readOnly && order.status !== MaintenanceStatus.CLOSED && (
                                <div className="flex space-x-2">
                                    <select 
                                        className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white w-48 focus:ring-1 focus:ring-accent outline-none"
                                        value={selectedMaterialId}
                                        onChange={(e) => setSelectedMaterialId(e.target.value)}
                                    >
                                        <option value="">Buscar material...</option>
                                        {materials.map(m => (
                                            <option key={m.id} value={m.id}>{m.code} - {m.description}</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white w-16 text-center focus:ring-1 focus:ring-accent outline-none"
                                        value={materialQty}
                                        onChange={(e) => setMaterialQty(parseInt(e.target.value))}
                                        min="1"
                                    />
                                    <button 
                                        onClick={handleAddMaterial}
                                        disabled={!selectedMaterialId}
                                        className="bg-slate-800 text-white p-1 rounded-lg hover:bg-slate-700 disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2">Material</th>
                                        <th className="px-3 py-2 text-center">Cant.</th>
                                        {!readOnly && order.status !== MaintenanceStatus.CLOSED && <th className="px-3 py-2 w-10"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {order.assignedMaterials?.map((m, idx) => {
                                        const matInfo = materials.find(mat => mat.id === m.materialId);
                                        return (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 text-slate-700">{matInfo?.description || m.materialId}</td>
                                                <td className="px-3 py-2 text-center">{m.quantity} {matInfo?.unitOfMeasure || 'u'}</td>
                                                {!readOnly && order.status !== MaintenanceStatus.CLOSED && (
                                                    <td className="px-3 py-2 text-center">
                                                        <button onClick={() => handleRemoveMaterial(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {(!order.assignedMaterials || order.assignedMaterials.length === 0) && (
                                        <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-400 text-xs italic">No hay materiales asignados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions - Hidden in ReadOnly Mode */}
                {!readOnly && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end space-x-3">
                        {order.status !== MaintenanceStatus.CLOSED && (
                            <>
                                <button 
                                    onClick={() => {
                                        const next = order.status === MaintenanceStatus.PENDING ? MaintenanceStatus.PLANNED : MaintenanceStatus.IN_PROGRESS;
                                        onUpdateOrder({...order, status: next});
                                        onClose();
                                    }}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center transition-colors"
                                >
                                    Avanzar a {order.status === MaintenanceStatus.PENDING ? 'Planificado' : 'En Curso'} <ArrowRight size={16} className="ml-2"/>
                                </button>
                            </>
                        )}
                        
                        {order.status === MaintenanceStatus.IN_PROGRESS && (
                            <button 
                                onClick={() => {
                                    onUpdateOrder({...order, status: MaintenanceStatus.CLOSED, closedDate: TODAY});
                                    onClose();
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center shadow-md transition-colors"
                            >
                                <CheckCircle size={16} className="mr-2"/> Cerrar Orden
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
