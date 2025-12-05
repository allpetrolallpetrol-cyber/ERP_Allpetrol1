
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { useMasterData } from '../../contexts/MasterDataContext';
import { Asset, AssetType, ChecklistExecution as ChecklistExecutionType } from '../../types';
import { QrCode, Camera, X, ArrowRight, ChevronLeft, ChevronRight, Cog, Truck, ThumbsDown, Minus, ThumbsUp, Siren, ClipboardCheck, AlertTriangle, Search, Calendar, FileText, Printer, CheckCircle, Eye } from 'lucide-react';

type CheckStatus = 'PENDING' | 'OK' | 'FAIL';

export const ChecklistExecution = ({ onQuickCorrectiveOrder, onBack }: { onQuickCorrectiveOrder: (assetId: string, description: string) => Promise<void>, onBack: () => void }) => {
    const { assets, checklistModels, checklistExecutions, addChecklistExecution } = useMasterData();
    
    // Steps: IDENTIFY (Main Screen with History), SELECT_MODEL, EXECUTE
    const [step, setStep] = useState<'IDENTIFY' | 'SELECT_MODEL' | 'EXECUTE'>('IDENTIFY');
    
    // Identification State
    const [identifiedAsset, setIdentifiedAsset] = useState<Asset | null>(null);
    const [assetInput, setAssetInput] = useState('');
    const [selectedModelId, setSelectedModelId] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Execution State
    const [results, setResults] = useState<Record<string, { status: CheckStatus, comment: string }>>({});

    // Helper: Get local date string YYYY-MM-DD to fix timezone issues
    const getLocalDateStr = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - (offset * 60000));
        return local.toISOString().split('T')[0];
    };

    // History / Report State - Default to TODAY (Local)
    const [historyDate, setHistoryDate] = useState(getLocalDateStr(new Date())); 
    const [historySearch, setHistorySearch] = useState('');
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<ChecklistExecutionType | null>(null);

    // Corrective Action Modal State
    const [correctiveModalOpen, setCorrectiveModalOpen] = useState(false);
    const [correctiveItemData, setCorrectiveItemData] = useState<{id: string, label: string} | null>(null);
    const [correctiveDescription, setCorrectiveDescription] = useState('');

    // --- History Filtering Logic ---
    const filteredHistory = useMemo(() => {
        return checklistExecutions
            .filter(exec => {
                // Date Filter (Compare Local Dates)
                const execDate = getLocalDateStr(new Date(exec.timestamp));
                if (historyDate && execDate !== historyDate) return false;
                
                // Text Filter (Asset Name or Model Name)
                if (historySearch) {
                    const term = historySearch.toLowerCase();
                    return (
                        exec.assetName.toLowerCase().includes(term) ||
                        exec.modelName.toLowerCase().includes(term)
                    );
                }
                return true;
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first
    }, [checklistExecutions, historyDate, historySearch]);

    // --- PDF Generation ---
    const generatePDF = (exec: ChecklistExecutionType) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Reporte de Inspección", 105, 20, { align: "center" } as any);
        doc.setFontSize(12);
        doc.text(`Activo: ${exec.assetName}`, 20, 40);
        doc.text(`Fecha: ${new Date(exec.timestamp).toLocaleDateString()} ${new Date(exec.timestamp).toLocaleTimeString()}`, 20, 48);
        doc.text(`Modelo: ${exec.modelName}`, 20, 56);
        
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


    // --- Camera / QR Logic ---
    const startCamera = async () => {
        try {
            setIsScanning(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error(err);
            alert("No se pudo acceder a la cámara. Verifique los permisos.");
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const simulateScan = () => {
        const randomAsset = assets[0];
        if (randomAsset) {
            setAssetInput(randomAsset.code);
            stopCamera();
        }
    };

    // Identify Asset
    const handleIdentify = () => {
        if (!assetInput.trim()) {
            alert("Por favor ingrese un código de activo.");
            return;
        }

        const asset = assets.find(a => 
            a.id.toLowerCase() === assetInput.toLowerCase() || 
            a.code.toLowerCase() === assetInput.toLowerCase() ||
            a.plate?.toLowerCase() === assetInput.toLowerCase()
        );

        if (asset) {
            setIdentifiedAsset(asset);
            setStep('SELECT_MODEL');
        } else {
            alert(`ERROR: No se encontró ningún activo con el código "${assetInput}". Verifique el código o patente.`);
        }
    };

    // Filter compatible models
    const compatibleModels = useMemo(() => {
        if (!identifiedAsset) return [];
        return checklistModels.filter(m => {
            if (m.assetType !== identifiedAsset.type) return false;
            if (m.assetSubtype && m.assetSubtype !== identifiedAsset.subtype) return false;
            return true;
        });
    }, [identifiedAsset, checklistModels]);

    const handleSelectModel = (id: string) => {
        setSelectedModelId(id);
        setStep('EXECUTE');
        const model = checklistModels.find(m => m.id === id);
        if (model) {
            const initialRes: any = {};
            model.items.forEach(i => initialRes[i.id] = { status: 'PENDING', comment: '' });
            setResults(initialRes);
        }
    };

    const handleToggle = (itemId: string, currentStatus: CheckStatus) => {
        let next: CheckStatus = 'PENDING';
        if (currentStatus === 'PENDING') next = 'OK';
        else if (currentStatus === 'OK') next = 'FAIL';
        else next = 'PENDING';

        setResults(prev => {
            const prevItem = prev[itemId] || { status: 'PENDING', comment: '' };
            return {
                ...prev,
                [itemId]: { ...prevItem, status: next }
            };
        });
    };

    const handleCommentChange = (itemId: string, val: string) => {
        setResults(prev => ({
            ...prev,
            [itemId]: { ...(prev[itemId] || { status: 'PENDING', comment: '' }), comment: val }
        }));
    };

    const openCorrectiveModal = (itemId: string, itemLabel: string) => {
        const res = results[itemId];
        setCorrectiveItemData({ id: itemId, label: itemLabel });
        setCorrectiveDescription(res?.comment || ''); 
        setCorrectiveModalOpen(true);
    };

    const confirmCorrectiveOrder = async () => {
        if (!identifiedAsset || !correctiveItemData) return;
        if (!correctiveDescription.trim()) {
            alert("Debe describir la falla detectada.");
            return;
        }

        const fullDesc = `[FALLA CHECKLIST] ${correctiveItemData.label}\nObservación: ${correctiveDescription}`;
        try {
            await onQuickCorrectiveOrder(identifiedAsset.id, fullDesc);
            
            handleCommentChange(correctiveItemData.id, correctiveDescription);

            setCorrectiveModalOpen(false);
            setCorrectiveItemData(null);
            setCorrectiveDescription('');
            alert("Aviso de Avería generado correctamente. Puede continuar con el checklist.");
        } catch (e) {
            console.error(e);
            alert("Error al generar el aviso.");
        }
    };

    const handleFinish = async () => {
        const model = checklistModels.find(m => m.id === selectedModelId);
        if (!model || !identifiedAsset) return;

        let error = false;
        let globalStatus: 'PASS' | 'FAIL' = 'PASS';

        // Prepare items for saving
        const savedItems = model.items.map(item => {
            const res = results[item.id];
            const status = res?.status || 'PENDING';
            if (item.isCritical && status === 'FAIL' && !res.comment.trim()) {
                alert(`El item crítico "${item.label}" falló. Debe ingresar una observación obligatoria.`);
                error = true;
            }
            if (status === 'FAIL') globalStatus = 'FAIL';
            return {
                label: item.label,
                status: status,
                comment: res?.comment || '',
                isCritical: item.isCritical
            };
        });

        if (!error) {
            // Save to Context
            const execution: ChecklistExecutionType = {
                id: `EXEC-${Date.now()}`,
                date: new Date().toISOString(),
                timestamp: Date.now(),
                modelId: model.id,
                modelName: model.name,
                assetId: identifiedAsset.id,
                assetName: identifiedAsset.name,
                globalStatus,
                items: savedItems
            };
            
            try {
                await addChecklistExecution(execution);
                alert("Checklist finalizado y guardado exitosamente.");
                setStep('IDENTIFY');
                setIdentifiedAsset(null);
                setAssetInput('');
                setSelectedModelId('');
                setResults({});
                // Reset Date Filter to today (Local) to show the new one immediately
                setHistoryDate(getLocalDateStr(new Date()));
            } catch (e) {
                console.error(e);
                alert("Error al guardar inspección.");
            }
        }
    };

    // --- RENDER ---

    // 1. History Item Detail Modal
    if (selectedHistoryItem) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 h-full flex flex-col animate-in fade-in slide-in-from-right-4">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <button onClick={() => setSelectedHistoryItem(null)} className="text-slate-500 hover:text-slate-800 text-sm flex items-center mb-1"><ChevronLeft size={16} className="mr-1"/> Volver</button>
                        <h3 className="text-xl font-bold text-slate-800">Detalle de Inspección</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full font-bold text-sm border flex items-center ${selectedHistoryItem.globalStatus === 'PASS' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {selectedHistoryItem.globalStatus === 'PASS' ? <ThumbsUp size={16} className="mr-2"/> : <AlertTriangle size={16} className="mr-2"/>}
                            {selectedHistoryItem.globalStatus === 'PASS' ? 'APROBADO' : 'RECHAZADO'}
                        </div>
                        <button onClick={() => generatePDF(selectedHistoryItem)} className="p-2 bg-white border border-slate-300 rounded-full hover:bg-slate-50 text-slate-600">
                            <Printer size={20} />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Activo</p>
                            <p className="text-lg font-bold text-slate-800">{selectedHistoryItem.assetName}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Modelo</p>
                            <p className="text-lg font-bold text-slate-800">{selectedHistoryItem.modelName}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Fecha</p>
                            <p className="text-lg font-bold text-slate-800">{new Date(selectedHistoryItem.timestamp).toLocaleDateString()} <span className="text-sm font-normal text-slate-500">{new Date(selectedHistoryItem.timestamp).toLocaleTimeString()}</span></p>
                        </div>
                    </div>

                    <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">Resultados</h4>
                    <div className="space-y-3">
                        {selectedHistoryItem.items.map((item, idx) => (
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

    // 2. Main View (Identify + History)
    if (step === 'IDENTIFY') {
        return (
            <div className="flex flex-col h-full space-y-6">
                
                {/* Back Button */}
                <div className="flex items-center">
                     <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center text-sm font-medium">
                        <ArrowRight className="rotate-180 mr-2" size={18}/> Volver al menú
                     </button>
                </div>

                {/* TOP: NEW CHECKLIST CARD */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-shrink-0 animate-in slide-in-from-top-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <QrCode className="mr-2 text-slate-600"/> Iniciar Nueva Inspección
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                        {/* Camera Area */}
                        {isScanning ? (
                            <div className="relative w-full md:w-1/3 aspect-video bg-black rounded-lg overflow-hidden border-2 border-accent">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                <button onClick={stopCamera} className="absolute top-2 right-2 bg-white/80 p-1 rounded-full"><X size={16}/></button>
                                <div className="absolute inset-0 border-2 border-white/50 m-8 rounded pointer-events-none animate-pulse"></div>
                            </div>
                        ) : (
                            <button onClick={startCamera} className="w-full md:w-1/3 aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors border-2 border-dashed border-slate-300">
                                <Camera size={32} className="mb-2"/>
                                <span className="text-sm font-medium">Escanear QR Equipo</span>
                            </button>
                        )}

                        {/* Manual Input Area */}
                        <div className="flex-1 w-full space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Ingreso Manual (Código / Patente)</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none" 
                                        placeholder="Ej. TR-01"
                                        value={assetInput}
                                        onChange={(e) => setAssetInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleIdentify()}
                                    />
                                    <button onClick={handleIdentify} className="bg-slate-800 text-white px-4 rounded-lg font-medium hover:bg-slate-700">
                                        Identificar
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100 flex items-center">
                                <Siren size={16} className="mr-2 flex-shrink-0"/>
                                <span>Si detecta una falla crítica, el sistema le permitirá generar un Aviso de Mantenimiento automático.</span>
                            </div>
                            {/* Dev Helper */}
                            <button onClick={simulateScan} className="text-xs text-slate-400 underline hover:text-slate-600">Simular Escaneo (Dev)</button>
                        </div>
                    </div>
                </div>

                {/* BOTTOM: HISTORY LIST */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 justify-between items-center">
                        <h4 className="font-bold text-slate-700 flex items-center"><ClipboardCheck className="mr-2 text-slate-500"/> Historial de Inspecciones</h4>
                        
                        <div className="flex gap-2">
                            <div className="relative">
                                <Calendar size={14} className="absolute left-2.5 top-2.5 text-slate-400"/>
                                <input 
                                    type="date" 
                                    className="pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-accent"
                                    value={historyDate}
                                    onChange={(e) => setHistoryDate(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Buscar activo..." 
                                    className="pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-accent w-32 md:w-48"
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-0">
                        {filteredHistory.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-500 font-semibold sticky top-0">
                                    <tr>
                                        <th className="p-3">Hora</th>
                                        <th className="p-3">Activo</th>
                                        <th className="p-3">Modelo Checklist</th>
                                        <th className="p-3 text-center">Resultado</th>
                                        <th className="p-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredHistory.map(exec => (
                                        <tr key={exec.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 text-slate-500 font-mono">{new Date(exec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td className="p-3 font-medium text-slate-800">{exec.assetName}</td>
                                            <td className="p-3 text-slate-600 truncate max-w-[150px]" title={exec.modelName}>{exec.modelName}</td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${exec.globalStatus === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {exec.globalStatus === 'PASS' ? 'OK' : 'FALLA'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => setSelectedHistoryItem(exec)} className="text-accent hover:underline font-medium">Ver</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                <FileText size={48} className="mb-4 text-slate-200"/>
                                <p>No hay inspecciones registradas en esta fecha.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 3. Select Model
    if (step === 'SELECT_MODEL') {
        return (
            <div className="max-w-2xl mx-auto w-full animate-in fade-in">
                <button onClick={() => { setStep('IDENTIFY'); setIdentifiedAsset(null); }} className="text-slate-500 hover:text-slate-800 flex items-center mb-4 font-medium"><ChevronLeft size={20} className="mr-1"/> Cambiar Activo</button>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Activo Identificado</h3>
                    <div className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="bg-slate-200 p-2 rounded mr-3">
                            {identifiedAsset?.type === AssetType.MACHINE ? <Cog size={24} className="text-slate-600"/> : <Truck size={24} className="text-slate-600"/>}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-lg">{identifiedAsset?.name}</p>
                            <p className="text-slate-500 text-sm font-mono">{identifiedAsset?.code}</p>
                        </div>
                    </div>
                </div>

                <h3 className="text-md font-bold text-slate-700 mb-4">Seleccione Checklist a ejecutar:</h3>
                <div className="grid gap-3">
                    {compatibleModels.map(model => (
                        <button 
                            key={model.id} 
                            onClick={() => handleSelectModel(model.id)}
                            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-accent hover:shadow-md transition-all text-left flex justify-between items-center group"
                        >
                            <div>
                                <h4 className="font-bold text-slate-800">{model.name}</h4>
                                <p className="text-sm text-slate-500">{model.items.length} puntos de control</p>
                            </div>
                            <ChevronRight className="text-slate-300 group-hover:text-accent" />
                        </button>
                    ))}
                    {compatibleModels.length === 0 && (
                        <div className="p-8 text-center bg-slate-100 rounded-xl border border-dashed border-slate-300 text-slate-500">
                            No hay modelos de checklist definidos para este tipo de activo ({identifiedAsset?.type} - {identifiedAsset?.subtype}).
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 4. Execution View
    return (
        <div className="h-full flex flex-col animate-in slide-in-from-right-8">
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h3 className="font-bold text-slate-800">{identifiedAsset?.name}</h3>
                    <p className="text-xs text-slate-500">{checklistModels.find(m => m.id === selectedModelId)?.name}</p>
                </div>
                <button onClick={() => setStep('SELECT_MODEL')} className="text-sm text-red-500 font-medium">Cancelar</button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {checklistModels.find(m => m.id === selectedModelId)?.items.map((item, idx) => {
                    const status = results[item.id]?.status || 'PENDING';
                    const comment = results[item.id]?.comment || '';

                    return (
                        <div key={item.id} className={`bg-white rounded-xl shadow-sm border transition-all ${status === 'FAIL' ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}>
                            <div className="p-4 flex items-start justify-between">
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center mb-1">
                                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded mr-2">#{idx + 1}</span>
                                        {item.isCritical && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200 flex items-center"><AlertTriangle size={10} className="mr-1"/> CRÍTICO</span>}
                                    </div>
                                    <p className="font-medium text-slate-800 leading-snug">{item.label}</p>
                                </div>
                                
                                <button 
                                    onClick={() => handleToggle(item.id, status)}
                                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${
                                        status === 'PENDING' ? 'bg-slate-100 text-slate-400 border border-slate-200' :
                                        status === 'OK' ? 'bg-green-500 text-white shadow-green-200' :
                                        'bg-red-500 text-white shadow-red-200'
                                    }`}
                                >
                                    {status === 'PENDING' && <Minus size={24}/>}
                                    {status === 'OK' && <ThumbsUp size={24}/>}
                                    {status === 'FAIL' && <ThumbsDown size={24}/>}
                                </button>
                            </div>

                            {/* Conditional Comment / Action Area */}
                            {(status === 'FAIL' || comment) && (
                                <div className="px-4 pb-4 animate-in fade-in">
                                    <textarea 
                                        placeholder={status === 'FAIL' ? "Describa la falla (Obligatorio)..." : "Observaciones opcionales..."}
                                        className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-accent outline-none resize-none"
                                        rows={2}
                                        value={comment}
                                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                    ></textarea>
                                    
                                    {status === 'FAIL' && (
                                        <button 
                                            onClick={() => openCorrectiveModal(item.id, item.label)}
                                            className="mt-2 w-full py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 hover:bg-red-100 flex items-center justify-center transition-colors"
                                        >
                                            <Siren size={14} className="mr-2"/> GENERAR AVISO DE AVERÍA
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 z-10">
                <button 
                    onClick={handleFinish}
                    className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center"
                >
                    <CheckCircle size={20} className="mr-2"/> Finalizar Inspección
                </button>
            </div>

            {/* Corrective Action Modal */}
            {correctiveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95">
                        <div className="p-5 border-b border-slate-100">
                            <h4 className="font-bold text-red-600 flex items-center text-lg">
                                <Siren size={24} className="mr-2"/> Reportar Avería
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">Item: {correctiveItemData?.label}</p>
                        </div>
                        <div className="p-5">
                            <label className="block text-xs font-bold text-slate-700 mb-2">Descripción del Problema</label>
                            <textarea 
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-red-200 outline-none"
                                placeholder="Detalle qué está fallando..."
                                value={correctiveDescription}
                                onChange={e => setCorrectiveDescription(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="p-5 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setCorrectiveModalOpen(false)} className="flex-1 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg">Cancelar</button>
                            <button onClick={confirmCorrectiveOrder} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-sm">Generar Aviso</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
