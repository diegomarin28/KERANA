export function MentorWelcomeModal({ open, onClose }) {
    if (!open) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <span style={emojiStyle}>🎉</span>
                    <h2 style={titleStyle}>¡Ya estás listo para ser mentor!</h2>
                    <p style={subtitleStyle}>Acá te dejamos algunos tips para tus clases por Zoom</p>
                </div>

                <div style={contentStyle}>
                    <div style={tipBoxStyle}>
                        <div style={tipHeaderStyle}>
                            <span style={tipIconStyle}>🎨</span>
                            <h3 style={tipTitleStyle}>Pizarrones Virtuales Recomendados</h3>
                        </div>
                        <ul style={listStyle}>
                            <li>
                                <strong>Miro:</strong> Perfecto para matemáticas y diagramas complejos
                                <br />
                                <a href="https://miro.com" target="_blank" style={linkStyle}>miro.com</a>
                            </li>
                            <li>
                                <strong>Excalidraw:</strong> Simple y rápido, ideal para esquemas
                                <br />
                                <a href="https://excalidraw.com" target="_blank" style={linkStyle}>excalidraw.com</a>
                            </li>
                            <li>
                                <strong>Google Jamboard:</strong> Integrado con Google, fácil de compartir
                                <br />
                                <a href="https://jamboard.google.com" target="_blank" style={linkStyle}>jamboard.google.com</a>
                            </li>
                            <li>
                                <strong>Microsoft Whiteboard:</strong> Si usás Windows, muy completo
                                <br />
                                <a href="https://www.microsoft.com/es-es/microsoft-365/microsoft-whiteboard/digital-whiteboard-app" target="_blank" style={linkStyle}>Microsoft Whiteboard</a>
                            </li>
                        </ul>
                    </div>

                    <div style={tipBoxStyle}>
                        <div style={tipHeaderStyle}>
                            <span style={tipIconStyle}>📹</span>
                            <h3 style={tipTitleStyle}>Tips para Zoom</h3>
                        </div>
                        <ul style={listStyle}>
                            <li><strong>Compartir pantalla:</strong> Mostrá tu pizarrón virtual o presentaciones</li>
                            <li><strong>Grabá las clases:</strong> Útil para que el estudiante repase después</li>
                            <li><strong>Usá el chat:</strong> Para compartir links, recursos o aclaraciones</li>
                            <li><strong>Sala de espera:</strong> Activala para controlar quién entra</li>
                        </ul>
                    </div>

                    <div style={tipBoxStyle}>
                        <div style={tipHeaderStyle}>
                            <span style={tipIconStyle}>💡</span>
                            <h3 style={tipTitleStyle}>Buenas Prácticas</h3>
                        </div>
                        <ul style={listStyle}>
                            <li>Probá tu cámara y micrófono antes de la clase</li>
                            <li>Tené buena iluminación y fondo ordenado</li>
                            <li>Prepará material con anticipación</li>
                            <li>Pedí feedback al estudiante después de la clase</li>
                        </ul>
                    </div>

                    <div style={infoBoxStyle}>
                        <span style={{ fontSize: 20, marginBottom: 8, display: 'block' }}>📧</span>
                        <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
                            ¿Dudas o consultas? Escribinos a <strong>kerana.soporte@gmail.com</strong>
                        </p>
                    </div>
                </div>

                <div style={footerStyle}>
                    <button onClick={onClose} style={buttonStyle}>
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
    maxWidth: 650,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
};

const headerStyle = {
    padding: '32px 32px 24px 32px',
    textAlign: 'center',
    borderBottom: '1px solid #E5E7EB',
    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
};

const emojiStyle = {
    fontSize: 48,
    display: 'block',
    marginBottom: 16
};

const titleStyle = {
    margin: '0 0 8px 0',
    fontSize: 24,
    fontWeight: 700,
    color: '#111827'
};

const subtitleStyle = {
    margin: 0,
    fontSize: 15,
    color: '#6B7280'
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

const tipIconStyle = {
    fontSize: 24
};

const tipTitleStyle = {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#111827'
};

const listStyle = {
    margin: 0,
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#4B5563'
};

const linkStyle = {
    color: '#10B981',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: 13
};

const infoBoxStyle = {
    background: '#EFF6FF',
    border: '2px solid #BFDBFE',
    borderRadius: 12,
    padding: 20,
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
    transition: 'all 0.2s ease'
};