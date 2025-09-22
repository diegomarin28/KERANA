export default function Home() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",   // elementos apilados
                justifyContent: "center",  // centra vertical
                alignItems: "center",      // centra horizontal
                height: "100vh",           // ocupa toda la ventana
                textAlign: "center",       // centra el texto

            }}
        >
            <h1 style={{ fontSize: "2.5rem", marginBottom: "10px"}}>
                Conectando tu futuro con su experiencia
            </h1>

            <p style={{ color: "#555", marginBottom: "20px" }}>
                Buscá profesores, cursos, mentores y apuntes en un solo lugar.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    placeholder="Buscá profesores, cursos, mentores..."
                    style={{
                        padding: "10px",
                        width: "300px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                    }}
                />
                <button style={{ padding: "10px 15px" }}>Buscar</button>
            </div>
        </div>
    );
}
