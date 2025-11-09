import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function FileDrop({ file, onFileSelected }) {
    const [dragOver, setDragOver] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && onFileSelected) {
            onFileSelected(droppedFile);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleFileInput = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && onFileSelected) {
            onFileSelected(selectedFile);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
                style={{
                    border: dragOver ? '2px dashed #2563eb' : '2px dashed #e2e8f0',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    background: dragOver ? '#eff6ff' : '#fafafa',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative'
                }}
                onMouseEnter={(e) => {
                    if (!dragOver && !file) {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.background = '#f8fafc';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!dragOver && !file) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = '#fafafa';
                    }
                }}
            >
                <FontAwesomeIcon
                    icon={faCloudUploadAlt}
                    style={{
                        fontSize: '48px',
                        color: dragOver ? '#2563eb' : '#94a3b8',
                        marginBottom: '12px',
                        transition: 'color 0.2s ease'
                    }}
                />
                <p style={{
                    color: dragOver ? '#2563eb' : '#64748b',
                    margin: '0 0 8px 0',
                    fontWeight: 600,
                    fontSize: '15px',
                    fontFamily: 'Inter, -apple-system, sans-serif'
                }}>
                    {dragOver ? '¡Soltá el archivo acá!' : 'Arrastrá un archivo PDF o hacé clic para seleccionar'}
                </p>
                <p style={{
                    color: '#94a3b8',
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'Inter, -apple-system, sans-serif'
                }}>
                    Máximo 20MB
                </p>

                <input
                    id="file-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                />
            </div>

            {/* Mostrar archivo seleccionado */}
            {file && (
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f0fdf4',
                    border: '2px solid #86efac',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <FontAwesomeIcon
                        icon={faCheckCircle}
                        style={{
                            fontSize: '28px',
                            color: '#16a34a',
                            flexShrink: 0
                        }}
                    />
                    <div style={{
                        flex: 1,
                        minWidth: 0
                    }}>
                        <div style={{
                            fontWeight: 600,
                            color: '#166534',
                            fontSize: '14px',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Inter, -apple-system, sans-serif'
                        }}>
                            {file.name}
                        </div>
                        <div style={{
                            color: '#16a34a',
                            fontSize: '12px',
                            fontWeight: 500,
                            fontFamily: 'Inter, -apple-system, sans-serif'
                        }}>
                            {formatFileSize(file.size)}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFileSelected(null);
                        }}
                        style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.color = '#dc2626';
                        }}
                    >
                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: '12px' }} />
                        Quitar
                    </button>
                </div>
            )}
        </div>
    );
}