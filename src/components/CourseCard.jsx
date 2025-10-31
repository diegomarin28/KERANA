import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBook,
    faChalkboardTeacher,
    faGraduationCap,
    faBookOpen,
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
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        background: tipoConfig.bgColor,
                        color: tipoConfig.color,
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}
                >
                    <FontAwesomeIcon icon={tipoConfig.icon} style={{ fontSize: '10px' }} />
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
                            transition: 'transform 0.2s ease',
                            padding: '4px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Agregar a favoritos"
                    >
                        🤍
                    </button>
                )}
            </div>

            {/* Título */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                    margin: '0 0 6px 0',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#0f172a',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {course.titulo}
                </h3>

                {/* Subtítulo */}
                {course.subtitulo && (
                    <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: '#64748b',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {course.subtitulo}
                    </p>
                )}

                {/* Stats con bullets */}
                {hasStats && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '13px',
                        color: '#374151',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        {course.conteo.apuntes !== undefined && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#2563eb'
                                }} />
                                Apuntes: {course.conteo.apuntes}
                            </span>
                        )}
                        {course.conteo.profesores !== undefined && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#ef4444'
                                }} />
                                Profes: {course.conteo.profesores}
                            </span>
                        )}
                        {course.conteo.mentores !== undefined && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#10b981'
                                }} />
                                Mentores: {course.conteo.mentores}
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
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        padding: '20px',
        cursor: route ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        minHeight: '170px',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit'
    };

    const handleMouseEnter = (e) => {
        if (route) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.borderColor = tipoConfig.color;
        }
    };

    const handleMouseLeave = (e) => {
        if (route) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e5e7eb';
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