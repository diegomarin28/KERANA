// Supabase Edge Function: enviar-recordatorios-24h
// Ejecutar cada 1 hora con Cron

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
        console.log('🔔 Iniciando envío de recordatorios 24h...')

        // Configurar Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Configurar Resend
        const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

        // Calcular rango de tiempo (24 horas +/- 30 minutos para margen)
        const ahora = new Date()
        const en24horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
        const rangoInicio = new Date(en24horas.getTime() - 30 * 60 * 1000) // -30 min
        const rangoFin = new Date(en24horas.getTime() + 30 * 60 * 1000)    // +30 min

        console.log(`📅 Buscando sesiones entre ${rangoInicio.toISOString()} y ${rangoFin.toISOString()}`)

        // Buscar sesiones virtuales que:
        // 1. Están confirmadas
        // 2. Son en 24 horas (aproximadamente)
        // 3. NO se cancelaron
        // 4. NO se les envió el recordatorio aún
        const { data: sesiones, error: sesionesError } = await supabaseClient
            .from('mentor_sesion')
            .select(`
        id_sesion,
        fecha_hora,
        duracion_minutos,
        cantidad_alumnos,
        emails_participantes,
        descripcion_alumno,
        estado,
        recordatorio_24h_enviado,
        id_mentor,
        id_alumno,
        materia:id_materia(nombre_materia),
        mentor:id_mentor(
          id_usuario,
          usuario:id_usuario(nombre, correo)
        ),
        alumno:id_alumno(nombre, correo)
      `)
            .eq('estado', 'confirmada')
            .eq('recordatorio_24h_enviado', false)
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

        // Filtrar solo sesiones virtuales
        const sesionesVirtuales = sesiones.filter(s => {
            // Buscar modalidad en slots_disponibles (necesitarías hacer otro query)
            // Por ahora asumimos que TODAS son virtuales si están aquí
            return true
        })

        let emailsEnviados = 0
        let errores = 0

        // Enviar email a cada mentor
        for (const sesion of sesionesVirtuales) {
            try {
                const fechaFormateada = new Date(sesion.fecha_hora).toLocaleDateString('es-UY', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })

                const horaFormateada = new Date(sesion.fecha_hora).toLocaleTimeString('es-UY', {
                    hour: '2-digit',
                    minute: '2-digit'
                })

                // Template del email (simplificado - en producción usar el de emailTemplates.js)
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
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 24px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Kerana</h1>
                <p style="margin: 8px 0 0 0; color: #e0f2fe;">Recordatorio de mentoría</p>
              </div>
              <div class="content">
                <h2 style="color: #0f172a;">🔔 Recordatorio: Mentoría mañana</h2>
                <p>Hola <strong>${sesion.mentor?.usuario?.nombre || 'Mentor'}</strong>,</p>
                <p>Te recordamos que mañana tenés una mentoría programada:</p>
                
                <div class="info-box">
                  <p><strong>👤 Alumno:</strong> ${sesion.alumno?.nombre || 'Alumno'}</p>
                  <p><strong>📧 Email:</strong> ${sesion.alumno?.correo || ''}</p>
                  <p><strong>📚 Materia:</strong> ${sesion.materia?.nombre_materia || 'Materia'}</p>
                  <p><strong>📅 Hora:</strong> ${fechaFormateada} a las ${horaFormateada}</p>
                </div>

                <div class="warning">
                  <h3 style="color: #92400e; margin: 0 0 12px 0;">⚠️ ¿Ya enviaste la invitación de Teams?</h3>
                  <p style="color: #92400e; margin: 0;">Si todavía no lo hiciste, <strong>creá la reunión ahora</strong> para que el alumno la reciba a tiempo.</p>
                </div>

                <div style="text-align: center;">
                  <a href="https://youtube.com/tutorial-teams" class="button">📺 Ver tutorial de Teams</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `

                const { data, error } = await resend.emails.send({
                    from: 'Kerana <onboarding@resend.dev>',
                    to: sesion.mentor?.usuario?.correo || '',
                    subject: `Recordatorio: Mentoría mañana - ${sesion.materia?.nombre_materia || 'Materia'}`,
                    html: htmlEmail
                })

                if (error) {
                    console.error(`❌ Error enviando email a ${sesion.mentor?.usuario?.correo}:`, error)
                    errores++
                } else {
                    console.log(`✅ Email enviado a ${sesion.mentor?.usuario?.correo}`)

                    // Marcar como enviado
                    await supabaseClient
                        .from('mentor_sesion')
                        .update({ recordatorio_24h_enviado: true })
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
                message: `Recordatorios 24h enviados`,
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