
import React, { useState, useMemo } from 'react';
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
  Printer,
  Wrench, 
  ClipboardCheck,
  FileWarning,
  ArrowRight,
  Search,
  Truck,
  Cog,
  Save,
  X,
  Info,
  CalendarDays,
  PlayCircle,
  BarChart3,
  Filter,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Kanban,
  Siren,
  LayoutDashboard,
  ClipboardList,
  Activity,
  User,
  Trash2,
  History,
  Archive
} from 'lucide-react';
import { useMasterData } from '../contexts/MasterDataContext';
import { MaintenanceStatus, MaintenanceOrder, MaintenanceType, AssetType } from '../types';

// Mock Data (Updated dates for demo purposes)
const TODAY = new Date().toISOString().split('T')[0];
const INITIAL_ORDERS: MaintenanceOrder[] = [
  { id: '1', number: 'OT-2023-001', assetId: 'MAQ-001', description: 'Ruido en rulemanes', type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.PENDING, priority: 'High', reportedDate: '2023-10-25', assignedMaterials: [], origin: 'MANUAL' },
  { id: '2', number: 'OT-2023-002', assetId: 'AA-123-BB', description: 'Cambio de aceite y filtros', type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.PLANNED, priority: 'Medium', reportedDate: '2023-10-26', plannedDate: TODAY, assignedMaterials: [{materialId: 'MAT-OIL', quantity: 2}], origin: 'ROUTINE' },
  { id: '3', number: 'OT-2023-003', assetId: 'MAQ-004', description: 'Ajuste de bancada', type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.IN_PROGRESS, priority: 'Low', reportedDate: '2023-10-27', assignedMaterials: [], origin: 'MANUAL' },
  { id: '4', number: 'OT-2023-004', assetId: 'MAQ-002', description: 'Revisión mensual eléctrica', type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.CLOSED, priority: 'Medium', reportedDate: '2023-10-20', closedDate: '2023-10-21', assignedMaterials: [], origin: 'ROUTINE' },
];

// --- Sub Components ---

const PMPlanner = ({ onGenerateOrders, onCancel }: { onGenerateOrders: (newOrders: MaintenanceOrder[]) => void, onCancel: () => void }) => {
    const { routines, assets } = useMasterData();
    const [horizonDays, setHorizonDays] = useState(30);
    const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);

    const plannedRoutines = useMemo(() => {
        const today = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(today.getDate() + horizonDays);

        return routines.map(r => {
            const lastDate = new Date(r.lastExecutionDate);
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + r.frequencyDays);
            
            const asset = assets.find(a => a.id === r.assetId);

            return {
                ...r,
                assetName: asset?.name || r.assetId,
                nextDate: nextDate,
                isDue: nextDate <= cutoffDate
            };
        }).filter(r => r.isDue).sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
    }, [routines, assets, horizonDays]);

    const toggleRoutine = (id: string) => {
        if (selectedRoutineIds.includes(id)) {
            setSelectedRoutineIds(selectedRoutineIds.filter(r => r !== id));
        } else {
            setSelectedRoutineIds([...selectedRoutineIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedRoutineIds.length === plannedRoutines.length) {
            setSelectedRoutineIds([]);
        } else {
            setSelectedRoutineIds(plannedRoutines.map(r => r.id));
        }
    };

    const handleGenerate = () => {
        if (selectedRoutineIds.length === 0) return;

        const newOrders: MaintenanceOrder[] = selectedRoutineIds.map(rid => {
            const routine = plannedRoutines.find(r => r.id === rid)!;
            return {
                id: `PM-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                number: `OT-PM-${Math.floor(Math.random() * 10000)}`,
                assetId: routine.assetId,
                description: `[PREVENTIVO] ${routine.name}\nDisciplina: ${routine.discipline}\nHoras Est.: ${routine.estimatedHours}`,
                type: MaintenanceType.PREVENTIVE,
                status: MaintenanceStatus.PLANNED,
                priority: 'Medium',
                reportedDate: new Date().toISOString().split('T')[0],
                plannedDate: routine.nextDate.toISOString().split('T')[0],
                assignedMaterials: [],
                origin: 'ROUTINE',
                routineId: routine.id
            };
        });

        onGenerateOrders(newOrders);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 animate-in fade-in slide-in-from-bottom-4">
            {/* Header Horizontal Full Width */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg text-accent mr-3">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Planificador de Mantenimiento</h2>
                        <p className="text-sm text-slate-500">Generación masiva de preventivos</p>
                    </div>
                </div>

                {/* Configuration Bar */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 pl-2">
                        <span className="text-sm font-semibold text-slate-600">Horizonte:</span>
                        <input 
                            type="number" 
                            value={horizonDays} 
                            onChange={(e) => setHorizonDays(parseInt(e.target.value) || 30)}
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-sm focus:ring-2 focus:ring-accent outline-none bg-white"
                        />
                        <span className="text-xs text-slate-500 mr-2">días</span>
                    </div>

                    <div className="h-6 w-px bg-slate-300 hidden md:block"></div>

                    <div className="flex items-center gap-2 text-sm text-slate-600 px-2">
                        <span>Sugeridas:</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-xs">{plannedRoutines.length}</span>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={selectedRoutineIds.length === 0}
                        className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center ${
                            selectedRoutineIds.length > 0 
                            ? 'bg-accent text-white hover:bg-blue-600 shadow-md transform hover:-translate-y-0.5' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <PlayCircle size={16} className="mr-2" /> Generar ({selectedRoutineIds.length})
                    </button>
                </div>
            </div>

            {/* Main Table Area (Full Width) */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                    {/* Table Header Wrapper */}
                    <div className="overflow-auto custom-scrollbar flex-1">
                        <table className="w-full text-left text-sm relative border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center bg-slate-50">
                                        <input type="checkbox" checked={selectedRoutineIds.length === plannedRoutines.length && plannedRoutines.length > 0} onChange={handleSelectAll} className="rounded text-accent focus:ring-accent w-4 h-4"/>
                                    </th>
                                    <th className="px-6 py-4 bg-slate-50">Activo</th>
                                    <th className="px-6 py-4 bg-slate-50">Rutina / Tarea</th>
                                    <th className="px-6 py-4 bg-slate-50">Disciplina</th>
                                    <th className="px-6 py-4 bg-slate-50 text-center">Última Ejec.</th>
                                    <th className="px-6 py-4 bg-slate-50 text-center">Próx. Vencimiento</th>
                                    <th className="px-6 py-4 bg-slate-50 text-center">Frecuencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {plannedRoutines.length > 0 ? (
                                    plannedRoutines.map(routine => (
                                        <tr key={routine.id} className={`hover:bg-slate-50 transition-colors ${selectedRoutineIds.includes(routine.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                 <input 
                                                    type="checkbox" 
                                                    checked={selectedRoutineIds.includes(routine.id)} 
                                                    onChange={() => toggleRoutine(routine.id)}
                                                    className="rounded text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{routine.assetName}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{routine.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                                                    routine.discipline === 'Mecánica' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    routine.discipline === 'Eléctrica' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>{routine.discipline}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-center">{routine.lastExecutionDate}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">
                                                    {routine.nextDate.toISOString().split('T')[0]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-500">{routine.frequencyDays} días</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="h-64 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <CheckCircle size={48} className="mb-4 text-green-200" />
                                                <p>¡Todo al día! No hay rutinas que venzan en los próximos {horizonDays} días.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MaintenanceManagement = ({ orders, onUpdateOrder }: { orders: MaintenanceOrder[], onUpdateOrder: (order: MaintenanceOrder) => void }) => {
  const { materials } = useMasterData();
  const [viewMode, setViewMode] = useState<'KANBAN' | 'GRID' | 'HISTORY'>('KANBAN');
  const [showClosedHistory, setShowClosedHistory] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'CORRECTIVE' | 'PREVENTIVE'>('ALL');
  
  // Reschedule Modal State
  const [rescheduleOrder, setRescheduleOrder] = useState<MaintenanceOrder | null>(null);
  const [newDate, setNewDate] = useState('');

  // Details Modal State
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<MaintenanceOrder | null>(null);
  
  // Material Add State
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState('');
  const [qtyMat, setQtyMat] = useState(1);

  // Weekly Grid State (Starts on Monday)
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    return monday;
  });

  // KPI Calculations
  const activeOrders = orders.filter(o => o.status !== MaintenanceStatus.CLOSED);
  const closedOrders = orders.filter(o => o.status === MaintenanceStatus.CLOSED);
  const correctiveCount = activeOrders.filter(o => o.type === MaintenanceType.CORRECTIVE).length;
  const preventiveCount = activeOrders.filter(o => o.type === MaintenanceType.PREVENTIVE).length;
  const totalActive = activeOrders.length;
  const preventivePct = totalActive > 0 ? Math.round((preventiveCount / totalActive) * 100) : 0;

  // Filter Logic
  const filteredOrders = orders.filter(o => {
      if (filterType === 'ALL') return true;
      return o.type === (filterType === 'CORRECTIVE' ? MaintenanceType.CORRECTIVE : MaintenanceType.PREVENTIVE);
  });

  const generatePDF = (order: MaintenanceOrder) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Header Background
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 30, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEN DE MANTENIMIENTO', margin, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ArgERP System v1.0', pageWidth - margin - 30, 18);

    // Order Number Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(0, 0, 0);

    // Top Info Section
    const topY = 40;
    
    // Left Column
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Orden #: ${order.number}`, margin, topY);
    
    // Removed Status display as requested
    
    // Separator
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, topY + 5, pageWidth - margin, topY + 5);

    // Details Grid
    const detailsY = topY + 15;
    const col2X = 110;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Activo / Equipo:', margin, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.assetId, margin, detailsY + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Tipo de Mantenimiento:', margin, detailsY + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(order.type, margin, detailsY + 22);

    doc.setFont('helvetica', 'bold');
    doc.text('Prioridad:', margin, detailsY + 32);
    doc.setFont('helvetica', 'normal');
    doc.text(order.priority, margin, detailsY + 38);

    // Column 2
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha Reporte:', col2X, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.reportedDate, col2X, detailsY + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha Planificada:', col2X, detailsY + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(order.plannedDate || 'N/A', col2X, detailsY + 22);

    doc.setFont('helvetica', 'bold');
    doc.text('Técnico Asignado:', col2X, detailsY + 32);
    doc.setFont('helvetica', 'normal');
    doc.text(order.technician || 'Sin Asignar', col2X, detailsY + 38);

    // Description Section
    const descY = detailsY + 50;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, descY, pageWidth - (margin * 2), 35, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Descripción del Trabajo:', margin + 4, descY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const splitDesc = doc.splitTextToSize(order.description, pageWidth - (margin * 2) - 8);
    doc.text(splitDesc, margin + 4, descY + 16);

    // Materials Table
    const matY = descY + 45;
    doc.setFont('helvetica', 'bold');
    doc.text('Materiales y Repuestos:', margin, matY);

    // Table Header
    const tableHeadY = matY + 5;
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, tableHeadY, pageWidth - (margin * 2), 8, 'F');
    doc.setFontSize(9);
    doc.text('ID Material', margin + 2, tableHeadY + 5);
    doc.text('Descripción', margin + 50, tableHeadY + 5);
    doc.text('Cantidad', pageWidth - margin - 20, tableHeadY + 5, { align: 'right' });

    // Table Rows
    let currentRowY = tableHeadY + 14;
    if (order.assignedMaterials && order.assignedMaterials.length > 0) {
        order.assignedMaterials.forEach(mat => {
             // Mock lookup for description since we have ID only in order type context here strictly
             // Real implementation would look up in master data map passed or use ID.
             doc.setFont('helvetica', 'normal');
             doc.text(mat.materialId, margin + 2, currentRowY);
             doc.text('Material / Repuesto', margin + 50, currentRowY);
             doc.text(mat.quantity.toString(), pageWidth - margin - 20, currentRowY, { align: 'right' });
             doc.setDrawColor(230, 230, 230);
             doc.line(margin, currentRowY + 2, pageWidth - margin, currentRowY + 2);
             currentRowY += 8;
        });
    } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('No hay materiales asignados a esta orden.', margin + 2, currentRowY);
        currentRowY += 10;
    }

    // Signatures Area
    const signY = pageHeight - 40;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin + 20, signY, margin + 80, signY);
    doc.line(pageWidth - 80, signY, pageWidth - 20, signY);

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Firma Responsable', margin + 30, signY + 5);
    doc.text('Firma Técnico', pageWidth - 70, signY + 5);

    doc.save(`${order.number}.pdf`);
  };

  const handleRescheduleSave = () => {
    if (rescheduleOrder && newDate) {
        const updated = { ...rescheduleOrder, plannedDate: newDate, status: MaintenanceStatus.PLANNED };
        onUpdateOrder(updated);
        setRescheduleOrder(null);
        setNewDate('');
    }
  };

  const handleAddMaterial = () => {
    if (!selectedOrderDetails || !selectedMatId) return;

    const newMaterial = {
        materialId: selectedMatId,
        quantity: qtyMat
    };

    const updatedMaterials = [...(selectedOrderDetails.assignedMaterials || []), newMaterial];
    const updatedOrder = { ...selectedOrderDetails, assignedMaterials: updatedMaterials };

    onUpdateOrder(updatedOrder);
    setSelectedOrderDetails(updatedOrder);
    
    // Reset add form
    setIsAddingMaterial(false);
    setSelectedMatId('');
    setQtyMat(1);
  };

  const handleRemoveMaterial = (index: number) => {
    if (!selectedOrderDetails) return;
    const updatedMaterials = [...(selectedOrderDetails.assignedMaterials || [])];
    updatedMaterials.splice(index, 1);
    const updatedOrder = { ...selectedOrderDetails, assignedMaterials: updatedMaterials };
    
    onUpdateOrder(updatedOrder);
    setSelectedOrderDetails(updatedOrder);
  };

  const handleAdvanceStatus = (e: React.MouseEvent, order: MaintenanceOrder) => {
      e.stopPropagation(); // Prevent opening modal
      let nextStatus: MaintenanceStatus | null = null;
      let updates: Partial<MaintenanceOrder> = {};

      if (order.status === MaintenanceStatus.PENDING) {
          nextStatus = MaintenanceStatus.PLANNED;
          // If no planned date, set today
          if(!order.plannedDate) updates.plannedDate = new Date().toISOString().split('T')[0];
      } else if (order.status === MaintenanceStatus.PLANNED) {
          nextStatus = MaintenanceStatus.IN_PROGRESS;
      } else if (order.status === MaintenanceStatus.IN_PROGRESS) {
          nextStatus = MaintenanceStatus.CLOSED;
          updates.closedDate = new Date().toISOString().split('T')[0]; // Mark as closed today
      }

      if (nextStatus) {
          onUpdateOrder({ ...order, status: nextStatus, ...updates });
      }
  };

  const KanbanColumn = ({ status, color }: { status: MaintenanceStatus, color: string }) => {
    const columnOrders = filteredOrders.filter(o => o.status === status);
    
    // Logic: 
    // If status is CLOSED, only show orders where closedDate is TODAY.
    // Older closed orders go to history.
    const visibleOrders = status === MaintenanceStatus.CLOSED
        ? columnOrders.filter(o => o.closedDate === new Date().toISOString().split('T')[0])
        : columnOrders;

    return (
      <div className="min-w-[320px] w-[320px] bg-slate-100 rounded-xl flex flex-col h-full max-h-full flex-shrink-0">
        <div className={`p-4 rounded-t-xl border-b border-slate-200 flex justify-between items-center ${color} bg-opacity-10`}>
          <h3 className={`font-bold ${color.replace('bg-', 'text-')}`}>{status}</h3>
          <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">{visibleOrders.length}</span>
        </div>
        <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {visibleOrders.map(order => {
              const today = new Date().toISOString().split('T')[0];
              const isOverdue = order.plannedDate && order.plannedDate < today && order.status !== MaintenanceStatus.CLOSED;
              
              return (
                <div 
                    key={order.id} 
                    onClick={() => setSelectedOrderDetails(order)}
                    className={`bg-white p-4 rounded-lg shadow-sm border ${isOverdue ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} hover:shadow-md transition-shadow group relative cursor-pointer`}
                >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                        order.priority === 'High' ? 'bg-red-100 text-red-700' : 
                        order.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {order.priority}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        order.type === MaintenanceType.PREVENTIVE ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                            {order.type === MaintenanceType.PREVENTIVE ? 'PM' : 'CM'}
                        </span>
                    </div>
                    <span className="text-xs text-slate-400">{order.number}</span>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">{order.assetId}</h4>
                <p className="text-sm text-slate-500 line-clamp-3 mb-3 whitespace-pre-line">{order.description}</p>
                
                {order.plannedDate && (
                    <div className={`text-xs mb-2 flex items-center font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                        <CalendarClock size={12} className="mr-1"/> Planif: {order.plannedDate}
                        {isOverdue && <span className="ml-2 bg-red-100 text-red-800 px-1 rounded text-[10px] font-bold">VENCIDA</span>}
                    </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                    <div className="text-xs text-slate-400 flex items-center">
                        <Clock size={12} className="mr-1" /> {order.reportedDate}
                    </div>
                    <div className="flex space-x-1">
                        {status !== MaintenanceStatus.CLOSED && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setRescheduleOrder(order); setNewDate(order.plannedDate || ''); }}
                                title="Replanificar"
                                className="p-1.5 text-orange-500 hover:bg-orange-50 rounded"
                            >
                                <CalendarClock size={16} />
                            </button>
                        )}
                        
                        {/* Print Button - Only visible if PLANNED */}
                        {(order.status === MaintenanceStatus.PLANNED || order.status === MaintenanceStatus.CLOSED) && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); generatePDF(order); }}
                                title="Imprimir Orden"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            >
                                <Printer size={16} />
                            </button>
                        )}

                        {status !== MaintenanceStatus.CLOSED && (
                            <button 
                                onClick={(e) => handleAdvanceStatus(e, order)}
                                className="p-1.5 text-accent hover:bg-blue-50 rounded" 
                                title="Avanzar estado"
                            >
                                <CheckCircle size={16} />
                            </button>
                        )}
                    </div>
                </div>
                </div>
            )
          })}
        </div>
      </div>
    );
  };
  
  // History View Component
  const HistoryView = () => {
      const historyList = orders.filter(o => o.status === MaintenanceStatus.CLOSED);
      
      return (
          <div className="h-full p-4 overflow-hidden flex flex-col">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="font-bold text-slate-800 flex items-center"><Archive size={20} className="mr-2 text-slate-500"/> Histórico de Órdenes Cerradas</h3>
                          <p className="text-xs text-slate-500">Listado completo de intervenciones finalizadas</p>
                      </div>
                      <div className="bg-white px-3 py-1 rounded border border-slate-200 text-sm font-medium">
                          Total: {historyList.length}
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                              <tr>
                                  <th className="px-6 py-4">Nro. Orden</th>
                                  <th className="px-6 py-4">Activo</th>
                                  <th className="px-6 py-4">Descripción</th>
                                  <th className="px-6 py-4">Tipo</th>
                                  <th className="px-6 py-4">Fecha Cierre</th>
                                  <th className="px-6 py-4">Técnico</th>
                                  <th className="px-6 py-4 text-center">Acciones</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {historyList.map(order => (
                                  <tr key={order.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 font-mono text-slate-600 font-medium">{order.number}</td>
                                      <td className="px-6 py-3 font-bold text-slate-700">{order.assetId}</td>
                                      <td className="px-6 py-3 text-slate-600 truncate max-w-xs">{order.description.split('\n')[0]}</td>
                                      <td className="px-6 py-3">
                                          <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                            order.type === MaintenanceType.PREVENTIVE ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                          }`}>
                                              {order.type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-3 text-slate-500">{order.closedDate || order.plannedDate || '-'}</td>
                                      <td className="px-6 py-3 text-slate-500 flex items-center">
                                          {order.technician ? <><User size={14} className="mr-2"/> {order.technician}</> : <span className="text-slate-300 italic">No registrado</span>}
                                      </td>
                                      <td className="px-6 py-3 text-center flex items-center justify-center gap-2">
                                          <button 
                                            onClick={() => setSelectedOrderDetails(order)}
                                            className="text-accent hover:underline font-medium text-xs"
                                          >
                                              Ver
                                          </button>
                                          <button 
                                            onClick={() => generatePDF(order)}
                                            className="text-slate-400 hover:text-slate-600"
                                            title="Imprimir"
                                          >
                                            <Printer size={14} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {historyList.length === 0 && (
                                  <tr>
                                      <td colSpan={7} className="p-12 text-center text-slate-400">No hay historial de órdenes cerradas.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  };

  // Helper for Grid View dates
  const weekDates = Array.from({length: 7}).map((_, i) => {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      return d;
  });

  const changeWeek = (offset: number) => {
      const newDate = new Date(weekStartDate);
      newDate.setDate(newDate.getDate() + (offset * 7));
      setWeekStartDate(newDate);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in relative">
      
      {/* Reschedule Modal Overlay */}
      {rescheduleOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-96 animate-in zoom-in-95">
                  <h4 className="font-bold text-lg mb-4 text-slate-800 flex items-center">
                      <CalendarClock className="mr-2 text-orange-500"/> Replanificar Orden
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">
                      Seleccione una nueva fecha para la orden <b>{rescheduleOrder.number}</b>.
                  </p>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nueva Fecha Planificada</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-6 focus:ring-2 focus:ring-accent outline-none bg-white"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setRescheduleOrder(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancelar</button>
                      <button onClick={handleRescheduleSave} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">Guardar Cambios</button>
                  </div>
              </div>
          </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[600px] max-w-[95%] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-slate-800">{selectedOrderDetails.number}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                                  selectedOrderDetails.type === MaintenanceType.PREVENTIVE ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                  {selectedOrderDetails.type}
                              </span>
                          </div>
                          <p className="text-slate-500 text-sm font-medium flex items-center">
                               {selectedOrderDetails.assetId} 
                               {selectedOrderDetails.priority === 'High' && <span className="ml-2 text-red-600 flex items-center text-xs"><AlertTriangle size={12} className="mr-1"/> Prioridad Alta</span>}
                          </p>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => generatePDF(selectedOrderDetails)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700" title="Imprimir">
                             <Printer size={20} />
                          </button>
                          <button onClick={() => setSelectedOrderDetails(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700">
                              <X size={20} />
                          </button>
                      </div>
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 min-h-0">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Descripción del Trabajo</h4>
                          <p className="text-slate-800 text-sm whitespace-pre-wrap">{selectedOrderDetails.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Fechas</h4>
                              <div className="text-sm">
                                  <p className="flex items-center text-slate-700 mb-1"><Clock size={14} className="mr-2 text-slate-400"/> Reportado: {selectedOrderDetails.reportedDate}</p>
                                  {selectedOrderDetails.plannedDate && (
                                    <p className="flex items-center text-slate-700"><CalendarClock size={14} className="mr-2 text-slate-400"/> Planificado: {selectedOrderDetails.plannedDate}</p>
                                  )}
                              </div>
                          </div>
                          <div>
                               <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Origen</h4>
                               <p className="text-sm text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded inline-block">
                                   {selectedOrderDetails.origin === 'ROUTINE' ? 'Plan Preventivo' : 'Solicitud Manual'}
                               </p>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xs font-bold text-slate-500 uppercase">Materiales Asignados</h4>
                              {selectedOrderDetails.status !== MaintenanceStatus.CLOSED && !isAddingMaterial && (
                                  <button onClick={() => setIsAddingMaterial(true)} className="text-accent text-[11px] hover:underline flex items-center font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                      <Plus size={12} className="mr-1"/> Agregar Material
                                  </button>
                              )}
                          </div>
                          
                          {/* Add Material Form */}
                          {isAddingMaterial && (
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 animate-in fade-in">
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Seleccionar Material</label>
                                  <select 
                                    className="w-full text-sm border border-slate-300 rounded p-1.5 mb-2 bg-white"
                                    value={selectedMatId}
                                    onChange={(e) => setSelectedMatId(e.target.value)}
                                  >
                                      <option value="">Seleccione...</option>
                                      {materials.map(m => (
                                          <option key={m.id} value={m.id}>{m.code} - {m.description} (Stock: {m.stock})</option>
                                      ))}
                                  </select>
                                  <div className="flex gap-2 items-end">
                                      <div className="w-24">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Cantidad</label>
                                        <input 
                                            type="number" 
                                            className="w-full text-sm border border-slate-300 rounded p-1.5 bg-white"
                                            value={qtyMat}
                                            onChange={(e) => setQtyMat(parseFloat(e.target.value))}
                                        />
                                      </div>
                                      <button 
                                        onClick={handleAddMaterial}
                                        disabled={!selectedMatId || qtyMat <= 0}
                                        className="bg-accent text-white text-sm px-3 py-1.5 rounded hover:bg-blue-600 disabled:opacity-50"
                                      >
                                          Guardar
                                      </button>
                                      <button onClick={() => setIsAddingMaterial(false)} className="text-slate-500 text-sm px-3 py-1.5 hover:bg-slate-200 rounded">Cancelar</button>
                                  </div>
                              </div>
                          )}

                          {selectedOrderDetails.assignedMaterials && selectedOrderDetails.assignedMaterials.length > 0 ? (
                              <ul className="space-y-1">
                                  {selectedOrderDetails.assignedMaterials.map((mat, idx) => {
                                      const matDetails = materials.find(m => m.id === mat.materialId);
                                      return (
                                        <li key={idx} className="text-sm flex justify-between items-center bg-white border border-slate-100 p-2 rounded group">
                                            <div>
                                                <span className="text-slate-700 font-medium block">{matDetails ? matDetails.description : mat.materialId}</span>
                                                <span className="text-xs text-slate-400">{matDetails?.code}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">x{mat.quantity}</span>
                                                {selectedOrderDetails.status !== MaintenanceStatus.CLOSED && (
                                                    <button onClick={() => handleRemoveMaterial(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                      )
                                  })}
                              </ul>
                          ) : (
                              !isAddingMaterial && <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded border border-dashed border-slate-200">No hay materiales asignados.</p>
                          )}
                      </div>

                      <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Técnico Asignado</h4>
                          <div className="flex items-center p-2 border border-dashed border-slate-300 rounded text-slate-500 text-sm">
                               <User size={16} className="mr-2"/>
                               {selectedOrderDetails.technician || "Sin asignar"}
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end space-x-2">
                       {selectedOrderDetails.status !== MaintenanceStatus.CLOSED && (
                           <button 
                                onClick={(e) => {
                                    handleAdvanceStatus(e, selectedOrderDetails);
                                    setSelectedOrderDetails(null);
                                }}
                                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 font-medium text-sm flex items-center"
                           >
                               <CheckCircle size={16} className="mr-2"/> Avanzar a: {
                                   selectedOrderDetails.status === MaintenanceStatus.PENDING ? 'Planificado' :
                                   selectedOrderDetails.status === MaintenanceStatus.PLANNED ? 'En Curso' : 'Cerrado'
                               }
                           </button>
                       )}
                       <button onClick={() => setSelectedOrderDetails(null)} className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 font-medium text-sm">
                           Cerrar
                       </button>
                  </div>
              </div>
          </div>
      )}

      {/* KPI & Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
          <div className="grid grid-cols-2 gap-4 flex-1">
             <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Total Activas</p>
                    <p className="text-xl font-bold text-slate-800">{totalActive}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><LayoutList size={20} /></div>
             </div>
             
             {/* Progress Bar Corrective vs Preventive */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-rose-600 flex items-center"><AlertTriangle size={12} className="mr-1"/> Correctivo</span>
                    <span className="text-indigo-600 flex items-center">Preventivo <CalendarDays size={12} className="ml-1"/></span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-rose-500 h-full" style={{ width: `${100 - preventivePct}%` }}></div>
                    <div className="bg-indigo-500 h-full" style={{ width: `${preventivePct}%` }}></div>
                </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
             <button 
                onClick={() => setViewMode('KANBAN')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'KANBAN' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <Kanban size={16} className="mr-2"/> Tablero
             </button>
             <button 
                onClick={() => setViewMode('GRID')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <CalendarDays size={16} className="mr-2"/> Calendario
             </button>
             <button 
                onClick={() => setViewMode('HISTORY')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'HISTORY' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <History size={16} className="mr-2"/> Historial
             </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative border-t border-slate-200 bg-slate-100">
          {viewMode === 'KANBAN' && (
              <div className="h-full overflow-x-auto overflow-y-hidden p-4">
                <div className="flex h-full gap-4 min-w-max">
                    <KanbanColumn status={MaintenanceStatus.PENDING} color="bg-red-500" />
                    <KanbanColumn status={MaintenanceStatus.PLANNED} color="bg-orange-500" />
                    <KanbanColumn status={MaintenanceStatus.IN_PROGRESS} color="bg-blue-500" />
                    <KanbanColumn status={MaintenanceStatus.CLOSED} color="bg-green-500" />
                </div>
              </div>
          )}
          
          {viewMode === 'GRID' && (
              <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden m-4">
                  {/* Calendar Navigation */}
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                     <div className="flex items-center gap-2">
                         <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><ChevronLeft/></button>
                         {/* Date Range Selector */}
                         <div className="relative">
                            <input 
                                type="date" 
                                className="pl-8 pr-2 py-1 border border-slate-300 rounded text-sm bg-white hover:bg-slate-50 focus:ring-2 focus:ring-accent outline-none cursor-pointer text-slate-600"
                                onChange={(e) => {
                                    if(!e.target.value) return;
                                    const d = new Date(e.target.value);
                                    // Calculate monday of that week
                                    const day = d.getDay();
                                    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
                                    const monday = new Date(d.setDate(diff));
                                    setWeekStartDate(monday);
                                }}
                            />
                            <CalendarIcon className="absolute left-2 top-1.5 text-slate-400 pointer-events-none" size={14} />
                         </div>
                         <button onClick={() => changeWeek(1)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><ChevronRight/></button>
                     </div>
                     
                     <span className="font-bold text-slate-700 text-lg capitalize">
                         {weekStartDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                     </span>
                     
                     {/* Placeholder to balance flex */}
                     <div className="w-24"></div> 
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="flex-1 overflow-auto">
                     <div className="grid grid-cols-7 min-w-[1000px] h-full divide-x divide-slate-200">
                         {weekDates.map((date, idx) => {
                             const dateStr = date.toISOString().split('T')[0];
                             const dayOrders = filteredOrders.filter(o => o.plannedDate === dateStr && o.status !== MaintenanceStatus.CLOSED);
                             const isToday = dateStr === new Date().toISOString().split('T')[0];

                             return (
                                 <div key={idx} className="flex flex-col min-h-[400px]">
                                     <div className={`p-3 text-center border-b border-slate-200 ${isToday ? 'bg-blue-50' : 'bg-slate-50'}`}>
                                         <p className="text-xs font-bold text-slate-500 uppercase">{date.toLocaleDateString('es-AR', { weekday: 'short' })}</p>
                                         <p className={`text-lg font-bold ${isToday ? 'text-accent' : 'text-slate-800'}`}>{date.getDate()}</p>
                                     </div>
                                     <div className="p-2 flex-1 bg-white space-y-2 overflow-y-auto">
                                         {dayOrders.map(order => (
                                             <div 
                                                key={order.id} 
                                                onClick={() => setSelectedOrderDetails(order)}
                                                className="p-2 rounded border border-slate-200 bg-white shadow-sm text-xs hover:border-accent cursor-pointer group hover:shadow-md transition-all"
                                             >
                                                 <div className="flex justify-between items-start mb-1">
                                                     <span className="font-bold text-slate-700">{order.assetId}</span>
                                                     <span className={`w-2 h-2 rounded-full ${order.type === MaintenanceType.PREVENTIVE ? 'bg-indigo-500' : 'bg-rose-500'}`}></span>
                                                 </div>
                                                 <p className="text-slate-500 truncate mb-1">{order.description.split('\n')[0]}</p>
                                                 <div className="flex justify-between items-center text-[10px] text-slate-400">
                                                     <span>{order.number}</span>
                                                     <button onClick={(e) => { e.stopPropagation(); setRescheduleOrder(order); setNewDate(dateStr); }} className="opacity-0 group-hover:opacity-100 hover:text-orange-500 p-1 hover:bg-orange-50 rounded"><CalendarClock size={12}/></button>
                                                 </div>
                                             </div>
                                         ))}
                                         {dayOrders.length === 0 && (
                                             <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                 <button className="p-2 rounded-full hover:bg-slate-100 text-slate-300"><Plus size={16}/></button>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             )
                         })}
                     </div>
                  </div>
              </div>
          )}

          {viewMode === 'HISTORY' && <HistoryView />}
      </div>
    </div>
  );
};

const WorkRequestForm = ({ existingOrders, onSave, onCancel }: { existingOrders: MaintenanceOrder[], onSave: (o: MaintenanceOrder) => void, onCancel: () => void }) => {
    const { assets } = useMasterData();
    const [assetId, setAssetId] = useState('');
    const [desc, setDesc] = useState('');
    const [priority, setPriority] = useState('Medium');

    const openOrdersForAsset = useMemo(() => {
        if (!assetId) return [];
        return existingOrders.filter(o => o.assetId === assetId && o.status !== MaintenanceStatus.CLOSED);
    }, [assetId, existingOrders]);

    const handleSubmit = () => {
        if(!assetId || !desc) return alert("Complete los campos obligatorios");
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
            origin: 'MANUAL'
        };
        onSave(order);
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl mx-auto shadow-sm animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><Siren className="mr-2 text-rose-500"/> Nuevo Aviso de Avería</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Activo Afectado</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={assetId} onChange={e => setAssetId(e.target.value)}>
                        <option value="">Seleccionar Equipo...</option>
                        {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                    </select>
                </div>

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
                                        <p className="mt-1 text-orange-500 flex items-center">
                                            <Clock size={10} className="mr-1"/> Reportado: {o.reportedDate}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de la Falla</label>
                    <textarea 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white h-32" 
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

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-md">Crear Aviso</button>
                </div>
            </div>
        </div>
    );
};

const ChecklistExecution = () => (
    <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center">
        <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-600">Ejecución de Checklists</h3>
        <p className="text-slate-400">Módulo para ejecución de inspecciones en planta.</p>
    </div>
);

// --- Main Component ---

type ModuleView = 'MENU' | 'ORDERS' | 'PLANNER' | 'REQUESTS' | 'CHECKLISTS';

export default function Maintenance() {
    const [activeModule, setActiveModule] = useState<ModuleView>('MENU');
    const [orders, setOrders] = useState<MaintenanceOrder[]>(INITIAL_ORDERS);

    const handleCreateOrders = (newOrders: MaintenanceOrder[]) => {
        setOrders([...orders, ...newOrders]);
        setActiveModule('ORDERS'); // Go to orders after generation
        alert(`${newOrders.length} Órdenes generadas exitosamente.`);
    };

    const handleUpdateOrder = (updatedOrder: MaintenanceOrder) => {
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    const handleCreateRequest = (newOrder: MaintenanceOrder) => {
        setOrders([...orders, newOrder]);
        setActiveModule('ORDERS');
        alert("Aviso de avería creado correctamente.");
    };

    const LandingMenu = () => (
        <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Mantenimiento y Activos</h1>
                <p className="text-slate-500 text-lg">Seleccione una operación para comenzar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
                 <button 
                    onClick={() => setActiveModule('REQUESTS')}
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-rose-500 transition-all text-left flex flex-col"
                >
                    <div className="bg-rose-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-rose-100 transition-colors">
                        <Siren size={32} className="text-rose-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Avisos de Avería</h3>
                    <p className="text-sm text-slate-500 mb-4 flex-1">Reporte de fallas, solicitud de reparaciones correctivas y alertas de seguridad.</p>
                    <span className="text-rose-600 font-semibold text-sm flex items-center">Crear Solicitud <ArrowRight size={16} className="ml-2"/></span>
                </button>

                <button 
                    onClick={() => setActiveModule('ORDERS')}
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-500 transition-all text-left flex flex-col"
                >
                    <div className="bg-blue-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-blue-100 transition-colors">
                        <LayoutDashboard size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Gestión de Órdenes</h3>
                    <p className="text-sm text-slate-500 mb-4 flex-1">Tablero Kanban, asignación de técnicos, consumo de materiales y cierre de OTs.</p>
                    <span className="text-blue-600 font-semibold text-sm flex items-center">Ir al Tablero <ArrowRight size={16} className="ml-2"/></span>
                </button>

                <button 
                    onClick={() => setActiveModule('PLANNER')}
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-orange-500 transition-all text-left flex flex-col"
                >
                    <div className="bg-orange-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-orange-100 transition-colors">
                        <CalendarClock size={32} className="text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Planificación PM</h3>
                    <p className="text-sm text-slate-500 mb-4 flex-1">Generación masiva de órdenes preventivas basadas en calendario y horas de uso.</p>
                    <span className="text-orange-600 font-semibold text-sm flex items-center">Abrir Planificador <ArrowRight size={16} className="ml-2"/></span>
                </button>

                 <button 
                    onClick={() => setActiveModule('CHECKLISTS')}
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-green-500 transition-all text-left flex flex-col"
                >
                    <div className="bg-green-50 p-3 rounded-xl mb-4 w-fit group-hover:bg-green-100 transition-colors">
                        <ClipboardList size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Checklists</h3>
                    <p className="text-sm text-slate-500 mb-4 flex-1">Ejecución de inspecciones diarias, rondas de lubricación y auditorías.</p>
                    <span className="text-green-600 font-semibold text-sm flex items-center">Iniciar Inspección <ArrowRight size={16} className="ml-2"/></span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            {activeModule !== 'MENU' && (
                <div className="mb-4">
                     <button 
                        onClick={() => setActiveModule('MENU')}
                        className="flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium"
                    >
                        <ArrowRight className="rotate-180 mr-2" size={18} /> Volver al menú de mantenimiento
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-hidden">
                {activeModule === 'MENU' && <LandingMenu />}
                {activeModule === 'ORDERS' && <MaintenanceManagement orders={orders} onUpdateOrder={handleUpdateOrder} />}
                {activeModule === 'PLANNER' && <PMPlanner onGenerateOrders={handleCreateOrders} onCancel={() => setActiveModule('MENU')} />}
                {activeModule === 'REQUESTS' && <WorkRequestForm existingOrders={orders} onSave={handleCreateRequest} onCancel={() => setActiveModule('MENU')} />}
                {activeModule === 'CHECKLISTS' && <ChecklistExecution />}
            </div>
        </div>
    );
}
