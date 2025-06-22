import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 Iniciando sincronização de XMLs das notas fiscais...')

    // 1. Buscar notas fiscais sem informações de arquivo XML
    const { data: notasSemXML, error: notasError } = await supabaseClient
      .from('notas_fiscais')
      .select('id, numero_nf, serie, chave_acesso, created_at')
      .is('xml_arquivo_path', null)

    if (notasError) {
      throw new Error(`Erro ao buscar notas fiscais: ${notasError.message}`)
    }

    console.log(`📋 Encontradas ${notasSemXML?.length || 0} notas fiscais sem informações de XML`)

    if (!notasSemXML || notasSemXML.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Todas as notas fiscais já possuem informações de XML sincronizadas',
          notasProcessadas: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Buscar arquivos XML no storage
    const { data: arquivosStorage, error: storageError } = await supabaseClient.storage
      .from('nf-xml')
      .list('uploads', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })

    if (storageError) {
      throw new Error(`Erro ao listar arquivos do storage: ${storageError.message}`)
    }

    console.log(`📁 Encontrados ${arquivosStorage?.length || 0} arquivos XML no storage`)

    let notasAtualizadas = 0
    const resultados = []

    // 3. Para cada nota fiscal, tentar encontrar o arquivo XML correspondente
    for (const nota of notasSemXML) {
      try {
        console.log(`🔍 Processando nota fiscal ${nota.numero_nf}/${nota.serie} - Chave: ${nota.chave_acesso}`)

        // Procurar arquivo por chave de acesso
        const arquivoEncontrado = arquivosStorage?.find(arquivo => 
          arquivo.name.includes(nota.chave_acesso)
        )

        if (arquivoEncontrado) {
          console.log(`✅ Arquivo encontrado: ${arquivoEncontrado.name}`)

          // Obter metadados do arquivo
          const { data: metadados } = await supabaseClient.storage
            .from('nf-xml')
            .getPublicUrl(`uploads/${arquivoEncontrado.name}`)

          // Atualizar nota fiscal com informações do arquivo
          const { error: updateError } = await supabaseClient
            .from('notas_fiscais')
            .update({
              xml_arquivo_path: `uploads/${arquivoEncontrado.name}`,
              xml_arquivo_nome: arquivoEncontrado.name.split('_').slice(1).join('_'), // Remove timestamp
              xml_arquivo_tamanho: arquivoEncontrado.metadata?.size || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', nota.id)

          if (updateError) {
            console.error(`❌ Erro ao atualizar nota ${nota.numero_nf}:`, updateError.message)
            resultados.push({
              nota: `${nota.numero_nf}/${nota.serie}`,
              chave: nota.chave_acesso,
              status: 'erro',
              erro: updateError.message
            })
          } else {
            console.log(`✅ Nota fiscal ${nota.numero_nf}/${nota.serie} atualizada com sucesso`)
            notasAtualizadas++
            resultados.push({
              nota: `${nota.numero_nf}/${nota.serie}`,
              chave: nota.chave_acesso,
              status: 'sucesso',
              arquivo: arquivoEncontrado.name
            })
          }
        } else {
          console.warn(`⚠️ Arquivo XML não encontrado para nota ${nota.numero_nf}/${nota.serie}`)
          resultados.push({
            nota: `${nota.numero_nf}/${nota.serie}`,
            chave: nota.chave_acesso,
            status: 'arquivo_nao_encontrado'
          })
        }
      } catch (error) {
        console.error(`❌ Erro ao processar nota ${nota.numero_nf}:`, error)
        resultados.push({
          nota: `${nota.numero_nf}/${nota.serie}`,
          chave: nota.chave_acesso,
          status: 'erro',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    console.log(`🎉 Sincronização concluída. ${notasAtualizadas} notas fiscais atualizadas`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída com sucesso`,
        notasProcessadas: notasSemXML.length,
        notasAtualizadas,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 