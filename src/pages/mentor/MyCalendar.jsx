import { useState, useEffect } from 'react';
import { calendlyAPI } from '../../api/database';

export default function MyCalendar() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [calendlyUrl, setCalendlyUrl] = useState('');
    const [showCalendlyModal, setShowCalendlyModal] = useState(false);
    const [showEditCalendly, setShowEditCalendly] = useState(false);
    const [tempCalendlyUrl, setTempCalendlyUrl] = useState('');

    useEffect(() => {
        loadCalendlyUrl();
    }, []);

    const loadCalendlyUrl = async () => {
        setLoading(true);
        const { data, error } = await calendlyAPI.getMyCalendlyUrl();
        if (!error && data) {
            setCalendlyUrl(data);
            setTempCalendlyUrl(data);
        }
        setLoading(false);
    };

    const handleSaveCalendlyUrl = async () => {
        setError('');
        setSuccess('');

        if (!tempCalendlyUrl.trim()) {
            setError('Debes ingresar una URL de Calendly');
            return;
        }

        if (!tempCalendlyUrl.includes('calendly.com/')) {
            setError('La URL debe ser de Calendly (ej: https://calendly.com/tu-usuario)');
            return;
        }

        const { data, error } = await calendlyAPI.saveCalendlyUrl(tempCalendlyUrl);

        if (error) {
            setError('Error guardando URL: ' + (error.message || JSON.stringify(error)));
        } else {
            setCalendlyUrl(tempCalendlyUrl);
            setShowEditCalendly(false);
            setSuccess('URL de Calendly guardada exitosamente');
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    if (loading) return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16, color: '#6b7280' }}>Cargando calendario...</p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: 20 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 700 }}>Mi Calendario</h1>
                <p style={{ color: '#6b7280', margin: 0 }}>
                    Gestiona tu disponibilidad para sesiones de mentoría a través de Calendly
                </p>
            </div>

            {/* Alerts */}
            {error && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    background: '#d1fae5',
                    border: '1px solid #6ee7b7',
                    color: '#065f46',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <span style={{ fontSize: 20 }}>✓</span>
                    {success}
                </div>
            )}

            {/* Contenido Principal - Onboarding o Calendario */}
            {!calendlyUrl ? (
                // Vista de Onboarding cuando no tiene Calendly configurado
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 20,
                    padding: '60px 40px',
                    textAlign: 'center',
                    color: '#fff',
                    boxShadow: '0 20px 60px -10px rgba(102, 126, 234, 0.4)'
                }}>
                    <div style={{ fontSize: 80, marginBottom: 24, lineHeight: 1 }}>📅</div>
                    <h2 style={{ margin: '0 0 16px 0', fontSize: 32, fontWeight: 700 }}>
                        Configura tu Calendario
                    </h2>
                    <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 32, opacity: 0.95, maxWidth: 600, margin: '0 auto 32px' }}>
                        Para empezar a ofrecer mentorías, necesitas conectar tu cuenta de Calendly.
                        Es rápido, fácil y te permitirá gestionar todas tus sesiones de forma profesional.
                    </p>

                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 16,
                        padding: '32px 24px',
                        maxWidth: 700,
                        margin: '0 auto 32px',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 600 }}>
                            ¿Cómo empezar?
                        </h3>
                        <div style={{ display: 'grid', gap: 16, textAlign: 'left' }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.25)',
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    flexShrink: 0
                                }}>1</div>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: 4 }}>Crea tu cuenta en Calendly</strong>
                                    <span style={{ opacity: 0.9, fontSize: 15 }}>Es gratis y toma solo unos minutos</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.25)',
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    flexShrink: 0
                                }}>2</div>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: 4 }}>Crea tu evento de mentoría</strong>
                                    <span style={{ opacity: 0.9, fontSize: 15 }}>Define duración, horarios y disponibilidad</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.25)',
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    flexShrink: 0
                                }}>3</div>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: 4 }}>Copia el link de tu evento</strong>
                                    <span style={{ opacity: 0.9, fontSize: 15 }}>Pégalo en el botón "Configurar Calendly" arriba</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a
                            href="https://calendly.com/signup"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '16px 32px',
                                background: '#fff',
                                color: '#667eea',
                                border: 'none',
                                borderRadius: 12,
                                fontWeight: 700,
                                fontSize: 16,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                            }}
                        >
                            🚀 Crear cuenta en Calendly
                        </a>

                        <button
                            onClick={() => setShowEditCalendly(true)}
                            style={{
                                padding: '16px 32px',
                                background: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                border: '2px solid rgba(255,255,255,0.4)',
                                borderRadius: 12,
                                fontWeight: 600,
                                fontSize: 16,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                                transition: 'all 0.2s',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            ⚙️ Ya tengo cuenta, configurar
                        </button>
                    </div>
                </div>
            ) : (
                // Vista del calendario cuando ya tiene Calendly configurado
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '32px 24px',
                    border: '2px solid #e5e7eb',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
                    <h2 style={{ margin: '0 0 12px 0', fontSize: 24, fontWeight: 700, color: '#111827' }}>
                        Calendario Configurado
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6, fontSize: 16 }}>
                        Tu calendario de Calendly está activo. Los estudiantes pueden agendar sesiones contigo.
                    </p>

                    <div style={{
                        display: 'inline-block',
                        background: '#f3f4f6',
                        padding: '16px 24px',
                        borderRadius: 12,
                        marginBottom: 24
                    }}>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>
                            Tu enlace de Calendly:
                        </div>
                        <a
                            href={calendlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: 15,
                                wordBreak: 'break-all'
                            }}
                        >
                            {calendlyUrl}
                        </a>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowCalendlyModal(true)}
                            style={{
                                padding: '14px 28px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 15,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#059669';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#10b981';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            📅 Ver mi calendario
                        </button>

                        <button
                            onClick={() => setShowEditCalendly(true)}
                            style={{
                                padding: '14px 28px',
                                background: '#f3f4f6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 15,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e5e7eb';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            ⚙️ Editar configuración
                        </button>
                    </div>
                </div>
            )}

            {/* Modal para Ver Calendly */}
            {showCalendlyModal && calendlyUrl && (
                <>
                    <div
                        onClick={() => setShowCalendlyModal(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            zIndex: 1000,
                            backdropFilter: 'blur(4px)'
                        }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#fff',
                        borderRadius: 20,
                        padding: 0,
                        width: 'min(95vw, 1000px)',
                        height: 'min(90vh, 800px)',
                        zIndex: 1001,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                                Mi Calendario de Mentorías - Calendly
                            </h2>
                            <button
                                onClick={() => setShowCalendlyModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 24,
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '4px 8px',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ flex: 1 }}>
                            <iframe
                                src={calendlyUrl}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 'none' }}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Modal para Configurar/Editar Calendly */}
            {showEditCalendly && (
                <>
                    <div
                        onClick={() => setShowEditCalendly(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#fff',
                        borderRadius: 20,
                        padding: '40px 36px',
                        width: 'min(92vw, 600px)',
                        zIndex: 1001,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: 26, fontWeight: 700, color: '#111827' }}>
                            {calendlyUrl ? 'Editar URL de' : 'Configurar'} Calendly
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
                            Ingresa el link de tu evento de Calendly para que los estudiantes puedan agendar sesiones contigo.
                        </p>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, fontSize: 14, color: '#374151' }}>
                                URL de Calendly
                            </label>
                            <input
                                type="url"
                                value={tempCalendlyUrl}
                                onChange={(e) => setTempCalendlyUrl(e.target.value)}
                                placeholder="https://calendly.com/tu-usuario/mentoria"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 10,
                                    fontSize: 15,
                                    outline: 'none',
                                    transition: 'border 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.border = '2px solid #2563eb'}
                                onBlur={(e) => e.currentTarget.style.border = '2px solid #e5e7eb'}
                            />
                            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>
                                💡 <strong>Cómo obtener tu link:</strong><br/>
                                1. Ve a <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>calendly.com</a><br/>
                                2. Crea tu evento de mentoría<br/>
                                3. Copia el link del evento<br/>
                                4. Pégalo aquí
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowEditCalendly(false)}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: 15,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e5e7eb';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f3f4f6';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveCalendlyUrl}
                                style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: 15,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1d4ed8';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#2563eb';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
