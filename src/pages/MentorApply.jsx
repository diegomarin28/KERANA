    import { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { supabase } from '../supabase';
    import { Card } from '../components/ui/Card';
    import { Button } from '../components/ui/Button';
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

        const handleFileChange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    setError('El archivo debe ser una imagen (JPG, PNG, etc.)');
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    setError('El archivo no puede pesar más de 5MB');
                    return;
                }
                setFormData({ ...formData, comprobante: file });
                setError('');
            }
        };

        const uploadComprobante = async (file) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No hay usuario logueado');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${selectedMateria.id_materia}_${Date.now()}.${fileExt}`;
            const filePath = fileName;

            // ✅ bucket correcto (public): mentor-comprobante
            const { error: upErr } = await supabase.storage
                .from('mentor-comprobantes')
                .upload(filePath, file, { upsert: false });

            if (upErr) throw upErr;

            // URL pública
            const { data: pub } = supabase.storage
                .from('mentor-comprobantes')
                .getPublicUrl(filePath);

            const publicUrl = pub?.publicUrl || "";

            // devolvemos ambos
            return { filePath, publicUrl };
        };


        const handleSubmit = async (e) => {
            e.preventDefault();
            setError('');

            if (!selectedMateria) {
                setError('Debes seleccionar una materia');
                return;
            }

            if (!formData.calificacion || formData.calificacion < 8 || formData.calificacion > 12) {
                setError('La calificación debe ser entre 8 y 12');
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

                // Buscar usuario por auth_id
                console.log('🔍 Buscando usuario con auth_id:', user.id);

                const { data: usuarioData, error: userError } = await supabase
                    .from('usuario')
                    .select('id_usuario, nombre, correo')
                    .eq('auth_id', user.id)
                    .single();

                // Log detallado para debugging
                console.log('📊 Resultado de búsqueda:', { usuarioData, userError });

                if (userError) {
                    console.error('❌ Error buscando usuario:', userError);
                    setError(`Error al buscar usuario: ${userError.message}. Verifica que tu cuenta esté registrada.`);
                    return;
                }

                if (!usuarioData) {
                    setError('No se encontró tu perfil de usuario en la base de datos.');
                    return;
                }

                const { filePath, publicUrl } = await uploadComprobante(formData.comprobante);

                const { data: applicationData, error: insertError } = await supabase
                    .from('mentor_aplicacion')
                    .insert([{
                        id_usuario: usuarioData.id_usuario,
                        id_materia: selectedMateria.id_materia,
                        motivo: formData.motivo?.trim() || null,
                        calificacion_materia: parseInt(formData.calificacion, 10),
                        comprobante_path: filePath,   // ✅ guardamos el path (no bytea)
                        estado: 'pendiente'
                    }])
                    .select()
                    .single();


                if (insertError) throw insertError;

                // ✅ ENVIAR EMAIL DE NOTIFICACIÓN AL ADMIN
                try {
                    await emailjs.send(
                        "service_dan74a5",
                        "template_e9obnfd",
                        {
                            application_id: applicationData.id,
                            user_email: user.email,
                            user_name: usuarioData.nombre || user.email,
                            materia_nombre: selectedMateria.nombre_materia,
                            calificacion: formData.calificacion,
                            // ✅ mensaje = el motivo del postulante (sin bloque prefabricado)
                            message: formData.motivo?.trim() || "",
                            // ✅ foto pública para el mail
                            comprobante_url: publicUrl,
                            // destinatario del admin (ajustalo a tu correo real)
                            to_email: "tu-email-admin@gmail.com",
                            subject: "📚 Nueva aplicación de mentor - Kerana"
                        },
                        "DMO310micvFWXx-j4"
                    );
                    console.log('✅ Notificación enviada por email');
                } catch (emailError) {
                    console.log('❌ Email falló pero aplicación se guardó:', emailError);
                }


                setSuccessMessage('¡Tu postulación ha sido enviada con éxito! Te notificaremos por correo cuando sea revisada.');

                // Esperar 3 segundos antes de redirigir para que el usuario vea el mensaje
                setTimeout(() => {
                    navigate('/');
                }, 3000);

            } catch (err) {
                console.error('Error al postular:', err);
                setError(err.message || 'Error al enviar la postulación');
            } finally {
                setLoading(false);
                setUploading(false);
            }
        };

        // ------------------ Listener de aprobación ------------------
        useEffect(() => {
            // Crear un canal para escuchar cambios en mentor_aplicacion
            const channel = supabase
                .channel('mentor_aplicaciones') // nombre único del canal
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'mentor_aplicacion' },
                    async (payload) => {
                        const newRow = payload.new;
                        const oldRow = payload.old;

                        if (newRow.estado === 'aprobado' && oldRow.estado !== 'aprobado') {
                            try {
                                const { data: usuario } = await supabase
                                    .from('usuario')
                                    .select('nombre, correo')
                                    .eq('id_usuario', newRow.id_usuario)
                                    .single();

                                await emailjs.send(
                                    "service_dan74a5",
                                    "template_aprobacion_mentor",
                                    {
                                        user_email: usuario.email,
                                        user_name: usuario.nombre || usuario.email,
                                        materia_nombre: selectedMateria?.nombre_materia || '',
                                        message: `¡Felicidades! Tu postulación para ser mentor fue aprobada.`,
                                        subject: "✅ Tu aplicación fue aprobada - Kerana"
                                    },
                                    "DMO310micvFWXx-j4"
                                );
                                console.log('✅ Email de aprobación enviado al usuario');
                            } catch (err) {
                                console.error('Error enviando email de aprobación:', err);
                            }
                        }
                    }
                )
                .subscribe();

            // Limpiar el canal al desmontar
            return () => {
                supabase.removeChannel(channel);
            };
        }, [selectedMateria]);
        return (
            <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
                <h1 style={{ marginBottom: 12 }}>Postulate como Mentor</h1>
                <p style={{ color: '#6b7280', marginBottom: 32 }}>
                    Compartí tu conocimiento ayudando a otros estudiantes en materias donde te fue bien.
                </p>

                {successMessage && (
                    <Card style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        color: '#166534',
                        padding: 20,
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <svg style={{ width: 24, height: 24, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>¡Postulación enviada!</div>
                            <div style={{ fontSize: 14 }}>{successMessage}</div>
                        </div>
                    </Card>
                )}

                {error && (
                    <Card style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        padding: 16,
                        marginBottom: 20
                    }}>
                        {error}
                    </Card>
                )}

                <Card style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 24, position: 'relative' }} ref={dropdownRef}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                Materia *
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedMateria(null);
                                }}
                                placeholder="Ej: Análisis Matemático"
                                style={{
                                    width: '100%',
                                    padding: 12,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14
                                }}
                                disabled={loading}
                            />
                            {showDropdown && filteredMaterias.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: '#fff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    marginTop: 4,
                                    maxHeight: 200,
                                    overflowY: 'auto',
                                    zIndex: 100,
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}>
                                    {filteredMaterias.map(materia => (
                                        <div
                                            key={materia.id_materia}
                                            onClick={() => handleMateriaSelect(materia)}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #f3f4f6'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                            onMouseLeave={(e) => e.target.style.background = '#fff'}
                                        >
                                            <div style={{ fontWeight: 500 }}>{materia.nombre_materia}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                Calificación obtenida * (mínimo 8)
                            </label>
                            <input
                                type="text"
                                value={formData.calificacion}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Limpiar error al escribir
                                      if (error) setError('');

                                    // Permitir solo dígitos
                                    if (/^\d*$/.test(val)) {
                                        setFormData({ ...formData, calificacion: val });
                                    }
                                }}
                                onBlur={() => {
                                    // Validar el rango cuando el input se va del rango
                                    const num = Number(formData.calificacion);
                                    if (formData.calificacion !== '' && (num < 8 || num > 12)) {
                                        setError('Por favor ingrese un valor entre 8 y 12');
                                        setFormData({ ...formData, calificacion: '' });
                                    }
                                }}
                                placeholder="Ej: 10"
                                style={{
                                    width: '100%',
                                    padding: 12,
                                    border: error && !formData.calificacion ? '2px solid #ef4444' : '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    outline: 'none'
                                }}
                                disabled={loading}
                            />

                            {/* Mensaje de error */}
                            {error && !formData.calificacion && (
                                <div style={{
                                    marginTop: 8,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                    color: '#dc2626'
                                }}>
                                    <svg
                                        style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2 }}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span style={{ fontSize: 14 }}>{error}</span>
                                </div>
                            )}

                            {/* Indicador de éxito */}
                            {formData.calificacion && Number(formData.calificacion) >= 8 && Number(formData.calificacion) <= 12 && (
                                <div style={{
                                    marginTop: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: '#16a34a'
                                }}>
                                    <svg
                                        style={{ width: 20, height: 20 }}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span style={{ fontSize: 14 }}>Valor válido: {formData.calificacion}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                Comprobante de escolaridad * (foto/imagen)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{
                                    width: '100%',
                                    padding: 12,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14
                                }}
                                disabled={loading}
                            />
                            {formData.comprobante && (
                                <div style={{
                                    marginTop: 8,
                                    fontSize: 14,
                                    color: '#059669',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}>
                                    ✓ {formData.comprobante.name}
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                Motivo (opcional)
                            </label>
                            <textarea
                                value={formData.motivo}
                                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                placeholder="Contanos por qué querés ser mentor de esta materia..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: 12,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: 14,
                                background: loading ? '#9ca3af' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: 16
                            }}
                        >
                            {uploading ? 'Subiendo archivo...' : loading ? 'Enviando...' : 'Enviar postulación'}
                        </Button>
                    </form>
                </Card>

                <Card style={{ marginTop: 20, padding: 20, background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Requisitos</h3>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#1e3a8a' }}>
                        <li>Calificación mínima de 8 en la materia</li>
                        <li>Subir comprobante de tu escolaridad (foto de bedelía)</li>
                        <li>Tu postulación será revisada por un administrador</li>
                    </ul>
                </Card>
            </div>
        );
    }