import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../components/UI/Card';

export default function Privacy() {
    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={headerStyle}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <FontAwesomeIcon
                            icon={faShieldAlt}
                            style={{ fontSize: 36, color: '#fff' }}
                        />
                    </div>
                    <h1 style={titleStyle}>Política de Privacidad</h1>
                    <p style={subtitleStyle}>
                        De acuerdo con la Ley N° 18.331 de Uruguay - Última actualización: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <Card style={contentStyle}>
                    {/* Sección específica de Uruguay */}
                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>
                            <FontAwesomeIcon icon={faUser} style={{ marginRight: 8, color: '#2563eb' }} />
                            Tus Derechos según la Ley Uruguaya
                        </h2>
                        <div style={rightsGridStyle}>
                            <div style={rightItemStyle}>
                                <strong>Acceso</strong>
                                <p>Podés solicitar qué datos tenemos sobre vos en cualquier momento</p>
                            </div>
                            <div style={rightItemStyle}>
                                <strong>Rectificación</strong>
                                <p>Podés pedir que actualicemos o corrijamos tu información personal</p>
                            </div>
                            <div style={rightItemStyle}>
                                <strong>Cancelación</strong>
                                <p>Podés solicitar la eliminación de tu cuenta y datos permanentemente</p>
                            </div>
                            <div style={rightItemStyle}>
                                <strong>Oposición</strong>
                                <p>Podés oponerte a ciertos usos de tus datos personales</p>
                            </div>
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>1. Información que Recopilamos</h2>
                        <p style={textStyle}>
                            Recopilamos la siguiente información para proporcionar y mejorar nuestros servicios:
                        </p>
                        <ul style={listStyle}>
                            <li>
                                <strong>Información personal:</strong> Nombre, correo, información de perfil
                            </li>
                            <li>
                                <strong>Información académica:</strong> Materias de interés, cursos tomados
                            </li>
                            <li>
                                <strong>Contenido generado:</strong> Apuntes, comentarios, reseñas
                            </li>
                            <li>
                                <strong>Datos técnicos:</strong> Dirección IP, tipo de dispositivo, registros de uso mínimos necesarios para el funcionamiento
                            </li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>2. Cómo Usamos tu Información</h2>
                        <p style={textStyle}>
                            Usamos tus datos para:
                        </p>
                        <ul style={listStyle}>
                            <li>Brindar acceso a funcionalidades (cuenta, apuntes, reseñas y mentorías)</li>
                            <li>Mejorar la plataforma y la experiencia de uso</li>
                            <li>Prevenir abusos, garantizar seguridad y moderar contenidos</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>3. Compartir Información con Terceros</h2>
                        <p style={textStyle}>
                            Solo compartimos datos estrictamente necesarios con prestadores esenciales para operar KERANA
                            (por ejemplo, alojamiento, base de datos, pasarela de pago y autenticación). Estos terceros
                            deben cumplir medidas de seguridad y confidencialidad.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>4. Tus Derechos y Control</h2>
                        <p style={textStyle}>
                            Para ejercer tus derechos según la Ley 18.331:
                        </p>
                        <div style={contactBoxStyle}>
                            <strong>Correo:</strong> kerana.soporte@gmail.com<br/>
                            <strong>Respuesta:</strong> En un plazo de hasta 10 días hábiles
                        </div>
                        <p style={textStyle}>
                            También podés eliminar tu cuenta directamente desde la configuración de tu perfil.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>5. Cambios en esta Política</h2>
                        <p style={textStyle}>
                            Podemos actualizar esta política de privacidad periódicamente. Te notificaremos sobre
                            cambios significativos a través de la plataforma.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>6. Alcance y Personas Usuarias</h2>
                        <p style={textStyle}>
                            KERANA está dirigido exclusivamente a personas mayores de edad.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Estilos
const pageStyle = {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '20px 16px',
    fontFamily: 'Inter, sans-serif'
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '1.5rem'
};

const titleStyle = {
    fontSize: '2rem',
    color: '#1f2937',
    marginBottom: '0.25rem'
};

const subtitleStyle = {
    color: '#6b7280',
    fontSize: '0.95rem'
};

const contentStyle = {
    borderRadius: '10px',
    background: '#fff',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
};

const sectionStyle = {
    marginBottom: '1.5rem'
};

const sectionTitleStyle = {
    fontSize: '1.25rem',
    color: '#111827',
    display: 'flex',
    alignItems: 'center'
};

const textStyle = {
    color: '#374151',
    lineHeight: 1.7
};

const listStyle = {
    color: '#374151',
    paddingLeft: '1.2rem',
    lineHeight: 1.7
};

const rightsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.75rem',
    marginTop: '0.75rem'
};

const rightItemStyle = {
    padding: '16px',
    background: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
};

const contactBoxStyle = {
    padding: '16px',
    background: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
    margin: '1rem 0',
};
