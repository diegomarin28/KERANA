import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { foldersAPI } from "../api/database";
import { supabase } from "../supabase";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import ApunteCard from "../components/ApunteCard";
import { FolderCard } from "../components/FolderCard";
import { getOrCreateUserProfile } from "../api/userService";


export default function FolderView() {
    const {id} = useParams();
    const navigate = useNavigate();

    const [folder, setFolder] = useState(null);
    const [subfolders, setSubfolders] = useState([]);
    const [notes, setNotes] = useState([]);
    const [breadcrumb, setBreadcrumb] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverFolder, setDragOverFolder] = useState(null);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showAddNotesModal, setShowAddNotesModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [availableNotes, setAvailableNotes] = useState([]);

    useEffect(() => {
        loadFolderContent();
    }, [id]);

    const handleCreateSubfolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await foldersAPI.createFolder(
                newFolderName.trim(),
                'personalizada',
                parseInt(id), // parent_id es la carpeta actual
                0
            );

            setShowCreateFolderModal(false);
            setNewFolderName("");
            loadFolderContent();

        } catch (err) {
            console.error('Error creando subcarpeta:', err);
            setErrorMsg("Error al crear subcarpeta");
        }
    };

    const loadAvailableNotes = async () => {
        try {
            const profile = await getOrCreateUserProfile();
            if (!profile?.id_usuario) return;

            // Obtener todas las compras
            const { data: compras } = await supabase
                .from("compra_apunte")
                .select(`
                id,
                apunte_id,
                apunte:apunte(
                    id_apunte,
                    titulo,
                    materia:id_materia(nombre_materia)
                )
            `)
                .eq("comprador_id", profile.id_usuario);

            // Obtener apuntes que YA están en esta carpeta
            const { data: notesInFolder } = await foldersAPI.getNotesInFolder(parseInt(id));
            const idsEnCarpeta = new Set(notesInFolder?.map(n => n.compra_id) || []);

            // Filtrar los que NO están en la carpeta
            const available = (compras || [])
                .filter(c => !idsEnCarpeta.has(c.id))
                .map(c => ({
                    id: c.id,
                    titulo: c.apunte?.titulo || 'Apunte',
                    materia: c.apunte?.materia
                }));

            setAvailableNotes(available);

        } catch (err) {
            console.error('Error cargando apuntes disponibles:', err);
        }
    };



    const toggleNoteSelection = (compraId) => {
        setSelectedNotes(prev =>
            prev.includes(compraId)
                ? prev.filter(id => id !== compraId)
                : [...prev, compraId]
        );
    };

    const handleDeleteFolder = async (carpetaId) => {
        try {
            setErrorMsg("");
            const { error } = await foldersAPI.deleteFolder(carpetaId);
            if (error) throw error;
            loadFolderContent();
        } catch (err) {
            console.error('Error eliminando carpeta:', err);
            setErrorMsg("Error al eliminar carpeta");
        }
    };

    const handleAddNotes = async () => {
        if (selectedNotes.length === 0) return;

        try {
            // Agregar apuntes
            for (const compraId of selectedNotes) {
                await foldersAPI.addNoteToFolder(parseInt(id), compraId);
            }

            // Si la carpeta es de tipo "semestre", actualizar nombre con semestres únicos
            if (folder?.tipo === 'semestre') {
                // Obtener todos los apuntes de la carpeta (incluyendo los recién agregados)
                const { data: notesInFolder } = await foldersAPI.getNotesInFolder(parseInt(id));

                if (notesInFolder?.length > 0) {
                    const compraIds = notesInFolder.map(n => n.compra_id);

                    // Obtener info de compras y materias
                    const { data: compras } = await supabase
                        .from('compra_apunte')
                        .select(`
                        id,
                        apunte_id,
                        apunte:apunte(
                            materia:id_materia(semestre)
                        )
                    `)
                        .in('id', compraIds);

                    // Extraer semestres únicos
                    const semestres = new Set();
                    compras?.forEach(c => {
                        const sem = c.apunte?.materia?.semestre;
                        if (sem) semestres.add(sem);
                    });

                    // Actualizar nombre si hay múltiples semestres
                    if (semestres.size > 1) {
                        const semestresList = Array.from(semestres).sort((a, b) => parseInt(a) - parseInt(b));
                        const nuevoNombre = `Semestre ${semestresList.join(' y ')}`;

                        await foldersAPI.updateFolder(parseInt(id), nuevoNombre);
                    }
                }
            }

            setShowAddNotesModal(false);
            setSelectedNotes([]);
            loadFolderContent();

        } catch (err) {
            console.error('Error añadiendo apuntes:', err);
            setErrorMsg("Error al añadir apuntes");
        }
    };


    const handleRenameFolder = async (carpetaId, nuevoNombre) => {
        try {
            setErrorMsg("");
            const { error } = await foldersAPI.updateFolder(carpetaId, nuevoNombre);
            if (error) throw error;
            await loadFolders();
        } catch (err) {
            console.error('Error renombrando carpeta:', err);
            setErrorMsg("Error al renombrar carpeta");
        }
    };

    const loadFolderContent = async () => {
        try {
            setLoading(true);
            setErrorMsg("");

            // 1. Obtener info de la carpeta actual
            const {data: allFolders} = await foldersAPI.getMyFolders();
            const currentFolder = allFolders?.find(f => f.id_carpeta === parseInt(id));

            if (!currentFolder) {
                setErrorMsg("Carpeta no encontrada");
                return;
            }

            setFolder(currentFolder);

            // 2. Construir breadcrumb (ruta de carpetas)
            const buildBreadcrumb = (folderId, folders) => {
                const crumbs = [];
                let current = folders.find(f => f.id_carpeta === folderId);

                while (current) {
                    crumbs.unshift(current);
                    current = current.parent_id ? folders.find(f => f.id_carpeta === current.parent_id) : null;
                }

                return crumbs;
            };

            setBreadcrumb(buildBreadcrumb(parseInt(id), allFolders || []));

            // 3. Obtener subcarpetas
            const childFolders = (allFolders || []).filter(f => f.parent_id === parseInt(id));

            // Contar items en cada subcarpeta
            for (const subfolder of childFolders) {
                const {data: items} = await foldersAPI.getNotesInFolder(subfolder.id_carpeta);
                const {data: children} = await foldersAPI.getMyFolders();
                const childCount = children?.filter(c => c.parent_id === subfolder.id_carpeta).length || 0;
                subfolder.item_count = (items?.length || 0) + childCount;
            }

            setSubfolders(childFolders);

            // 4. Obtener apuntes de esta carpeta
            const {data: notesInFolder} = await foldersAPI.getNotesInFolder(parseInt(id));

            if (!notesInFolder?.length) {
                setNotes([]);
                return;
            }

            // 5. Obtener detalles de los apuntes y sus compras
            const compraIds = notesInFolder.map(n => n.compra_id).filter(Boolean);

            const {data: compras} = await supabase
                .from("compra_apunte")
                .select(`
                    id,
                    apunte_id,
                    creado_en
                `)
                .in("id", compraIds);

            if (!compras?.length) {
                setNotes([]);
                return;
            }

            const apIds = compras.map(c => c.apunte_id).filter(Boolean);

            const {data: apuntes} = await supabase
                .from("apunte")
                .select(`
                    id_apunte,
                    titulo,
                    descripcion,
                    creditos,
                    estrellas,
                    file_path,
                    materia:id_materia(
                        id_materia,
                        nombre_materia
                    ),
                    usuario:id_usuario(nombre)
                `)
                .in("id_apunte", apIds);

            // 6. Generar signed URLs
            const urls = {};
            if (apuntes?.length > 0) {
                for (const apunte of apuntes) {
                    if (apunte.file_path) {
                        const {data: signedData, error: signedError} = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(apunte.file_path, 3600);

                        if (!signedError && signedData) {
                            urls[apunte.id_apunte] = signedData.signedUrl;
                        }
                    }
                }
            }

            // 7. Mapear y enriquecer datos
            const mapApunte = new Map(apuntes?.map(a => [a.id_apunte, a]) || []);
            const mapCompra = new Map(compras.map(c => [c.id, c]));

            const enriched = notesInFolder.map(nif => {
                const compra = mapCompra.get(nif.compra_id);
                const apunte = compra ? mapApunte.get(compra.apunte_id) : null;

                return {
                    ...nif,
                    id_apunte: compra?.apunte_id,
                    titulo: apunte?.titulo || "Apunte",
                    descripcion: apunte?.descripcion || "",
                    creditos: apunte?.creditos || 0,
                    estrellas: apunte?.estrellas || 0,
                    usuario: apunte?.usuario || {nombre: "Anónimo"},
                    materia: apunte?.materia || {nombre_materia: "Sin materia"},
                    signedUrl: urls[compra?.apunte_id] || null,
                    agregado_en: nif.agregado_en
                };
            });

            // Ordenar por fecha de agregado (más reciente primero)
            enriched.sort((a, b) => new Date(b.agregado_en) - new Date(a.agregado_en));

            setNotes(enriched);

        } catch (err) {
            console.error('Error cargando carpeta:', err);
            setErrorMsg(err?.message || "Error cargando carpeta");
        } finally {
            setLoading(false);
        }
    };

    // Drag & Drop handlers
    const handleDragStart = (e, item, type) => {
        setDraggedItem({...item, type});
    };

    const handleDragOver = (e, targetFolder) => {
        e.preventDefault();
        setDragOverFolder(targetFolder.id_carpeta);
    };

    const handleDrop = async (e, targetFolder) => {
        e.preventDefault();
        setDragOverFolder(null);

        if (!draggedItem) return;

        try {
            if (draggedItem.type === 'folder') {
                // Mover carpeta dentro de otra carpeta
                await foldersAPI.moveFolder(
                    draggedItem.id_carpeta,
                    targetFolder.id_carpeta,
                    0
                );
            } else if (draggedItem.type === 'note') {
                // Mover apunte a otra carpeta
                const compraId = draggedItem.compra_id;
                await foldersAPI.removeNoteFromFolder(parseInt(id), compraId);
                await foldersAPI.addNoteToFolder(targetFolder.id_carpeta, compraId);
            }

            loadFolderContent();
        } catch (err) {
            console.error('Error moviendo item:', err);
            setErrorMsg("Error al mover el elemento");
        }

        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverFolder(null);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: "60vh", display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column", gap: 16
            }}>
                <div style={{
                    width: 40, height: 40, border: "3px solid #f3f4f6",
                    borderTop: "3px solid #2563eb", borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }}/>
                <p style={{color: "#6b7280", margin: 0}}>Cargando carpeta...</p>
            </div>
        );
    }

    const allItems = [
        ...subfolders.map(f => ({...f, itemType: 'folder'})),
        ...notes.map(n => ({...n, itemType: 'note'}))
    ];



    return (
        <div style={{width: "min(1200px, 92vw)", margin: "0 auto", padding: "32px 0"}}>
            {/* Breadcrumb */}
            <div style={{
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap'
            }}>
                <Button
                    variant="ghost"
                    onClick={() => navigate('/purchased?tab=folders')}
                    style={{ padding: '8px 12px', fontSize: 14 }}
                >
                    Mis compras
                </Button>
                {breadcrumb.map((crumb, idx) => (
                    <div key={crumb.id_carpeta} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#9ca3af' }}>›</span>
                        {idx === breadcrumb.length - 1 ? (
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{crumb.nombre}</span>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={() => navigate(`/purchased/folder/${crumb.id_carpeta}`)}
                                style={{ padding: '8px 12px', fontSize: 14 }}
                            >
                                {crumb.nombre}
                            </Button>
                        )}
                    </div>
                ))}
            </div>        Crear carpeta

            {/* Header con botones */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 24,
                gap: 16,
                flexWrap: 'wrap'
            }}>
                <div>
                    <h1 style={{margin: "0 0 8px 0"}}>{folder?.nombre}</h1>
                    <p style={{color: "#6b7280", margin: 0}}>
                        {allItems.length} elemento{allItems.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <div style={{display: 'flex', gap: 12}}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowCreateFolderModal(true)}
                        style={{display: 'flex', alignItems: 'center', gap: 8}}
                    >
                        ➕ Crear subcarpeta
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            loadAvailableNotes();
                            setShowAddNotesModal(true);
                        }}
                        style={{display: 'flex', alignItems: 'center', gap: 8}}
                    >
                        ➕ Añadir apuntes
                    </Button>
                </div>
            </div>

            {errorMsg && (
                <Card style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: "16px 20px",
                    marginBottom: 20
                }}>
                    {errorMsg}
                </Card>
            )}

            {allItems.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "48px 24px", background: "#fafafa" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
                    <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>Carpeta vacía</h3>
                    <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
                        Arrastrá apuntes o carpetas aquí, o usá los botones de arriba.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <Button variant="secondary" onClick={() => setShowCreateFolderModal(true)}>
                            Crear subcarpeta
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                loadAvailableNotes();  // ← IMPORTANTE
                                setShowAddNotesModal(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Añadir apuntes
                        </Button>
                    </div>
                </Card>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20
                }}>
                    {allItems.map((item) => {
                        if (item.itemType === 'folder') {
                            return (
                                <FolderCard
                                    key={`folder-${item.id_carpeta}`}
                                    folder={item}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    isDragging={draggedItem?.id_carpeta === item.id_carpeta}
                                    onDelete={handleDeleteFolder}
                                    onRename={handleRenameFolder}
                                />
                            );
                        } else {
                            return (
                                <div
                                    key={`note-${item.id}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item, 'note')}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        opacity: draggedItem?.id === item.id ? 0.5 : 1,
                                        transition: 'opacity 0.2s'
                                    }}
                                >
                                    <ApunteCard note={item}/>
                                </div>
                            );
                        }
                    })}
                </div>
            )}

            {/* Modal crear subcarpeta */}
            {showCreateFolderModal && (
                <div style={{
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
                }} onClick={() => setShowCreateFolderModal(false)}>
                    <Card style={{
                        maxWidth: 400,
                        width: '100%',
                        padding: 24
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{margin: '0 0 16px 0', fontSize: 20}}>
                            Crear subcarpeta
                        </h2>
                        <input
                            type="text"
                            placeholder="Nombre de la subcarpeta"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleCreateSubfolder();
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
                        <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end'}}>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowCreateFolderModal(false);
                                    setNewFolderName("");
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleCreateSubfolder}
                                disabled={!newFolderName.trim()}
                            >
                                Crear
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal añadir apuntes */}
            {showAddNotesModal && (
                <div style={{
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
                    padding: 16,
                    overflow: 'auto'
                }} onClick={() => setShowAddNotesModal(false)}>
                    <Card style={{
                        maxWidth: 600,
                        width: '100%',
                        padding: 24,
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{margin: '0 0 16px 0', fontSize: 20}}>
                            Añadir apuntes a "{folder?.nombre}"
                        </h2>
                        <div style={{marginBottom: 20}}>
                            {availableNotes.map((note) => (
                                <label
                                    key={note.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 8,
                                        marginBottom: 8,
                                        cursor: 'pointer',
                                        background: selectedNotes.includes(note.id) ? '#eff6ff' : 'white',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedNotes.includes(note.id)}
                                        onChange={() => toggleNoteSelection(note.id)}
                                        style={{marginRight: 12}}
                                    />
                                    <div style={{flex: 1}}>
                                        <div style={{fontWeight: 500, marginBottom: 4}}>
                                            {note.titulo}
                                        </div>
                                        <div style={{fontSize: 13, color: '#6b7280'}}>
                                            {note.materia?.nombre_materia || 'Sin materia'}
                                        </div>
                                    </div>
                                </label>
                            ))}
                            {availableNotes.length === 0 && (
                                <p style={{textAlign: 'center', color: '#6b7280', padding: 20}}>
                                    No hay apuntes disponibles para añadir
                                </p>
                            )}
                        </div>
                        <div style={{display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{fontSize: 14, color: '#6b7280'}}>
                            {selectedNotes.length} seleccionado{selectedNotes.length !== 1 ? 's' : ''}
                        </span>
                            <div style={{display: 'flex', gap: 12}}>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowAddNotesModal(false);
                                        setSelectedNotes([]);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleAddNotes}
                                    disabled={selectedNotes.length === 0}
                                >
                                    Añadir ({selectedNotes.length})
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}