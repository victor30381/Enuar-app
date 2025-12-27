import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error('Sign in error:', err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Email o contraseña incorrectos');
            } else if (err.code === 'auth/invalid-email') {
                setError('Email inválido');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Demasiados intentos. Intenta más tarde.');
            } else {
                setError('Error al iniciar sesión');
            }
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error('Sign up error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este email ya está registrado');
            } else if (err.code === 'auth/weak-password') {
                setError('La contraseña debe tener al menos 6 caracteres');
            } else if (err.code === 'auth/invalid-email') {
                setError('Email inválido');
            } else {
                setError('Error al registrarse');
            }
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            await firebaseSignOut(auth);
        } catch (err) {
            console.error('Sign out error:', err);
            setError('Error al cerrar sesión');
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => setError(null);

    const value: AuthContextType = {
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
