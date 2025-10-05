import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function HowItWorks() {
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

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: bluePalette.bg,
                padding: "4rem 1rem",
            }}
        >
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Título principal */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h1
                        style={{
                            fontSize: "2.5rem",
                            color: bluePalette.primary,
                            fontWeight: "800",
                            marginBottom: "1rem",
                        }}
                    >
                        ¿Cómo funciona Kerana?
                    </h1>
                    <p style={{ color: bluePalette.text, fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}>
                        Conectamos tu futuro con la experiencia de quienes ya recorrieron el camino.
                    </p>
                </div>

                {/* Objetivos */}
                <div
                    style={{
                        backgroundColor: bluePalette.card,
                        padding: "2.5rem",
                        borderRadius: "1rem",
                        marginBottom: "2rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "1.8rem",
                            color: bluePalette.primary,
                            fontWeight: "700",
                            marginBottom: "1.5rem",
                        }}
                    >
                        Nuestros Objetivos
                    </h2>
                    <ul style={{ color: bluePalette.text, lineHeight: 1.8, fontSize: "1.05rem" }}>
                        <li style={{ marginBottom: "1rem" }}>
                            <strong>Conectar alumnos</strong> que quieren brindar su conocimiento con aquellos que buscan a alguien que se los ofrezca.
                        </li>
                        <li style={{ marginBottom: "1rem" }}>
                            <strong>Orientar</strong> a los alumnos en la elección de profesores.
                        </li>
                        <li>
                            <strong>Proveer apuntes</strong> a los alumnos interesados.
                        </li>
                    </ul>
                </div>

                {/* Qué nos mueve */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        padding: "2.5rem",
                        borderRadius: "1rem",
                        marginBottom: "2rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "1.8rem",
                            color: bluePalette.primary,
                            fontWeight: "700",
                            marginBottom: "1.5rem",
                        }}
                    >
                        ¿Qué nos mueve?
                    </h2>
                    <p style={{ color: bluePalette.text, lineHeight: 1.8, fontSize: "1.05rem" }}>
                        No son pocos los estudiantes que no tienen suficiente información y contactos para poder avanzar de la mejor manera en la facultad.
                        Entonces, <strong>buscamos ayudar a los estudiantes</strong> para que su pasaje por la universidad sea lo más ameno posible.
                    </p>
                </div>

                {/* Cómo funciona - Pasos */}
                <div style={{ display: "grid", gap: "1.5rem", marginBottom: "3rem" }}>
                    <StepCard
                        number="1"
                        title="Buscá"
                        description="Encontrá profesores, materias, mentores y apuntes en un solo lugar."
                        palette={bluePalette}
                    />
                    <StepCard
                        number="2"
                        title="Conectá"
                        description="Lee reseñas de otros alumnos y contacta mentores para guiarte."
                        palette={bluePalette}
                    />
                    <StepCard
                        number="3"
                        title="Compartí"
                        description="Subí tus apuntes y ayuda a otros estudiantes en su camino."
                        palette={bluePalette}
                    />
                </div>

                {/* Botón volver */}
                <div style={{ textAlign: "center" }}>
                    <Link
                        to="/"
                        style={{
                            display: "inline-block",
                            padding: "0.8rem 2rem",
                            backgroundColor: bluePalette.primary,
                            color: "#fff",
                            borderRadius: "0.75rem",
                            textDecoration: "none",
                            fontWeight: "600",
                            boxShadow: "0 4px 10px rgba(37,99,235,0.3)",
                        }}
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StepCard({ number, title, description, palette }) {
    return (
        <div
            style={{
                backgroundColor: "#fff",
                padding: "2rem",
                borderRadius: "1rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "1.5rem",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: palette.card,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    fontWeight: "800",
                    color: palette.primary,
                }}
            >
                {number}
            </div>
            <div>
                <h3
                    style={{
                        fontSize: "1.5rem",
                        color: palette.primary,
                        fontWeight: "700",
                        marginBottom: "0.5rem",
                    }}
                >
                    {title}
                </h3>
                <p style={{ color: palette.text, lineHeight: 1.6, margin: 0 }}>
                    {description}
                </p>
            </div>
        </div>
    );
}