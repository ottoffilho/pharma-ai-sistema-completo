// @ts-expect-error Deno imports não são reconhecidos pelo TypeScript padrão
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
    console.log('Iniciando debug Resend')
    
    // Verificar chave API
    // @ts-expect-error Deno.env está disponível no ambiente Deno
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const apiKeyStatus = resendApiKey ? 'Configurada' : 'Não configurada'
    
    // Verificar outras variáveis de ambiente
    // @ts-expect-error Deno.env está disponível no ambiente Deno
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // @ts-expect-error Deno.env está disponível no ambiente Deno
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Obter email de teste do corpo ou usar padrão
    let testEmail = 'ottof6@gmail.com'
    try {
      const body = await req.json()
      if (body.email) {
        testEmail = body.email
      }
    } catch (e) {
      // Ignorar erros de parsing, usar email padrão
    }
    
    // Tentar fazer uma chamada simples para a API do Resend
    let resendApiStatus = 'Não testado'
    let resendResponse = null
    
    if (resendApiKey) {
      try {
        // Payload mínimo para testar apenas a conexão
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'contato@pharmaai.com.br',
            to: [testEmail],
            subject: 'Teste de API Resend',
            text: 'Este é um teste simples da API Resend. ' + new Date().toISOString()
          }),
        })
        
        resendApiStatus = response.status.toString()
        resendResponse = await response.text()
      } catch (error) {
        resendApiStatus = 'Erro: ' + error.message
      }
    }
    
    // Retornar diagnóstico
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: {
          resend_api_key: apiKeyStatus,
          supabase_url: supabaseUrl ? 'Configurada' : 'Não configurada',
          supabase_key: supabaseKey ? 'Configurada' : 'Não configurada',
          deno_version: Deno.version.deno,
          typescript_version: Deno.version.typescript
        },
        test_email: testEmail,
        resend_api_status: resendApiStatus,
        resend_response: resendResponse
      }, null, 2),
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