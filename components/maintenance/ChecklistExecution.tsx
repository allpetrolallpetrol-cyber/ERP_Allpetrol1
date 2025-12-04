
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { useMasterData } from '../../contexts/MasterDataContext';
import { Asset, AssetType, ChecklistExecution as ChecklistExecutionType } from '../../types';
import { QrCode, Camera, X, ArrowRight, ChevronLeft, ChevronRight, Cog, Truck, ThumbsDown, Minus, ThumbsUp, Siren, ClipboardCheck, AlertTriangle, Search, Calendar, FileText, Printer, CheckCircle, Eye } from 'lucide-react';

type CheckStatus = 'PENDING' | 'OK' | 'FAIL';

export const ChecklistExecution = ({ onQuickCorrectiveOrder, onBack }: { onQuickCorrectiveOrder: (assetId: string, description: string) => void, onBack: () => void }) => {
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

    const confirmCorrectiveOrder = () => {
        if (!identifiedAsset || !correctiveItemData) return;
        if (!correctiveDescription.trim()) {
            alert("Debe describir la falla detectada.");
            return;
        }

        const fullDesc = `[FALLA CHECKLIST] ${correctiveItemData.label}\nObservación: ${correctiveDescription}`;
        onQuickCorrectiveOrder(identifiedAsset.id, fullDesc);
        
        handleCommentChange(correctiveItemData.id, correctiveDescription);

        setCorrectiveModalOpen(false);
        setCorrectiveItemData(null);
        setCorrectiveDescription('');
        alert("Aviso de Avería generado correctamente. Puede continuar con el checklist.");
    };

    const handleFinish = () => {
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
            addChecklistExecution(execution);

            alert("Checklist finalizado y guardado exitosamente.");
            setStep('IDENTIFY');
            setIdentifiedAsset(null);
            setAssetInput('');
            setSelectedModelId('');
            setResults({});
            // Reset Date Filter to today (Local) to show the new one immediately
            setHistoryDate(getLocalDateStr(new Date()));
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
                            <div className="w-full md:w-64 aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                <button onClick={stopCamera} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><X size={16}/></button>
                                <button onClick={simulateScan} className="absolute bottom-2 bg-white/90 text-slate-900 text-xs px-2 py-1 rounded">Simular</button>
                            </div>
                        ) : (
                             <button 
                                onClick={startCamera}
                                className="w-full md:w-auto px-6 py-4 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                            >
                                <Camera size={24} className="mb-1"/>
                                <span className="text-sm font-medium">Escanear QR</span>
                            </button>
                        )}

                        {/* Input Area */}
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ingrese Código o Patente del Activo</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-accent outline-none bg-white text-slate-900 shadow-sm"
                                        placeholder="Ej. TR-01"
                                        value={assetInput}
                                        onChange={e => setAssetInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleIdentify()}
                                    />
                                    <Search className="absolute left-3 top-4 text-slate-400" size={20}/>
                                </div>
                                <button onClick={handleIdentify} className="bg-slate-900 text-white px-6 rounded-lg font-bold hover:bg-slate-800 shadow-md">
                                    <ArrowRight size={24} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Ingrese el código manual si la cámara no está disponible.
                            </p>
                        </div>
                    </div>
                </div>

                {/* BOTTOM: HISTORY & REPORTS */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-slate-800 flex items-center">
                            <FileText className="mr-2 text-slate-500"/> Historial de Reportes
                        </h3>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                            {/* Date Filter */}
                            <div className="relative">
                                <input 
                                    type="date"
                                    className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none bg-white"
                                    value={historyDate}
                                    onChange={(e) => setHistoryDate(e.target.value)}
                                />
                                <Calendar className="absolute left-2.5 top-2 text-slate-400" size={14}/>
                            </div>
                            
                            {/* Text Filter */}
                            <div className="relative flex-1 md:flex-none">
                                <input 
                                    type="text" 
                                    placeholder="Buscar activo..." 
                                    className="w-full md:w-48 pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none bg-white"
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                />
                                <Search className="absolute left-2.5 top-2 text-slate-400" size={14}/>
                            </div>
                            
                            {/* Clear Filters */}
                            {(historyDate || historySearch) && (
                                <button 
                                    onClick={() => { setHistoryDate(''); setHistorySearch(''); }}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                    title="Limpiar filtros"
                                >
                                    <X size={18}/>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                                <tr>
                                    <th className="p-3">Hora</th>
                                    <th className="p-3">Activo</th>
                                    <th className="p-3 hidden md:table-cell">Modelo</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.length > 0 ? filteredHistory.map(exec => (
                                    <tr key={exec.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-3 text-slate-600 font-mono">
                                            {new Date(exec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            <div className="text-[10px] text-slate-400 md:hidden">{new Date(exec.timestamp).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-3 font-medium text-slate-800">
                                            {exec.assetName}
                                            <div className="text-[10px] text-slate-400 md:hidden">{exec.modelName}</div>
                                        </td>
                                        <td className="p-3 text-slate-500 hidden md:table-cell">{exec.modelName}</td>
                                        <td className="p-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                exec.globalStatus === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {exec.globalStatus === 'PASS' ? 'OK' : 'Falla'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => setSelectedHistoryItem(exec)} className="text-accent hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Ver Detalle">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                            No se encontraron reportes para {historyDate ? 'esta fecha' : 'los filtros aplicados'}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Select Model View
    if (step === 'SELECT_MODEL') {
        return (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-slate-200 mt-10 animate-in fade-in">
                <button onClick={() => setStep('IDENTIFY')} className="mb-4 text-slate-400 hover:text-slate-700 flex items-center"><ChevronLeft size={16} className="mr-1"/> Cambiar Activo</button>
                
                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        {identifiedAsset?.type === AssetType.MACHINE ? <Cog size={32} className="text-blue-600"/> : <Truck size={32} className="text-blue-600"/>}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{identifiedAsset?.name}</h3>
                        <p className="text-sm text-slate-500">{identifiedAsset?.code} • {identifiedAsset?.brand} {identifiedAsset?.model}</p>
                    </div>
                </div>

                <h4 className="font-bold text-slate-700 mb-4">Seleccione Checklist a realizar:</h4>
                <div className="space-y-3">
                    {compatibleModels.map(m => (
                        <button 
                            key={m.id}
                            onClick={() => handleSelectModel(m.id)}
                            className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-accent hover:shadow-md transition-all flex justify-between items-center group bg-slate-50 hover:bg-white"
                        >
                            <span className="font-semibold text-slate-700 group-hover:text-accent">{m.name}</span>
                            <ChevronRight size={20} className="text-slate-300 group-hover:text-accent" />
                        </button>
                    ))}
                    {compatibleModels.length === 0 && (
                        <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No hay modelos de checklist configurados para este tipo de activo ({identifiedAsset?.type} - {identifiedAsset?.subtype}).
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 4. Execution View (Checklist Form)
    const model = checklistModels.find(m => m.id === selectedModelId);
    
    return (
        <div className="relative max-w-3xl mx-auto">
            {/* Main Checklist UI */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 mt-6 flex flex-col h-[calc(100vh-150px)] animate-in slide-in-from-right-8">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-slate-800">{model?.name}</h3>
                        <p className="text-xs text-slate-500">Inspeccionando: <b>{identifiedAsset?.name}</b> ({identifiedAsset?.code})</p>
                    </div>
                    <button onClick={() => setStep('SELECT_MODEL')} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
                </div>

                {/* Scrollable Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {model?.items.map((item, idx) => {
                        const res = results[item.id];
                        const status = res?.status || 'PENDING';
                        const isCriticalFail = item.isCritical && status === 'FAIL';

                        return (
                            <div key={item.id} className={`p-4 rounded-xl border-2 transition-all ${isCriticalFail ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            <h4 className="font-semibold text-slate-800">{item.label}</h4>
                                            {item.isCritical && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200">CRÍTICO</span>}
                                        </div>
                                    </div>
                                    
                                    {/* 3-State Toggle */}
                                    <div 
                                        onClick={() => handleToggle(item.id, status)}
                                        className={`relative w-24 h-8 rounded-full cursor-pointer transition-colors shadow-inner flex items-center justify-between px-2 select-none ${
                                            status === 'PENDING' ? 'bg-slate-200' : 
                                            status === 'OK' ? 'bg-green-100' : 'bg-red-100'
                                        }`}
                                    >
                                        <ThumbsDown size={14} className={`z-10 ${status === 'FAIL' ? 'text-red-600' : 'text-slate-400'}`} />
                                        <Minus size={14} className={`z-10 ${status === 'PENDING' ? 'text-slate-600' : 'text-slate-300'}`} />
                                        <ThumbsUp size={14} className={`z-10 ${status === 'OK' ? 'text-green-600' : 'text-slate-400'}`} />
                                        
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                                            status === 'FAIL' ? 'left-1' : 
                                            status === 'PENDING' ? 'left-1/2 -translate-x-1/2' : 
                                            'right-1 translate-x-0'
                                        } ${
                                            status === 'FAIL' ? 'border-2 border-red-500' : 
                                            status === 'OK' ? 'border-2 border-green-500' : 'border border-slate-300'
                                        }`}></div>
                                    </div>
                                </div>

                                {/* Fail Context */}
                                {status === 'FAIL' && (
                                    <div className="mt-3 animate-in fade-in">
                                        <textarea 
                                            className={`w-full p-2 text-sm border rounded-lg outline-none focus:ring-2 bg-white ${isCriticalFail ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-slate-200'}`}
                                            placeholder={item.isCritical ? "Describa la falla (Obligatorio)..." : "Observaciones (opcional)..."}
                                            value={res?.comment || ''}
                                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                        />
                                        <div className="mt-2 flex justify-end">
                                            <button 
                                                onClick={() => openCorrectiveModal(item.id, item.label)}
                                                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 flex items-center shadow-sm"
                                            >
                                                <Siren size={12} className="mr-1" /> Generar Aviso Correctivo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                        Completado: {Object.values(results).filter(r => r.status !== 'PENDING').length} / {model?.items.length}
                    </div>
                    <button 
                        onClick={handleFinish}
                        className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-md transition-transform active:scale-95 flex items-center"
                    >
                        <ClipboardCheck size={20} className="mr-2" /> Finalizar Inspección
                    </button>
                </div>
            </div>

            {/* Corrective Action Modal */}
            {correctiveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                            <h4 className="text-lg font-bold text-red-800 flex items-center">
                                <AlertTriangle className="mr-2" /> Generar Aviso de Avería
                            </h4>
                            <button onClick={() => setCorrectiveModalOpen(false)} className="text-red-400 hover:text-red-700">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase">Activo</p>
                                <p className="font-bold text-slate-800">{identifiedAsset?.name} <span className="font-normal text-slate-500">({identifiedAsset?.code})</span></p>
                            </div>
                            
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Item de Falla</p>
                                <p className="text-sm font-medium text-slate-700 p-2 bg-slate-50 border border-slate-200 rounded">{correctiveItemData?.label}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Descripción del Problema</label>
                                <textarea 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-200 outline-none bg-white h-32 text-slate-800"
                                    placeholder="Detalle la avería, ruidos, fugas, etc..."
                                    value={correctiveDescription}
                                    onChange={(e) => setCorrectiveDescription(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50">
                            <button onClick={() => setCorrectiveModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium">Cancelar</button>
                            <button onClick={confirmCorrectiveOrder} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md">
                                Crear Aviso
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
