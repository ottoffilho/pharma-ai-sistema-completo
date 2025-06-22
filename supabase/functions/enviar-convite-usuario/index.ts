// @ts-expect-error Deno imports não são reconhecidos pelo TypeScript padrão
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuração de CORS
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
    // @ts-expect-error Deno.env está disponível no ambiente Deno
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // @ts-expect-error Deno.env está disponível no ambiente Deno
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verificar se a API key está configurada
    // @ts-expect-error Deno.env está disponível no ambiente Deno
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('Erro: RESEND_API_KEY não configurada')
      throw new Error('Configuração de API faltando: RESEND_API_KEY')
    }

    // Obter dados do body
    const { email, nome, token, conviteUrl, nomeFarmacia, perfil } = await req.json()

    // Validar dados essenciais
    if (!email || !conviteUrl || !perfil) {
      throw new Error('Dados incompletos: email, conviteUrl e perfil são obrigatórios')
    }

    console.log('Enviando convite para:', email, 'Perfil:', perfil)
    
    // Template HTML para email de convite
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite - Pharma.AI</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 8px 8px;
            }
            .button {
                display: inline-block;
                background-color: #4f46e5;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #6b7280;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Convite para ${nomeFarmacia || 'Pharma.AI'}</h1>
        </div>
        <div class="content">
            <p>Olá ${nome || 'usuário'},</p>
            
            <p>Você foi convidado para se juntar à farmácia <strong>${nomeFarmacia || 'Pharma.AI'}</strong> como <strong>${perfil}</strong>.</p>
            
            <p>Para aceitar este convite e criar sua conta, clique no botão abaixo:</p>
            
            <div style="text-align: center;">
                <a href="${conviteUrl}" class="button">Aceitar Convite</a>
            </div>
            
            <p>Ou copie e cole este link em seu navegador:</p>
            <p style="word-break: break-all; font-size: 14px;">${conviteUrl}</p>
            
            <p>Este convite é válido por 48 horas. Após este período, você precisará solicitar um novo convite.</p>
            
            <p>Atenciosamente,<br>Equipe Pharma.AI</p>
        </div>
        <div class="footer">
            <p>Este é um email automatizado, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} Pharma.AI - Todos os direitos reservados.</p>
        </div>
    </body>
    </html>
    `

    // Configurar dados do email
    const emailData = {
      to: [email],
      subject: `Convite para ${nomeFarmacia || 'Pharma.AI'} - Acesso como ${perfil}`,
      html: htmlTemplate,
      from: {
        email: "contato@pharmaai.com.br", // Email do Titan
        name: nomeFarmacia || 'Pharma.AI'
      }
    }

    console.log('Enviando email de convite...')
    
    // Enviar email usando Resend
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

    // Processar resposta
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
        message: 'Email de convite enviado com sucesso',
        email_id: result?.id,
        recipient: email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro ao enviar convite:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao enviar convite',
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