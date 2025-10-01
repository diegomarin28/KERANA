// src/pages/Privacy.jsx
import { Card } from '../components/ui/Card';

export default function Privacy() {
    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={headerStyle}>
                    <h1 style={titleStyle}>Política de Privacidad</h1>
                    <p style={subtitleStyle}>
                        Última actualización: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <Card style={contentStyle}>
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
                                <strong>Información académica:</strong> Materias de interés, cursos tomados, calificaciones
                            </li>
                            <li>
                                <strong>Información de transacciones:</strong> Historial de compras, créditos, pagos
                            </li>
                            <li>
                                <strong>Contenido generado:</strong> Apuntes, comentarios, reseñas, mensajes
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
                            <li>Comunicarnos contigo sobre actualizaciones y novedades</li>
                            <li>Mejorar y desarrollar nuevos servicios</li>
                            <li>Garantizar la seguridad de la plataforma</li>
                            <li>Cumplir con obligaciones legales</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>3. Compartición de Información</h2>
                        <p style={textStyle}>
                            No vendemos tu información personal. Podemos compartir información en los siguientes casos:
                        </p>
                        <ul style={listStyle}>
                            <li>
                                <strong>Con otros usuarios:</strong> Tu nombre y perfil son visibles en tus publicaciones
                            </li>
                            <li>
                                <strong>Proveedores de servicio:</strong> Con empresas que nos ayudan a operar la plataforma
                            </li>
                            <li>
                                <strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o para proteger nuestros derechos
                            </li>
                            <li>
                                <strong>Transferencias empresariales:</strong> En caso de fusión, venta o reorganización
                            </li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>4. Cookies y Tecnologías Similares</h2>
                        <p style={textStyle}>
                            Utilizamos cookies y tecnologías similares para:
                        </p>
                        <ul style={listStyle}>
                            <li>Mantener tu sesión activa</li>
                            <li>Recordar tus preferencias</li>
                            <li>Analizar el uso de la plataforma</li>
                            <li>Personalizar el contenido</li>
                            <li>Mejorar la seguridad</li>
                        </ul>
                        <p style={textStyle}>
                            Puedes controlar el uso de cookies través de la configuración de tu navegador.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>5. Seguridad de los Datos</h2>
                        <p style={textStyle}>
                            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
                        </p>
                        <ul style={listStyle}>
                            <li>Encriptación de datos sensibles</li>
                            <li>Accesos controlados y autenticación</li>
                            <li>Monitoreo continuo de seguridad</li>
                            <li>Copias de seguridad regulares</li>
                            <li>Capacitación del personal en protección de datos</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>6. Tus Derechos</h2>
                        <p style={textStyle}>
                            Tienes derecho a:
                        </p>
                        <ul style={listStyle}>
                            <li>Acceder a tu información personal</li>
                            <li>Corregir información inexacta</li>
                            <li>Eliminar tu cuenta y datos personales</li>
                            <li>Oponerte al procesamiento de tus datos</li>
                            <li>Exportar tus datos en formato legible</li>
                            <li>Retirar tu consentimiento en cualquier momento</li>
                        </ul>
                        <p style={textStyle}>
                            Para ejercer estos derechos, contáctanos a través de los canales indicados al final de esta política.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>7. Retención de Datos</h2>
                        <p style={textStyle}>
                            Conservamos tu información personal durante el tiempo necesario para cumplir con los
                            propósitos descritos en esta política, a menos que la ley requiera un período de
                            retención más largo. Cuando ya no necesitemos tu información, la eliminaremos de
                            forma segura.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>8. Transferencias Internacionales</h2>
                        <p style={textStyle}>
                            Tus datos pueden ser procesados y almacenados en servidores ubicados fuera de tu
                            país de residencia. Nos aseguramos de que estas transferencias cumplan con las
                            leyes aplicables de protección de datos mediante cláusulas contractuales estándar
                            u otros mecanismos aprobados.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>9. Cambios en esta Política</h2>
                        <p style={textStyle}>
                            Podemos actualizar esta política de privacidad periódicamente. Te notificaremos sobre
                            cambios significativos a través de la plataforma o por email. El uso continuado de
                            KERANA después de los cambios constituye la aceptación de la política revisada.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>10. Contacto</h2>
                        <p style={textStyle}>
                            Si tienes preguntas sobre esta política de privacidad o sobre el tratamiento de tus
                            datos personales, contáctanos en:
                        </p>
                        <ul style={listStyle}>
                            <li>Email: privacidad@kerana.com</li>
                            <li>Formulario de contacto: kerana.com/contact</li>
                            <li>Dirección postal: [Tu dirección física]</li>
                        </ul>
                        <p style={textStyle}>
                            También tienes derecho a presentar una queja ante la autoridad de protección de
                            datos de tu país.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Estilos (reutilizamos los mismos de Terms.jsx)
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