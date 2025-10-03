
import { useState } from "react";
import { supabase } from "../supabase";
import { createOrUpdateUserProfile, ensureUniqueUsername } from "../utils/authHelpers";

export default function AuthModal_SignIn({ open, onClose, onSignedIn }) {
    const [mode, setMode] = useState("login"); // login | signup
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");     // nombre completo
    const [username, setUsername] = useState(""); // único
    const [pwd, setPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    if (!open) return null;

    const reset = () => {
        setEmail(""); setName(""); setUsername(""); setPwd("");
        setMsg({ type: "", text: "" });
        setShowPwd(false);
    };

    const onCloseModal = () => { reset(); onClose?.(); };

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true); setMsg({ type: "", text: "" });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: pwd,
            });
            if (error) {
                if (error.message?.includes("Invalid login credentials")) {
                    setMsg({ type: "error", text: "Email o contraseña incorrectos." });
                } else if (error.message?.includes("Email not confirmed")) {
                    setMsg({ type: "warn", text: "Verificá tu email antes de iniciar sesión." });
                } else {
                    setMsg({ type: "error", text: "No se pudo iniciar sesión." });
                }
                return;
            }
            if (data.user) await createOrUpdateUserProfile(data.user);
            onSignedIn?.(data.user);
            onCloseModal();
        } finally {
            setLoading(false);
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        setMsg({ type: "", text: "" });

        if (!name.trim() || !email.trim() || !pwd || !username.trim()) {
            setMsg({ type: "error", text: "Completá todos los campos." });
            return;
        }
        if (pwd.length < 6) {
            setMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
            return;
        }

        setLoading(true);
        try {
            const ok = await ensureUniqueUsername(username.trim());
            if (!ok) {
                setMsg({ type: "error", text: "Ese @usuario ya existe. Probá con otro." });
                setLoading(false);
                return;
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: pwd,
                options: {
                    data: { name: name.trim(), username: username.trim() },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (authError) throw authError;

            if (authData.user) {
                await createOrUpdateUserProfile(authData.user, {
                    name: name.trim(),
                    username: username.trim(),
                });
            }

            setMsg({
                type: "success",
                text: "¡Cuenta creada! Revisá tu correo para confirmar.",
            });
            setMode("login");
        } catch {
            setMsg({ type: "error", text: "No se pudo crear la cuenta." });
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setLoading(true); setMsg({ type: "", text: "" });
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                },
            });
            if (error) throw error;
        } catch {
            setMsg({ type: "error", text: "No se pudo continuar con Google." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={backdrop}>
            <div style={modal}>
                <div style={header}>
                    <div style={badge}>KERANA</div>
                    <h2 style={title}>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
                    <p style={subtitle}>
                        {mode === "login"
                            ? "Bienvenido de vuelta"
                            : "Unite para publicar, comprar y guardar apuntes"}
                    </p>
                </div>

                <div style={body}>
                    {msg.text ? <Alert type={msg.type} text={msg.text} /> : null}

                    <button style={googleBtn} onClick={handleGoogle} disabled={loading}>
                        <GoogleIcon />
                        Continuar con Google
                    </button>

                    <div style={divider}><span>o</span></div>

                    <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: "grid", gap: 12 }}>
                        {mode === "signup" && (
                            <>
                                <Field
                                    label="Nombre y apellido"
                                    type="text"
                                    value={name}
                                    onChange={setName}
                                    placeholder="Tu nombre"
                                    icon="👤"
                                />
                                <Field
                                    label="Usuario"
                                    type="text"
                                    value={username}
                                    onChange={setUsername}
                                    placeholder="@usuario"
                                    icon="🔵"
                                />
                            </>
                        )}

                        <Field
                            label="Email"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="tu@correo.com"
                            icon="✉️"
                        />

                        <Field
                            label="Contraseña"
                            type={showPwd ? "text" : "password"}
                            value={pwd}
                            onChange={setPwd}
                            placeholder="••••••••"
                            icon="🔒"
                            rightAdornment={
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(v => !v)}
                                    style={plainIconBtn}
                                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPwd ? "🙈" : "👁️"}
                                </button>
                            }
                        />

                        <button type="submit" style={primaryBtn} disabled={loading}>
                            {loading ? "Procesando..." : (mode === "login" ? "Iniciar sesión" : "Crear cuenta")}
                        </button>
                    </form>

                    <div style={footSwitch}>
                        {mode === "login" ? (
                            <span>
                                ¿No tenés cuenta?{" "}
                                <button type="button" onClick={() => setMode("signup")} style={linkBtn}>
                                    Crear una
                                </button>
                            </span>
                        ) : (
                            <span>
                                ¿Ya tenés cuenta?{" "}
                                <button type="button" onClick={() => setMode("login")} style={linkBtn}>
                                    Iniciar sesión
                                </button>
                            </span>
                        )}
                    </div>
                </div>

                <button onClick={onCloseModal} style={closeBtn} aria-label="Cerrar">✕</button>
            </div>
        </div>
    );
}

/** Componente del ícono de Google CORREGIDO */
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
    );
}

/** UI bits (igual que antes pero con mejores estilos) */
function Field({ label, type, value, onChange, placeholder, icon, rightAdornment }) {
    return (
        <label style={{ display: "grid", gap: 6 }}>
            <span style={labelCss}>{label}</span>
            <div style={inputWrap}>
                <span style={inputIcon}>{icon}</span>
                <input
                    style={inputCss}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required
                />
                {rightAdornment ? <span style={rightAdornmentWrap}>{rightAdornment}</span> : null}
            </div>
        </label>
    );
}

function Alert({ type, text }) {
    const palette = {
        error: { bg: "rgba(220,38,38,.08)", fg: "#dc2626", bd: "rgba(220,38,38,.25)" },
        warn:  { bg: "rgba(234,179,8,.10)",  fg: "#b45309", bd: "rgba(234,179,8,.25)" },
        success:{ bg: "rgba(16,185,129,.10)", fg: "#047857", bd: "rgba(16,185,129,.25)" },
        info:  { bg: "rgba(59,130,246,.10)", fg: "#1d4ed8", bd: "rgba(59,130,246,.25)" },
    }[type || "info"];
    return (
        <div style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: palette.bg,
            color: palette.fg,
            border: `1px solid ${palette.bd}`,
            fontSize: 14,
            marginBottom: 8
        }}>
            {text}
        </div>
    );
}

/** 🎨 NUEVOS ESTILOS - Azul más oscuro y elegante */
const BLU1 = "#1d4ed8";   // azul más oscuro
const BLU2 = "#1e40af";   // azul más intenso
const BLU3 = "rgba(30, 64, 175, 0.05)"; // fondo sutil

const backdrop = {
    position: "fixed", inset: 0, background: "rgba(0,10,30,.65)",
    backdropFilter: "blur(6px)", zIndex: 60, display: "grid", placeItems: "center",
};

const modal = {
    position: "relative",
    width: "min(92vw, 440px)", // un poco más angosto
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 25px 70px rgba(0,0,0,.4)",
    background: "white",
};

const header = {
    background: `linear-gradient(135deg, ${BLU1} 0%, ${BLU2} 100%)`,
    color: "white",
    padding: "28px 26px",
    textAlign: "center",
};

const badge = {
    display: "inline-block",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,.2)",
    marginBottom: 10,
    fontWeight: 700,
};

const title = {
    margin: "4px 0 6px",
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: "-0.5px"
};

const subtitle = {
    margin: 0,
    opacity: .9,
    fontSize: 14,
    fontWeight: 400
};

const body = {
    padding: 26,
    background: BLU3
};

const googleBtn = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    border: "1px solid rgba(30, 64, 175, 0.2)",
    borderRadius: 12,
    padding: "12px 16px",
    background: "white",
    color: "#1e293b",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(30, 64, 175, 0.1)",
};

const divider = {
    display: "grid",
    alignItems: "center",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 12,
    color: "#64748b",
    fontSize: 13,
    margin: "18px 0",
};

const primaryBtn = {
    marginTop: 8,
    width: "100%",
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    background: `linear-gradient(135deg, ${BLU2}, ${BLU1})`,
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(30, 64, 175, 0.3)",
    transition: "all 0.2s ease",
};

const footSwitch = {
    marginTop: 16,
    textAlign: "center",
    color: "#475569",
    fontSize: 14
};

const linkBtn = {
    color: BLU2,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
};

const closeBtn = {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(255,255,255,.9)",
    border: "1px solid rgba(15,23,42,.1)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: 16,
    fontWeight: 600,
};

const labelCss = {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: 600
};

const inputWrap = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "white",
    border: "1px solid rgba(30, 64, 175, 0.15)",
    borderRadius: 12,
    transition: "all 0.2s ease",
};

const inputIcon = {
    paddingLeft: 14,
    opacity: .7,
    fontSize: 15
};

const inputCss = {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "14px 14px 14px 12px",
    borderRadius: 12,
    fontSize: 15,
    background: "transparent",
    color: "#1e293b",
};

const rightAdornmentWrap = {
    paddingRight: 12,
    display: "grid",
    placeItems: "center"
};

const plainIconBtn = {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 16,
    opacity: 0.7,
};