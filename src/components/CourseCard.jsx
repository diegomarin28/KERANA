import { Link } from "react-router-dom"
import { favoritesAPI } from "../api/database"

export default function CourseCard({ course, onFav }) {
    const nombreDocente = course?.usuario?.nombre ?? "Docente"
    const nombreMateria = course?.materia?.nombre ?? "Materia"
    const precio = course?.precio ?? 0
    const modalidad = course?.modalidad ?? "—"
    const rating = course?.califica?.length
        ? (course.califica.reduce((a, c) => a + c.puntuacion, 0) / course.califica.length).toFixed(1)
        : "—"

    const addToFav = async () => {
        const { error } = await favoritesAPI.addToFavorites(course.id)
        if (error) alert(error.message || "No se pudo agregar a favoritos")
        else alert("¡Agregado a favoritos!")
        if (onFav) onFav(course.id)
    }

    return (
        <div style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
        }}>
            <div>
                <Link to={`/cursos/${course.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h3 style={{ margin: 0 }}>{nombreMateria}</h3>
                </Link>
                <p style={{ margin: "4px 0" }}>
                    {nombreDocente} · {modalidad} · ⭐ {rating} · ${precio}
                </p>
            </div>
            <button onClick={addToFav}>⭐</button>
        </div>
    )
}
