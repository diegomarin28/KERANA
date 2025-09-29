import { useEffect, useState } from "react";
import { favoritesAPI, subjectsAPI } from "../api/database";
import CourseCard from "../components/CourseCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";

export default function CourseSearch() {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [modality, setModality] = useState("");      // 'online' | 'presencial' | ''
    const [maxPrice, setMaxPrice] = useState("");      // number | ''
    const [sortBy, setSortBy] = useState("");          // 'price_asc' | 'price_desc' | ''
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        (async () => {
            const { data } = await subjectsAPI.getAllSubjects();
            setSubjects(data || []);
        })();
    }, []);

    const runSearch = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const { data, error } = await courseAPI.searchCourses({
                materia: selectedSubject || undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                modalidad: modality || undefined,
                sortBy: sortBy || undefined,
            });
            if (error) throw error;
            setCourses(data || []);
        } catch (e) {
            setErrorMsg(e.message || "Error buscando cursos");
        }
        setLoading(false);
    };

    useEffect(() => {
        runSearch(); // carga inicial
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addToFav = async (courseId) => {
        const { error } = await favoritesAPI.addToFavorites(courseId);
        if (error) alert(error.message || "No se pudo agregar a favoritos");
        else alert("¡Agregado a favoritos!");
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <h1 style={{ margin: 0 }}>Búsqueda de cursos</h1>
                <Chip tone="blue">{courses.length} resultados</Chip>
            </div>

            {/* Filtros */}
            <Card style={{ marginBottom: 16 }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                        alignItems: "end",
                    }}
                >
                    <div>
                        <label style={{ display: "block", marginBottom: 6 }}>Materia</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                            }}
                        >
                            <option value="">Todas</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: 6 }}>Modalidad</label>
                        <select
                            value={modality}
                            onChange={(e) => setModality(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                            }}
                        >
                            <option value="">Todas</option>
                            <option value="online">Online</option>
                            <option value="presencial">Presencial</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: 6 }}>Precio máx (UYU)</label>
                        <input
                            type="number"
                            min="0"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="Ej: 1200"
                            style={{
                                width: "100%",
                                height: 44,
                                padding: "0 10px",
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: 6 }}>Orden</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                            }}
                        >
                            <option value="">Sin ordenar</option>
                            <option value="price_asc">Precio ↑</option>
                            <option value="price_desc">Precio ↓</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <Button onClick={runSearch} variant="secondary">
                            Buscar
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSelectedSubject("");
                                setModality("");
                                setMaxPrice("");
                                setSortBy("");
                                runSearch();
                            }}
                        >
                            Limpiar
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Resultados */}
            {loading && <div>Cargando…</div>}
            {errorMsg && <div style={{ color: "#b91c1c", marginBottom: 8 }}>{errorMsg}</div>}

            <div style={{ display: "grid", gap: 12 }}>
                {courses.map((c) => (
                    <CourseCard key={c.id} course={c} onFav={() => addToFav(c.id)} />
                ))}
                {!loading && courses.length === 0 && <div>No hay resultados.</div>}
            </div>
        </div>
    );
}
