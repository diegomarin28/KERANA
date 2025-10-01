// src/pages/HelpCenter.jsx
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function HelpCenter() {
    const [activeCategory, setActiveCategory] = useState('general');

    const faqCategories = {
        general: [
            {
                question: "¿Cómo creo una cuenta?",
                answer: "Para crear una cuenta, haz clic en 'Crear cuenta' en el menú principal. Puedes registrarte con tu email o mediante Google. Te recomendamos usar tu email institucional (@um.edu.uy) para verificación."
            },
            {
                question: "¿Cómo compro apuntes o cursos?",
                answer: "Navega por las asignaturas, profesores o cursos disponibles. Cuando encuentres contenido que te interese, haz clic en 'Comprar' y confirma la transacción con tus créditos. El material estará disponible inmediatamente en tu sección 'Comprados'."
            },
            {
                question: "¿Qué son los créditos y cómo los obtengo?",
                answer: "Los créditos son la moneda virtual de KERANA. Puedes obtenerlos mediante compra directa, subiendo contenido que otros usuarios compren, o participando en programas especiales de la plataforma."
            }
        ],
        technical: [
            {
                question: "¿La plataforma funciona en móviles?",
                answer: "Sí, KERANA es completamente responsive y funciona en dispositivos móviles, tablets y computadoras. Recomendamos usar la última versión de tu navegador para mejor experiencia."
            },
            {
                question: "¿Qué formatos de archivo soporta la plataforma?",
                answer: "Aceptamos PDF, DOC, DOCX, PPT, y archivos de imagen. El tamaño máximo por archivo es de 50MB. Para videos, puedes subir enlaces de YouTube o Vimeo."
            },
            {
                question: "¿Cómo descargo el material comprado?",
                answer: "Ve a tu sección 'Comprados', encuentra el material y haz clic en el botón 'Descargar'. El archivo se descargará inmediatamente a tu dispositivo."
            }
        ],
        account: [
            {
                question: "¿Puedo cambiar mi email?",
                answer: "Por seguridad, el email principal no se puede cambiar ya que está vinculado a tu cuenta de autenticación. Si necesitas actualizarlo, contacta con soporte."
            },
            {
                question: "¿Cómo actualizo mi información personal?",
                answer: "Ve a 'Ajustes' desde tu perfil para modificar tu nombre, nombre de usuario y otra información personal."
            },
            {
                question: "¿Qué hago si olvidé mi contraseña?",
                answer: "En la página de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' y sigue las instrucciones para restablecerla."
            }
        ]
    };

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <header style={headerStyle}>
                    <h1 style={titleStyle}>Centro de Ayuda</h1>
                    <p style={subtitleStyle}>
                        Encuentra respuestas a las preguntas más frecuentes sobre KERANA
                    </p>
                </header>

                <div style={contentStyle}>
                    {/* Categorías */}
                    <Card style={{ marginBottom: '2rem' }}>
                        <div style={categoriesStyle}>
                            {Object.keys(faqCategories).map(category => (
                                <Button
                                    key={category}
                                    variant={activeCategory === category ? 'primary' : 'secondary'}
                                    onClick={() => setActiveCategory(category)}
                                    style={{ flex: 1 }}
                                >
                                    {category === 'general' && 'General'}
                                    {category === 'technical' && 'Técnico'}
                                    {category === 'account' && 'Cuenta'}
                                </Button>
                            ))}
                        </div>
                    </Card>

                    {/* Preguntas Frecuentes */}
                    <div style={faqSectionStyle}>
                        <h2 style={sectionTitleStyle}>
                            {activeCategory === 'general' && 'Preguntas Generales'}
                            {activeCategory === 'technical' && 'Soporte Técnico'}
                            {activeCategory === 'account' && 'Cuenta y Perfil'}
                        </h2>

                        <div style={faqListStyle}>
                            {faqCategories[activeCategory].map((faq, index) => (
                                <FAQItem
                                    key={index}
                                    question={faq.question}
                                    answer={faq.answer}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Contacto de Soporte */}
                    <Card style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <div style={supportStyle}>
                            <h3 style={supportTitleStyle}>¿No encontraste lo que buscabas?</h3>
                            <p style={supportTextStyle}>
                                Nuestro equipo de soporte está aquí para ayudarte. Contáctanos y
                                responderemos a la brevedad.
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => window.location.href = '/contact'}
                            >
                                Contactar Soporte
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Componente para cada item del FAQ
function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card style={{ marginBottom: '1rem' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={faqQuestionStyle}
            >
                <span style={faqQuestionTextStyle}>{question}</span>
                <span style={faqIconStyle}>
                    {isOpen ? '−' : '+'}
                </span>
            </button>
            {isOpen && (
                <div style={faqAnswerStyle}>
                    {answer}
                </div>
            )}
        </Card>
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
    marginBottom: '3rem',
};

const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#0b1e3a',
    margin: '0 0 1rem 0',
};

const subtitleStyle = {
    fontSize: '1.1rem',
    color: '#64748b',
    margin: '0',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
};

const contentStyle = {
    maxWidth: '800px',
    margin: '0 auto',
};

const categoriesStyle = {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
};

const faqSectionStyle = {
    marginBottom: '3rem',
};

const sectionTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#0b1e3a',
    marginBottom: '1.5rem',
};

const faqListStyle = {
    // Estilos para la lista de FAQs
};

const faqQuestionStyle = {
    width: '100%',
    padding: '1.5rem',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0b1e3a',
};

const faqQuestionTextStyle = {
    flex: 1,
    marginRight: '1rem',
};

const faqIconStyle = {
    fontSize: '1.5rem',
    fontWeight: '300',
    color: '#64748b',
    minWidth: '20px',
    textAlign: 'center',
};

const faqAnswerStyle = {
    padding: '0 1.5rem 1.5rem 1.5rem',
    color: '#475569',
    lineHeight: '1.6',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '1rem',
};

const supportStyle = {
    textAlign: 'center',
    padding: '2rem',
};

const supportTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0369a1',
    margin: '0 0 1rem 0',
};

const supportTextStyle = {
    color: '#475569',
    margin: '0 0 1.5rem 0',
    lineHeight: '1.6',
};