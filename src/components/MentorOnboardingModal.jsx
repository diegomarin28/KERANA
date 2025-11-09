import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGraduationCap,
    faDollarSign,
    faShieldAlt,
    faCalendarTimes,
    faBolt,
    faCog,
    faCheckCircle,
    faVideo,
    faHome,
    faUniversity,
    faFileContract,
    faUser,
    faEnvelope,
    faCheck
} from '@fortawesome/free-solid-svg-icons';

const LOCALIDADES = {
    montevideo: [
        'Pocitos', 'Buceo', 'Carrasco', 'Punta Gorda', 'Prado', 'Tres Cruces',
        'Parque Batlle', 'Centro', 'Cordón', 'Parque Rodó', 'Malvín',
        'Punta Carretas', 'Ciudad Vieja', 'Palermo', 'Brazo Oriental',
        'La Blanqueada', 'Villa Dolores', 'Unión', 'Maroñas', 'Sayago',
        'Bella Vista', 'Jacinto Vera', 'Aguada', 'Reducto', 'Capurro',
        'La Teja', 'Villa Muñoz', 'Paso Molino', 'Belvedere', 'Atahualpa',
        'Peñarol', 'La Comercial'
    ],
    canelones: [
        'Ciudad de la Costa', 'Pando', 'Las Piedras', 'La Paz', 'Progreso',
        'Canelones', 'Santa Lucía', 'Atlántida', 'Parque del Plata',
        'Solymar', 'Lagomar', 'El Pinar', 'Shangrilá', 'Salinas', 'Colonia Nicolich'

    ]
};

export function MentorOnboardingModal({ open, onComplete }) {
    const [step, setStep] = useState(1);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [formData, setFormData] = useState({
        maxAlumnos: null,
        localidad: '',
        otraLocalidad: '',
        aceptaZoom: false,
        aceptaPresencial: false,
        lugarPresencial: null,
        direccion: ''
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    const validateForm = () => {
        const newErrors = {};

        if (!formData.maxAlumnos) {
            newErrors.maxAlumnos = 'Seleccioná la cantidad máxima de alumnos';
        }

        if (!formData.localidad || (formData.localidad === 'otro' && !formData.otraLocalidad.trim())) {
            newErrors.localidad = 'Seleccioná o ingresá tu localidad';
        }

        if (!formData.aceptaZoom && !formData.aceptaPresencial) {
            newErrors.tipoClase = 'Debés aceptar al menos un tipo de clase';
        }

        if (formData.aceptaPresencial && !formData.lugarPresencial) {
            newErrors.lugarPresencial = 'Seleccioná dónde das clases presenciales';
        }

        if (formData.aceptaPresencial &&
            (formData.lugarPresencial === 'casa_mentor' || formData.lugarPresencial === 'ambas') &&
            !formData.direccion.trim()) {
            newErrors.direccion = 'Ingresá tu dirección para clases en tu casa';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);

        const finalData = {
            maxAlumnos: formData.maxAlumnos,
            localidad: formData.localidad === 'otro' ? formData.otraLocalidad : formData.localidad,
            aceptaZoom: formData.aceptaZoom,
            aceptaPresencial: formData.aceptaPresencial,
            lugarPresencial: formData.aceptaPresencial ? formData.lugarPresencial : null,
            direccion: (formData.aceptaPresencial &&
                (formData.lugarPresencial === 'casa_mentor' || formData.lugarPresencial === 'ambas'))
                ? formData.direccion : null
        };

        const result = await onComplete(finalData);

        if (!result.success) {
            alert('Hubo un error guardando tu información. Intentá de nuevo.');
        }

        setSubmitting(false);
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {step === 1 ? (
                    <>
                        {/* STEP 1: TÉRMINOS Y CONDICIONES COMPLETOS */}
                        <div style={headerStyle}>
                            <div style={{
                                width: 80,
                                height: 80,
                                background: 'linear-gradient(135deg, #13346b 0%, #2563eb 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
                            }}>
                                <FontAwesomeIcon
                                    icon={faFileContract}
                                    style={{ fontSize: 36, color: '#fff' }}
                                />
                            </div>
                            <h2 style={titleStyle}>Términos y Condiciones para Mentores</h2>
                            <p style={{ ...textStyle, textAlign: 'center', marginTop: 8, color: '#64748b' }}>
                                Leé atentamente las condiciones antes de continuar
                            </p>
                        </div>

                        <div style={contentStyle}>
                            {/* 1. Precios y Pagos */}
                            <div>
                                <div style={sectionHeaderStyle}>
                                    <FontAwesomeIcon
                                        icon={faDollarSign}
                                        style={{ fontSize: 18, color: '#2563eb' }}
                                    />
                                    <h3 style={sectionTitleStyle}>1. Precios y Pagos</h3>
                                </div>
                                <ul style={listStyle}>
                                    <li><strong>Clases virtuales:</strong> $430 UYU por sesión de 60 minutos</li>
                                    <li><strong>Clases presenciales:</strong> $630 UYU por sesión de 60 minutos</li>
                                    <li>Los pagos son procesados a través de <strong>Mercado Pago</strong></li>
                                    <li>Kerana retiene el pago hasta <strong>24 horas después</strong> de finalizada la mentoría</li>
                                    <li>Si no hay inconvenientes, se transfiere automáticamente a tu cuenta</li>
                                    <li>Mercado Pago cobra aproximadamente <strong>6%</strong> de comisión</li>
                                </ul>
                            </div>

                            {/* 2. Privacidad */}
                            <div>
                                <div style={sectionHeaderStyle}>
                                    <FontAwesomeIcon
                                        icon={faShieldAlt}
                                        style={{ fontSize: 18, color: '#2563eb' }}
                                    />
                                    <h3 style={sectionTitleStyle}>2. Privacidad y Protección de Datos</h3>
                                </div>
                                <ul style={listStyle}>
                                    <li><strong>Información pública:</strong> Nombre, foto, localidad general y materias</li>
                                    <li><strong>Información privada:</strong> Dirección exacta, email y datos bancarios</li>
                                    <li>Tu dirección solo se comparte con alumnos que pagaron una clase presencial en tu domicilio</li>
                                    <li>Si solo das clases en facultad o virtuales, tu dirección nunca se comparte</li>
                                    <li>Kerana no comparte tus datos bancarios con los alumnos bajo ninguna circunstancia</li>
                                </ul>
                            </div>

                            {/* 3. Política de Cancelaciones */}
                            <div>
                                <div style={sectionHeaderStyle}>
                                    <FontAwesomeIcon
                                        icon={faCalendarTimes}
                                        style={{ fontSize: 18, color: '#2563eb' }}
                                    />
                                    <h3 style={sectionTitleStyle}>3. Política de Cancelaciones</h3>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <h4 style={subsectionTitleStyle}>3.1. Cancelación por parte del alumno</h4>
                                    <ul style={listStyle}>
                                        <li><strong>Más de 12 horas antes:</strong> El alumno recibe reembolso completo. El mentor no recibe pago.</li>
                                        <li><strong>Menos de 12 horas:</strong> Se te acredita el 35% del monto aunque no se dicte la clase</li>
                                        <li>Si el alumno no se presenta sin avisar, recibís el pago completo</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={subsectionTitleStyle}>3.2. Cancelación por parte del mentor</h4>
                                    <ul style={listStyle}>
                                        <li><strong>Más de 36 horas antes:</strong> Sin penalización. El alumno recibe reembolso completo</li>
                                        <li><strong>Menos de 36 horas:</strong> Se te asigna 1 strike. El alumno recibe reembolso completo</li>
                                        <li><strong>3 strikes acumulados:</strong> Suspensión automática de la cuenta por 1 año</li>
                                        <li>Los strikes se resetean cada 6 meses si no hay nuevas infracciones</li>
                                    </ul>
                                </div>
                            </div>

                            {/* 4. Responsabilidades */}
                            <div>
                                <div style={sectionHeaderStyle}>
                                    <FontAwesomeIcon
                                        icon={faBolt}
                                        style={{ fontSize: 18, color: '#2563eb' }}
                                    />
                                    <h3 style={sectionTitleStyle}>4. Responsabilidades del Mentor</h3>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <h4 style={subsectionTitleStyle}>4.1. Para clases virtuales</h4>
                                    <ul style={listStyle}>
                                        <li>Crear el link de la videollamada y enviárselo al alumno con anticipación</li>
                                        <li>Estar online y disponible 5 minutos antes del horario acordado</li>
                                        <li>Asegurar una conexión estable a internet y equipo en buen funcionamiento</li>
                                    </ul>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <h4 style={subsectionTitleStyle}>4.2. Para clases presenciales</h4>
                                    <ul style={listStyle}>
                                        <li>Estar en el lugar acordado <strong>mínimo 10 minutos antes</strong> (obligatorio)</li>
                                        <li>Confirmar el punto de encuentro con el alumno al menos 2 horas antes</li>
                                        <li>Mantener un ambiente seguro y apropiado para el aprendizaje</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={subsectionTitleStyle}>4.3. Responsabilidades generales</h4>
                                    <ul style={listStyle}>
                                        <li>Responder solicitudes de clases en un plazo máximo de 24 horas</li>
                                        <li>Cumplir puntualmente con los horarios acordados</li>
                                        <li>Mantener una actitud profesional y respetuosa en todo momento</li>
                                        <li>Brindar el máximo esfuerzo para que el alumno logre sus objetivos</li>
                                        <li>Mantener comunicación clara y fluida con los alumnos</li>
                                        <li>Actualizar tu disponibilidad horaria regularmente</li>
                                        <li>Reportar inconvenientes a <strong>kerana.soporte@gmail.com</strong></li>
                                    </ul>
                                </div>
                            </div>

                            {/* 5. Código de Conducta */}
                            <div>
                                <div style={sectionHeaderStyle}>
                                    <FontAwesomeIcon
                                        icon={faCheckCircle}
                                        style={{ fontSize: 18, color: '#2563eb' }}
                                    />
                                    <h3 style={sectionTitleStyle}>5. Código de Conducta</h3>
                                </div>
                                <ul style={listStyle}>
                                    <li>Está <strong>prohibido</strong> cualquier tipo de acoso, discriminación o comportamiento inapropiado</li>
                                    <li>No se permite solicitar pagos fuera de la plataforma</li>
                                    <li>Kerana se reserva el derecho de suspender cuentas que violen estos términos</li>
                                    <li>Las decisiones de moderación son finales e inapelables</li>
                                </ul>
                            </div>

                            {/* 6. Modificaciones */}
                            <div>
                                <div style={sectionHeaderStyle}>
                                    <FontAwesomeIcon
                                        icon={faCog}
                                        style={{ fontSize: 18, color: '#2563eb' }}
                                    />
                                    <h3 style={sectionTitleStyle}>6. Modificaciones a los Términos</h3>
                                </div>
                                <p style={textStyle}>
                                    Kerana se reserva el derecho de modificar estos términos en cualquier momento.
                                    Los cambios serán notificados por email y entrarán en vigencia 15 días después.
                                    Continuar usando la plataforma implica la aceptación de los nuevos términos.
                                </p>
                            </div>

                            {/* Separador */}
                            <div style={{
                                height: 1,
                                background: 'linear-gradient(to right, transparent, #cbd5e1, transparent)',
                                margin: '8px 0'
                            }}></div>

                            {/* Contacto */}
                            <div style={{
                                padding: 16,
                                background: '#f8fafc',
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                textAlign: 'center'
                            }}>
                                <p style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                                    <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8, color: '#2563eb' }} />
                                    ¿Dudas o consultas?
                                </p>
                                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                                    Contactanos en{' '}
                                    <a
                                        href="mailto:kerana.soporte@gmail.com"
                                        style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}
                                    >
                                        kerana.soporte@gmail.com
                                    </a>
                                </p>
                            </div>

                            {/* Checkbox aceptación */}
                            <label style={checkboxContainerStyle}>
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    style={checkboxStyle}
                                />
                                <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                                    He leído y acepto todos los términos y condiciones para ser mentor de Kerana
                                </span>
                            </label>

                            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
                                Última actualización: Enero 2025
                            </p>
                        </div>

                        <div style={footerStyle}>
                            <button
                                onClick={() => setStep(2)}
                                style={{
                                    ...primaryButtonStyle,
                                    opacity: acceptedTerms ? 1 : 0.5,
                                    cursor: acceptedTerms ? 'pointer' : 'not-allowed'
                                }}
                                disabled={!acceptedTerms}
                            >
                                <FontAwesomeIcon icon={faCheck} style={{ marginRight: 8 }} />
                                Acepto, continuar
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* STEP 2: CONFIGURACIÓN (SIN CAMBIOS) */}
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
                                    icon={faCog}
                                    style={{ fontSize: 36, color: '#fff' }}
                                />
                            </div>
                            <h2 style={titleStyle}>Configurá tu perfil de mentor</h2>
                        </div>

                        <div style={contentStyle}>
                            {/* Pregunta 1: Cantidad de alumnos */}
                            <div style={questionStyle}>
                                <label style={labelStyle}>
                                    1. ¿Cuántos alumnos aceptás como máximo en una clase?
                                </label>
                                <div style={optionsRowStyle}>
                                    {[1, 2, 3].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setFormData({ ...formData, maxAlumnos: num })}
                                            style={{
                                                ...optionButtonStyle,
                                                background: formData.maxAlumnos === num ? '#10B981' : 'white',
                                                color: formData.maxAlumnos === num ? 'white' : '#374151',
                                                borderColor: formData.maxAlumnos === num ? '#10B981' : '#D1D5DB'
                                            }}
                                        >
                                            {num} {num === 1 ? 'alumno' : 'alumnos'}
                                        </button>
                                    ))}
                                </div>
                                {errors.maxAlumnos && <span style={errorStyle}>{errors.maxAlumnos}</span>}
                            </div>

                            {/* Pregunta 2: Localidad */}
                            <div style={questionStyle}>
                                <label style={labelStyle}>2. ¿En qué localidad vivís?</label>
                                <select
                                    value={formData.localidad}
                                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                                    style={selectStyle}
                                >
                                    <option value="">-- Seleccioná --</option>
                                    <optgroup label="Montevideo">
                                        {LOCALIDADES.montevideo.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Canelones">
                                        {LOCALIDADES.canelones.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </optgroup>
                                    <option value="otro">Otro (escribir)</option>
                                </select>

                                {formData.localidad === 'otro' && (
                                    <input
                                        type="text"
                                        placeholder="Ingresá tu localidad"
                                        value={formData.otraLocalidad}
                                        onChange={(e) => setFormData({ ...formData, otraLocalidad: e.target.value })}
                                        style={inputStyle}
                                    />
                                )}
                                {errors.localidad && <span style={errorStyle}>{errors.localidad}</span>}
                            </div>

                            {/* Pregunta 3: Tipo de clases */}
                            <div style={questionStyle}>
                                <label style={labelStyle}>3. ¿Qué tipo de clases ofrecés?</label>

                                <label style={checkboxLabelStyle}>
                                    <input
                                        type="checkbox"
                                        checked={formData.aceptaZoom}
                                        onChange={(e) => setFormData({ ...formData, aceptaZoom: e.target.checked })}
                                        style={checkboxStyle}
                                    />
                                    <FontAwesomeIcon icon={faVideo} style={{ color: '#2563eb', fontSize: 16 }} />
                                    <span>Virtual - $430 UYU</span>
                                </label>

                                <label style={checkboxLabelStyle}>
                                    <input
                                        type="checkbox"
                                        checked={formData.aceptaPresencial}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            aceptaPresencial: e.target.checked,
                                            lugarPresencial: e.target.checked ? formData.lugarPresencial : null,
                                            direccion: e.target.checked ? formData.direccion : ''
                                        })}
                                        style={checkboxStyle}
                                    />
                                    <FontAwesomeIcon icon={faHome} style={{ color: '#10b981', fontSize: 16 }} />
                                    <span>Presencial - $630 UYU</span>
                                </label>

                                {errors.tipoClase && <span style={errorStyle}>{errors.tipoClase}</span>}
                            </div>

                            {/* Pregunta 4: Lugar presencial (condicional) */}
                            {formData.aceptaPresencial && (
                                <>
                                    <div style={questionStyle}>
                                        <label style={labelStyle}>4. ¿Dónde das clases presenciales?</label>
                                        <div style={optionsColumnStyle}>
                                            {[
                                                { value: 'casa_mentor', label: 'En mi casa', icon: faHome },
                                                { value: 'facultad', label: 'En la facultad', icon: faUniversity },
                                                { value: 'ambas', label: 'Ambas opciones', icon: faCheckCircle }
                                            ].map(option => (
                                                <label key={option.value} style={radioLabelStyle}>
                                                    <input
                                                        type="radio"
                                                        name="lugarPresencial"
                                                        value={option.value}
                                                        checked={formData.lugarPresencial === option.value}
                                                        onChange={(e) => setFormData({ ...formData, lugarPresencial: e.target.value })}
                                                        style={radioStyle}
                                                    />
                                                    <FontAwesomeIcon icon={option.icon} style={{ color: '#6b7280', fontSize: 16 }} />
                                                    <span>{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.lugarPresencial && <span style={errorStyle}>{errors.lugarPresencial}</span>}
                                    </div>

                                    {/* Pregunta 5: Dirección (si acepta en su casa) */}
                                    {(formData.lugarPresencial === 'casa_mentor' || formData.lugarPresencial === 'ambas') && (
                                        <div style={questionStyle}>
                                            <label style={labelStyle}>
                                                5. ¿Cuál es tu dirección?
                                                <span style={{ fontSize: 13, fontWeight: 400, color: '#6B7280', marginLeft: 8 }}>
                                                    (Solo se comparte cuando el usuario paga y elige clase en tu casa)
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Bulevar Artigas 1234, apto 302"
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                                style={inputStyle}
                                            />
                                            {errors.direccion && <span style={errorStyle}>{errors.direccion}</span>}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div style={footerStyle}>
                            <button onClick={() => setStep(1)} style={secondaryButtonStyle} disabled={submitting}>
                                Volver
                            </button>
                            <button onClick={handleSubmit} style={primaryButtonStyle} disabled={submitting}>
                                {submitting ? 'Guardando...' : 'Guardar y continuar'}
                            </button>
                        </div>
                    </>
                )}
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
    zIndex: 99999,
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
    borderBottom: '1px solid #E5E7EB'
};

const titleStyle = {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    fontFamily: 'Inter, sans-serif'
};

const contentStyle = {
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 24
};

const textStyle = {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#475569',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500
};

const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '2px solid #e5e7eb'
};

const sectionTitleStyle = {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif'
};

const subsectionTitleStyle = {
    margin: '0 0 8px 0',
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif'
};

const listStyle = {
    margin: 0,
    paddingLeft: 20,
    fontSize: 13,
    lineHeight: 1.9,
    color: '#475569',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500
};

const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    background: '#FEF3C7',
    border: '2px solid #F59E0B',
    borderRadius: 12,
    cursor: 'pointer'
};

const questionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
};

const labelStyle = {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    fontFamily: 'Inter, sans-serif'
};

const optionsRowStyle = {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap'
};

const optionsColumnStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
};

const optionButtonStyle = {
    flex: 1,
    minWidth: 120,
    padding: '12px 20px',
    border: '2px solid',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const selectStyle = {
    padding: '12px 16px',
    border: '2px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    background: 'white',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif'
};

const inputStyle = {
    padding: '12px 16px',
    border: '2px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter, sans-serif'
};

const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    border: '2px solid #E5E7EB',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 15,
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const checkboxStyle = {
    width: 18,
    height: 18,
    cursor: 'pointer'
};

const radioLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    border: '2px solid #E5E7EB',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 15,
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const radioStyle = {
    width: 18,
    height: 18,
    cursor: 'pointer'
};

const errorStyle = {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif'
};

const footerStyle = {
    padding: 24,
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end'
};

const primaryButtonStyle = {
    padding: '12px 24px',
    background: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: 8
};

const secondaryButtonStyle = {
    padding: '12px 24px',
    background: 'white',
    color: '#6B7280',
    border: '2px solid #E5E7EB',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};