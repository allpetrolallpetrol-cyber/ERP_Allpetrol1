import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Calendar as CalendarIcon, 
  LayoutList, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MoreVertical,
  Printer
} from 'lucide-react';
import { MaintenanceStatus, MaintenanceOrder, MaintenanceType } from '../types';

// Mock Data
const INITIAL_ORDERS: MaintenanceOrder[] = [
  { id: '1', number: 'OT-2023-001', assetId: 'MAQ-001', description: 'Ruido en rulemanes', type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.PENDING, priority: 'High', reportedDate: '2023-10-25', assignedMaterials: [] },
  { id: '2', number: 'OT-2023-002', assetId: 'AA-123-BB', description: 'Cambio de aceite y filtros', type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.PLANNED, priority: 'Medium', reportedDate: '2023-10-26', plannedDate: '2023-10-30', assignedMaterials: [{materialId: 'MAT-OIL', quantity: 2}] },
  { id: '3', number: 'OT-2023-003', assetId: 'MAQ-004', description: 'Ajuste de bancada', type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.IN_PROGRESS, priority: 'Low', reportedDate: '2023-10-27', assignedMaterials: [] },
  { id: '4', number: 'OT-2023-004', assetId: 'MAQ-002', description: 'Revisión mensual eléctrica', type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.CLOSED, priority: 'Medium', reportedDate: '2023-10-20', assignedMaterials: [] },
];

export default function Maintenance() {
  const [viewMode, setViewMode] = useState<'KANBAN' | 'GRID'>('KANBAN');
  const [orders, setOrders] = useState<MaintenanceOrder[]>(INITIAL_ORDERS);
  const [showClosedHistory, setShowClosedHistory] = useState(false);

  // Generate PDF for an order
  const generatePDF = (order: MaintenanceOrder) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`Orden de Mantenimiento: ${order.number}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Activo: ${order.assetId}`, 14, 40);
    doc.text(`Tipo: ${order.type}`, 14, 50);
    doc.text(`Prioridad: ${order.priority}`, 14, 60);
    doc.text(`Estado: ${order.status}`, 14, 70);
    
    doc.text(`Descripción:`, 14, 90);
    doc.setFontSize(10);
    doc.text(order.description, 14, 98, { maxWidth: 180 });

    doc.setFontSize(12);
    doc.text(`Materiales Asignados:`, 14, 120);
    if(order.assignedMaterials.length > 0) {
        order.assignedMaterials.forEach((mat, idx) => {
            doc.text(`- Item ID: ${mat.materialId} (Cant: ${mat.quantity})`, 20, 130 + (idx * 10));
        })
    } else {
        doc.text(`- Sin materiales asignados`, 20, 130);
    }
    
    doc.save(`${order.number}.pdf`);
  };

  const KanbanColumn = ({ status, color }: { status: MaintenanceStatus, color: string }) => {
    // Filter orders by status
    const columnOrders = orders.filter(o => o.status === status);
    // If closed, check history toggle
    const visibleOrders = status === MaintenanceStatus.CLOSED && !showClosedHistory
      ? columnOrders.filter(o => o.reportedDate === new Date().toISOString().split('T')[0]) // Simplified "Today" check
      : columnOrders;

    return (
      <div className="flex-1 min-w-[300px] bg-slate-100 rounded-xl flex flex-col h-full max-h-full">
        <div className={`p-4 rounded-t-xl border-b border-slate-200 flex justify-between items-center ${color} bg-opacity-10`}>
          <h3 className={`font-bold ${color.replace('bg-', 'text-')}`}>{status}</h3>
          <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">{visibleOrders.length}</span>
        </div>
        <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {visibleOrders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  order.priority === 'High' ? 'bg-red-100 text-red-700' : 
                  order.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.priority}
                </span>
                <span className="text-xs text-slate-400">{order.number}</span>
              </div>
              <h4 className="font-medium text-slate-800 mb-1">{order.assetId}</h4>
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{order.description}</p>
              
              <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                 <div className="text-xs text-slate-400 flex items-center">
                    <Clock size={12} className="mr-1" /> {order.reportedDate}
                 </div>
                 <div className="flex space-x-1">
                    <button 
                      onClick={() => generatePDF(order)}
                      title="Imprimir Orden"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                    >
                        <Printer size={16} />
                    </button>
                    {/* Mock move buttons */}
                    {status !== MaintenanceStatus.CLOSED && (
                        <button className="p-1.5 text-accent hover:bg-blue-50 rounded" title="Avanzar estado">
                            <CheckCircle size={16} />
                        </button>
                    )}
                 </div>
              </div>
            </div>
          ))}
          {visibleOrders.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm italic">
              Sin órdenes
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-200 p-1 rounded-lg flex">
            <button 
              onClick={() => setViewMode('KANBAN')}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'KANBAN' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <LayoutList size={16} className="mr-2"/> Tablero Kanban
            </button>
            <button 
              onClick={() => setViewMode('GRID')}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <CalendarIcon size={16} className="mr-2"/> Planificación Semanal
            </button>
          </div>
          
          <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showClosedHistory} 
              onChange={(e) => setShowClosedHistory(e.target.checked)} 
              className="rounded text-accent focus:ring-accent"
            />
            <span>Ver historial de cerrados</span>
          </label>
        </div>

        <button className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md">
          <Plus size={18} className="mr-2"/> Crear Aviso / Orden
        </button>
      </div>

      {/* Content */}
      {viewMode === 'KANBAN' ? (
        <div className="flex-1 flex overflow-x-auto space-x-4 pb-4">
          <KanbanColumn status={MaintenanceStatus.PENDING} color="bg-red-500" />
          <KanbanColumn status={MaintenanceStatus.PLANNED} color="bg-orange-500" />
          <KanbanColumn status={MaintenanceStatus.IN_PROGRESS} color="bg-blue-500" />
          <KanbanColumn status={MaintenanceStatus.CLOSED} color="bg-green-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 p-6">
          <h3 className="text-lg font-bold mb-4">Planificación Semanal (Grid View)</h3>
          <p className="text-slate-500">Aquí se mostraría una grilla tipo Gantt o Calendario semanal.</p>
          {/* Placeholder for complex Gantt/Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 mt-4 border border-slate-200 rounded-lg overflow-hidden">
             {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                 <div key={d} className="bg-slate-50 p-2 text-center text-sm font-bold text-slate-700">{d}</div>
             ))}
             {Array.from({length: 35}).map((_, i) => (
                 <div key={i} className="bg-white h-24 p-2 hover:bg-slate-50 transition-colors">
                     {i === 3 && <div className="bg-orange-100 text-orange-800 text-xs p-1 rounded border border-orange-200">OT-002 Prev.</div>}
                 </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}