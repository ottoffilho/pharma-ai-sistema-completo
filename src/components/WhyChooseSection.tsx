import React from 'react';
import { Star, Shield, Zap, Leaf } from 'lucide-react';

const differentiators = [
  {
    icon: <Leaf className="h-8 w-8 text-homeo-green" />,
    title: 'Especializado em Homeopatia',
    description: 'Desenvolvido exclusivamente para atender as particularidades e complexidades da manipulação homeopática.'
  },
  {
    icon: <Zap className="h-8 w-8 text-homeo-blue" />,
    title: 'IA Treinada para o Setor',
    description: 'Nossa inteligência artificial foi treinada com milhares de receitas homeopáticas reais para máxima precisão.'
  },
  {
    icon: <Shield className="h-8 w-8 text-homeo-accent" />,
    title: 'Segurança e Conformidade LGPD',
    description: 'Total conformidade com a Lei Geral de Proteção de Dados, garantindo a segurança das informações de clientes.'
  },
  {
    icon: <Star className="h-8 w-8 text-homeo-green" />,
    title: 'Suporte Técnico Especializado',
    description: 'Equipe de suporte com conhecimento em farmácia homeopática, entendendo suas necessidades específicas.'
  }
];

const WhyChooseSection = () => {
  return (
    <section id="why-choose-us" className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Por Que Escolher o Pharma.AI
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {differentiators.map((item, index) => (
            <div 
              key={index}
              className="flex space-x-6"
            >
              <div className="mt-1">
                <div className="bg-gradient-to-br from-homeo-green-light to-homeo-blue-light p-4 rounded-lg">
                  {item.icon}
                </div>
              </div>
              <div>
                <h3 className="heading-sm mb-3 text-homeo-gray-dark">
                  {item.title}
                </h3>
                <p className="text-homeo-gray">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-homeo-green/10 to-homeo-blue/10 rounded-lg p-8 border border-homeo-blue/20">
          <div className="max-w-3xl mx-auto">
            <h3 className="heading-md text-center mb-6 text-homeo-gray-dark">
              Desenvolvido com e para Profissionais do Setor
            </h3>
            <p className="text-center paragraph">
              O Pharma.AI foi criado em colaboração com farmacêuticos experientes, 
              garantindo que cada funcionalidade atenda às necessidades reais da sua farmácia. 
              Nossa solução evolui constantemente com feedback de usuários profissionais do setor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
