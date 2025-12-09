
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Layers, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'LOGIN' | 'FORGOT'>('LOGIN');
    const [resetSent, setResetSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // El AuthContext detectará el cambio y redibujará la App
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Credenciales incorrectas.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Demasiados intentos fallidos. Intente más tarde.');
            } else {
                setError('Error al iniciar sesión. Intente nuevamente.');
            }
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Ingrese su email para restablecer la contraseña.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
            setLoading(false);
        } catch (err: any) {
            console.error(err);
            setError('No se pudo enviar el correo. Verifique que el email sea correcto.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 animate-in fade-in duration-700">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 relative">
                {/* Header */}
                <div className="bg-zinc-50 p-8 text-center border-b border-zinc-100">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Layers size={48} className="text-accent" />
                            <div className="absolute -bottom-1 w-full h-1 bg-black/10 blur-sm rounded-[100%]"></div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">PyME <span className="text-accent">ERP</span></h2>
                    <p className="text-sm text-zinc-500 mt-1">Acceso Seguro al Sistema</p>
                </div>

                {/* Form Body */}
                <div className="p-8">
                    {mode === 'LOGIN' ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center border border-red-100 animate-in slide-in-from-top-2">
                                    <AlertCircle size={16} className="mr-2 shrink-0"/> {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-3 text-zinc-400" />
                                    <input 
                                        type="email" 
                                        className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-zinc-50 focus:bg-white"
                                        placeholder="usuario@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-3 text-zinc-400" />
                                    <input 
                                        type="password" 
                                        className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all bg-zinc-50 focus:bg-white"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="text-right mt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => { setMode('FORGOT'); setError(''); }}
                                        className="text-xs text-accent hover:text-teal-700 font-medium transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-black hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <span className="flex items-center">Ingresar <ArrowRight size={18} className="ml-2"/></span>}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-5 animate-in slide-in-from-right-4">
                            {!resetSent ? (
                                <>
                                    <div className="text-center mb-4">
                                        <h3 className="font-bold text-zinc-800">Recuperar Contraseña</h3>
                                        <p className="text-sm text-zinc-500">Te enviaremos un enlace para restablecerla.</p>
                                    </div>
                                    
                                    {error && (
                                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center border border-red-100">
                                            <AlertCircle size={16} className="mr-2 shrink-0"/> {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Correo Electrónico</label>
                                            <div className="relative">
                                                <Mail size={18} className="absolute left-3 top-3 text-zinc-400" />
                                                <input 
                                                    type="email" 
                                                    className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-accent outline-none bg-zinc-50 focus:bg-white"
                                                    placeholder="usuario@empresa.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full bg-accent text-white py-3 rounded-xl font-bold shadow-md hover:bg-teal-700 transition-all flex items-center justify-center"
                                        >
                                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar Enlace'}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail size={32} className="text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-zinc-800">¡Correo Enviado!</h3>
                                    <p className="text-sm text-zinc-500 mt-2">Revisa tu bandeja de entrada para continuar con el proceso.</p>
                                </div>
                            )}

                            <button 
                                onClick={() => { setMode('LOGIN'); setError(''); setResetSent(false); }}
                                className="w-full text-slate-500 py-2 text-sm hover:text-slate-800 transition-colors"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-4 text-zinc-600 text-xs text-center opacity-50">
                &copy; {new Date().getFullYear()} PyME ERP System v1.1
            </div>
        </div>
    );
};
