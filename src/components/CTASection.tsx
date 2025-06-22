import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, Loader2 } from 'lucide-react';
import PharmacyLogo from '@/assets/logo/pharma-image.png';
import contactBg from '@/assets/images/Flux_Dev_Abstract_digital_art_flowing_lines_of_soft_green_and__0.jpg';

// URL da Edge Function para salvar o lead do formulário
// const SAVE_FORM_LEAD_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/save-form-lead`; // Ajuste se SUPABASE_URL não estiver disponível globalmente assim no frontend, pode precisar ser de import.meta.env
// Melhor abordagem para URL no frontend:
const FORM_LEAD_SUBMIT_URL = import.meta.env.VITE_SAVE_FORM_LEAD_FUNCTION_URL || 'https://hjwebmpvaaeogbfqxwub.supabase.co/functions/v1/save-form-lead';

const CTASection = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Capturar referência do formulário antes das operações assíncronas
    const formElement = e.currentTarget;

    // DEBUG: Logar a chave anon para verificar seu valor
    console.log("VITE_SUPABASE_ANON_KEY sendo usada:", import.meta.env.VITE_SUPABASE_ANON_KEY);

    const formData = new FormData(formElement); // Usando formElement em vez de e.currentTarget
    const leadData = {
      nome_contato: formData.get('name') as string,
      nome_farmacia: formData.get('pharmacy') as string,
      email: formData.get('email') as string,
      telefone: formData.get('phone') as string,
      mensagem: formData.get('message') as string | null,
    };

    try {
      const response = await fetch(FORM_LEAD_SUBMIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Tentando ambas as formas de autenticação para Edge Functions
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
        },
        body: JSON.stringify(leadData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro ao enviar formulário: ${response.statusText}`);
      }

      toast({
        title: "Formulário enviado com sucesso!",
        description: "Obrigado pelo seu contato. Entraremos em contato em breve.",
        variant: "success",
      });
      formElement.reset(); // Usando formElement em vez de e.currentTarget
    } catch (error: unknown) {
      console.error("Falha ao enviar formulário:", error);
      toast({
        title: "Erro ao enviar formulário!",
        description: (error instanceof Error ? error.message : "Erro desconhecido") || "Não foi possível enviar seus dados. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <section
      id="contato"
      className="bg-cover bg-center"
      style={{ backgroundImage: `url(${contactBg})` }}
    >
      <div className="container-section">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Form */}
              <div className="p-8 md:p-12 flex flex-col items-center">
                <img 
                  src={PharmacyLogo} 
                  alt="Pharma.AI Logo" 
                  className="w-32 h-auto mb-6"
                />
                
                <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1 text-homeo-gray-dark">
                        Nome
                      </label>
                      <Input 
                        id="name" 
                        name="name" 
                        type="text" 
                        placeholder="Seu nome completo" 
                        required 
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="pharmacy" className="block text-sm font-medium mb-1 text-homeo-gray-dark">
                        Farmácia
                      </label>
                      <Input 
                        id="pharmacy" 
                        name="pharmacy" 
                        type="text" 
                        placeholder="Nome da farmácia" 
                        required 
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1 text-homeo-gray-dark">
                        E-mail
                      </label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="seu@email.com" 
                        required 
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1 text-homeo-gray-dark">
                        Telefone
                      </label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        type="tel" 
                        placeholder="(00) 00000-0000" 
                        required 
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1 text-homeo-gray-dark">
                      Mensagem (opcional)
                    </label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      placeholder="Como podemos ajudar sua farmácia?" 
                      className="w-full" 
                      rows={4}
                    />
                  </div>
                  
                  <Button type="submit" className="btn-primary w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
                    ) : (
                      'Solicitar Demonstração Gratuita'
                    )}
                  </Button>
                </form>
              </div>
              
              {/* Contact Info */}
              <div className="bg-gradient-to-br from-homeo-green to-homeo-blue text-white p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <h3 className="heading-md mb-6">
                    Informações de Contato
                  </h3>
                  <p className="text-white/80 mb-8">
                    Nós adoraríamos conversar sobre como podemos ajudar sua farmácia homeopática a crescer e se tornar mais eficiente.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <Phone className="h-6 w-6 text-white/90 mt-1" />
                      <div>
                        <h4 className="font-medium text-white">Telefone</h4>
                        <p className="text-white/80">61 97400-2886</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <Mail className="h-6 w-6 text-white/90 mt-1" />
                      <div>
                        <h4 className="font-medium text-white">E-mail</h4>
                        <p className="text-white/80">contato@pharma.ai.com.br</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/20">
                  <h4 className="font-medium text-white mb-2">Horário de Atendimento:</h4>
                  <p className="text-white/80">Segunda a Sexta: 9h às 18h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
