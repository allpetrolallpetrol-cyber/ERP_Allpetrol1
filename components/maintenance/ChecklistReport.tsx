
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { useMasterData } from '../../contexts/MasterDataContext';
import { ChecklistExecution } from '../../types';
import { FileBarChart, ChevronLeft, ThumbsUp, AlertTriangle, CheckCircle, X, Eye, Printer, Search, Calendar } from 'lucide-react';

export const ChecklistReport = () => {
    const { checklistExecutions, assets } = useMasterData();
    const [selectedExec, setSelectedExec] = useState<ChecklistExecution | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const getAssetCode = (id: string) => assets.find(a => a.id === id)?.code || id;

    // Filter executions (Sorted Newest First)
    const sortedExecutions = [...checklistExecutions].sort((a, b) => b.timestamp - a.timestamp);

    const filteredExecutions = sortedExecutions.filter(e => 
        (e.assetName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (e.modelName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const generatePDF = (exec: ChecklistExecution) => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Reporte de Inspección", 105, 20, { align: "center" } as any);
        
        doc.setFontSize(12);
        doc.text(`Activo: ${exec.assetName}`, 20, 40);
        doc.text(`Fecha: ${new Date(exec.timestamp).toLocaleDateString()}`, 150, 40);
        doc.text(`Modelo: ${exec.modelName}`, 20, 50);
        
        let y = 70;
        doc.setFontSize(10);
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y-5, 170, 8, 'F');
        doc.text("Item", 25, y);
        doc.text("Estado", 130, y);
        doc.text("Comentario", 160, y);
        
        y += 10;
        
        exec.items.forEach(item => {
            const statusText = item.status === 'OK' ? 'OK' : item.status === 'FAIL' ? 'FALLA' : '-';
            if(item.status === 'FAIL') doc.setTextColor(255, 0, 0);
            doc.text(item.label, 25, y);
            doc.text(statusText, 130, y);
            if(item.comment) doc.text(item.comment, 160, y);
            doc.setTextColor(0, 0, 0); 
            y += 8;
        });

        doc.save(`Checklist-${exec.id}.pdf`);
    };

    if (selectedExec) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 h-full flex flex-col animate-in fade-in slide-in-from-right-4">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <button onClick={() => setSelectedExec(null)} className="text-slate-500 hover:text-slate-800 text-sm flex items-center mb-1"><ChevronLeft size={16} className="mr-1"/> Volver</button>
                        <h3 className="text-xl font-bold text-slate-800">Detalle de Inspección</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full font-bold text-sm border flex items-center ${selectedExec.globalStatus === 'PASS' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {selectedExec.globalStatus === 'PASS' ? <ThumbsUp size={16} className="mr-2"/> : <AlertTriangle size={16} className="mr-2"/>}
                            {selectedExec.globalStatus === 'PASS' ? 'APROBADO' : 'RECHAZADO'}
                        </div>
                        <button onClick={() => generatePDF(selectedExec)} className="p-2 bg-white border border-slate-300 rounded-full hover:bg-slate-50 text-slate-600">
                            <Printer size={20} />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Activo</p>
                            <p className="text-lg font-bold text-slate-800">{selectedExec.assetName}</p>
                            <p className="text-sm text-slate-500">{getAssetCode(selectedExec.assetId)}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Modelo Checklist</p>
                            <p className="text-lg font-bold text-slate-800">{selectedExec.modelName}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Fecha / Hora</p>
                            <p className="text-lg font-bold text-slate-800">{new Date(selectedExec.timestamp).toLocaleDateString()} <span className="text-sm font-normal text-slate-500">{new Date(selectedExec.timestamp).toLocaleTimeString()}</span></p>
                        </div>
                    </div>

                    <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">Resultados por Item</h4>
                    <div className="space-y-3">
                        {selectedExec.items.map((item, idx) => (
                            <div key={idx} className={`flex justify-between items-start p-3 rounded-lg border ${item.status === 'FAIL' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                                <div>
                                    <div className="flex items-center">
                                        <span className="font-medium text-slate-800 mr-2">{item.label}</span>
                                        {item.isCritical && <span className="bg-red-100 text-red-700 text-[10px] px-1.5 rounded font-bold border border-red-200">CRÍTICO</span>}
                                    </div>
                                    {item.comment && <p className="text-sm text-slate-600 mt-1 italic">"{item.comment}"</p>}
                                </div>
                                <div className="flex items-center">
                                    {item.status === 'OK' && <span className="text-green-600 font-bold text-xs flex items-center bg-green-50 px-2 py-1 rounded border border-green-100"><CheckCircle size={14} className="mr-1"/> OK</span>}
                                    {item.status === 'FAIL' && <span className="text-red-600 font-bold text-xs flex items-center bg-white px-2 py-1 rounded border border-red-200"><X size={14} className="mr-1"/> FALLA</span>}
                                    {item.status === 'PENDING' && <span className="text-slate-400 font-bold text-xs">N/A</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <FileBarChart className="mr-2 text-slate-600"/> Reportes de Checklist
                </h3>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar por activo..." 
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
            </div>
            <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Activo</th>
                            <th className="p-4">Modelo</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredExecutions.length > 0 ? filteredExecutions.map((exec, index) => {
                            // Highlight if it was created within the last 2 minutes
                            const isNew = (Date.now() - exec.timestamp) < 120000;
                            
                            return (
                                <tr key={exec.id} className={`hover:bg-slate-50 transition-colors ${isNew ? 'bg-blue-50/50' : ''}`}>
                                    <td className="p-4 text-slate-600 flex items-center">
                                        <Calendar size={14} className="mr-2 text-slate-400"/>
                                        <div>
                                            {new Date(exec.timestamp).toLocaleDateString()}
                                            <div className="text-xs text-slate-400">{new Date(exec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </div>
                                        {isNew && <span className="ml-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">NUEVO</span>}
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">{exec.assetName}</td>
                                    <td className="p-4 text-slate-500">{exec.modelName}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            exec.globalStatus === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {exec.globalStatus === 'PASS' ? 'Aprobado' : 'Falla'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => setSelectedExec(exec)} className="text-accent hover:text-blue-700 font-medium flex items-center justify-end w-full">
                                            <Eye size={16} className="mr-1"/> Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-400">
                                    No se encontraron inspecciones.
                                    {searchTerm && <button onClick={() => setSearchTerm('')} className="block mx-auto mt-2 text-accent text-sm hover:underline">Limpiar Filtros</button>}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
