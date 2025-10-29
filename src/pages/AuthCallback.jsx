import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { createOrUpdateUserProfile } from "../utils/authHelpers";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("Procesando autenticación...");

    useEffect(() => {
        let isMounted = true;

        const processAuth = async () => {
            try {
                setStatus("loading");
                setMessage("Verificando autenticación...");

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error("❌ Error de sesión:", sessionError);
                    throw sessionError;
                }

                if (!session?.user) {
                    console.log("❌ No hay usuario en sesión");
                    setStatus("error");
                    setMessage("No se pudo completar la autenticación. Por favor, intentá nuevamente.");
                    return;
                }

                if (!isMounted) return;

                setMessage("Configurando tu perfil...");

                // Verificar si el perfil existe y si está completo
                const { data: existingProfile } = await supabase
                    .from("usuario")
                    .select("id_usuario, username, foto, bio")
                    .eq("auth_id", session.user.id)
                    .maybeSingle();

                if (existingProfile) {
                    console.log("✅ Perfil ya existe");

                    // Verificar si necesita completar el perfil
                    const needsSetup = !existingProfile.foto || !existingProfile.bio;

                    if (needsSetup) {
                        console.log("📝 Perfil incompleto, redirigiendo a setup...");
                        setStatus("success");
                        setMessage("¡Bienvenido! Completá tu perfil...");

                        setTimeout(() => {
                            if (isMounted) {
                                navigate("/profile/setup", { replace: true });
                            }
                        }, 1500);
                    } else {
                        console.log("✅ Perfil completo, redirigiendo a home...");
                        setStatus("success");
                        setMessage("¡Autenticación exitosa!");

                        setTimeout(() => {
                            if (isMounted) {
                                navigate("/", { replace: true });
                            }
                        }, 800);
                    }
                } else {
                    console.log("🆕 Creando nuevo perfil...");
                    const profileResult = await createOrUpdateUserProfile(session.user);

                    if (profileResult.error) {
                        console.warn("⚠️ Error creando perfil:", profileResult.error);
                    }

                    // Nuevo usuario siempre va a setup
                    setStatus("success");
                    setMessage("¡Cuenta creada! Completá tu perfil...");

                    setTimeout(() => {
                        if (isMounted) {
                            navigate("/profile/setup", { replace: true });
                        }
                    }, 1500);
                }

            } catch (error) {
                console.error("❌ Error en AuthCallback:", error);
                if (isMounted) {
                    setStatus("error");
                    setMessage("Error durante el proceso de autenticación.");
                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 3000);
                }
            }
        };

        processAuth();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    return (
        <div style={containerStyle}>
            <style>{keyframes}</style>

            {status === "loading" && (
                <div style={cardStyle}>
                    {/* Logo KERANA */}
                    <div style={logoContainer}>
                        <div style={logoBadge}>KERANA</div>
                    </div>

                    {/* Spinner moderno */}
                    <div style={spinnerContainer}>
                        <div style={spinner}></div>
                    </div>

                    {/* Mensaje */}
                    <h2 style={titleStyle}>{message}</h2>
                    <p style={subtitleStyle}>Esto tomará solo un momento</p>
                </div>
            )}

            {status === "success" && (
                <div style={cardStyle}>
                    {/* Checkmark animado */}
                    <div style={successIconContainer}>
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={successIcon}
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="#10b981"
                                strokeWidth="2"
                                fill="none"
                                style={successCircle}
                            />
                            <path
                                d="M8 12l3 3l5-5"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={successCheck}
                            />
                        </svg>
                    </div>

                    <h2 style={{...titleStyle, color: '#10b981'}}>¡Todo listo!</h2>
                    <p style={subtitleStyle}>{message}</p>
                </div>
            )}

            {status === "error" && (
                <div style={cardStyle}>
                    {/* Icono de error */}
                    <div style={errorIconContainer}>
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="#ef4444"
                                strokeWidth="2"
                            />
                            <path
                                d="M15 9l-6 6M9 9l6 6"
                                stroke="#ef4444"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    <h2 style={{...titleStyle, color: '#ef4444'}}>Algo salió mal</h2>
                    <p style={subtitleStyle}>{message}</p>

                    <button
                        onClick={() => navigate("/?auth=signin")}
                        style={retryButton}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        Intentar nuevamente
                    </button>
                </div>
            )}
        </div>
    );
}

// 🎨 ESTILOS MODERNOS
const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fafafa",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};

const cardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "48px 40px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    maxWidth: "420px",
    width: "100%",
    animation: "fadeIn 0.3s ease"
};

const logoContainer = {
    marginBottom: "32px"
};

const logoBadge = {
    display: "inline-block",
    fontSize: "11px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    padding: "8px 16px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontWeight: "700"
};

const spinnerContainer = {
    margin: "24px 0"
};

const spinner = {
    width: "56px",
    height: "56px",
    border: "4px solid #f3f4f6",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto"
};

const successIconContainer = {
    margin: "0 auto 24px",
    width: "80px",
    height: "80px",
    display: "grid",
    placeItems: "center"
};

const successIcon = {
    animation: "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
};

const successCircle = {
    animation: "drawCircle 0.5s ease forwards"
};

const successCheck = {
    strokeDasharray: "20",
    strokeDashoffset: "20",
    animation: "drawCheck 0.4s ease 0.3s forwards"
};

const errorIconContainer = {
    margin: "0 auto 24px",
    width: "80px",
    height: "80px",
    display: "grid",
    placeItems: "center",
    animation: "shake 0.5s ease"
};

const titleStyle = {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: "-0.5px"
};

const subtitleStyle = {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
    lineHeight: "1.6"
};

const retryButton = {
    marginTop: "24px",
    padding: "12px 32px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    transition: "transform 0.2s ease",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
};

const keyframes = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
        from { transform: scale(0); }
        to { transform: scale(1); }
    }
    @keyframes drawCircle {
        from { stroke-dasharray: 0, 100; }
        to { stroke-dasharray: 100, 100; }
    }
    @keyframes drawCheck {
        to { stroke-dashoffset: 0; }
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;