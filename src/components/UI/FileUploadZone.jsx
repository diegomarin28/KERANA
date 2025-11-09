import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faImage, faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export function FileUploadZone({
                                   file,
                                   onFileChange,
                                   accept = "image/*",
                                   maxSize = 5, // MB
                                   disabled = false,
                                   error = null
                               }) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const handleFileInput = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = (selectedFile) => {
        // Validar tipo
        if (accept && !selectedFile.type.match(accept.replace('*', '.*'))) {
            onFileChange(null, 'El archivo debe ser una imagen (JPG, PNG, etc.)');
            return;
        }

        // Validar tamaño
        if (selectedFile.size > maxSize * 1024 * 1024) {
            onFileChange(null, `El archivo no puede pesar más de ${maxSize}MB`);
            return;
        }

        // Crear preview si es imagen
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }

        onFileChange(selectedFile, null);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview(null);
        onFileChange(null, null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInput}
                style={{ display: 'none' }}
                disabled={disabled}
            />

            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: file ? '120px' : '200px',
                    border: error
                        ? '2px dashed #ef4444'
                        : isDragging
                            ? '2px dashed #2563eb'
                            : file
                                ? '2px solid #10b981'
                                : '2px dashed #e2e8f0',
                    borderRadius: '12px',
                    background: error
                        ? '#fef2f2'
                        : isDragging
                            ? '#eff6ff'
                            : file
                                ? '#f0fdf4'
                                : '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '24px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.6 : 1,
                    ':hover': {
                        borderColor: file ? '#10b981' : '#2563eb',
                        background: file ? '#f0fdf4' : '#f8fafc'
                    }
                }}
                onMouseEnter={(e) => {
                    if (!disabled && !error) {
                        e.currentTarget.style.borderColor = file ? '#10b981' : '#2563eb';
                        e.currentTarget.style.background = file ? '#f0fdf4' : '#f8fafc';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.borderColor = error
                            ? '#ef4444'
                            : file
                                ? '#10b981'
                                : '#e2e8f0';
                        e.currentTarget.style.background = error
                            ? '#fef2f2'
                            : file
                                ? '#f0fdf4'
                                : '#fafafa';
                    }
                }}
            >
                {file ? (
                    <>
                        {/* Preview con archivo subido */}
                        {preview && (
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '2px solid #10b981',
                                marginBottom: '8px'
                            }}>
                                <img
                                    src={preview}
                                    alt="Preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#059669',
                            fontSize: '14px',
                            fontWeight: 600
                        }}>
                            <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '18px' }} />
                            <span>{file.name}</span>
                        </div>

                        <div style={{
                            fontSize: '12px',
                            color: '#64748b',
                            fontWeight: 500
                        }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>

                        {!disabled && (
                            <button
                                onClick={handleRemove}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: '#fee2e2',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#dc2626',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#fecaca';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#fee2e2';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} style={{ fontSize: '14px' }} />
                            </button>
                        )}

                        {!disabled && (
                            <div style={{
                                fontSize: '13px',
                                color: '#64748b',
                                fontWeight: 500,
                                marginTop: '4px'
                            }}>
                                Click para cambiar archivo
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Estado vacío - esperando archivo */}
                        <FontAwesomeIcon
                            icon={faCloudUploadAlt}
                            style={{
                                fontSize: '48px',
                                color: error ? '#ef4444' : isDragging ? '#2563eb' : '#94a3b8',
                                transition: 'all 0.2s ease'
                            }}
                        />

                        <div style={{
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#0f172a'
                            }}>
                                {isDragging ? '¡Soltá el archivo acá!' : 'Arrastrá tu archivo o hacé click'}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: '#64748b',
                                fontWeight: 500
                            }}>
                                Formatos: JPG, PNG • Máximo {maxSize}MB
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '4px',
                            padding: '6px 12px',
                            background: '#fff',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#2563eb',
                            border: '1px solid #e2e8f0'
                        }}>
                            <FontAwesomeIcon icon={faImage} style={{ fontSize: '14px' }} />
                            <span>Seleccionar archivo</span>
                        </div>
                    </>
                )}
            </div>

            {/* Mensaje de error */}
            {error && (
                <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    color: '#dc2626',
                    fontSize: '14px',
                    fontWeight: 500,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <FontAwesomeIcon
                        icon={faTimes}
                        style={{
                            fontSize: '16px',
                            marginTop: '2px',
                            flexShrink: 0
                        }}
                    />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}