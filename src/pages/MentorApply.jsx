import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/UI/Card';
import { FileUploadZone } from '../components/UI/FileUploadZone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faCheckCircle,
    faExclamationCircle,
    faInfoCircle,
    faGraduationCap,
    faBook
} from '@fortawesome/free-solid-svg-icons';
import emailjs from '@emailjs/browser';

export default function MentorApply() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [materias, setMaterias] = useState([]);
    const [filteredMaterias, setFilteredMaterias] = useState([]);
    const [selectedMateria, setSelectedMateria] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [formData, setFormData] = useState({
        calificacion: '',
        motivo: '',
        comprobante: null
    });
    const [error, setError] = useState('');
    const [fileError, setFileError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchMaterias();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalizeText = (text) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    useEffect(() => {
        if (searchTerm.trim()) {
            const normalizedSearch = normalizeText(searchTerm);
            const filtered = materias.filter(m =>
                normalizeText(m.nombre_materia).includes(normalizedSearch)
            );
            setFilteredMaterias(filtered);
            setShowDropdown(true);
        } else {
            setFilteredMaterias([]);
            setShowDropdown(false);
        }
    }, [searchTerm, materias]);

    const fetchMaterias = async () => {
        const { data: materiasData, error } = await supabase
            .from('materia')
            .select('id_materia, nombre_materia, semestre')
            .order('nombre_materia');

        if (error) {
            console.error('Error cargando materias:', error);
            return;
        }
        setMaterias(materiasData || []);
    };

    const handleMateriaSelect = (materia) => {
        setSelectedMateria(materia);
        setSearchTerm(materia.nombre_materia);
        setShowDropdown(false);
    };

    const handleFileChange = (file, error) => {
        if (error) {
            setFileError(error);
            setFormData({ ...formData, comprobante: null });
        } else {
            setFileError('');
            setFormData({ ...formData, comprobante: file });
        }
    };

    const uploadComprobante = async (file) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No hay usuario logueado');

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${selectedMateria.id_materia}_${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: upErr } = await supabase.storage
            .from('mentor-comprobantes')
            .upload(filePath, file, { upsert: false });

        if (upErr) throw upErr;

        const { data: pub } = supabase.storage
            .from('mentor-comprobantes')
            .getPublicUrl(filePath);

        const publicUrl = pub?.publicUrl || "";

        return { filePath, publicUrl };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedMateria) {
            setError('Debes seleccionar una materia');
            return;
        }

        if (!formData.calificacion || formData.calificacion < 9 || formData.calificacion > 12) {
            setError('La calificación debe ser entre 9 y 12');
            return;
        }

        if (!Number.isInteger(Number(formData.calificacion))) {
            setError('La calificación debe ser un número entero');
            return;
        }

        if (!formData.comprobante) {
            setError('Debes subir un comprobante de tu escolaridad');
            return;
        }

        try {
            setLoading(true);
            setUploading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Debes iniciar sesión');
                return;
            }


            const { data: usuarioData, error: userError } = await supabase
                .from('usuario')
                .select('id_usuario, nombre, correo')
                .eq('auth_id', user.id)
                .single();


            if (userError) {
                console.error('❌ Error buscando usuario:', userError);
                setError(`Error al buscar usuario: ${userError.message}. Verifica que tu cuenta esté registrada.`);
                return;
            }

            if (!usuarioData) {
                setError('No se encontró tu perfil de usuario en la base de datos.');
                return;
            }


            const { data: existingApplication, error: checkError } = await supabase
                .from('mentor_aplicacion')  // ✅ Tabla correcta
                .select('estado')
                .eq('id_usuario', usuarioData.id_usuario)
                .eq('id_materia', selectedMateria.id_materia)
                .maybeSingle();

            if (checkError) {
                console.error('Error verificando postulación existente:', checkError);
                setError('Error al verificar postulaciones previas');
                return;
            }

            if (existingApplication) {
                if (existingApplication.estado === 'pendiente') {
                    setError('Ya tenés una postulación pendiente para esta materia');
                    return;
                } else if (existingApplication.estado === 'aprobado') {
                    setError('Ya sos mentor de esta materia');
                    return;
                }
            }

            const { filePath, publicUrl } = await uploadComprobante(formData.comprobante);

            const { error: insertError } = await supabase
                .from('mentor_aplicacion')  // ✅ Tabla correcta
                .insert({
                    id_usuario: usuarioData.id_usuario,
                    id_materia: selectedMateria.id_materia,
                    calificacion_materia: parseInt(formData.calificacion),  // ✅ Nombre correcto
                    motivo: formData.motivo || null,
                    comprobante_path: filePath,
                    estado: 'pendiente'

                });

            if (insertError) {
                console.error('Error insertando postulación:', insertError);
                throw insertError;
            }

            try {
                await emailjs.send(
                    'service_8gg5zzh',
                    'template_6jjq3wo',
                    {
                        user_nombre: usuarioData.nombre,
                        user_email: usuarioData.correo,
                        materia_nombre: selectedMateria.nombre_materia,
                        calificacion: formData.calificacion,
                        motivo: formData.motivo || 'No especificado',
                        comprobante_url: publicUrl
                    },
                    'nZePMqXLCLLc7fxYg'
                );
                console.log('✅ Email enviado correctamente');
            } catch (emailError) {
                console.error('⚠️ Error enviando email (no crítico):', emailError);
            }

            setSuccessMessage('¡Postulación enviada con éxito! Te notificaremos cuando sea revisada.');
            setFormData({ calificacion: '', motivo: '', comprobante: null });
            setSelectedMateria(null);
            setSearchTerm('');

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            console.error('Error completo:', error);
            setError(error.message || 'Error al enviar la postulación');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    if (successMessage) {
        return (
            <div style={{
                maxWidth: '600px',
                margin: '60px auto',
                padding: '0 20px',
                animation: 'fadeIn 0.4s ease'
            }}>
                <Card style={{
                    padding: '48px 32px',
                    textAlign: 'center',
                    border: '2px solid #10b981'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 24px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'scaleIn 0.5s ease'
                    }}>
                        <FontAwesomeIcon
                            icon={faCheckCircle}
                            style={{ fontSize: '40px', color: '#fff' }}
                        />
                    </div>
                    <h2 style={{
                        margin: '0 0 12px 0',
                        fontSize: 'clamp(24px, 4vw, 32px)',
                        fontWeight: 700,
                        color: '#059669'
                    }}>
                        ¡Postulación enviada!
                    </h2>
                    <p style={{
                        margin: 0,
                        color: '#64748b',
                        fontSize: '15px',
                        fontWeight: 500,
                        lineHeight: 1.6
                    }}>
                        {successMessage}
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div
            id="mentor-apply-form"
            style={{
                maxWidth: '700px',
                margin: '40px auto 120px',
                padding: '0 20px',
                boxSizing: 'border-box'
            }}>
            {/* Estilos específicos para este componente */}
            <style>{`
                #mentor-apply-form * {
                    box-sizing: border-box;
                }
            `}</style>

            {/* Header */}
            <div style={{
                marginBottom: '32px',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    marginBottom: '16px'
                }}>
                    <FontAwesomeIcon
                        icon={faGraduationCap}
                        style={{ fontSize: '32px', color: '#fff' }}
                    />
                </div>
                <h1 style={{
                    margin: '0 0 8px 0',
                    fontSize: 'clamp(28px, 5vw, 36px)',
                    fontWeight: 800,
                    color: '#0f172a'
                }}>
                    Postulate como Mentor
                </h1>
                <p style={{
                    margin: 0,
                    fontSize: '15px',
                    color: '#64748b',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    maxWidth: '500px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}>
                    Ayudá a otros estudiantes compartiendo tu conocimiento en materias que dominás
                </p>
            </div>

            {/* Formulario */}
            <Card style={{ padding: '32px 28px' }}>
                <form onSubmit={handleSubmit}>
                    {/* Búsqueda de materia */}
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#0f172a'
                        }}>
                            Materia *
                        </label>
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscá tu materia..."
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 44px',
                                        border: error && !selectedMateria ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: '#0f172a',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        background: '#fff',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        if (!error) {
                                            e.currentTarget.style.borderColor = '#2563eb';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    disabled={loading}
                                />
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#94a3b8',
                                        fontSize: '16px',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>

                            {/* Dropdown de materias */}
                            {showDropdown && filteredMaterias.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    left: 0,
                                    right: 0,
                                    background: '#fff',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '12px',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                                    maxHeight: '280px',
                                    overflowY: 'auto',
                                    zIndex: 50,
                                    animation: 'slideDown 0.2s ease'
                                }}>
                                    {filteredMaterias.map((materia) => (
                                        <div
                                            key={materia.id_materia}
                                            onClick={() => handleMateriaSelect(materia)}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#f8fafc';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#fff';
                                            }}
                                        >
                                            <FontAwesomeIcon
                                                icon={faBook}
                                                style={{
                                                    color: '#64748b',
                                                    fontSize: '14px'
                                                }}
                                            />
                                            <div style={{ fontWeight: 500, fontSize: '14px', color: '#0f172a' }}>
                                                {materia.nombre_materia}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calificación */}
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#0f172a'
                        }}>
                            Calificación obtenida * (mínimo 9)
                        </label>
                        <input
                            type="text"
                            value={formData.calificacion}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (error) setError('');
                                if (/^\d*$/.test(val)) {
                                    setFormData({ ...formData, calificacion: val });
                                }
                            }}
                            onBlur={() => {
                                const num = Number(formData.calificacion);
                                if (formData.calificacion !== '' && (num < 9 || num > 12)) {
                                    setError('Por favor ingrese un valor entre 9 y 12');
                                    setFormData({ ...formData, calificacion: '' });
                                }
                            }}
                            placeholder="Ej: 10"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: error && !formData.calificacion ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#2563eb';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                }
                            }}
                            onBlur={(e) => {
                                const num = Number(formData.calificacion);
                                if (formData.calificacion !== '' && (num < 9 || num > 12)) {
                                    setError('Por favor ingrese un valor entre 9 y 12');
                                    setFormData({ ...formData, calificacion: '' });
                                }
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            disabled={loading}
                        />

                        {/* Indicador de éxito */}
                        {formData.calificacion && Number(formData.calificacion) >= 9 && Number(formData.calificacion) <= 12 && (
                            <div style={{
                                marginTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#059669',
                                fontSize: '13px',
                                fontWeight: 600,
                                animation: 'fadeIn 0.3s ease'
                            }}>
                                <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '16px' }} />
                                <span>Valor válido: {formData.calificacion}</span>
                            </div>
                        )}
                    </div>

                    {/* Upload de comprobante */}
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#0f172a'
                        }}>
                            Comprobante de escolaridad * (foto/imagen)
                        </label>
                        <FileUploadZone
                            file={formData.comprobante}
                            onFileChange={handleFileChange}
                            accept="image/*"
                            maxSize={5}
                            disabled={loading}
                            error={fileError}
                        />
                    </div>

                    {/* Motivo (opcional) */}
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#0f172a'
                        }}>
                            Motivo (opcional)
                        </label>
                        <textarea
                            value={formData.motivo}
                            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                            placeholder="Contanos por qué querés ser mentor de esta materia..."
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#0f172a',
                                resize: 'vertical',
                                fontFamily: 'Inter, -apple-system, sans-serif',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                lineHeight: 1.6
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            disabled={loading}
                        />
                    </div>

                    {/* Mensaje de error general */}
                    {error && (
                        <div style={{
                            marginBottom: '24px',
                            padding: '14px 16px',
                            background: '#fef2f2',
                            border: '2px solid #fecaca',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            animation: 'fadeIn 0.3s ease'
                        }}>
                            <FontAwesomeIcon
                                icon={faExclamationCircle}
                                style={{
                                    color: '#dc2626',
                                    fontSize: '18px',
                                    marginTop: '1px',
                                    flexShrink: 0
                                }}
                            />
                            <span style={{
                                color: '#dc2626',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 1.5
                            }}>
                                {error}
                            </span>
                        </div>
                    )}

                    {/* Botón de envío */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: loading ? '#94a3b8' : '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: loading ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                            fontFamily: 'Inter, -apple-system, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                            }
                        }}
                    >
                        {uploading ? 'Subiendo archivo...' : loading ? 'Enviando...' : 'Enviar postulación'}
                    </button>
                </form>
            </Card>

            {/* Card de requisitos */}
            <Card style={{
                marginTop: '24px',
                padding: '24px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '2px solid #bfdbfe'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                }}>
                    <FontAwesomeIcon
                        icon={faInfoCircle}
                        style={{
                            color: '#1e40af',
                            fontSize: '20px'
                        }}
                    />
                    <h3 style={{
                        margin: 0,
                        color: '#1e40af',
                        fontSize: '17px',
                        fontWeight: 700
                    }}>
                        Requisitos
                    </h3>
                </div>
                <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: '#1e3a8a',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: 1.8
                }}>
                    <li>Calificación mínima de 9 en la materia</li>
                    <li>Subir comprobante de tu escolaridad (foto que encontrás en el portal de la facultad)</li>
                    <li>Tu postulación será revisada por un administrador</li>
                </ul>
            </Card>

            {/* Keyframes para animaciones */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}