
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
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const [rememberMe, setRememberMe] = useState(() => {
        // Leer preferencia guardada - Es para que la app recuerde la preferencia del usuario entre sesiones, sin que tenga que volver a marcar/desmarcar cada vez. El "leer preferencia guardada" significa que cuando el usuario abre el modal de login, automáticamente recupera su última elección del checkbox "Recordarme".
        try { return JSON.parse(localStorage.getItem("kerana_remember") || "false"); }
        catch { return false; }
    });

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
            console.log('Intentando login con:', {
                email: email.trim(),
                passwordLength: pwd.length,
                rememberMe
            });
                const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: pwd,
            });
            if (error) {
                if (error.message?.includes("Invalid login credentials")) {
                    setMsg({
                        type: "error",
                        text: "Email o contraseña incorrectos. Si creaste la cuenta con Google, usá 'Continuar con Google'."
                    });
                } else if (error.message?.includes("Email not confirmed")) {
                    setMsg({ type: "warn", text: "Verificá tu email antes de iniciar sesión." });
                } else if (error.status === 500) {
                    setMsg({
                        type: "error",
                        text: "Error del servidor. Si creaste la cuenta con Google, usá 'Continuar con Google'."
                    });
                }
                else {
                    setMsg({ type: "error", text: "No se pudo iniciar sesión." });
                }
                return;
            }
            localStorage.setItem("kerana_remember", JSON.stringify(rememberMe)); //para el recordarme

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
        if (!acceptedTerms) {
            setMsg({ type: "error", text: "Debés aceptar los términos y condiciones para crear una cuenta." });
            return;
        }

        setLoading(true);
        try {
            console.log('🔍 Intentando signup con:', {
                email: email.trim(),
                name: name.trim(),
                username: username.trim(),
                passwordLength: pwd.length
            });

            const ok = await ensureUniqueUsername(username.trim());
            if (!ok) {
                setMsg({ type: "error", text: "Ese @usuario ya existe. Probá con otro." });
                setLoading(false);
                return;
            }

            // 👇 PROBÁ SIN LOS OPTIONS PRIMERO
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: pwd,
                data: { name: name.trim(), username: username.trim() },
                emailRedirectTo: `${window.location.origin}/auth/callback`,

            });

            console.log('🔍 Respuesta signup:', { authData, authError });

            if (authError) {
                console.error('❌ Error detallado signup:', authError);
                throw authError;
            }

            if (authData.user) {
                console.log('✅ Usuario creado, creando perfil...');
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
        } catch (error) {
            console.error('❌ Error general signup:', error);
            setMsg({
                type: "error",
                text: `No se pudo crear la cuenta. Error: ${error.message}`
            });
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
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                },
            });
            if (error) throw error;
            if (data?.user) await createOrUpdateUserProfile(data.user);
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
                                    placeholder="usuario"
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

                        {/* RECORDARME- Lo pongo dsp de la contra asi aparece ahi bien  */}
                        {mode === "login" && (
                            <div style={rememberContainer}>
                                <label style={rememberLabel}>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        style={checkboxStyle}
                                    />
                                    <span>Recordarme</span>
                                </label>
                                <button
                                    type="button"
                                    style={forgotLink}
                                    onClick={() => setMsg({ type: "info", text: "Funcionalidad en desarrollo. Contactá soporte." })}
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {/* TÉRMINOS Y CONDICIONES - Solo en registro */}
                        {mode === "signup" && (
                            <div style={termsContainer}>
                                <label style={termsLabel}>
                                    <input
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        style={checkboxStyle}
                                    />
                                    <span>
                                        Acepto los{' '}
                                        <button
                                            type="button"
                                            onClick={() => setShowTermsModal(true)}
                                            style={termsLink}
                                        >
                                            términos y condiciones
                                        </button>
                                    </span>
                                </label>
                            </div>
                        )}

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
                {showTermsModal && (
                    <TermsModal onClose={() => setShowTermsModal(false)} onAccept={() => {
                        setAcceptedTerms(true);
                        setShowTermsModal(false);
                    }} />
                )}
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
    backdropFilter: "blur(6px)", zIndex: 1001, display: "grid", placeItems: "center", //el header es 1000, pongo 1001
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
// COMPONENTE DE TÉRMINOS Y CONDICIONES
function TermsModal({ onClose, onAccept }) {
    return (
        <div style={termsBackdrop}>
            <div style={termsModal}>
                <div style={termsHeader}>
                    <h3 style={termsTitle}>Términos y Condiciones</h3>
                    <button onClick={onClose} style={termsCloseBtn}>✕</button>
                </div>

                <div style={termsContent}>
                    <h4>1. Protección de Datos Personales</h4>
                    <p>
                        De conformidad con la Ley N° 18.331 de Protección de Datos Personales de Uruguay,
                        se informa que los datos personales proporcionados serán incorporados a una base
                        de datos de la cual es responsable KERANA.
                    </p>

                    <h4>2. Finalidad del Tratamiento</h4>
                    <p>
                        Sus datos serán utilizados para: gestión de usuarios, publicación y compra de apuntes,
                        comunicación entre usuarios, y mejora de nuestros servicios.
                    </p>

                    <h4>3. Derechos del Usuario</h4>
                    <p>
                        Usted tiene derecho a acceder, rectificar, actualizar y, cuando corresponda,
                        suprimir sus datos personales. Para ejercer estos derechos, puede contactarnos
                        a través de nuestro formulario de contacto.
                    </p>

                    <h4>4. Seguridad de la Información</h4>
                    <p>
                        Implementamos medidas de seguridad técnicas y organizativas para proteger
                        sus datos personales contra accesos no autorizados, pérdida o destrucción.
                    </p>

                    <h4>5. Consentimiento</h4>
                    <p>
                        Al aceptar estos términos, otorga su consentimiento libre, expreso e informado
                        para el tratamiento de sus datos personales conforme a lo establecido en la
                        legislación uruguaya.
                    </p>
                </div>

                <div style={termsFooter}>
                    <button onClick={onClose} style={termsCancelBtn}>
                        Cancelar
                    </button>
                    <button onClick={onAccept} style={termsAcceptBtn}>
                        Aceptar Términos
                    </button>
                </div>
            </div>
        </div>
    );
}

// NUEVOS ESTILOS PARA TÉRMINOS Y CONDICIONES
const termsContainer = {
    margin: "8px 0"
};

const termsLabel = {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 13,
    color: "#475569",
    cursor: "pointer",
    lineHeight: 1.4
};

const checkboxStyle = {
    marginTop: 2,
    flexShrink: 0
};

const termsLink = {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: 13,
    padding: 0
};

const termsBackdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,10,30,.75)",
    backdropFilter: "blur(8px)",
    zIndex: 70,
    display: "grid",
    placeItems: "center",
    padding: 20
};

const termsModal = {
    background: "white",
    borderRadius: 16,
    maxWidth: 600,
    width: "100%",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 80px rgba(0,0,0,0.4)"
};

const termsHeader = {
    padding: "20px 24px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
};

const termsTitle = {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b"
};

const termsCloseBtn = {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#64748b",
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "grid",
    placeItems: "center"
};

const termsContent = {
    padding: "24px",
    flex: 1,
    overflowY: "auto",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#475569"
};

const termsFooter = {
    padding: "20px 24px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: 12,
    justifyContent: "flex-end"
};

const termsCancelBtn = {
    padding: "10px 20px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "white",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 500
};

const termsAcceptBtn = {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 600
};

const rememberContainer = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "8px 0"
};

const rememberLabel = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#475569",
    cursor: "pointer"
};

const forgotLink = {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: 13,
    textDecoration: "underline",
    padding: 0
};