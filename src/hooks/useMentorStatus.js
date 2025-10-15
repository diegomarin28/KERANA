// hooks/useMentorStatus.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export const useMentorStatus = (autoCheck = true) => {
    const [isMentor, setIsMentor] = useState(false)
    const [mentorData, setMentorData] = useState(null)
    const [loading, setLoading] = useState(autoCheck)

    const checkMentorStatus = useCallback(async () => {
        try {
            setLoading(true)

            // 1) Usuario auth
            const { data: auth } = await supabase.auth.getUser()
            const user = auth?.user
            if (!user) {
                setIsMentor(false)
                setMentorData(null)
                return
            }

            // 2) Perfil por auth_id
            const { data: usuarioData, error: usuarioErr } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .maybeSingle()
            if (usuarioErr || !usuarioData) {
                setIsMentor(false)
                setMentorData(null)
                return
            }

            // 3) Mentor
            const { data: mentor, error: mentorErr } = await supabase
                .from('mentor')
                .select('id_mentor, estrellas_mentor, contacto, descripcion')
                .eq('id_usuario', usuarioData.id_usuario)
                .maybeSingle()
            if (mentorErr || !mentor) {
                setIsMentor(false)
                setMentorData(null)
                return
            }

            // 4) Materias del mentor (sin JOIN, dos queries separadas)
            const { data: mentorMaterias, error: mmErr } = await supabase
                .from('mentor_materia')
                .select('id, id_materia')
                .eq('id_mentor', mentor.id_mentor)

            if (mmErr) {
                setIsMentor(true)
                setMentorData({ ...mentor, mentor_materia: [] })
                return
            }

            // 5) Obtener datos de materias por separado
            if (mentorMaterias && mentorMaterias.length > 0) {
                const materiaIds = mentorMaterias.map(mm => mm.id_materia)

                const { data: materias } = await supabase
                    .from('materia')
                    .select('id_materia, nombre_materia')
                    .in('id_materia', materiaIds)

                // Combinar
                const mentorMateriasConDatos = mentorMaterias.map(mm => ({
                    ...mm,
                    materia: materias?.find(m => m.id_materia === mm.id_materia) || null
                }))

                setIsMentor(true)
                setMentorData({ ...mentor, mentor_materia: mentorMateriasConDatos })
            } else {
                setIsMentor(true)
                setMentorData({ ...mentor, mentor_materia: [] })
            }
        } catch {
            setIsMentor(false)
            setMentorData(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (autoCheck) checkMentorStatus()
    }, [autoCheck, checkMentorStatus])

    return { isMentor, mentorData, loading, refetch: checkMentorStatus }
}
