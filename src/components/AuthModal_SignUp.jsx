// src/components/AuthModal_SignUp.jsx
import { useState } from "react";
import { supabase } from "../supabase";

export default function AuthModal_SignUp({ open, onClose, onSignedIn, onSwitchToSignIn }) {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(""); // ✅ mensaje de éxito (“revisá tu email…”)

    if (!open) return null;

    const SITE_URL = import.meta.env?.VITE_PUBLIC_SITE_URL || window.location.origin;
    const emailRedirectTo = `${SITE_URL}/auth/confirm`; // ✅ Confirm page

    // REGISTRO CON SUPABASE
    async function handleSubmit(e) {
        e.preventDefault();
        if (loading) return;

        // Validaciones
        const trimmedEmail = email.trim();
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Ingresá tu nombre completo");
            return;
        }
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
        setSuccess("");

        try {
            const { error: signErr } = await supabase.auth.signUp({
                email: trimmedEmail,
                password: pwd,
                options: {
                    emailRedirectTo,            // ✅ el link del mail llegará aquí
                    data: { name: trimmedName } // guardamos nombre en user_metadata
                }
            });

            if (signErr) {
                // Mensaje amigable para duplicado
                if (signErr.message?.toLowerCase().includes("already registered")) {
                    setError("Ya existe una cuenta con este email.");
                } else {
                    setError(signErr.message || "No se pudo crear la cuenta.");
                }
                return;
            }

            // ✅ Mostrar estado “éxito” y dejar al usuario ir al mail
            setSuccess("¡Cuenta creada! Revisá tu email para verificarla y finalizar el acceso.");
            setName("");
            setEmail("");
            setPwd("");
            setConfirmPwd("");
        } catch (err) {
            setError("Error inesperado: " + (err?.message || "Intentalo de nuevo"));
        } finally {
            setLoading(false);
        }
    }

    // OAUTH (redirige también a /auth/confirm)
    async function handleOAuth(provider) {
        if (loading) return;
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const { error: oerr } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: emailRedirectTo // ✅ volvemos a /auth/confirm, que hace login y redirige al panel
                }
            });
            if (oerr) setError(`Error con ${provider}: ${oerr.message}`);
        } catch (err) {
            setError(`Error con ${provider}: ${err?.message || "Intentalo de nuevo"}`);
        } finally {
            setLoading(false);
        }
    }

    const handleSwitchToSignIn = () => {
        if (onSwitchToSignIn) onSwitchToSignIn();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 4000 }}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="signup-title"
                style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(92vw, 520px)",
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 12px 30px rgba(0,0,0,.25)",
                    zIndex: 4010,
                    overflow: "hidden"
                }}
            >
                <div
                    style={{
                        padding: "18px 22px",
                        borderBottom: "1px solid #eee",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                >
                    <h3 id="signup-title" style={{ margin: 0 }}>Crear cuenta</h3>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}
                    >
                        ✖
                    </button>
                </div>

                <div style={{ padding: 22 }}>
                    {/* Social */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                        <button onClick={() => handleOAuth('google')} disabled={loading} style={socBtn}>
                            {loading ? "..." : "Google"}
                        </button>
                        <button onClick={() => handleOAuth('github')} disabled={loading} style={socBtn}>
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

                    {/* Mensajes */}
                    {(error || success) && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: 12,
                                backgroundColor: success ? "#d4edda" : "#f8d7da",
                                color: success ? "#155724" : "#721c24",
                                borderRadius: 6,
                                fontSize: 14
                            }}
                        >
                            {success || error}
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
