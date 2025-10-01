import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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
        const { data, error } = await supabase
            .from('materia')
            .select('id_materia, nombre_materia, semestre')
            .order('nombre_materia');

        if (error) {
            console.error('Error cargando materias:', error);
            return;
        }
        setMaterias(data || []);
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
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('mentor-comprobantes')
            .upload(filePath, file);

        if (error) throw error;
        return filePath;
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

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (!usuarioData) {
                setError('No se encontró tu perfil de usuario');
                return;
            }

            const comprobanteUrl = await uploadComprobante(formData.comprobante);

            const { error: insertError } = await supabase
                .from('mentor_aplicacion')
                .insert([{
                    id_usuario: usuarioData.id_usuario,
                    id_materia: selectedMateria.id_materia,
                    motivo: formData.motivo.trim() || null,
                    calificacion_materia: parseFloat(formData.calificacion),
                    comprobante_archivo: comprobanteUrl,
                    estado: 'pendiente'
                }]);

            if (insertError) throw insertError;

            alert('¡Postulación enviada con éxito! Te notificaremos cuando sea revisada.');
            navigate('/');

        } catch (err) {
            console.error('Error al postular:', err);
            setError(err.message || 'Error al enviar la postulación');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
            <h1 style={{ marginBottom: 12 }}>Postulate como Mentor</h1>
            <p style={{ color: '#6b7280', marginBottom: 32 }}>
                Compartí tu conocimiento ayudando a otros estudiantes en materias donde te fue bien.
            </p>

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
                            type="number"
                            min="8"
                            max="12"
                            step="0.1"
                            value={formData.calificacion}
                            onChange={(e) => setFormData({ ...formData, calificacion: e.target.value })}
                            placeholder="Ej: 10"
                            style={{
                                width: '100%',
                                padding: 12,
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14
                            }}
                            disabled={loading}
                        />
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