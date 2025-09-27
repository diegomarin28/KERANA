import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";

const HERO_BG = "solid"; // "solid" | "gradient" | "radial"

const heroBackground = {
    solid: "#0b5ed7",
    gradient: "linear-gradient(135deg, #0b5ed7 0%, #2563eb 35%, #1e3a8a 100%)",
    radial: "radial-gradient(1200px 600px at 20% 20%, #2563eb 0%, #1e40af 45%, #0b5ed7 70%, #0a3a7a 100%)",
}[HERO_BG];

export default function Home() {
    const [reveal, setReveal] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setReveal(true), 50);
        return () => clearTimeout(t);
    }, []);

    const [scrollProg, setScrollProg] = useState(0);

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            const y = window.scrollY || 0;
            // cuánto queremos que “parallaxee” el hero antes de quedarse quieto
            const h = Math.max(0, Math.min(1, y / 300)); // clamp 0..1
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setScrollProg(h));
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
    }, []);

    return (
        <div>
            {/* HERO AZUL */}
            <section
                style={{
                    minHeight: "72vh",
                    display: "grid",
                    alignItems: "center",
                    justifyItems: "center",
                    padding: "96px 16px 56px",
                    background: heroBackground,
                    color: "#fff",
                }}
            >
                <div style={{ width: "min(1080px, 92vw)", textAlign: "center" }}>
                    <h1
                        style={{
                            fontSize: "clamp(28px, 5vw, 56px)",
                            lineHeight: 1.15,
                            margin: "0 0 14px 0",
                            fontWeight: 800,
                            // fade


                            opacity: reveal ? 1 : 0,
                            // movimiento: parte del load-in (+10px) + parallax hacia arriba al scrollear
                            transform: `translateY(${ (reveal ? 0 : 10) - scrollProg * 20 }px)`,
                            transition: "opacity 600ms ease, transform 600ms ease",
                            willChange: "transform, opacity",
                        }}
                    >
                        Conectando tu futuro con su experiencia
                    </h1>

                    <p
                        style={{
                            color: "rgba(255,255,255,.9)",
                            margin: "0 0 24px 0",
                            fontSize: "clamp(14px, 2.2vw, 18px)",
                            opacity: reveal ? 1 : 0,
                            transform: `translateY(${ (reveal ? 0 : 8) - scrollProg * 14 }px)`,
                            transition: "opacity 700ms ease 80ms, transform 700ms ease 80ms",
                            willChange: "transform, opacity",
                        }}
                    >
                        Buscá profesores, cursos, mentores y apuntes en un solo lugar.
                    </p>



                    <SearchBar />
                </div>
            </section>

            {/* Sentinela para el Header */}
            <div id="hero-sentinel" style={{ position: "relative", height: 1 }} />

            {/* CONTENIDO BLANCO */}
            <main style={{ background: "#fff", color: "#111827" }}>
                {/* Impacto ecológico */}
                <section style={{ padding: "64px 16px", borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ width: "min(1080px, 92vw)", margin: "0 auto" }}>
                        <h2 style={{ margin: 0, fontSize: 28 }}>¿Por qué apuntes digitales?</h2>
                        <p style={{ color: "#6b7280", marginTop: 6 }}>
                            Descargando PDF en vez de imprimir, ahorrás papel, tinta y transporte.
                        </p>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: 16,
                                marginTop: 20,
                            }}
                        >
                            <StatCard title="Papel ahorrado (estimado)" value="~ 12 hojas / apunte" />
                            <StatCard title="Ahorro de agua (producción papel)" value="~ 10 L / apunte" />
                            <StatCard title="CO₂ transporte evitado" value="~ 80 g / apunte" />
                        </div>
                    </div>
                </section>

                {/* Destacados */}
                <section style={{ padding: "56px 16px" }}>
                    <div style={{ width: "min(1080px, 92vw)", margin: "0 auto" }}>
                        <h2 style={{ margin: 0, fontSize: 28 }}>Material destacado</h2>
                        <p style={{ color: "#6b7280", marginTop: 6 }}>Últimos apuntes y recursos compartidos por la comunidad.</p>
                        <div
                            style={{
                                marginTop: 20,
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                                gap: 16,
                            }}
                        >
                            {[1, 2, 3, 4, 5, 6].map((k) => (
                                <div
                                    key={k}
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 12,
                                        padding: 16,
                                        background: "#fff",
                                    }}
                                >
                                    <div style={{ height: 120, background: "#f3f4f6", borderRadius: 8 }} />
                                    <h3 style={{ margin: "12px 0 6px", fontSize: 16 }}>Apunte #{k}</h3>
                                    <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                                        Descripción breve del recurso subido por estudiantes.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Bloque inferior */}
                <section style={{ borderTop: "1px solid #e5e7eb", background: "#0b1e3a", color: "#fff" }}>
                    <div
                        style={{
                            width: "min(1080px, 92vw)",
                            margin: "0 auto",
                            padding: "56px 16px",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 20,
                        }}
                    >
                        <FooterCol title="Sobre nosotros" items={["Nuestra misión", "Equipo", "Cómo funciona Kerana"]} />
                        <FooterCol title="Contacto" items={["hola@kerana.app", "Soporte y ayuda", "Prensa"]} />
                        <FooterCol title="Sugerencias" items={["Proponer una mejora", "Reportar un problema", "Únete como colaborador"]} />
                    </div>
                </section>
            </main>
        </div>
    );
}

/* ——— subcomponentes ——— */
function StatCard({ title, value }) {
    return (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
            <div style={{ fontSize: 14, color: "#6b7280" }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{value}</div>
        </div>
    );
}

function FooterCol({ title, items }) {
    return (
        <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, letterSpacing: 0.2 }}>{title}</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {items.map((t) => (
                    <li key={t}>
                        <a href="#" style={{ color: "rgba(255,255,255,.9)", textDecoration: "none" }} onClick={(e) => e.preventDefault()}>
                            {t}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
