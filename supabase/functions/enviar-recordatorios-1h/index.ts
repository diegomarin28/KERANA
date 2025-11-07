// Supabase Edge Function: enviar-recordatorios-1h
// Ejecutar cada 10 minutos con cron

//@ts-nocheck

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('⏰ Iniciando envío de recordatorios 1h...')

        // Configurar Supabase client
        const supabaseClient: any = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Configurar Resend
        const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

        // Calcular rango de tiempo (1 hora +/- 5 minutos para margen)
        const ahora = new Date()
        const en1hora = new Date(ahora.getTime() + 60 * 60 * 1000)
        const rangoInicio = new Date(en1hora.getTime() - 5 * 60 * 1000)  // -5 min
        const rangoFin = new Date(en1hora.getTime() + 5 * 60 * 1000)     // +5 min

        console.log(`📅 Buscando sesiones entre ${rangoInicio.toISOString()} y ${rangoFin.toISOString()}`)

        // Buscar sesiones PRESENCIALES confirmadas en la próxima hora que NO hayan recibido recordatorio
        const { data: sesiones, error: sesionesError } = await supabaseClient
            .from('mentor_sesion')
            .select(`
        id_sesion,
        fecha_hora,
        duracion_minutos,
        estado,
        modalidad,
        recordatorio_1h_enviado,
        id_mentor,
        id_alumno,
        id_materia,
        mentor:id_mentor(
          id_usuario,
          usuario:id_usuario(nombre, correo)
        ),
        alumno:id_alumno(nombre, correo),
        materia:id_materia(nombre_materia)
      `)
            .eq('estado', 'confirmada')
            .eq('modalidad', 'presencial')  // ← SOLO PRESENCIAL
            .eq('recordatorio_1h_enviado', false)
            .gte('fecha_hora', rangoInicio.toISOString())
            .lte('fecha_hora', rangoFin.toISOString())

        if (sesionesError) {
            console.error('❌ Error buscando sesiones:', sesionesError)
            throw sesionesError
        }

        console.log(`📊 Encontradas ${sesiones?.length || 0} sesiones PRESENCIALES para recordatorio 1h`)

        if (!sesiones || sesiones.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'No hay sesiones presenciales pendientes de recordatorio 1h'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Enviar recordatorios
        const resultados = []
        for (const sesion of sesiones) {
            try {
                // Validar que tengamos todos los datos
                if (!sesion.alumno?.correo) {
                    console.error(`⚠️ Sesión ${sesion.id_sesion}: Falta email del alumno`)
                    continue
                }

                // Formatear hora
                const fechaSesion = new Date(sesion.fecha_hora)
                const horaFormateada = fechaSesion.toLocaleTimeString('es-UY', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })

                // Template del email
                const emailHTML = crearTemplateRecordatorio1h({
                    alumnoNombre: sesion.alumno.nombre,
                    mentorNombre: sesion.mentor.usuario.nombre,
                    materiaNombre: sesion.materia.nombre_materia,
                    hora: horaFormateada
                })

                // Enviar email
                const { data: emailData, error: emailError } = await resend.emails.send({
                    from: 'Kerana <onboarding@resend.dev>',
                    to: sesion.alumno.correo,
                    subject: `🔔 ¡Tu clase comienza en 1 hora! - ${sesion.materia.nombre_materia}`,
                    html: emailHTML
                })

                if (emailError) {
                    console.error(`❌ Error enviando email sesión ${sesion.id_sesion}:`, emailError)
                    resultados.push({ id_sesion: sesion.id_sesion, success: false, error: emailError })
                    continue
                }

                console.log(`✅ Email enviado para sesión ${sesion.id_sesion}:`, emailData.id)

                // Marcar como enviado
                await supabaseClient
                    .from('mentor_sesion')
                    .update({ recordatorio_1h_enviado: true })
                    .eq('id_sesion', sesion.id_sesion)

                resultados.push({ id_sesion: sesion.id_sesion, success: true, emailId: emailData.id })

            } catch (error: any) {
                console.error(`❌ Error procesando sesión ${sesion.id_sesion}:`, error)
                resultados.push({ id_sesion: sesion.id_sesion, success: false, error: error.message })
            }
        }

        console.log(`📧 Recordatorios enviados: ${resultados.filter(r => r.success).length}/${resultados.length}`)

        return new Response(
            JSON.stringify({ success: true, resultados }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('❌ Error general:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// Template del recordatorio 1h
function crearTemplateRecordatorio1h({ alumnoNombre, mentorNombre, materiaNombre, hora }: any) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">Kerana</h1>
          <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 16px;">Tu clase comienza pronto</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 700;">
            🔔 ¡Tu clase comienza en 1 hora!
          </h2>

          <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Hola <strong>${alumnoNombre}</strong>,
          </p>

          <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Te recordamos que tu mentoría presencial comienza hoy a las <strong>${hora}</strong>:
          </p>

          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">
              👨‍🏫 Mentor: <strong style="color: #0f172a;">${mentorNombre}</strong>
            </p>
            <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">
              📚 Materia: <strong style="color: #0f172a;">${materiaNombre}</strong>
            </p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">
              📅 Hora: <strong style="color: #0f172a;">${hora}</strong>
            </p>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 700;">
              ⚠️ No olvides
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
              <li>Llevar todo el material necesario</li>
              <li>Llegar puntual al punto de encuentro</li>
              <li>Tener a mano el email del mentor por si surge algún imprevisto</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 24px; background: #f8fafc; text-align: center; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">© 2025 Kerana - Plataforma de Mentorías</p>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Montevideo, Uruguay</p>
        </div>
      </div>
    </body>
    </html>
  `
}