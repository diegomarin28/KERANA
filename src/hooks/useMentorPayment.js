import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useMentorPayment() {
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasPaymentConfigured, setHasPaymentConfigured] = useState(false);

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const fetchPaymentData = async () => {
        try {
            setLoading(true);

            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Obtener id_usuario
            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (!usuarioData) {
                setLoading(false);
                return;
            }

            // Obtener mentor
            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_mentor, puede_recibir_clases')
                .eq('id_usuario', usuarioData.id_usuario)
                .single();

            if (!mentorData) {
                setLoading(false);
                return;
            }

            // Obtener datos de pago
            const { data: pagoData, error } = await supabase
                .from('mentor_pago')
                .select('*')
                .eq('id_mentor', mentorData.id_mentor)
                .single();

            if (pagoData) {
                setPaymentData(pagoData);
                setHasPaymentConfigured(pagoData.configurado);
            } else {
                setPaymentData(null);
                setHasPaymentConfigured(false);
            }

            setLoading(false);

        } catch (error) {
            console.error('Error obteniendo datos de pago:', error);
            setLoading(false);
        }
    };

    const savePaymentData = async (data) => {
        try {
            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'No autenticado' };

            // Obtener id_usuario
            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (!usuarioData) return { success: false, error: 'Usuario no encontrado' };

            // Obtener mentor
            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioData.id_usuario)
                .single();

            if (!mentorData) return { success: false, error: 'No eres mentor' };

            // Verificar si ya existe registro
            const { data: existingPayment } = await supabase
                .from('mentor_pago')
                .select('id')
                .eq('id_mentor', mentorData.id_mentor)
                .single();

            let result;
            if (existingPayment) {
                // Actualizar
                result = await supabase
                    .from('mentor_pago')
                    .update({
                        mp_email: data.mpEmail,
                        configurado: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id_mentor', mentorData.id_mentor);
            } else {
                // Insertar
                result = await supabase
                    .from('mentor_pago')
                    .insert({
                        id_mentor: mentorData.id_mentor,
                        mp_email: data.mpEmail,
                        configurado: true
                    });
            }

            if (result.error) throw result.error;

            // Actualizar mentor.puede_recibir_clases
            await supabase
                .from('mentor')
                .update({ puede_recibir_clases: true })
                .eq('id_mentor', mentorData.id_mentor);

            // Recargar datos
            await fetchPaymentData();

            return { success: true };

        } catch (error) {
            console.error('Error guardando datos de pago:', error);
            return { success: false, error: error.message };
        }
    };

    return {
        paymentData,
        hasPaymentConfigured,
        loading,
        savePaymentData,
        refreshPaymentData: fetchPaymentData
    };
}