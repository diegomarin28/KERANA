import {
    emailConfirmacionMentor,
    emailConfirmacionAlumno,
    emailRecordatorio24hMentor,
    emailRecordatorio1hAlumno
} from '../templates/emailTemplates';
import { supabase } from '../supabase';

/**
 * Función helper para enviar emails via Edge Function
 */
async function enviarEmailViaEdgeFunction({ from, to, subject, html }) {
    try {
        const { data, error } = await supabase.functions.invoke('enviar-email', {
            body: { from, to, subject, html }
        });

        if (error) {
            console.error('❌ Error en Edge Function:', error);
            return { success: false, error };
        }

        if (!data.success) {
            console.error('❌ Error en respuesta:', data.error);
            return { success: false, error: data.error };
        }

        console.log('✅ Email enviado:', data.data?.id);
        return { success: true, data: data.data };
    } catch (error) {
        console.error('❌ Error general:', error);
        return { success: false, error };
    }
}

/**
 * Enviar email de confirmación al mentor cuando un alumno agenda
 */
export async function enviarEmailConfirmacionMentor({
                                                        mentorEmail,
                                                        mentorNombre,
                                                        alumnoNombre,
                                                        alumnoEmail,
                                                        materiaNombre,
                                                        fecha,
                                                        hora,
                                                        duracion,
                                                        cantidadAlumnos,
                                                        emailsParticipantes,
                                                        descripcion,
                                                        modalidad
                                                    }) {
    try {
        const htmlContent = emailConfirmacionMentor({
            mentorNombre,
            alumnoNombre,
            alumnoEmail,
            materiaNombre,
            fecha,
            hora,
            duracion,
            cantidadAlumnos,
            emailsParticipantes,
            descripcion,
            modalidad
        });

        return await enviarEmailViaEdgeFunction({
            from: 'Kerana <onboarding@resend.dev>',
            to: mentorEmail,
            subject: `Nueva mentoría agendada - ${materiaNombre}`,
            html: htmlContent
        });
    } catch (error) {
        console.error('Error en enviarEmailConfirmacionMentor:', error);
        return { success: false, error };
    }
}

/**
 * Enviar email de confirmación al alumno
 */
export async function enviarEmailConfirmacionAlumno({
                                                        alumnoEmail,
                                                        alumnoNombre,
                                                        mentorNombre,
                                                        materiaNombre,
                                                        fecha,
                                                        hora,
                                                        duracion,
                                                        modalidad
                                                    }) {
    try {
        const htmlContent = emailConfirmacionAlumno({
            alumnoNombre,
            mentorNombre,
            materiaNombre,
            fecha,
            hora,
            duracion,
            modalidad
        });

        return await enviarEmailViaEdgeFunction({
            from: 'Kerana <onboarding@resend.dev>',
            to: alumnoEmail,
            subject: `Mentoría confirmada - ${materiaNombre}`,
            html: htmlContent
        });
    } catch (error) {
        console.error('Error en enviarEmailConfirmacionAlumno:', error);
        return { success: false, error };
    }
}

/**
 * Enviar emails de confirmación (mentor + alumno) en una sola función
 */
export async function enviarEmailsConfirmacion({
                                                   mentorEmail,
                                                   mentorNombre,
                                                   alumnoEmail,
                                                   alumnoNombre,
                                                   materiaNombre,
                                                   fecha,
                                                   hora,
                                                   duracion,
                                                   cantidadAlumnos,
                                                   emailsParticipantes,
                                                   descripcion,
                                                   modalidad
                                               }) {
    // Enviar ambos emails en paralelo
    const [resultadoMentor, resultadoAlumno] = await Promise.all([
        enviarEmailConfirmacionMentor({
            mentorEmail,
            mentorNombre,
            alumnoNombre,
            alumnoEmail,
            materiaNombre,
            fecha,
            hora,
            duracion,
            cantidadAlumnos,
            emailsParticipantes,
            descripcion,
            modalidad
        }),
        enviarEmailConfirmacionAlumno({
            alumnoEmail,
            alumnoNombre,
            mentorNombre,
            materiaNombre,
            fecha,
            hora,
            duracion,
            modalidad
        })
    ]);

    return {
        mentor: resultadoMentor,
        alumno: resultadoAlumno,
        success: resultadoMentor.success && resultadoAlumno.success
    };
}

/**
 * Recordatorio 24h antes al mentor
 */
export async function enviarRecordatorio24hMentor({
                                                      mentorEmail,
                                                      mentorNombre,
                                                      alumnoNombre,
                                                      alumnoEmail,
                                                      materiaNombre,
                                                      fecha,
                                                      hora
                                                  }) {
    try {
        const htmlContent = emailRecordatorio24hMentor({
            mentorNombre,
            alumnoNombre,
            alumnoEmail,
            materiaNombre,
            fecha,
            hora
        });

        return await enviarEmailViaEdgeFunction({
            from: 'Kerana <onboarding@resend.dev>',
            to: mentorEmail,
            subject: `Recordatorio: Mentoría mañana - ${materiaNombre}`,
            html: htmlContent
        });
    } catch (error) {
        console.error('Error en enviarRecordatorio24hMentor:', error);
        return { success: false, error };
    }
}

/**
 * Recordatorio 1h antes al alumno
 */
export async function enviarRecordatorio1hAlumno({
                                                     alumnoEmail,
                                                     alumnoNombre,
                                                     mentorNombre,
                                                     materiaNombre,
                                                     fecha,
                                                     hora
                                                 }) {
    try {
        const htmlContent = emailRecordatorio1hAlumno({
            alumnoNombre,
            mentorNombre,
            materiaNombre,
            fecha,
            hora
        });

        return await enviarEmailViaEdgeFunction({
            from: 'Kerana <onboarding@resend.dev>',
            to: alumnoEmail,
            subject: `Tu clase comienza en 1 hora - ${materiaNombre}`,
            html: htmlContent
        });
    } catch (error) {
        console.error('Error en enviarRecordatorio1hAlumno:', error);
        return { success: false, error };
    }
}