import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useMentorOnboarding() {
    const [showModal, setShowModal] = useState(false);
    const [mentorData, setMentorData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkMentorOnboarding();
    }, []);

    const checkMentorOnboarding = async () => {
        try {
            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Obtener id_usuario desde la tabla usuario
            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (!usuarioData) {
                setLoading(false);
                return;
            }

            // Verificar si es mentor y si completó onboarding (solo campos necesarios)
            const { data: mentor, error } = await supabase
                .from('mentor')
                .select('id_mentor, onboarding_completado')
                .eq('id_usuario', usuarioData.id_usuario)
                .maybeSingle();

            if (error || !mentor) {
                // No es mentor
                setLoading(false);
                return;
            }

            // Si es mentor pero NO completó onboarding → Mostrar modal
            if (!mentor.onboarding_completado) {
                setMentorData(mentor);
                setShowModal(true);
            }

            setLoading(false);

        } catch (error) {
            console.error('Error verificando onboarding de mentor:', error);
            setLoading(false);
        }
    };

    const completeOnboarding = async (formData) => {
        if (!mentorData) return { success: false };

        try {
            const { error } = await supabase
                .from('mentor')
                .update({
                    max_alumnos: formData.maxAlumnos,
                    localidad: formData.localidad,
                    acepta_zoom: formData.aceptaZoom,
                    acepta_presencial: formData.aceptaPresencial,
                    lugar_presencial: formData.lugarPresencial,
                    direccion: formData.direccion,
                    onboarding_completado: true
                })
                .eq('id_mentor', mentorData.id_mentor);

            if (error) throw error;

            // ✅ Actualizar estado local para evitar que vuelva a aparecer
            setMentorData({ ...mentorData, onboarding_completado: true });
            setShowModal(false);

            return { success: true };

        } catch (error) {
            console.error('Error completando onboarding:', error);
            return { success: false, error };
        }
    };

    return {
        showModal,
        loading,
        mentorData,
        completeOnboarding,
        closeModal: () => setShowModal(false)
    };
}