import SearchBar from "../components/SearchBar";

export default function Home() {
    return (
        <div style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "12vh",
            background: "#fff"
        }}>
            <div className="container" style={{ textAlign: "center" }}>
                <h1
                    style={{
                        /* tamaño más razonable */
                        fontSize: "clamp(28px, 5vw, 56px)",
                        lineHeight: 1.15,
                        margin: "0 0 14px 0",

                        /* degradado animado */
                        backgroundImage: "linear-gradient(270deg, #22d3ee, var(--accent), var(--accent-2), #22d3ee)",
                        backgroundSize: "300% 300%",
                        backgroundRepeat: "no-repeat",

                        /* ¡clave para que no sea un rectángulo! */
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",

                        /* entrada + animación de color */
                        animation: "floatUp .6s ease-out both, shine 6s ease-in-out infinite"
                    }}
                >
                    Conectando tu futuro con su experiencia
                </h1>




                <p style={{ color: "var(--muted)", margin: "0 0 24px 0", fontSize: "clamp(14px, 2.2vw, 18px)" }}>
                    Buscá profesores, cursos, mentores y apuntes en un solo lugar.
                </p>

                <SearchBar />
            </div>
        </div>
    );
}
