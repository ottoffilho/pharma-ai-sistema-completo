import { supabase } from '@/integrations/supabase/client';
import { uploadFile, STORAGE_BUCKETS } from './supabase';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface Medication {
  name: string;
  dinamization: string;
  form: string;
  quantity: number;
  unit: string;
  dosage_instructions: string;
}

export interface IAExtractedData {
  medications: Medication[];
  patient_name?: string;
  patient_dob?: string;
  prescriber_name?: string;
  prescriber_identifier?: string;
}

export interface ProcessedRecipe {
  id: string;
  raw_recipe_id: string;
  processed_by_user_id: string;
  medications: Medication[];
  patient_name?: string;
  patient_dob?: string;
  prescriber_name?: string;
  prescriber_identifier?: string;
  validation_status: 'pending' | 'validated' | 'rejected';
  validation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

export interface ProcessingResult {
  success: boolean;
  raw_recipe_id?: string;
  extracted_data?: IAExtractedData;
  ocr_result?: OCRResult;
  error?: string;
  processing_time?: number;
}

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// =====================================================
// FUNÇÕES DE UPLOAD E ARMAZENAMENTO
// =====================================================

/**
 * Faz upload de arquivo de receita para o storage
 */
export const uploadRecipeFile = async (file: File): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `receita_${timestamp}.${extension}`;
    const filePath = `receitas/${session.user.id}/${fileName}`;

    // Upload do arquivo
    await uploadFile(STORAGE_BUCKETS.RECEITAS, filePath, file);

    // Criar registro na tabela receitas_brutas
    const { data: rawRecipe, error } = await supabase
      .from('receitas_brutas')
      .insert({
        uploaded_by_user_id: session.user.id,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        upload_status: 'uploaded'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao criar registro de receita: ${error.message}`);
    }

    return rawRecipe.id;
  } catch (error) {
    console.error('Erro no upload da receita:', error);
    throw error;
  }
};

// =====================================================
// FUNÇÕES DE OCR
// =====================================================

/**
 * Pré-processa imagem para melhorar OCR
 */
const preprocessImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Converter para escala de cinza e aumentar contraste
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    
    // Aumentar contraste
    const contrast = 1.5;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const enhancedGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
    
    data[i] = enhancedGray;     // R
    data[i + 1] = enhancedGray; // G
    data[i + 2] = enhancedGray; // B
    // Alpha permanece o mesmo
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Extrai texto de imagem usando Tesseract.js
 */
export const extractTextFromImage = async (file: File): Promise<OCRResult> => {
  try {
    // Importação dinâmica do Tesseract
    const Tesseract = await import('tesseract.js');

    // Criar canvas para pré-processamento
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        // Configurar canvas
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Pré-processar imagem
        const processedCanvas = preprocessImage(canvas);

        try {
          // Executar OCR
          const { data } = await Tesseract.recognize(processedCanvas, 'por', {
            logger: (m) => console.log('OCR Progress:', m)
          });

          const result: OCRResult = {
            text: data.text,
            confidence: data.confidence,
            blocks: data.blocks.map(block => ({
              text: block.text,
              confidence: block.confidence,
              bbox: block.bbox
            }))
          };

          resolve(result);
        } catch (error) {
          reject(new Error(`Erro no OCR: ${error}`));
        }
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  } catch (error) {
    console.error('Erro na extração de texto:', error);
    throw new Error(`Falha na extração de texto: ${error}`);
  }
};

/**
 * Extrai texto de PDF
 */
export const extractTextFromPDF = async (file: File): Promise<OCRResult> => {
  try {
    // Importação dinâmica do PDF.js (versão legacy para compatibilidade)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');

    /*
     * Em bundlers como Vite o caminho do worker precisa ser resolvido no build.
     * O import com sufixo `?url` retorna a URL final do arquivo dentro dos
     * assets. Isso evita 404 e mantém a execução em *web-worker* (melhor para
     * PDFs grandes). Caso haja falha ainda permitimos fallback via
     * `disableWorker`.
     */

    try {
      // @ts-ignore – Vite retorna string da URL
      const workerSrc: string = (await import('pdfjs-dist/legacy/build/pdf.worker.min?url')).default;
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;
    } catch (e) {
      console.warn('Falha ao carregar worker do PDF.js, usando disableWorker', e);
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableWorker: !(pdfjsLib as any).GlobalWorkerOptions.workerSrc }).promise;
    
    let fullText = '';
    const blocks: OCRResult['blocks'] = [];

    // Extrair texto de todas as páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      textContent.items.forEach((item: {
        str?: string;
        transform: number[];
        width: number;
        height: number;
      }) => {
        if (item.str) {
          fullText += item.str + ' ';
          blocks.push({
            text: item.str,
            confidence: 0.95, // PDF text has high confidence
            bbox: {
              x: item.transform[4],
              y: item.transform[5],
              width: item.width,
              height: item.height
            }
          });
        }
      });
    }

    return {
      text: fullText.trim(),
      confidence: 0.95,
      blocks
    };
  } catch (error) {
    console.error('Erro na extração de texto do PDF:', error);
    throw new Error(`Falha na extração de texto do PDF: ${error}`);
  }
};

// =====================================================
// FUNÇÕES DE IA PARA EXTRAÇÃO DE DADOS
// =====================================================

/**
 * Processa texto extraído com IA para identificar medicamentos
 */
export const processTextWithAI = async (text: string): Promise<IAExtractedData> => {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('Chave da API DeepSeek não configurada');
    }

    const prompt = `
Você é um especialista em homeopatia e farmácia. Analise o texto da receita médica abaixo e extraia as seguintes informações em formato JSON:

TEXTO DA RECEITA:
${text}

Extraia as informações no seguinte formato JSON:
{
  "medications": [
    {
      "name": "Nome do medicamento homeopático",
      "dinamization": "Dinamização (ex: 30CH, 6CH, 12CH, TM)",
      "form": "Forma farmacêutica (ex: Glóbulos, Gotas, Comprimidos)",
      "quantity": número_quantidade,
      "unit": "Unidade (ex: unidades, frascos, gramas)",
      "dosage_instructions": "Instruções de uso completas"
    }
  ],
  "patient_name": "Nome do paciente (se encontrado)",
  "patient_dob": "Data de nascimento no formato YYYY-MM-DD (se encontrada)",
  "prescriber_name": "Nome do prescritor",
  "prescriber_identifier": "CRM ou identificação do prescritor"
}

INSTRUÇÕES IMPORTANTES:
1. Para medicamentos homeopáticos, identifique corretamente as dinamizações (CH, FC, TM, etc.)
2. Se não encontrar uma informação, use null
3. Para quantidades, extraia apenas números
4. Seja preciso com as instruções de dosagem
5. Retorne apenas o JSON válido, sem texto adicional
6. Se não conseguir identificar medicamentos, retorne um array vazio para medications

Responda apenas com o JSON:`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de receitas homeopáticas. Responda sempre em JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API DeepSeek: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('Resposta vazia da IA');
    }

    // Remover markdown/fences caso existam
    let cleaned = aiResponse.trim();
    if (cleaned.startsWith('```')) {
      // Remove primeira linha ```json ou ``` e último ```
      cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/m, '')
                     .replace(/```\s*$/m, '')
                     .trim();
    }

    const extractedData = JSON.parse(cleaned);
    
    // Validar estrutura básica
    if (!extractedData.medications || !Array.isArray(extractedData.medications)) {
      throw new Error('Estrutura de dados inválida retornada pela IA');
    }

    return extractedData as IAExtractedData;
  } catch (error) {
    console.error('Erro no processamento com IA:', error);
    throw error;
  }
};

// =====================================================
// FUNÇÃO PRINCIPAL DE PROCESSAMENTO
// =====================================================

/**
 * Processa receita completa: upload, OCR e IA
 */
export const processRecipe = async (file: File): Promise<ProcessingResult> => {
  const startTime = Date.now();
  
  try {
    // 1. Upload do arquivo
    const rawRecipeId = await uploadRecipeFile(file);

    // 2. Extração de texto (OCR ou PDF)
    let ocrResult: OCRResult;
    
    if (file.type.includes('pdf')) {
      ocrResult = await extractTextFromPDF(file);
    } else if (file.type.includes('image')) {
      ocrResult = await extractTextFromImage(file);
    } else {
      throw new Error('Tipo de arquivo não suportado. Use imagens (JPG, PNG) ou PDF.');
    }

    // Verificar se o texto foi extraído
    if (!ocrResult.text || ocrResult.text.trim().length < 10) {
      throw new Error('Não foi possível extrair texto suficiente do arquivo. Verifique a qualidade da imagem.');
    }

    // 3. Processamento com IA
    const extractedData = await processTextWithAI(ocrResult.text);

    // 4. Atualizar status no banco
    await supabase
      .from('receitas_brutas')
      .update({
        processing_status: 'processed',
        ocr_text: ocrResult.text,
        ocr_confidence: ocrResult.confidence,
        ai_extracted_data: extractedData as Record<string, unknown>
      })
      .eq('id', rawRecipeId);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      raw_recipe_id: rawRecipeId,
      extracted_data: extractedData,
      ocr_result: ocrResult,
      processing_time: processingTime
    };
  } catch (error) {
    console.error('Erro no processamento da receita:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no processamento',
      processing_time: Date.now() - startTime
    };
  }
};

// =====================================================
// FUNÇÕES DE VALIDAÇÃO
// =====================================================

/**
 * Valida dados extraídos da receita
 */
export const validatePrescriptionData = (data: IAExtractedData): boolean => {
  // Verificar se há pelo menos um medicamento
  if (!data.medications || data.medications.length === 0) {
    throw new Error('Nenhum medicamento foi identificado na receita');
  }

  // Validar cada medicamento
  for (const med of data.medications) {
    if (!med.name || med.name.trim().length === 0) {
      throw new Error('Nome do medicamento não pode estar vazio');
    }
    
    if (!med.dinamization || med.dinamization.trim().length === 0) {
      throw new Error(`Dinamização não especificada para ${med.name}`);
    }
    
    if (!med.quantity || med.quantity <= 0) {
      throw new Error(`Quantidade inválida para ${med.name}`);
    }
  }

  return true;
};

/**
 * Salva receita processada no banco de dados e cria ordem de produção automaticamente
 * @param rawRecipeId - ID da receita bruta
 * @param extractedData - Dados extraídos da receita
 * @param validationNotes - Observações de validação
 * @returns ID da receita processada
 */
export const saveProcessedRecipe = async (
  rawRecipeId: string,
  extractedData: IAExtractedData,
  validationNotes?: string
): Promise<string> => {
  try {
    console.log('Salvando receita processada:', { rawRecipeId, extractedData });

    // Primeiro, salvar a receita processada
    const { data, error } = await supabase.functions.invoke('processar-receita', {
      body: {
        raw_recipe_id: rawRecipeId,
        extracted_data: extractedData,
        validation_notes: validationNotes || ''
      }
    });

    if (error) {
      throw new Error(`Erro ao salvar receita: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Falha ao salvar receita processada');
    }

    const recipeId = data.recipe_id;
    console.log('Receita processada salva:', recipeId);

    // Criar ordem de produção automaticamente
    try {
      const orderId = await createOrderFromRecipe(recipeId, extractedData, validationNotes);
      console.log('Ordem de produção criada automaticamente:', orderId);
    } catch (orderError) {
      console.warn('Aviso: Receita salva mas falha ao criar ordem de produção:', orderError);
      // Não falhar completamente - receita foi salva com sucesso
    }

    return recipeId;

  } catch (error) {
    console.error('Erro ao salvar receita processada:', error);
    throw error;
  }
};

// =====================================================
// FUNÇÕES DE CONSULTA
// =====================================================

/**
 * Busca receitas processadas
 */
export const getProcessedRecipes = async (limit = 50, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('receitas_processadas')
      .select(`
        *,
        receitas_brutas (
          file_name,
          file_path,
          upload_status,
          processing_status
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Erro ao buscar receitas: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar receitas processadas:', error);
    throw error;
  }
};

/**
 * Busca receita processada por ID
 */
export const getProcessedRecipeById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('receitas_processadas')
      .select(`
        *,
        receitas_brutas (
          file_name,
          file_path,
          file_type,
          file_size,
          upload_status,
          processing_status,
          ocr_text,
          ocr_confidence
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar receita: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar receita por ID:', error);
    throw error;
  }
};

/**
 * Cria uma ordem de produção a partir de uma receita processada
 */
export const createOrderFromRecipe = async (
  recipeId: string,
  extractedData: IAExtractedData,
  observacoes?: string
): Promise<string> => {
  try {
    // Preparar dados para a ordem de produção
    const orderData = {
      receita_id: recipeId,
      cliente_nome: extractedData.patient_name,
      cliente_documento: '', // Pode ser extraído se houver
      observacoes: observacoes || '',
      medicamentos: extractedData.medications.map(med => ({
        nome: med.name,
        forma_farmaceutica: med.form || '',
        quantidade: med.quantity || 1,
        unidade: med.unit || 'unidades',
        valor_unitario: 0, // Será calculado posteriormente
        instrucoes_uso: med.dosage_instructions || ''
      }))
    };

    // Chamar Edge Function para criar ordem
    const { data, error } = await supabase.functions.invoke('gerenciar-ordens-producao-criar', {
      body: orderData
    });

    if (error) {
      throw new Error(`Erro ao criar ordem de produção: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Falha ao criar ordem de produção');
    }

    console.log('Ordem de produção criada:', data.data);
    return data.data.id;

  } catch (error) {
    console.error('Erro ao criar ordem de produção:', error);
    throw error;
  }
};

/**
 * Busca ordens de produção prontas para o PDV
 */
export const getReadyOrders = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('gerenciar-ordens-producao/prontas');

    if (error) {
      throw new Error(`Erro ao buscar ordens prontas: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Falha ao buscar ordens prontas');
    }

    return data.data || [];

  } catch (error) {
    console.error('Erro ao buscar ordens prontas:', error);
    throw error;
  }
};

/**
 * Atualiza status de uma ordem de produção
 */
export const updateOrderStatus = async (
  orderId: string,
  status: 'PENDENTE' | 'EM_PRODUCAO' | 'PRONTA' | 'ENTREGUE' | 'CANCELADA',
  observacoes?: string
): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke(`gerenciar-ordens-producao/${orderId}/status`, {
      body: { status, observacoes }
    });

    if (error) {
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Falha ao atualizar status');
    }

    console.log('Status da ordem atualizado:', data.data);

  } catch (error) {
    console.error('Erro ao atualizar status da ordem:', error);
    throw error;
  }
}; 