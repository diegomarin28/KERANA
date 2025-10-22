// hooks/useMentorStatus.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export const useMentorStatus = (autoCheck = true) => {
    const [isMentor, setIsMentor] = useState(false)
    const [mentorData, setMentorData] = useState([])
    const [loading, setLoading] = useState(autoCheck)

    const checkMentorStatus = useCallback(async () => {
        try {
            setLoading(true)

            // 1️⃣ Usuario auth
            const { data: auth } = await supabase.auth.getUser()
            const user = auth?.user
            if (!user) {
                console.log('❌ No hay usuario autenticado')
                setIsMentor(false)
                setMentorData([])
                return
            }

            // 2️⃣ Perfil por auth_id
            const { data: usuarioData, error: usuarioErr } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .maybeSingle()

            if (usuarioErr || !usuarioData) {
                console.log('❌ No se encontró perfil de usuario')
                setIsMentor(false)
                setMentorData([])
                return
            }

            console.log('✅ Usuario encontrado:', usuarioData.id_usuario)

            // 3️⃣ Buscar todos los mentores asociados al usuario
            const { data: mentores, error: mentorErr } = await supabase
                .from('mentor')
                .select('id_mentor, estrellas_mentor, contacto, descripcion, fecha_inicio, usuario:usuario (calendly_url)')
                .eq('id_usuario', usuarioData.id_usuario)

            console.log('🎓 Mentores del usuario:', mentores)

            if (mentorErr || !mentores || mentores.length === 0) {
                setIsMentor(false)
                setMentorData([])
                return
            }

            // 4️⃣ Para cada mentor, obtener sus materias
            const allMentores = await Promise.all(
                mentores.map(async (mentor) => {
                    const { data: mm, error: mmErr } = await supabase
                        .from('mentor_materia')
                        .select(`
                            id,
                            id_materia,
                            materia (
                                id_materia,
                                nombre_materia
                            )
                        `)
                        .eq('id_mentor', mentor.id_mentor)

                    if (mmErr) {
                        console.error('❌ Error materias de mentor', mentor.id_mentor, mmErr)
                        return { ...mentor, mentor_materia: [] }
                    }

                    return { ...mentor, mentor_materia: mm || [] }
                })
            )

            // 5️⃣ Actualizar estado
            setIsMentor(true)
            setMentorData(allMentores)
        } catch (err) {
            console.error('❌ Error general en useMentorStatus:', err)
            setIsMentor(false)
            setMentorData([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (autoCheck) checkMentorStatus()
    }, [autoCheck, checkMentorStatus])

    return { isMentor, mentorData, loading, refetch: checkMentorStatus }
}
