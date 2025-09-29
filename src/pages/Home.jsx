import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";

const HERO_BG = "gradient"; // podés cambiar: "solid" | "gradient" | "radial"

const heroBackground = {
    solid: "#0b5ed7",
    gradient: "linear-gradient(135deg, #0ea5a3 0%, #2563eb 40%, #f59e0b 100%)",
    radial: "radial-gradient(1200px 600px at 20% 20%, #2563eb 0%, #0ea5a3 45%, #f59e0b 80%)",
}[HERO_BG];

export default function Home() {
    const [reveal, setReveal] = useState(false);
    const [scrollProg, setScrollProg] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setReveal(true), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            const y = window.scrollY || 0;
            const h = Math.max(0, Math.min(1, y / 300));
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setScrollProg(h));
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
    }, []);

    return (
        <div>
            {/* HERO */}
            <section
                style={{
                    minHeight: "72vh", display: "grid", placeItems: "center",
                    padding: "96px 16px 56px", background: heroBackground, color: "#fff",
                }}
            >
                <div style={{ width: "min(1080px, 92vw)", textAlign: "center" }}>
                    <h1
                        style={{
                            fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 800,
                            margin: "0 0 14px", lineHeight: 1.15,
                            opacity: reveal ? 1 : 0,
                            transform: `translateY(${(reveal ? 0 : 10) - scrollProg * 20}px)`,
                            transition: "opacity 600ms ease, transform 600ms ease",
                        }}
                    >
                        Conectando tu futuro con su experiencia
                    </h1>
                    <p style={{
                        color: "rgba(255,255,255,.9)", margin: "0 0 24px",
                        fontSize: "clamp(14px, 2.2vw, 18px)",
                        opacity: reveal ? 1 : 0,
                        transform: `translateY(${(reveal ? 0 : 8) - scrollProg * 14}px)`,
                        transition: "opacity 700ms ease 80ms, transform 700ms ease 80ms",
                    }}>
                        Buscá profesores, cursos, mentores y apuntes en un solo lugar.
                    </p>
                    <SearchBar />
                </div>
            </section>

            <main style={{ background: "#fff", color: "#111827" }}>
                {/* Impacto */}
                <section style={{ padding: "64px 16px", borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ width: "min(1080px, 92vw)", margin: "0 auto" }}>
                        <h2>¿Por qué apuntes digitales?</h2>
                        <p style={{ color: "#6b7280", marginTop: 6 }}>
                            Ahorrás papel, tinta y transporte compartiendo PDF.
                        </p>
                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 20,
                        }}>
                            <Card><StatCard title="Papel ahorrado" value="~12 hojas/apunte" /></Card>
                            <Card><StatCard title="Agua ahorrada" value="~10 L/apunte" /></Card>
                            <Card><StatCard title="CO₂ evitado" value="~80 g/apunte" /></Card>
                        </div>
                    </div>
                </section>

                {/* Destacados */}
                <section style={{ padding: "56px 16px" }}>
                    <div style={{ width: "min(1080px, 92vw)", margin: "0 auto" }}>
                        <h2>Material destacado</h2>
                        <p style={{ color: "#6b7280" }}>Últimos apuntes de la comunidad.</p>
                        <div style={{
                            marginTop: 20, display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16,
                        }}>
                            {[1, 2, 3, 4, 5, 6].map(k => (
                                <Card key={k}>
                                    <div style={{ height: 120, background: "#f3f4f6", borderRadius: 8 }} />
                                    <h3 style={{ margin: "12px 0 6px", fontSize: 16 }}>Apunte #{k}</h3>
                                    <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                                        Descripción breve del recurso.
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <section style={{ borderTop: "1px solid #e5e7eb", background: "#0b1e3a", color: "#fff" }}>
                    <div style={{
                        width: "min(1080px, 92vw)", margin: "0 auto", padding: "56px 16px",
                        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20,
                    }}>
                        <FooterCol title="Sobre nosotros" items={["Misión", "Equipo", "Cómo funciona Kerana"]} />
                        <FooterCol title="Contacto" items={["hola@kerana.app", "Soporte", "Prensa"]} />
                        <FooterCol title="Sugerencias" items={["Mejora", "Problema", "Unirse como colaborador"]} />
                    </div>
                </section>
            </main>
        </div>
    )
}

function StatCard({ title, value }) {
    return (
        <div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{value}</div>
        </div>
    )
}

function FooterCol({ title, items }) {
    return (
        <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{title}</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {items.map(t => <li key={t}><a href="#" style={{ color: "rgba(255,255,255,.9)" }}>{t}</a></li>)}
            </ul>
        </div>
    )
}
