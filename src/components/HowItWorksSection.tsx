import React from 'react';
import { FileSearch, Database, ChartBar, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: <FileSearch className="h-12 w-12 text-white" />,
    title: 'Análise Inteligente',
    description: 'A IA interpreta a receita homeopática, identificando componentes, diluições e dosagens automaticamente.',
    color: 'bg-homeo-blue'
  },
  {
    icon: <Database className="h-12 w-12 text-white" />,
    title: 'Processamento de Fórmula',
    description: 'O sistema calcula as quantidades exatas, verifica disponibilidade no estoque e cria instruções de manipulação.',
    color: 'bg-homeo-green'
  },
  {
    icon: <ChartBar className="h-12 w-12 text-white" />,
    title: 'Resultados e Gestão',
    description: 'Geração do orçamento, ficha de produção e atualização automática do histórico do cliente e estoque.',
    color: 'bg-homeo-accent'
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Conheça o fluxo de trabalho simplificado e inteligente que o Pharma.AI proporciona para sua farmácia.
        </h2>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-homeo-blue via-homeo-green to-homeo-accent transform -translate-y-1/2 hidden md:block"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-lg shadow-lg p-8 h-full flex flex-col items-center text-center">
                  <div className={`${step.color} w-20 h-20 rounded-full flex items-center justify-center mb-6 relative z-10`}>
                    {step.icon}
                  </div>
                  <h3 className="heading-sm mb-4 text-homeo-gray-dark">
                    {step.title}
                  </h3>
                  <p className="text-homeo-gray">
                    {step.description}
                  </p>
                </div>
                
                {/* Arrow for mobile view */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center my-4 md:hidden">
                    <ArrowRight className="h-6 w-6 text-homeo-accent" />
                  </div>
                )}
                
                {/* Step number for desktop view */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-homeo-accent text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg shadow-md hidden md:flex">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
