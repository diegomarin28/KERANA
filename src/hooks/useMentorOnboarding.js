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
            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (usuarioError || !usuarioData) {
                console.log('❌ No se encontró usuario en la tabla');
                setLoading(false);
                return;
            }

            // Verificar si es mentor y si completó onboarding
            const { data: mentor, error: mentorError } = await supabase
                .from('mentor')
                .select('id_mentor, onboarding_completado')
                .eq('id_usuario', usuarioData.id_usuario)
                .maybeSingle();

            if (mentorError) {
                console.error('Error consultando mentor:', mentorError);
                setLoading(false);
                return;
            }

            // Si mentor es NULL → No es mentor → NO mostrar modal
            if (!mentor) {
                console.log('✅ Usuario NO es mentor');
                setLoading(false);
                return;
            }

            // Si es mentor pero NO completó onboarding → Mostrar modal
            if (!mentor.onboarding_completado) {
                console.log('📋 Mentor sin onboarding completado → Mostrando modal');
                setMentorData(mentor);
                setShowModal(true);
            } else {
                console.log('✅ Mentor con onboarding completado');
            }

            setLoading(false);

        } catch (error) {
            console.error('❌ Error verificando onboarding de mentor:', error);
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
                    acepta_virtual: formData.aceptaZoom,  // ← CAMBIO: acepta_zoom → acepta_virtual
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