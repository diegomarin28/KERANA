//@ts-nocheck

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { email, name, code } = await req.json();
    if (!email || !code) {
      throw new Error('Email y código son requeridos');
    }
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no configurada');
    }
    // Template del email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%);
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 16px;
            color: #0f172a;
            margin-bottom: 20px;
          }
          .message {
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .code-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 3px solid #2563eb;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
          }
          .code {
            font-size: 36px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: 8px;
            margin: 0;
            font-family: 'Courier New', monospace;
          }
          .expiry {
            font-size: 13px;
            color: #64748b;
            margin-top: 12px;
          }
          .warning {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 24px 0;
            border-radius: 8px;
          }
          .warning p {
            margin: 0;
            font-size: 13px;
            color: #991b1b;
            line-height: 1.5;
          }
          .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 2px solid #e2e8f0;
          }
          .footer p {
            margin: 0;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Código de Verificación</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hola ${name},</p>
            
            <p class="message">
              Recibimos una solicitud para <strong>eliminar tu cuenta de Kerana</strong>.
            </p>
            
            <p class="message">
              Para continuar con la eliminación, ingresá el siguiente código de verificación:
            </p>
            
            <div class="code-box">
              <p class="code">${code}</p>
              <p class="expiry">⏰ Este código expira en 10 minutos</p>
            </div>
            
            <div class="warning">
              <p>
                <strong>⚠️ Atención:</strong> Si no solicitaste eliminar tu cuenta, 
                ignorá este email y tu cuenta permanecerá segura. Te recomendamos 
                cambiar tu contraseña si creés que alguien más tiene acceso a tu cuenta.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>Equipo Kerana</p>
            <p>Este es un email automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    // Enviar email con Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Kerana <onboarding@resend.dev>',
        to: [
          email
        ],
        subject: '🔒 Código de verificación - Eliminación de cuenta Kerana',
        html: emailHtml
      })
    });
    const resendData = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error('Error de Resend:', resendData);
      throw new Error(resendData.message || 'Error al enviar email con Resend');
    }
    console.log('✅ Email enviado exitosamente:', resendData);
    return new Response(JSON.stringify({
      success: true,
      message: 'Email enviado correctamente',
      emailId: resendData.id
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
