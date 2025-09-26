import { useState, useEffect } from 'react'
import { userAPI, purchaseAPI } from '../api/Database'

export default function Profile() {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState({
        nombre: '',
        telefono: '',
        bio: ''
    })
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [activeTab, setActiveTab] = useState('info')

    useEffect(() => {
        loadUserData()
    }, [])

    const loadUserData = async () => {
        setLoading(true)
        try {
            // Cargar perfil actual
            const { data: profileData, error: profileError } = await userAPI.getCurrentProfile()
            if (profileError) {
                console.error('Error cargando perfil:', profileError.message)
            } else if (profileData) {
                setProfile({
                    nombre: profileData.nombre || '',
                    telefono: profileData.telefono || '',
                    bio: profileData.bio || ''
                })
                setUser(profileData)
            }

            // Cargar compras
            const { data: purchasesData } = await purchaseAPI.getUserPurchases()
            setPurchases(purchasesData || [])
        } catch (error) {
            console.error('Error cargando datos:', error)
        }
        setLoading(false)
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        try {
            const { error } = await userAPI.updateProfile(profile)
            if (error) {
                setMessage('Error: ' + error.message)
            } else {
                setMessage('¡Perfil actualizado correctamente!')
                setTimeout(() => setMessage(''), 3000)
            }
        } catch (error) {
            setMessage('Error inesperado: ' + error.message)
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div style={{ padding: 20, textAlign: 'center' }}>
                <p>Cargando perfil...</p>
            </div>
        )
    }

    return (
        <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '30px',
                borderRadius: '12px',
                marginBottom: '30px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👤</div>
                <h1 style={{ margin: '0 0 10px 0' }}>
                    {profile.nombre || user?.email?.split('@')[0] || 'Usuario'}
                </h1>
                <p style={{ opacity: 0.9 }}>{user?.email}</p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                borderBottom: '2px solid #e5e7eb',
                marginBottom: '30px'
            }}>
                {[
                    { key: 'info', label: 'Información Personal' },
                    { key: 'purchases', label: `Compras (${purchases.length})` }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '12px 20px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            borderBottom: activeTab === tab.key ? '3px solid #2563eb' : '3px solid transparent',
                            color: activeTab === tab.key ? '#2563eb' : '#6b7280'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenido de tabs */}
            {activeTab === 'info' && (
                <div style={{
                    backgroundColor: '#fff',
                    padding: '30px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    <h2 style={{ marginBottom: '20px' }}>Información Personal</h2>

                    <form onSubmit={handleUpdateProfile}>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                    Nombre completo
                                </label>
                                <input
                                    type="text"
                                    value={profile.nombre}
                                    onChange={(e) => setProfile({...profile, nombre: e.target.value})}
                                    placeholder="Tu nombre completo"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={profile.telefono}
                                    onChange={(e) => setProfile({...profile, telefono: e.target.value})}
                                    placeholder="+598 99 123 456"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                    Biografía
                                </label>
                                <textarea
                                    value={profile.bio}
                                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                                    rows={4}
                                    placeholder="Contanos sobre ti, tus intereses académicos..."
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: saving ? '#9ca3af' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {saving ? 'Guardando...' : 'Actualizar Perfil'}
                            </button>
                        </div>
                    </form>

                    {message && (
                        <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: message.includes('Error') ? '#fef2f2' : '#f0fdf4',
                            color: message.includes('Error') ? '#dc2626' : '#059669',
                            borderRadius: '8px',
                            border: `1px solid ${message.includes('Error') ? '#fecaca' : '#bbf7d0'}`
                        }}>
                            {message}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'purchases' && (
                <div style={{
                    backgroundColor: '#fff',
                    padding: '30px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    <h2 style={{ marginBottom: '20px' }}>Mis Compras</h2>

                    {purchases.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛒</div>
                            <h3>Aún no has comprado cursos</h3>
                            <p>Explora nuestros cursos y encuentra el perfecto para ti</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {purchases.map(purchase => (
                                <div
                                    key={purchase.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '15px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0' }}>
                                            {purchase.profesor_curso?.titulo || 'Curso'}
                                        </h3>
                                        <p style={{ color: '#6b7280', margin: '0 0 5px 0' }}>
                                            👨‍🏫 {purchase.profesor_curso?.usuario?.nombre} •
                                            📚 {purchase.profesor_curso?.materia?.nombre}
                                        </p>
                                        <p style={{ color: '#059669', fontWeight: '600', margin: 0 }}>
                                            ${purchase.monto}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            backgroundColor: '#d4edda',
                                            color: '#155724',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            marginBottom: '8px'
                                        }}>
                                            ✅ {purchase.estado}
                                        </div>
                                        <button style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}>
                                            Ver Curso
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}