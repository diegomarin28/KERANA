import { useNavigate } from "react-router-dom";
import { Card } from "./ui/Card";
import { useState, useRef, useEffect } from "react";

export function FolderCard({ folder, semestres, onDragStart, onDragOver, onDrop, isDragging, onDelete, onRename }) {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [newName, setNewName] = useState(folder.nombre);
    const menuRef = useRef(null);

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleClick = (e) => {
        e.preventDefault();
        if (!showMenu) {
            navigate(`/purchased/folder/${folder.id_carpeta}`);
        }
    };

    const handleDragStart = (e) => {
        if (onDragStart) {
            e.stopPropagation();
            onDragStart(e, folder, 'folder');
        }
    };

    const handleDragOver = (e) => {
        if (onDragOver) {
            e.preventDefault();
            e.stopPropagation();
            onDragOver(e, folder);
        }
    };

    const handleDrop = (e) => {
        if (onDrop) {
            e.preventDefault();
            e.stopPropagation();
            onDrop(e, folder);
        }
    };

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleRenameClick = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        setShowRenameModal(true);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        setShowDeleteConfirm(true);
    };

    const confirmRename = async (e) => {
        e.stopPropagation();
        if (onRename && newName.trim() && newName !== folder.nombre) {
            await onRename(folder.id_carpeta, newName.trim());
        }
        setShowRenameModal(false);
    };

    const confirmDelete = async (e) => {
        e.stopPropagation();
        if (onDelete) {
            await onDelete(folder.id_carpeta);
        }
        setShowDeleteConfirm(false);
    };

    const cancelAction = (e) => {
        e.stopPropagation();
        setShowRenameModal(false);
        setShowDeleteConfirm(false);
        setNewName(folder.nombre);
    };

    const iconColor = {
        'semestre': '#2563eb',
        'materia': '#059669',
        'personalizada': '#6b7280'
    }[folder.tipo] || '#6b7280';

    const bgColor = {
        'semestre': '#dbeafe',
        'materia': '#d1fae5',
        'personalizada': '#f3f4f6'
    }[folder.tipo] || '#f3f4f6';

    return (
        <>
            <Card
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                    overflow: 'visible',
                    opacity: isDragging ? 0.5 : 1,
                    border: '2px dashed transparent',
                    position: 'relative'
                }}
                onClick={handleClick}
                onMouseEnter={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {/* Botón menú (3 puntos) */}
                <div ref={menuRef} style={{ position: 'relative' }}>
                    <button
                        onClick={handleMenuClick}
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#374151',
                            fontSize: 18,
                            fontWeight: 'bold',
                            zIndex: 10,
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        }}
                    >
                        ⋮
                    </button>

                    {/* Menú desplegable */}
                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            top: 45,
                            right: 8,
                            background: 'white',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 20,
                            minWidth: 160,
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={handleRenameClick}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: 'none',
                                    background: 'white',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    color: '#374151',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                ✏️ Editar nombre
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: 'none',
                                    background: 'white',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    color: '#dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                🗑️ Eliminar
                            </button>
                        </div>
                    )}
                </div>

                <div style={{
                    height: 160,
                    background: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={iconColor}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>

                    {folder.item_count > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            background: 'white',
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            color: iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            {folder.item_count}
                        </div>
                    )}
                </div>

                <div style={{ padding: 16 }}>
                    <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: 16,
                        fontWeight: 600
                    }}>
                        {folder.nombre}
                    </h3>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8
                    }}>
                        <span style={{
                            padding: '2px 8px',
                            background: bgColor,
                            color: iconColor,
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500,
                            textTransform: 'capitalize'
                        }}>
                            {/* ✅ Mostrar semestres si existen */}
                            {semestres && semestres.length > 0
                                ? `Semestre ${semestres.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}`
                                : folder.tipo
                            }
                        </span>
                    </div>

                    <div style={{
                        paddingTop: 12,
                        borderTop: '1px solid #e5e7eb',
                        fontSize: 13,
                        color: '#6b7280'
                    }}>
                        {folder.item_count === 0 ? 'Carpeta vacía' :
                            folder.item_count === 1 ? '1 elemento' :
                                `${folder.item_count} elementos`}
                    </div>
                </div>
            </Card>

            {/* Modal editar nombre */}
            {showRenameModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 16
                    }}
                    onClick={cancelAction}
                >
                    <Card
                        style={{
                            maxWidth: 400,
                            width: '100%',
                            padding: 24
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>
                            Editar nombre
                        </h3>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') confirmRename(e);
                            }}
                            style={{
                                width: 'calc(100% - 24px)',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14,
                                marginBottom: 20,
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={cancelAction}
                                style={{
                                    padding: '8px 16px',
                                    background: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 14
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRename}
                                disabled={!newName.trim() || newName === folder.nombre}
                                style={{
                                    padding: '8px 16px',
                                    background: !newName.trim() || newName === folder.nombre ? '#d1d5db' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: !newName.trim() || newName === folder.nombre ? 'not-allowed' : 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500
                                }}
                            >
                                Guardar
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal confirmar eliminación */}
            {showDeleteConfirm && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 16
                    }}
                    onClick={cancelAction}
                >
                    <Card
                        style={{
                            maxWidth: 400,
                            width: '100%',
                            padding: 24
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>
                            ¿Eliminar "{folder.nombre}"?
                        </h3>
                        <p style={{ color: '#6b7280', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                            Esta acción eliminará la carpeta y todas sus subcarpetas. Los apuntes NO se eliminarán.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={cancelAction}
                                style={{
                                    padding: '8px 16px',
                                    background: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 14
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '8px 16px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}