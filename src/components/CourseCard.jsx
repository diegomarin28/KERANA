import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBook,
    faChalkboardTeacher,
    faGraduationCap,
    faBookOpen,
    faFileAlt,
    faUserTie,
    faUsers,
    faHeart
} from '@fortawesome/free-solid-svg-icons';

export default function CourseCard({ course, onFav = null }) {
    // Validación: si no hay course, no renderizar nada
    if (!course) {
        console.warn('CourseCard: falta prop "course"');
        return null;
    }

    const getTipoConfig = (tipo) => {
        switch (tipo) {
            case "apunte":
                return {
                    icon: faBook,
                    color: '#2563eb',
                    bgColor: '#dbeafe',
                    label: 'APUNTE'
                };
            case "profesor":
                return {
                    icon: faChalkboardTeacher,
                    color: '#0ea5e9',
                    bgColor: '#e0f2fe',
                    label: 'PROFESOR'
                };
            case "mentor":
                return {
                    icon: faGraduationCap,
                    color: '#10b981',
                    bgColor: '#d1fae5',
                    label: 'MENTOR'
                };
            case "materia":
                return {
                    icon: faBookOpen,
                    color: '#2563eb',
                    bgColor: '#dbeafe',
                    label: 'MATERIA'
                };
            default:
                return {
                    icon: faBook,
                    color: '#64748b',
                    bgColor: '#f1f5f9',
                    label: 'CURSO'
                };
        }
    };

    const tipoConfig = getTipoConfig(course.tipo);

    // Determinar la ruta según el tipo
    const getRoute = () => {
        if (course.tipo === 'materia' && course.id) {
            return `/materias/${course.id}`;
        }
        return null;
    };

    const route = getRoute();

    // Mostrar conteos (mostrar siempre si existen, incluso con 0)
    const hasStats = course.conteo && (
        course.conteo.apuntes !== undefined ||
        course.conteo.profesores !== undefined ||
        course.conteo.mentores !== undefined
    );

    // Contenido de la card (distribución VERTICAL)
    const cardContent = (
        <>
            {/* Header con badge y tipo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        background: tipoConfig.bgColor,
                        color: tipoConfig.color,
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        fontFamily: 'Inter, sans-serif'
                    }}
                >
                    <FontAwesomeIcon icon={tipoConfig.icon} style={{ fontSize: '9px' }} />
                    {tipoConfig.label}
                </div>

                {/* Botón favorito (solo si no es materia) */}
                {course.tipo !== "materia" && onFav && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFav();
                        }}
                        style={{
                            all: 'unset',
                            cursor: 'pointer',
                            fontSize: '18px',
                            transition: 'all 0.2s ease',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Agregar a favoritos"
                    >
                        <FontAwesomeIcon
                            icon={faHeart}
                            style={{
                                fontSize: 16,
                                color: '#cbd5e1'
                            }}
                        />
                    </button>
                )}
            </div>

            {/* Título */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#0f172a',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    {course.titulo}
                </h3>

                {/* Subtítulo */}
                {course.subtitulo && (
                    <p style={{
                        margin: '0 0 14px 0',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#64748b',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        {course.subtitulo}
                    </p>
                )}

                {/* Stats con iconos Font Awesome */}
                {hasStats && (
                    <div style={{
                        display: 'flex',
                        gap: '14px',
                        fontSize: '12px',
                        color: '#374151',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        {course.conteo.apuntes !== undefined && (
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                <FontAwesomeIcon
                                    icon={faFileAlt}
                                    style={{
                                        fontSize: '11px',
                                        color: '#2563eb'
                                    }}
                                />
                                <span style={{ color: '#64748b' }}>Apuntes:</span>
                                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                                    {course.conteo.apuntes}
                                </span>
                            </span>
                        )}
                        {course.conteo.profesores !== undefined && (
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                <FontAwesomeIcon
                                    icon={faChalkboardTeacher}
                                    style={{
                                        fontSize: '11px',
                                        color: '#ef4444'
                                    }}
                                />
                                <span style={{ color: '#64748b' }}>Profesores:</span>
                                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                                    {course.conteo.profesores}
                                </span>
                            </span>
                        )}
                        {course.conteo.mentores !== undefined && (
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                <FontAwesomeIcon
                                    icon={faGraduationCap}
                                    style={{
                                        fontSize: '11px',
                                        color: '#0d9488'
                                    }}
                                />
                                <span style={{ color: '#64748b' }}>Mentores:</span>
                                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                                    {course.conteo.mentores}
                                </span>
                            </span>
                        )}
                    </div>
                )}
            </div>

        </>
    );

    // Estilos de la card
    const cardStyles = {
        background: '#ffffff',
        border: '2px solid #f1f5f9',
        borderRadius: '14px',
        padding: '18px',
        cursor: route ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '115px',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    };

    const handleMouseEnter = (e) => {
        if (route) {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.borderColor = tipoConfig.color;
        }
    };

    const handleMouseLeave = (e) => {
        if (route) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            e.currentTarget.style.borderColor = '#f1f5f9';
        }
    };

    // Si tiene ruta (materia), envolver con Link
    if (route) {
        return (
            <Link
                to={route}
                style={cardStyles}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {cardContent}
            </Link>
        );
    }

    // Si no tiene ruta, renderizar div simple
    return (
        <div
            style={cardStyles}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {cardContent}
        </div>
    );
}