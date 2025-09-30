import { useState } from "react";
import { supabase } from "../supabase";

export default function AuthModal_SignIn({ open, onClose, onSignedIn }) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState("login");

    if (!open) return null;

    const clearForm = () => {
        setEmail("");
        setName("");
        setPwd("");
        setError("");
    };

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: pwd,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setError("Email o contraseña incorrectos");
                } else if (error.message.includes('Email not confirmed')) {
                    setError("Debes verificar tu email antes de iniciar sesión");
                } else {
                    setError("Error al iniciar sesión: " + error.message);
                }
                return;
            }

            onSignedIn(data.user);
            onClose();
            clearForm();

        } catch (err) {
            setError("Error inesperado al iniciar sesión");
        } finally {
            setLoading(false);
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        setError("");

        if (!name.trim() || !email.trim() || !pwd) {
            setError("Todos los campos son obligatorios");
            return;
        }

        if (pwd.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: pwd,
                options: {
                    data: {
                        name: name.trim(),
                    },
                    emailRedirectTo: `${window.location.origin}/auth/confirm`
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('usuario')
                    .insert([{
                        correo: email.trim(),
                        nombre: name.trim(),
                        username: email.split('@')[0],
                        fecha_creado: new Date().toISOString(),
                        creditos: 0
                    }]);

                if (profileError && !profileError.message.includes('duplicate key')) {
                    console.error('Error creando perfil:', profileError);
                }

                setError("¡Cuenta creada exitosamente! Revisa tu email para verificar.");
                setTimeout(() => {
                    setMode('login');
                    clearForm();
                }, 2000);
            }

        } catch (err) {
            if (err.message.includes('User already registered')) {
                setError("Ya existe una cuenta con este email");
            } else {
                setError("Error creando la cuenta: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    // OAuth con Google - entra directo sin verificación
    async function handleGoogleLogin() {
        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/confirm`
                }
            });

            if (error) {
                setError("Error con Google: " + error.message);
                setLoading(false);
            }
        } catch (err) {
            setError("Error conectando con Google");
            setLoading(false);
        }
    }

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                    zIndex: 4000, backdropFilter: "blur(4px)"
                }}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(90vw, 400px)",
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 20px 60px rgba(0,0,0,.3)",
                    zIndex: 4010,
                    overflow: "hidden"
                }}
            >
                <div style={{
                    padding: "20px 24px 16px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white"
                }}>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                        {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                    </h3>
                </div>

                <div style={{ padding: "24px" }}>
                    {/* Botón OAuth - Solo Google */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e1e5e9",
                            borderRadius: "8px",
                            background: "#fff",
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            opacity: loading ? 0.6 : 1,
                            marginBottom: "16px"
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"/>
                            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z"/>
                            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z"/>
                            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3Z"/>
                        </svg>
                        Continuar con Google
                    </button>

                    <div style={{
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: "12px",
                        margin: "12px 0",
                        position: "relative"
                    }}>
                        <div style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            right: 0,
                            height: "1px",
                            background: "#e5e7eb"
                        }} />
                        <span style={{ background: "#fff", padding: "0 12px", position: "relative" }}>
                            o con tu email
                        </span>
                    </div>

                    {/* FORMULARIO LOGIN */}
                    {mode === "login" && (
                        <form onSubmit={handleLogin} style={{ display: "grid", gap: "12px" }}>
                            <input
                                type="email"
                                value={email}
                                onChange={e=>setEmail(e.target.value)}
                                style={inputStyle}
                                disabled={loading}
                                placeholder="Tu email"
                                required
                            />

                            <input
                                type="password"
                                value={pwd}
                                onChange={e=>setPwd(e.target.value)}
                                style={inputStyle}
                                disabled={loading}
                                placeholder="Tu contraseña"
                                required
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    ...submitBtn,
                                    opacity: loading ? 0.7 : 1,
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                }}
                            >
                                {loading ? "Ingresando..." : "Ingresar"}
                            </button>

                            <p style={{ textAlign: "center", margin: 0, fontSize: "14px", color: "#6b7280" }}>
                                ¿No tienes cuenta?{" "}
                                <button
                                    type="button"
                                    onClick={()=>setMode("signup")}
                                    style={{
                                        background:"none",
                                        border:"none",
                                        color:"#667eea",
                                        cursor:"pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    Crear cuenta
                                </button>
                            </p>
                        </form>
                    )}

                    {/* FORMULARIO SIGNUP */}
                    {mode === "signup" && (
                        <form onSubmit={handleSignup} style={{ display: "grid", gap: "12px" }}>
                            <input
                                type="text"
                                value={name}
                                onChange={e=>setName(e.target.value)}
                                style={inputStyle}
                                disabled={loading}
                                placeholder="Tu nombre completo"
                                required
                            />

                            <input
                                type="email"
                                value={email}
                                onChange={e=>setEmail(e.target.value)}
                                style={inputStyle}
                                disabled={loading}
                                placeholder="Tu email"
                                required
                            />

                            <input
                                type="password"
                                value={pwd}
                                onChange={e=>setPwd(e.target.value)}
                                style={inputStyle}
                                disabled={loading}
                                placeholder="Contraseña (mín. 6 caracteres)"
                                minLength={6}
                                required
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    ...submitBtn,
                                    opacity: loading ? 0.7 : 1,
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                }}
                            >
                                {loading ? "Creando cuenta..." : "Crear cuenta"}
                            </button>

                            <p style={{ textAlign: "center", margin: 0, fontSize: "14px", color: "#6b7280" }}>
                                ¿Ya tienes cuenta?{" "}
                                <button
                                    type="button"
                                    onClick={()=>setMode("login")}
                                    style={{
                                        background:"none",
                                        border:"none",
                                        color:"#667eea",
                                        cursor:"pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    Iniciar sesión
                                </button>
                            </p>
                        </form>
                    )}

                    {/* Mensajes de error/éxito */}
                    {error && (
                        <div style={{
                            marginTop: "12px",
                            padding: "10px 12px",
                            backgroundColor: error.includes("¡") ? "#d1fae5" : "#fee2e2",
                            color: error.includes("¡") ? "#065f46" : "#991b1b",
                            borderRadius: "8px",
                            fontSize: "13px",
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const inputStyle = {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #e1e5e9",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontSize: "14px"
};

const submitBtn = {
    padding: "12px 16px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    fontSize: "14px"
};