import { Link } from "react-router-dom";

export default function AmbientalImpact() {
    return (
        <main style={{ padding: "48px 16px", background: "#fff", color: "#0f172a" }}>
            <div style={{ width: "min(960px, 92vw)", margin: "0 auto" }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
                    Metodología de estimación de impacto ambiental
                </h1>
                <p style={{ color: "#475569", marginTop: 8 }}>
                    Esta página describe cómo estimamos el ahorro potencial al preferir apuntes digitales
                    en lugar de impresos. Usamos un “apunte promedio” de <strong>10 páginas</strong>.
                </p>

                <section style={{ marginTop: 28 }}>
                    <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>Supuestos operativos</h2>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                        <li>Extensión promedio por apunte: <strong>10 páginas A4</strong>.</li>
                        <li>Papel de oficina 80 g/m², impresión hogareña o de facultad.</li>
                        <li>Los cálculos se presentan por apunte y pueden escalarse a nivel usuario o plataforma.</li>
                    </ul>
                </section>

                <section style={{ marginTop: 28 }}>
                    <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>Indicadores y fórmulas</h2>

                    <div style={{ marginTop: 12 }}>
                        <h3 style={{ fontSize: 16, margin: "0 0 6px" }}>Agua incorporada (huella hídrica)</h3>
                        <p style={{ color: "#475569", margin: 0 }}>
                            La literatura especializada reporta un rango de <strong>~2–13 L por hoja A4</strong> para papel de impresión y escritura
                            (dependiendo del tipo de fibra, geografía y recuperación de papel).
                            En Kerana usamos un valor conservador dentro de ese rango para comunicar resultados.
                        </p>
                        <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", padding: 12, borderRadius: 10, marginTop: 8 }}>
                            <code>Agua_por_apunte [L] = páginas × L_por_hoja</code>
                            <div style={{ marginTop: 6, color: "#475569" }}>
                                Para el “apunte promedio” (10 páginas) y un valor intermedio de referencia,
                                el orden de magnitud sería 10 × 5 L = 50 L por apunte.
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <h3 style={{ fontSize: 16, margin: "0 0 6px" }}>Huella de carbono (CO₂e)</h3>
                        <p style={{ color: "#475569", margin: 0 }}>
                            Estudios de análisis de ciclo de vida (ACV) para papel de oficina estiman aproximadamente
                            <strong> 4.3–4.7 g CO₂e por hoja A4</strong> (solo papel; la impresión puede agregar una fracción adicional según el equipo y energía).
                        </p>
                        <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", padding: 12, borderRadius: 10, marginTop: 8 }}>
                            <code>CO₂e_por_apunte [g] = páginas × g_CO₂e_por_hoja</code>
                            <div style={{ marginTop: 6, color: "#475569" }}>
                                Para 10 páginas con 4.6 g/hoja como referencia, el orden de magnitud sería 46 g CO₂e por apunte.
                            </div>
                        </div>
                    </div>

                    <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>
                        En la interfaz del Home mostramos valores redondeados y conservadores con fines de comunicación.
                        Esta página documenta el rango técnico y las fuentes originales.
                    </p>
                </section>

                <section style={{ marginTop: 28 }}>
                    <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>Fuentes técnicas</h2>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                        <li>
                            <a
                                href="https://waterfootprint.org/en/resources/interactive-tools/product-gallery/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#2563eb", textDecoration: "none" }}
                            >
                                Water Footprint Network
                            </a>
                            : estimaciones de huella hídrica para papel de impresión y escritura (~2–13 L por hoja A4).
                        </li>
                        <li>
                            <a
                                href="https://ghgprotocol.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#2563eb", textDecoration: "none" }}
                            >
                                GHG Protocol
                            </a>
                            : metodología de cálculo de emisiones de gases de efecto invernadero.
                        </li>
                        <li>
                            <a
                                href="https://www.unep.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#2563eb", textDecoration: "none" }}
                            >
                                United Nations Environment Programme (UNEP)
                            </a>
                            : reportes globales de sostenibilidad y producción responsable.
                        </li>
                        <li>
                            <a
                                href="https://pubs.acs.org/doi/10.1021/es050652z"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#2563eb", textDecoration: "none" }}
                            >
                                Dias & Arroja (2005)
                            </a>
                            : análisis de ciclo de vida del papel de oficina (≈ 4.3–4.7 g CO₂e por hoja A4).
                        </li>
                    </ul>

                    <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 20 }}>
                        Los datos provienen de fuentes públicas reconocidas. Kerana no tiene afiliación con estas organizaciones
                        y su uso es exclusivamente informativo y educativo, conforme a la Ley 9.739 de Uruguay y al Convenio de Berna.
                    </p>
                </section>

                <div style={{ marginTop: 28 }}>
                    <Link to="/" style={{ textDecoration: "none", color: "#2563eb" }}>
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}
