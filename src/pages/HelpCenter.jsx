import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
    faUser,
    faCoins,
    faBook,
    faGraduationCap,
    faWrench,
    faUserPlus,
    faCreditCard,
    faGem,
    faUpload,
    faBullseye,
    faGift,
    faChartLine,
    faClock,
    faSync,
    faExclamationTriangle,
    faTrophy,
    faLock,
    faKey,
    faCamera,
    faShieldAlt,
    faTrash,
    faFileAlt,
    faShoppingCart,
    faDownload,
    faBell,
    faStar,
    faCalendar,
    faClipboardList,
    faDiamond,
    faMobileAlt,
    faCog,
    faBug,
    faCheckCircle,
    faDollarSign,
    faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';

export default function HelpCenter() {
    const [activeCategory, setActiveCategory] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [openFAQs, setOpenFAQs] = useState(new Set());

    // Base de datos de FAQ
    const faqDatabase = {
        general: [
            {
                id: 'gen-1',
                question: '¿Qué es KERANA?',
                answer: 'KERANA es una plataforma educativa colaborativa donde estudiantes pueden compartir y comprar apuntes, conectarse con mentores, y acceder a recursos académicos de calidad verificados por la comunidad.',
                icon: faGraduationCap,
                color: '#2563eb'
            },
            {
                id: 'gen-2',
                question: '¿Cómo creo una cuenta?',
                answer: 'Hacer clic en "Crear cuenta" en el menú principal. Podés registrarte con tu email o mediante Google. Te recomendamos usar tu email institucional (@correo.um.edu.uy) para verificación automática.',
                icon: faUserPlus,
                color: '#2563eb'
            },
            {
                id: 'gen-3',
                question: '¿Es gratis usar KERANA?',
                answer: 'Sí, crear una cuenta y navegar el contenido es completamente gratis. Solo pagás cuando decidís comprar los créditos de la plataforma o cuándo decidís tener una clase particular con un mentor.',
                icon: faCheckCircle,
                color: '#2563eb'
            },
            {
                id: 'gen-4',
                question: '¿Cómo funciona el sistema de créditos?',
                answer: 'Los créditos son la moneda de KERANA. 1 crédito = 2 pesos Uruguayos. Podés comprarlos en packs, ganarlos subiendo contenido popular, o realizando reseñas a profesores.',
                icon: faCoins,
                color: '#2563eb'
            }
        ],
        creditos: [
            {
                id: 'cre-1',
                question: '¿Qué son los créditos de KERANA?',
                answer: 'Los créditos son la moneda virtual de KERANA. Los usás para comprar apuntes, acceder a contenido premium, y realizar transacciones dentro de la plataforma. Podés ganarlos subiendo contenido de calidad o comprarlos en packs.',
                icon: faGem,
                color: '#f59e0b'
            },
            {
                id: 'cre-2',
                question: '¿Cómo gano créditos subiendo apuntes?',
                answer: 'Cuando subís un apunte válido, recibís la mayoría de su valor en créditos de forma inmediata. Una porción menor se distribuye en bonificaciones que desbloqueás al alcanzar hitos de participación. El valor se calcula según el número de páginas y la escasez de contenido en esa materia.',
                icon: faUpload,
                color: '#f59e0b'
            },
            {
                id: 'cre-3',
                question: '¿Qué son los bonos por hitos?',
                answer: 'Son recompensas que recibís al alcanzar objetivos específicos: subir una cantidad determinada de apuntes, tener ventas exitosas, recibir buenas reseñas, o aparecer en el ranking mensual. Estos bonos se acumulan automáticamente y te ayudan a ganar más créditos mientras participás activamente.',
                icon: faBullseye,
                color: '#f59e0b'
            },
            {
                id: 'cre-4',
                question: '¿Qué bonos están disponibles?',
                answer: 'Tenemos varios tipos: Bonos de bienvenida al crear tu cuenta y subir tu primer apunte, bonos por alcanzar hitos de participación (cierta cantidad de apuntes subidos), bonos por calidad cuando tus apuntes reciben buenas reseñas, bonos por ventas cuando tu contenido alcanza objetivos de popularidad, premios del top mensual para los apuntes más vendidos, y bonos por compras cuando alcanzás ciertos niveles de adquisiciones.',
                icon: faGift,
                color: '#f59e0b'
            },
            {
                id: 'cre-5',
                question: '¿Cómo funciona el multiplicador por escasez?',
                answer: 'Si subís apuntes de materias con poco contenido disponible, tu apunte vale más créditos. Esto incentiva a los usuarios a compartir material de materias menos populares y ayuda a equilibrar el catálogo de la plataforma.',
                icon: faChartLine,
                color: '#f59e0b'
            },
            {
                id: 'cre-6',
                question: '¿Cómo compro créditos?',
                answer: 'Podés comprar packs de créditos desde tu perfil o la sección de créditos. Ofrecemos diferentes packs con descuentos progresivos: cuanto más grande el pack, mejor el precio por crédito. Aceptamos pagos a través de Mercado Pago.',
                icon: faCreditCard,
                color: '#f59e0b'
            },
            {
                id: 'cre-7',
                question: '¿Los créditos vencen?',
                answer: 'No, los créditos que ganás o comprás no tienen fecha de vencimiento. Podés usarlos cuando quieras sin preocuparte por perderlos.',
                icon: faClock,
                color: '#f59e0b'
            },
            {
                id: 'cre-8',
                question: '¿Puedo convertir mis créditos en dinero?',
                answer: 'No, los créditos son solo para usar dentro de KERANA. No se pueden canjear por dinero ni transferir a otras plataformas. Sin embargo, podés usar tus créditos para acceder a todo el contenido y servicios de la plataforma.',
                icon: faSync,
                color: '#f59e0b'
            },
            {
                id: 'cre-9',
                question: '¿Qué pasa si mi apunte es reportado?',
                answer: 'Si tu apunte es reportado por múltiples usuarios y se verifica que no cumple con las normas, los créditos ganados por ese apunte serán retirados y devueltos a quienes lo compraron. Contenido basura o fraudulento puede resultar en suspensión temporal de privilegios.',
                icon: faExclamationTriangle,
                color: '#f59e0b'
            },
            {
                id: 'cre-10',
                question: '¿Cómo aparezco en el top mensual?',
                answer: 'El top mensual muestra los apuntes más vendidos del mes. Si tu contenido es de calidad y muchos estudiantes lo encuentran útil, podés entrar en el ranking y ganar créditos adicionales. El ranking se resetea cada mes, dándote nuevas oportunidades.',
                icon: faTrophy,
                color: '#f59e0b'
            },
            {
                id: 'cre-11',
                question: '¿Puedo pagar las mentorías con créditos?',
                answer: 'No, las mentorías solo se pagan con dinero real a través de Mercado Pago. Esto asegura que los mentores reciban su compensación de manera justa y directa por su tiempo y conocimiento.',
                icon: faGraduationCap,
                color: '#f59e0b'
            },
            {
                id: 'cre-12',
                question: '¿Los créditos comprados son reembolsables?',
                answer: 'No, los créditos comprados con dinero real no son reembolsables bajo ninguna circunstancia. Te recomendamos empezar con packs más pequeños si estás probando la plataforma por primera vez.',
                icon: faMoneyBillWave,
                color: '#f59e0b'
            }
        ],
        cuenta: [
            {
                id: 'acc-1',
                question: '¿Cómo cambio mi contraseña?',
                answer: 'Ve a Mi perfil > Editar Perfil > Contraseña. Ingresá tu contraseña actual y la nueva. Si olvidaste tu contraseña, usá la opción "Olvidé mi contraseña" en el login.',
                icon: faLock,
                color: '#8e44ad'
            },
            {
                id: 'acc-2',
                question: '¿Puedo cambiar mi nombre de usuario?',
                answer: 'Sí, podés cambiar tu username una vez cada 30 días desde Ajustes > Cuenta. El username debe ser único y tener entre 3-50 caracteres (solo minúsculas, números, puntos y guiones bajos).',
                icon: faUser,
                color: '#8e44ad'
            },
            {
                id: 'acc-3',
                question: '¿Cómo cambio mi foto de perfil?',
                answer: 'Ve a Mi perfil > Editar Perfil > Información Personal, ahí haces click en "Seleccionar archivo" y elegís la foto de perfil de tu conveniencia. Promovemos el uso de imágenes formales aptas para la formalidad de la plataforma. Podés subir imágenes JPG, PNG o WEBP de hasta 5MB.',
                icon: faCamera,
                color: '#8e44ad'
            },
            {
                id: 'acc-4',
                question: '¿Cómo hago mi perfil privado?',
                answer: 'Ve a Ajustes > Privacidad y desactivá "Perfil público". Tu perfil solo será visible para tus seguidores aprobados.',
                icon: faShieldAlt,
                color: '#8e44ad'
            },
            {
                id: 'acc-5',
                question: '¿Cómo elimino mi cuenta?',
                answer: 'Ve a Ajustes > Cuenta > Gestión de Datos > Eliminar cuenta. Esto es permanente y eliminará todos tus datos, compras y contenido subido.',
                icon: faTrash,
                color: '#8e44ad'
            }
        ],
        apuntes: [
            {
                id: 'apt-1',
                question: '¿Cómo subo apuntes?',
                answer: 'Hacé clic en "Subir Apuntes" en el menú principal. Completá la información (asignatura, profesor, descripción), y cargá tus archivos PDF. Si está no cumple con las normas requeridas, se eliminará el apunte y con ello todos los créditos obtenidos por el mismo.',
                icon: faUpload,
                color: '#10b981'
            },
            {
                id: 'apt-2',
                question: '¿Qué formatos acepta la plataforma?',
                answer: 'Aceptamos PDF. Tamaño máximo: 20MB por archivo. Para videos, podés incluir enlaces de YouTube/Vimeo.',
                icon: faFileAlt,
                color: '#10b981'
            },
            {
                id: 'apt-3',
                question: '¿Cuánto gano por vender apuntes?',
                answer: 'Recibís el 100% del precio de venta en créditos. Por ejemplo, si vendés un apunte a 10 créditos, ganás 10 créditos de manera inmediata. KERANA retiene 30% por mantenimiento de la plataforma. Además, podes recibir bonuses dependiendo si cumplís ciertos objetivos.',
                icon: faDollarSign,
                color: '#10b981'
            },
            {
                id: 'apt-4',
                question: '¿Cómo compro apuntes?',
                answer: 'Navegá por asignaturas o buscá contenido específico. Hacé clic en "Comprar" y confirmá con tus créditos. El material estará disponible inmediatamente en "Descargas".',
                icon: faShoppingCart,
                color: '#10b981'
            },
            {
                id: 'apt-5',
                question: '¿Puedo descargar apuntes sin conexión?',
                answer: 'Sí, una vez que compraste el material, lo podés descargar todas las veces que quieras desde tu sección "Descargas" y guardarlo offline.',
                icon: faDownload,
                color: '#10b981'
            },
            {
                id: 'apt-6',
                question: '¿Qué pasa si el contenido tiene errores?',
                answer: 'Podés reportar contenido de baja calidad o con errores. Si se verifica, recibís un reembolso completo. Los vendedores con múltiples reportes pierden privilegios de subida.',
                icon: faExclamationTriangle,
                color: '#10b981'
            }
        ],
        mentores: [
            {
                id: 'men-1',
                question: '¿Cómo me convierto en mentor?',
                answer: 'Hacé clic en "¡Quiero ser Mentor!" en el header. Completá el formulario con tu experiencia académica, materias en las que podés ayudar, y disponibilidad. El equipo revisará tu aplicación en 3-5 días hábiles.',
                icon: faStar,
                color: '#0d9488'
            },
            {
                id: 'men-2',
                question: '¿Cuáles son los requisitos para ser mentor?',
                answer: 'Necesitás: 1) Estar cursando 3er año o superior (o graduado), 2) Promedio mínimo de 7/12, 3) Buenas referencias de profesores o estudiantes, 4) Compromiso de 2+ horas semanales.',
                icon: faClipboardList,
                color: '#0d9488'
            },
            {
                id: 'men-3',
                question: '¿Los mentores cobran por sus servicios?',
                answer: 'Cada mentor establece sus propias tarifas (en créditos) por sesión. Las consultas rápidas (< 15 min) suelen ser gratuitas. Sesiones largas van desde 5 a 20 créditos/hora según experiencia.',
                icon: faMoneyBillWave,
                color: '#0d9488'
            },
            {
                id: 'men-4',
                question: '¿Cómo programo una sesión con un mentor?',
                answer: 'Ve al perfil del mentor, mirá su disponibilidad, y hacé clic en "Reservar sesión". Elegí fecha/hora, pagá con créditos, y recibirás un link de videollamada 15 minutos antes.',
                icon: faCalendar,
                color: '#0d9488'
            }
        ],
        tecnico: [
            {
                id: 'tec-1',
                question: '¿La plataforma funciona en móviles?',
                answer: 'Sí, KERANA es completamente responsive. Funciona en iOS, Android, tablets y computadoras. Recomendamos usar Chrome, Safari o Firefox actualizados.',
                icon: faMobileAlt,
                color: '#ef4444'
            },
            {
                id: 'tec-2',
                question: '¿Por qué no puedo subir un archivo?',
                answer: 'Verificá: 1) Tamaño < 50MB, 2) Formato permitido (PDF, DOC, DOCX, PPT, PNG, JPG), 3) Nombre sin caracteres especiales, 4) Conexión estable. Si persiste, probá con otro navegador.',
                icon: faCog,
                color: '#ef4444'
            },
            {
                id: 'tec-3',
                question: '¿Cómo reporto un bug o error?',
                answer: 'Hacé clic en "Ayuda" > "Contactar Soporte" y describí el problema. Incluí: 1) Qué estabas haciendo, 2) Mensaje de error (si apareció), 3) Navegador/dispositivo, 4) Capturas de pantalla si es posible.',
                icon: faBug,
                color: '#ef4444'
            },
            {
                id: 'tec-4',
                question: '¿Mis datos están seguros?',
                answer: 'Sí. Usamos encriptación SSL/TLS, almacenamiento seguro en Supabase, y no compartimos datos con terceros. Podés exportar o eliminar tus datos en cualquier momento desde Ajustes.',
                icon: faShieldAlt,
                color: '#ef4444'
            }
        ]
    };

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
        { id: 'general', label: 'General', color: '#2563eb' },
        { id: 'cuenta', label: 'Cuenta', color: '#8e44ad' },
        { id: 'creditos', label: 'Créditos', color: '#f59e0b' },
        { id: 'apuntes', label: 'Apuntes', color: '#10b981' },
        { id: 'mentores', label: 'Mentores', color: '#0d9488' },
        { id: 'tecnico', label: 'Técnico', color: '#ef4444' }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}>
            {/* Header mejorado */}
            <div style={{
                background: 'white',
                borderBottom: '1px solid #dbdbdb',
                padding: '56px 20px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Patrón de fondo sutil */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.03,
                    backgroundImage: 'radial-gradient(circle at 20% 50%, #0095f6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #833ab4 0%, transparent 50%)',
                }} />

                <div style={{ maxWidth: '935px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
                    {/* Icono destacado */}
                    <div style={{
                        width: 64,
                        height: 64,
                        margin: '0 auto 20px',
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #0095f6 0%, #00d4ff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,149,246,0.25)',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>

                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        color: '#262626',
                        margin: '0 0 12px 0',
                        letterSpacing: '-1px',
                    }}>
                        Centro de Ayuda
                    </h1>
                    <p style={{
                        fontSize: '17px',
                        color: '#8e8e8e',
                        margin: 0,
                        fontWeight: '400',
                        letterSpacing: '-0.2px',
                    }}>
                        Encontrá respuestas rápidas a tus preguntas sobre KERANA
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: '935px', margin: '0 auto', padding: '40px 20px' }}>
                {/* Buscador mejorado */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        position: 'relative',
                        maxWidth: '640px',
                        margin: '0 auto',
                    }}>
                        <input
                            type="text"
                            placeholder="Buscar en el centro de ayuda..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 20px 14px 48px',
                                fontSize: '15px',
                                border: '1px solid #dbdbdb',
                                borderRadius: 12,
                                outline: 'none',
                                background: 'white',
                                color: '#262626',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                transition: 'all 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#0095f6';
                                e.target.style.boxShadow = '0 2px 12px rgba(0,149,246,0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#dbdbdb';
                                e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                            }}
                        />
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#8e8e8e"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                position: 'absolute',
                                left: 18,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                            }}
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </div>
                    {searchQuery && (
                        <div style={{
                            marginTop: 16,
                            fontSize: 14,
                            color: '#8e8e8e',
                            textAlign: 'center',
                            fontWeight: '500',
                        }}>
                            {filteredFAQs.length} resultado{filteredFAQs.length !== 1 ? 's' : ''} encontrado{filteredFAQs.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Categorías mejoradas */}
                {!searchQuery && (
                    <div style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 40,
                        overflowX: 'auto',
                        padding: '4px 0',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 10,
                                    border: activeCategory === cat.id ? `2px solid ${cat.color}` : '2px solid #efefef',
                                    background: activeCategory === cat.id ? cat.color : 'white',
                                    color: activeCategory === cat.id ? 'white' : '#262626',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'inherit',
                                    boxShadow: activeCategory === cat.id ? `0 4px 12px ${cat.color}40` : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (activeCategory !== cat.id) {
                                        e.target.style.borderColor = cat.color;
                                        e.target.style.color = cat.color;
                                        e.target.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeCategory !== cat.id) {
                                        e.target.style.borderColor = '#efefef';
                                        e.target.style.color = '#262626';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Lista de FAQs mejorada */}
                <div style={{
                    background: 'white',
                    border: '1px solid #dbdbdb',
                    borderRadius: 12,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                }}>
                    {filteredFAQs.length === 0 ? (
                        <div style={{
                            padding: '80px 20px',
                            textAlign: 'center',
                        }}>
                            <div style={{
                                width: 80,
                                height: 80,
                                margin: '0 auto 24px',
                                borderRadius: '50%',
                                background: '#fafafa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#c7c7c7"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </div>
                            <div style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: '#262626',
                                marginBottom: 8,
                            }}>
                                No encontramos resultados
                            </div>
                            <div style={{ fontSize: 14, color: '#8e8e8e' }}>
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

                {/* Contacto mejorado */}
                {/* Contacto más compacto */}
                <div style={{
                    marginTop: 48,
                    background: 'linear-gradient(135deg, #0095f6 0%, #00d4ff 100%)',
                    borderRadius: 12,
                    padding: '28px 24px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,149,246,0.2)',
                }}>
                    {/* Patrón decorativo */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.08,
                        backgroundImage: 'radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)',
                    }} />

                    <div style={{ position: 'relative' }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: 'white',
                            margin: '0 0 8px 0',
                            letterSpacing: '-0.3px',
                        }}>
                            ¿Necesitás más ayuda?
                        </h3>
                        <p style={{
                            color: 'rgba(255,255,255,0.85)',
                            margin: '0 0 16px 0',
                            fontSize: '14px',
                            lineHeight: '18px',
                        }}>
                            Nuestro equipo responde en menos de 48 horas
                        </p>
                        <button
                            onClick={() => window.location.href = '/contact'}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 8,
                                border: 'none',
                                background: 'white',
                                color: '#0095f6',
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'inherit',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)';
                            }}
                        >
                            Contactar Soporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente FAQ Item mejorado
function FAQItem({ faq, isOpen, onToggle, isLast }) {
    return (
        <div style={{
            borderBottom: isLast ? 'none' : '1px solid #efefef',
            transition: 'background 0.15s ease',
        }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: '24px 24px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 20,
                    fontFamily: 'inherit',
                    transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
                    {/* Font Awesome Icon con color dinámico */}
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${faq.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <FontAwesomeIcon
                            icon={faq.icon}
                            style={{
                                fontSize: '18px',
                                color: faq.color,
                            }}
                        />
                    </div>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#262626',
                        lineHeight: '24px',
                        letterSpacing: '-0.2px',
                    }}>
                        {faq.question}
                    </span>
                </div>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isOpen ? '#0095f6' : '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    marginTop: '-2px',
                }}>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isOpen ? 'white' : '#8e8e8e'}
                        strokeWidth="2.5"
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
                <div style={{
                    padding: '0 24px 28px 64px',
                    color: '#262626',
                    lineHeight: '24px',
                    fontSize: '15px',
                    animation: 'fadeInSlide 0.25s ease',
                }}>
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