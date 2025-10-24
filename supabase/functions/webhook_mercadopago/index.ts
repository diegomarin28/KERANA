import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADOPAGO_ACCESS_TOKEN = 'TEST-4972813263501520-102319-eed0717c744b183ef54a45a165f15528-828649767'

serve(async (req) => {
  try {
    const body = await req.json()

    if (body.type !== 'payment') {
      return new Response(JSON.stringify({ ok: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const paymentId = body.data.id

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    )

    const payment = await mpResponse.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let estado = 'pendiente'
    if (payment.status === 'approved') {
      estado = 'aprobado'
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      estado = 'rechazado'
    }

    await supabaseAdmin.rpc('actualizar_estado_compra_creditos', {
      p_mercadopago_payment_id: String(paymentId),
      p_estado: estado,
      p_mercadopago_status: payment.status,
    })

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})