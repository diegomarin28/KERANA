import { useState, useEffect } from 'react';
import { calendlyAPI } from '../../api/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendar,
    faCheck,
    faCog,
    faExclamationCircle,
    faRocket,
    faTimes,
    faExternalLinkAlt,
    faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { SuccessModal } from '../../components/SuccessModal';

export default function MyCalendar() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [calendlyUrl, setCalendlyUrl] = useState('');
    const [showCalendlyModal, setShowCalendlyModal] = useState(false);
    const [showEditCalendly, setShowEditCalendly] = useState(false);
    const [tempCalendlyUrl, setTempCalendlyUrl] = useState('');
    const [successModal, setSuccessModal] = useState({ open: false, message: '' });

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
            setSuccessModal({ open: true, message: 'URL de Calendly guardada exitosamente' });
        }
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle} />
                    <p style={{ marginTop: 16, color: '#64748b', fontWeight: 500 }}>Cargando calendario...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div>
                        <h1 style={h1Style}>Mi Calendario</h1>
                        <p style={subtitleStyle}>
                            Gestiona tu disponibilidad para sesiones de mentoría a través de Calendly
                        </p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div style={errorAlertStyle}>
                        <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: 18 }} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Contenido Principal */}
                {!calendlyUrl ? (
                    // Onboarding
                    <div style={onboardingCardStyle}>
                        <div style={iconContainerStyle}>
                            <FontAwesomeIcon icon={faCalendar} style={{ fontSize: 64, color: '#fff' }} />
                        </div>

                        <h2 style={onboardingTitleStyle}>Configura tu Calendario</h2>

                        <p style={onboardingDescStyle}>
                            Para empezar a ofrecer mentorías, necesitas conectar tu cuenta de Calendly.
                            Es rápido, fácil y te permitirá gestionar todas tus sesiones de forma profesional.
                        </p>

                        <div style={stepsContainerStyle}>
                            <h3 style={stepsTitle}>¿Cómo empezar?</h3>

                            <div style={stepsGridStyle}>
                                {[
                                    { num: 1, title: 'Crea tu cuenta en Calendly', desc: 'Es gratis y toma solo unos minutos' },
                                    { num: 2, title: 'Crea tu evento de mentoría', desc: 'Define duración, horarios y disponibilidad' },
                                    { num: 3, title: 'Copia el link de tu evento', desc: 'Pégalo en el botón "Configurar Calendly"' }
                                ].map(step => (
                                    <div key={step.num} style={stepItemStyle}>
                                        <div style={stepNumberStyle}>{step.num}</div>
                                        <div>
                                            <div style={stepTitleStyle}>{step.title}</div>
                                            <div style={stepDescStyle}>{step.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={buttonsContainerStyle}>
                            <a
                                href="https://calendly.com/signup"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={primaryButtonStyle}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1e40af';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#2563eb';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.2)';
                                }}
                            >
                                <FontAwesomeIcon icon={faRocket} />
                                <span>Crear cuenta en Calendly</span>
                            </a>

                            <button
                                onClick={() => setShowEditCalendly(true)}
                                style={secondaryButtonStyle}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e5e7eb';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f3f4f6';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <FontAwesomeIcon icon={faCog} />
                                <span>Ya tengo cuenta, configurar</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    // Vista configurada
                    <div style={configuredCardStyle}>
                        <div style={checkIconStyle}>
                            <FontAwesomeIcon icon={faCheck} style={{ fontSize: 32, color: '#10b981' }} />
                        </div>

                        <h2 style={configuredTitleStyle}>Calendario Configurado</h2>

                        <p style={configuredDescStyle}>
                            Tu calendario de Calendly está activo. Los estudiantes pueden agendar sesiones contigo.
                        </p>

                        <div style={urlBoxStyle}>
                            <div style={urlLabelStyle}>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: 12 }} />
                                Tu enlace de Calendly:
                            </div>
                            <a
                                href={calendlyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={urlLinkStyle}
                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                                {calendlyUrl}
                            </a>
                        </div>

                        <div style={buttonsContainerStyle}>
                            <button
                                onClick={() => setShowCalendlyModal(true)}
                                style={successButtonStyle}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#059669';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#10b981';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                                }}
                            >
                                <FontAwesomeIcon icon={faCalendar} />
                                <span>Ver mi calendario</span>
                            </button>

                            <button
                                onClick={() => setShowEditCalendly(true)}
                                style={secondaryButtonStyle}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e5e7eb';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f3f4f6';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <FontAwesomeIcon icon={faCog} />
                                <span>Editar configuración</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal Ver Calendly */}
                {showCalendlyModal && calendlyUrl && (
                    <>
                        <div onClick={() => setShowCalendlyModal(false)} style={overlayStyle} />
                        <div style={modalContainerStyle}>
                            <div style={modalHeaderStyle}>
                                <h2 style={modalTitleStyle}>
                                    <FontAwesomeIcon icon={faCalendar} style={{ marginRight: 10 }} />
                                    Mi Calendario de Mentorías
                                </h2>
                                <button
                                    onClick={() => setShowCalendlyModal(false)}
                                    style={closeButtonStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
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

                {/* Modal Configurar */}
                {showEditCalendly && (
                    <>
                        <div onClick={() => setShowEditCalendly(false)} style={overlayStyle} />
                        <div style={editModalStyle}>
                            <h2 style={editModalTitleStyle}>
                                <FontAwesomeIcon icon={faCog} style={{ marginRight: 10 }} />
                                {calendlyUrl ? 'Editar URL de Calendly' : 'Configurar Calendly'}
                            </h2>

                            <p style={editModalDescStyle}>
                                Ingresa el link de tu evento de Calendly para que los estudiantes puedan agendar sesiones contigo.
                            </p>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>URL de Calendly</label>
                                <input
                                    type="url"
                                    value={tempCalendlyUrl}
                                    onChange={(e) => setTempCalendlyUrl(e.target.value)}
                                    placeholder="https://calendly.com/tu-usuario/mentoria"
                                    style={inputStyle}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                />
                                <div style={helpTextStyle}>
                                    <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: 12, marginRight: 6 }} />
                                    <strong>Cómo obtener tu link:</strong> Ve a calendly.com → Crea tu evento → Copia el link → Pégalo aquí
                                </div>
                            </div>

                            <div style={modalButtonsStyle}>
                                <button
                                    onClick={() => setShowEditCalendly(false)}
                                    style={cancelButtonStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCalendlyUrl}
                                    style={saveButtonStyle}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#1e40af';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#2563eb';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </>
                )}

                <SuccessModal
                    open={successModal.open}
                    onClose={() => setSuccessModal({ open: false, message: '' })}
                    message={successModal.message}
                />
            </div>
        </div>
    );
}

// Estilos
const pageStyle = {
    minHeight: '100vh',
    background: '#f8fafc',
    paddingBottom: 40,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle = {
    maxWidth: 'min(1080px, 92vw)',
    margin: '0 auto',
    padding: '24px 16px',
};

const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
};

const spinnerStyle = {
    width: 40,
    height: 40,
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
};

const headerStyle = {
    marginBottom: 32,
};

const h1Style = {
    margin: '0 0 8px 0',
    fontSize: 'clamp(28px, 4vw, 42px)',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
};

const subtitleStyle = {
    color: '#64748b',
    margin: 0,
    fontSize: 'clamp(14px, 1.8vw, 16px)',
    fontWeight: 500,
};

const errorAlertStyle = {
    background: '#fee2e2',
    border: '2px solid #fecaca',
    color: '#dc2626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontWeight: 500,
    fontSize: 14,
};

const onboardingCardStyle = {
    background: 'linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)',
    borderRadius: 20,
    padding: '48px 32px',
    textAlign: 'center',
    color: '#fff',
    boxShadow: '0 20px 60px -10px rgba(37, 99, 235, 0.4)',
};

const iconContainerStyle = {
    marginBottom: 24,
};

const onboardingTitleStyle = {
    margin: '0 0 16px 0',
    fontSize: 'clamp(24px, 3vw, 32px)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
};

const onboardingDescStyle = {
    fontSize: 'clamp(14px, 1.8vw, 16px)',
    lineHeight: 1.6,
    marginBottom: 32,
    opacity: 0.95,
    maxWidth: 600,
    margin: '0 auto 32px',
    fontWeight: 500,
};

const stepsContainerStyle = {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    padding: '24px',
    maxWidth: 700,
    margin: '0 auto 32px',
    border: '2px solid rgba(255,255,255,0.2)',
};

const stepsTitle = {
    margin: '0 0 20px 0',
    fontSize: 'clamp(16px, 2vw, 20px)',
    fontWeight: 600,
};

const stepsGridStyle = {
    display: 'grid',
    gap: 16,
    textAlign: 'left',
};

const stepItemStyle = {
    display: 'flex',
    gap: 16,
    alignItems: 'start',
};

const stepNumberStyle = {
    background: 'rgba(255,255,255,0.25)',
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
};

const stepTitleStyle = {
    display: 'block',
    marginBottom: 4,
    fontWeight: 600,
    fontSize: 14,
};

const stepDescStyle = {
    opacity: 0.9,
    fontSize: 13,
    fontWeight: 500,
};

const buttonsContainerStyle = {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
};

const primaryButtonStyle = {
    padding: '14px 28px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    transition: 'all 0.2s ease',
    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)',
    cursor: 'pointer',
};

const secondaryButtonStyle = {
    padding: '14px 28px',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    transition: 'all 0.2s ease',
};

const configuredCardStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 32px',
    border: '2px solid #f1f5f9',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

const checkIconStyle = {
    width: 80,
    height: 80,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
};

const configuredTitleStyle = {
    margin: '0 0 12px 0',
    fontSize: 'clamp(20px, 3vw, 28px)',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
};

const configuredDescStyle = {
    color: '#64748b',
    marginBottom: 28,
    lineHeight: 1.6,
    fontSize: 'clamp(14px, 1.8vw, 16px)',
    fontWeight: 500,
};

const urlBoxStyle = {
    display: 'inline-block',
    background: '#f8fafc',
    padding: '16px 24px',
    borderRadius: 12,
    marginBottom: 24,
    border: '2px solid #e2e8f0',
};

const urlLabelStyle = {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
};

const urlLinkStyle = {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 14,
    wordBreak: 'break-all',
    transition: 'all 0.2s ease',
};

const successButtonStyle = {
    padding: '14px 28px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
};

const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    cursor: 'pointer',
};

const modalContainerStyle = {
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
    flexDirection: 'column',
};

const modalHeaderStyle = {
    padding: '20px 24px',
    borderBottom: '2px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
};

const modalTitleStyle = {
    margin: 0,
    fontSize: 'clamp(16px, 2vw, 20px)',
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
};

const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px 8px',
    transition: 'color 0.2s ease',
    borderRadius: 8,
};

const editModalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    borderRadius: 20,
    padding: '32px',
    width: 'min(92vw, 600px)',
    zIndex: 1001,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
};

const editModalTitleStyle = {
    margin: '0 0 12px 0',
    fontSize: 'clamp(20px, 3vw, 26px)',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    display: 'flex',
    alignItems: 'center',
};

const editModalDescStyle = {
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 1.6,
    fontSize: 14,
    fontWeight: 500,
};

const inputGroupStyle = {
    marginBottom: 24,
};

const labelStyle = {
    display: 'block',
    marginBottom: 10,
    fontWeight: 600,
    fontSize: 13,
    color: '#0f172a',
};

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif',
};

const helpTextStyle = {
    fontSize: 12,
    color: '#64748b',
    marginTop: 10,
    lineHeight: 1.5,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'start',
    gap: 4,
};

const modalButtonsStyle = {
    display: 'flex',
    gap: 12,
};

const cancelButtonStyle = {
    flex: 1,
    padding: '12px 20px',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s ease',
};

const saveButtonStyle = {
    flex: 1,
    padding: '12px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s ease',
};