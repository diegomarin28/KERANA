import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faCheckCircle,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
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
                        console.log("🔧 Perfil incompleto, redirigiendo a setup...");
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

                    {/* Spinner con Font Awesome */}
                    <div style={spinnerContainer}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                style={{ fontSize: 36, color: '#fff' }}
                            />
                        </div>
                    </div>

                    {/* Mensaje */}
                    <h2 style={titleStyle}>{message}</h2>
                    <p style={subtitleStyle}>Esto tomará solo un momento</p>
                </div>
            )}

            {status === "success" && (
                <div style={cardStyle}>
                    {/* Checkmark con Font Awesome */}
                    <div style={successIconContainer}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                            <FontAwesomeIcon
                                icon={faCheckCircle}
                                style={{ fontSize: 40, color: '#fff' }}
                            />
                        </div>
                    </div>

                    <h2 style={{...titleStyle, color: '#10b981'}}>¡Todo listo!</h2>
                    <p style={subtitleStyle}>{message}</p>
                </div>
            )}

            {status === "error" && (
                <div style={cardStyle}>
                    {/* Icono de error con Font Awesome */}
                    <div style={errorIconContainer}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            animation: 'shake 0.5s ease'
                        }}>
                            <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                style={{ fontSize: 40, color: '#fff' }}
                            />
                        </div>
                    </div>

                    <h2 style={{...titleStyle, color: '#ef4444'}}>Algo salió mal</h2>
                    <p style={subtitleStyle}>{message}</p>

                    <button
                        onClick={() => navigate("/?auth=signin")}
                        style={retryButton}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
                        }}
                    >
                        Intentar nuevamente
                    </button>
                </div>
            )}
        </div>
    );
}

// 🎨 ESTILOS MODERNOS - KERANA
const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    padding: "20px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};

const cardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "48px 40px",
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    border: "2px solid #f1f5f9",
    maxWidth: "480px",
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
    background: "linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)",
    color: "white",
    fontWeight: "700"
};

const spinnerContainer = {
    margin: "24px 0"
};

const successIconContainer = {
    margin: "0 auto 24px",
    width: "80px",
    height: "80px",
    display: "grid",
    placeItems: "center"
};

const errorIconContainer = {
    margin: "0 auto 24px",
    width: "80px",
    height: "80px",
    display: "grid",
    placeItems: "center"
};

const titleStyle = {
    margin: "0 0 12px 0",
    fontSize: "24px",
    fontWeight: "700",
    color: "#13346b",
    letterSpacing: "-0.5px",
    fontFamily: "Inter, sans-serif"
};

const subtitleStyle = {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
    lineHeight: "1.6",
    fontWeight: "500",
    fontFamily: "Inter, sans-serif"
};

const retryButton = {
    marginTop: "28px",
    padding: "12px 32px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
    fontFamily: "Inter, sans-serif"
};

const keyframes = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
        from { transform: scale(0); }
        to { transform: scale(1); }
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
    }
`;