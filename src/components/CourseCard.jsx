import { Link } from "react-router-dom"
import { favoritesAPI } from "../api/database"

export default function CourseCard({ course, onFav }) {
    const getTipoIcon = (tipo) => {
        switch(tipo) {
            case 'apunte': return '📄'
            case 'profesor': return '👨‍🏫'
            case 'mentor': return '🎯'
            case 'materia': return '📚'
            default: return '📖'
        }
    }

    const getTipoColor = (tipo) => {
        switch(tipo) {
            case 'apunte': return '#059669'
            case 'profesor': return '#2563eb'
            case 'mentor': return '#7c3aed'
            case 'materia': return '#ea580c'
            default: return '#6b7280'
        }
    }

    return (
        <div style={{
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>{getTipoIcon(course.tipo)}</span>
                    <span style={{
                        backgroundColor: getTipoColor(course.tipo),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                    }}>
                        {course.tipo?.toUpperCase()}
                    </span>
                </div>

                <h3 style={{ margin: '0 0 4px 0' }}>{course.titulo}</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                    {course.subtitulo}
                </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                {course.tipo !== 'materia' && (
                    <button onClick={onFav} style={{
                        background: 'none',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer'
                    }}>
                        🤍
                    </button>
                )}
                <button style={{
                    backgroundColor: getTipoColor(course.tipo),
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}>
                    Ver
                </button>
            </div>
        </div>
    )
}