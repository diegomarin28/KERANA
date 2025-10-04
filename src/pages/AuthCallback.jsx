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
                const { data: existingProfile } = await supabase
                    .from("usuario")
                    .select("id_usuario, username")
                    .eq("auth_id", session.user.id)
                    .maybeSingle();

                if (existingProfile) {
                    console.log("✅ Perfil ya existe, redirigiendo...");
                } else {
                    console.log("🆕 Creando nuevo perfil...");
                    const profileResult = await createOrUpdateUserProfile(session.user);
                    if (profileResult.error) {
                        console.warn("⚠️ Error creando perfil:", profileResult.error);
                    }
                }

                if (!isMounted) return;

                setStatus("success");
                setMessage("¡Autenticación exitosa! Redirigiendo...");

                setTimeout(() => {
                    if (isMounted) {
                        navigate("/", { replace: true });
                    }
                }, 1000);

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

    // 🎨 NUEVOS ESTILOS - AZUL Y BLANCO
    const containerStyle = {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)", // Azul en lugar de violeta
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif"
    };

    const cardStyle = {
        background: "white",
        borderRadius: "20px",
        padding: "40px 30px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        maxWidth: "400px",
        width: "100%"
    };

    const spinnerStyle = {
        width: "50px",
        height: "50px",
        border: "4px solid #f3f4f6",
        borderTop: "4px solid #2563eb",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 20px"
    };

    const titleStyle = {
        margin: "0 0 16px 0",
        fontSize: "24px",
        fontWeight: "700",
        color: "#1e40af", // Azul en lugar de gradiente
    };

    const messageStyle = {
        margin: "0 0 24px 0",
        color: "#6b7280",
        fontSize: "16px",
        lineHeight: "1.5"
    };

    if (status === "loading") {
        return (
            <div style={containerStyle}>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <div style={cardStyle}>
                    <div style={spinnerStyle}></div>
                    <h1 style={titleStyle}>Autenticando…</h1>
                    <p style={messageStyle}>{message}</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
                    <h1 style={titleStyle}>Error</h1>
                    <p style={messageStyle}>{message}</p>
                    <button
                        onClick={() => navigate("/?auth=signin")}
                        style={{
                            padding: "12px 24px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #2563eb, #1e40af)",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px"
                        }}
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                    <h1 style={titleStyle}>¡Éxito!</h1>
                    <p style={messageStyle}>{message}</p>
                </div>
            </div>
        );
    }

    return null;
}