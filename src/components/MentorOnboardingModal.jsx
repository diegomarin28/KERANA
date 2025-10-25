import { useState } from 'react';

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
        'Solymar', 'Lagomar', 'El Pinar', 'Shangrilá', 'Salinas'
    ]
};

export function MentorOnboardingModal({ open, onComplete }) {
    const [step, setStep] = useState(1); // 1: términos, 2: formulario
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
                        <div style={headerStyle}>
                            <span style={emojiStyle}>🎓</span>
                            <h2 style={titleStyle}>¡Bienvenido como Mentor de Kerana!</h2>
                        </div>

                        <div style={contentStyle}>
                            <p style={textStyle}>
                                <strong>¡Felicitaciones!</strong> Tu solicitud para ser mentor ha sido aprobada.
                                Ahora formás parte de nuestra comunidad de educadores.
                            </p>

                            <div style={infoBoxStyle}>
                                <h3 style={subtitleStyle}>💰 Precios y Pagos</h3>
                                <ul style={listStyle}>
                                    <li><strong>Clases virtuales (Zoom):</strong> $400 UYU por sesión</li>
                                    <li><strong>Clases presenciales:</strong> $600 UYU por sesión</li>
                                    <li>Creamos el link de Zoom automáticamente cuando el usuario paga</li>
                                    <li>Retenemos el pago 24 horas después de la clase</li>
                                    <li>Si no hay inconvenientes, transferimos a tu cuenta de Mercado Pago</li>
                                </ul>
                            </div>

                            <div style={infoBoxStyle}>
                                <h3 style={subtitleStyle}>🏠 Privacidad de Datos</h3>
                                <ul style={listStyle}>
                                    <li><strong>Público:</strong> Tu localidad (ej: Pocitos, Buceo)</li>
                                    <li><strong>Privado:</strong> Tu dirección exacta</li>
                                    <li>Tu dirección solo se comparte cuando el usuario paga y elige clase presencial en tu casa</li>
                                    <li>Si elegís solo facultad, tu dirección nunca se comparte</li>
                                </ul>
                            </div>

                            <div style={infoBoxStyle}>
                                <h3 style={subtitleStyle}>📅 Política de Cancelaciones</h3>
                                <ul style={listStyle}>
                                    <li><strong>Cancelación del estudiante:</strong>
                                        <ul style={{ marginTop: 8 }}>
                                            <li>✅ Más de 12 horas antes: Reembolso completo al usuario</li>
                                            <li>⚠️ Menos de 12 horas: Se te acredita 25% aunque no des la clase</li>
                                        </ul>
                                    </li>
                                    <li><strong>Cancelación del mentor:</strong>
                                        <ul style={{ marginTop: 8 }}>
                                            <li>✅ Más de 36 horas antes: Sin penalización</li>
                                            <li>❌ Menos de 36 horas: Recibes 1 strike</li>
                                            <li>⛔ 3 strikes = Baneo de 1 año</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <div style={infoBoxStyle}>
                                <h3 style={subtitleStyle}>⚡ Responsabilidades del Mentor</h3>
                                <ul style={listStyle}>
                                    <li>Responder solicitudes en tiempo y forma</li>
                                    <li>Cumplir con los horarios acordados</li>
                                    <li>Mantener un ambiente de respeto y profesionalismo</li>
                                    <li>Reportar cualquier inconveniente a: <strong>kerana.soporte@gmail.com</strong></li>
                                </ul>
                            </div>

                            <label style={checkboxContainerStyle}>
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    style={checkboxStyle}
                                />
                                <span style={{ fontSize: 14 }}>
                                    He leído y acepto los términos y condiciones como mentor de Kerana
                                </span>
                            </label>
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
                                Continuar →
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={headerStyle}>
                            <span style={emojiStyle}>⚙️</span>
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
                                    <span>Zoom (virtual) - $400 UYU</span>
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
                                    <span>Presencial - $600 UYU</span>
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
                                                { value: 'casa_mentor', label: 'En mi casa' },
                                                { value: 'facultad', label: 'En la facultad' },
                                                { value: 'ambas', label: 'Ambas opciones' }
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
                                ← Volver
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
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
};

const headerStyle = {
    padding: '32px 32px 24px 32px',
    textAlign: 'center',
    borderBottom: '1px solid #E5E7EB'
};

const emojiStyle = {
    fontSize: 48,
    display: 'block',
    marginBottom: 16
};

const titleStyle = {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#111827'
};

const contentStyle = {
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 24
};

const textStyle = {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    color: '#374151'
};

const infoBoxStyle = {
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 20
};

const subtitleStyle = {
    margin: '0 0 12px 0',
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
    color: '#111827'
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
    transition: 'all 0.2s ease'
};

const selectStyle = {
    padding: '12px 16px',
    border: '2px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    background: 'white',
    cursor: 'pointer'
};

const inputStyle = {
    padding: '12px 16px',
    border: '2px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827'
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
    transition: 'all 0.2s ease'
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
    transition: 'all 0.2s ease'
};

const radioStyle = {
    width: 18,
    height: 18,
    cursor: 'pointer'
};

const errorStyle = {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 600
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
    transition: 'all 0.2s ease'
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
    transition: 'all 0.2s ease'
};