// @ts-expect-error Deno imports não são reconhecidos pelo TypeScript padrão
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-expect-error Deno imports não são reconhecidos pelo TypeScript padrão
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  email: string;
  nome: string;
  token: string;
  resetUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log de início da execução
    console.log('Iniciando processamento de recuperação de senha')
    
    // Verificar se as variáveis de ambiente necessárias estão definidas
    // @ts-expect-error Deno.env está disponível no ambiente Deno
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('Erro: RESEND_API_KEY não configurada')
      throw new Error('Configuração de API faltando: RESEND_API_KEY')
    }
    
    // Parse do corpo da requisição
    let requestBody
    try {
      requestBody = await req.json()
      console.log('Dados recebidos:', JSON.stringify({ 
        email: requestBody.email,
        nome: requestBody.nome,
        token: requestBody.token ? `${requestBody.token.substring(0, 5)}...` : undefined,
        resetUrl: requestBody.resetUrl ? `${requestBody.resetUrl.substring(0, 20)}...` : undefined
      }))
    } catch (e) {
      console.error('Erro ao fazer parse do JSON:', e)
      return new Response(
        JSON.stringify({ error: 'Formato de dados inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const { email, nome, token, resetUrl }: EmailRequest = requestBody

    // Validar dados obrigatórios
    if (!email || !nome || !token || !resetUrl) {
      const camposFaltantes: string[] = []
      if (!email) camposFaltantes.push('email')
      if (!nome) camposFaltantes.push('nome')
      if (!token) camposFaltantes.push('token')
      if (!resetUrl) camposFaltantes.push('resetUrl')
      
      console.error(`Dados obrigatórios não fornecidos: ${camposFaltantes.join(', ')}`)
      
      return new Response(
        JSON.stringify({ 
          error: 'Dados obrigatórios não fornecidos',
          campos_faltantes: camposFaltantes 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Template HTML do email
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - Pharma.AI</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e0e0e0;
            }
            .title {
                color: #2c5aa0;
                font-size: 24px;
                margin: 0;
                font-weight: 600;
            }
            .subtitle {
                color: #666;
                font-size: 14px;
                margin: 5px 0 0 0;
            }
            .content {
                margin: 30px 0;
            }
            .greeting {
                font-size: 18px;
                color: #2c5aa0;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                margin-bottom: 25px;
                line-height: 1.8;
            }
            .button-container {
                text-align: center;
                margin: 35px 0;
            }
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #2c5aa0 0%, #4a90e2 100%);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(44, 90, 160, 0.3);
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 15px;
                margin: 25px 0;
                font-size: 14px;
                color: #856404;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            .security-info {
                background-color: #f8f9fa;
                border-left: 4px solid #2c5aa0;
                padding: 15px;
                margin: 25px 0;
                font-size: 14px;
            }
            .link-fallback {
                word-break: break-all;
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                margin-top: 15px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">Recuperação de Senha</h1>
                <p class="subtitle">Sistema de Gestão para Farmácias de Manipulação</p>
            </div>
            
            <div class="content">
                <p class="greeting">Olá, ${nome}!</p>
                
                <p class="message">
                    Recebemos uma solicitação para redefinir a senha da sua conta no sistema Pharma.AI. 
                    Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha.
                </p>
                
                <div class="button-container">
                    <a href="${resetUrl}" class="reset-button">
                        Redefinir Minha Senha
                    </a>
                </div>
                
                <div class="warning">
                    <strong>Importante:</strong> Este link é válido por apenas 1 hora e pode ser usado apenas uma vez.
                </div>
                
                <div class="security-info">
                    <strong>Segurança:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Se você não solicitou esta alteração, ignore este email</li>
                        <li>Nunca compartilhe este link com outras pessoas</li>
                        <li>Sempre verifique se o link direciona para o domínio oficial</li>
                    </ul>
                </div>
                
                <p class="message">
                    Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
                </p>
                
                <div class="link-fallback">
                    ${resetUrl}
                </div>
            </div>
            
            <div class="footer">
                <p>
                    <strong>Pharma.AI</strong> - Sistema de Gestão para Farmácias de Manipulação<br>
                    Este é um email automático, não responda a esta mensagem.
                </p>
                <p style="margin-top: 15px; font-size: 11px; color: #999;">
                    Se você continuar tendo problemas, entre em contato com o suporte técnico.
                </p>
            </div>
        </div>
    </body>
    </html>
    `

    // Configurar dados do email
    const emailData = {
      to: [email],
      subject: `Recuperação de Senha - Pharma.AI`,
      html: htmlTemplate,
      from: {
        email: "contato@pharmaai.com.br",
        name: "Pharma.AI - Sistema de Gestão"
      }
    }

    console.log('Enviando email para:', email)
    
    // Enviar email usando o serviço configurado
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Erro ao enviar email via Resend API:', errorData)
        console.error('Status code:', response.status)
        throw new Error(`Erro no serviço de email: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log('Email enviado com sucesso:', result)

      // Log da ação no Supabase
      try {
        // @ts-expect-error Deno.env está disponível no ambiente Deno
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        // @ts-expect-error Deno.env está disponível no ambiente Deno
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Variáveis de ambiente do Supabase não configuradas')
          throw new Error('Configuração Supabase incompleta')
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey)

        await supabase
          .from('logs_email')
          .insert({
            tipo: 'recuperacao_senha',
            destinatario: email,
            assunto: emailData.subject,
            status: 'enviado',
            enviado_em: new Date().toISOString(),
            dados_extras: { token_usado: token.substring(0, 8) + '...' }
          })
        
        console.log('Log registrado com sucesso')
      } catch (logError) {
        console.error('Erro ao registrar log:', logError)
        // Não falhar a operação principal se o log falhar
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email de recuperação enviado com sucesso',
          email_id: result.id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      throw emailError
    }

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