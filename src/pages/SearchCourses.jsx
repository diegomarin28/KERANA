// src/pages/SearchCourses.jsx
import { useEffect, useState } from 'react'
import { subjectsAPI, searchAPI, favoritesAPI } from '../api/Database'
import CourseCard from '../components/CourseCard'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'

export default function SearchCourses() {
    const [selectedSubject, setSelectedSubject] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [results, setResults] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [activeTab, setActiveTab] = useState('todo') // 'todo', 'materia', 'apunte', 'profesor', 'mentor'

    useEffect(() => {
        loadSubjects()
        loadInitialContent()
    }, [])

    const loadSubjects = async () => {
        const { data, error } = await subjectsAPI.getAllSubjectsSimple()
        if (error) {
            console.error('Error cargando materias:', error.message)
        } else {
            setSubjects(data || [])
        }
    }

    const loadInitialContent = async () => {
        setLoading(true)
        // Cargar todas las materias con sus conteos
        const { data, error } = await subjectsAPI.getAllSubjects()

        if (error) {
            setErrorMsg(error.message || 'Error cargando contenido')
        } else {
            // Convertir materias a formato de resultados
            const materiasConTipo = (data || []).map(m => ({
                ...m,
                tipo: 'materia',
                titulo: m.nombre_materia,
                subtitulo: `${m.total_apuntes} apuntes • ${m.total_profesores} profesores • ${m.total_mentores} mentores`
            }))
            setResults(materiasConTipo)
        }
        setLoading(false)
    }

    const handleSearch = async () => {
        if (!searchTerm.trim() && !selectedSubject) {
            loadInitialContent()
            return
        }

        setLoading(true)
        setErrorMsg('')

        try {
            if (selectedSubject && !searchTerm.trim()) {
                // Buscar por materia específica
                const content = await subjectsAPI.getSubjectContent(selectedSubject)

                const allResults = [
                    ...content.apuntes.map(a => ({
                        ...a,
                        tipo: 'apunte',
                        titulo: a.titulo,
                        subtitulo: 'Apunte'
                    })),
                    ...content.profesores.map(p => ({
                        ...p,
                        tipo: 'profesor',
                        titulo: `Prof. ${p.usuario?.nombre || 'Sin nombre'}`,
                        subtitulo: 'Profesor'
                    })),
                    ...content.mentores.map(m => ({
                        ...m.mentor,
                        tipo: 'mentor',
                        titulo: `Mentor ${m.mentor?.usuario?.nombre || 'Sin nombre'}`,
                        subtitulo: 'Mentor académico'
                    }))
                ]

                setResults(allResults)
            } else {
                // Búsqueda por texto
                const { data, error } = await searchAPI.searchAll(searchTerm)

                if (error) {
                    setErrorMsg(error)
                } else {
                    const allResults = [
                        ...data.materias,
                        ...data.apuntes,
                        ...data.profesores,
                        ...data.mentores
                    ]
                    setResults(allResults)
                }
            }
        } catch (error) {
            setErrorMsg('Error en la búsqueda: ' + error.message)
        }

        setLoading(false)
    }

    const addToFavorites = async (item) => {
        const { error } = await favoritesAPI.addToFavorites(item.id, item.tipo)
        if (error) {
            alert('Error: ' + error.message)
        } else {
            alert('¡Agregado a favoritos!')
        }
    }

    // Filtrar resultados por tipo
    const filteredResults = results.filter(item => {
        if (activeTab === 'todo') return true
        return item.tipo === activeTab || (activeTab === 'materias' && item.tipo === 'materia')
    })

    return (
        <div className="container" style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
            <h1 style={{ marginBottom: 8 }}>Buscar en Kerana</h1>
            <div style={{ marginBottom: 6, color: 'var(--muted)', fontSize: 14 }}>
                <Chip tone="blue">{results.length} resultados</Chip>
            </div>

            {/* Controles de búsqueda */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                        type="text"
                        placeholder="Buscar materias, apuntes, profesores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                        }}
                    />
                    <Button onClick={handleSearch} disabled={loading} variant="secondary">
                        {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <select
                        value={selectedSubject || ''}
                        onChange={(e) => setSelectedSubject(e.target.value || null)}
                        style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                        }}
                    >
                        <option value="">Todas las materias</option>
                        {subjects.map((subject) => (
                            <option key={subject.id_materia} value={subject.id_materia}>
                                {subject.nombre_materia}
                            </option>
                        ))}
                    </select>

                    <Button
                        onClick={() => {
                            setSearchTerm('')
                            setSelectedSubject(null)
                            loadInitialContent()
                        }}
                        variant="ghost"
                    >
                        Limpiar
                    </Button>
                </div>
            </div>

            {/* Tabs de filtro */}
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 16,
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: 8,
                    flexWrap: 'wrap',
                }}
            >
                {[
                    { key: 'todo', label: 'Todo', count: results.length },
                    { key: 'materia', label: 'Materias', count: results.filter(r => r.tipo === 'materia').length },
                    { key: 'apunte', label: 'Apuntes', count: results.filter(r => r.tipo === 'apunte').length },
                    { key: 'profesor', label: 'Profesores', count: results.filter(r => r.tipo === 'profesor').length },
                    { key: 'mentor', label: 'Mentores', count: results.filter(r => r.tipo === 'mentor').length }
                ].map(tab => (
                    <Button
                        key={tab.key}
                        variant={activeTab === tab.key ? 'secondary' : 'ghost'}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label} ({tab.count})
                    </Button>
                ))}
            </div>

            {/* Mensajes */}
            {loading && <p>Cargando...</p>}
            {errorMsg && <p style={{ color: 'crimson' }}>{errorMsg}</p>}

            {/* Resultados */}
            <div style={{ display: 'grid', gap: 12 }}>
                {filteredResults.map((item) => (
                    <CourseCard
                        key={`${item.tipo}-${item.id || item.id_materia}`}
                        course={item}
                        onFav={() => addToFavorites(item)}
                    />
                ))}
                {!loading && filteredResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                        <h3>No se encontraron resultados</h3>
                        <p>Intenta con otros términos de búsqueda</p>
                    </div>
                )}
            </div>
        </div>
    )
}
