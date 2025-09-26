// src/pages/SearchCourses.jsx
import { useEffect, useState } from 'react'
import { courseAPI, favoritesAPI, subjectsAPI } from '../api/Database'
import CourseCard from '../components/CourseCard'

export default function SearchCourses() {
    const [selectedSubject, setSelectedSubject] = useState(null) // id de materia
    const [sortBy, setSortBy] = useState(null)
    const [courses, setCourses] = useState([])
    const [subjects, setSubjects] = useState([]) // Lista de materias
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Cargar materias al iniciar
    useEffect(() => {
        loadSubjects()
        runSearch() // Búsqueda inicial
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadSubjects = async () => {
        const { data, error } = await subjectsAPI.getAllSubjects()
        if (error) {
            console.error('Error cargando materias:', error.message)
        } else {
            setSubjects(data || [])
        }
    }

    const runSearch = async () => {
        setLoading(true)
        setErrorMsg('')

        const { data, error } = await courseAPI.searchCourses({
            materia: selectedSubject,     // id de materia seleccionada
            maxPrice: null,               // sin límite de precio por defecto
            modalidad: null,              // todas las modalidades
            sortBy
        })

        if (error) {
            setErrorMsg(error.message || 'Error buscando cursos')
        } else {
            setCourses(data || [])
        }
        setLoading(false)
    }

    const addToFav = async (courseId) => {
        const { error } = await favoritesAPI.addToFavorites(courseId)
        if (error) {
            alert(error.message || 'No se pudo agregar a favoritos')
        } else {
            alert('¡Agregado a favoritos!')
        }
    }

    return (
        <div className="container" style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
            <h1>Buscar cursos</h1>

            <div style={{ display: 'flex', gap: 8, marginBlock: 12 }}>
                <select
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(e.target.value || null)}
                >
                    <option value="">Todas las materias</option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.nombre}
                        </option>
                    ))}
                </select>

                <select value={sortBy || ''} onChange={(e) => setSortBy(e.target.value || null)}>
                    <option value="">Ordenar</option>
                    <option value="price_asc">Precio ↑</option>
                    <option value="price_desc">Precio ↓</option>
                </select>

                <button onClick={runSearch}>Buscar</button>
            </div>

            {loading && <p>Cargando...</p>}
            {errorMsg && <p style={{ color: 'crimson' }}>{errorMsg}</p>}

            <div style={{ display: 'grid', gap: 12 }}>
                {courses?.map((c) => (
                    <CourseCard
                        key={c.id}
                        course={c}
                        onFav={() => addToFav(c.id)}
                    />
                ))}
                {!loading && courses?.length === 0 && <p>No hay resultados.</p>}
            </div>
        </div>
    )
}