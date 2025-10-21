import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import FileDrop from "../components/FileDrop";
import { useNotificationSound } from '../hooks/useNotificationSound';
import * as pdfjsLib from "pdfjs-dist";

// Configurar worker
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

    // ... (todo el código anterior igual hasta handleSubmit) ...

    const sanitizeFilename = (filename) => {
        const lastDot = filename.lastIndexOf('.');
        const name = lastDot !== -1 ? filename.slice(0, lastDot) : filename;
        const ext = lastDot !== -1 ? filename.slice(lastDot) : '';

        const sanitized = name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');

        return sanitized + ext.toLowerCase();
    };

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

    const handleFileChange = (file) => {
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

            setFormData({ ...formData, file: sanitizedFile });
            setError('');
        }
    };

    // 🆕 Función para generar thumbnail del PDF
    const generateThumbnail = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 1 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            // Thumbnail de 300x400px
            const scale = Math.min(300 / viewport.width, 400 / viewport.height);
            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
            }).promise;

            // Convertir canvas a Blob (imagen)
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

        if (!formData.title.trim()) {
            setError('El título es obligatorio');
            return;
        }

        if (!selectedMateria) {
            setError('Debes seleccionar una materia');
            return;
        }

        if (!formData.file) {
            setError('Debes subir un archivo PDF');
            return;
        }

        if (!formData.agree) {
            setError('Debes confirmar que tenés derecho a compartir este apunte');
            return;
        }

        try {
            setLoading(true);
            setUploading(true);
            setUploadProgress('Verificando usuario...');

            // Verificar autenticación
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                setError('Debes iniciar sesión para subir apuntes');
                setLoading(false);
                setUploading(false);
                return;
            }

            // Obtener id_usuario
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

            const fileName = formData.file.name;
            const thumbnailFileName = `thumb_${fileName.replace('.pdf', '.jpg')}`;

            // 1️⃣ Generar thumbnail
            setUploadProgress('Generando vista previa...');
            const thumbnailBlob = await generateThumbnail(formData.file);

            // 2️⃣ Subir PDF
            setUploadProgress('Subiendo PDF...');
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('apuntes')
                .upload(fileName, formData.file, {
                    cacheControl: '31536000', // 1 año
                    upsert: false
                });

            if (uploadError) {
                console.error('Error subiendo archivo:', uploadError);
                throw new Error('Error al subir el archivo: ' + uploadError.message);
            }

            // 3️⃣ Subir thumbnail (si se generó)
            let thumbnailPath = null;
            if (thumbnailBlob) {
                setUploadProgress('Subiendo vista previa...');
                const { error: thumbError } = await supabase.storage
                    .from('thumbnails')
                    .upload(thumbnailFileName, thumbnailBlob, {
                        cacheControl: '31536000',
                        contentType: 'image/jpeg',
                        upsert: false
                    });

                if (!thumbError) {
                    thumbnailPath = thumbnailFileName;
                }
            }

            // 4️⃣ Guardar en la base de datos
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
                    thumbnail_path: thumbnailPath, // 🆕 Guardar path del thumbnail
                    mime_type: 'pdf',
                    file_size: formData.file.size,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) {
                console.error('Error insertando en BD:', insertError);
                // Si falla, limpiar archivos subidos
                await supabase.storage.from('apuntes').remove([fileName]);
                if (thumbnailPath) {
                    await supabase.storage.from('thumbnails').remove([thumbnailFileName]);
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
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
            {showSuccessModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <Card style={{
                        maxWidth: 450,
                        padding: 40,
                        textAlign: 'center',
                        background: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            fontSize: 40
                        }}>
                            📚
                        </div>
                        <h2 style={{
                            margin: '0 0 12px 0',
                            fontSize: 28,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            ¡Apunte publicado!
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            fontSize: 16,
                            lineHeight: 1.6,
                            marginBottom: 32
                        }}>
                            <strong style={{ color: '#374151' }}>KERANA</strong> y toda su comunidad te agradecen por compartir tu conocimiento. 🎓
                        </p>
                        <Button
                            onClick={() => navigate('/')}
                            style={{
                                padding: '14px 32px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 16,
                                width: '100%',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Volver al inicio
                        </Button>
                    </Card>
                </div>
            )}

            <h1 style={{ marginBottom: 12 }}>Subir apunte</h1>
            <p style={{ color: '#6b7280', marginBottom: 32 }}>
                Compartí tus apuntes con la comunidad. Completá los campos y subí el PDF.
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
                    {/* Título */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                            Título *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej: Resumen Parcial 1 - Base de Datos I"
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

                    {/* Materia con dropdown autocomplete */}
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
                            onFocus={() => {
                                if (searchTerm.trim()) {
                                    setShowDropdown(true);
                                }
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
                            autoComplete="off"
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
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: '#fff',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                marginTop: 4,
                                padding: 16,
                                zIndex: 100,
                                color: '#6b7280',
                                fontSize: 14,
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}>
                                No se encontraron materias con "{searchTerm}"
                            </div>
                        )}

                        {selectedMateria && (
                            <div style={{
                                marginTop: 8,
                                fontSize: 14,
                                color: '#059669',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                ✓ Materia seleccionada
                            </div>
                        )}
                    </div>

                    {/* Descripción */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                            Descripción
                        </label>
                        <textarea
                            value={formData.desc}
                            onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                            placeholder="Describí brevemente el contenido del apunte..."
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

                    {/* Archivo PDF */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                            Archivo PDF *
                        </label>
                        <FileDrop
                            file={formData.file}
                            onFileSelected={handleFileChange}
                        />
                    </div>

                    {/* Checkbox de confirmación */}
                    <div style={{ marginBottom: 32 }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'start',
                            gap: 8,
                            cursor: 'pointer',
                            fontSize: 14
                        }}>
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

                    {/* Progress indicator */}
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

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Button
                            type="submit"
                            disabled={!valid || loading}
                            style={{
                                flex: 1,
                                padding: 14,
                                background: (!valid || loading) ? '#9ca3af' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: (!valid || loading) ? 'not-allowed' : 'pointer',
                                fontSize: 16
                            }}
                        >
                            {uploading ? uploadProgress || 'Procesando...' : 'Publicar apunte'}
                        </Button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                            style={{
                                padding: '8px 14px',
                                background: '#fff',
                                color: '#374151',
                                border: '1px solid #2563eb',
                                borderRadius: 6,
                                fontWeight: 500,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: 14,
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2563eb';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.color = '#374151';
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </Card>

            {/* Card de consejos */}
            <Card style={{ marginTop: 20, padding: 20, background: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Consejos</h3>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#1e3a8a' }}>
                    <li>Usá un título descriptivo que facilite la búsqueda</li>
                    <li>Verificá que el PDF esté completo y legible</li>
                    <li>Máximo 20MB por archivo</li>
                </ul>
            </Card>
        </div>
    );
}