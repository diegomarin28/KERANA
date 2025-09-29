import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { subjectsAPI } from '../api/Database'

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

            if (error) {
                setError('Error cargando asignaturas: ' + error.message)
            } else {
                setSubjects(data || [])
            }
        } catch (err) {
            setError('Error conectando con la base de datos')
        }

        setLoading(false)
    }

    // Agrupar materias por semestre
    const subjectsBySemester = subjects.reduce((acc, subject) => {
        const sem = subject.semestre || 'Sin semestre'
        if (!acc[sem]) acc[sem] = []
        acc[sem].push(subject)
        return acc
    }, {})

    // Filtrar materias
    const filteredSubjects = subjects.filter(subject => {
        const matchesSemester = selectedSemester === 'all' || subject.semestre == selectedSemester
        const matchesSearch = subject.nombre_materia.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSemester && matchesSearch
    })

    // Obtener semestres únicos
    const semesters = [...new Set(subjects.map(s => s.semestre))].sort()

    const handleSubjectClick = (subjectId) => {
        navigate(`/search?subject=${subjectId}`)
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <p>Cargando asignaturas...</p>
            </div>
        )
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '40px',
                borderRadius: '12px',
                marginBottom: '30px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    margin: '0 0 10px 0',
                    fontSize: '2.5rem',
                    color: '#1e293b'
                }}>
                    Asignaturas
                </h1>
                <p style={{
                    color: '#64748b',
                    fontSize: '1.1rem',
                    margin: 0
                }}>
                    Explora todas las materias disponibles - {subjects.length} asignaturas
                </p>
            </div>

            {error && (
                <div style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #fecaca'
                }}>
                    {error}
                </div>
            )}

            {/* Controles */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '30px',
                flexWrap: 'wrap'
            }}>
                <input
                    type="text"
                    placeholder="Buscar materia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: '1',
                        minWidth: '250px',
                        padding: '10px 15px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem'
                    }}
                />

                <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">Todos los semestres</option>
                    {semesters.map(sem => (
                        <option key={sem} value={sem}>
                            Semestre {sem}
                        </option>
                    ))}
                </select>

                {(searchTerm || selectedSemester !== 'all') && (
                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setSelectedSemester('all')
                        }}
                        style={{
                            padding: '10px 15px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Vista por semestres */}
            {selectedSemester === 'all' && !searchTerm ? (
                <div>
                    {semesters.map(semester => (
                        <div key={semester} style={{ marginBottom: '40px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                marginBottom: '20px',
                                paddingBottom: '10px',
                                borderBottom: '2px solid #e5e7eb'
                            }}>
                                <div style={{
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontWeight: '700',
                                    fontSize: '1.1rem'
                                }}>
                                    Semestre {semester}
                                </div>
                                <div style={{ color: '#6b7280' }}>
                                    {subjectsBySemester[semester]?.length || 0} materias
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '15px'
                            }}>
                                {subjectsBySemester[semester]?.map(subject => (
                                    <SubjectCard
                                        key={subject.id_materia}
                                        subject={subject}
                                        onClick={() => handleSubjectClick(subject.id_materia)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Vista filtrada
                <div>
                    <div style={{
                        marginBottom: '20px',
                        color: '#6b7280',
                        fontSize: '0.9rem'
                    }}>
                        Mostrando {filteredSubjects.length} materia{filteredSubjects.length !== 1 ? 's' : ''}
                    </div>

                    {filteredSubjects.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#6b7280'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
                            <h3>No se encontraron materias</h3>
                            <p>Intenta con otros términos de búsqueda</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '15px'
                        }}>
                            {filteredSubjects.map(subject => (
                                <SubjectCard
                                    key={subject.id_materia}
                                    subject={subject}
                                    onClick={() => handleSubjectClick(subject.id_materia)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Componente de tarjeta de materia
function SubjectCard({ subject, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                e.currentTarget.style.borderColor = '#2563eb'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = '#e5e7eb'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px'
            }}>
                <div style={{
                    fontSize: '2rem'
                }}>
                    📚
                </div>
                <h3 style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    lineHeight: '1.3'
                }}>
                    {subject.nombre_materia}
                </h3>
            </div>

            <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '0.85rem',
                color: '#6b7280',
                marginBottom: '15px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📄 {subject.total_apuntes || 0} apuntes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    👨‍🏫 {subject.total_profesores || 0} profes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🎯 {subject.total_mentores || 0} mentores
                </div>
            </div>

            <div style={{
                padding: '8px 0',
                borderTop: '1px solid #f3f4f6',
                fontSize: '0.85rem',
                color: '#2563eb',
                fontWeight: '600',
                textAlign: 'center'
            }}>
                Ver contenido →
            </div>
        </div>
    )
}