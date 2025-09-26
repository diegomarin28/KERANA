import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { courseAPI, ratingsAPI } from "../api/Database";
import AuthModal_HacerReseña from "../components/AuthModal_HacerReseña";

function StarRow({ value=0 }) {
    return (
        <div aria-label={`Rating ${value}`} style={{ color:"#f8a415", fontWeight:700 }}>
            {"★".repeat(Math.round(value))}{"☆".repeat(5-Math.round(value))}
        </div>
    );
}

function Chip({ children }) {
    return (
        <span style={{
            background:"#eef2ff", color:"#475569", border:"1px solid #c7d2fe",
            padding:"4px 10px", borderRadius:9999, fontSize:12, fontWeight:700
        }}>{children}</span>
    );
}

export default function ProfessorDetail() {
    const { id } = useParams();
    const [professorCourse, setProfessorCourse] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showReviewModal, setShowReviewModal] = useState(false);

    useEffect(() => {
        loadProfessorData();
    }, [id]);

    const loadProfessorData = async () => {
        setLoading(true);
        setError("");

        try {
            // Cargar datos del curso/profesor
            const { data: courseData, error: courseError } = await courseAPI.getCourseById(id);

            if (courseError) {
                setError("Error cargando datos del profesor: " + courseError.message);
            } else if (courseData) {
                setProfessorCourse(courseData);

                // Cargar reseñas
                const { data: reviewsData } = await ratingsAPI.getCourseRatings(id);
                setReviews(reviewsData || []);
            } else {
                setError("Profesor no encontrado");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Error conectando con el servidor");
        }

        setLoading(false);
    };

    const handleNewReview = (newReview) => {
        // Agregar nueva reseña a la lista
        setReviews(prev => [newReview, ...prev]);

        // Recargar datos para actualizar promedio
        loadProfessorData();
    };

    const promedioRating = useMemo(() => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.puntuacion, 0);
        return Math.round((sum / reviews.length) * 10) / 10;
    }, [reviews]);

    if (loading) {
        return (
            <div className="container" style={{ padding: "18px 0 36px", textAlign: "center" }}>
                <p>Cargando información del profesor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{ padding: "18px 0 36px", textAlign: "center" }}>
                <div style={{ color: "#dc2626", padding: "20px" }}>
                    <h3>Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!professorCourse) {
        return (
            <div className="container" style={{ padding: "18px 0 36px", textAlign: "center" }}>
                <h3>Profesor no encontrado</h3>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: "18px 0 36px" }}>
            {/* Header del profesor */}
            <section style={{
                border:"1px solid var(--border)", borderRadius:12, padding:16, background:"#fff",
                display:"grid", gap:12
            }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                    <div style={{
                        width:56, height:56, borderRadius:"50%", background:"var(--accent)", color:"#fff",
                        display:"grid", placeItems:"center", fontWeight:800, fontSize:22
                    }}>
                        {professorCourse.usuario?.nombre?.[0] || "P"}
                    </div>
                    <div style={{ display:"grid" }}>
                        <h2 style={{ margin:0 }}>{professorCourse.usuario?.nombre || "Profesor"}</h2>
                        <div style={{ color:"var(--muted)", fontSize:14 }}>
                            {professorCourse.materia?.nombre} • {professorCourse.titulo}
                        </div>
                    </div>
                    <div style={{ marginLeft:"auto", textAlign:"right" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
                            <StarRow value={promedioRating} />
                            <strong>{promedioRating.toFixed(1)}</strong>
                        </div>
                        <div style={{ color:"var(--muted)", fontSize:12 }}>
                            {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                <p style={{ margin:0, color:"var(--fg)" }}>
                    {professorCourse.descripcion || "Información del curso no disponible."}
                </p>

                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <Chip>💰 ${professorCourse.precio}</Chip>
                    <Chip>📍 {professorCourse.modalidad}</Chip>
                    {professorCourse.duracion && <Chip>⏰ {professorCourse.duracion}</Chip>}
                    {professorCourse.nivel && <Chip>📊 {professorCourse.nivel}</Chip>}
                </div>

                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <button
                        className="btn-primary"
                        onClick={() => setShowReviewModal(true)}
                        style={{ background: "#059669" }}
                    >
                        Hacer reseña
                    </button>
                    <button
                        className="btn-primary"
                        style={{ background:"var(--accent)" }}
                        onClick={() => alert('Funcionalidad próximamente')}
                    >
                        Contactar profesor
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => alert(`Comprando curso: ${professorCourse.titulo}`)}
                    >
                        Comprar curso - ${professorCourse.precio}
                    </button>
                </div>
            </section>

            {/* Reseñas */}
            <section style={{ marginTop:20 }}>
                <h3 style={{ margin:"10px 0" }}>
                    Reseñas ({reviews.length})
                </h3>

                {reviews.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#6b7280',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        background: '#fff'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '15px' }}>💭</div>
                        <h4>Aún no hay reseñas</h4>
                        <p>Sé el primero en compartir tu experiencia con este profesor</p>
                        <button
                            onClick={() => setShowReviewModal(true)}
                            style={{
                                marginTop: '15px',
                                padding: '8px 16px',
                                backgroundColor: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Escribir primera reseña
                        </button>
                    </div>
                ) : (
                    <div style={{ display:"grid", gap:12 }}>
                        {reviews.map(r => (
                            <article key={r.id} style={{
                                border:"1px solid var(--border)", borderRadius:12, padding:14, background:"#fff"
                            }}>
                                <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                        <div style={{
                                            width:34, height:34, borderRadius:"50%", background:"#e2e8f0",
                                            display:"grid", placeItems:"center", fontWeight:800, color:"#334155"
                                        }}>
                                            {r.usuario?.nombre?.[0] || "U"}
                                        </div>
                                        <div style={{ display:"grid" }}>
                                            <strong style={{ margin:0 }}>
                                                {r.titulo || "Reseña sin título"}
                                            </strong>
                                            <span style={{ fontSize:12, color:"var(--muted)" }}>
                                                {r.usuario?.nombre || "Anónimo"} • {new Date(r.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <StarRow value={r.puntuacion} />
                                </div>
                                <p style={{ margin:"10px 0 0 0" }}>
                                    {r.comentario || "Sin comentario"}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal de reseña */}
            {showReviewModal && (
                <AuthModal_HacerReseña
                    open={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onSave={handleNewReview}
                    courseId={professorCourse.id}
                />
            )}
        </div>
    );
}