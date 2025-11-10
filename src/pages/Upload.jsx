import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabase';
import { creditsAPI } from '../api/database';
import { Card } from '../components/UI/Card';
import FileDrop from "../components/FileDrop";
import { Button } from '../components/UI/Button';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCloudUploadAlt, faFileAlt, faLightbulb, faCheck } from '@fortawesome/free-solid-svg-icons';
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

            // 1) Contar páginas del PDF PRIMERO (validación)
            setUploadProgress('Verificando PDF...');
            let numPaginas = 0;
            try {
                const arrayBuffer = await formData.file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                numPaginas = pdf.numPages;
                console.log(`📄 PDF tiene ${numPaginas} páginas`);
            } catch (pdfError) {
                console.error('Error al leer el PDF:', pdfError);
                setError('No se pudo leer el archivo PDF. Asegurate de que sea un PDF válido.');
                setLoading(false);
                setUploading(false);
                return;
            }

            // ⚠️ VALIDACIÓN: Mínimo 3 páginas
            if (numPaginas < 3) {
                setError(`El apunte debe tener al menos 3 páginas. Tu PDF tiene ${numPaginas} página${numPaginas === 1 ? '' : 's'}.`);
                setLoading(false);
                setUploading(false);
                return;
            }

            // 2) Generar thumbnail
            setUploadProgress('Generando vista previa...');
            const thumbnailBlob = await generateThumbnail(formData.file);

            // 3) Subir PDF al bucket 'apuntes'
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
                    .from('thumbnails')
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
            const { data: apunteData, error: insertError } = await supabase
                .from('apunte')
                .insert([{
                    titulo: formData.title.trim(),
                    descripcion: formData.desc.trim() || null,
                    id_materia: selectedMateria.id_materia,
                    id_usuario: usuarioData.id_usuario,
                    file_path: fileName,
                    file_name: formData.file.name,
                    thumbnail_path: thumbnailPath,
                    mime_type: 'pdf',
                    file_size: formData.file.size,
                    num_paginas: numPaginas,
                    creditos: numPaginas * 10,  // Precio automático: 10 créditos por página
                    created_at: new Date().toISOString()
                }])
                .select();

            if (insertError) {
                console.error('Error insertando en BD:', insertError);
                // cleanup
                await supabase.storage.from('apuntes').remove([fileName]).catch(() => {});
                if (thumbnailPath) {
                    await supabase.storage.from('thumbnails').remove([thumbnailFileName]).catch(() => {});
                }
                throw new Error('Error al guardar en base de datos: ' + insertError.message);
            }

            // 5) 💰 Otorgar créditos por subir apunte (ya validamos 3+ páginas)
            if (apunteData && apunteData[0]) {
                setUploadProgress('Calculando créditos...');
                const { data: creditosResult, error: creditosError } = await creditsAPI.grantNoteUploadCredits(
                    apunteData[0].id_apunte,
                    numPaginas,
                    selectedMateria.id_materia
                );

                if (!creditosError && creditosResult) {
                    console.log(`💰 Créditos otorgados: ${creditosResult.creditosOtorgados}`);
                    if (creditosResult.bonoPrimerApunte > 0) {
                        console.log(`🎁 ¡Bono de primer apunte! +${creditosResult.bonoPrimerApunte} créditos`);
                    }

                    // 6) 🎯 Verificar y otorgar bonos por hitos
                    setUploadProgress('Verificando hitos...');
                    const { data: hitosResult, error: hitosError } = await creditsAPI.checkAndGrantMilestoneBonus();

                    if (!hitosError && hitosResult?.bonosOtorgados?.length > 0) {
                        hitosResult.bonosOtorgados.forEach(bono => {
                            console.log(`🏆 ¡Hito alcanzado! ${bono.hito} apuntes = +${bono.creditos} créditos`);
                        });
                    }
                } else {
                    console.warn('No se pudieron otorgar créditos:', creditosError);
                }
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
        <div id="upload-form" style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
            {/* Modal de éxito */}
            {showSuccessModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <Card style={{
                        maxWidth: 480,
                        padding: 48,
                        textAlign: 'center',
                        background: '#fff',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        borderRadius: 16
                    }}>
                        {/* Ícono de éxito */}
                        <div style={{
                            width: 96,
                            height: 96,
                            background: '#2563eb',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
                        }}>
                            <FontAwesomeIcon
                                icon={faCheckCircle}
                                style={{
                                    fontSize: 48,
                                    color: '#fff'
                                }}
                            />
                        </div>

                        {/* Título */}
                        <h2 style={{
                            margin: '0 0 12px',
                            fontSize: 32,
                            fontWeight: 700,
                            color: '#0f172a',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            ¡Apunte publicado!
                        </h2>

                        {/* Mensaje */}
                        <p style={{
                            color: '#64748b',
                            fontSize: 16,
                            marginBottom: 32,
                            lineHeight: 1.6
                        }}>
                            <strong style={{ color: '#2563eb' }}>Kerana</strong> y toda su comunidad te agradecen por compartir tu conocimiento.
                        </p>

                        {/* Botón */}
                        <Button
                            onClick={() => navigate("/")}
                            style={{
                                padding: '14px 32px',
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                fontWeight: 600,
                                fontSize: 15,
                                width: '100%',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1e40af';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#2563eb';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            Volver al inicio
                        </Button>
                    </Card>
                </div>
            )}

            {/* Estilos específicos para este componente */}
            <style>{`
                #upload-form * {
                    box-sizing: border-box;
                }
            `}</style>

            {/* Header mejorado */}
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
                        icon={faCloudUploadAlt}
                        style={{ fontSize: '32px', color: '#fff' }}
                    />
                </div>
                <h1 style={{
                    margin: '0 0 8px 0',
                    fontSize: 'clamp(28px, 5vw, 36px)',
                    fontWeight: 800,
                    color: '#0f172a'
                }}>
                    Subir Apunte
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
                    Completá los campos y subí el PDF para compartir con la comunidad
                </p>
            </div>

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
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '10px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    fontFamily: 'Inter, -apple-system, sans-serif'
                                }}>
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej: Resumen Parcial 1 - Base de Datos I"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: '#0f172a',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, -apple-system, sans-serif',
                                        background: '#fff'
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

                            {/* Materia con autocomplete */}
                            <div style={{ marginBottom: '28px', position: 'relative' }} ref={dropdownRef}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '10px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    fontFamily: 'Inter, -apple-system, sans-serif'
                                }}>
                                    Materia *
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setSelectedMateria(null); }}
                                    onFocus={(e) => {
                                        if (searchTerm.trim()) setShowDropdown(true);
                                        e.currentTarget.style.borderColor = '#2563eb';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    placeholder="Ej: Análisis Matemático"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: '#0f172a',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, -apple-system, sans-serif',
                                        background: '#fff'
                                    }}
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
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '10px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    fontFamily: 'Inter, -apple-system, sans-serif'
                                }}>
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.desc}
                                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                                    placeholder="Describí brevemente el contenido del apunte..."
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
                                        lineHeight: 1.6,
                                        background: '#fff'
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

                            {/* Archivo PDF */}
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '10px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    fontFamily: 'Inter, -apple-system, sans-serif'
                                }}>
                                    Archivo PDF *
                                </label>
                                <FileDrop file={formData.file} onFileSelected={handleFileChange} />
                            </div>

                            {/* Checkbox */}
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#0f172a',
                                    fontFamily: 'Inter, -apple-system, sans-serif'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.agree}
                                        onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                                        disabled={loading}
                                        style={{ marginTop: '2px' }}
                                    />
                                    <span><strong>Confirmo que tengo derecho a compartir este apunte.</strong></span>
                                </label>
                            </div>

                            {/* Botones */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="submit"
                                    disabled={!valid || loading}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        background: (!valid || loading) ? '#94a3b8' : '#2563eb',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 700,
                                        fontSize: '15px',
                                        cursor: (!valid || loading) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, -apple-system, sans-serif'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (valid && !loading) {
                                            e.currentTarget.style.background = '#1e40af';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (valid && !loading) {
                                            e.currentTarget.style.background = '#2563eb';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    {uploading ? (uploadProgress || 'Procesando...') : 'Publicar apunte'}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Resetear TODO el formulario
                                        setFormData({
                                            title: '',
                                            desc: '',
                                            file: null,
                                            agree: false
                                        });
                                        setSelectedMateria(null);
                                        setSearchTerm('');
                                        setError('');
                                    }}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '14px 24px',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '15px',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, -apple-system, sans-serif'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#ef4444';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#fee2e2';
                                        e.currentTarget.style.color = '#dc2626';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Consejos - Sutil con Font Awesome */}
                <div style={{ width: 260 }}>
                    <Card style={{
                        padding: '24px',
                        background: '#f0f9ff',
                        border: '2px solid #bfdbfe',
                        position: 'sticky',
                        top: 80
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '16px'
                        }}>
                            <FontAwesomeIcon
                                icon={faLightbulb}
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
                                Consejos
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