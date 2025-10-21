import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import FileDrop from "../components/FileDrop";
import { useNotificationSound } from '../hooks/useNotificationSound';
import * as pdfjsLib from "pdfjs-dist";

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).href;

export default function Upload() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [materias, setMaterias] = useState([]);
    const [filteredMaterias, setFilteredMaterias] = useState([]);
    const [selectedMateria, setSelectedMateria] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        desc: '',
        file: null,
        agree: false
    });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const dropdownRef = useRef(null);
    const { playSound } = useNotificationSound();

    // --- helpers ---

    const sanitizeFilename = (filename) => {
        const lastDot = filename.lastIndexOf('.');
        const name = lastDot !== -1 ? filename.slice(0, lastDot) : filename;
        const ext = lastDot !== -1 ? filename.slice(lastDot) : '';
        const sanitized = name
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
        return sanitized + ext.toLowerCase();
    };

    const normalizeText = (text) =>
        text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // --- efectos ---

    useEffect(() => { fetchMaterias(); }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchTerm.trim()) {
            const normalizedSearch = normalizeText(searchTerm);
            const filtered = (materias || []).filter(m =>
                normalizeText(m.nombre_materia).includes(normalizedSearch)
            );
            setFilteredMaterias(filtered);
            setShowDropdown(true);
        } else {
            setFilteredMaterias([]);
            setShowDropdown(false);
        }
    }, [searchTerm, materias]);

    // --- data ---

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

    const handleFileChange = (file) => {
        // Reset si viene null (limpiar)
        if (file === null) {
            setFormData({ ...formData, file: null });
            setError('');
            return;
        }

        if (file) {
            const fileName = file.name.toLowerCase();
            if (!fileName.endsWith('.pdf')) {
                setError('El archivo debe ser un PDF');
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                setError('El archivo no puede pesar más de 20MB');
                return;
            }

            const sanitizedName = sanitizeFilename(file.name);
            const sanitizedFile = new File([file], sanitizedName, {
                type: file.type,
                lastModified: file.lastModified
            });

            // Log útil para depurar nombres
            console.log('Archivo:', file.name, '→', sanitizedName);

            setFormData({ ...formData, file: sanitizedFile });
            setError('');
        }
    };

    // Generar thumbnail (primer página del PDF)
    const generateThumbnail = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            const baseViewport = page.getViewport({ scale: 1 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            // Encaixar en ~300x400
            const scale = Math.min(300 / baseViewport.width, 400 / baseViewport.height);
            const viewport = page.getViewport({ scale });

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;

            return new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
            });
        } catch (err) {
            console.error("Error generando thumbnail:", err);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) return setError('El título es obligatorio');
        if (!selectedMateria) return setError('Debes seleccionar una materia');
        if (!formData.file) return setError('Debes subir un archivo PDF');
        if (!formData.agree) return setError('Debes confirmar que tenés derecho a compartir este apunte');

        try {
            setLoading(true);
            setUploading(true);
            setUploadProgress('Verificando usuario...');

            // Auth
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                setError('Debes iniciar sesión para subir apuntes');
                setLoading(false);
                setUploading(false);
                return;
            }

            // usuario.id
            const { data: usuarioData, error: userError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (userError || !usuarioData) {
                setError('No se encontró tu perfil de usuario');
                setLoading(false);
                setUploading(false);
                return;
            }

            const fileName = formData.file.name; // ya saneado
            const thumbnailFileName = `thumb_${fileName.replace(/\.pdf$/i, '.jpg')}`;

            // 1) Generar thumbnail
            setUploadProgress('Generando vista previa...');
            const thumbnailBlob = await generateThumbnail(formData.file);

            // 2) Subir PDF al bucket 'apuntes'
            setUploadProgress('Subiendo PDF...');
            const { error: uploadError } = await supabase.storage
                .from('apuntes')
                .upload(fileName, formData.file, {
                    cacheControl: '31536000',
                    upsert: false
                });

            if (uploadError) {
                console.error('Error subiendo archivo:', uploadError);
                throw new Error('Error al subir el archivo: ' + uploadError.message);
            }

            // 3) Subir thumbnail al bucket 'thumbnail' (singular)
            let thumbnailPath = null;
            if (thumbnailBlob) {
                setUploadProgress('Subiendo vista previa...');
                const { error: thumbError } = await supabase.storage
                    .from('thumbnail')
                    .upload(thumbnailFileName, thumbnailBlob, {
                        cacheControl: '31536000',
                        contentType: 'image/jpeg',
                        upsert: false
                    });

                if (!thumbError) {
                    thumbnailPath = thumbnailFileName;
                } else {
                    console.warn('No se pudo subir el thumbnail, continúo sin él:', thumbError?.message);
                }
            }

            // 4) Insertar fila en 'apunte'
            setUploadProgress('Guardando información...');
            const { error: insertError } = await supabase
                .from('apunte')
                .insert([{
                    titulo: formData.title.trim(),
                    descripcion: formData.desc.trim() || null,
                    id_materia: selectedMateria.id_materia,
                    id_usuario: usuarioData.id_usuario,
                    file_path: fileName,
                    file_name: formData.file.name,
                    thumbnail_path: thumbnailPath,   // <— tu campo nuevo
                    mime_type: 'pdf',
                    file_size: formData.file.size,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) {
                console.error('Error insertando en BD:', insertError);
                // cleanup
                await supabase.storage.from('apuntes').remove([fileName]).catch(() => {});
                if (thumbnailPath) {
                    await supabase.storage.from('thumbnail').remove([thumbnailFileName]).catch(() => {});
                }
                throw new Error('Error al guardar en base de datos: ' + insertError.message);
            }

            playSound('apunte_publicado');
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Error al subir:', err);
            setError(err.message || 'Error al subir el apunte');
            playSound('error');
        } finally {
            setLoading(false);
            setUploading(false);
            setUploadProgress('');
        }
    };

    const valid = formData.title.trim() && selectedMateria && formData.file && formData.agree;

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
            {/* Modal de éxito */}
            {showSuccessModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <Card style={{
                        maxWidth: 450, padding: 40, textAlign: 'center', background: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            width: 80, height: 80,
                            background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 24px', fontSize: 40
                        }}>📚</div>
                        <h2 style={{
                            margin: '0 0 12px', fontSize: 28, fontWeight: 700,
                            background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>¡Apunte publicado!</h2>
                        <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 32 }}>
                            <strong style={{ color: '#374151' }}>KERANA</strong> y toda su comunidad te agradecen por compartir tu conocimiento 🎓
                        </p>
                        <Button onClick={() => navigate('/')} style={{
                            padding: '14px 32px', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
                            color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, width: '100%'
                        }}>
                            Volver al inicio
                        </Button>
                    </Card>
                </div>
            )}

            <h1 style={{ marginBottom: 12 }}>Subir apunte</h1>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
                Completá los campos y subí el PDF para compartir con la comunidad.
            </p>

            {/* Indicador de progreso (si corresponde) */}
            {uploadProgress && (
                <div style={{
                    marginBottom: 16,
                    padding: 12,
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 8,
                    color: '#1e40af',
                    fontSize: 14,
                    textAlign: 'center'
                }}>
                    {uploadProgress}
                </div>
            )}

            <div style={{ display: 'flex', gap: 20 }}>
                {/* Formulario */}
                <div style={{ width: 700 }}>
                    {error && (
                        <Card style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#dc2626', padding: 16, marginBottom: 20
                        }}>
                            {error}
                        </Card>
                    )}

                    <Card style={{ padding: 32 }}>
                        <form onSubmit={handleSubmit}>
                            {/* Título */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Título *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej: Resumen Parcial 1 - Base de Datos I"
                                    style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                                    disabled={loading}
                                />
                            </div>

                            {/* Materia con autocomplete */}
                            <div style={{ marginBottom: 24, position: 'relative' }} ref={dropdownRef}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Materia *</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setSelectedMateria(null); }}
                                    onFocus={() => searchTerm.trim() && setShowDropdown(true)}
                                    placeholder="Ej: Análisis Matemático"
                                    style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                                    disabled={loading}
                                    autoComplete="off"
                                />

                                {showDropdown && filteredMaterias.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                                        marginTop: 4, maxHeight: 200, overflowY: 'auto', zIndex: 100,
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                    }}>
                                        {filteredMaterias.map(materia => (
                                            <div
                                                key={materia.id_materia}
                                                onClick={() => handleMateriaSelect(materia)}
                                                style={{
                                                    padding: '12px 16px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                            >
                                                <div style={{ fontWeight: 500, fontSize: 14 }}>
                                                    {materia.nombre_materia}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showDropdown && searchTerm.trim() && filteredMaterias.length === 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                                        marginTop: 4, padding: 16, zIndex: 100, color: '#6b7280', fontSize: 14,
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                    }}>
                                        No se encontraron materias con "{searchTerm}"
                                    </div>
                                )}

                                {selectedMateria && (
                                    <div style={{
                                        marginTop: 8, fontSize: 14, color: '#059669',
                                        display: 'flex', alignItems: 'center', gap: 6
                                    }}>
                                        ✓ Materia seleccionada
                                    </div>
                                )}
                            </div>

                            {/* Descripción */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Descripción</label>
                                <textarea
                                    value={formData.desc}
                                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                                    placeholder="Describí brevemente el contenido del apunte..."
                                    rows={4}
                                    style={{
                                        width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8,
                                        fontSize: 14, resize: 'vertical', fontFamily: 'inherit'
                                    }}
                                    disabled={loading}
                                />
                            </div>

                            {/* Archivo PDF */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Archivo PDF *</label>
                                <FileDrop file={formData.file} onFileSelected={handleFileChange} />
                            </div>

                            {/* Checkbox */}
                            <div style={{ marginBottom: 32 }}>
                                <label style={{ display: 'flex', alignItems: 'start', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.agree}
                                        onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                                        disabled={loading}
                                        style={{ marginTop: 2 }}
                                    />
                                    <span><strong>Confirmo que tengo derecho a compartir este apunte.</strong></span>
                                </label>
                            </div>

                            {/* Botones */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button
                                    type="submit"
                                    disabled={!valid || loading}
                                    style={{
                                        flex: 1, padding: 14,
                                        background: (!valid || loading) ? '#9ca3af' : '#2563eb',
                                        color: '#fff', border: 'none', borderRadius: 8,
                                        fontWeight: 600, cursor: (!valid || loading) ? 'not-allowed' : 'pointer',
                                        fontSize: 16
                                    }}
                                >
                                    {uploading ? (uploadProgress || 'Procesando...') : 'Publicar apunte'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    disabled={loading}
                                    style={{
                                        padding: '8px 14px', background: '#fff', color: '#374151',
                                        border: '1px solid #2563eb', borderRadius: 6, fontWeight: 500
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Consejos */}
                <div style={{ width: 260 }}>
                    <Card style={{
                        padding: 20, background: '#f0f9ff',
                        border: '1px solid #bfdbfe', position: 'sticky', top: 20
                    }}>
                        <h3 style={{ margin: '0 0 12px', color: '#1e40af', fontSize: 16 }}>💡 Consejos</h3>
                        <ul style={{ margin: 0, paddingLeft: 20, color: '#1e3a8a', fontSize: 13, lineHeight: 1.6 }}>
                            <li>Usá un título descriptivo y claro</li>
                            <li>Verificá que el PDF esté completo y legible</li>
                            <li>Máximo 20MB por archivo</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}
