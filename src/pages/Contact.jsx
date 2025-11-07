import { useRef, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope,
    faCheckCircle,
    faExclamationCircle,
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import { Button } from "../components/UI/Button";
import { Card } from "../components/UI/Card";
import { supabase } from "../supabase";

export default function Contact() {
    const form = useRef(null);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null);
    const [email, setEmail] = useState("");
    const [userName, setUserName] = useState("");

    // Obtener usuario autenticado
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setEmail(user.email);

                const { data: profile } = await supabase
                    .from('usuario')
                    .select('nombre, username')
                    .eq('auth_id', user.id)
                    .single();

                if (profile) {
                    setUserName(profile.nombre || profile.username || user.email);
                }
            }
        };
        getUser();
    }, []);

    const sendEmail = async (e) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            const formData = new FormData(form.current);
            const templateParams = {
                name: formData.get('name'),
                email: formData.get('email') || email || 'sin-email@kerana.app',
                message: formData.get('message'),
                user_name: userName || 'Usuario anónimo',
                user_email: email || 'No autenticado'
            };

            await emailjs.send(
                "service_dan74a5",
                "template_ueime5o",
                templateParams,
                "DMO310micvFWXx-j4"
            );
            setStatus("ok");
            form.current?.reset();
        } catch (err) {
            console.error('Error enviando email:', err);
            setStatus("err");
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                padding: "40px 20px",
                background: "#f8fafc",
                fontFamily: "Inter, sans-serif",
            }}
        >
            <div style={{ width: "100%", maxWidth: 960 }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    {/* Icono arriba */}
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <FontAwesomeIcon
                            icon={faEnvelope}
                            style={{ fontSize: 32, color: '#fff' }}
                        />
                    </div>

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "#eff6ff",
                            color: "#2563eb",
                            fontWeight: 600,
                            fontSize: 12,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            marginBottom: 12,
                        }}
                    >
                        Contacto
                    </div>

                    <h1
                        style={{
                            margin: "0 0 8px 0",
                            fontSize: 32,
                            lineHeight: 1.2,
                            letterSpacing: "-0.5px",
                            color: "#13346b",
                            fontWeight: 700,
                        }}
                    >
                        ¿Tenés alguna consulta?
                    </h1>

                    <p style={{ margin: 0, color: "#64748b", fontSize: 15, fontWeight: 500 }}>
                        Escribinos y te respondemos a la brevedad
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 0.8fr",
                        gap: 20,
                    }}
                >
                    {/* Formulario */}
                    <Card
                        style={{
                            border: "2px solid #f1f5f9",
                            background: "white",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                        }}
                    >
                        <form
                            ref={form}
                            onSubmit={sendEmail}
                            style={{
                                display: "grid",
                                gap: 16,
                                padding: 20,
                            }}
                        >
                            <div style={{ display: "grid", gap: 8 }}>
                                <label
                                    htmlFor="name"
                                    style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}
                                >
                                    Nombre
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    defaultValue={userName}
                                    placeholder="Tu nombre completo"
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ display: "grid", gap: 8 }}>
                                <label
                                    htmlFor="email"
                                    style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}
                                >
                                    Email <span style={{ color: "#64748b", fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={email}
                                    placeholder="tu@email.com"
                                    style={inputStyle}
                                />
                                <small style={{ fontSize: 12, color: "#64748b" }}>
                                    Solo si querés que te contactemos sobre tu mensaje
                                </small>
                            </div>

                            <div style={{ display: "grid", gap: 8 }}>
                                <label
                                    htmlFor="message"
                                    style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}
                                >
                                    Mensaje
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    required
                                    placeholder="Ej: Falta el profesor John Doe en la materia..."
                                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginTop: 4,
                                }}
                            >
                                <button
                                    type="submit"
                                    disabled={sending}
                                    style={{
                                        padding: "10px 24px",
                                        borderRadius: 8,
                                        border: "none",
                                        background: sending ? "#94a3b8" : "#2563eb",
                                        color: "white",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: sending ? "not-allowed" : "pointer",
                                        transition: "all 0.2s ease",
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!sending) e.target.style.background = "#1e40af";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!sending) e.target.style.background = "#2563eb";
                                    }}
                                >
                                    {sending ? "Enviando..." : "Enviar mensaje"}
                                </button>

                                {status === "ok" && (
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "#065f46",
                                            background: "#d1fae5",
                                            border: "1px solid #10b981",
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        Mensaje enviado
                                    </span>
                                )}
                                {status === "err" && (
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "#991b1b",
                                            background: "#fee2e2",
                                            border: "1px solid #ef4444",
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faExclamationCircle} />
                                        Ocurrió un error
                                    </span>
                                )}
                            </div>
                        </form>
                    </Card>

                    {/* Sidebar */}
                    <Card
                        style={{
                            border: "2px solid #f1f5f9",
                            padding: 20,
                            background: "white",
                        }}
                    >
                        <div style={{ display: "grid", gap: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 18, color: "#13346b", fontWeight: 600, letterSpacing: "-0.3px" }}>
                                ¿Por qué contactarnos?
                            </h3>

                            <Feature
                                title="Soporte académico"
                                desc="Integraciones de IA para corrección de apuntes, rúbricas y créditos."
                            />
                            <Feature
                                title="No está tu profesor"
                                desc="Lo ingresamos de inmediato así podés realizar tu reseña."
                            />
                            <Feature
                                title="Falta una materia"
                                desc="Contactate y lo agregamos a la brevedad."
                            />

                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 16,
                                    borderRadius: 8,
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                }}
                            >
                                <p style={{ margin: 0, fontSize: 13, color: "#0f172a", lineHeight: 1.5, fontWeight: 500 }}>
                                    También podés escribirnos a{" "}
                                    <strong style={{ color: "#2563eb" }}>kerana.soporte@gmail.com</strong>
                                    <br />
                                    <span style={{ color: "#64748b", fontSize: 12 }}>Respondemos en 24-48 hs</span>
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Feature({ title, desc }) {
    return (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                }}
            >
                <FontAwesomeIcon
                    icon={faCheck}
                    style={{ fontSize: 12, color: '#2563eb' }}
                />
            </div>
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#0f172a",
                        marginBottom: 4,
                    }}
                >
                    {title}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5, fontWeight: 500 }}>{desc}</p>
            </div>
        </div>
    );
}

const inputStyle = {
    appearance: "none",
    outline: "none",
    border: "2px solid #e2e8f0",
    background: "white",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    color: "#0f172a",
    transition: "border-color 0.2s ease",
    fontFamily: "Inter, sans-serif",
    width: "100%",
    boxSizing: "border-box",
    fontWeight: 500
};