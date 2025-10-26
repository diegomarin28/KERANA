import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import emailjs from "@emailjs/browser";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLightbulb,
    faBug,
    faHandshake,
    faPaperPlane,
    faCheck,
    faExclamationTriangle,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

export default function Suggestions() {
    const [tipo, setTipo] = useState("mejora");
    const [mensaje, setMensaje] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "auto";
        window.scrollTo(0, 0);
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Obtener email del usuario autenticado
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setEmail(user.email);
            }
        };
        getUser();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!mensaje.trim()) {
            setError("Por favor escribí tu sugerencia");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1. Guardar en Supabase
            const { error: dbError } = await supabase
                .from('sugerencias')
                .insert([{
                    tipo,
                    mensaje: mensaje.trim(),
                    email: email.trim() || null,
                    created_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            // 2. Enviar email con EmailJS
            const tipoLabel = tipo === 'mejora' ? '💡 Mejora'
                : tipo === 'problema' ? '🐛 Problema'
                    : '🤝 Colaborar';

            const templateParams = {
                tipo: tipoLabel,
                email: email.trim() || 'No proporcionado',
                mensaje: mensaje.trim(),
                fecha: new Date().toLocaleString('es-UY', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                }),
                name: email.trim() || 'Usuario anónimo'
            };

            await emailjs.send(
                "service_peounxg",
                "template_awqf2ka",
                templateParams,
                "MQvxM1dB58Y16cQT7"
            );

            setSuccess(true);
            setMensaje("");
            setTimeout(() => setSuccess(false), 5000);

        } catch (err) {
            console.error("Error enviando sugerencia:", err);
            setError("Hubo un error al enviar tu sugerencia. Intentá nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const optionTypes = [
        {
            value: "mejora",
            icon: faLightbulb,
            label: "Mejora",
            desc: "Ideas para mejorar",
            color: "#2563eb",
            bgColor: "#eff6ff",
            borderColor: "#2563eb"
        },
        {
            value: "problema",
            icon: faBug,
            label: "Problema",
            desc: "Reportar un bug",
            color: "#ef4444",
            bgColor: "#fee2e2",
            borderColor: "#ef4444"
        },
        {
            value: "colaborar",
            icon: faHandshake,
            label: "Colaborar",
            desc: "Unirme al equipo",
            color: "#10b981",
            bgColor: "#d1fae5",
            borderColor: "#10b981"
        }
    ];

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f8fafc",
                padding: "24px 20px",
                fontFamily: "'Inter', sans-serif"
            }}
        >
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                {/* Botón volver */}
                <Link
                    to="/"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        background: "#fff",
                        border: "2px solid #e2e8f0",
                        borderRadius: 10,
                        color: "#64748b",
                        textDecoration: "none",
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 20,
                        transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.borderColor = "#cbd5e1";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Volver
                </Link>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h1
                        style={{
                            fontSize: "clamp(26px, 5vw, 32px)",
                            color: "#0f172a",
                            fontWeight: 700,
                            marginBottom: 8,
                            lineHeight: 1.2
                        }}
                    >
                        Tu opinión nos importa
                    </h1>
                    <p style={{
                        color: "#64748b",
                        fontSize: 15,
                        fontWeight: 500,
                        lineHeight: 1.5,
                        margin: 0
                    }}>
                        Ayudanos a mejorar Kerana con tus ideas y reportes
                    </p>
                </div>

                {/* Formulario */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        backgroundColor: "#fff",
                        padding: 24,
                        borderRadius: 16,
                        border: "2px solid #e2e8f0",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
                    }}
                >
                    {/* Tipo de sugerencia */}
                    <div style={{ marginBottom: 20 }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: 10,
                                fontWeight: 600,
                                fontSize: 14,
                                color: "#0f172a"
                            }}
                        >
                            Tipo de sugerencia
                        </label>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: 10
                        }}>
                            {optionTypes.map(option => {
                                const isSelected = tipo === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setTipo(option.value)}
                                        style={{
                                            padding: "14px",
                                            borderRadius: 12,
                                            border: `2px solid ${isSelected ? option.borderColor : '#e2e8f0'}`,
                                            backgroundColor: isSelected ? option.bgColor : '#fff',
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            textAlign: "left",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 6
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = "#f8fafc";
                                                e.currentTarget.style.borderColor = "#cbd5e1";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = "#fff";
                                                e.currentTarget.style.borderColor = "#e2e8f0";
                                            }
                                        }}
                                    >
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10
                                        }}>
                                            <FontAwesomeIcon
                                                icon={option.icon}
                                                style={{
                                                    fontSize: 18,
                                                    color: isSelected ? option.color : "#94a3b8"
                                                }}
                                            />
                                            <span style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: isSelected ? option.color : "#0f172a"
                                            }}>
                                                {option.label}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: 12,
                                            color: "#64748b",
                                            fontWeight: 500,
                                            paddingLeft: 28
                                        }}>
                                            {option.desc}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: 20 }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: 8,
                                fontWeight: 600,
                                fontSize: 14,
                                color: "#0f172a"
                            }}
                        >
                            Email <span style={{ color: "#94a3b8", fontWeight: 500 }}>(opcional)</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                borderRadius: 10,
                                border: "2px solid #e2e8f0",
                                fontSize: 14,
                                fontWeight: 500,
                                fontFamily: "'Inter', sans-serif",
                                color: "#0f172a",
                                outline: "none",
                                transition: "border-color 0.2s ease",
                                boxSizing: "border-box"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                        />
                        <small style={{
                            color: "#64748b",
                            fontSize: 12,
                            fontWeight: 500,
                            display: "block",
                            marginTop: 6
                        }}>
                            Si querés que te contactemos sobre tu sugerencia
                        </small>
                    </div>

                    {/* Mensaje */}
                    <div style={{ marginBottom: 20 }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: 8,
                                fontWeight: 600,
                                fontSize: 14,
                                color: "#0f172a"
                            }}
                        >
                            Tu sugerencia <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <textarea
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Contanos tu idea, problema o cómo querés colaborar..."
                            required
                            rows={5}
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                borderRadius: 10,
                                border: "2px solid #e2e8f0",
                                fontSize: 14,
                                fontWeight: 500,
                                fontFamily: "'Inter', sans-serif",
                                color: "#0f172a",
                                resize: "vertical",
                                outline: "none",
                                transition: "border-color 0.2s ease",
                                boxSizing: "border-box",
                                lineHeight: 1.5,
                                minHeight: 120
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                        />
                    </div>

                    {/* Mensajes de estado */}
                    {error && (
                        <div
                            style={{
                                padding: "14px 16px",
                                borderRadius: 10,
                                backgroundColor: "#fee2e2",
                                border: "2px solid #ef4444",
                                color: "#991b1b",
                                marginBottom: 20,
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                                fontSize: 14,
                                fontWeight: 600
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                style={{ fontSize: 18, marginTop: 2, flexShrink: 0 }}
                            />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div
                            style={{
                                padding: "14px 16px",
                                borderRadius: 10,
                                backgroundColor: "#d1fae5",
                                border: "2px solid #10b981",
                                color: "#065f46",
                                marginBottom: 20,
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                                fontSize: 14,
                                fontWeight: 600
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faCheck}
                                style={{ fontSize: 18, marginTop: 2, flexShrink: 0 }}
                            />
                            <span>¡Gracias por tu sugerencia! La revisaremos pronto.</span>
                        </div>
                    )}

                    {/* Botones */}
                    <div style={{
                        display: "flex",
                        gap: 12,
                        paddingTop: 8
                    }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: "14px 24px",
                                backgroundColor: loading ? "#9ca3af" : "#2563eb",
                                color: "#fff",
                                border: "none",
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                fontFamily: "'Inter', sans-serif",
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: loading ? "none" : "0 4px 16px rgba(37, 99, 235, 0.4)",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.background = "#1e40af";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 99, 235, 0.5)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.background = "#2563eb";
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(37, 99, 235, 0.4)";
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                            {loading ? "Enviando..." : "Enviar sugerencia"}
                        </button>
                        <Link
                            to="/"
                            style={{
                                flex: 1,
                                padding: "14px 24px",
                                backgroundColor: "#fff",
                                color: "#64748b",
                                border: "2px solid #e2e8f0",
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 600,
                                fontFamily: "'Inter', sans-serif",
                                textAlign: "center",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                boxSizing: "border-box"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f8fafc";
                                e.currentTarget.style.borderColor = "#cbd5e1";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#fff";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}