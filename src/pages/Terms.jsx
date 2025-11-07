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
                            <li>Acceder a reseñas sobre profesores y experiencias académicas</li>
                            <li>Conectarse con mentores para clases virtuales o presenciales</li>
                            <li>Gestionar su perfil, seguidores y notificaciones</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>3. Registro y Cuenta</h2>
                        <p style={textStyle}>
                            Para utilizar ciertas funciones, debes registrarte con un correo electrónico válido.
                            Serás responsable de mantener la confidencialidad de tu cuenta y contraseña, y de todas
                            las actividades que ocurran bajo tu cuenta.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>4. Contenido de Usuario</h2>
                        <p style={textStyle}>
                            Eres responsable del contenido que subes. Al subir contenido, confirmas que:
                        </p>
                        <ul style={listStyle}>
                            <li>Tienes los derechos necesarios para compartir dicho contenido</li>
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
                            <li>Las compras de paquetes de créditos son definitivas y no reembolsables</li>
                            <li>Las transacciones dentro de la plataforma son finales</li>
                            <li>Las mentorías se abonan según precio y modalidad vigente (virtual o presencial)</li>
                            <li>Los reembolsos de mentorías aplican solo si la clase no se realizó o existe un reclamo validado conforme las reglas publicadas</li>
                            <li>Los precios y tarifas pueden cambiar y se aplican hacia adelante</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>5.1. Sistema de Créditos y Bonificaciones</h2>
                        <p style={textStyle}>
                            KERANA utiliza un sistema de créditos como moneda virtual para transacciones
                            dentro de la plataforma. Al participar en KERANA, aceptas las siguientes condiciones:
                        </p>
                        <ul style={listStyle}>
                            <li>Al subir contenido educativo válido, recibirás créditos según las reglas vigentes</li>
                            <li>Recibirás una porción mayoritaria de créditos de forma inmediata</li>
                            <li>Una porción menor del valor se destina a bonificaciones por hitos de participación y calidad del contenido</li>
                            <li>Existen bonos adicionales por valoración de la comunidad, calidad del contenido, ventas, participación activa y rankings</li>
                            <li>Los créditos comprados con dinero real no son reembolsables bajo ninguna circunstancia</li>
                            <li>KERANA se reserva el derecho de ajustar los porcentajes y condiciones del sistema de créditos con previo aviso</li>
                        </ul>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>6. Normas de Conducta</h2>
                        <p style={textStyle}>
                            No está permitido usar KERANA para actividades fraudulentas, acosar a otros usuarios,
                            enviar spam o cualquier comportamiento que afecte negativamente la experiencia de la comunidad.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>7. Limitación de Responsabilidad</h2>
                        <p style={textStyle}>
                            KERANA no será responsable por daños indirectos, incidentales o consecuentes derivados del uso
                            de la plataforma. El uso del contenido compartido es responsabilidad del usuario. KERANA no es
                            responsable por interrupciones ajenas a su control (servicios de terceros, conexión a internet,
                            plataformas externas utilizadas para clases virtuales).
                        </p>
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
                            Podemos suspender o terminar tu acceso a KERANA si violas estos términos o realizas actividades
                            que perjudiquen a la comunidad o al funcionamiento del servicio.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>10. Propiedad Intelectual</h2>
                        <p style={textStyle}>
                            Todos los derechos, títulos e intereses en y para KERANA, incluyendo el contenido visual,
                            interactivo, diseño de usuario, software, código, son propiedad de KERANA o se usan
                            bajo licencia de los propietarios correspondientes.
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>11. Contacto</h2>
                        <p style={textStyle}>
                            Si tienes preguntas o inquietudes sobre estos términos, por favor ponte en contacto
                            con nosotros a través del Centro de ayuda o del formulario de contacto publicado en el sitio.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Estilos
const pageStyle = {
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: 'Inter, sans-serif',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
};

const titleStyle = {
    fontSize: '2rem',
    color: '#1e293b',
    margin: 0,
};

const subtitleStyle = {
    color: '#64748b',
    marginTop: '0.5rem',
};

const contentStyle = {
    padding: '1.5rem',
    background: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

const sectionStyle = {
    marginBottom: '1.5rem',
};

const sectionTitleStyle = {
    fontSize: '1.25rem',
    color: '#0f172a',
    marginBottom: '0.5rem',
};

const textStyle = {
    color: '#334155',
    lineHeight: 1.7,
};

const listStyle = {
    color: '#334155',
    paddingLeft: '1.2rem',
    lineHeight: 1.7,
};
