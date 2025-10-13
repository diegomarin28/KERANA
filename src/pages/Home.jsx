import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import ScrollDownHint from "../components/ScrollDownHint.jsx";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import ApunteCard from "../components/ApunteCard.jsx";


const HERO_BG = "gradient"; // podés cambiar: "solid" | "gradient" | "radial"

const heroBackground = {
    solid: "#0b5ed7", // #0097b2 turquesa , #386641 verde
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

    const [topNotes, setTopNotes] = useState([]);
    const [loadingTop, setLoadingTop] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingTop(true);
                const { data, error } = await supabase.rpc("top_apuntes_best", { limit_count: 6 });
                if (error) throw error;

                // Obtener file_path de cada apunte
                const apIds = data.map(d => d.apunte_id);
                const { data: apuntes, error: apError } = await supabase
                    .from('apunte')
                    .select(`
                                     id_apunte, 
                                     file_path,
                                     usuario:id_usuario(nombre)
                                     `)
                    .in('id_apunte', apIds);


                if (apError) throw apError;

                const filePathMap = new Map(apuntes.map(a => [a.id_apunte, a.file_path]));

                // Generar signed URLs
                const urls = {};
                for (const note of data) {
                    const filePath = filePathMap.get(note.apunte_id);
                    if (filePath) {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(filePath, 3600);

                        if (!signedError && signedData) {
                            urls[note.apunte_id] = signedData.signedUrl;
                        }
                    }
                }

                const notesWithUrls = data.map(note => {
                    const apunte = apuntes.find(a => a.id_apunte === note.apunte_id);
                    return {
                        ...note,
                        usuario: apunte?.usuario || { nombre: 'Anónimo' },
                        signedUrl: urls[note.apunte_id] || null
                    };
                });

                if (mounted) setTopNotes(notesWithUrls || []);
            } catch (e) {
                console.error(e);
                if (mounted) setTopNotes([]);
            } finally {
                if (mounted) setLoadingTop(false);
            }
        })();
        return () => { mounted = false; };
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
        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div>
            {/* HERO */}
            <section
                id="hero"
                style={{
                    position: "relative", minHeight: "72vh", display: "grid", placeItems: "center",
                    padding: "64px 16px 0", background: heroBackground, color: "#fff"
                }}
            >
                <div style={{ width: "min(1080px, 92vw)", textAlign: "center" }}>
                    <h1
                        style={{
                            fontSize: "clamp(28px, 5vw, 56px)",
                            fontWeight: 800,
                            margin: "0 0 14px",
                            lineHeight: 1.15,
                            opacity: reveal ? 1 : 0,
                            transform: `translateY(${(reveal ? 0 : 10) - scrollProg * 20}px)`,
                            transition: "opacity 600ms ease, transform 600ms ease",
                        }}
                    >
                        Conectando tu futuro con su experiencia
                    </h1>
                    <p
                        style={{
                            color: "rgba(255,255,255,.9)",
                            margin: "0 0 24px",
                            fontSize: "clamp(14px, 2.2vw, 18px)",
                            opacity: reveal ? 1 : 0,
                            transform: `translateY(${(reveal ? 0 : 8) - scrollProg * 14}px)`,
                            transition: "opacity 700ms ease 80ms, transform 700ms ease 80ms",
                        }}
                    >
                        Buscá profesores, cursos, mentores y apuntes en un solo lugar.
                    </p>
                    <SearchBar />
                </div>

                {/* Flecha / scroll cue */}
                <ScrollDownHint targetId="after-hero" offset={64} label="Ver más" />
            </section>

            <main style={{ background: "#fff", color: "#111827" }}>
                {/* Siguiente sección (destino del scroll) */}
                <section
                    id="after-hero"
                    style={{
                        scrollMarginTop: "72px",
                        padding: "64px 16px",
                        borderBottom: "1px solid #e5e7eb",
                        background: "#f8fafc"
                    }}
                >
                    <div style={{ width: "min(1080px, 92vw)", margin: "0 auto" }}>
                        <h2 style={{ margin: 0 }}>¿Por qué apuntes digitales?</h2>
                        <p style={{ color: "#6b7280", marginTop: 6 }}>
                            Ahorro ambiental por cada apunte compartido en PDF.
                        </p>

                        {/*
                          Parámetros conservadores:
                          - Páginas típicas por apunte: 20
                          - Agua por hoja: 0.15 L/hoja (fabricación y procesado)
                          - CO2 por hoja: 1.2 g/hoja (impresión hogareña + transporte mínimo)
                        */}
                        <EcoStats
                            pagesPerNote={20}
                            waterPerSheetL={0.15}
                            co2PerSheetG={1.2}
                        />

                        <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 12 }}>
                            Estimaciones conservadoras basadas en literatura general. Los valores reales varían según tipo de papel, tinta y logística.
                            <Link to="/impacto-ambiental" style={{ color: "#2563eb", marginLeft: 8 }}>
                                Ver metodología
                            </Link>
                        </p>
                    </div>
                </section>

                {/* Mejores apuntes (últimas 24h → 7d → rating) */}
                <section style={{ padding: "56px 16px", background: "#fff" }}>
                    <div style={{ width: "min(1080px, 92vw)", margin: "0 auto" }}>
                        <h2>Mejores apuntes</h2>
                        <p style={{ color: "#6b7280" }}>
                            Top del momento (compras recientes y calificación).
                        </p>

                        {loadingTop ? (
                            <div
                                style={{
                                    marginTop: 20,
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)", // 3 por fila
                                    gridAutoRows: "auto",
                                    gap: 20,
                                }}
                            >
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            aspectRatio: "4 / 5",
                                            borderRadius: 12,
                                            background: "#f3f4f6",
                                        }}
                                    />
                                ))}
                            </div>
                        ) : topNotes.length === 0 ? (
                            <div style={{ marginTop: 16, color: "#6b7280" }}>
                                No hay compras recientes todavía. ¡Sé el primero en descubrir nuevos apuntes!
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: 20,
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", // tres columnas
                                    gap: 20,
                                    justifyItems: "center",
                                }}
                            >
                                {topNotes.slice(0, 6).map((n) => (
                                    <div
                                        key={n.apunte_id}
                                        style={{
                                            width: "100%",        // ocupa toda la celda
                                            maxWidth: 230,        // límite de ancho
                                            aspectRatio: "4 / 5", // mantiene forma vertical
                                        }}
                                    >
                                        <ApunteCard
                                            note={{
                                                id_apunte: n.apunte_id,
                                                titulo: n.titulo,
                                                descripcion: n.descripcion || '',
                                                creditos: n.creditos,
                                                estrellas: n.rating_promedio || 0,
                                                usuario: n.usuario,
                                                materia: { nombre_materia: n.materia_nombre || 'Sin materia' },
                                                signedUrl: n.signedUrl
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>



                {/* Destacados */} {/*
                <section style={{ padding: "56px 16px" }}>
                    <div style={{ width: "min(1080px, 92vw)", margin: "0 auto" }}>
                        <h2>Material destacado</h2>
                        <p style={{ color: "#6b7280" }}>Últimos apuntes de la comunidad.</p>
                        <div
                            style={{
                                marginTop: 20,
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                                gap: 16,
                            }}
                        >
                            {[1, 2, 3, 4, 5, 6].map((k) => (
                                <Card key={k}>
                                    <div
                                        style={{ height: 120, background: "#f3f4f6", borderRadius: 8 }}
                                    />
                                    <h3 style={{ margin: "12px 0 6px", fontSize: 16 }}>
                                        Apunte #{k}
                                    </h3>
                                    <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                                        Descripción breve del recurso.
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
                */}

                {/* Footer */}
                <section
                    style={{ borderTop: "1px solid #e5e7eb", background: "#0b1e3a", color: "#fff" }}
                >
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
                        <FooterCol
                            title="Sobre nosotros"
                            items={[
                                { label: "Misión Visión", to: "/mision-vision" },
                                { label: "Equipo", to: "/equipo" },
                                { label: "Cómo funciona Kerana", to: "/how-it-works" }
                            ]}
                        />
                        <FooterCol
                            title="Contacto"
                            items={[
                                { label: "kerana.soporte@gmail.com", to: "/contact" },
                                { label: "Enviar mensaje", to: "/contact" }
                            ]}
                        />
                        <FooterCol
                            title="Sugerencias"
                            items={[
                                { label: "Mejora o problema", to: "/suggestions" },
                                { label: "Colaborar con nosotros", to: "/suggestions" }
                            ]}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}

/* ======================= */
/*  COMPONENTES AMBIENTALES */
/* ======================= */

function EcoStats({ pagesPerNote, waterPerSheetL, co2PerSheetG }) {
    const paperSaved = `${pagesPerNote} hojas por apunte`;
    const waterSaved = `~${(pagesPerNote * waterPerSheetL).toFixed(1)} L por apunte`;
    const co2Saved = `~${Math.round(pagesPerNote * co2PerSheetG)} g por apunte`;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                marginTop: 20,
            }}
        >
            <Card style={{ padding: 16 }}>
                <StatCard
                    title="Papel ahorrado"
                    value={paperSaved}
                    subtitle="Estimado para un apunte de 20 páginas."
                >
                    <LeafIcon />
                </StatCard>
            </Card>
            <Card style={{ padding: 16 }}>
                <StatCard
                    title="Agua evitada"
                    value={waterSaved}
                    subtitle="Consumo de fabricación por hoja."
                >
                    <DropIcon />
                </StatCard>
            </Card>
            <Card style={{ padding: 16 }}>
                <StatCard
                    title="CO₂ evitado"
                    value={co2Saved}
                    subtitle="Impresión doméstica y traslado mínimo."
                >
                    <CloudIcon />
                </StatCard>
            </Card>
        </div>
    );
}

function StatCard({ title, value, subtitle, children }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 12, alignItems: "center" }}>
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#e2e8f0",
                    display: "grid",
                    placeItems: "center"
                }}
            >
                {children}
            </div>
            <div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{value}</div>
                {subtitle ? (
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{subtitle}</div>
                ) : null}
            </div>
        </div>
    );
}

/* Iconos simples en SVG para evitar dependencias */
function LeafIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.8">
            <path d="M5 21c8 0 14-6 14-14 0-1-.1-2-.3-3C17 5 13 6 9 6 6 6 4 5.5 3 5c0 8 6 14 14 14" />
            <path d="M9 6c0 6 3 9 9 9" />
        </svg>
    );
}

function DropIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.8">
            <path d="M12 2s6 6 6 10a6 6 0 0 1-12 0C6 8 12 2 12 2z" />
        </svg>
    );
}

function CloudIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.8">
            <path d="M20 17.5a4.5 4.5 0 0 0-2-8.5 6 6 0 0 0-11 2" />
            <path d="M6 17h11a3 3 0 0 0 3-3" />
        </svg>
    );
}

/* ======================= */
/*  FOOTER (igual)         */
/* ======================= */

function FooterCol({ title, items }) {
    return (
        <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{title}</h3>
            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: 8,
                }}
            >
                {items.map((item) => (
                    <li key={item.label}>
                        <Link
                            to={item.to}
                            style={{ color: "rgba(255,255,255,.9)", textDecoration: "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                            >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
