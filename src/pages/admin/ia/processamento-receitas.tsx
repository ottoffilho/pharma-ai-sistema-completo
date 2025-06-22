import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProcessamentoReceitasPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Brain className="h-8 w-8 text-homeo-accent" />
            <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Processamento de Receitas</h1>
              <Badge variant="secondary" className="bg-homeo-accent/10 text-homeo-accent">
                IA Powered
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Tecnologia de IA para processamento automático e análise de receitas médicas
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-homeo-green" />
                OCR Inteligente
              </CardTitle>
              <CardDescription>
                Reconhecimento ótico de caracteres para receitas digitalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <p className="text-sm text-green-700 font-medium">
                  ✅ OCR implementado com Tesseract.js
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Suporte para imagens (JPG, PNG) e PDFs com pré-processamento inteligente
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-homeo-accent" />
                Análise Semântica
              </CardTitle>
              <CardDescription>
                Interpretação inteligente do conteúdo das receitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <p className="text-sm text-blue-700 font-medium">
                  ✅ IA integrada com DeepSeek
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Extração automática de medicamentos, dosagens e dados do paciente
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Validação Automática
              </CardTitle>
              <CardDescription>
                Verificação automática de dosagens e interações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
                <p className="text-sm text-yellow-700 font-medium">
                  ✅ Validação automática implementada
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verificação de medicamentos, dosagens e criação automática de pedidos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status do Desenvolvimento</CardTitle>
            <CardDescription>
              Acompanhe o progresso das funcionalidades de IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">OCR Inteligente</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Implementado</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Análise Semântica</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Implementado</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Validação Automática</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Implementado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 