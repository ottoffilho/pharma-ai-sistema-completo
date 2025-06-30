// =====================================================
// COMPONENTE: PRODUTOS FAVORITOS - PDV 2.0
// Exibe grid de produtos favoritos com acesso rápido
// =====================================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Package, Star, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProdutoFavoritoProps {
  id: string;
  nome: string;
  codigo_interno?: string;
  preco_venda: number;
  estoque_atual: number;
  ordem: number;
  categoria_favorito?: string;
  cor_destaque?: string;
  icone?: string;
  tecla_atalho?: string;
  codigo_rapido?: string;
  acessos: number;
  ultimo_acesso: string;
  onClick: () => void;
}

export function ProdutoFavorito({ 
  nome, 
  codigo_interno, 
  preco_venda, 
  estoque_atual,
  cor_destaque,
  icone,
  tecla_atalho,
  onClick,
  formatarDinheiro
}: ProdutoFavoritoProps & { formatarDinheiro: (valor: number) => string }) {
  const renderIcon = () => {
    switch (icone) {
      case 'star':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg",
          cor_destaque && "border-2"
        )}
        style={{
          borderColor: cor_destaque || undefined
        }}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm line-clamp-2">{nome}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Cód: {codigo_interno}
              </p>
              <p className="text-lg font-bold text-primary mt-2">
                {formatarDinheiro(preco_venda)}
              </p>
              <Badge 
                variant={estoque_atual > 10 ? "secondary" : "destructive"} 
                className="mt-2"
              >
                <Package className="w-3 h-3 mr-1" />
                {estoque_atual} un
              </Badge>
            </div>
            {icone && (
              <div className="ml-2">
                {renderIcon()}
              </div>
            )}
          </div>
          {tecla_atalho && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {tecla_atalho}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ProdutosFavoritosGridProps {
  produtos: ProdutoFavoritoProps[];
  onProdutoClick: (produto: ProdutoFavoritoProps) => void;
  formatarDinheiro: (valor: number) => string;
}

export function ProdutosFavoritosGrid({ 
  produtos, 
  onProdutoClick,
  formatarDinheiro 
}: ProdutosFavoritosGridProps) {
  if (produtos.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
        <Star className="w-4 h-4" />
        Produtos Favoritos
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {produtos.map((produto) => (
          <ProdutoFavorito
            key={produto.id}
            {...produto}
            onClick={() => onProdutoClick(produto)}
            formatarDinheiro={formatarDinheiro}
          />
        ))}
      </div>
    </div>
  );
} 