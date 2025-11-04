import { Resend } from 'resend';
import {
    emailConfirmacionMentor,
    emailConfirmacionAlumno,
    emailRecordatorio24hMentor,
    emailRecordatorio1hAlumno
} from './emailTemplates.js';

const resend = new Resend('re_Z4gBBuRP_FKYckth7DFHvvfUVaVZJRZ1E');

// Datos de ejemplo para testing
const datosEjemplo = {
    mentorNombre: 'Diego Marín',
    mentorEmail: 'dmarnoletti@gmail.com' ,
    alumnoNombre: 'Juan Pérez',
    alumnoEmail: 'dmarin@correo.um.edu.uy',
    materiaNombre: 'Redes de Datos 1',
    fecha: 'Viernes 15 de Noviembre, 2025',
    hora: '16:00',
    duracion: 60,
    cantidadAlumnos: 2,
    emailsParticipantes: [
        'estudiante1@correo.um.edu.uy',
        'estudiante2@correo.um.edu.uy'
    ],
    descripcion: 'Necesito ayuda con los parciales de la primera parte del curso, especialmente con el tema de protocolos de enrutamiento.',
    modalidad: 'virtual'
};

async function testEmailConfirmacionMentor() {
    console.log('📧 Enviando email de confirmación al MENTOR...');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Kerana <onboarding@resend.dev>',
            to: datosEjemplo.mentorEmail,
            subject: `[TEST] Nueva mentoría agendada - ${datosEjemplo.materiaNombre}`,
            html: emailConfirmacionMentor(datosEjemplo)
        });

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log('✅ Email enviado exitosamente!');
        console.log('📬 ID:', data.id);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function testEmailConfirmacionAlumno() {
    console.log('📧 Enviando email de confirmación al ALUMNO...');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Kerana <onboarding@resend.dev>',
            to: datosEjemplo.alumnoEmail,
            subject: `[TEST] Mentoría confirmada - ${datosEjemplo.materiaNombre}`,
            html: emailConfirmacionAlumno(datosEjemplo)
        });

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log('✅ Email enviado exitosamente!');
        console.log('📬 ID:', data.id);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function testEmailRecordatorio24hMentor() {
    console.log('🔔 Enviando recordatorio 24h al MENTOR...');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Kerana <onboarding@resend.dev>',
            to: datosEjemplo.mentorEmail,
            subject: `[TEST] Recordatorio: Mentoría mañana - ${datosEjemplo.materiaNombre}`,
            html: emailRecordatorio24hMentor(datosEjemplo)
        });

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log('✅ Email enviado exitosamente!');
        console.log('📬 ID:', data.id);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function testEmailRecordatorio1hAlumno() {
    console.log('🔔 Enviando recordatorio 1h al ALUMNO...');

    try {
        const { data, error } = await resend.emails.send({
            from: 'Kerana <onboarding@resend.dev>',
            to: datosEjemplo.alumnoEmail,
            subject: `[TEST] Tu clase comienza en 1 hora - ${datosEjemplo.materiaNombre}`,
            html: emailRecordatorio1hAlumno(datosEjemplo)
        });

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log('✅ Email enviado exitosamente!');
        console.log('📬 ID:', data.id);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function testTodos() {
    console.log('\n🚀 Iniciando prueba de TODOS los emails...\n');

    await testEmailConfirmacionMentor();
    console.log('\n---\n');

    await testEmailConfirmacionAlumno();
    console.log('\n---\n');

    await testEmailRecordatorio24hMentor();
    console.log('\n---\n');

    await testEmailRecordatorio1hAlumno();

    console.log('\n✅ Pruebas completadas! Revisá tu bandeja de entrada.');
}

// Descomentar la función que querés probar:

// testEmailConfirmacionMentor();
// testEmailConfirmacionAlumno();
// testEmailRecordatorio24hMentor();
// testEmailRecordatorio1hAlumno();

// O probar todos a la vez:
testTodos();