// Supabase Edge Function: enviar-recordatorios-1h
// Ejecutar cada 10 minutos con Cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('🔔 Iniciando envío de recordatorios 1h...')

        // Configurar Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Configurar Resend
        const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

        // Calcular rango de tiempo (1 hora +/- 5 minutos)
        const ahora = new Date()
        const en1hora = new Date(ahora.getTime() + 60 * 60 * 1000)
        const rangoInicio = new Date(en1hora.getTime() - 5 * 60 * 1000)  // -5 min
        const rangoFin = new Date(en1hora.getTime() + 5 * 60 * 1000)     // +5 min

        console.log(`📅 Buscando sesiones entre ${rangoInicio.toISOString()} y ${rangoFin.toISOString()}`)

        // Buscar sesiones virtuales que:
        // 1. Están confirmadas
        // 2. Son en 1 hora (aproximadamente)
        // 3. NO se cancelaron
        // 4. NO se les envió el recordatorio aún
        const { data: sesiones, error: sesionesError } = await supabaseClient
            .from('mentor_sesion')
            .select(`
        id_sesion,
        fecha_hora,
        duracion_minutos,
        estado,
        recordatorio_1h_enviado,
        materia:id_materia(nombre_materia),
        mentor:id_mentor(
          usuario:id_usuario(nombre)
        ),
        alumno:id_alumno(nombre, correo)
      `)
            .eq('estado', 'confirmada')
            .eq('recordatorio_1h_enviado', false)
            .gte('fecha_hora', rangoInicio.toISOString())
            .lte('fecha_hora', rangoFin.toISOString())

        if (sesionesError) {
            console.error('❌ Error obteniendo sesiones:', sesionesError)
            throw sesionesError
        }

        console.log(`📊 Encontradas ${sesiones?.length || 0} sesiones`)

        if (!sesiones || sesiones.length === 0) {
            return new Response(
                JSON.stringify({
                    message: 'No hay sesiones para enviar recordatorios',
                    count: 0
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        let emailsEnviados = 0
        let errores = 0

        // Enviar email a cada alumno
        for (const sesion of sesiones) {
            try {
                const horaFormateada = new Date(sesion.fecha_hora).toLocaleTimeString('es-UY', {
                    hour: '2-digit',
                    minute: '2-digit'
                })

                // Template del email (simplificado)
                const htmlEmail = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%); padding: 32px 24px; text-align: center; }
              .header h1 { margin: 0; color: white; font-size: 28px; }
              .content { padding: 32px 24px; }
              .info-box { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; }
              .blue-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin: 24px 0; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 24px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Kerana</h1>
                <p style="margin: 8px 0 0 0; color: #e0f2fe;">Tu clase comienza pronto</p>
              </div>
              <div class="content">
                <h2 style="color: #0f172a;">🔔 Tu clase comienza en 1 hora</h2>
                <p>Hola <strong>${sesion.alumno?.nombre || 'Alumno'}</strong>,</p>
                <p>Te recordamos que tu mentoría comienza hoy a las <strong>${horaFormateada}</strong>:</p>
                
                <div class="info-box">
                  <p><strong>👨‍🏫 Mentor:</strong> ${sesion.mentor?.usuario?.nombre || 'Mentor'}</p>
                  <p><strong>📚 Materia:</strong> ${sesion.materia?.nombre_materia || 'Materia'}</p>
                  <p><strong>📅 Hora:</strong> ${horaFormateada}</p>
                </div>

                <div class="blue-box">
                  <h3 style="color: #1e40af; margin: 0 0 12px 0;">📱 ¿Cómo unirme a la clase?</h3>
                  <ol style="color: #1e40af; line-height: 1.8;">
                    <li>Revisá tu correo institucional</li>
                    <li>Buscá el email de "Microsoft Teams"</li>
                    <li>Hacé click en "Unirse"</li>
                    <li>Si es tu primera vez, Teams se abrirá automáticamente</li>
                  </ol>
                  <p style="color: #1e40af; font-size: 13px; margin: 16px 0 0 0;">
                    💡 <strong>Tip:</strong> Probá el link 5 minutos antes para asegurarte que todo funcione.
                  </p>
                </div>

                <div class="warning">
                  <h3 style="color: #92400e; margin: 0 0 12px 0;">⚠️ ¿Problemas técnicos?</h3>
                  <ul style="color: #92400e; line-height: 1.8;">
                    <li>Probá desde el navegador (teams.microsoft.com)</li>
                    <li>O abrí Teams → Llamadas → buscar al mentor</li>
                  </ul>
                  <p style="color: #92400e; font-size: 13px; margin: 16px 0 0 0;">
                    <strong>¿No encontrás el email?</strong> Revisá spam o contactá a tu mentor.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `

                const { data, error } = await resend.emails.send({
                    from: 'Kerana <onboarding@resend.dev>',
                    to: sesion.alumno?.correo || '',
                    subject: `Tu clase comienza en 1 hora - ${sesion.materia?.nombre_materia || 'Materia'}`,
                    html: htmlEmail
                })

                if (error) {
                    console.error(`❌ Error enviando email a ${sesion.alumno?.correo}:`, error)
                    errores++
                } else {
                    console.log(`✅ Email enviado a ${sesion.alumno?.correo}`)

                    // Marcar como enviado
                    await supabaseClient
                        .from('mentor_sesion')
                        .update({ recordatorio_1h_enviado: true })
                        .eq('id_sesion', sesion.id_sesion)

                    emailsEnviados++
                }
            } catch (error) {
                console.error(`❌ Error procesando sesión ${sesion.id_sesion}:`, error)
                errores++
            }
        }

        console.log(`✅ Proceso completado: ${emailsEnviados} emails enviados, ${errores} errores`)

        return new Response(
            JSON.stringify({
                success: true,
                message: `Recordatorios 1h enviados`,
                emailsEnviados,
                errores,
                totalSesiones: sesiones.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Error general:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})