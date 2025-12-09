
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, AlertTriangle, HelpCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ConfirmDialog {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
    resolve?: (value: boolean) => void;
}

interface UIContextType {
    showToast: (message: string, type?: ToastType) => void;
    showConfirm: (title: string, message: string, type?: 'danger' | 'info', confirmText?: string) => Promise<boolean>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};

export const UIProvider = ({ children }: { children?: ReactNode }) => {
    // --- TOAST STATE ---
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // --- CONFIRM MODAL STATE ---
    const [dialog, setDialog] = useState<ConfirmDialog>({
        isOpen: false,
        title: '',
        message: ''
    });

    const showConfirm = useCallback((title: string, message: string, type: 'danger' | 'info' = 'info', confirmText: string = 'Confirmar'): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialog({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                resolve
            });
        });
    }, []);

    const handleConfirm = () => {
        if (dialog.resolve) dialog.resolve(true);
        setDialog({ ...dialog, isOpen: false });
    };

    const handleCancel = () => {
        if (dialog.resolve) dialog.resolve(false);
        setDialog({ ...dialog, isOpen: false });
    };

    return (
        <UIContext.Provider value={{ showToast, showConfirm }}>
            {children}
            
            {/* --- RENDER TOASTS --- */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div 
                        key={t.id} 
                        className={`pointer-events-auto flex items-center p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-10 fade-in duration-300 min-w-[300px] ${
                            t.type === 'success' ? 'bg-white border-green-500 text-slate-800' : 
                            t.type === 'error' ? 'bg-white border-red-500 text-slate-800' : 
                            'bg-white border-blue-500 text-slate-800'
                        }`}
                    >
                        <div className={`p-2 rounded-full mr-3 ${
                            t.type === 'success' ? 'bg-green-100 text-green-600' : 
                            t.type === 'error' ? 'bg-red-100 text-red-600' : 
                            'bg-blue-100 text-blue-600'
                        }`}>
                            {t.type === 'success' && <CheckCircle size={20} />}
                            {t.type === 'error' && <AlertCircle size={20} />}
                            {t.type === 'info' && <HelpCircle size={20} />}
                        </div>
                        <div className="flex-1 font-medium text-sm">{t.message}</div>
                        <button onClick={() => removeToast(t.id)} className="ml-2 text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* --- RENDER CONFIRM MODAL --- */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
                                dialog.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-accent'
                            }`}>
                                {dialog.type === 'danger' ? <AlertTriangle size={32} /> : <HelpCircle size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{dialog.title}</h3>
                            <p className="text-slate-500">{dialog.message}</p>
                        </div>
                        <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={handleCancel}
                                className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirm}
                                className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-md transition-all transform active:scale-95 ${
                                    dialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-accentHover'
                                }`}
                            >
                                {dialog.confirmText || 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </UIContext.Provider>
    );
};
