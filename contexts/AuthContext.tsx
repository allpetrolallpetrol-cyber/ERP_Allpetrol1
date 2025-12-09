
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    User as FirebaseUser, 
    signOut 
} from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
    currentUser: FirebaseUser | null;
    userProfile: User | null; // El perfil de negocio (permisos, área, etc)
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            if (user && user.email) {
                // Si hay usuario de Firebase, buscamos su perfil en Firestore
                // Escuchamos en tiempo real por si le cambian permisos mientras está logueado
                const q = query(collection(db, 'users'), where('email', '==', user.email));
                
                // NOTA: Usamos onSnapshot para que si un admin le cambia el rol, se actualice en vivo
                const unsubProfile = onSnapshot(q, (snapshot) => {
                    if (!snapshot.empty) {
                        const userData = snapshot.docs[0].data() as User;
                        setUserProfile({ ...userData, id: snapshot.docs[0].id });
                    } else {
                        // Caso raro: Está en Firebase Auth pero no en la colección 'users'
                        // Podríamos setear un perfil dummy o dejarlo null
                        console.warn("Usuario autenticado sin perfil en DB:", user.email);
                        setUserProfile(null);
                    }
                    setLoading(false);
                });
                
                return () => unsubProfile(); // Cleanup listener interno
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, userProfile, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
