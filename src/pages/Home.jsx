import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import ScrollDownHint from "../components/ScrollDownHint.jsx";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import ApunteCard from "../components/ApunteCard.jsx";
import NotesCarousel from "../components/NotesCarousel.jsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faTint, faCloud, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { notesAPI } from "../api/database";

// Hook personalizado para detectar móvil
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 375);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

export default function Home() {
    const [reveal, setReveal] = useState(false);
    const [scrollProg, setScrollProg] = useState(0);
    const isMobile = useIsMobile();

    useEffect(() => {
        const t = setTimeout(() => setReveal(true), 50);
        return () => clearTimeout(t);
    }, []);

    const [topNotes, setTopNotes] = useState([]);
    const [loadingTop, setLoadingTop] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: userData } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('auth_id', user.id)
                    .single();

                if (userData) {
                    setCurrentUserId(userData.id_usuario);
                }
            }
        };
        getCurrentUser();
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingTop(true);
                const limit = isMobile ? 4 : 8;

                // Intentar obtener los apuntes
                const { data, error } = await supabase.rpc("top_apuntes_best", { limit_count: limit });

                if (error) {
                    console.error('Error en top_apuntes_best:', error);
                    // Fallback: obtener apuntes directamente si la función RPC falla
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('apuntes_completos')
                        .select('*')
                        .limit(limit);

                    if (fallbackError) throw fallbackError;

                    // Procesar fallback data
                    if (mounted && fallbackData) {
                        const processedNotes = fallbackData.map(note => ({
                            apunte_id: note.id_apunte,
                            titulo: note.titulo,
                            descripcion: note.descripcion,
                            creditos: note.creditos,
                            rating_promedio: note.rating_promedio || 0,
                            usuario_nombre: note.usuario?.nombre || 'Anónimo',
                            nombre_materia: note.materia?.nombre_materia || 'Sin materia',
                            signedUrl: null,
                            thumbnail_path: note.thumbnail_path,
                            likes_count: 0,
                            id_usuario: note.id_usuario
                        }));
                        setTopNotes(processedNotes);
                    }
                    return;
                }

                if (!data || data.length === 0) {
                    if (mounted) setTopNotes([]);
                    return;
                }

                const apIds = data.map(d => d.apunte_id);
                const { data: apuntes, error: apError } = await supabase
                    .from('apuntes_completos')
                    .select('*')
                    .in('id_apunte', apIds);

                if (apError) throw apError;

                const filePathMap = new Map(apuntes.map(a => [a.id_apunte, a.file_path]));

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

                const likesPromises = data.map(note => notesAPI.getLikesCount(note.apunte_id));
                const likesResults = await Promise.all(likesPromises);

                const likesMap = new Map(
                    data.map((note, idx) => [note.apunte_id, likesResults[idx]?.data || 0])
                );

                const notesWithUrls = data.map(note => {
                    const apunte = apuntes.find(a => a.id_apunte === note.apunte_id);
                    return {
                        id_apunte: note.apunte_id,
                        apunte_id: note.apunte_id,
                        titulo: note.titulo,
                        descripcion: note.descripcion || '',
                        creditos: note.creditos,
                        rating_promedio: note.rating_promedio || 0,
                        usuario_nombre: note.usuario_nombre || 'Anónimo',
                        nombre_materia: note.nombre_materia || 'Sin materia',
                        usuario: apunte?.usuario || { nombre: note.usuario_nombre || 'Anónimo' },
                        signedUrl: urls[note.apunte_id] || null,
                        thumbnail_path: apunte?.thumbnail_path || null,
                        likes_count: likesMap.get(note.apunte_id) || 0,
                        id_usuario: note.id_usuario
                    };
                });

                if (mounted) setTopNotes(notesWithUrls || []);
            } catch (e) {
                console.error('Error general cargando apuntes:', e);
                if (mounted) setTopNotes([]);
            } finally {
                if (mounted) setLoadingTop(false);
            }
        })();
        return () => { mounted = false; };
    }, [isMobile]);

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
        <div style={{
            width: '100%',
            maxWidth: '100vw',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* HERO */}
            <section
                id="hero"
                style={{
                    position: "relative",
                    minHeight: isMobile ? "60vh" : "65vh",
                    display: "grid",
                    placeItems: "center",
                    padding: isMobile ? "80px 0 32px" : "80px 20px 40px",
                    background: "linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)",
                    color: "#fff",
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                <div style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.1,
                    background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                }} />

                <div style={{
                    width: "100%",
                    maxWidth: isMobile ? "100%" : "1080px",
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                    padding: isMobile ? "0 16px" : "0",
                }}>
                    <h1
                        style={{
                            fontSize: isMobile ? "22px" : "clamp(32px, 6vw, 64px)",
                            fontWeight: 800,
                            margin: "0 0 12px",
                            lineHeight: 1.2,
                            opacity: reveal ? 1 : 0,
                            transform: `translateY(${(reveal ? 0 : 20) - scrollProg * 30}px)`,
                            transition: "opacity 700ms ease, transform 700ms ease",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Conectando tu futuro con su experiencia
                    </h1>
                    <p
                        style={{
                            color: "rgba(255,255,255,0.95)",
                            fontSize: isMobile ? "13px" : "clamp(16px, 2.5vw, 20px)",
                            opacity: reveal ? 1 : 0,
                            transform: `translateY(${(reveal ? 0 : 15) - scrollProg * 20}px)`,
                            transition: "opacity 800ms ease 100ms, transform 800ms ease 100ms",
                            lineHeight: 1.5,
                            maxWidth: "100%",
                            margin: isMobile ? "0 auto 20px" : "0 auto 32px",
                        }}
                    >
                        Buscá profesores, cursos, mentores y apuntes en un solo lugar
                    </p>
                    <div style={{
                        opacity: reveal ? 1 : 0,
                        transform: `translateY(${(reveal ? 0 : 10) - scrollProg * 15}px)`,
                        transition: "opacity 900ms ease 200ms, transform 900ms ease 200ms",
                        width: '100%',
                    }}>
                        <SearchBar />
                    </div>
                </div>

                <ScrollDownHint targetId="after-hero" offset={64} label="Explorar" />
            </section>

            <main style={{
                background: "#fff",
                color: "#111827",
                width: '100%',
                maxWidth: '100vw',
                overflow: 'hidden',
            }}>
                {/* Sección de impacto ambiental */}
                <section
                    id="after-hero"
                    style={{
                        scrollMarginTop: "72px",
                        padding: isMobile ? "32px 16px" : "80px 20px",
                        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                        position: "relative",
                        width: '100%',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{
                        width: "100%",
                        maxWidth: "1080px",
                        margin: "0 auto",
                    }}>
                        {/* Header con badge */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            marginBottom: 10,
                        }}>
                            <span style={{
                                display: "inline-block",
                                padding: isMobile ? "4px 10px" : "6px 14px",
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "#fff",
                                borderRadius: 20,
                                fontSize: isMobile ? 10 : 13,
                                fontWeight: 700,
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}>
                                Impacto Positivo
                            </span>
                        </div>

                        <h2 style={{
                            margin: "0 0 8px",
                            fontSize: isMobile ? "18px" : "clamp(28px, 4vw, 42px)",
                            fontWeight: 800,
                            textAlign: "center",
                            color: "#0f172a",
                            letterSpacing: "-0.02em",
                        }}>
                            ¿Por qué apuntes digitales?
                        </h2>
                        <p style={{
                            color: "#64748b",
                            textAlign: "center",
                            fontSize: isMobile ? "12px" : "clamp(14px, 2vw, 17px)",
                            maxWidth: "100%",
                            margin: isMobile ? "0 auto 20px" : "0 auto 40px",
                            lineHeight: 1.5,
                        }}>
                            Cada apunte compartido en PDF genera un impacto ambiental positivo
                        </p>

                        <EcoStats
                            pagesPerNote={20}
                            waterPerSheetL={0.15}
                            co2PerSheetG={1.2}
                            isMobile={isMobile}
                        />

                        <p style={{
                            color: "#94a3b8",
                            fontSize: isMobile ? 10 : 13,
                            marginTop: isMobile ? 16 : 24,
                            textAlign: "center",
                            lineHeight: 1.5,
                        }}>
                            Estimaciones conservadoras basadas en literatura general.
                            {!isMobile && " Los valores reales varían según tipo de papel, tinta y logística."}
                            <Link
                                to="/impacto-ambiental"
                                style={{
                                    color: "#2563eb",
                                    marginLeft: isMobile ? 0 : 8,
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    display: isMobile ? "block" : "inline",
                                    marginTop: isMobile ? "6px" : "0",
                                }}
                            >
                                Ver metodología <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 9 }} />
                            </Link>
                        </p>
                    </div>
                </section>

                {/* Mejores apuntes */}
                <section style={{
                    padding: isMobile ? "32px 0" : "80px 20px",
                    background: "#fff",
                    borderTop: "1px solid #f1f5f9",
                    width: '100%',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: "100%",
                        maxWidth: "1080px",
                        margin: "0 auto",
                    }}>
                        <div style={{
                            textAlign: "center",
                            marginBottom: isMobile ? 20 : 48,
                            padding: isMobile ? "0 16px" : "0",
                        }}>
                            <h2 style={{
                                fontSize: isMobile ? "18px" : "clamp(28px, 4vw, 42px)",
                                fontWeight: 800,
                                color: "#0f172a",
                                margin: "0 0 8px",
                                letterSpacing: "-0.02em",
                            }}>
                                Mejores apuntes
                            </h2>
                            <p style={{
                                color: "#64748b",
                                margin: 0,
                                fontSize: isMobile ? "12px" : "clamp(14px, 2vw, 17px)",
                                lineHeight: 1.5,
                            }}>
                                Top del momento según compras recientes y calificación
                            </p>
                        </div>

                        {loadingTop ? (
                            isMobile ? (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    padding: '0 16px',
                                }}>
                                    <SkeletonCard isMobile={isMobile} />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                        gap: 24,
                                        justifyItems: "center",
                                        width: '100%',
                                    }}
                                >
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <SkeletonCard key={i} isMobile={false} />
                                    ))}
                                </div>
                            )
                        ) : topNotes.length === 0 ? (
                            <div style={{
                                textAlign: "center",
                                padding: isMobile ? "24px 16px" : "60px 20px",
                                background: "#f8fafc",
                                borderRadius: isMobile ? 12 : 16,
                                border: "2px dashed #e2e8f0",
                                margin: isMobile ? "0 16px" : "0",
                            }}>
                                <div style={{
                                    fontSize: isMobile ? 32 : 48,
                                    marginBottom: isMobile ? 10 : 16,
                                    opacity: 0.5,
                                }}>
                                    📚
                                </div>
                                <p style={{
                                    color: "#64748b",
                                    margin: 0,
                                    fontSize: isMobile ? 12 : 16,
                                }}>
                                    No hay compras recientes todavía. ¡Sé el primero en descubrir nuevos apuntes!
                                </p>
                            </div>
                        ) : isMobile ? (
                            <NotesCarousel notes={topNotes} currentUserId={currentUserId} />
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                    gap: 24,
                                    justifyItems: "center",
                                    width: '100%',
                                }}
                            >
                                {topNotes.map((n) => (
                                    <div
                                        key={n.apunte_id}
                                        style={{
                                            width: "100%",
                                            maxWidth: "100%",
                                        }}
                                    >
                                        <ApunteCard
                                            note={{
                                                id_apunte: n.apunte_id,
                                                titulo: n.titulo,
                                                descripcion: n.descripcion || '',
                                                creditos: n.creditos,
                                                estrellas: n.rating_promedio || 0,
                                                usuario: { nombre: n.usuario_nombre },
                                                materia: { nombre_materia: n.nombre_materia },
                                                signedUrl: n.signedUrl,
                                                thumbnail_path: n.thumbnail_path,
                                                likes_count: n.likes_count || 0,
                                                id_usuario: n.id_usuario
                                            }}
                                            currentUserId={currentUserId}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <section
                    style={{
                        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                        color: "#fff",
                        width: '100%',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "1080px",
                            margin: "0 auto",
                            padding: isMobile ? "28px 16px" : "48px 20px",
                            display: "grid",
                            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: isMobile ? 20 : 32,
                        }}
                    >
                        <FooterCol
                            title="Sobre nosotros"
                            items={[
                                { label: "Misión y Visión", to: "/mision-vision" },
                                { label: "Equipo", to: "/equipo" },
                                { label: "Cómo funciona Kerana", to: "/how-it-works" }
                            ]}
                            isMobile={isMobile}
                        />
                        <FooterCol
                            title="Contacto"
                            items={[
                                { label: "kerana.soporte@gmail.com", to: "/contact" },
                                { label: "Enviar mensaje", to: "/contact" }
                            ]}
                            isMobile={isMobile}
                        />
                        <FooterCol
                            title="Sugerencias"
                            items={[
                                { label: "Mejora o problema", to: "/suggestions" },
                                { label: "Colaborar con nosotros", to: "/suggestions" }
                            ]}
                            isMobile={isMobile}
                        />
                    </div>

                    {/* Copyright */}
                    <div style={{
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        padding: isMobile ? "14px 16px" : "24px 20px",
                        textAlign: "center",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: isMobile ? 10 : 13,
                    }}>
                        © {new Date().getFullYear()} Kerana. Todos los derechos reservados.
                    </div>
                </section>
            </main>

            <style>{`
                html, body {
                    max-width: 100vw;
                    overflow-x: hidden;
                }
                
                * {
                    box-sizing: border-box;
                }
                
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

/* ======================= */
/*  COMPONENTES AMBIENTALES */
/* ======================= */

function EcoStats({ pagesPerNote, waterPerSheetL, co2PerSheetG, isMobile }) {
    const paperSaved = `${pagesPerNote} hojas`;
    const waterSaved = `~${(pagesPerNote * waterPerSheetL).toFixed(1)} L`;
    const co2Saved = `~${Math.round(pagesPerNote * co2PerSheetG)} g`;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
                gap: isMobile ? 10 : 24,
                width: '100%',
                maxWidth: '100%',
            }}
        >
            <EcoCard
                icon={<FontAwesomeIcon icon={faLeaf} />}
                color="#10b981"
                title="Papel ahorrado"
                value={paperSaved}
                subtitle="Por cada apunte compartido"
                isMobile={isMobile}
            />
            <EcoCard
                icon={<FontAwesomeIcon icon={faTint} />}
                color="#0ea5e9"
                title="Agua evitada"
                value={waterSaved}
                subtitle="Fabricación de papel"
                isMobile={isMobile}
            />
            <EcoCard
                icon={<FontAwesomeIcon icon={faCloud} />}
                color="#8b5cf6"
                title="CO₂ evitado"
                value={co2Saved}
                subtitle="Impresión y transporte"
                isMobile={isMobile}
            />
        </div>
    );
}

function EcoCard({ icon, color, title, value, subtitle, isMobile }) {
    return (
        <div
            style={{
                background: "#fff",
                borderRadius: isMobile ? 10 : 16,
                padding: isMobile ? 14 : 28,
                border: "2px solid #f1f5f9",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "default",
                width: '100%',
                maxWidth: '100%',
            }}
            onMouseEnter={(e) => {
                if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
                    e.currentTarget.style.borderColor = color;
                }
            }}
            onMouseLeave={(e) => {
                if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#f1f5f9";
                }
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 10 : 16,
                marginBottom: isMobile ? 8 : 16,
            }}>
                <div
                    style={{
                        width: isMobile ? 40 : 56,
                        height: isMobile ? 40 : 56,
                        borderRadius: isMobile ? 10 : 14,
                        background: `${color}15`,
                        color: color,
                        display: "grid",
                        placeItems: "center",
                        fontSize: isMobile ? 16 : 24,
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: isMobile ? 9 : 13,
                        color: "#64748b",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: 3,
                    }}>
                        {title}
                    </div>
                    <div style={{
                        fontSize: isMobile ? 20 : 28,
                        fontWeight: 800,
                        color: "#0f172a",
                        letterSpacing: "-0.02em",
                    }}>
                        {value}
                    </div>
                </div>
            </div>
            <div style={{
                fontSize: isMobile ? 10 : 13,
                color: "#94a3b8",
                lineHeight: 1.4,
            }}>
                {subtitle}
            </div>
        </div>
    );
}

/* ======================= */
/*  FOOTER */
/* ======================= */

function FooterCol({ title, items, isMobile }) {
    return (
        <div>
            <h3 style={{
                margin: "0 0 14px",
                fontSize: isMobile ? 13 : 16,
                fontWeight: 700,
                color: "#fff",
            }}>
                {title}
            </h3>
            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: isMobile ? 8 : 12,
                }}
            >
                {items.map((item) => (
                    <li key={item.label}>
                        <Link
                            to={item.to}
                            style={{
                                color: "rgba(255,255,255,0.7)",
                                textDecoration: "none",
                                fontSize: isMobile ? 12 : 14,
                                transition: "color 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#fff";
                                e.currentTarget.style.textDecoration = "underline";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                                e.currentTarget.style.textDecoration = "none";
                            }}
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SkeletonCard({ isMobile }) {
    return (
        <div
            style={{
                width: "100%",
                maxWidth: isMobile ? "320px" : "100%",
                height: isMobile ? "300px" : "320px",
                borderRadius: isMobile ? 10 : 16,
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
                border: "2px solid #f1f5f9",
            }}
        />
    );
}