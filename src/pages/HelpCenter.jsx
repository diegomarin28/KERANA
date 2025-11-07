import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faCoins,
    faGraduationCap,
    faUserPlus,
    faCreditCard,
    faGem,
    faUpload,
    faBullseye,
    faGift,
    faChartLine,
    faBug,
    faCheckCircle,
    faDollarSign,
    faMoneyBillWave,
    faHome,
    faWrench,
    faBook
} from '@fortawesome/free-solid-svg-icons';

export default function HelpCenter() {
    const [activeCategory, setActiveCategory] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [openFAQs, setOpenFAQs] = useState(new Set());

    // Reemplazar SOLO la definición de faqDatabase por esta:
    const faqDatabase = {
        general: [
            {
                id: 'gen-1',
                question: '¿Qué es KERANA?',
                answer:
                    'KERANA es una plataforma académica creada por y para estudiantes. Reúne en un solo lugar apuntes en PDF, mentorías por materia (virtuales por Microsoft Teams o presenciales) y reseñas que ayudan a decidir mejor. Todo se integra con un sistema de créditos que incentiva la colaboración.',
                icon: faGraduationCap,
                color: '#2563eb'
            },
            {
                id: 'gen-2',
                question: '¿Cómo creo una cuenta?',
                answer:
                    'Hacé clic en “Crear cuenta”. Podés registrarte con correo y contraseña o con tu cuenta de Google. En ambos casos aceptás los términos y condiciones. Al finalizar, verás un modal para completar avatar, nombre de usuario, descripción y, si querés, un enlace a tu perfil profesional.',
                icon: faUserPlus,
                color: '#2563eb'
            },
            {
                id: 'gen-3',
                question: '¿Es gratis usar KERANA?',
                answer:
                    'Sí. Crear una cuenta y navegar es gratis. Para desbloquear apuntes usás créditos (que ganás subiendo apuntes o escribiendo reseñas, o comprás en paquetes). Las mentorías se abonan en pesos según modalidad (virtual o presencial).',
                icon: faHome,
                color: '#2563eb'
            },
            {
                id: 'gen-4',
                question: '¿Cómo funciona el sistema de créditos?',
                answer:
                    'Los créditos son la moneda de KERANA para desbloquear apuntes. El precio se calcula por páginas (10 créditos por página) con multiplicadores por escasez (1,5× si hay pocos apuntes; 2× si no hay). Ganás créditos al subir apuntes válidos, escribir reseñas (10 por reseña, hasta 10 por semestre) y por bonos de hitos.',
                icon: faCoins,
                color: '#2563eb'
            }
        ],

        creditos: [
            {
                id: 'cre-1',
                question: '¿Qué son los créditos de KERANA?',
                answer:
                    'Son la moneda virtual para desbloquear apuntes y acceder a beneficios. Se obtienen subiendo apuntes válidos, escribiendo reseñas y mediante bonos por hitos. También se pueden comprar en paquetes.',
                icon: faCoins,
                color: '#f59e0b'
            },
            {
                id: 'cre-2',
                question: '¿Cómo gano créditos subiendo apuntes?',
                answer:
                    'Al subir un apunte en PDF válido recibís créditos según su extensión y la escasez de la materia. Regla base: 10 créditos por página. Multiplicadores: 1,5× si hay menos de 5 apuntes; 2× si no hay apuntes previos. Mínimo 3 páginas. El autor recibe un adelanto del 80 % al validar el apunte.',
                icon: faUpload,
                color: '#f59e0b'
            },
            {
                id: 'cre-3',
                question: '¿Qué son los bonos por hitos?',
                answer:
                    'Son recompensas extra por constancia y calidad: hitos por cantidad de apuntes subidos, por “me gusta” recibidos, por ventas acumuladas (5 % de los créditos gastados en tus apuntes en cada hito, con tope por bono) y por compras realizadas.',
                icon: faGift,
                color: '#f59e0b'
            },
            {
                id: 'cre-4',
                question: '¿Qué bonos están disponibles?',
                answer:
                    'Bonos de bienvenida y constancia (por 10, 25, 50, 100, 250, 500 y 1.000 apuntes subidos), bonos por “me gusta” (25, 50, 100, 250, 500, 1.000), bonos por ventas (5 % con tope por hito) y bonos por compras (10, 25, 50, 100 apuntes comprados).',
                icon: faBullseye,
                color: '#f59e0b'
            },
            {
                id: 'cre-5',
                question: '¿Cómo funciona el multiplicador por escasez?',
                answer:
                    'El precio en créditos aumenta si hay poco material en la materia: 1,5× cuando hay menos de 5 apuntes; 2× cuando aún no hay apuntes. Esto incentiva a cubrir vacíos reales de contenido.',
                icon: faChartLine,
                color: '#f59e0b'
            },
            {
                id: 'cre-6',
                question: '¿Cómo compro créditos?',
                answer:
                    'Podés comprar paquetes de créditos en pesos uruguayos. Los precios se publican en la sección de compra y pueden actualizarse. Las compras de créditos son definitivas y no reembolsables.',
                icon: faCreditCard,
                color: '#f59e0b'
            },
            {
                id: 'cre-7',
                question: '¿Los créditos vencen?',
                answer:
                    'No, los créditos no vencen. Pueden ajustarse reglas o montos en el tiempo, pero los créditos disponibles en tu cuenta se mantienen.',
                icon: faGem,
                color: '#f59e0b'
            },
            {
                id: 'cre-8',
                question: '¿Puedo convertir mis créditos en dinero?',
                answer:
                    'No. Los créditos no se convierten en dinero. Son para uso dentro de la plataforma.',
                icon: faMoneyBillWave,
                color: '#f59e0b'
            },
            {
                id: 'cre-9',
                question: '¿Qué pasa si mi apunte es reportado?',
                answer:
                    'Solo pueden reportar usuarios que hayan desbloqueado ese apunte. Con 5 o más reportes pasa a revisión. Si se confirma contenido basura o infracción: se retiran créditos ganados, se devuelve a quienes lo compraron, el apunte se elimina y pueden aplicarse sanciones (incluida suspensión temporal).',
                icon: faWrench,
                color: '#f59e0b'
            },
            {
                id: 'cre-10',
                question: '¿Cómo aparezco en el top mensual?',
                answer:
                    'Cada mes se publica el Top 10 de apuntes más comprados (mínimo 10 ventas por apunte). Si un usuario aparece varias veces, se considera solo la posición más alta. Cada posición otorga créditos adicionales.',
                icon: faGem,
                color: '#f59e0b'
            },
            {
                id: 'cre-11',
                question: '¿Puedo pagar las mentorías con créditos?',
                answer:
                    'No. Las mentorías se pagan en pesos uruguayos. Los créditos se usan para desbloquear apuntes.',
                icon: faDollarSign,
                color: '#f59e0b'
            },
            {
                id: 'cre-12',
                question: '¿Los créditos comprados son reembolsables?',
                answer:
                    'No. Las compras de paquetes de créditos son definitivas y no reembolsables.',
                icon: faCreditCard,
                color: '#f59e0b'
            }
        ],

        cuenta: [
            {
                id: 'acc-1',
                question: '¿Cómo cambio mi contraseña?',
                answer:
                    'Ir a Mi perfil > Editar perfil > Contraseña. Si la olvidaste, usá “Olvidé mi contraseña” y seguí las indicaciones enviadas a tu correo.',
                icon: faUser,
                color: '#111827'
            },
            {
                id: 'acc-2',
                question: '¿Puedo cambiar mi nombre de usuario?',
                answer:
                    'Sí. Podés cambiar tu nombre de usuario desde Ajustes > Cuenta. Debe ser único y cumplir las reglas de formato (minúsculas, números, puntos y guiones bajos).',
                icon: faUser,
                color: '#111827'
            },
            {
                id: 'acc-3',
                question: '¿Cómo cambio mi foto de perfil?',
                answer:
                    'Ir a Mi perfil > Editar perfil > Información personal. Podés cambiar el avatar hasta 2 veces por semana. Formatos permitidos: JPG, PNG o WEBP (hasta 5 MB).',
                icon: faUser,
                color: '#111827'
            },
            {
                id: 'acc-4',
                question: '¿Cómo hago mi perfil privado?',
                answer:
                    'Ajustes > Privacidad > desactivar “Perfil público”. Tu perfil será visible solo para quienes apruebes.',
                icon: faUser,
                color: '#111827'
            },
            {
                id: 'acc-5',
                question: '¿Cómo elimino mi cuenta?',
                answer:
                    'Ajustes > Cuenta > Gestión de datos > Eliminar cuenta. Se eliminarán tus datos personales y contenidos, salvo lo necesario para trazabilidad de operaciones ya realizadas.',
                icon: faUser,
                color: '#111827'
            }
        ],

        apuntes: [
            {
                id: 'apt-1',
                question: '¿Cómo subo apuntes?',
                answer:
                    'Desde “Subir apunte”, elegí el archivo PDF, asigná materia, poné título y una descripción (opcional). Al validar, se publica y recibís créditos según reglas vigentes.',
                icon: faBook,
                color: '#0ea5e9'
            },
            {
                id: 'apt-2',
                question: '¿Qué formatos acepta la plataforma?',
                answer:
                    'Por ahora solo PDF, para estandarizar la experiencia y permitir vista previa consistente.',
                icon: faBook,
                color: '#0ea5e9'
            },
            {
                id: 'apt-3',
                question: '¿Cuánto gano por vender apuntes?',
                answer:
                    'Recibís créditos al validar el apunte (10 por página con multiplicadores por escasez). Además, sumás bonos por “me gusta” y por ventas acumuladas en cada hito (5 % con tope por bono).',
                icon: faBook,
                color: '#0ea5e9'
            },
            {
                id: 'apt-4',
                question: '¿Cómo compro apuntes?',
                answer:
                    'Desbloqueás con créditos. Una vez comprado, queda en tu sección “Comprados” con acceso permanente y descargas ilimitadas.',
                icon: faBook,
                color: '#0ea5e9'
            },
            {
                id: 'apt-5',
                question: '¿Puedo descargar apuntes sin conexión?',
                answer:
                    'Sí. Podés descargar tantas veces como quieras desde tu sección “Comprados”.',
                icon: faBook,
                color: '#0ea5e9'
            },
            {
                id: 'apt-6',
                question: '¿Qué pasa si el contenido tiene errores?',
                answer:
                    'Usá las reseñas para comentar mejoras. Si el apunte es irrelevante, duplicado o inapropiado, podés reportarlo. Con 5 reportes pasa a revisión; si se confirma, se devuelve en créditos a quienes lo compraron y el apunte se elimina.',
                icon: faBook,
                color: '#0ea5e9'
            }
        ],

        mentores: [
            {
                id: 'men-1',
                question: '¿Cómo me convierto en mentor?',
                answer:
                    'Desde el botón “Quiero ser mentor”. Completás la solicitud con materias, motivación y nota obtenida (mínimo 9/12) y adjuntás comprobante. El equipo revisa y, si se aprueba, tu perfil queda habilitado como mentor.',
                icon: faGraduationCap,
                color: '#10b981'
            },
            {
                id: 'men-2',
                question: '¿Cuáles son los requisitos para ser mentor?',
                answer:
                    'Nota mínima 9/12 en la materia, motivación clara, buen comportamiento en la plataforma y verificación manual. Si ofrecés presencial, debés indicar la dirección donde das clase o usar aulas de la facultad.',
                icon: faGraduationCap,
                color: '#10b981'
            },
            {
                id: 'men-3',
                question: '¿Los mentores cobran por sus servicios?',
                answer:
                    'Sí. Precio vigente: virtual $430 (Microsoft Teams) y presencial $630. Para grupos: descuento de $50 por persona agregada (2 personas: −$50 c/u; 3 personas: −$100 c/u).',
                icon: faGraduationCap,
                color: '#10b981'
            },
            {
                id: 'men-4',
                question: '¿Cómo programo una sesión con un mentor?',
                answer:
                    'Elegí materia, mentor y horario disponible desde el calendario global o el perfil del mentor. Al reservar, se envían correos de confirmación. En presencial hay recordatorio 24 horas antes (mentor) y 1 hora antes (estudiante). En virtual, el mentor crea el enlace de Teams y se notifica por correo.',
                icon: faGraduationCap,
                color: '#10b981'
            }
        ],

        tecnico: [
            {
                id: 'tec-1',
                question: '¿La plataforma funciona en móviles?',
                answer:
                    'Sí. KERANA es adaptable a dispositivos móviles, tabletas y computadoras. Recomendamos usar navegadores actualizados.',
                icon: faWrench,
                color: '#6b7280'
            },
            {
                id: 'tec-2',
                question: '¿Por qué no puedo subir un archivo?',
                answer:
                    'Verificá que sea PDF, que no supere el tamaño máximo y que no sea un duplicado. Revisá tu conexión y volvé a intentar.',
                icon: faWrench,
                color: '#6b7280'
            },
            {
                id: 'tec-3',
                question: '¿Cómo reporto un error?',
                answer:
                    'Desde el Centro de ayuda o el formulario de contacto. Indicá qué estabas haciendo, el mensaje de error (si apareció) y, si podés, una captura.',
                icon: faBug,
                color: '#6b7280'
            },
            {
                id: 'tec-4',
                question: '¿Mis datos están seguros?',
                answer:
                    'Sí. Usamos medidas de seguridad y políticas de acceso por filas en la base de datos. Cumplimos con la Ley N.º 18.331 de protección de datos personales.',
                icon: faCheckCircle,
                color: '#6b7280'
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