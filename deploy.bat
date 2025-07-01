@echo off
REM Script de deploy completo para Pharma.AI

echo Adicionando todas as alterações...
git add .

echo Fazendo commit com mensagem padrão...
git commit -m "Deploy: atualização completa do projeto"

echo Enviando para o branch main do GitHub...
git push origin main

echo Deploy concluído!
pause 