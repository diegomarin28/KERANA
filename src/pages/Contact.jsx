import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function Contact() {
    const form = useRef(null);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null); // "ok" | "err" | null

    const sendEmail = async (e) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            await emailjs.sendForm(
                "service_dan74a5",
                "template_ueime5o",
                form.current,
                "DMO310micvFWXx-j4"
            );
            setStatus("ok");
            form.current?.reset();
        } catch {
            setStatus("err");
        } finally {
            setSending(false);
        }
    };

    const wrap = (children) => (
        <div
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                padding: "32px",
                background:
                    "radial-gradient(1200px 800px at 10% -10%, #e8f1ff 0%, transparent 60%)," +
                    "radial-gradient(1000px 700px at 110% 10%, #e3f0ff 0%, transparent 55%)," +
                    "linear-gradient(180deg, #f7fbff 0%, #f9fbff 30%, #f6faff 60%, #f7fbff 100%)",
            }}
        >
            {children}
        </div>
    );

    return wrap(
        <div style={{ width: "100%", maxWidth: 960 }}>
            {/* Header / Hero */}
            <div
                style={{
                    textAlign: "center",
                    marginBottom: 24,
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 14px",
                        borderRadius: 999,
                        background:
                            "linear-gradient(90deg, rgba(37,99,235,.08), rgba(59,130,246,.08))",
                        color: "#1e40af",
                        fontWeight: 600,
                        fontSize: 12,
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                    }}
                >
                    ✉️ Contacto
                </div>

                <h1
                    style={{
                        margin: "14px 0 8px",
                        fontSize: 34,
                        lineHeight: 1.15,
                        letterSpacing: -0.4,
                        color: "#0f172a",
                    }}
                >
                    Hablemos de tu proyecto académico
                </h1>

                <p
                    style={{
                        margin: 0,
                        color: "#475569",
                    }}
                >
                    Escribinos y te respondemos a la brevedad. Cualquier consulta o sugerencia es bienvenida!
                </p>
            </div>

            {/* Content */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 0.8fr",
                    gap: 24,
                }}
            >
                {/* Form card */}
                <Card
                    style={{
                        border: "1px solid #e6eefc",
                        boxShadow:
                            "0 8px 30px -12px rgba(30, 64, 175, .18), 0 1px 0 rgba(15, 23, 42, .02)",
                        backdropFilter: "saturate(140%) blur(4px)",
                    }}
                >
                    <form
                        ref={form}
                        onSubmit={sendEmail}
                        style={{
                            display: "grid",
                            gap: 16,
                            padding: 22,
                        }}
                    >
                        <div style={{ display: "grid", gap: 6 }}>
                            <label
                                htmlFor="name"
                                style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}
                            >
                                Nombre
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="Tu nombre completo"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: "grid", gap: 6 }}>
                            <label
                                htmlFor="email"
                                style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="tu@email.com"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: "grid", gap: 6 }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    justifyContent: "space-between",
                                }}
                            >
                                <label
                                    htmlFor="message"
                                    style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}
                                >
                                    Mensaje
                                </label>
                                <span style={{ fontSize: 12, color: "#5b6b8a" }}>
                  Contanos qué necesitás ✨
                </span>
                            </div>

                            <textarea
                                id="message"
                                name="message"
                                rows={6}
                                required
                                placeholder="Ej: Falta el profesor John Doe en la materia ...."
                                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
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
                            <Button
                                type="submit"
                                disabled={sending}
                                // asumimos que tu Button admite variant="primary"
                                variant="primary"
                                style={{
                                    background:
                                        "linear-gradient(90deg, #2563eb, #3b82f6 60%, #60a5fa)",
                                    color: "white",
                                    border: "none",
                                }}
                            >
                                {sending ? "Enviando..." : "Enviar mensaje"}
                            </Button>

                            {status === "ok" && (
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: "#065f46",
                                        background: "#ecfdf5",
                                        border: "1px solid #a7f3d0",
                                        padding: "6px 10px",
                                        borderRadius: 8,
                                    }}
                                >
                  ✅ ¡Mensaje enviado!
                </span>
                            )}
                            {status === "err" && (
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: "#7f1d1d",
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        padding: "6px 10px",
                                        borderRadius: 8,
                                    }}
                                >
                  ❌ Ocurrió un error. Probá de nuevo.
                </span>
                            )}
                        </div>
                    </form>
                </Card>

                {/* Side panel */}
                <Card
                    style={{
                        border: "1px solid #e6eefc",
                        padding: 22,
                        background:
                            "linear-gradient(180deg, rgba(59,130,246,.06), rgba(59,130,246,.03))",
                    }}
                >
                    <div style={{ display: "grid", gap: 14 }}>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: 18,
                                color: "#0f172a",
                                letterSpacing: -0.2,
                            }}
                        >
                            ¿Por qué contactarnos?
                        </h3>
                        <Feature
                            title="Soporte académico"
                            desc="Integraciones de IA para corrección de apuntes, rúbricas y créditos."
                        />
                        <Feature
                            title="Implementación rápida"
                            desc="Nos adaptamos a tu flujo actual, sin romper tu UI ni tu base."
                        />
                        <Feature
                            title="En tonos azules 😉"
                            desc="Coherencia visual con el resto del proyecto."
                        />

                        <div
                            style={{
                                marginTop: 8,
                                padding: 14,
                                borderRadius: 12,
                                border: "1px dashed rgba(37,99,235,.35)",
                                background:
                                    "linear-gradient(180deg, rgba(219,234,254,.45), rgba(219,234,254,.18))",
                            }}
                        >
                            <p style={{ margin: 0, fontSize: 13, color: "#1e3a8a" }}>
                                También podés escribirnos luego a{" "}
                                <strong>soporte.kerana@gmail.com</strong>. Te respondemos en 24–48 hs.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

/* --- Subcomponentes & estilos --- */

function Feature({ title, desc }) {
    return (
        <div style={{ display: "grid", gap: 4 }}>
            <div
                style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#1d4ed8",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
        <span
            aria-hidden
            style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                    "radial-gradient(circle at 30% 30%, #93c5fd 0 45%, #2563eb 55% 100%)",
                boxShadow: "0 0 0 4px rgba(59,130,246,.15)",
            }}
        />
                {title}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>{desc}</p>
        </div>
    );
}

const inputStyle = {
    appearance: "none",
    outline: "none",
    border: "1px solid #cfe0ff",
    background:
        "linear-gradient(180deg, #ffffff, rgba(248, 250, 255, .7))",
    padding: "12px 14px",
    borderRadius: 10,
    fontSize: 14,
    color: "#0f172a",
    boxShadow:
        "inset 0 1px 0 rgba(255,255,255,.8), 0 1px 0 rgba(15,23,42,.03)",
};
