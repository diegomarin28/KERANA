import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Suggestions() {
    const [tipo, setTipo] = useState("mejora");
    const [mensaje, setMensaje] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const bluePalette = {
        bg: "#f0f5fa",
        primary: "#2563eb",
        secondary: "#1e40af",
        text: "#111827",
        card: "#e0ebff",
    };

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
            setError("Por favor escribe tu sugerencia");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Guardar en tabla sugerencias de Supabase
            const { error: dbError } = await supabase
                .from('sugerencias')
                .insert([{
                    tipo,
                    mensaje: mensaje.trim(),
                    email: email.trim() || null,
                    created_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            setSuccess(true);
            setMensaje("");
            setTimeout(() => setSuccess(false), 5000);

        } catch (err) {
            console.error("Error enviando sugerencia:", err);
            setError("Hubo un error al enviar tu sugerencia. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: bluePalette.bg,
                padding: "4rem 1rem",
            }}
        >
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Título */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h1
                        style={{
                            fontSize: "2.5rem",
                            color: bluePalette.primary,
                            fontWeight: "800",
                            marginBottom: "1rem",
                        }}
                    >
                        Tu opinión nos importa
                    </h1>
                    <p style={{ color: bluePalette.text, fontSize: "1.1rem" }}>
                        Ayudanos a mejorar Kerana con tus ideas y reportes
                    </p>
                </div>

                {/* Formulario */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        backgroundColor: "#fff",
                        padding: "2.5rem",
                        borderRadius: "1rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                >
                    {/* Tipo de sugerencia */}
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "600",
                                color: bluePalette.text,
                            }}
                        >
                            Tipo de sugerencia
                        </label>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            {[
                                { value: "mejora", label: "💡 Mejora", desc: "Ideas para mejorar" },
                                { value: "problema", label: "🐛 Problema", desc: "Reportar un bug" },
                                { value: "colaborar", label: "🤝 Colaborar", desc: "Unirme al equipo" }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTipo(option.value)}
                                    style={{
                                        flex: "1 1 200px",
                                        padding: "1rem",
                                        borderRadius: "0.75rem",
                                        border: `2px solid ${tipo === option.value ? bluePalette.primary : '#e5e7eb'}`,
                                        backgroundColor: tipo === option.value ? bluePalette.card : '#fff',
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        textAlign: "left"
                                    }}
                                >
                                    <div style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                                        {option.label}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                                        {option.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "600",
                                color: bluePalette.text,
                            }}
                        >
                            Email (opcional)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                border: "1px solid #e5e7eb",
                                fontSize: "1rem",
                                boxSizing: "border-box"
                            }}
                        />
                        <small style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                            Si querés que te contactemos sobre tu sugerencia
                        </small>
                    </div>

                    {/* Mensaje */}
                    <div style={{ marginBottom: "1.5rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "600",
                                color: bluePalette.text,
                            }}
                        >
                            Tu sugerencia *
                        </label>
                        <textarea
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Contanos tu idea, problema o cómo querés colaborar..."
                            required
                            rows={6}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                border: "1px solid #e5e7eb",
                                fontSize: "1rem",
                                fontFamily: "inherit",
                                resize: "vertical",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {/* Mensajes de estado */}
                    {error && (
                        <div
                            style={{
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                backgroundColor: "#fee2e2",
                                color: "#991b1b",
                                marginBottom: "1rem",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            style={{
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                backgroundColor: "#d1fae5",
                                color: "#065f46",
                                marginBottom: "1rem",
                            }}
                        >
                            ¡Gracias por tu sugerencia! La revisaremos pronto.
                        </div>
                    )}

                    {/* Botones */}
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: "0.875rem",
                                backgroundColor: loading ? "#9ca3af" : bluePalette.primary,
                                color: "#fff",
                                border: "none",
                                borderRadius: "0.75rem",
                                fontSize: "1rem",
                                fontWeight: "600",
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: loading ? "none" : "0 4px 10px rgba(37,99,235,0.3)",
                            }}
                        >
                            {loading ? "Enviando..." : "Enviar sugerencia"}
                        </button>
                        <Link
                            to="/"
                            style={{
                                flex: 1,
                                padding: "0.875rem",
                                backgroundColor: "#fff",
                                color: bluePalette.primary,
                                border: `2px solid ${bluePalette.primary}`,
                                borderRadius: "0.75rem",
                                fontSize: "1rem",
                                fontWeight: "600",
                                textAlign: "center",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
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