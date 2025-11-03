import { Card } from '../components/UI/Card';

export default function Terms() {
    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={headerStyle}>
                    <h1 style={titleStyle}>Términos y Condiciones</h1>
                    <p style={subtitleStyle}>
                        Última actualización: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <Card style={contentStyle}>
                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>1. Aceptación de los Términos</h2>
                        <p style={textStyle}>
                            Al acceder y utilizar KERANA, aceptas cumplir con estos términos y condiciones.
                            Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar
                            nuestros servicios.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>2. Descripción del Servicio</h2>
                        <p style={textStyle}>
                            KERANA es una plataforma educativa que permite a los usuarios:
                        </p>
                        <ul style={listStyle}>
                            <li>Compartir y vender apuntes, materiales de estudio y recursos educativos</li>
                            <li>Ofrecer y contratar servicios de mentoría académica</li>
                            <li>Comprar y vender cursos especializados</li>
                            <li>Conectar con otros estudiantes y profesionales de la educación</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>3. Registro y Cuenta</h2>
                        <p style={textStyle}>
                            Para utilizar ciertas funcionalidades de KERANA, debes registrarte creando una cuenta.
                            Te comprometes a:
                        </p>
                        <ul style={listStyle}>
                            <li>Proporcionar información veraz, exacta y completa</li>
                            <li>Mantener la confidencialidad de tu contraseña</li>
                            <li>Notificarnos inmediatamente cualquier uso no autorizado de tu cuenta</li>
                            <li>Ser mayor de 13 años o contar con autorización parental si eres menor</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>4. Contenido del Usuario</h2>
                        <p style={textStyle}>
                            Eres responsable del contenido que publicas en KERANA. Al subir contenido, garantizas que:
                        </p>
                        <ul style={listStyle}>
                            <li>Eres el autor o tienes los derechos necesarios para distribuirlo</li>
                            <li>El contenido no infringe derechos de autor ni propiedad intelectual</li>
                            <li>El contenido es educativo y apropiado para la plataforma</li>
                            <li>No contiene material ofensivo, ilegal o que viole estos términos</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>5. Transacciones y Pagos</h2>
                        <p style={textStyle}>
                            KERANA utiliza un sistema de créditos para las transacciones:
                        </p>
                        <ul style={listStyle}>
                            <li>Los créditos comprados no son reembolsables</li>
                            <li>Las transacciones entre usuarios son finales</li>
                            <li>Los precios pueden cambiar sin previo aviso</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>5.1. Sistema de Créditos y Bonificaciones</h2>
                        <p style={textStyle}>
                            KERANA utiliza un sistema de créditos como moneda virtual para transacciones
                            dentro de la plataforma. Al participar en KERANA, aceptas las siguientes condiciones:
                        </p>
                        <ul style={listStyle}>
                            <li>Al subir contenido educativo válido, recibirás una porción mayoritaria de créditos de forma inmediata</li>
                            <li>Una porción menor del valor se distribuye en forma de bonificaciones por hitos de participación y calidad del contenido</li>
                            <li>Existen bonos adicionales por bienvenida, calidad del contenido, ventas, participación activa y rankings</li>
                            <li>Los créditos comprados con dinero real no son reembolsables bajo ninguna circunstancia</li>
                            <li>KERANA se reserva el derecho de ajustar valores, porcentajes y condiciones del sistema de créditos con previo aviso</li>
                            <li>Los bonos y créditos pueden ser revocados en caso de detectarse fraude, contenido inapropiado o violación de estos términos</li>
                            <li>El contenido reportado y verificado como inapropiado resultará en la devolución de créditos a los compradores y penalización al autor</li>
                            <li>Para detalles completos sobre el funcionamiento del sistema de créditos y bonificaciones, consulta nuestra sección de Ayuda</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>6. Propiedad Intelectual</h2>
                        <p style={textStyle}>
                            Los usuarios mantienen los derechos de autor sobre el contenido que suben.
                            Al publicar en KERANA, nos otorgas una licencia no exclusiva para distribuir
                            y mostrar dicho contenido dentro de la plataforma.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>7. Limitación de Responsabilidad</h2>
                        <p style={textStyle}>
                            KERANA actúa como intermediario entre usuarios. No somos responsables por:
                        </p>
                        <ul style={listStyle}>
                            <li>La calidad, exactitud o legalidad del contenido publicado</li>
                            <li>Disputas entre usuarios</li>
                            <li>Daños o pérdidas resultantes del uso de la plataforma</li>
                            <li>Interrupciones temporales del servicio</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>8. Modificaciones de los Términos</h2>
                        <p style={textStyle}>
                            Nos reservamos el derecho de modificar estos términos en cualquier momento.
                            Las modificaciones entrarán en vigor inmediatamente después de su publicación
                            en la plataforma. El uso continuado de KERANA constituye la aceptación de
                            los términos modificados.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>9. Terminación</h2>
                        <p style={textStyle}>
                            Podemos suspender o terminar tu acceso a KERANA si violas estos términos o
                            realizas actividades que consideremos perjudiciales para la comunidad.
                            Al eliminar tu cuenta, todos tus datos personales y contenido son eliminados permanentemente.
                            Tu dirección de email permanece en nuestros sistemas de autenticación por seguridad,
                            pero no está asociada a ningún dato personal ni puede ser utilizada para identificarte.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>10. Contacto</h2>
                        <p style={textStyle}>
                            Para preguntas sobre estos términos, contáctanos a través de nuestra
                            página de contacto o envía un email a kerana.soporte@gmail.com
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

const listItemStyle = {
    marginBottom: '0.5rem',
};