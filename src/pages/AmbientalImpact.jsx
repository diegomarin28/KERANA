import { useState } from 'react';
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faTint, faCloud, faBook, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export function AmbientalImpact() {
    const [hoveredLink, setHoveredLink] = useState(null);
    const [backHovered, setBackHovered] = useState(false);

    return (
        <main
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}
        >
            {/* Hero Header */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)',
                    padding: 'clamp(32px, 5vw, 60px) 20px',
                    color: '#fff',
                    textAlign: 'center'
                }}
            >
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(255,255,255,0.15)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                        }}
                    >
                        <FontAwesomeIcon icon={faLeaf} />
                        IMPACTO AMBIENTAL
                    </div>

                    <h1
                        style={{
                            margin: '0 0 16px',
                            fontSize: 'clamp(28px, 5vw, 42px)',
                            fontWeight: 800,
                            lineHeight: 1.2,
                            letterSpacing: '-0.02em'
                        }}
                    >
                        Metodología de estimación de impacto ambiental
                    </h1>

                    <p
                        style={{
                            fontSize: 'clamp(15px, 2vw, 18px)',
                            fontWeight: 400,
                            lineHeight: 1.6,
                            maxWidth: '1020px',
                            margin: '0 auto',
                            opacity: 0.95
                        }}
                    >
                        Esta página describe cómo estimamos el ahorro potencial al preferir apuntes digitales
                        en lugar de impresos. Usamos un “apunte promedio” de <strong>10 páginas</strong>.
                    </p>
                </div>
            </div>

            {/* Content Container */}
            <div
                style={{
                    maxWidth: '960px',
                    margin: '0 auto',
                    padding: 'clamp(40px, 6vw, 64px) 20px'
                }}
            >
                {/* Supuestos Operativos */}
                <section
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: 'clamp(24px, 4vw, 32px)',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        marginBottom: '24px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '18px'
                            }}
                        >
                            <FontAwesomeIcon icon={faBook} />
                        </div>
                        <h2
                            style={{
                                fontSize: 'clamp(20px, 3vw, 24px)',
                                fontWeight: 700,
                                margin: 0,
                                color: '#0f172a'
                            }}
                        >
                            Supuestos operativos
                        </h2>
                    </div>

                    <ul
                        style={{
                            margin: 0,
                            paddingLeft: '24px',
                            lineHeight: 1.7,
                            color: '#475569',
                            fontSize: '15px',
                            fontWeight: 500
                        }}
                    >
                        <li style={{ marginBottom: '8px' }}>
                            Extensión promedio por apunte: <strong style={{ color: '#0f172a' }}>10 páginas A4</strong>.
                        </li>
                        <li style={{ marginBottom: '8px' }}>Papel de oficina 80 g/m², impresión hogareña o de facultad.</li>
                        <li>Los cálculos se presentan por apunte y pueden escalarse a nivel usuario o plataforma.</li>
                    </ul>
                </section>

                {/* Indicadores y Fórmulas */}
                <section
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: 'clamp(24px, 4vw, 32px)',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        marginBottom: '24px'
                    }}
                >
                    <h2
                        style={{
                            fontSize: 'clamp(20px, 3vw, 24px)',
                            fontWeight: 700,
                            margin: '0 0 24px',
                            color: '#0f172a'
                        }}
                    >
                        Indicadores y fórmulas
                    </h2>

                    {/* Agua */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '16px'
                                }}
                            >
                                <FontAwesomeIcon icon={faTint} />
                            </div>
                            <h3
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    margin: 0,
                                    color: '#0f172a'
                                }}
                            >
                                Agua incorporada (huella hídrica)
                            </h3>
                        </div>

                        <p
                            style={{
                                color: '#64748b',
                                margin: '0 0 12px',
                                fontSize: '15px',
                                lineHeight: 1.6,
                                fontWeight: 500
                            }}
                        >
                            La literatura especializada reporta un rango de <strong style={{ color: '#0f172a' }}>~2–13 L por hoja A4</strong> para papel de impresión y escritura
                            (dependiendo del tipo de fibra, geografía y recuperación de papel).
                            En Kerana usamos un valor conservador dentro de ese rango para comunicar resultados.
                        </p>

                        <div
                            style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                border: '2px solid #bae6fd',
                                padding: '16px',
                                borderRadius: '12px'
                            }}
                        >
                            <code
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#0c4a6e',
                                    fontFamily: '"Fira Code", "Courier New", monospace'
                                }}
                            >
                                Agua_por_apunte [L] = páginas × L_por_hoja
                            </code>
                            <div
                                style={{
                                    marginTop: '10px',
                                    color: '#475569',
                                    fontSize: '14px',
                                    lineHeight: 1.5,
                                    fontWeight: 500
                                }}
                            >
                                Para el “apunte promedio” (10 páginas) y un valor intermedio de referencia,
                                el orden de magnitud sería 10 × 5 L = <strong style={{ color: '#0c4a6e' }}>50 L por apunte</strong>.
                            </div>
                        </div>
                    </div>

                    {/* CO2 */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '16px'
                                }}
                            >
                                <FontAwesomeIcon icon={faCloud} />
                            </div>
                            <h3
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    margin: 0,
                                    color: '#0f172a'
                                }}
                            >
                                Huella de carbono (CO₂e)
                            </h3>
                        </div>

                        <p
                            style={{
                                color: '#64748b',
                                margin: '0 0 12px',
                                fontSize: '15px',
                                lineHeight: 1.6,
                                fontWeight: 500
                            }}
                        >
                            Estudios de análisis de ciclo de vida (ACV) para papel de oficina estiman aproximadamente
                            <strong style={{ color: '#0f172a' }}> 4.3–4.7 g CO₂e por hoja A4</strong> (solo papel; la impresión puede agregar una fracción adicional según el equipo y energía).
                        </p>

                        <div
                            style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                border: '2px solid #e2e8f0',
                                padding: '16px',
                                borderRadius: '12px'
                            }}
                        >
                            <code
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#334155',
                                    fontFamily: '"Fira Code", "Courier New", monospace'
                                }}
                            >
                                CO₂e_por_apunte [g] = páginas × g_CO₂e_por_hoja
                            </code>
                            <div
                                style={{
                                    marginTop: '10px',
                                    color: '#475569',
                                    fontSize: '14px',
                                    lineHeight: 1.5,
                                    fontWeight: 500
                                }}
                            >
                                Para 10 páginas con 4.6 g/hoja como referencia, el orden de magnitud sería <strong style={{ color: '#334155' }}>46 g CO₂e por apunte</strong>.
                            </div>
                        </div>
                    </div>

                    <p
                        style={{
                            color: '#94a3b8',
                            fontSize: '13px',
                            marginTop: '20px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            borderLeft: '3px solid #cbd5e1',
                            fontWeight: 500,
                            lineHeight: 1.5
                        }}
                    >
                        En la interfaz del Home mostramos valores redondeados y conservadores con fines de comunicación.
                        Esta página documenta el rango técnico y las fuentes originales.
                    </p>
                </section>

                {/* Fuentes Técnicas */}
                <section
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: 'clamp(24px, 4vw, 32px)',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        marginBottom: '32px'
                    }}
                >
                    <h2
                        style={{
                            fontSize: 'clamp(20px, 3vw, 24px)',
                            fontWeight: 700,
                            margin: '0 0 20px',
                            color: '#0f172a'
                        }}
                    >
                        Fuentes técnicas
                    </h2>

                    <ul
                        style={{
                            margin: 0,
                            paddingLeft: '24px',
                            lineHeight: 1.8,
                            fontSize: '15px',
                            fontWeight: 500,
                            color: '#475569',
                            listStyle: 'none'
                        }}
                    >
                        {[
                            {
                                url: "https://waterfootprint.org/en/resources/interactive-tools/product-gallery/",
                                name: "Water Footprint Network",
                                desc: ": estimaciones de huella hídrica para papel de impresión y escritura (~2–13 L por hoja A4)."
                            },
                            {
                                url: "https://ghgprotocol.org/",
                                name: "GHG Protocol",
                                desc: ": metodología de cálculo de emisiones de gases de efecto invernadero."
                            },
                            {
                                url: "https://www.unep.org/",
                                name: "United Nations Environment Programme (UNEP)",
                                desc: ": reportes globales de sostenibilidad y producción responsable."
                            },
                            {
                                url: "https://pubs.acs.org/doi/10.1021/es050652z",
                                name: "Dias & Arroja (2005)",
                                desc: ": análisis de ciclo de vida del papel de oficina (≈ 4.3–4.7 g CO₂e por hoja A4)."
                            }
                        ].map((link, idx) => (
                            <li key={idx} style={{ marginBottom: '12px' }}>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: hoveredLink === idx ? '#1e40af' : '#2563eb',
                                        textDecoration: 'none',
                                        fontWeight: 600,
                                        transition: 'color 0.2s ease'
                                    }}
                                    onMouseEnter={() => setHoveredLink(idx)}
                                    onMouseLeave={() => setHoveredLink(null)}
                                >
                                    {link.name}
                                </a>
                                {link.desc}
                            </li>
                        ))}
                    </ul>

                    <p
                        style={{
                            color: '#94a3b8',
                            fontSize: '12px',
                            marginTop: '20px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            fontWeight: 500,
                            lineHeight: 1.5
                        }}
                    >
                        Los datos provienen de fuentes públicas reconocidas. Kerana no tiene afiliación con estas organizaciones
                        y su uso es exclusivamente informativo y educativo, conforme a la Ley 9.739 de Uruguay y al Convenio de Berna.
                    </p>
                </section>

                {/* Back Link */}
                <Link
                    to="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: backHovered ? '#fff' : '#2563eb',
                        fontSize: '15px',
                        fontWeight: 600,
                        padding: '12px 20px',
                        background: backHovered ? '#2563eb' : '#fff',
                        border: '2px solid #2563eb',
                        borderRadius: '10px',
                        transition: 'all 0.2s ease',
                        transform: backHovered ? 'translateX(-4px)' : 'translateX(0)'
                    }}
                    onMouseEnter={() => setBackHovered(true)}
                    onMouseLeave={() => setBackHovered(false)}
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Volver al inicio
                </Link>
            </div>
        </main>
    );
}
