import { useState } from "react";
import { supabase } from "../supabase";

export default function AuthModal_SignIn({ open, onClose, onSignedIn }) {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState("login"); // "login", "signup", "reset"

    if (!open) return null;

    // LOGIN
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
                setError(error.message);
            } else {
                // Éxito - usuario logueado
                onSignedIn(data.user);
                onClose();
                setEmail("");
                setPwd("");
            }
        } catch (err) {
            setError("Error inesperado: " + err.message);
        }

        setLoading(false);
    }

    // REGISTRO
    async function handleSignup(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: pwd,
            });

            if (error) {
                setError(error.message);
            } else {
                setError("¡Cuenta creada! Revisa tu email para verificar tu cuenta.");
                // Mantener el modal abierto para que vea el mensaje
            }
        } catch (err) {
            setError("Error inesperado: " + err.message);
        }

        setLoading(false);
    }

    // RESET PASSWORD
    async function handleResetPassword(e) {
        e.preventDefault();
        if (!email.trim()) {
            setError("Ingresa tu email para resetear contraseña");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) {
                setError(error.message);
            } else {
                setError("Te enviamos un email para resetear tu contraseña.");
            }
        } catch (err) {
            setError("Error inesperado: " + err.message);
        }

        setLoading(false);
    }

    // LOGIN CON GOOGLE
    async function handleGoogleLogin() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) setError(error.message);
        } catch (err) {
            setError("Error con Google: " + err.message);
        }
        setLoading(false);
    }

    // LOGIN CON GITHUB
    async function handleGitHubLogin() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) setError(error.message);
        } catch (err) {
            setError("Error con GitHub: " + err.message);
        }
        setLoading(false);
    }

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                    zIndex: 4000
                }}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                role="dialog" aria-modal="true" aria-labelledby="auth-title"
                style={{
                    position: "fixed", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(92vw, 520px)", background: "#fff",
                    borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,.25)",
                    zIndex: 4010, overflow: "hidden"
                }}
            >
                <div style={{ padding: "18px 22px", borderBottom: "1px solid #eee",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 id="auth-title" style={{ margin: 0 }}>
                        {mode === "login" ? "Iniciar sesión" :
                            mode === "signup" ? "Crear cuenta" : "Resetear contraseña"}
                    </h3>
                    <button onClick={onClose} aria-label="Cerrar"
                            style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>✖</button>
                </div>

                <div style={{ padding: 22 }}>
                    {/* Social (funcional) */}
                    {mode !== "reset" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                            <button onClick={handleGoogleLogin} disabled={loading} style={socBtn}>
                                {loading ? "..." : "Google"}
                            </button>
                            <button onClick={handleGitHubLogin} disabled={loading} style={socBtn}>
                                {loading ? "..." : "GitHub"}
                            </button>
                        </div>
                    )}

                    <div style={{ textAlign: "center", color: "#6b7280", fontSize: 12, margin: "8px 0 16px" }}>
                        {mode === "reset" ? "Ingresa tu email" : "o con tu correo"}
                    </div>

                    {/* FORMULARIO LOGIN */}
                    {mode === "login" && (
                        <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
                            <label style={label}>
                                Email
                                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                                       required style={input} disabled={loading}/>
                            </label>
                            <label style={label}>
                                Contraseña
                                <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)}
                                       required style={input} disabled={loading}/>
                            </label>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input type="checkbox" /> Recordarme
                                </label>
                                <button type="button" onClick={()=>setMode("reset")}
                                        style={{background:"none", border:"none", color:"#2563eb", cursor:"pointer"}}>
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <button type="submit" disabled={loading} style={{...submitBtn, opacity: loading ? 0.7 : 1}}>
                                {loading ? "Ingresando..." : "Ingresar"}
                            </button>

                            <p style={{ textAlign: "center", margin: 0 }}>
                                ¿No tenés cuenta?
                                <button type="button" onClick={()=>setMode("signup")}
                                        style={{background:"none", border:"none", color:"#2563eb", cursor:"pointer", marginLeft: 5}}>
                                    Crear cuenta
                                </button>
                            </p>
                        </form>
                    )}

                    {/* FORMULARIO SIGNUP */}
                    {mode === "signup" && (
                        <form onSubmit={handleSignup} style={{ display: "grid", gap: 12 }}>
                            <label style={label}>
                                Email
                                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                                       required style={input} disabled={loading}/>
                            </label>
                            <label style={label}>
                                Contraseña (mínimo 6 caracteres)
                                <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)}
                                       required minLength={6} style={input} disabled={loading}/>
                            </label>

                            <button type="submit" disabled={loading} style={{...submitBtn, opacity: loading ? 0.7 : 1}}>
                                {loading ? "Creando cuenta..." : "Crear cuenta"}
                            </button>

                            <p style={{ textAlign: "center", margin: 0 }}>
                                ¿Ya tenés cuenta?
                                <button type="button" onClick={()=>setMode("login")}
                                        style={{background:"none", border:"none", color:"#2563eb", cursor:"pointer", marginLeft: 5}}>
                                    Iniciar sesión
                                </button>
                            </p>
                        </form>
                    )}

                    {/* FORMULARIO RESET PASSWORD */}
                    {mode === "reset" && (
                        <form onSubmit={handleResetPassword} style={{ display: "grid", gap: 12 }}>
                            <label style={label}>
                                Email
                                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                                       required style={input} disabled={loading}/>
                            </label>

                            <button type="submit" disabled={loading} style={{...submitBtn, opacity: loading ? 0.7 : 1}}>
                                {loading ? "Enviando..." : "Enviar email de reset"}
                            </button>

                            <p style={{ textAlign: "center", margin: 0 }}>
                                <button type="button" onClick={()=>setMode("login")}
                                        style={{background:"none", border:"none", color:"#2563eb", cursor:"pointer"}}>
                                    ← Volver al login
                                </button>
                            </p>
                            <p style={{ marginTop: 10, fontSize: 14 }}>
                                ¿No tenés cuenta?{" "}
                                <button onClick={onSwitchToSignUp} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
                                    Crear cuenta
                                </button>
                            </p>

                        </form>
                    )}

                    {/* Mensajes de error/éxito */}
                    {error && (
                        <div style={{
                            marginTop: 12,
                            padding: 12,
                            backgroundColor: error.includes("¡") || error.includes("Te enviamos") ? "#d4edda" : "#f8d7da",
                            color: error.includes("¡") || error.includes("Te enviamos") ? "#155724" : "#721c24",
                            borderRadius: 6,
                            fontSize: 14
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const socBtn = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600
};
const label = { display: "grid", gap: 6, fontSize: 14 };
const input = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    outline: "none"
};
const submitBtn = {
    padding: "12px 16px",
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(37,99,235,.35)"
};
