import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShoppingCart,
    faFolder,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from "../supabase";
import { getOrCreateUserProfile } from "../api/userService";
import { foldersAPI } from "../api/database";
import { Button } from "../components/UI/Button";
import { Card } from "../components/UI/Card";
import { useNavigate, useLocation } from "react-router-dom";
import ApunteCard from "../components/ApunteCard";
import { FolderCard } from "../components/FolderCard";

export default function Purchased() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const initialTab = params.get("tab") || "purchases";

    const [activeTab, setActiveTab] = useState(initialTab);
    const [purchases, setPurchases] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [organizing, setOrganizing] = useState(false);
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showAddNotesModal, setShowAddNotesModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderType, setNewFolderType] = useState("personalizada");
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [targetFolder, setTargetFolder] = useState(null);

    // Autocomplete materias
    const [materias, setMaterias] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredMaterias, setFilteredMaterias] = useState([]);
    const [selectedMateria, setSelectedMateria] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Filtro de apuntes para modal "añadir a carpeta"
    const [availableNotes, setAvailableNotes] = useState([]);
    const [filterText, setFilterText] = useState("");

    useEffect(() => {
        loadPurchases();
        loadFolders();
        fetchMaterias();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtrar materias según búsqueda
    useEffect(() => {
        if (searchTerm.trim()) {
            const normalizedSearch = normalizeText(searchTerm);
            const filtered = materias.filter((m) =>
                normalizeText(m.nombre_materia).includes(normalizedSearch)
            );
            setFilteredMaterias(filtered);
            setShowDropdown(true);
        } else {
            setFilteredMaterias([]);
            setShowDropdown(false);
        }
    }, [searchTerm, materias]);

    const normalizeText = (text) =>
        text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const fetchMaterias = async () => {
        try {
            const { data: materiasData, error } = await supabase
                .from("materia")
                .select("id_materia, nombre_materia, semestre")
                .order("nombre_materia");

            if (error) throw error;
            setMaterias(materiasData || []);
        } catch (err) {
            console.error("Error cargando materias:", err);
        }
    };

    const handleMateriaSelect = (materia) => {
        setSelectedMateria(materia);
        setSearchTerm(materia.nombre_materia);
        setNewFolderName(materia.nombre_materia);
        setShowDropdown(false);
    };

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
                .select(`id, apunte_id, comprador_id, creado_en`)
                .eq("comprador_id", profile.id_usuario)
                .order("creado_en", { ascending: false });

            if (comprasError) throw comprasError;
            if (!compras?.length) {
                setPurchases([]);
                setAvailableNotes([]);
                return;
            }

            const apIds = compras.map((c) => c.apunte_id).filter(Boolean);
            if (apIds.length === 0) {
                setPurchases([]);
                setAvailableNotes([]);
                return;
            }

            // Traer apuntes de las compras
            const { data: apData, error: apErr } = await supabase
                .from("apuntes_completos")
                .select("*")
                .in("id_apunte", apIds)
                .order("created_at", { ascending: false });

            if (apErr) throw apErr;
            const apuntes = apData || [];

            // Signed URLs en paralelo
            const urlsArray = await Promise.all(
                apuntes.map(async (ap) => {
                    if (!ap.file_path) return [ap.id_apunte, null];
                    const { data: signedData } = await supabase.storage
                        .from("apuntes")
                        .createSignedUrl(ap.file_path, 3600);
                    return [ap.id_apunte, signedData?.signedUrl || null];
                })
            );
            const urls = Object.fromEntries(urlsArray);

            const mapApunte = new Map(
                apuntes.map((a) => ({
                    ...a,
                    usuario: { nombre: a.autor_nombre },
                    materia: { id_materia: a.id_materia, nombre_materia: a.materia_nombre }
                })).map(a => [a.id_apunte, a])
            );
            const enriched = compras.map((c) => {
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
                    file_path: apunte?.file_path || null,
                    thumbnail_path: apunte?.thumbnail_path || null,
                    created_at: apunte?.created_at || null
                };
            });

            setPurchases(enriched);

            // Pre-cargar availableNotes (para modal)
            setAvailableNotes(
                enriched.map((p) => ({
                    id: p.id, // id de la compra
                    titulo: p.titulo,
                    descripcion: p.descripcion,
                    materia: p.materia?.nombre_materia || "Sin materia"
                }))
            );
        } catch (err) {
            console.error("Error cargando compras:", err);
            setErrorMsg(err?.message || "Error cargando tus compras.");
        } finally {
            setLoading(false);
        }
    };

    // 2 queries en lugar de N
    const loadFolders = async () => {
        try {
            const { data: allFolders, error } = await foldersAPI.getMyFolders();
            if (error) throw error;

            if (!allFolders?.length) {
                setFolders([]);
                return;
            }

            // Relación apunte-carpeta
            const folderIds = allFolders.map((f) => f.id_carpeta);
            const { data: allNotesInFolders } = await supabase
                .from("apunte_en_carpeta")
                .select("carpeta_id, compra_id")
                .in("carpeta_id", folderIds);

            // Traer compras vinculadas (para calcular semestres)
            const compraIds = [...new Set(allNotesInFolders?.map((n) => n.compra_id) || [])];
            let comprasWithMaterias = [];

            if (compraIds.length > 0) {
                const { data } = await supabase
                    .from("compra_apunte")
                    .select(
                        `
            id,
            apunte_id,
            apunte:apunte(
              materia:id_materia(semestre)
            )
          `
                    )
                    .in("id", compraIds);
                comprasWithMaterias = data || [];
            }

            // Agrupar en frontend
            const notesPerFolder = {};
            allNotesInFolders?.forEach((nif) => {
                if (!notesPerFolder[nif.carpeta_id]) {
                    notesPerFolder[nif.carpeta_id] = [];
                }
                notesPerFolder[nif.carpeta_id].push(nif.compra_id);
            });

            // Calcular semestres por carpeta
            // ✅ Función recursiva para obtener todos los apuntes (incluyendo subcarpetas)
            const getAllNotesRecursive = (folderId) => {
                const directNotes = notesPerFolder[folderId] || [];
                const childFolders = allFolders.filter(f => f.parent_id === folderId);

                let allNotes = [...directNotes];
                childFolders.forEach(child => {
                    allNotes = [...allNotes, ...getAllNotesRecursive(child.id_carpeta)];
                });

                return allNotes;
            };

// Calcular semestres por carpeta (incluyendo subcarpetas)
            const foldersWithData = allFolders.map((folder) => {
                const notesInFolder = notesPerFolder[folder.id_carpeta] || [];
                const childFolders = allFolders.filter((f) => f.parent_id === folder.id_carpeta);

                // ✅ NUEVO: Obtener TODOS los apuntes (incluyendo los de subcarpetas)
                const allNotesInTree = getAllNotesRecursive(folder.id_carpeta);

                const semestres = new Set();
                allNotesInTree.forEach((compraId) => {
                    const compra = comprasWithMaterias.find((c) => c.id === compraId);
                    const sem = compra?.apunte?.materia?.semestre;
                    if (sem) semestres.add(sem);
                });

                return {
                    ...folder,
                    item_count: notesInFolder.length + childFolders.length,
                    semestres: Array.from(semestres)
                };
            });

            setFolders(foldersWithData.filter((f) => !f.parent_id));
        } catch (err) {
            console.error("Error cargando carpetas:", err);
        }
    };

    const handleOrganize = async () => {
        try {
            setOrganizing(true);
            setShowOrgModal(false);
            setErrorMsg("");

            const { error } = await foldersAPI.autoOrganize();
            if (error) throw error;
            await loadFolders();
        } catch (err) {
            console.error("Error organizando:", err);
            setErrorMsg(err?.message || "Error al organizar automáticamente");
        } finally {
            setOrganizing(false);
        }
    };

    const handleDeleteAllFolders = async () => {
        try {
            setOrganizing(true);
            setErrorMsg("");

            // ✅ NUEVO: Primero limpiar todas las relaciones apunte-carpeta
            const { error: deleteRelError } = await supabase
                .from('apunte_en_carpeta')
                .delete()
                .neq('id', 0); // Esto borra todo (workaround porque no hay .deleteAll())

            if (deleteRelError) {
                console.error('Error limpiando relaciones:', deleteRelError);
            }

            // Ahora eliminar todas las carpetas
            const { data: allFolders } = await foldersAPI.getMyFolders();
            for (const folder of allFolders || []) {
                await foldersAPI.deleteFolder(folder.id_carpeta);
            }

            await loadFolders();
        } catch (err) {
            console.error("Error eliminando carpetas:", err);
            setErrorMsg("Error al eliminar carpetas");
        } finally {
            setOrganizing(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        if (newFolderType === "materia" && !selectedMateria) {
            setErrorMsg("Debes seleccionar una materia de la lista");
            return;
        }

        try {
            setErrorMsg("");
            await foldersAPI.createFolder(newFolderName.trim(), newFolderType, null, 0);

            setShowCreateFolderModal(false);
            setNewFolderName("");
            setNewFolderType("personalizada");
            setSearchTerm("");
            setSelectedMateria(null);
            await loadFolders();
        } catch (err) {
            console.error("Error creando carpeta:", err);
            setErrorMsg("Error al crear carpeta");
        }
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
            setFilterText("");
            await loadFolders();
        } catch (err) {
            console.error("Error añadiendo apuntes:", err);
            setErrorMsg("Error al añadir apuntes a la carpeta");
        }
    };

    const toggleNoteSelection = (compraId) => {
        setSelectedNotes((prev) =>
            prev.includes(compraId) ? prev.filter((id) => id !== compraId) : [...prev, compraId]
        );
    };

    const handleDeleteFolder = async (carpetaId) => {
        try {
            setErrorMsg("");
            await foldersAPI.deleteFolder(carpetaId);
            await loadFolders();
        } catch (err) {
            console.error("Error eliminando carpeta:", err);
            setErrorMsg("Error al eliminar carpeta");
        }
    };

    const handleRenameFolder = async (carpetaId, nuevoNombre) => {
        try {
            setErrorMsg("");
            await foldersAPI.updateFolder(carpetaId, nuevoNombre);
            await loadFolders();
        } catch (err) {
            console.error("Error renombrando carpeta:", err);
            setErrorMsg("Error al renombrar carpeta");
        }
    };

    // Filtrar apuntes disponibles
    const filteredAvailableNotes = availableNotes.filter((note) => {
        const searchText = normalizeText(filterText);
        return (
            normalizeText(note.titulo).includes(searchText) ||
            normalizeText(note.materia).includes(searchText)
        );
    });

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 16,
                    background: '#f8fafc'
                }}
            >
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    style={{ fontSize: 40, color: '#2563eb' }}
                />
                <p style={{
                    color: "#64748b",
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif'
                }}>
                    Cargando tus compras…
                </p>
            </div>
        );
    }

    return (
        <div style={{
            width: "min(1200px, 92vw)",
            margin: "0 auto",
            padding: "32px 0",
            fontFamily: 'Inter, sans-serif',
            background: '#f8fafc',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <header style={{
                marginBottom: 24,
                background: '#ffffff',
                padding: '20px',
                borderRadius: 16,
                border: '2px solid #f1f5f9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 6
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FontAwesomeIcon
                            icon={faShoppingCart}
                            style={{ fontSize: 18, color: '#fff' }}
                        />
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: 26,
                        fontWeight: 700,
                        color: '#13346b'
                    }}>
                        Mis Compras
                    </h1>
                </div>
                <p style={{
                    color: '#64748b',
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    paddingLeft: 56
                }}>
                    {purchases.length} compra{purchases.length !== 1 ? "s" : ""} realizada{purchases.length !== 1 ? "s" : ""}
                </p>
            </header>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    borderBottom: "2px solid #e5e7eb",
                    marginBottom: 24,
                    background: '#fff',
                    padding: '0 20px',
                    borderRadius: '16px 16px 0 0'
                }}
            >
                {[
                    { key: "purchases", label: "Todas las compras", icon: faShoppingCart },
                    { key: "folders", label: "Mis carpetas", icon: faFolder }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: "14px 24px",
                            background: "none",
                            border: "none",
                            borderBottom:
                                activeTab === tab.key ? "3px solid #2563eb" : "3px solid transparent",
                            color: activeTab === tab.key ? "#2563eb" : "#6b7280",
                            fontWeight: activeTab === tab.key ? 700 : 500,
                            cursor: "pointer",
                            fontSize: 15,
                            marginBottom: -2,
                            transition: "all 0.2s",
                            fontFamily: 'Inter, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <FontAwesomeIcon icon={tab.icon} style={{ fontSize: 14 }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {errorMsg && (
                <Card
                    style={{
                        background: "#fef2f2",
                        border: "2px solid #fecaca",
                        color: "#991b1b",
                        padding: "16px 20px",
                        marginBottom: 20
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12
                        }}
                    >
                        <span style={{ fontWeight: 500 }}>{errorMsg}</span>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                loadPurchases();
                                loadFolders();
                            }}
                        >
                            Reintentar
                        </Button>
                    </div>
                </Card>
            )}

            {activeTab === "purchases" ? (
                purchases.length === 0 ? (
                    <Card style={{
                        textAlign: "center",
                        padding: "80px 40px",
                        background: "#ffffff",
                        border: '2px solid #f1f5f9'
                    }}>
                        <div style={{
                            width: 100,
                            height: 100,
                            borderRadius: '24px',
                            background: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <FontAwesomeIcon
                                icon={faShoppingCart}
                                style={{ fontSize: 48, color: '#fff' }}
                            />
                        </div>
                        <h3 style={{
                            margin: "0 0 12px 0",
                            color: "#13346b",
                            fontSize: 28,
                            fontWeight: 700
                        }}>
                            Todavía no compraste nada
                        </h3>
                        <p style={{
                            color: "#64748b",
                            margin: "0 0 28px 0",
                            fontSize: 16,
                            fontWeight: 500,
                            lineHeight: 1.6
                        }}>
                            Explorá apuntes y materiales creados por otros estudiantes
                        </p>
                        <Button variant="primary" onClick={() => navigate("/notes")}>
                            Ir a explorar apuntes
                        </Button>
                    </Card>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: 20
                        }}
                    >
                        {purchases.map((purchase) => (
                            <ApunteCard key={purchase.id} note={purchase} />
                        ))}
                    </div>
                )
            ) : (
                <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowCreateFolderModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 18px',
                                borderRadius: 10,
                                fontWeight: 600,
                                fontSize: 14,
                                background: 'white',
                                border: '2px solid #e2e8f0',
                                color: '#0f172a',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.borderColor = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <FontAwesomeIcon icon={faFolder} />
                            Crear carpeta
                        </button>

                        {folders.length === 0 && purchases.length > 0 && (
                            <button
                                onClick={() => setShowOrgModal(true)}
                                disabled={organizing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: organizing ? '#94a3b8' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 18px',
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: organizing ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    if (!organizing) e.target.style.background = '#1e40af';
                                }}
                                onMouseLeave={(e) => {
                                    if (!organizing) e.target.style.background = '#2563eb';
                                }}
                            >
                                {organizing ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Organizando...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <circle cx="12" cy="12" r="3"/>
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                        </svg>
                                        Organizar automáticamente
                                    </>
                                )}
                            </button>
                        )}

                        {folders.length > 0 && (
                            <button
                                onClick={handleDeleteAllFolders}
                                disabled={organizing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 18px',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    fontSize: 14,
                                    background: 'white',
                                    border: '2px solid #ef4444',
                                    color: '#ef4444',
                                    cursor: organizing ? 'not-allowed' : 'pointer',
                                    opacity: organizing ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    if (!organizing) {
                                        e.target.style.background = '#fef2f2';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!organizing) {
                                        e.target.style.background = 'white';
                                    }
                                }}
                            >
                                {organizing ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Borrando...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                        </svg>
                                        Borrar todas las carpetas
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {folders.length === 0 ? (
                        <Card style={{
                            textAlign: "center",
                            padding: "80px 40px",
                            background: "#ffffff",
                            border: '2px solid #f1f5f9'
                        }}>
                            <div style={{
                                width: 100,
                                height: 100,
                                borderRadius: '24px',
                                background: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <FontAwesomeIcon
                                    icon={faFolder}
                                    style={{ fontSize: 48, color: '#fff' }}
                                />
                            </div>
                            <h3 style={{
                                margin: "0 0 12px 0",
                                color: "#13346b",
                                fontSize: 28,
                                fontWeight: 700
                            }}>
                                No tenés carpetas todavía
                            </h3>
                            <p style={{
                                color: "#64748b",
                                margin: "0 0 28px 0",
                                fontSize: 16,
                                fontWeight: 500,
                                lineHeight: 1.6
                            }}>
                                Organizá tus compras automáticamente o creá carpetas personalizadas
                            </p>
                        </Card>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: 20
                            }}
                        >
                            {folders.map((folder) => (<FolderCard
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

            {/* Modal organizar automáticamente */}
            {showOrgModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: 16
                    }}
                    onClick={() => setShowOrgModal(false)}
                >
                    <Card
                        style={{ maxWidth: 480, width: "100%", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 14,
                                background: '#2563eb',
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 28,
                                marginBottom: 20
                            }}
                        >
                            🤖
                        </div>
                        <h2 style={{ margin: "0 0 12px 0", fontSize: 22, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Organizar automáticamente</h2>
                        <p style={{ color: "#6b7280", margin: "0 0 24px 0", lineHeight: 1.6, fontSize: 15, fontFamily: 'Inter, sans-serif' }}>
                            Voy a crear carpetas por semestre y materia automáticamente, organizando todos tus apuntes.
                        </p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={() => setShowOrgModal(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    background: "white",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#6b7280",
                                    transition: "all 0.2s",
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleOrganize}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    background: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    transition: "all 0.2s",
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                Organizar
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal crear carpeta */}
            {showCreateFolderModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: 16
                    }}
                    onClick={() => {
                        setShowCreateFolderModal(false);
                        setNewFolderName("");
                        setNewFolderType("personalizada");
                        setSearchTerm("");
                        setSelectedMateria(null);
                    }}
                >
                    <Card
                        style={{ maxWidth: 480, width: "100%", padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: "#2563eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 24
                                }}
                            >
                                📁
                            </div>
                            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Nueva carpeta</h2>
                        </div>

                        <p style={{ color: "#6b7280", margin: "0 0 20px 0", fontSize: 14, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                            Organizá tus apuntes creando carpetas personalizadas o por materia
                        </p>

                        {/* Selector de tipo */}
                        <div style={{ marginBottom: 20 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#374151",
                                    marginBottom: 12,
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                Tipo de carpeta
                            </label>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewFolderType("materia");
                                        setNewFolderName("");
                                        setSearchTerm("");
                                        setSelectedMateria(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "12px 16px",
                                        border: newFolderType === "materia" ? "2px solid #10b981" : "2px solid #e5e7eb",
                                        borderRadius: 8,
                                        background: newFolderType === "materia" ? "#d1fae5" : "white",
                                        color: newFolderType === "materia" ? "#059669" : "#6b7280",
                                        cursor: "pointer",
                                        fontWeight: newFolderType === "materia" ? 600 : 500,
                                        fontSize: 14,
                                        transition: "all 0.2s",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 4,
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                    Materia
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewFolderType("personalizada");
                                        setSearchTerm("");
                                        setSelectedMateria(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "12px 16px",
                                        border:
                                            newFolderType === "personalizada" ? "2px solid #2563eb" : "2px solid #e5e7eb",
                                        borderRadius: 8,
                                        background: newFolderType === "personalizada" ? "#dbeafe" : "white",
                                        color: newFolderType === "personalizada" ? "#2563eb" : "#6b7280",
                                        cursor: "pointer",
                                        fontWeight: newFolderType === "personalizada" ? 600 : 500,
                                        fontSize: 14,
                                        transition: "all 0.2s",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 4,
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 7h-9M14 17H5M17 3v18M7 7v10" />
                                    </svg>
                                    Personalizada
                                </button>
                            </div>
                        </div>

                        {/* Input según tipo */}
                        {newFolderType === "materia" ? (
                            <div style={{ marginBottom: 24, position: "relative" }} ref={dropdownRef}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#374151",
                                        marginBottom: 8,
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                >
                                    Buscar materia
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSelectedMateria(null);
                                    }}
                                    placeholder="Ej: Análisis Matemático, Física..."
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        border: "2px solid #e5e7eb",
                                        borderRadius: 8,
                                        fontSize: 15,
                                        outline: "none",
                                        transition: "all 0.2s",
                                        boxSizing: "border-box",
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    autoFocus
                                />
                                {showDropdown && filteredMaterias.length > 0 && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            right: 0,
                                            background: "#fff",
                                            border: "1px solid #d1d5db",
                                            borderRadius: 8,
                                            marginTop: 4,
                                            maxHeight: 200,
                                            overflowY: "auto",
                                            zIndex: 100,
                                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
                                        }}
                                    >
                                        {filteredMaterias.map((materia) => (
                                            <div
                                                key={materia.id_materia}
                                                onClick={() => handleMateriaSelect(materia)}
                                                style={{
                                                    padding: "12px 16px",
                                                    cursor: "pointer",
                                                    borderBottom: "1px solid #f3f4f6"
                                                }}
                                                onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                                onMouseLeave={(e) => (e.target.style.background = "#fff")}
                                            >
                                                <div style={{ fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{materia.nombre_materia}</div>
                                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
                                                    Semestre {materia.semestre}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ marginBottom: 24 }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#374151",
                                        marginBottom: 8,
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                >
                                    Nombre de la carpeta
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Mis favoritos, Exámenes finales..."
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" && newFolderName.trim()) {
                                            handleCreateFolder();
                                        }
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        border: "2px solid #e5e7eb",
                                        borderRadius: 8,
                                        fontSize: 15,
                                        outline: "none",
                                        transition: "all 0.2s",
                                        boxSizing: "border-box",
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={() => {
                                    setShowCreateFolderModal(false);
                                    setNewFolderName("");
                                    setNewFolderType("personalizada");
                                    setSearchTerm("");
                                    setSelectedMateria(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    background: "white",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#6b7280",
                                    transition: "all 0.2s",
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                onMouseLeave={(e) => (e.target.style.background = "white")}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    background: !newFolderName.trim() ? "#d1d5db" : "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 10,
                                    cursor: !newFolderName.trim() ? "not-allowed" : "pointer",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    transition: "all 0.2s",
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    if (newFolderName.trim()) e.target.style.background = "#1d4ed8";
                                }}
                                onMouseLeave={(e) => {
                                    if (newFolderName.trim()) e.target.style.background = "#2563eb";
                                }}
                            >
                                Crear carpeta
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal añadir notas a carpeta */}
            {showAddNotesModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: 16
                    }}
                    onClick={() => {
                        setShowAddNotesModal(false);
                        setFilterText("");
                    }}
                >
                    <Card
                        style={{
                            maxWidth: 600,
                            width: "100%",
                            maxHeight: "80vh",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: 32, borderBottom: "1px solid #e5e7eb" }}>
                            <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                                Añadir apuntes a "{targetFolder?.nombre}"
                            </h2>

                            <input
                                type="text"
                                placeholder="Buscar por nombre o materia..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: 8,
                                    fontSize: 14,
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "border 0.2s",
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                            />
                        </div>

                        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
                            {filteredAvailableNotes.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                                        {filterText ? "🔍" : "📭"}
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                                        {filterText ? "No se encontraron resultados" : "No hay apuntes disponibles"}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 20 }}>
                                    {filteredAvailableNotes.map((note) => (
                                        <label
                                            key={note.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "12px",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: 8,
                                                marginBottom: 8,
                                                cursor: "pointer",
                                                background: selectedNotes.includes(note.id) ? "#eff6ff" : "white",
                                                transition: "all 0.2s",
                                                fontFamily: 'Inter, sans-serif'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedNotes.includes(note.id)}
                                                onChange={() => toggleNoteSelection(note.id)}
                                                style={{ marginRight: 12 }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, marginBottom: 4 }}>{note.titulo}</div>
                                                <div style={{ fontSize: 13, color: "#6b7280" }}>{note.materia}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                padding: 24,
                                borderTop: "1px solid #e5e7eb",
                                display: "flex",
                                gap: 12,
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
              <span style={{ fontSize: 14, color: "#6b7280", fontFamily: 'Inter, sans-serif' }}>
                {selectedNotes.length > 0 &&
                    `${selectedNotes.length} seleccionado${selectedNotes.length !== 1 ? "s" : ""}`}
              </span>
                            <div style={{ display: "flex", gap: 12 }}>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowAddNotesModal(false);
                                        setSelectedNotes([]);
                                        setFilterText("");
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