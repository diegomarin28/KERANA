// src/pages/Privacy.jsx
import { Card } from '../components/ui/Card';

export default function Privacy() {
    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={headerStyle}>
                    <h1 style={titleStyle}>Política de Privacidad</h1>
                    <p style={subtitleStyle}>
                        De acuerdo con la Ley N° 18.331 de Uruguay - Última actualización: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <Card style={contentStyle}>
                    {/* Sección específica de Uruguay */}
                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>👤 Tus Derechos según la Ley Uruguaya</h2>
                        <div style={rightsGridStyle}>
                            <div style={rightItemStyle}>
                                <strong>Acceso</strong>
                                <p>Podés solicitar qué datos tenemos sobre vos en cualquier momento</p>
                            </div>
                            <div style={rightItemStyle}>
                                <strong>Rectificación</strong>
                                <p>Podés corregir datos incorrectos desde tu perfil</p>
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
                                <strong>Información personal:</strong> Nombre, email, información de perfil
                            </li>
                            <li>
                                <strong>Información académica:</strong> Materias de interés, cursos tomados
                            </li>
                            <li>
                                <strong>Contenido generado:</strong> Apuntes, comentarios, reseñas
                            </li>
                            <li>
                                <strong>Datos técnicos:</strong> Dirección IP, tipo de dispositivo, logs de uso
                            </li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>2. Uso de la Información</h2>
                        <p style={textStyle}>
                            Utilizamos tu información para:
                        </p>
                        <ul style={listStyle}>
                            <li>Proporcionar y mantener nuestros servicios</li>
                            <li>Personalizar tu experiencia educativa</li>
                            <li>Procesar transacciones y gestionar créditos</li>
                            <li>Comunicarnos contigo sobre actualizaciones</li>
                            <li>Garantizar la seguridad de la plataforma</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>3. Seguridad de los Datos</h2>
                        <p style={textStyle}>
                            Implementamos medidas de seguridad para proteger tu información:
                        </p>
                        <ul style={listStyle}>
                            <li>Encriptación de datos sensibles</li>
                            <li>Accesos controlados y autenticación</li>
                            <li>Monitoreo continuo de seguridad</li>
                            <li>Copias de seguridad regulares</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>4. Ejercicio de Derechos</h2>
                        <p style={textStyle}>
                            Para ejercer tus derechos según la Ley 18.331:
                        </p>
                        <div style={contactBoxStyle}>
                            <strong>Email:</strong> kerana.soporte@gmail.com<br/>
                            <strong>Respuesta:</strong> En un plazo máximo de 10 días hábiles
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
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
};

const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#0b1e3a',
    margin: '0 0 0.5rem 0',
};

const subtitleStyle = {
    fontSize: '1rem',
    color: '#64748b',
    margin: '0',
};

const contentStyle = {
    padding: '2.5rem',
    lineHeight: '1.7',
};

const sectionStyle = {
    marginBottom: '2.5rem',
};

const sectionTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0b1e3a',
    margin: '0 0 1rem 0',
};

const textStyle = {
    color: '#475569',
    margin: '0 0 1rem 0',
};

const listStyle = {
    color: '#475569',
    paddingLeft: '1.5rem',
    margin: '1rem 0',
};

// Nuevos estilos para la sección uruguaya
const rightsGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    margin: '1rem 0',
};

const rightItemStyle = {
    padding: '16px',
    background: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bae6fd',
};

const contactBoxStyle = {
    padding: '16px',
    background: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bae6fd',
    margin: '1rem 0',
};