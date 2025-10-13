import { useState, useMemo } from 'react';

export default function HelpCenter() {
    const [activeCategory, setActiveCategory] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [openFAQs, setOpenFAQs] = useState(new Set());

    // Base de datos de FAQ (hardcodeada para máxima velocidad)
    const faqDatabase = {
        general: [
            {
                id: 'gen-1',
                question: '¿Qué es KERANA?',
                answer: 'KERANA es una plataforma educativa colaborativa donde estudiantes pueden compartir, comprar y vender apuntes, conectarse con mentores, y acceder a recursos académicos de calidad verificados por la comunidad.'
            },
            {
                id: 'gen-2',
                question: '¿Cómo creo una cuenta?',
                answer: 'Hacer clic en "Crear cuenta" en el menú principal. Podés registrarte con tu email o mediante Google. Te recomendamos usar tu email institucional (@um.edu.uy) para verificación automática.'
            },
            {
                id: 'gen-3',
                question: '¿Es gratis usar KERANA?',
                answer: 'Sí, crear una cuenta y navegar el contenido es completamente gratis. Solo pagás cuando decidís comprar apuntes o cursos específicos usando créditos.'
            },
            {
                id: 'gen-4',
                question: '¿Cómo funciona el sistema de créditos?',
                answer: 'Los créditos son la moneda de KERANA. 1 crédito = 1 dólar. Podés comprarlos en packs, ganarlos subiendo contenido popular, o recibirlos como mentor verificado.'
            }
        ],
        cuenta: [
            {
                id: 'acc-1',
                question: '¿Cómo cambio mi contraseña?',
                answer: 'Ve a Ajustes > Cuenta > Cambiar contraseña. Ingresá tu contraseña actual y la nueva. Si olvidaste tu contraseña, usá la opción "Olvidé mi contraseña" en el login.'
            },
            {
                id: 'acc-2',
                question: '¿Puedo cambiar mi nombre de usuario?',
                answer: 'Sí, podés cambiar tu username una vez cada 30 días desde Ajustes > Cuenta. El username debe ser único y tener entre 3-50 caracteres (solo minúsculas, números, puntos y guiones bajos).'
            },
            {
                id: 'acc-3',
                question: '¿Cómo cambio mi foto de perfil?',
                answer: 'Ve a tu perfil, hacé clic en tu avatar actual, y seleccioná "Cambiar foto". Podés subir imágenes JPG, PNG o WEBP de hasta 5MB.'
            },
            {
                id: 'acc-4',
                question: '¿Cómo hago mi perfil privado?',
                answer: 'Ve a Ajustes > Privacidad y desactivá "Perfil público". Tu perfil solo será visible para tus seguidores aprobados.'
            },
            {
                id: 'acc-5',
                question: '¿Cómo elimino mi cuenta?',
                answer: 'Ve a Ajustes > Cuenta > Gestión de Datos > Eliminar cuenta. Esto es permanente y eliminará todos tus datos, compras y contenido subido.'
            }
        ],
        apuntes: [
            {
                id: 'apt-1',
                question: '¿Cómo subo apuntes?',
                answer: 'Hacé clic en "Subir Apuntes" en el menú principal. Completá la información (asignatura, profesor, descripción), establecé un precio, y cargá tus archivos PDF. Esperá la aprobación del equipo (24-48hs).'
            },
            {
                id: 'apt-2',
                question: '¿Qué formatos acepta la plataforma?',
                answer: 'Aceptamos PDF (preferido), DOC, DOCX, PPT, PPTX, y archivos de imagen (JPG, PNG). Tamaño máximo: 50MB por archivo. Para videos, podés incluir enlaces de YouTube/Vimeo.'
            },
            {
                id: 'apt-3',
                question: '¿Cuánto gano por vender apuntes?',
                answer: 'Recibís el 70% del precio de venta en créditos. Por ejemplo, si vendés un apunte a 10 créditos, ganás 7 créditos por cada venta. KERANA retiene 30% por mantenimiento de la plataforma.'
            },
            {
                id: 'apt-4',
                question: '¿Cómo compro apuntes?',
                answer: 'Navegá por asignaturas o buscá contenido específico. Hacé clic en "Comprar" y confirmá con tus créditos. El material estará disponible inmediatamente en "Descargas".'
            },
            {
                id: 'apt-5',
                question: '¿Puedo descargar apuntes sin conexión?',
                answer: 'Sí, una vez que compraste el material, lo podés descargar todas las veces que quieras desde tu sección "Descargas" y guardarlo offline.'
            },
            {
                id: 'apt-6',
                question: '¿Qué pasa si el contenido tiene errores?',
                answer: 'Podés reportar contenido de baja calidad o con errores. Si se verifica, recibís un reembolso completo. Los vendedores con múltiples reportes pierden privilegios de subida.'
            }
        ],
        mentores: [
            {
                id: 'men-1',
                question: '¿Cómo me convierto en mentor?',
                answer: 'Hacé clic en "¡Quiero ser Mentor!" en el header. Completá el formulario con tu experiencia académica, materias en las que podés ayudar, y disponibilidad. El equipo revisará tu aplicación en 3-5 días hábiles.'
            },
            {
                id: 'men-2',
                question: '¿Cuáles son los requisitos para ser mentor?',
                answer: 'Necesitás: 1) Estar cursando 3er año o superior (o graduado), 2) Promedio mínimo de 7/12, 3) Buenas referencias de profesores o estudiantes, 4) Compromiso de 2+ horas semanales.'
            },
            {
                id: 'men-3',
                question: '¿Los mentores cobran por sus servicios?',
                answer: 'Cada mentor establece sus propias tarifas (en créditos) por sesión. Las consultas rápidas (< 15 min) suelen ser gratuitas. Sesiones largas van desde 5 a 20 créditos/hora según experiencia.'
            },
            {
                id: 'men-4',
                question: '¿Cómo programo una sesión con un mentor?',
                answer: 'Ve al perfil del mentor, mirá su disponibilidad, y hacé clic en "Reservar sesión". Elegí fecha/hora, pagá con créditos, y recibirás un link de videollamada 15 minutos antes.'
            }
        ],
        tecnico: [
            {
                id: 'tec-1',
                question: '¿La plataforma funciona en móviles?',
                answer: 'Sí, KERANA es completamente responsive. Funciona en iOS, Android, tablets y computadoras. Recomendamos usar Chrome, Safari o Firefox actualizados.'
            },
            {
                id: 'tec-2',
                question: '¿Por qué no puedo subir un archivo?',
                answer: 'Verificá: 1) Tamaño < 50MB, 2) Formato permitido (PDF, DOC, DOCX, PPT, PNG, JPG), 3) Nombre sin caracteres especiales, 4) Conexión estable. Si persiste, probá con otro navegador.'
            },
            {
                id: 'tec-3',
                question: '¿Cómo reporto un bug o error?',
                answer: 'Hacé clic en "Ayuda" > "Contactar Soporte" y describí el problema. Incluí: 1) Qué estabas haciendo, 2) Mensaje de error (si apareció), 3) Navegador/dispositivo, 4) Capturas de pantalla si es posible.'
            },
            {
                id: 'tec-4',
                question: '¿Mis datos están seguros?',
                answer: 'Sí. Usamos encriptación SSL/TLS, almacenamiento seguro en Supabase, y no compartimos datos con terceros. Podés exportar o eliminar tus datos en cualquier momento desde Ajustes.'
            }
        ]
    };

    // Filtrado ultrarrápido en memoria
    const filteredFAQs = useMemo(() => {
        if (!searchQuery.trim()) {
            return faqDatabase[activeCategory] || [];
        }

        const query = searchQuery.toLowerCase().trim();
        const allFAQs = Object.values(faqDatabase).flat();

        return allFAQs.filter(faq =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        );
    }, [searchQuery, activeCategory]);

    const toggleFAQ = (id) => {
        setOpenFAQs(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const categories = [
        { id: 'general', label: 'General', icon: '🏠' },
        { id: 'cuenta', label: 'Cuenta', icon: '👤' },
        { id: 'apuntes', label: 'Apuntes', icon: '📚' },
        { id: 'mentores', label: 'Mentores', icon: '🎓' },
        { id: 'tecnico', label: 'Técnico', icon: '⚙️' }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)',
            padding: '40px 20px',
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Header */}
                <header style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                        marginBottom: 24,
                        boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                    }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <h1 style={{
                        fontSize: '2.75rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        margin: '0 0 16px 0',
                        letterSpacing: '-0.02em',
                    }}>
                        Centro de Ayuda
                    </h1>
                    <p style={{
                        fontSize: '1.125rem',
                        color: '#64748b',
                        margin: '0',
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        lineHeight: 1.6,
                    }}>
                        Encontrá respuestas rápidas a tus preguntas sobre KERANA
                    </p>
                </header>

                {/* Buscador */}
                <div style={{
                    maxWidth: '700px',
                    margin: '0 auto 40px',
                }}>
                    <div style={{
                        position: 'relative',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        borderRadius: 16,
                    }}>
                        <input
                            type="text"
                            placeholder="Buscá en todas las preguntas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '18px 52px 18px 20px',
                                fontSize: '16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: 16,
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                fontFamily: 'inherit',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#3b82f6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            right: 18,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                        </div>
                    </div>
                    {searchQuery && (
                        <div style={{
                            marginTop: 12,
                            fontSize: 14,
                            color: '#64748b',
                            textAlign: 'center',
                        }}>
                            {filteredFAQs.length} resultado{filteredFAQs.length !== 1 ? 's' : ''} encontrado{filteredFAQs.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Categorías */}
                {!searchQuery && (
                    <div style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 40,
                        overflowX: 'auto',
                        padding: '4px',
                        scrollbarWidth: 'thin',
                    }}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: 12,
                                    border: activeCategory === cat.id ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                                    background: activeCategory === cat.id
                                        ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                                        : '#ffffff',
                                    color: activeCategory === cat.id ? '#ffffff' : '#475569',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    boxShadow: activeCategory === cat.id ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (activeCategory !== cat.id) {
                                        e.target.style.borderColor = '#cbd5e1';
                                        e.target.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeCategory !== cat.id) {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Guía rápida */}
                {!searchQuery && activeCategory === 'general' && (
                    <div style={{
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '2px solid #93c5fd',
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 32,
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#1e40af',
                            margin: '0 0 16px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <span style={{ fontSize: 24 }}>🚀</span>
                            Guía de Inicio Rápido
                        </h3>
                        <ol style={{
                            margin: 0,
                            padding: '0 0 0 24px',
                            color: '#1e40af',
                            lineHeight: 2,
                        }}>
                            <li><strong>Creá tu cuenta</strong> con tu email institucional</li>
                            <li><strong>Completá tu perfil</strong> para conectar con otros estudiantes</li>
                            <li><strong>Comprá créditos</strong> o subí contenido para ganarlos</li>
                            <li><strong>Explorá apuntes</strong> por asignatura o profesor</li>
                            <li><strong>Conectá con mentores</strong> para ayuda personalizada</li>
                        </ol>
                    </div>
                )}

                {/* Lista de FAQs */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}>
                    {filteredFAQs.length === 0 ? (
                        <div style={{
                            padding: '60px 20px',
                            textAlign: 'center',
                            color: '#94a3b8',
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                                No encontramos resultados
                            </div>
                            <div style={{ fontSize: 14 }}>
                                Intentá con otras palabras clave o explorá las categorías
                            </div>
                        </div>
                    ) : (
                        filteredFAQs.map((faq, index) => (
                            <FAQItem
                                key={faq.id}
                                faq={faq}
                                isOpen={openFAQs.has(faq.id)}
                                onToggle={() => toggleFAQ(faq.id)}
                                isLast={index === filteredFAQs.length - 1}
                            />
                        ))
                    )}
                </div>

                {/* Contacto de Soporte */}
                <div style={{
                    marginTop: 48,
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    border: '2px solid #bae6fd',
                    borderRadius: 16,
                    padding: 32,
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#0369a1',
                        margin: '0 0 12px 0',
                    }}>
                        ¿No encontraste lo que buscabas?
                    </h3>
                    <p style={{
                        color: '#075985',
                        margin: '0 0 24px 0',
                        lineHeight: 1.6,
                        maxWidth: '500px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}>
                        Nuestro equipo de soporte está disponible para ayudarte. Respondemos en menos de 24 horas.
                    </p>
                    <button
                        onClick={() => window.location.href = '/contact'}
                        style={{
                            padding: '14px 32px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: 16,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(14,165,233,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(14,165,233,0.3)';
                        }}
                    >
                        Contactar Soporte
                    </button>
                </div>
            </div>
        </div>
    );
}

// Componente FAQ Item optimizado
function FAQItem({ faq, isOpen, onToggle, isLast }) {
    return (
        <div style={{
            borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
        }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: '20px 24px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
                <span style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    flex: 1,
                    lineHeight: 1.5,
                }}>
                    {faq.question}
                </span>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: isOpen ? '#3b82f6' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                }}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isOpen ? '#ffffff' : '#64748b'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                        }}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </button>
            {isOpen && (
                <div
                    style={{
                        padding: '0 24px 24px',
                        color: '#475569',
                        lineHeight: 1.7,
                        fontSize: '15px',
                        animation: 'fadeInSlide 0.2s ease-out',
                    }}
                >
                    {faq.answer}
                </div>
            )}
            <style>{`
                @keyframes fadeInSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
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