# GUIA PASSO A PASSO - Como Atualizar seu Sistema

Este guia foi feito para que você possa atualizar o sistema e ver as correções (Logo maior, Cabeçalho corrigido) no ar.

## 1. Abrir o Terminal
No seu editor de código (onde você está lendo isso), procure na parte superior o menu **Terminal** e clique em **New Terminal** (ou **Novo Terminal**).
Vai abrir uma janelinha na parte de baixo da tela.

## 2. Verificar Instalação (Opcional)
Apenas para garantir que tudo está certo, digite o comando abaixo e aperte ENTER:
```bash
npm install
```
*Espere terminar (pode demorar um pouquinho).*

## 3. Construir o Projeto (Build)
Agora vamos preparar o site para ser enviado. Digite:
```bash
npm run build
```
*Se aparecer "Build complete" ou algo assim, deu tudo certo.*

## 4. Enviar para a Internet (Deploy)
Se você usa a Vercel (como indica o nome da pasta `.vercel`), digite:
```bash
npx vercel --prod
```
* Siga as instruções na tela.
* Se ele perguntar "Want to deploy?", digite `Y` e aperte ENTER.
* Se perguntar qual escopo, apenas aperte ENTER.
* Se perguntar "Link to existing project?", digite `Y` e ENTER.

**Pronto!** Quando terminar, ele vai te dar um link (algo como `https://crm-prime...vercel.app`). Clique nele para ver as alterações.

---

### Resumo dos Comandos
Se quiser ser rápido, copie e cole um por um:

1. `npm install`
2. `npm run build`
3. `npx vercel --prod`
