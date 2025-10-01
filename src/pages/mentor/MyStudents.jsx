// pages/mentor/MyStudents.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function MyStudents() {
    const [activeTab, setActiveTab] = useState('alumnos'); // alumnos, recursos
    const [alumnos, setAlumnos] = useState([]);
    const [recursos, setRecursos] = useState([]);
    const [misMaterias, setMisMaterias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [newRecurso, setNewRecurso] = useState({
        id_materia: '',
        titulo: '',
        descripcion: '',
        archivo: null,
        tipo: 'pdf',
        publico: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
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
                setError('No se encontró tu perfil');
                return;
            }

            // Obtener materias donde soy mentor
            const { data: materias } = await supabase
                .from('mentor_materia')
                .select(`
                    id_materia,
                    materia(id_materia, nombre_materia, semestre)
                `)
                .eq('id_mentor', usuarioData.id_usuario);

            setMisMaterias(materias || []);

            // Obtener alumnos (estudiantes con sesiones)
            const { data: sesiones } = await supabase
                .from('mentor_sesion')
                .select(`
                    id_alumno,
                    id_materia,
                    estado,
                    alumno:usuario!mentor_sesion_id_alumno_fkey(nombre, correo),
                    materia(nombre_materia)
                `)
                .eq('id_mentor', usuarioData.id_usuario)
                .in('estado', ['confirmada', 'completada']);

            // Agrupar por alumno
            const alumnosMap = {};
            (sesiones || []).forEach(s => {
                if (!alumnosMap[s.id_alumno]) {
                    alumnosMap[s.id_alumno] = {
                        id_alumno: s.id_alumno,
                        nombre: s.alumno.nombre,
                        correo: s.alumno.correo,
                        materias: []
                    };
                }
                if (!alumnosMap[s.id_alumno].materias.find(m => m.id_materia === s.id_materia)) {
                    alumnosMap[s.id_alumno].materias.push({
                        id_materia: s.id_materia,
                        nombre_materia: s.materia.nombre_materia
                    });
                }
            });
            setAlumnos(Object.values(alumnosMap));

            // Obtener recursos
            const { data: recursosData } = await supabase
                .from('mentor_recurso')
                .select(`
                    *,
                    materia(nombre_materia)
                `)
                .eq('id_mentor', usuarioData.id_usuario)
                .order('created_at', { ascending: false });

            setRecursos(recursosData || []);

        } catch (err) {
            console.error('Error cargando datos:', err);
            setError('Error al cargar información');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadRecurso = async () => {
        if (!newRecurso.titulo || !newRecurso.id_materia || !newRecurso.archivo) {
            setError('Completa todos los campos obligatorios');
            return;
        }

        try {
            setUploadingFile(true);
            setError('');

            const { data: { user } } = await supabase.auth.getUser();
            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            // Subir archivo
            const fileExt = newRecurso.archivo.name.split('.').pop();
            const fileName = `${usuarioData.id_usuario}_${Date.now()}.${fileExt}`;
            const filePath = `recursos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('mentor-recursos')
                .upload(filePath, newRecurso.archivo);

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('mentor-recursos')
                .getPublicUrl(filePath);

            // Insertar en BD
            const { error: insertError } = await supabase
                .from('mentor_recurso')
                .insert([{
                    id_mentor: usuarioData.id_usuario,
                    id_materia: parseInt(newRecurso.id_materia),
                    titulo: newRecurso.titulo,
                    descripcion: newRecurso.descripcion,
                    archivo_url: publicUrl,
                    tipo: newRecurso.tipo,
                    publico: newRecurso.publico
                }]);

            if (insertError) throw insertError;

            setSuccess('Recurso subido exitosamente');
            setShowResourceModal(false);
            setNewRecurso({
                id_materia: '',
                titulo: '',
                descripcion: '',
                archivo: null,
                tipo: 'pdf',
                publico: false
            });
            fetchData();

        } catch (err) {
            console.error('Error subiendo recurso:', err);
            setError('Error al subir recurso: ' + err.message);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleDeleteRecurso = async (recursoId) => {
        if (!confirm('¿Eliminar este recurso?')) return;

        try {
            const { error } = await supabase
                .from('mentor_recurso')
                .delete()
                .eq('id_recurso', recursoId);

            if (error) throw error;

            setSuccess('Recurso eliminado');
            fetchData();
        } catch (err) {
            setError('Error al eliminar recurso');
        }
    };

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, textAlign: 'center' }}>
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ margin: '0 0 8px 0' }}>Mis Estudiantes</h1>
                <p style={{ color: '#6b7280', margin: 0 }}>
                    Gestiona tus alumnos y recursos educativos
                </p>
            </div>

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

            {success && (
                <Card style={{
                    background: '#d1fae5',
                    border: '1px solid #6ee7b7',
                    color: '#065f46',
                    padding: 16,
                    marginBottom: 20
                }}>
                    {success}
                </Card>
            )}

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 24,
                borderBottom: '2px solid #e5e7eb'
            }}>
                <button
                    onClick={() => setActiveTab('alumnos')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'alumnos' ? '2px solid #2563eb' : 'none',
                        color: activeTab === 'alumnos' ? '#2563eb' : '#6b7280',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: -2
                    }}
                >
                    Alumnos ({alumnos.length})
                </button>
                <button
                    onClick={() => setActiveTab('recursos')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'recursos' ? '2px solid #2563eb' : 'none',
                        color: activeTab === 'recursos' ? '#2563eb' : '#6b7280',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: -2
                    }}
                >
                    Recursos ({recursos.length})
                </button>
            </div>

            {/* Contenido Alumnos */}
            {activeTab === 'alumnos' && (
                <div>
                    {alumnos.length === 0 ? (
                        <Card style={{ padding: 40, textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                            <h3 style={{ margin: '0 0 12px 0' }}>No tenés alumnos todavía</h3>
                            <p style={{ color: '#6b7280', margin: 0 }}>
                                Cuando confirmes sesiones, los alumnos aparecerán aquí
                            </p>
                        </Card>
                    ) : (
                        <div style={{ display: 'grid', gap: 16 }}>
                            {alumnos.map(alumno => (
                                <Card key={alumno.id_alumno} style={{ padding: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 4px 0' }}>{alumno.nombre}</h3>
                                            <p style={{ color: '#6b7280', margin: '0 0 12px 0', fontSize: 14 }}>
                                                {alumno.correo}
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {alumno.materias.map(m => (
                                                    <span
                                                        key={m.id_materia}
                                                        style={{
                                                            padding: '4px 12px',
                                                            background: '#dbeafe',
                                                            color: '#1e40af',
                                                            borderRadius: 16,
                                                            fontSize: 13,
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {m.nombre_materia}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Contenido Recursos */}
            {activeTab === 'recursos' && (
                <div>
                    <div style={{ marginBottom: 20 }}>
                        <Button
                            onClick={() => setShowResourceModal(true)}
                            style={{
                                padding: '12px 24px',
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            + Subir Recurso
                        </Button>
                    </div>

                    {recursos.length === 0 ? (
                        <Card style={{ padding: 40, textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                            <h3 style={{ margin: '0 0 12px 0' }}>No tenés recursos subidos</h3>
                            <p style={{ color: '#6b7280', margin: 0 }}>
                                Sube materiales para compartir con tus alumnos
                            </p>
                        </Card>
                    ) : (
                        <div style={{ display: 'grid', gap: 16 }}>
                            {recursos.map(recurso => (
                                <Card key={recurso.id_recurso} style={{ padding: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                                <h3 style={{ margin: 0 }}>{recurso.titulo}</h3>
                                                {recurso.publico && (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        background: '#dcfce7',
                                                        color: '#166534',
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        fontWeight: 600
                                                    }}>
                                                        PÚBLICO
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: 14 }}>
                                                {recurso.materia.nombre_materia}
                                            </p>
                                            {recurso.descripcion && (
                                                <p style={{ color: '#4b5563', margin: '0 0 12px 0', fontSize: 14 }}>
                                                    {recurso.descripcion}
                                                </p>
                                            )}

                                            href={recurso.archivo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#2563eb', fontSize: 14, textDecoration: 'none' }}
                                            >
                                            Ver archivo →
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleDeleteRecurso(recurso.id_recurso)}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#dc2626',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Eliminar
                                    </Button>

                                </Card>
                                ))}
                        </div>
                    )}
                </div>
            )}

{/* Modal Subir Recurso */}
{showResourceModal && (
    <>
        <div
            onClick={() => setShowResourceModal(false)}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000
            }}
        />
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            width: 'min(90vw, 600px)',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1001,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
            <h2 style={{ margin: '0 0 24px 0' }}>Subir Recurso</h2>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Materia *
                </label>
                <select
                    value={newRecurso.id_materia}
                    onChange={(e) => setNewRecurso({ ...newRecurso, id_materia: e.target.value })}
                    style={{
                        width: '100%',
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14
                    }}
                >
                    <option value="">Selecciona una materia</option>
                    {misMaterias.map(m => (
                        <option key={m.id_materia} value={m.id_materia}>
                            {m.materia.nombre_materia}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Título *
                </label>
                <input
                    type="text"
                    value={newRecurso.titulo}
                    onChange={(e) => setNewRecurso({ ...newRecurso, titulo: e.target.value })}
                    placeholder="Ej: Guía de ejercicios Unidad 1"
                    style={{
                        width: '100%',
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14
                    }}
                />
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Descripción
                </label>
                <textarea
                    value={newRecurso.descripcion}
                    onChange={(e) => setNewRecurso({ ...newRecurso, descripcion: e.target.value })}
                    placeholder="Describe el contenido..."
                    rows={3}
                    style={{
                        width: '100%',
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        fontFamily: 'inherit',
                        resize: 'vertical'
                    }}
                />
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Archivo *
                </label>
                <input
                    type="file"
                    onChange={(e) => setNewRecurso({ ...newRecurso, archivo: e.target.files[0] })}
                    style={{
                        width: '100%',
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14
                    }}
                />
            </div>

            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={newRecurso.publico}
                        onChange={(e) => setNewRecurso({ ...newRecurso, publico: e.target.checked })}
                    />
                    <span style={{ fontSize: 14 }}>
                                    Hacer público (visible para todos, no solo mis alumnos)
                                </span>
                </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    type="button"
                    onClick={() => setShowResourceModal(false)}
                    style={{
                        flex: 1,
                        padding: 12,
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleUploadRecurso}
                    disabled={uploadingFile}
                    style={{
                        flex: 1,
                        padding: 12,
                        background: uploadingFile ? '#9ca3af' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: uploadingFile ? 'not-allowed' : 'pointer'
                    }}
                >
                    {uploadingFile ? 'Subiendo...' : 'Subir'}
                </button>
            </div>
        </div>
    </>
)}
</div>
);
}