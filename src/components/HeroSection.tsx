import React from 'react';
import { Button } from '@/components/ui/button'
import heroBackgroundImage from '@/assets/images/Flux_Dev_Abstract_digital_art_flowing_lines_of_soft_green_and__3.jpg';
// import heroImage from '@/assets/images/hero-image-placeholder.jpg' // Comentado pois a imagem não está sendo usada diretamente no código JSX por enquanto
import { useChatbot } from '@/contexts/ChatbotContext';

export const HeroSection: React.FC = () => {
  const { openChat } = useChatbot();

  return (
    <section
      id="hero"
      className="relative flex h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${heroBackgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/50 z-0"></div> {/* Overlay escuro aumentado */}
      {/* Imagem de fundo ou sobreposição (opcional) - Descomente e ajuste se necessário */}
      {/* <img
        src={heroImage}
        alt="Farmácia Homeopática Moderna"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      /> */}
      <div className="container z-10 mx-auto px-4 text-center">
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight gradient-text drop-shadow-md shadow-black/70 md:text-6xl lg:text-7xl">
          Pharma.AI: A Revolução Inteligente para sua Farmácia de Manipulação
        </h1>
        <p className="mb-10 text-lg gradient-text drop-shadow-md shadow-black/70 md:text-xl lg:text-2xl">
          Otimize seus processos, reduza erros e melhore o atendimento com a
          primeira plataforma de gestão farmacêutica com Inteligência Artificial
          integrada.
        </p>
        <div className="space-x-4">
          <Button
            onClick={openChat}
            variant="default"
            size="lg"
            className="bg-white text-green-700 hover:bg-gray-100"
          >
            Fale com nosso assistente Pharma-AI e saiba tudo do projeto
          </Button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10"></div>
    </section>
  )
}
