
import React, { useState, useMemo } from 'react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { MaintenanceOrder, MaintenanceStatus, MaintenanceType } from '../../types';
import { CalendarDays, PlayCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export const PMPlanner = ({ onGenerateOrders, onCancel }: { onGenerateOrders: (newOrders: MaintenanceOrder[]) => void, onCancel: () => void }) => {
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
                description: `[PREVENTIVO] ${routine.name}\n${routine.description || ''}\nDisciplina: ${routine.discipline}\nHoras Est.: ${routine.estimatedHours}`,
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
            <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center">
                    <button onClick={onCancel} className="mr-4 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full p-1"><ArrowLeft size={20}/></button>
                    <div className="bg-blue-100 p-2 rounded-lg text-accent mr-3">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Planificador de Mantenimiento</h2>
                        <p className="text-sm text-slate-500">Generación masiva de preventivos</p>
                    </div>
                </div>

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

            <div className="flex-1 overflow-hidden p-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
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
