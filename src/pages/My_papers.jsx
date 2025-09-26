import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function My_papers() {
    const [favoriteNotes, setFavoriteNotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => { loadFavoriteNotes() }, [])

    const loadFavoriteNotes = async () => {
        setLoading(true)
        setError('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setFavoriteNotes([])
                setLoading(false)
                return
            }

            // Trae favoritos del usuario con joins útiles
            const { data, error } = await supabase
                .from('apunte_fav')
                .select(`
          id,
          apunte(
            id,
            titulo,
            descripcion,
            file_url,
            file_name,
            tags,
            profesor_curso(
              id,
              usuario(nombre),
              materia(nombre)
            )
          )
        `)
                .eq('usuario_id', user.id)
                .order('id', { ascending: false })

            if (error) throw error

            // Normalizo para el render
            const mapped = (data || [])
                .filter(row => row.apunte)
                .map(row => {
                    const a = row.apunte
                    return {
                        favId: row.id,
                        id: a.id,
                        titulo: a.titulo || a.file_name,
                        descripcion: a.descripcion || '',
                        fileUrl: a.file_url || '',
                        fileName: a.file_name || '',
                        tags: a.tags || [],
                        materiaNombre: a.profesor_curso?.materia?.nombre || 'Materia',
                        autorNombre: a.profesor_curso?.usuario?.nombre || 'Autor'
                    }
                })

            setFavoriteNotes(mapped)
        } catch (err) {
            console.error(err)
            setError('Error cargando tus apuntes favoritos')
        }
        setLoading(false)
    }

    const removeFromFavorites = async (noteId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return alert('Debes iniciar sesión')

            const { error } = await supabase
                .from('apunte_fav')
                .delete()
                .eq('usuario_id', user.id)
                .eq('apunte_id', noteId)

            if (error) throw error
            setFavoriteNotes(prev => prev.filter(n => n.id !== noteId))
        } catch (err) {
            console.error(err)
            alert('Error eliminando de favoritos')
        }
    }

    const downloadNote = (note) => {
        if (note.fileUrl) {
            window.open(note.fileUrl, '_blank')
        } else {
            alert(`No hay archivo para: ${note.titulo}`)
        }
    }

    if (loading) {
        return <div style={{ padding: 20, textAlign: 'center' }}><p>Cargando tus apuntes favoritos…</p></div>
    }

    return (
        <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#f8f9fa', padding: 30, borderRadius: 12, marginBottom: 30, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 10 }}>📚</div>
                <h1 style={{ margin: 0 }}>Mis Apuntes Favoritos</h1>
                <p style={{ color: '#6b7280' }}>Todos los apuntes que guardaste para consultar más tarde</p>
            </div>

            {error && (
                <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: 15, borderRadius: 8, border: '1px solid #fecaca', marginBottom: 20 }}>
                    {error}
                </div>
            )}

            {favoriteNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 20 }}>❤️</div>
                    <h3 style={{ marginBottom: 10, color: '#374151' }}>No tienes apuntes favoritos aún</h3>
                    <p style={{ color: '#6b7280', marginBottom: 20 }}>Explorá apuntes y agregalos a favoritos para encontrarlos fácilmente</p>
                    <button
                        onClick={() => (window.location.href = '/search')}
                        style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                    >
                        Buscar Apuntes
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2>Mis Favoritos ({favoriteNotes.length})</h2>
                        <button onClick={loadFavoriteNotes} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
                            🔄 Actualizar
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                        {favoriteNotes.map(note => (
                            <div key={note.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <button
                                    onClick={() => removeFromFavorites(note.id)}
                                    style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: 5, borderRadius: 4 }}
                                    title="Remover de favoritos"
                                >
                                    💔
                                </button>

                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', lineHeight: 1.3 }}>
                                    {note.titulo}
                                </h3>

                                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#e0f2fe', color: '#0277bd', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
                    📚 {note.materiaNombre}
                  </span>
                                    <span style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
                    📄 PDF
                  </span>
                                </div>

                                {note.descripcion && (
                                    <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.4, marginBottom: 10 }}>
                                        {note.descripcion.length > 100 ? note.descripcion.substring(0, 100) + '…' : note.descripcion}
                                    </p>
                                )}

                                {note.tags && note.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 15 }}>
                                        {note.tags.slice(0, 3).map(tag => (
                                            <span key={tag} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 999, padding: '2px 10px', fontSize: 12 }}>
                        #{tag}
                      </span>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => downloadNote(note)} style={{ padding: '8px 12px', borderRadius: 6, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>
                                        ⬇️ Descargar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
