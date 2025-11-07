import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faChalkboard,
    faVideo,
    faLightbulb,
    faHeadset,
    faClock,
    faEnvelope
} from '@fortawesome/free-solid-svg-icons';

export function MentorWelcomeModal({ open, onClose }) {
    if (!open) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <div style={{
                        width: 80,
                        height: 80,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                    }}>
                        <FontAwesomeIcon
                            icon={faCheckCircle}
                            style={{ fontSize: 40, color: '#fff' }}
                        />
                    </div>
                    <h2 style={titleStyle}>¡Ya estás listo para ser mentor!</h2>
                    <p style={subtitleStyle}>Acá te dejamos algunos tips para tus clases virtuales</p>
                </div>

                <div style={contentStyle}>
                    <div style={tipBoxStyle}>
                        <div style={tipHeaderStyle}>
                            <div style={{
                                width: 36,
                                height: 36,
                                background: '#dbeafe',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FontAwesomeIcon icon={faChalkboard} style={{ fontSize: 18, color: '#2563eb' }} />
                            </div>
                            <h3 style={tipTitleStyle}>Pizarrones Virtuales Recomendados</h3>
                        </div>
                        <ul style={listStyle}>
                            <li>
                                <strong>Miro:</strong> Perfecto para matemáticas y diagramas complejos
                                <br />
                                <a href="https://miro.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>miro.com</a>
                            </li>
                            <li>
                                <strong>Excalidraw:</strong> Simple y rápido, ideal para esquemas
                                <br />
                                <a href="https://excalidraw.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>excalidraw.com</a>
                            </li>
                            <li>
                                <strong>Google Jamboard:</strong> Integrado con Google, fácil de compartir
                                <br />
                                <a href="https://jamboard.google.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>jamboard.google.com</a>
                            </li>
                            <li>
                                <strong>Microsoft Whiteboard:</strong> Si usás Windows, muy completo
                                <br />
                                <a href="https://www.microsoft.com/es-es/microsoft-365/microsoft-whiteboard/digital-whiteboard-app" target="_blank" rel="noopener noreferrer" style={linkStyle}>Microsoft Whiteboard</a>
                            </li>
                        </ul>
                    </div>

                    <div style={tipBoxStyle}>
                        <div style={tipHeaderStyle}>
                            <div style={{
                                width: 36,
                                height: 36,
                                background: '#dbeafe',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FontAwesomeIcon icon={faVideo} style={{ fontSize: 18, color: '#2563eb' }} />
                            </div>
                            <h3 style={tipTitleStyle}>Tips para Clases Virtuales (Teams)</h3>
                        </div>
                        <ul style={listStyle}>
                            <li><strong>Compartir pantalla:</strong> Mostrá tu pizarrón virtual o presentaciones</li>
                            <li><strong>Grabá las clases:</strong> Útil para que el estudiante repase después</li>
                            <li><strong>Usá el chat:</strong> Para compartir links, recursos o aclaraciones</li>
                            <li><strong>Sala de espera:</strong> Activala para controlar quién entra</li>
                            <li><strong>Verificá tu conexión:</strong> Asegurate de tener buena señal de internet antes de empezar</li>
                        </ul>
                    </div>

                    <div style={tipBoxStyle}>
                        <div style={tipHeaderStyle}>
                            <div style={{
                                width: 36,
                                height: 36,
                                background: '#fef3c7',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FontAwesomeIcon icon={faLightbulb} style={{ fontSize: 18, color: '#f59e0b' }} />
                            </div>
                            <h3 style={tipTitleStyle}>Buenas Prácticas</h3>
                        </div>
                        <ul style={listStyle}>
                            <li>Probá tu cámara y micrófono antes de la clase</li>
                            <li>Tené buena iluminación y fondo ordenado</li>
                            <li>Prepará material con anticipación</li>
                            <li>Pedí feedback al estudiante después de la clase</li>
                            <li>Llegá 5 minutos antes para solucionar cualquier problema técnico</li>
                        </ul>
                    </div>

                    <div style={tipBoxStyle}>
                        <div style={tipHeaderStyle}>
                            <div style={{
                                width: 36,
                                height: 36,
                                background: '#d1fae5',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FontAwesomeIcon icon={faHeadset} style={{ fontSize: 18, color: '#10b981' }} />
                            </div>
                            <h3 style={tipTitleStyle}>Equipamiento Recomendado</h3>
                        </div>
                        <ul style={listStyle}>
                            <li><strong>Auriculares con micrófono:</strong> Mejora el audio y reduce eco</li>
                            <li><strong>Buena cámara web:</strong> O usá la de tu celular con apps como DroidCam</li>
                            <li><strong>Tableta gráfica:</strong> Opcional pero útil para escribir matemáticas</li>
                        </ul>
                    </div>

                    <div style={tipBoxStyle}>
                        <div style={tipHeaderStyle}>
                            <div style={{
                                width: 36,
                                height: 36,
                                background: '#fee2e2',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FontAwesomeIcon icon={faClock} style={{ fontSize: 18, color: '#ef4444' }} />
                            </div>
                            <h3 style={tipTitleStyle}>Puntualidad y Compromiso</h3>
                        </div>
                        <ul style={listStyle}>
                            <li>Respetá los horarios acordados (para virtual también es obligatorio)</li>
                            <li>Avisá con anticipación si necesitás cancelar (mínimo 36 horas antes)</li>
                            <li>Si hay problemas técnicos, comunicalo de inmediato al estudiante</li>
                            <li>Mantené una actitud profesional y empática en todo momento</li>
                        </ul>
                    </div>

                    <div style={infoBoxStyle}>
                        <div style={{
                            width: 48,
                            height: 48,
                            background: '#2563eb',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                        }}>
                            <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: 20, color: '#fff' }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                            ¿Dudas o consultas? Escribinos a <strong style={{ color: '#2563eb' }}>kerana.soporte@gmail.com</strong>
                        </p>
                    </div>
                </div>

                <div style={footerStyle}>
                    <button
                        onClick={onClose}
                        style={buttonStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#059669';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#10B981';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        ¡Entendido! Comenzar
                    </button>
                </div>
            </div>
        </div>
    );
}

// Estilos
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99998,
    backdropFilter: 'blur(4px)',
    padding: 20
};

const modalStyle = {
    background: 'white',
    borderRadius: 16,
    maxWidth: 700,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    fontFamily: 'Inter, sans-serif'
};

const headerStyle = {
    padding: '32px 32px 24px 32px',
    textAlign: 'center',
    borderBottom: '1px solid #E5E7EB',
    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
};

const titleStyle = {
    margin: '0 0 8px 0',
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    fontFamily: 'Inter, sans-serif'
};

const subtitleStyle = {
    margin: 0,
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500
};

const contentStyle = {
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 20
};

const tipBoxStyle = {
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 20
};

const tipHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
};

const tipTitleStyle = {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    fontFamily: 'Inter, sans-serif'
};

const listStyle = {
    margin: 0,
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#4B5563',
    fontFamily: 'Inter, sans-serif'
};

const linkStyle = {
    color: '#10B981',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif'
};

const infoBoxStyle = {
    background: '#EFF6FF',
    border: '2px solid #BFDBFE',
    borderRadius: 12,
    padding: 24,
    textAlign: 'center'
};

const footerStyle = {
    padding: 24,
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'center'
};

const buttonStyle = {
    padding: '12px 32px',
    background: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};