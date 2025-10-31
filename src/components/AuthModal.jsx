import { useState } from "react";
import { supabase } from "../supabase";
import { Button } from "../components/UI/Button";

export default function AuthModal({ open, onClose, onSuccess }) {
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    if (!open) return null;

    const clearForm = () => {
        setEmail("");
        setName("");
        setUsername("");
        setPassword("");
        setError("");
        setSuccess("");
    };

    const handleClose = () => {
        clearForm();
        setMode("login");
        onClose();
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    setError("Email o contraseña incorrectos");
                } else if (authError.message.includes('Email not confirmed')) {
                    setError("Debés verificar tu email antes de iniciar sesión");
                } else {
                    setError("Error al iniciar sesión: " + authError.message);
                }
                return;
            }

            setSuccess("¡Sesión iniciada correctamente!");
            setTimeout(() => {
                onSuccess?.(data.user);
                handleClose();
            }, 1000);

        } catch (err) {
            setError("Error inesperado al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name.trim() || !username.trim() || !email.trim() || !password) {
            setError("Todos los campos son obligatorios");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        // Validación de contraseña: minúscula, mayúscula y número
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
        if (!passwordRegex.test(password)) {
            setError("La contraseña debe contener al menos: una minúscula (a-z), una mayúscula (A-Z) y un número (0-9)");
            return;
        }

        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        name: name.trim(),
                        username: username.trim(),
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (authError) {
                // Error: Email duplicado
                if (authError.message.includes('User already registered') ||
                    authError.message.includes('already been registered')) {
                    setError("Ya tienes una cuenta de Kerana");
                }
                // Error: Contraseña débil
                else if (authError.message.includes('Password should contain') ||
                    authError.message.includes('abcdefghijklmnopqrstuvwxyz')) {
                    setError("La contraseña debe contener al menos: una minúscula (a-z), una mayúscula (A-Z) y un número (0-9)");
                }
                else {
                    setError(authError.message);
                }
                return;
            }

            if (authData.user) {
                // Crear perfil en la tabla usuario
                const { error: profileError } = await supabase
                    .from('usuario')
                    .insert([{
                        auth_id: authData.user.id,
                        correo: email.trim(),
                        nombre: name.trim(),
                        username: username.trim(),
                        fecha_creado: new Date().toISOString(),
                        creditos: 0
                    }]);

                if (profileError && !profileError.message.includes('duplicate key')) {
                    console.error('Error creando perfil:', profileError);
                }

                setSuccess("¡Cuenta creada! Revisá tu email para verificarla.");
                setTimeout(() => {
                    setMode('login');
                    clearForm();
                }, 3000);
            }

        } catch (err) {
            setError("Error inesperado creando la cuenta");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
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
    };

    return (
        <>
            {/* Overlay fijo - sin scroll */}
            <div
                onClick={handleClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    zIndex: 4000,
                    backdropFilter: "blur(4px)",
                    overflow: "hidden"
                }}
                aria-hidden="true"
            />

            {/* Modal fijo - sin scroll */}
            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(90vw, 420px)",
                    maxHeight: "90vh",
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    zIndex: 4010,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "24px 24px 20px",
                    background: "linear-gradient(135deg, #13346b 0%, #2563eb 100%)",
                    color: "white",
                    textAlign: "center",
                    flexShrink: 0
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: "20px",
                        fontWeight: "700",
                        marginBottom: "4px"
                    }}>
                        {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: "14px",
                        opacity: 0.9,
                        fontWeight: 400
                    }}>
                        {mode === "login"
                            ? "Ingresá a tu cuenta"
                            : "Creá tu cuenta en segundos"
                        }
                    </p>
                </div>

                {/* Contenido con scroll */}
                <div style={{
                    padding: "24px",
                    overflowY: "auto",
                    flexGrow: 1
                }}>
                    {/* Botón Google */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            background: "#fff",
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#374151",
                            transition: "all 0.2s ease",
                            opacity: loading ? 0.6 : 1,
                            marginBottom: "20px"
                        }}
                        onMouseEnter={(e) => !loading && (e.target.style.background = "#f8fafc")}
                        onMouseLeave={(e) => e.target.style.background = "#fff"}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"/>
                            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z"/>
                            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z"/>
                            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3Z"/>
                        </svg>
                        Continuar con Google
                    </button>

                    {/* Separador */}
                    <div style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: "14px",
                        margin: "20px 0",
                        position: "relative"
                    }}>
                        <div style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            right: 0,
                            height: "1px",
                            background: "#e2e8f0"
                        }} />
                        <span style={{
                            background: "#fff",
                            padding: "0 16px",
                            position: "relative",
                            fontWeight: 500
                        }}>
                            o con email
                        </span>
                    </div>

                    {/* Formularios */}
                    <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: "grid", gap: "16px" }}>

                        {mode === "signup" && (
                            <>
                                <div>
                                    <label style={labelStyle}>Nombre completo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={inputStyle}
                                        disabled={loading}
                                        placeholder="Tu nombre"
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Nombre de usuario</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                        style={inputStyle}
                                        disabled={loading}
                                        placeholder="usuario123"
                                        required
                                    />
                                    <p style={{
                                        margin: "6px 0 0 0",
                                        fontSize: "12px",
                                        color: "#64748b"
                                    }}>
                                        Tu username único en Kerana
                                    </p>
                                </div>
                            </>
                        )}

                        <div>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={inputStyle}
                                disabled={loading}
                                placeholder="tu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={inputStyle}
                                disabled={loading}
                                placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                                minLength={mode === "signup" ? 6 : undefined}
                                required
                            />
                            {mode === "signup" && (
                                <p style={{
                                    margin: "6px 0 0 0",
                                    fontSize: "12px",
                                    color: "#64748b"
                                }}>
                                    Debe incluir: minúsculas, mayúsculas y números
                                </p>
                            )}
                        </div>

                        {/* Mensajes */}
                        {error && (
                            <div style={messageStyle.error}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={messageStyle.success}>
                                {success}
                            </div>
                        )}

                        {/* Botón principal */}
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            style={{ width: "100%", marginTop: "8px" }}
                        >
                            {loading
                                ? (mode === "login" ? "Ingresando..." : "Creando cuenta...")
                                : (mode === "login" ? "Ingresar" : "Crear cuenta")
                            }
                        </Button>

                        {/* Cambio de modo */}
                        <div style={{ textAlign: "center", marginTop: "16px" }}>
                            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                                {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode(mode === "login" ? "signup" : "login");
                                        setError("");
                                        setSuccess("");
                                    }}
                                    style={switchButtonStyle}
                                >
                                    {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

// Estilos
const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px"
};

const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fff",
    transition: "all 0.2s ease",
    boxSizing: "border-box"
};

const switchButtonStyle = {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "underline"
};

const messageStyle = {
    error: {
        padding: "12px",
        backgroundColor: "#fef2f2",
        color: "#dc2626",
        borderRadius: "8px",
        fontSize: "14px",
        border: "1px solid #fecaca"
    },
    success: {
        padding: "12px",
        backgroundColor: "#f0fdf4",
        color: "#16a34a",
        borderRadius: "8px",
        fontSize: "14px",
        border: "1px solid #bbf7d0"
    }
};