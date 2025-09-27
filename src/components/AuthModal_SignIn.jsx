import { useState } from "react";
import { supabase } from "../supabase";

export default function AuthModal_SignIn({ open, onClose, onSignedIn }) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState("login"); // "login", "signup", "reset"

    // Estados para validaciones
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [checkingUsername, setCheckingUsername] = useState(false);

    if (!open) return null;

    // Verificar disponibilidad de username
    const checkUsernameAvailability = async (usernameToCheck) => {
        if (!usernameToCheck || usernameToCheck.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        setCheckingUsername(true);
        try {
            const { data, error } = await supabase.rpc('check_username_exists', {
                username_to_check: usernameToCheck
            });

            if (error) {
                console.error('Error verificando username:', error);
                setUsernameAvailable(null);
            } else {
                setUsernameAvailable(!data); // true si NO existe (está disponible)
            }
        } catch (err) {
            console.error('Error:', err);
            setUsernameAvailable(null);
        }
        setCheckingUsername(false);
    };



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
                if (error.message.includes('Invalid login credentials')) {
                    setError("Email o contraseña incorrectos");
                } else if (error.message.includes('Email not confirmed')) {
                    setError("Debes verificar tu email antes de iniciar sesión");
                } else {
                    setError(error.message);
                }
            } else {
                onSignedIn(data.user);
                onClose();
                clearForm();
            }
        } catch (err) {
            setError("Error inesperado: " + err.message);
        }

        setLoading(false);
    }

    // REGISTRO
    async function handleSignup(e) {
        e.preventDefault();
        setError("");

        // Validaciones
        if (!name.trim() || !email.trim() || !username.trim() || !pwd) {
            setError("Todos los campos son obligatorios");
            return;
        }

        if (username.length < 3) {
            setError("El nombre de usuario debe tener al menos 3 caracteres");
            return;
        }

        if (pwd.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (!usernameAvailable) {
            setError("El nombre de usuario no está disponible");
            return;
        }

        // Validar formato de username
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            setError("El nombre de usuario solo puede contener letras, números y guiones bajos");
            return;
        }

        setLoading(true);

        try {
            // Verificar si el email ya existe
            const emailExists = await checkEmailExists(email.trim());
            if (emailExists) {
                setError("Ya existe una cuenta con este email");
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: pwd,
                options: {
                    data: {
                        name: name.trim(),
                        username: username.trim().toLowerCase(),
                    },
                    // Configurar URL de confirmación
                    emailRedirectTo: `${window.location.origin}/auth/confirm`
                }
            });

            if (error) {
                if (error.message.includes('User already registered')) {
                    setError("Ya existe una cuenta con este email");
                } else {
                    setError(error.message);
                }
            } else {
                setError("¡Cuenta creada! Revisa tu email para verificar tu cuenta. Una vez verificada podrás iniciar sesión automáticamente.");
                clearForm();
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
                redirectTo: `${window.location.origin}/auth/reset-password`
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

    const clearForm = () => {
        setName("");
        setEmail("");
        setUsername("");
        setPwd("");
        setUsernameAvailable(null);
    };

    // OAuth functions...
    async function handleGoogleLogin() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) setError(error.message);
        } catch (err) {
            setError("Error con Google: " + err.message);
        }
        setLoading(false);
    }

    async function handleGitHubLogin() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
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
                        <div style={{ display: "grid", gap: 12 }}>
                            <label style={label}>
                                Email o nombre de usuario
                                <input type="text" value={email} onChange={e=>setEmail(e.target.value)}
                                       style={input} disabled={loading} placeholder="tu@email.com o tuusername"/>
                            </label>
                            <label style={label}>
                                Contraseña
                                <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)}
                                       style={input} disabled={loading}/>
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

                            <button onClick={handleLogin} disabled={loading} style={{...submitBtn, opacity: loading ? 0.7 : 1}}>
                                {loading ? "Ingresando..." : "Ingresar"}
                            </button>

                            <p style={{ textAlign: "center", margin: 0 }}>
                                ¿No tienes cuenta?
                                <button type="button" onClick={()=>setMode("signup")}
                                        style={{background:"none", border:"none", color:"#2563eb", cursor:"pointer", marginLeft: 5}}>
                                    Crear cuenta
                                </button>
                            </p>
                        </div>
                    )}

                    {/* FORMULARIO SIGNUP */}
                    {mode === "signup" && (
                        <div style={{ display: "grid", gap: 12 }}>
                            <label style={label}>
                                Nombre completo
                                <input type="text" value={name} onChange={e=>setName(e.target.value)}
                                       style={input} disabled={loading} placeholder="Juan Pérez"/>
                            </label>

                            <label style={label}>
                                Nombre de usuario
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => {
                                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                            setUsername(value);
                                            if (value.length >= 3) {
                                                checkUsernameAvailability(value);
                                            } else {
                                                setUsernameAvailable(null);
                                            }
                                        }}
                                        style={{
                                            ...input,
                                            paddingRight: 35,
                                            border: usernameAvailable === false ? '2px solid #ef4444' :
                                                usernameAvailable === true ? '2px solid #10b981' : input.border
                                        }}
                                        disabled={loading}
                                        placeholder="juanperez"
                                        minLength={3}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '14px'
                                    }}>
                                        {checkingUsername ? "..." :
                                            usernameAvailable === true ? "✓" :
                                                usernameAvailable === false ? "✗" : ""}
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                    Solo letras, números y guiones bajos. Mínimo 3 caracteres.
                                </div>
                            </label>

                            <label style={label}>
                                Email
                                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                                       style={input} disabled={loading} placeholder="tu@email.com"/>
                            </label>

                            <label style={label}>
                                Contraseña
                                <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)}
                                       style={input} disabled={loading} placeholder="Mínimo 6 caracteres" minLength={6}/>
                            </label>

                            <button onClick={handleSignup} disabled={loading || !usernameAvailable}
                                    style={{...submitBtn, opacity: (loading || !usernameAvailable) ? 0.7 : 1}}>
                                {loading ? "Creando cuenta..." : "Crear cuenta"}
                            </button>

                            <p style={{ textAlign: "center", margin: 0 }}>
                                ¿Ya tienes cuenta?
                                <button type="button" onClick={()=>setMode("login")}
                                        style={{background:"none", border:"none", color:"#2563eb", cursor:"pointer", marginLeft: 5}}>
                                    Iniciar sesión
                                </button>
                            </p>
                        </div>
                    )}

                    {/* FORMULARIO RESET PASSWORD */}
                    {mode === "reset" && (
                        <div style={{ display: "grid", gap: 12 }}>
                            <label style={label}>
                                Email
                                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                                       style={input} disabled={loading} placeholder="tu@email.com"/>
                            </label>

                            <button onClick={handleResetPassword} disabled={loading} style={{...submitBtn, opacity: loading ? 0.7 : 1}}>
                                {loading ? "Enviando..." : "Enviar email de reset"}
                            </button>

                            <p style={{ textAlign: "center", margin: 0 }}>
                                <button type="button" onClick={()=>setMode("login")}
                                        style={{background:"none", border:"none", color:"#2563eb", cursor:"pointer"}}>
                                    ← Volver al login
                                </button>
                            </p>
                        </div>
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