import { useState } from "react";

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
                    border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
                    borderRadius: 12,
                    padding: 40,
                    textAlign: 'center',
                    background: dragOver ? '#f0f9ff' : '#fafafa',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative'
                }}
            >
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                    📄
                </div>
                <p style={{
                    color: dragOver ? '#2563eb' : '#6b7280',
                    margin: '0 0 8px 0',
                    fontWeight: 600,
                    fontSize: 15
                }}>
                    {dragOver ? '¡Soltá el archivo aquí!' : 'Arrastrá un archivo PDF o hacé clic para seleccionar'}
                </p>
                <p style={{
                    color: '#9ca3af',
                    margin: 0,
                    fontSize: 13
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
                    marginTop: 16,
                    padding: 16,
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <div style={{ fontSize: 32 }}>✅</div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontWeight: 600,
                            color: '#166534',
                            fontSize: 14,
                            marginBottom: 4
                        }}>
                            {file.name}
                        </div>
                        <div style={{
                            color: '#16a34a',
                            fontSize: 12
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
                            background: '#fecaca',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fecaca';
                            e.currentTarget.style.color = '#dc2626';
                        }}
                    >
                        Quitar
                    </button>
                </div>
            )}
        </div>
    );
}