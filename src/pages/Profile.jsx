import { useState, useEffect } from 'react'
import { userAPI, purchaseAPI } from '../api/Database'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'

export default function Profile() {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState({ nombre: '', telefono: '', bio: '' })
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [activeTab, setActiveTab] = useState('info')

    useEffect(() => { loadUserData() }, [])

    const loadUserData = async () => {
        setLoading(true)
        try {
            const { data: profileData } = await userAPI.getCurrentProfile()
            if (profileData) {
                setProfile({
                    nombre: profileData.nombre || '',
                    telefono: profileData.telefono || '',
                    bio: profileData.bio || ''
                })
                setUser(profileData)
            }
            const { data: purchasesData } = await purchaseAPI.getUserPurchases()
            setPurchases(purchasesData || [])
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        try {
            const { error } = await userAPI.updateProfile(profile)
            if (error) setMessage('Error: ' + error.message)
            else {
                setMessage('¡Perfil actualizado!')
                setTimeout(() => setMessage(''), 3000)
            }
        } catch (e) {
            setMessage('Error inesperado: ' + e.message)
        }
        setSaving(false)
    }

    if (loading) return <p style={{ textAlign: 'center', padding: 20 }}>Cargando perfil…</p>

    return (
        <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
            {/* Header */}
            <Card style={{ textAlign: 'center', background: 'var(--primary)', color: '#fff' }}>
                <div style={{ fontSize: '3rem' }}>👤</div>
                <h1>{profile.nombre || user?.email?.split('@')[0] || 'Usuario'}</h1>
                <p style={{ opacity: 0.9 }}>{user?.email}</p>
            </Card>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', margin: '30px 0' }}>
                {[
                    { key: 'info', label: 'Información Personal' },
                    { key: 'purchases', label: `Compras (${purchases.length})` }
                ].map(tab => (
                    <Button
                        key={tab.key}
                        variant={activeTab === tab.key ? 'secondary' : 'ghost'}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>

            {activeTab === 'info' && (
                <Card>
                    <h2>Información Personal</h2>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: 20 }}>
                        <input value={profile.nombre} onChange={e => setProfile({ ...profile, nombre: e.target.value })} placeholder="Nombre completo" />
                        <input value={profile.telefono} onChange={e => setProfile({ ...profile, telefono: e.target.value })} placeholder="+598 99 123 456" />
                        <textarea rows={4} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Contanos sobre ti…" />
                        <Button type="submit" disabled={saving} variant="primary">
                            {saving ? 'Guardando…' : 'Actualizar Perfil'}
                        </Button>
                    </form>
                    {message && <p style={{ marginTop: 10, color: message.includes('Error') ? 'crimson' : 'green' }}>{message}</p>}
                </Card>
            )}

            {activeTab === 'purchases' && (
                <Card>
                    <h2>Mis Compras</h2>
                    {purchases.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Aún no has comprado cursos</p>
                    ) : (
                        purchases.map(p => (
                            <Card key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h3>{p.profesor_curso?.titulo || 'Curso'}</h3>
                                    <p>👨‍🏫 {p.profesor_curso?.usuario?.nombre} • 📚 {p.profesor_curso?.materia?.nombre}</p>
                                    <Chip tone="primary">${p.monto}</Chip>
                                </div>
                                <Button variant="secondary">Ver Curso</Button>
                            </Card>
                        ))
                    )}
                </Card>
            )}
        </div>
    )
}
