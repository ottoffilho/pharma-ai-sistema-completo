import React from 'react';
import { Check } from 'lucide-react';
import ambienteInternoImg from '@/assets/images/ambiente_interno.jpg';

const SolutionSection = () => {
  return (
    <section className="relative bg-homeo-green-light/50">
      <div className="container-section pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Imagem ilustrativa */}
          <div className="relative rounded-lg shadow-xl overflow-hidden aspect-video bg-gradient-to-br from-homeo-green/20 to-homeo-blue/20">
            <img src={ambienteInternoImg} alt="Pharma.AI" className="w-full h-full object-cover" />
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            <h2 className="heading-lg gradient-text gradient-border pb-3">
              A Solução Completa para Sua Farmácia de Manipulação
            </h2>
            
            <p className="paragraph mb-8">
              O Pharma.AI é um sistema de gestão especialmente desenvolvido para farmácias de manipulação,
              oferecendo uma plataforma completa e intuitiva para otimizar todas as áreas do seu negócio.
              Desde o atendimento ao cliente até a gestão financeira e de estoque, nossa solução integra
              tecnologia avançada com a expertise farmacêutica.
            </p>
            
            <p className="paragraph">
              Nossa plataforma utiliza inteligência artificial para interpretar receitas, 
              automatizar cálculos complexos e fornecer insights valiosos para o seu negócio.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="flex items-start space-x-3">
                <div className="mt-1 bg-homeo-green/20 p-1 rounded-full">
                  <Check className="h-4 w-4 text-homeo-green" />
                </div>
                <span className="text-homeo-gray-dark">Interpretação de receitas via IA</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 bg-homeo-green/20 p-1 rounded-full">
                  <Check className="h-4 w-4 text-homeo-green" />
                </div>
                <span className="text-homeo-gray-dark">Gestão completa de estoque</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 bg-homeo-green/20 p-1 rounded-full">
                  <Check className="h-4 w-4 text-homeo-green" />
                </div>
                <span className="text-homeo-gray-dark">Cadastro e controle de clientes</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 bg-homeo-green/20 p-1 rounded-full">
                  <Check className="h-4 w-4 text-homeo-green" />
                </div>
                <span className="text-homeo-gray-dark">Orçamento automático de fórmulas</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 bg-homeo-green/20 p-1 rounded-full">
                  <Check className="h-4 w-4 text-homeo-green" />
                </div>
                <span className="text-homeo-gray-dark">Análises e relatórios detalhados</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-1 bg-homeo-green/20 p-1 rounded-full">
                  <Check className="h-4 w-4 text-homeo-green" />
                </div>
                <span className="text-homeo-gray-dark">Segurança e conformidade com LGPD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Novo degradê com posicionamento absoluto */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-homeo-green-light/50 via-homeo-green-light/25 to-white pointer-events-none"></div>
    </section>
  );
};

export default SolutionSection;
