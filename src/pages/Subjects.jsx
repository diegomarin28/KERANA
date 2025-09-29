import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { subjectsAPI } from '../api/Database'
import { Chip } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function Subjects() {
    const navigate = useNavigate()
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedSemester, setSelectedSemester] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadSubjects()
    }, [])

    const loadSubjects = async () => {
        setLoading(true)
        setError('')
        try {
            const { data, error } = await subjectsAPI.getAllSubjects()
            if (error) setError('Error cargando asignaturas: ' + error.message)
            else setSubjects(data || [])
        } catch {
            setError('Error conectando con la base de datos')
        }
        setLoading(false)
    }

    const subjectsBySemester = subjects.reduce((acc, subject) => {
        const sem = subject.semestre || 'Sin semestre'
        if (!acc[sem]) acc[sem] = []
        acc[sem].push(subject)
        return acc
    }, {})

    const filteredSubjects = subjects.filter(subject => {
        const matchesSemester = selectedSemester === 'all' || subject.semestre == selectedSemester
        const matchesSearch = subject.nombre_materia.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSemester && matchesSearch
    })

    const semesters = [...new Set(subjects.map(s => s.semestre))].sort((a, b) => a - b)
    const handleSubjectClick = (id) => navigate(`/search?subject=${id}`)

    if (loading) return <p style={{ textAlign: 'center' }}>Cargando asignaturas...</p>

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 20 }}>
            <div style={{ marginBottom: 30, textAlign: 'center' }}>
                <h1>Asignaturas</h1>
                <p style={{ color: 'var(--muted)' }}>
                    Explora todas las materias disponibles – <Chip tone="blue">{subjects.length}</Chip>
                </p>
            </div>

            {error && <div style={{ color: 'crimson', marginBottom: 20 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginBottom: 30, flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Buscar materia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, minWidth: 250, padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
                    <option value="all">Todos los semestres</option>
                    {semesters.map(sem => <option key={sem} value={sem}>Semestre {sem}</option>)}
                </select>
                {(searchTerm || selectedSemester !== 'all') && (
                    <Button variant="ghost" onClick={() => { setSearchTerm(''); setSelectedSemester('all') }}>
                        Limpiar filtros
                    </Button>
                )}
            </div>

            {selectedSemester === 'all' && !searchTerm ? (
                semesters.map(sem => (
                    <div key={sem} style={{ marginBottom: 40 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <Chip tone="secondary">Semestre {sem}</Chip>
                            <span style={{ color: 'var(--muted)' }}>{subjectsBySemester[sem]?.length || 0} materias</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 15 }}>
                            {subjectsBySemester[sem]?.map(s => (
                                <Card key={s.id_materia} onClick={() => handleSubjectClick(s.id_materia)} style={{ cursor: 'pointer' }}>
                                    <h3 style={{ margin: 0 }}>{s.nombre_materia}</h3>
                                    <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>{s.total_apuntes} apuntes • {s.total_profesores} profes • {s.total_mentores} mentores</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <>
                    <p style={{ color: 'var(--muted)' }}>Mostrando {filteredSubjects.length} materias</p>
                    {filteredSubjects.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: 40 }}>No se encontraron materias</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 15 }}>
                            {filteredSubjects.map(s => (
                                <Card key={s.id_materia} onClick={() => handleSubjectClick(s.id_materia)} style={{ cursor: 'pointer' }}>
                                    <h3>{s.nombre_materia}</h3>
                                    <p style={{ color: 'var(--muted)', margin: 0 }}>{s.total_apuntes} apuntes • {s.total_profesores} profes • {s.total_mentores} mentores</p>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
