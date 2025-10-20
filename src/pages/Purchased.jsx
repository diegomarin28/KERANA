import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getOrCreateUserProfile } from "../api/userService";
import { foldersAPI } from "../api/database";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useNavigate } from "react-router-dom";
import ApunteCard from "../components/ApunteCard";
import { FolderCard } from "../components/FolderCard";

export default function Purchased() {
    const [activeTab, setActiveTab] = useState("purchases");
    const [purchases, setPurchases] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [organizing, setOrganizing] = useState(false);
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showAddNotesModal, setShowAddNotesModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [targetFolder, setTargetFolder] = useState(null);
    const [lastOrgSnapshot, setLastOrgSnapshot] = useState(null);
    const [hasOrganized, setHasOrganized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadPurchases();
        loadFolders();
    }, []);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            setErrorMsg("");

            const profile = await getOrCreateUserProfile();
            if (!profile?.id_usuario) {
                setErrorMsg("No se encontró tu perfil de usuario.");
                return;
            }

            const { data: compras, error: comprasError } = await supabase
                .from("compra_apunte")
                .select(`
                id,
                apunte_id,
                comprador_id,
                creado_en
            `)
                .eq("comprador_id", profile.id_usuario)
                .order("creado_en", { ascending: false });

            if (comprasError) throw comprasError;

            if (!compras?.length) {
                setPurchases([]);
                return;
            }

            const apIds = compras.map(c => c.apunte_id).filter(Boolean);

            let apuntes = [];
            if (apIds.length) {
                const { data: apData, error: apErr } = await supabase
                    .from("apunte")
                    .select(`
                    id_apunte,
                    titulo,
                    descripcion,
                    creditos,
                    estrellas,
                    file_path,
                    file_name,
                    materia:id_materia(
                        id_materia,
                        nombre_materia
                    ),
                    usuario:id_usuario(nombre)
                `)
                    .in("id_apunte", apIds);

                if (apErr) throw apErr;
                apuntes = apData || [];
            }

            // Contar likes por apunte
            const { data: likesData, error: likesError } = await supabase
                .from('likes')
                .select('id_apunte')
                .eq('tipo', 'like')
                .in('id_apunte', apIds);

            if (likesError) {
                console.error('Error cargando likes:', likesError);
            }

            // Crear un mapa de conteo de likes
            const likesCountMap = {};
            likesData?.forEach(like => {
                likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
            });

            const urls = {};
            if (apuntes.length > 0) {
                for (const apunte of apuntes) {
                    if (apunte.file_path) {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(apunte.file_path, 3600);

                        if (!signedError && signedData) {
                            urls[apunte.id_apunte] = signedData.signedUrl;
                        }
                    }
                }
            }

            const mapApunte = new Map(apuntes.map(a => [a.id_apunte, a]));

            const enriched = compras.map(c => {
                const apunte = mapApunte.get(c.apunte_id);
                return {
                    ...c,
                    id_apunte: c.apunte_id,
                    titulo: apunte?.titulo || "Apunte adquirido",
                    descripcion: apunte?.descripcion || "",
                    creditos: apunte?.creditos || 0,
                    estrellas: apunte?.estrellas || 0,
                    usuario: apunte?.usuario || { nombre: "Anónimo" },
                    materia: apunte?.materia || { nombre_materia: "Sin materia" },
                    signedUrl: urls[c.apunte_id] || null,
                    file_path: apunte?.file_path,
                    likes_count: likesCountMap[c.apunte_id] || 0  // ← NUEVO
                };
            });

            setPurchases(enriched);
        } catch (err) {
            console.error('Error cargando compras:', err);
            setErrorMsg(err?.message || "Error cargando tus compras.");
        } finally {
            setLoading(false);
        }
    };

    const loadFolders = async () => {
        try {
            const { data, error } = await foldersAPI.getMyFolders();
            if (error) throw error;

            const foldersWithCount = await Promise.all(
                (data || []).map(async (folder) => {
                    const { data: notes } = await foldersAPI.getNotesInFolder(folder.id_carpeta);
                    const subfolders = (data || []).filter(f => f.parent_id === folder.id_carpeta);

                    // ✅ NUEVO: Calcular semestres únicos
                    let semestres = [];
                    if (folder.tipo === 'semestre' && notes?.length > 0) {
                        const compraIds = notes.map(n => n.compra_id);

                        const { data: compras } = await supabase
                            .from('compra_apunte')
                            .select(`
                            apunte_id,
                            apunte:apunte(
                                materia:id_materia(semestre)
                            )
                        `)
                            .in('id', compraIds);

                        const semSet = new Set();
                        compras?.forEach(c => {
                            const sem = c.apunte?.materia?.semestre;
                            if (sem) semSet.add(sem);
                        });

                        semestres = Array.from(semSet);
                    }

                    return {
                        ...folder,
                        item_count: (notes?.length || 0) + subfolders.length,
                        semestres // ✅ NUEVO
                    };
                })
            );

            const rootFolders = foldersWithCount.filter(f => !f.parent_id);
            setFolders(rootFolders);

        } catch (err) {
            console.error('Error cargando carpetas:', err);
        }
    };

    const handleOrganize = async () => {
        try {
            setOrganizing(true);
            setShowOrgModal(false);
            setErrorMsg("");

            // Guardar snapshot ANTES de organizar
            const { data: currentFolders } = await foldersAPI.getMyFolders();
            const { data: currentRelations } = await supabase
                .from('apunte_en_carpeta')
                .select('*');

            setLastOrgSnapshot({
                folders: currentFolders || [],
                relations: currentRelations || []
            });

            const { data, error } = await foldersAPI.autoOrganize();

            if (error) throw error;

            setHasOrganized(true);
            await loadFolders();

        } catch (err) {
            console.error('Error organizando:', err);
            setErrorMsg(err?.message || "Error al organizar automáticamente");
        } finally {
            setOrganizing(false);
        }
    };

    const handleUndoOrganization = async () => {
        if (!lastOrgSnapshot) return;

        try {
            setOrganizing(true);
            setErrorMsg("");

            // Obtener carpetas actuales
            const { data: currentFolders } = await foldersAPI.getMyFolders();

            // Eliminar solo las carpetas que NO existían en el snapshot
            const snapshotIds = new Set(lastOrgSnapshot.folders.map(f => f.id_carpeta));

            for (const folder of currentFolders || []) {
                if (!snapshotIds.has(folder.id_carpeta)) {
                    await foldersAPI.deleteFolder(folder.id_carpeta);
                }
            }

            setLastOrgSnapshot(null);
            setHasOrganized(false);
            await loadFolders();

        } catch (err) {
            console.error('Error deshaciendo:', err);
            setErrorMsg("Error al deshacer la organización");
        } finally {
            setOrganizing(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            setErrorMsg("");
            const { data, error } = await foldersAPI.createFolder(
                newFolderName.trim(),
                'personalizada',
                null,
                0
            );

            if (error) throw error;

            setShowCreateFolderModal(false);
            setNewFolderName("");
            await loadFolders();

            // ✅ NUEVO: Si el nombre era "Nueva carpeta", abrir para editar
            if (newFolderName.trim().toLowerCase() === 'nueva carpeta' && data) {
                // Trigger editar en la carpeta recién creada
                // (esto requeriría pasar un callback o estado adicional)
            }

        } catch (err) {
            console.error('Error creando carpeta:', err);
            setErrorMsg("Error al crear carpeta");
        }
    };

    const handleOpenAddNotes = (folder) => {
        setTargetFolder(folder);
        setSelectedNotes([]);
        setShowAddNotesModal(true);
    };

    const handleAddNotesToFolder = async () => {
        if (!targetFolder || selectedNotes.length === 0) return;

        try {
            setErrorMsg("");

            for (const compraId of selectedNotes) {
                await foldersAPI.addNoteToFolder(targetFolder.id_carpeta, compraId);
            }

            setShowAddNotesModal(false);
            setTargetFolder(null);
            setSelectedNotes([]);
            await loadFolders();

        } catch (err) {
            console.error('Error añadiendo apuntes:', err);
            setErrorMsg("Error al añadir apuntes a la carpeta");
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
            await loadFolders();
        } catch (err) {
            console.error('Error eliminando carpeta:', err);
            setErrorMsg("Error al eliminar carpeta");
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
                }} />
                <p style={{ color: "#6b7280", margin: 0 }}>Cargando tus compras…</p>
            </div>
        );
    }

    return (
        <div style={{ width: "min(1200px, 92vw)", margin: "0 auto", padding: "32px 0" }}>
            <header style={{ marginBottom: 24 }}>
                <h1 style={{ margin: "0 0 8px 0" }}>Mis compras</h1>
                <p style={{ color: "#6b7280", margin: 0 }}>
                    {purchases.length} compra{purchases.length !== 1 ? "s" : ""} realizada{purchases.length !== 1 ? "s" : ""}
                </p>
            </header>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: 8,
                borderBottom: '2px solid #e5e7eb',
                marginBottom: 24
            }}>
                <button
                    onClick={() => setActiveTab("purchases")}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === "purchases" ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === "purchases" ? '#2563eb' : '#6b7280',
                        fontWeight: activeTab === "purchases" ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: 15,
                        marginBottom: -2,
                        transition: 'all 0.2s'
                    }}
                >
                    Todas las compras
                </button>
                <button
                    onClick={() => setActiveTab("folders")}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === "folders" ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === "folders" ? '#2563eb' : '#6b7280',
                        fontWeight: activeTab === "folders" ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: 15,
                        marginBottom: -2,
                        transition: 'all 0.2s'
                    }}
                >
                    Mis carpetas
                </button>
            </div>

            {errorMsg && (
                <Card style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: "16px 20px",
                    marginBottom: 20
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span>{errorMsg}</span>
                        <Button variant="ghost" onClick={() => {
                            loadPurchases();
                            loadFolders();
                        }}>Reintentar</Button>
                    </div>
                </Card>
            )}

            {/* Contenido según tab activo */}
            {activeTab === "purchases" ? (
                purchases.length === 0 ? (
                    <Card style={{ textAlign: "center", padding: "48px 24px", background: "#fafafa" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
                        <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>Todavía no compraste nada</h3>
                        <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
                            Explorá apuntes y materiales creados por otros estudiantes.
                        </p>
                        <Button variant="primary" onClick={() => navigate('/notes')}>Ir a explorar apuntes</Button>
                    </Card>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 20
                    }}>
                        {purchases.map((purchase) => (
                            <ApunteCard
                                key={purchase.id}
                                note={purchase}
                            />
                        ))}
                    </div>
                )
            ) : (
                <div>
                    {/* Botones de acción */}
                    <div style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 24,
                        flexWrap: 'wrap'
                    }}>
                        <Button
                            variant="secondary"
                            onClick={() => setShowCreateFolderModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            ➕ Crear carpeta
                        </Button>

                        {!hasOrganized && (
                            <Button
                                variant="primary"
                                onClick={() => setShowOrgModal(true)}
                                disabled={organizing || purchases.length === 0}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                {organizing ? (
                                    <>
                                        <div style={{
                                            width: 'calc(100% - 24px)',
                                            height: 16,
                                            border: "2px solid white",
                                            borderTop: "2px solid transparent",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite",
                                            boxSizing: 'border-box'
                                        }} />
                                        Organizando...
                                    </>
                                ) : (
                                    <>
                                        🤖 Organizar con IA
                                    </>
                                )}
                            </Button>
                        )}

                        {hasOrganized && lastOrgSnapshot && (
                            <Button
                                variant="secondary"
                                onClick={handleUndoOrganization}
                                disabled={organizing}
                            >
                                ↩️ Deshacer organización
                            </Button>
                        )}
                    </div>

                    {/* Grid de carpetas */}
                    {folders.length === 0 ? (
                        <Card style={{ textAlign: "center", padding: "48px 24px", background: "#fafafa" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                            <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>No tenés carpetas todavía</h3>
                            <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
                                Organizá tus compras automáticamente o creá carpetas personalizadas.
                            </p>
                            {purchases.length > 0 && (
                                <Button variant="primary" onClick={() => setShowOrgModal(true)}>
                                    🤖 Organizar con IA
                                </Button>
                            )}
                        </Card>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 20
                        }}>
                            {folders.map((folder) => (
                                <FolderCard
                                    key={folder.id_carpeta}
                                    folder={folder}
                                    semestres={folder.semestres}
                                    onDelete={handleDeleteFolder}
                                    onRename={handleRenameFolder}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal organizar con IA */}
            {showOrgModal && (
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
                }} onClick={() => setShowOrgModal(false)}>
                    <Card style={{
                        maxWidth: 480,
                        width: '100%',
                        padding: 24
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: 20 }}>
                            Organizar automáticamente
                        </h2>
                        <p style={{ color: '#6b7280', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                            Esto va a crear carpetas por semestre y materia automáticamente, organizando todos tus apuntes.
                            <br /><br />
                            Podés deshacer esta acción después si no te gusta cómo quedó.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <Button
                                variant="ghost"
                                onClick={() => setShowOrgModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleOrganize}
                            >
                                Organizar
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal crear carpeta */}
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
                        <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>
                            Crear carpeta
                        </h2>
                        <input
                            type="text"
                            placeholder="Nombre de la carpeta"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                fontSize: 14,
                                marginBottom: 20,
                                outline: 'none'
                            }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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
                                onClick={handleCreateFolder}
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
                        <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>
                            Añadir apuntes a "{targetFolder?.nombre}"
                        </h2>
                        <div style={{ marginBottom: 20 }}>
                            {purchases.map((purchase) => (
                                <label
                                    key={purchase.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 8,
                                        marginBottom: 8,
                                        cursor: 'pointer',
                                        background: selectedNotes.includes(purchase.id) ? '#eff6ff' : 'white',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedNotes.includes(purchase.id)}
                                        onChange={() => toggleNoteSelection(purchase.id)}
                                        style={{ marginRight: 12 }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, marginBottom: 4 }}>
                                            {purchase.titulo}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                                            {purchase.materia?.nombre_materia || 'Sin materia'}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, color: '#6b7280' }}>
                                {selectedNotes.length} seleccionado{selectedNotes.length !== 1 ? 's' : ''}
                            </span>
                            <div style={{ display: 'flex', gap: 12 }}>
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
                                    onClick={handleAddNotesToFolder}
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