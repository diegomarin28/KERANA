import { useState } from "react";
import { supabase } from "../supabase";

export default function AuthModal_SignUp({ open, onClose, onSignedIn, onSwitchToSignIn }) {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!open) return null;

    // REGISTRO CON SUPABASE
    async function handleSubmit(e) {
        e.preventDefault();

        // Validaciones
        if (pwd !== confirmPwd) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (pwd.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: pwd,
                options: {
                    data: {
                        name: name.trim(), // Guardar nombre en metadata
                    }
                }
            });

            if (error) {
                setError(error.message);
            } else {
                setError("¡Cuenta creada! Revisa tu email para verificar tu cuenta.");
                // Limpiar formulario
                setName("");
                setEmail("");
                setPwd("");
                setConfirmPwd("");
            }
        } catch (err) {
            setError("Error inesperado: " + err.message);
        }

        setLoading(false);
    }

    // LOGIN CON GOOGLE
    async function handleGoogleSignup() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) setError("Error con Google: " + error.message);
        } catch (err) {
            setError("Error con Google: " + err.message);
        }
        setLoading(false);
    }

    // LOGIN CON GITHUB
    async function handleGitHubSignup() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) setError("Error con GitHub: " + error.message);
        } catch (err) {
            setError("Error con GitHub: " + err.message);
        }
        setLoading(false);
    }

    const handleSwitchToSignIn = () => {
        if (onSwitchToSignIn) {
            onSwitchToSignIn();
        }
    };

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
                role="dialog" aria-modal="true" aria-labelledby="signup-title"
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
                    <h3 id="signup-title" style={{ margin: 0 }}>Crear cuenta</h3>
                    <button onClick={onClose} aria-label="Cerrar"
                            style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>✖</button>
                </div>

                <div style={{ padding: 22 }}>
                    {/* Social (funcional) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                        <button onClick={handleGoogleSignup} disabled={loading} style={socBtn}>
                            {loading ? "..." : "Google"}
                        </button>
                        <button onClick={handleGitHubSignup} disabled={loading} style={socBtn}>
                            {loading ? "..." : "GitHub"}
                        </button>
                    </div>

                    <div style={{ textAlign: "center", color: "#6b7280", fontSize: 12, margin: "8px 0 16px" }}>
                        o con tu correo
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
                        <label style={label}>
                            Nombre completo
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Tu nombre completo"
                                style={input}
                            />
                        </label>
                        <label style={label}>
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="tu@email.com"
                                style={input}
                            />
                        </label>
                        <label style={label}>
                            Contraseña
                            <input
                                type="password"
                                value={pwd}
                                onChange={e => setPwd(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                                placeholder="Mínimo 6 caracteres"
                                style={input}
                            />
                        </label>
                        <label style={label}>
                            Confirmar contraseña
                            <input
                                type="password"
                                value={confirmPwd}
                                onChange={e => setConfirmPwd(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                                placeholder="Repite tu contraseña"
                                style={input}
                            />
                        </label>

                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                            Al crear una cuenta, aceptás nuestros{" "}
                            <a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb" }}>
                                términos y condiciones
                            </a> y{" "}
                            <a href="#" onClick={e => e.preventDefault()} style={{ color: "#2563eb" }}>
                                política de privacidad
                            </a>.
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...submitBtn,
                                backgroundColor: "#28a745",
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? "not-allowed" : "pointer"
                            }}
                        >
                            {loading ? "Creando cuenta..." : "Crear cuenta"}
                        </button>

                        <p style={{ textAlign: "center", margin: 0 }}>
                            ¿Ya tenés cuenta?{" "}
                            {onSwitchToSignIn ? (
                                <button
                                    type="button"
                                    onClick={handleSwitchToSignIn}
                                    disabled={loading}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                        fontSize: "inherit"
                                    }}
                                >
                                    Iniciar sesión
                                </button>
                            ) : (
                                <a href="/signin" style={{ color: "#2563eb" }}>Iniciar sesión</a>
                            )}
                        </p>
                    </form>

                    {/* Mensajes de error/éxito */}
                    {error && (
                        <div style={{
                            marginTop: 12,
                            padding: 12,
                            backgroundColor: error.includes("¡") || error.includes("creada") ? "#d4edda" : "#f8d7da",
                            color: error.includes("¡") || error.includes("creada") ? "#155724" : "#721c24",
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