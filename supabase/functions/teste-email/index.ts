// @ts-expect-error Deno imports não são reconhecidos pelo TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Iniciando teste de email')
    
    // @ts-expect-error Deno env não é reconhecido pelo TypeScript
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('Erro: RESEND_API_KEY não configurada')
      throw new Error('Configuração de API faltando: RESEND_API_KEY')
    }
    
    // Usar dados de teste fixos
    const email = 'ottof6@gmail.com'
    
    // Template HTML mínimo
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Teste de Email</title>
    </head>
    <body>
        <h1>Teste de Envio de Email</h1>
        <p>Este é um email de teste para verificar a integração com Resend.</p>
        <p>Data e hora: ${new Date().toLocaleString()}</p>
    </body>
    </html>
    `

    // Configurar dados do email
    const emailData = {
      to: [email],
      subject: `Teste de Email - Pharma.AI`,
      html: htmlTemplate,
      from: {
        email: "contato@pharmaai.com.br",
        name: 'Pharma.AI - Teste'
      }
    }

    console.log('Enviando email simples para:', email)
    
    // Enviar email usando o serviço configurado
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    const responseText = await response.text()
    console.log('Status da resposta:', response.status)
    console.log('Corpo da resposta:', responseText)

    if (!response.ok) {
      console.error('Erro ao enviar email via Resend API:', responseText)
      throw new Error(`Erro no serviço de email: ${response.status} - ${responseText}`)
    }

    // Tentar fazer parse do JSON apenas se foi bem-sucedido
    let result
    try {
      result = JSON.parse(responseText)
      console.log('Email enviado com sucesso:', result)
    } catch (e) {
      console.error('Erro ao fazer parse da resposta:', e)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de teste enviado com sucesso',
        email_id: result?.id,
        response_status: response.status,
        response_text: responseText
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 