import { useParams } from "react-router-dom";
import { SUBJECTS } from "../data/subjects";
import ResultCard from "../components/ResultCard";

const demo = {
    profesores: [
        { id: 1, nombre: "Laura Pérez", materia: "Base de Datos I", rating: 4.6 },
        { id: 2, nombre: "Martín Silva", materia: "Algoritmos", rating: 4.2 },
    ],
    apuntes: [
        { id: 10, titulo: "BD1 – Modelo Relacional resumen", autor: "Ana R.", rating: 4.8 },
        { id: 11, titulo: "Algoritmos – Punteros", autor: "Julián M.", rating: 4.1 },
    ],
    mentores: [
        { id: 20, nombre: "Sofi L.", area: "BD1 / SQL", rating: 4.9 },
        { id: 21, nombre: "Nico T.", area: "Cálculo I", rating: 4.3 },
    ]
};

export default function CourseDetail() {
    const { id } = useParams();
    const course = SUBJECTS.find(s => s.id === id);

    if (!course) {
        return (
            <div className="container" style={{ padding: "36px 0" }}>
                <div className="empty">Curso no encontrado</div>
            </div>
        );
    }

    // Filtrar profesores que enseñan este curso
    const profesoresCurso = demo.profesores.filter(p =>
        p.materia.toLowerCase().includes(course.name.toLowerCase()) ||
        course.name.toLowerCase().includes(p.materia.toLowerCase().split(' ')[0])
    );

    // Filtrar apuntes relacionados con este curso
    const apuntesCurso = demo.apuntes.filter(a =>
        a.titulo.toLowerCase().includes(course.name.toLowerCase()) ||
        course.name.toLowerCase().includes(a.titulo.toLowerCase())
    );

    // Filtrar mentores de este curso
    const mentoresCurso = demo.mentores.filter(m =>
        m.area.toLowerCase().includes(course.name.toLowerCase()) ||
        course.name.toLowerCase().includes(m.area.toLowerCase())
    );

    const totalRating = 4.5; // Calcular promedio real en implementación final

    return (
        <div className="container" style={{ padding: "36px 0" }}>
            {/* Header del curso */}
            <div style={{
                marginBottom: "32px",
                padding: "24px",
                background: "var(--bg-secondary, #f8f9fa)",
                borderRadius: "12px",
                border: "1px solid var(--border, #e1e5e9)"
            }}>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "2rem" }}>{course.name}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        ⭐ {totalRating}
                    </span>
                    <span>{profesoresCurso.length} profesores</span>
                    <span>{apuntesCurso.length} apuntes</span>
                    <span>{mentoresCurso.length} mentores</span>
                </div>
                <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                    Encuentra profesores, apuntes y mentores para {course.name}
                </p>
            </div>

            {/* Profesores */}
            {profesoresCurso.length > 0 && (
                <section className="section">
                    <div className="section-title">
                        Profesores <span className="section-count">{profesoresCurso.length}</span>
                    </div>
                    <div className="grid">
                        {profesoresCurso.map(p => (
                            <ResultCard
                                key={p.id}
                                title={p.nombre}
                                subtitle={p.materia}
                                rating={p.rating}
                                pill="UM"
                                to={`/profesores/${p.id}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Apuntes */}
            {apuntesCurso.length > 0 && (
                <section className="section">
                    <div className="section-title">
                        Apuntes <span className="section-count">{apuntesCurso.length}</span>
                    </div>
                    <div className="grid">
                        {apuntesCurso.map(a => (
                            <ResultCard
                                key={a.id}
                                title={a.titulo}
                                subtitle={`Autor: ${a.autor}`}
                                rating={a.rating}
                                pill="PDF"
                                onClick={() => console.log("apunte", a.id)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Mentores */}
            {mentoresCurso.length > 0 && (
                <section className="section">
                    <div className="section-title">
                        Mentores <span className="section-count">{mentoresCurso.length}</span>
                    </div>
                    <div className="grid">
                        {mentoresCurso.map(m => (
                            <ResultCard
                                key={m.id}
                                title={m.nombre}
                                subtitle={m.area}
                                rating={m.rating}
                                pill="Tutor"
                                onClick={() => console.log("mentor", m.id)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Si no hay contenido */}
            {profesoresCurso.length === 0 && apuntesCurso.length === 0 && mentoresCurso.length === 0 && (
                <div className="empty">
                    Aún no hay contenido disponible para este curso.
                </div>
            )}
        </div>
    );
}