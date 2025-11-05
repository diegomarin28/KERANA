import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
        console.log('📧 Iniciando envío de email...')

        // Obtener API key de Resend
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY no configurada')
        }

        // Obtener datos del request
        const body = await req.json()
        console.log('📨 Destinatario:', body.to)
        console.log('📧 Asunto:', body.subject)

        // Validar campos requeridos
        if (!body.from || !body.to || !body.subject || !body.html) {
            throw new Error('Campos requeridos: from, to, subject, html')
        }

        // Enviar email con Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: body.from,
                to: body.to,
                subject: body.subject,
                html: body.html
            })
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
            console.error('❌ Error de Resend:', resendData)
            throw new Error(resendData.message || 'Error al enviar email con Resend')
        }

        console.log('✅ Email enviado exitosamente:', resendData.id)

        return new Response(
            JSON.stringify({
                success: true,
                data: resendData
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error: any) {
        console.error('❌ Error general:', error.message)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})