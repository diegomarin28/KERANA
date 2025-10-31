import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADOPAGO_ACCESS_TOKEN = 'TEST-4972813263501520-102319-eed0717c744b183ef54a45a165f15528-828649767'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { id_paquete } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: usuario } = await supabaseClient
      .from('usuario')
      .select('id_usuario, correo, nombre')
      .eq('auth_id', user.id)
      .single()

    const { data: paquete, error: paqueteError } = await supabaseClient
      .from('paquete_creditos')
      .select('*')
      .eq('id_paquete', id_paquete)
      .eq('activo', true)
      .single()

    if (paqueteError || !paquete) {
      return new Response(JSON.stringify({ error: 'Paquete no encontrado' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const preference = {
      items: [
        {
          title: `Kerana - ${paquete.nombre} (${paquete.cantidad_creditos} créditos)`,
          quantity: 1,
          unit_price: parseFloat(paquete.precio_usd),
          currency_id: 'USD',
        }
      ],
      payer: {
        email: usuario.correo || user.email,
        name: usuario.nombre || 'Usuario Kerana',
      },
      back_urls: {
        success: 'https://kerana.vercel.app/credits/success',
        failure: 'https://kerana.vercel.app/credits/failure',
        pending: 'https://kerana.vercel.app/credits/failure',
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_mercadopago`,
      metadata: {
        id_usuario: usuario.id_usuario,
        id_paquete: paquete.id_paquete,
      },
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('Error MercadoPago:', mpData)
      return new Response(JSON.stringify({ error: 'Error creando preferencia' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: compra, error: compraError } = await supabaseClient
      .rpc('crear_compra_creditos', {
        p_id_paquete: id_paquete,
        p_mercadopago_preference_id: mpData.id,
      })

    if (compraError) {
      console.error('Error creando compra:', compraError)
    }

    return new Response(
      JSON.stringify({
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})