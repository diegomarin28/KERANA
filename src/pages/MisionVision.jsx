import { Link } from "react-router-dom";
import { useEffect } from "react";
import targetImg from "../assets/target.png";
import visionImg from "../assets/vision.png";

export default function MisionVision() {
    const bluePalette = {
        bg: "#f0f5fa",
        primary: "#2563eb",
        secondary: "#1e40af",
        text: "#111827",
        card: "#e0ebff",
    };
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";   // quita scroll
        return () => {
            document.body.style.overflow = originalOverflow; // restaura al salir
        };
    }, [])

    return (
        <div
            style={{
                height: "100dvh",
                backgroundColor: bluePalette.bg,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxSizing: "border-box",
                padding: "2rem 1rem",
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2rem",
                }}
            >
                {/* Misión con imagen */}
                <div
                    style={{
                        backgroundColor: bluePalette.card,
                        padding: "2rem",
                        borderRadius: "1rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        display: "grid",
                        gridTemplateColumns: "150px 1fr",
                        alignItems: "center",
                        gap: "1.5rem",
                    }}
                >
                    <img
                        src={targetImg}
                        alt="Misión"
                        style={{ width: "100%", maxWidth: "150px" }}
                    />
                    <div>
                        <h2
                            style={{
                                fontSize: "1.8rem",
                                marginBottom: "1rem",
                                color: bluePalette.primary,
                                fontWeight: "700",
                            }}
                        >
                            Misión
                        </h2>
                        <p style={{ color: bluePalette.text, lineHeight: 1.6 }}>
                            Brindar soluciones educativas innovadoras y accesibles, conectando
                            estudiantes con profesores, mentores y recursos de calidad que
                            potencien su aprendizaje y crecimiento personal.
                        </p>
                    </div>
                </div>

                {/* Visión con mismo estilo */}
                <div
                    style={{
                        backgroundColor: bluePalette.card,
                        padding: "2rem",
                        borderRadius: "1rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        display: "grid",
                        gridTemplateColumns: "150px 1fr",
                        alignItems: "center",
                        gap: "1.5rem",
                    }}
                >
                    <img
                        src={visionImg}
                        alt="Visión"
                        style={{ width: "100%", maxWidth: "150px" }}
                    />
                    <div>
                        <h2
                            style={{
                                fontSize: "1.8rem",
                                marginBottom: "1rem",
                                color: bluePalette.primary,
                                fontWeight: "700",
                            }}
                        >
                            Visión
                        </h2>
                        <p style={{ color: bluePalette.text, lineHeight: 1.6 }}>
                            Convertirnos en la plataforma educativa líder, reconocida por su
                            innovación y compromiso en crear un ecosistema inclusivo que acerque
                            la experiencia de los expertos al futuro de cada estudiante.
                        </p>
                    </div>
                </div>
            </div>

            {/* Botón volver */}
            <div style={{ marginTop: "3rem", textAlign: "center" }}>
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
    );
}