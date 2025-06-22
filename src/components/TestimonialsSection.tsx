import React from 'react';

// This section is optional as mentioned in the requirements
// Currently using placeholders for future testimonials
const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-16 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Depoimentos dos nossos clientes
        </h2>
        
        {/* Seção temporária enquanto coletamos depoimentos reais */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-6xl text-gray-300 mb-4">💬</div>
            <p className="text-gray-600 text-lg mb-4">
              Estamos coletando depoimentos de farmácias que estão transformando 
              suas operações com o Pharma.AI.
            </p>
            <p className="text-gray-500">
              Em breve, você verá aqui relatos reais de como nossa plataforma 
              está ajudando farmácias a otimizar processos e melhorar o atendimento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
