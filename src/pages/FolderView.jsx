import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { foldersAPI } from "../api/database";
import { supabase } from "../supabase";
import { Button } from "../components/UI/Button";
import { Card } from "../components/UI/Card";
import ApunteCard from "../components/ApunteCard";
import { FolderCard } from "../components/FolderCard";
import { getOrCreateUserProfile } from "../api/userService";

export default function FolderView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [folder, setFolder] = useState(null);
    const [subfolders, setSubfolders] = useState([]);
    const [notes, setNotes] = useState([]);
    const [breadcrumb, setBreadcrumb] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverFolder, setDragOverFolder] = useState(null);

    // Estados para modal crear subcarpeta
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderType, setNewFolderType] = useState("personalizada");

    // Estados para modal añadir apuntes
    const [showAddNotesModal, setShowAddNotesModal] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [availableNotes, setAvailableNotes] = useState([]);

    // Estados para autocompletado de materias
    const [materias, setMaterias] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredMaterias, setFilteredMaterias] = useState([]);
    const [selectedMateria, setSelectedMateria] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // ✅ NUEVO: Estado para filtro de apuntes
    const [filterText, setFilterText] = useState("");

    useEffect(() => {
        loadFolderContent();
        fetchMaterias();
        loadAvailableNotes(); // ✅ Pre-cargar al inicio
    }, [id]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrar materias según búsqueda
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

    const normalizeText = (text) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const fetchMaterias = async () => {
        try {
            const { data: materiasData, error } = await supabase
                .from('materia')
                .select('id_materia, nombre_materia, semestre')
                .order('nombre_materia');

            if (error) throw error;
            setMaterias(materiasData || []);
        } catch (err) {
            console.error('Error cargando materias:', err);
        }
    };

    const handleMateriaSelect = (materia) => {
        setSelectedMateria(materia);
        setSearchTerm(materia.nombre_materia);
        setNewFolderName(materia.nombre_materia);
        setShowDropdown(false);
    };

    const handleCreateSubfolder = async () => {
        if (!newFolderName.trim()) return;

        if (newFolderType === "materia" && !selectedMateria) {
            setErrorMsg("Debes seleccionar una materia de la lista");
            return;
        }

        try {
            await foldersAPI.createFolder(
                newFolderName.trim(),
                newFolderType,
                parseInt(id),
                0
            );

            setShowCreateFolderModal(false);
            setNewFolderName("");
            setNewFolderType("personalizada");
            setSearchTerm("");
            setSelectedMateria(null);
            loadFolderContent();

        } catch (err) {
            console.error('Error creando subcarpeta:', err);
            setErrorMsg("Error al crear subcarpeta");
        }
    };

    // ✅ OPTIMIZADO: Pre-cargar apuntes disponibles
    const loadAvailableNotes = async () => {
        try {
            const profile = await getOrCreateUserProfile();
            if (!profile?.id_usuario) return;

            const { data: compras } = await supabase
                .from("compra_apunte")
                .select(`
                id,
                apunte_id,
                apunte:apunte(
                    id_apunte,
                    titulo,
                    descripcion,
                    materia:id_materia(nombre_materia)
                )
            `)
                .eq("comprador_id", profile.id_usuario);


            // ✅ Obtener apuntes que YA están en esta carpeta
            const { data: notesInFolder } = await foldersAPI.getNotesInFolder(parseInt(id));
            const idsEnCarpeta = new Set(notesInFolder?.map(n => n.compra_id) || []);

            // ✅ Filtrar solo los que NO están en la carpeta
            const available = (compras || [])
                .filter(c => !idsEnCarpeta.has(c.id))
                .map(c => ({
                    id: c.id,
                    titulo: c.apunte?.titulo || 'Apunte sin título',
                    descripcion: c.apunte?.descripcion || '',
                    materia: c.apunte?.materia?.nombre_materia || 'Sin materia'
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

    const handleAddNotes = async () => {
        if (selectedNotes.length === 0) return;

        try {
            // Agregar apuntes
            for (const compraId of selectedNotes) {
                await foldersAPI.addNoteToFolder(parseInt(id), compraId);
            }

// ✅ Recalcular semestres (incluyendo subcarpetas)
            const { data: allFolders } = await foldersAPI.getMyFolders();

// Función recursiva para obtener todos los apuntes
            const getAllNotesRecursive = async (folderId) => {
                const { data: directNotes } = await foldersAPI.getNotesInFolder(folderId);
                const childFolders = allFolders.filter(f => f.parent_id === folderId);

                let allCompraIds = directNotes?.map(n => n.compra_id) || [];

                for (const child of childFolders) {
                    const childNotes = await getAllNotesRecursive(child.id_carpeta);
                    allCompraIds = [...allCompraIds, ...childNotes];
                }

                return allCompraIds;
            };

            const allCompraIds = await getAllNotesRecursive(parseInt(id));

            if (allCompraIds.length > 0) {
                const { data: compras } = await supabase
                    .from('compra_apunte')
                    .select(`
            id,
            apunte_id,
            apunte:apunte(
                materia:id_materia(semestre)
            )
        `)
                    .in('id', allCompraIds);

                const semestres = new Set();
                compras?.forEach(c => {
                    const sem = c.apunte?.materia?.semestre;
                    if (sem) semestres.add(sem.toString());
                });

                console.log('📊 Semestres calculados recursivamente:', Array.from(semestres));

                // ✅ Si la carpeta es de tipo 'semestre' Y tiene múltiples semestres
                if (folder?.tipo === 'semestre' && semestres.size > 0) {
                    const semestresList = Array.from(semestres).sort((a, b) => parseInt(a) - parseInt(b));

                    if (semestresList.length > 1) {
                        const nuevoNombre = `Semestre ${semestresList.join(' y ')}`;
                        await foldersAPI.updateFolder(parseInt(id), nuevoNombre);
                        console.log('✅ Nombre actualizado a:', nuevoNombre);
                    } else if (semestresList.length === 1) {
                        const nuevoNombre = `Semestre ${semestresList[0]}`;
                        await foldersAPI.updateFolder(parseInt(id), nuevoNombre);
                        console.log('✅ Nombre restaurado a:', nuevoNombre);
                    }
                }
            }

            setShowAddNotesModal(false);
            setSelectedNotes([]);
            setFilterText("");

            await loadFolderContent();
            await loadAvailableNotes();

        } catch (err) {
            console.error('Error añadiendo apuntes:', err);
            setErrorMsg("Error al añadir apuntes");
        }
    };

    const handleDeleteFolder = async (carpetaId) => {
        try {
            setErrorMsg("");
            await foldersAPI.deleteFolder(carpetaId);
            loadFolderContent();
        } catch (err) {
            console.error('Error eliminando carpeta:', err);
            setErrorMsg("Error al eliminar carpeta");
        }
    };

    const handleRenameFolder = async (carpetaId, nuevoNombre) => {
        try {
            setErrorMsg("");
            await foldersAPI.updateFolder(carpetaId, nuevoNombre);
            loadFolderContent();
        } catch (err) {
            console.error('Error renombrando carpeta:', err);
            setErrorMsg("Error al renombrar carpeta");
        }
    };

    // ✅ OPTIMIZADO: Menos queries
    const loadFolderContent = async () => {
        try {
            setLoading(true);
            setErrorMsg("");

            const { data: allFolders } = await foldersAPI.getMyFolders();
            const currentFolder = allFolders?.find(f => f.id_carpeta === parseInt(id));

            if (!currentFolder) {
                setErrorMsg("Carpeta no encontrada");
                return;
            }

            setFolder(currentFolder);

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

            const childFolders = (allFolders || []).filter(f => f.parent_id === parseInt(id));

            // ✅ Query única para todas las subcarpetas
            const childFolderIds = childFolders.map(f => f.id_carpeta);
            let allNotesInSubfolders = [];

            if (childFolderIds.length > 0) {
                const { data } = await supabase
                    .from('apunte_en_carpeta')
                    .select('carpeta_id, compra_id')
                    .in('carpeta_id', childFolderIds);
                allNotesInSubfolders = data || [];
            }

            // Agrupar y contar
            const notesPerFolder = {};
            allNotesInSubfolders.forEach(n => {
                if (!notesPerFolder[n.carpeta_id]) notesPerFolder[n.carpeta_id] = [];
                notesPerFolder[n.carpeta_id].push(n.compra_id);
            });

            // Calcular semestres para subcarpetas
            const compraIdsAll = [...new Set(allNotesInSubfolders.map(n => n.compra_id))];
            let comprasWithMaterias = [];

            if (compraIdsAll.length > 0) {
                const { data } = await supabase
                    .from('compra_apunte')
                    .select(`id, apunte_id, apunte:apunte(materia:id_materia(semestre))`)
                    .in('id', compraIdsAll);
                comprasWithMaterias = data || [];
            }

            for (const subfolder of childFolders) {
                const notesInFolder = notesPerFolder[subfolder.id_carpeta] || [];
                const childCount = allFolders.filter(c => c.parent_id === subfolder.id_carpeta).length;

                const semestres = new Set();
                notesInFolder.forEach(compraId => {
                    const compra = comprasWithMaterias.find(c => c.id === compraId);
                    const sem = compra?.apunte?.materia?.semestre;
                    if (sem) semestres.add(sem);
                });

                subfolder.item_count = notesInFolder.length + childCount;
                subfolder.semestres = Array.from(semestres);
            }

            setSubfolders(childFolders);

            // Obtener apuntes de esta carpeta
            const { data: notesInFolder } = await foldersAPI.getNotesInFolder(parseInt(id));

            if (!notesInFolder?.length) {
                setNotes([]);
                return;
            }

            const compraIds = notesInFolder.map(n => n.compra_id).filter(Boolean);

            const { data: compras } = await supabase
                .from("compra_apunte")
                .select(`id, apunte_id, creado_en`)
                .in("id", compraIds);

            if (!compras?.length) {
                setNotes([]);
                return;
            }

            const apIds = compras.map(c => c.apunte_id).filter(Boolean);

            const { data: apuntes } = await supabase
                .from("apunte")
                .select(`
                    id_apunte,
                    titulo,
                    descripcion,
                    creditos,
                    estrellas,
                    file_path,
                    file_name,
                    thumbnail_path, 
                    materia:id_materia(id_materia, nombre_materia),
                    usuario:id_usuario(nombre)
                `)
                .in("id_apunte", apIds);

            const urls = {};
            const thumbnailUrls = {};
            if (apuntes?.length > 0) {
                for (const apunte of apuntes) {
                    if (apunte.file_path) {
                        const { data: signedData } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(apunte.file_path, 3600);

                        if (signedData) {
                            urls[apunte.id_apunte] = signedData.signedUrl;
                        }
                    }

                }

            }

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
                    usuario: apunte?.usuario || { nombre: "Anónimo" },
                    materia: apunte?.materia || { nombre_materia: "Sin materia" },
                    signedUrl: urls[compra?.apunte_id] || null,
                    thumbnail_path: apunte?.thumbnail_path || null,
                    file_name: apunte?.file_name || null,
                    agregado_en: nif.agregado_en
                };
            });

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
        setDraggedItem({ ...item, type });
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
                await foldersAPI.moveFolder(
                    draggedItem.id_carpeta,
                    targetFolder.id_carpeta,
                    0
                );
            } else if (draggedItem.type === 'note') {
                const compraId = draggedItem.compra_id;

                // ✅ Verificar si ya existe en la carpeta destino
                const { data: existsCheck } = await supabase
                    .from('apunte_en_carpeta')
                    .select('id')
                    .eq('carpeta_id', targetFolder.id_carpeta)
                    .eq('compra_id', compraId)
                    .maybeSingle();

                // Solo agregar si NO existe
                if (!existsCheck) {
                    await foldersAPI.addNoteToFolder(targetFolder.id_carpeta, compraId);
                } else {
                    console.log('⚠️ Apunte ya existe en la carpeta destino');
                }

                // Remover de carpeta actual
                await foldersAPI.removeNoteFromFolder(parseInt(id), compraId);
            }

            loadFolderContent();
            loadAvailableNotes();
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

    // ✅ NUEVO: Filtrar apuntes disponibles
    const filteredAvailableNotes = availableNotes.filter(note => {
        const searchText = normalizeText(filterText);
        return normalizeText(note.titulo).includes(searchText) ||
            normalizeText(note.materia).includes(searchText);
    });

    if (loading) {
        return (
            <div style={{
                minHeight: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #f3f4f6",
                    borderTop: "3px solid #2563eb",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "#6b7280", margin: 0 }}>Cargando carpeta...</p>
            </div>
        );
    }

    const allItems = [
        ...subfolders.map(f => ({ ...f, itemType: 'folder' })),
        ...notes.map(n => ({ ...n, itemType: 'note' }))
    ];

    return (
        <div style={{ width: "min(1200px, 92vw)", margin: "0 auto", padding: "32px 0" }}>
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
            </div>

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
                    <h1 style={{ margin: "0 0 8px 0" }}>{folder?.nombre}</h1>
                    <p style={{ color: "#6b7280", margin: 0 }}>
                        {allItems.length} elemento{allItems.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => setShowCreateFolderModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '9px 18px',
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 14,
                            background: 'white',
                            border: '1px solid #dbdbdb',
                            color: '#262626',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            minHeight: 38
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fafafa';
                            e.currentTarget.style.borderColor = '#a8a8a8';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#dbdbdb';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ flexShrink: 0 }}
                        >
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            <line x1="12" y1="11" x2="12" y2="17"/>
                            <line x1="9" y1="14" x2="15" y2="14"/>
                        </svg>
                        <span>Crear subcarpeta</span>
                    </button>

                    <button
                        onClick={() => setShowAddNotesModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '9px 18px',
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 14,
                            background: '#0095f6',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            minHeight: 38,
                            boxShadow: '0 1px 2px rgba(0, 149, 246, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1877f2';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 149, 246, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#0095f6';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 149, 246, 0.15)';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ flexShrink: 0 }}
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="12" y1="11" x2="12" y2="17"/>
                            <line x1="9" y1="14" x2="15" y2="14"/>
                        </svg>
                        <span>Añadir apuntes</span>
                    </button>
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
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={() => setShowCreateFolderModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '10px 20px',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: 14,
                                background: 'white',
                                border: '1px solid #dbdbdb',
                                color: '#262626',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                minHeight: 40
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#fafafa';
                                e.currentTarget.style.borderColor = '#a8a8a8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#dbdbdb';
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ flexShrink: 0 }}
                            >
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                <line x1="12" y1="11" x2="12" y2="17"/>
                                <line x1="9" y1="14" x2="15" y2="14"/>
                            </svg>
                            <span>Crear subcarpeta</span>
                        </button>

                        <button
                            onClick={() => setShowAddNotesModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '10px 20px',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: 14,
                                background: '#0095f6',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                minHeight: 40,
                                boxShadow: '0 1px 3px rgba(0, 149, 246, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1877f2';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 149, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#0095f6';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 149, 246, 0.2)';
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ flexShrink: 0 }}
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="11" x2="12" y2="17"/>
                                <line x1="9" y1="14" x2="15" y2="14"/>
                            </svg>
                            <span>Añadir apuntes</span>
                        </button>
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
                                    semestres={item.semestres}
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
                                    <ApunteCard note={item} />
                                </div>
                            );
                        }
                    })}
                </div>
            )}

            {/* Modal crear subcarpeta */}
            {showCreateFolderModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        style={{
                            maxWidth: 480,
                            width: '100%',
                            padding: 32,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 20
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24
                            }}>
                                📁
                            </div>
                            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                                Crear subcarpeta
                            </h2>
                        </div>

                        <p style={{
                            color: '#6b7280',
                            margin: '0 0 20px 0',
                            fontSize: 14,
                            lineHeight: 1.5
                        }}>
                            Organizá tus apuntes dentro de esta carpeta
                        </p>

                        {/* Tipo de carpeta */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: 12
                            }}>
                                Tipo de carpeta
                            </label>
                            <div style={{ display: 'flex', gap: 12 }}>
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
                                        padding: '12px 16px',
                                        border: newFolderType === "materia" ? '2px solid #059669' : '2px solid #e5e7eb',
                                        borderRadius: 8,
                                        background: newFolderType === "materia" ? '#d1fae5' : 'white',
                                        color: newFolderType === "materia" ? '#059669' : '#6b7280',
                                        cursor: 'pointer',
                                        fontWeight: newFolderType === "materia" ? 600 : 400,
                                        fontSize: 14,
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 4
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
                                        padding: '12px 16px',
                                        border: newFolderType === "personalizada" ? '2px solid #2563eb' : '2px solid #e5e7eb',
                                        borderRadius: 8,
                                        background: newFolderType === "personalizada" ? '#dbeafe' : 'white',
                                        color: newFolderType === "personalizada" ? '#2563eb' : '#6b7280',
                                        cursor: 'pointer',
                                        fontWeight: newFolderType === "personalizada" ? 600 : 400,
                                        fontSize: 14,
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 7h-9M14 17H5M17 3v18M7 7v10" />
                                    </svg>
                                    Personalizada
                                </button>
                            </div>
                        </div>

                        {/* Input de materia o nombre según tipo */}
                        {newFolderType === "materia" ? (
                            <div style={{ marginBottom: 24, position: 'relative' }} ref={dropdownRef}>
                                <label style={{
                                    display: 'block',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#374151',
                                    marginBottom: 8
                                }}>
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
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 8,
                                        fontSize: 15,
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    autoFocus
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
                                                    borderBottom: '1px solid #f3f4f6'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                                onMouseLeave={(e) => e.target.style.background = '#fff'}
                                            >
                                                <div style={{ fontWeight: 500 }}>{materia.nombre_materia}</div>
                                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                                    Semestre {materia.semestre}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ marginBottom: 24 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#374151',
                                    marginBottom: 8
                                }}>
                                    Nombre de la carpeta
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Mis favoritos, Para el final..."
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && newFolderName.trim()) {
                                            handleCreateSubfolder();
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 8,
                                        fontSize: 15,
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
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
                                    padding: '12px 20px',
                                    background: 'white',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateSubfolder}
                                disabled={!newFolderName.trim()}
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    background: !newFolderName.trim() ? '#d1d5db' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: !newFolderName.trim() ? 'not-allowed' : 'pointer',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (newFolderName.trim()) e.target.style.background = '#1d4ed8';
                                }}
                                onMouseLeave={(e) => {
                                    if (newFolderName.trim()) e.target.style.background = '#2563eb';
                                }}
                            >
                                Crear subcarpeta
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal añadir apuntes CON FILTRO */}
            {showAddNotesModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 16
                    }}
                    onClick={() => {
                        setShowAddNotesModal(false);
                        setSelectedNotes([]);
                        setFilterText("");
                    }}
                >
                    <Card
                        style={{
                            maxWidth: 600,
                            width: '100%',
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: 32, borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 12
                            }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 24
                                }}>
                                    📝
                                </div>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                                    Añadir apuntes
                                </h2>
                            </div>
                            <p style={{
                                color: '#6b7280',
                                margin: '0 0 16px 0',
                                fontSize: 14
                            }}>
                                Seleccioná los apuntes que querés agregar a esta carpeta
                            </p>

                            {/* ✅ NUEVO: Input de filtro */}
                            <input
                                type="text"
                                placeholder="Buscar por nombre o materia..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        <div style={{
                            padding: 24,
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {filteredAvailableNotes.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#6b7280'
                                }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                                        {filterText ? '🔍' : '📭'}
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 500 }}>
                                        {filterText ? 'No se encontraron resultados' : 'No hay apuntes disponibles para agregar'}
                                    </p>
                                    <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
                                        {!filterText && 'Todos tus apuntes ya están en esta carpeta'}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {filteredAvailableNotes.map((note) => {
                                        const isSelected = selectedNotes.includes(note.id);
                                        return (
                                            <div
                                                key={note.id}
                                                onClick={() => toggleNoteSelection(note.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 16,
                                                    padding: 16,
                                                    border: isSelected ? '2px solid #2563eb' : '2px solid #e5e7eb',
                                                    borderRadius: 12,
                                                    cursor: 'pointer',
                                                    background: isSelected ? '#f0f9ff' : 'white',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#d1d5db';
                                                        e.currentTarget.style.background = '#f9fafb';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                        e.currentTarget.style.background = 'white';
                                                    }
                                                }}
                                            >
                                                {/* Círculo de selección */}
                                                <div style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    border: isSelected ? '2px solid #2563eb' : '2px solid #d1d5db',
                                                    background: isSelected ? '#2563eb' : 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    transition: 'all 0.2s',
                                                    marginTop: 2
                                                }}>
                                                    {isSelected && (
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="white"
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* Información del apunte */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{
                                                        margin: '0 0 6px 0',
                                                        fontSize: 15,
                                                        fontWeight: 600,
                                                        color: '#111827',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {note.titulo}
                                                    </h4>
                                                    <p style={{
                                                        margin: '0 0 6px 0',
                                                        fontSize: 13,
                                                        color: '#6b7280',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {note.descripcion || 'Sin descripción'}
                                                    </p>
                                                    <div style={{
                                                        display: 'inline-block',
                                                        padding: '4px 8px',
                                                        background: '#f3f4f6',
                                                        borderRadius: 6,
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        color: '#374151'
                                                    }}>
                                                        {note.materia}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: 24,
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12
                        }}>
                            <div style={{ fontSize: 14, color: '#6b7280' }}>
                                {selectedNotes.length > 0 && (
                                    <span style={{ fontWeight: 600, color: '#2563eb' }}>
                                        {selectedNotes.length} seleccionado{selectedNotes.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => {
                                        setShowAddNotesModal(false);
                                        setSelectedNotes([]);
                                        setFilterText("");
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'white',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                    onMouseLeave={(e) => e.target.style.background = 'white'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddNotes}
                                    disabled={selectedNotes.length === 0}
                                    style={{
                                        padding: '10px 20px',
                                        background: selectedNotes.length === 0 ? '#d1d5db' : '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 8,
                                        cursor: selectedNotes.length === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedNotes.length > 0) e.target.style.background = '#1d4ed8';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedNotes.length > 0) e.target.style.background = '#2563eb';
                                    }}
                                >
                                    Añadir {selectedNotes.length > 0 ? `(${selectedNotes.length})` : ''}
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}