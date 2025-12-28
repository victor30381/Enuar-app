import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';

const LoginScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { signIn, signUp, error, clearError } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();

        if (!email.trim() || !password.trim()) {
            setLocalError('Por favor completa todos los campos');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden');
            return;
        }

        if (!isLogin && password.length < 6) {
            setLocalError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
        } catch {
            // Error is handled by AuthProvider
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setLocalError(null);
        clearError();
        setConfirmPassword('');
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen w-full bg-wood-900 flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="absolute inset-0 bg-wood-pattern bg-cover opacity-20 pointer-events-none mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8 flex justify-center">
                    <img
                        src="logo.png"
                        alt="ENUAR W.O.D"
                        className="w-48 drop-shadow-2xl shadow-black"
                    />
                </div>
                <div className="font-bold tracking-[0.5em] text-sm md:text-lg text-white opacity-80 text-center -mt-6 mb-8">
                    W.O.D
                </div>

                {/* Login Card */}
                <div className="bg-neutral-900/95 border border-neon-orange/30 rounded-2xl shadow-[0_0_40px_rgba(255,95,31,0.2)] p-8 backdrop-blur-md">
                    <h2 className="text-2xl font-display text-white text-center mb-6 tracking-wider uppercase">
                        {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs text-neon-orange font-bold uppercase tracking-wider block">
                                Email
                            </label>
                            <div className="flex items-center gap-3 bg-black/40 border border-neutral-700 rounded-lg px-4 py-3 focus-within:border-neon-orange focus-within:ring-1 focus-within:ring-neon-orange/50 transition-all">
                                <Mail size={20} className="text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="bg-transparent border-none text-white w-full focus:outline-none placeholder-gray-600"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs text-neon-orange font-bold uppercase tracking-wider block">
                                Contraseña
                            </label>
                            <div className="flex items-center gap-3 bg-black/40 border border-neutral-700 rounded-lg px-4 py-3 focus-within:border-neon-orange focus-within:ring-1 focus-within:ring-neon-orange/50 transition-all">
                                <Lock size={20} className="text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-transparent border-none text-white w-full focus:outline-none placeholder-gray-600"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Confirm Password (only for signup) */}
                        {!isLogin && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs text-neon-orange font-bold uppercase tracking-wider block">
                                    Confirmar Contraseña
                                </label>
                                <div className="flex items-center gap-3 bg-black/40 border border-neutral-700 rounded-lg px-4 py-3 focus-within:border-neon-orange focus-within:ring-1 focus-within:ring-neon-orange/50 transition-all">
                                    <Lock size={20} className="text-gray-500" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="bg-transparent border-none text-white w-full focus:outline-none placeholder-gray-600"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {displayError && (
                            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                <AlertCircle size={18} className="shrink-0" />
                                <span>{displayError}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-neon-orange text-black font-bold rounded-lg hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,95,31,0.4)] text-sm uppercase tracking-wider disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-neon-orange"
                        >
                            {isSubmitting ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : isLogin ? (
                                <LogIn size={20} />
                            ) : (
                                <UserPlus size={20} />
                            )}
                            <span>{isSubmitting ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear Cuenta'}</span>
                        </button>
                    </form>

                    {/* Toggle Login/Signup */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={toggleMode}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-neon-orange transition-colors text-sm disabled:opacity-50"
                        >
                            {isLogin ? (
                                <>¿No tienes cuenta? <span className="font-bold text-neon-orange">Regístrate</span></>
                            ) : (
                                <>¿Ya tienes cuenta? <span className="font-bold text-neon-orange">Inicia Sesión</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-gray-500 text-xs">
                    CrossFit W.O.D Manager
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
