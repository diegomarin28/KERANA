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
            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (usuarioError || !usuarioData) {
                console.error('Error obteniendo usuario:', usuarioError);
                setLoading(false);
                return;
            }

            // Obtener mentor con datos de Mercado Pago
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentor')
                .select('id_mentor, puede_recibir_clases, mercadopago_email, mercadopago_cvu, mercadopago_alias')
                .eq('id_usuario', usuarioData.id_usuario)
                .maybeSingle();

            if (mentorError || !mentorData) {
                console.error('Error obteniendo mentor:', mentorError);
                setLoading(false);
                return;
            }

            // Obtener datos de pago
            const { data: pagoData, error: pagoError } = await supabase
                .from('mentor_pago')
                .select('*')
                .eq('id_mentor', mentorData.id_mentor)
                .maybeSingle();

            if (pagoError) {
                console.error('Error obteniendo datos de pago:', pagoError);
            }

            if (pagoData) {
                setPaymentData({
                    ...pagoData,
                    mpEmail: mentorData.mercadopago_email || pagoData.mp_email,
                    mpCvu: mentorData.mercadopago_cvu,
                    mpAlias: mentorData.mercadopago_alias
                });
                setHasPaymentConfigured(pagoData.configurado || false);
            } else {
                // Si no hay registro en mentor_pago pero tiene datos de MP en mentor
                if (mentorData.mercadopago_email) {
                    setPaymentData({
                        mpEmail: mentorData.mercadopago_email,
                        mpCvu: mentorData.mercadopago_cvu,
                        mpAlias: mentorData.mercadopago_alias
                    });
                    setHasPaymentConfigured(true);
                } else {
                    setPaymentData(null);
                    setHasPaymentConfigured(false);
                }
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
            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (usuarioError || !usuarioData) {
                return { success: false, error: 'Usuario no encontrado' };
            }

            // Obtener mentor
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioData.id_usuario)
                .maybeSingle();

            if (mentorError || !mentorData) {
                return { success: false, error: 'No eres mentor' };
            }

            // Verificar si ya existe registro
            const { data: existingPayment, error: checkError } = await supabase
                .from('mentor_pago')
                .select('id')
                .eq('id_mentor', mentorData.id_mentor)
                .maybeSingle();

            if (checkError) {
                console.error('Error verificando pago existente:', checkError);
            }

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

            // Actualizar datos de Mercado Pago en la tabla mentor
            const { error: updateMentorMPError } = await supabase
                .from('mentor')
                .update({
                    mercadopago_email: data.mpEmail,
                    mercadopago_cvu: data.mpCvu,
                    mercadopago_alias: data.mpAlias
                })
                .eq('id_mentor', mentorData.id_mentor);

            if (updateMentorMPError) {
                console.error('Error actualizando datos de MP en mentor:', updateMentorMPError);
                throw updateMentorMPError;
            }

            // Actualizar mentor.puede_recibir_clases
            const { error: updateMentorError } = await supabase
                .from('mentor')
                .update({ puede_recibir_clases: true })
                .eq('id_mentor', mentorData.id_mentor);

            if (updateMentorError) {
                console.error('Error actualizando mentor:', updateMentorError);
            }

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