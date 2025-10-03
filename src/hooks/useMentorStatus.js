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

            // 2) Perfil por auth_id (RLS lo exige)
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

            // 3) Mentor (consulta simple, sin embeds)
            const { data: mentor, error: mentorErr } = await supabase
                .from('mentor')
                .select('id_mentor, estrellas_mentor, contacto, descripcion')
                .eq('id_mentor', usuarioData.id_usuario)
                .maybeSingle()
            if (mentorErr || !mentor) {
                setIsMentor(false)
                setMentorData(null)
                return
            }

            // 4) Materias del mentor (join simple a materia)
            const { data: mm, error: mmErr } = await supabase
                .from('mentor_materia')
                .select(`
          id,
          id_materia,
          materia:id_materia!mentor_materia_id_materia_fkey (
            id_materia,
            nombre_materia
          )
        `)
                .eq('id_mentor', mentor.id_mentor)
            if (mmErr) {
                setIsMentor(true)
                setMentorData({ ...mentor, mentor_materia: [] })
                return
            }

            setIsMentor(true)
            setMentorData({ ...mentor, mentor_materia: mm || [] })
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
