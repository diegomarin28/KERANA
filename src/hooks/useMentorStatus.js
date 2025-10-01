// hooks/useMentorStatus.js
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export const useMentorStatus = (autoCheck = true) => {  // ← Parámetro nuevo
    const [isMentor, setIsMentor] = useState(false)
    const [mentorData, setMentorData] = useState(null)
    const [loading, setLoading] = useState(true)

    const checkMentorStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsMentor(false)
                setLoading(false)
                return
            }

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .maybeSingle()

            if (!usuarioData) {
                setIsMentor(false)
                setLoading(false)
                return
            }

            const { data: mentorData } = await supabase
                .from('mentor')
                .select(`
                    id_mentor,
                    estrellas,
                    contacto,
                    mentor_materia(materia(id_materia, nombre_materia))
                `)
                .eq('id_usuario', usuarioData.id_usuario)
                .maybeSingle()

            setIsMentor(!!mentorData)
            setMentorData(mentorData)
        } catch (error) {
            console.error('Error checking mentor status:', error)
            setIsMentor(false)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (autoCheck) {  // ← Solo verifica si autoCheck es true
            checkMentorStatus()
        } else {
            setLoading(false)  // ← Si no autoCheck, marca como no loading
        }
    }, [autoCheck])

    return { isMentor, mentorData, loading, refetch: checkMentorStatus }
}