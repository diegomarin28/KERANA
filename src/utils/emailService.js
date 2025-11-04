import { Resend } from 'resend';
import {
    emailConfirmacionMentor,
    emailConfirmacionAlumno,
    emailRecordatorio24hMentor,
    emailRecordatorio1hAlumno
} from '../templates/emailTemplates';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

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
        const { data, error } = await resend.emails.send({
            from: 'Kerana <onboarding@resend.dev>', // Cambiar cuando tengas dominio
            to: mentorEmail,
            subject: `Nueva mentoría agendada - ${materiaNombre}`,
            html: emailConfirmacionMentor({
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
            })
        });

        if (error) {
            console.error('Error enviando email al mentor:', error);
            return { success: false, error };
        }

        console.log('Email enviado al mentor:', data);
        return { success: true, data };
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
        const { data, error } = await resend.emails.send({
            from: 'Kerana <onboarding@resend.dev>',
            to: alumnoEmail,
            subject: `Mentoría confirmada - ${materiaNombre}`,
            html: emailConfirmacionAlumno({
                alumnoNombre,
                mentorNombre,
                materiaNombre,
                fecha,
                hora,
                duracion,
                modalidad
            })
        });

        if (error) {
            console.error('Error enviando email al alumno:', error);
            return { success: false, error };
        }

        console.log('Email enviado al alumno:', data);
        return { success: true, data };
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
        const { data, error } = await resend.emails.send({
            from: 'Kerana <onboarding@resend.dev>',
            to: mentorEmail,
            subject: `Recordatorio: Mentoría mañana - ${materiaNombre}`,
            html: emailRecordatorio24hMentor({
                mentorNombre,
                alumnoNombre,
                alumnoEmail,
                materiaNombre,
                fecha,
                hora
            })
        });

        if (error) {
            console.error('Error enviando recordatorio 24h al mentor:', error);
            return { success: false, error };
        }

        console.log('Recordatorio 24h enviado al mentor:', data);
        return { success: true, data };
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
        const { data, error } = await resend.emails.send({
            from: 'Kerana <onboarding@resend.dev>',
            to: alumnoEmail,
            subject: `Tu clase comienza en 1 hora - ${materiaNombre}`,
            html: emailRecordatorio1hAlumno({
                alumnoNombre,
                mentorNombre,
                materiaNombre,
                fecha,
                hora
            })
        });

        if (error) {
            console.error('Error enviando recordatorio 1h al alumno:', error);
            return { success: false, error };
        }

        console.log('Recordatorio 1h enviado al alumno:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error en enviarRecordatorio1hAlumno:', error);
        return { success: false, error };
    }
}