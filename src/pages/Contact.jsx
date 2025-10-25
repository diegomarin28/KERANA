import { useRef, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
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
                padding: "0px 20px 0px",
                background: "#fafafa",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
        >
            <div style={{ width: "100%", maxWidth: 960 }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    {/* Emoji arriba */}
                    <div style={{
                        fontSize: 36,
                        marginBottom: 16,
                        lineHeight: 1,
                    }}>
                        ✉️
                    </div>

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "#f5f5f5",
                            color: "#8e8e8e",
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
                            color: "#262626",
                            fontWeight: 700,
                        }}
                    >
                        ¿Tenés alguna consulta?
                    </h1>

                    <p style={{ margin: 0, color: "#8e8e8e", fontSize: 15 }}>
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
                            border: "1px solid #dbdbdb",
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
                                    style={{ fontSize: 14, color: "#262626", fontWeight: 600 }}
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
                                    style={{ fontSize: 14, color: "#262626", fontWeight: 600 }}
                                >
                                    Email <span style={{ color: "#8e8e8e", fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={email}
                                    placeholder="tu@email.com"
                                    style={inputStyle}
                                />
                                <small style={{ fontSize: 12, color: "#8e8e8e" }}>
                                    Solo si querés que te contactemos sobre tu mensaje
                                </small>
                            </div>

                            <div style={{ display: "grid", gap: 8 }}>
                                <label
                                    htmlFor="message"
                                    style={{ fontSize: 14, color: "#262626", fontWeight: 600 }}
                                >
                                    Mensaje
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    required
                                    placeholder="Ej: Falta el profesor John Doe en la materia..."
                                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5, fontFamily: 'inherit' }}
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
                                        background: sending ? "#b3b3b3" : "#0095f6",
                                        color: "white",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: sending ? "not-allowed" : "pointer",
                                        transition: "all 0.2s ease",
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!sending) e.target.style.background = "#1877f2";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!sending) e.target.style.background = "#0095f6";
                                    }}
                                >
                                    {sending ? "Enviando..." : "Enviar mensaje"}
                                </button>

                                {status === "ok" && (
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "#00a400",
                                            background: "#d4edda",
                                            border: "1px solid #c3e6cb",
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            fontWeight: 500,
                                        }}
                                    >
                                        ✓ Mensaje enviado
                                    </span>
                                )}
                                {status === "err" && (
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "#ed4956",
                                            background: "#ffe0e3",
                                            border: "1px solid #ffccd5",
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            fontWeight: 500,
                                        }}
                                    >
                                        ✗ Ocurrió un error
                                    </span>
                                )}
                            </div>
                        </form>
                    </Card>

                    {/* Sidebar */}
                    <Card
                        style={{
                            border: "1px solid #dbdbdb",
                            padding: 20,
                            background: "white",
                        }}
                    >
                        <div style={{ display: "grid", gap: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 18, color: "#262626", fontWeight: 600, letterSpacing: "-0.3px" }}>
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
                                    background: "#f5f5f5",
                                    border: "1px solid #efefef",
                                }}
                            >
                                <p style={{ margin: 0, fontSize: 13, color: "#262626", lineHeight: 1.5 }}>
                                    También podés escribirnos a{" "}
                                    <strong style={{ color: "#0095f6" }}>kerana.soporte@gmail.com</strong>
                                    <br />
                                    <span style={{ color: "#8e8e8e", fontSize: 12 }}>Respondemos en 24-48 hs</span>
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
                    background: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0095f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#262626",
                        marginBottom: 4,
                    }}
                >
                    {title}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#8e8e8e", lineHeight: 1.5 }}>{desc}</p>
            </div>
        </div>
    );
}

const inputStyle = {
    appearance: "none",
    outline: "none",
    border: "1px solid #dbdbdb",
    background: "white",
    padding: "10px 12px",
    borderRadius: 6,
    fontSize: 14,
    color: "#262626",
    transition: "border-color 0.2s ease",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
};