# Cobrinha 3310

Jogo retrô em português, criado a partir do código integral do briefing de 07/10/2026. Publicação pela plataforma Sites, a mesma usada no Open Finance, em projeto independente.

Endereço previsto: https://cobrinha-3310.candid-owl-3213.chatgpt.site

Este endereço só deve ser considerado publicado quando a implantação retornar `succeeded`. O comprovante de publicação acompanha a entrega. O acesso inicial é privado, pela conta proprietária do site, seguindo o padrão do Sites. No iPhone, pode ser necessário entrar nessa conta na primeira abertura online.

## Jogar e instalar no iPhone

1. Abra o endereço HTTPS no Safari e aguarde o carregamento completo online.
2. Toque em **Compartilhar → Adicionar à Tela de Início**.
3. Ative **Abrir como App**, se a opção aparecer, e confirme **Adicionar**.
4. Abra pelo ícone da Cobrinha. Teste o modo avião somente depois de uma visita online que tenha terminado de preencher o cache.

Este projeto é uma PWA; não há arquivo `.ipa` nem publicação na App Store.

Use o direcional ou deslize sobre o tabuleiro. No computador, use setas/WASD; Espaço ou P pausa/continua. Enter inicia/reinicia. Quando um botão estiver com foco, Enter/Espaço aciona esse botão. O som só é liberado após interação do usuário; vibração é opcional.

## Regras

Grade 20×20, cobra inicial de três segmentos, +10 por comida. Colisão com bordas/corpo encerra a partida; a antiga cauda pode ser ocupada se sair no mesmo movimento. Vitória ao preencher 400 células. Fácil: 170 ms, normal: 125 ms, rápido: 85 ms. A cada 50 pontos, menos 5 ms até o mínimo de 52 ms. Fila limitada a duas direções, sem reversão direta.

## Arquivos

`dist/` contém a raiz do site: `index.html`, `manifest.webmanifest`, `service-worker.js`, `.nojekyll`, os quatro PNGs em `icons/` e este guia. O ZIP de publicação contém esses arquivos diretamente na raiz, sem uma pasta adicional. `tests/` contém os testes de regras e cache; `.openai/hosting.json` identifica o projeto Sites.

Os arquivos antigos em `D:\APP\Snake` foram inspecionados e preservados. O ZIP antigo contém somente `cobrinha_nokia.html`, sem melhorias de PWA. A base adotada foi o Markdown informado pelo usuário; os ícones foram gerados pelo script da seção 13. Não há afiliação com fabricante de celulares.

## Executar localmente

Na pasta com `index.html`, execute `python -m http.server 8080` e abra http://localhost:8080. Na cópia do projeto, execute o servidor dentro de `dist/`. Para testar service worker no iPhone, use a publicação HTTPS; um endereço HTTP da rede do notebook não substitui isso.

Testes reproduzíveis, com Node.js:

```text
node tests/verify.mjs
node tests/service-worker.mjs
```

## Offline, armazenamento e atualização

O service worker pré-cacheia HTML, manifesto e quatro ícones. Navegação e manifesto consultam primeiro a rede e usam o cache se ela falhar; ícones usam cache primeiro. Só os sete caminhos do próprio app são interceptados, no escopo do projeto. Outros domínios, caminhos desconhecidos e requisições POST não são interceptados.

Ao mudar HTML, manifesto ou ícones, incremente `CACHE_NAME` no service worker antes de publicar. A ativação remove somente caches antigos da Cobrinha, sem limpar outros aplicativos. Reabra/recarregue online para atualizar. A primeira visita sem rede não é suportada. Uma falha ao instalar o service worker não impede o jogo online.

Recorde: `snake3310_best`; velocidade: `snake3310_difficulty`; som: `snake3310_sound`. São locais ao navegador/origem, não são sincronizados e podem ser removidos pelo usuário ou pelo sistema. Falhas de armazenamento, áudio ou vibração não impedem jogar.

## Publicar novamente

Use a integração Sites e o `project_id` existente de `.openai/hosting.json`; não crie outro site para uma atualização. Prepare a fonte com o fluxo `site-workflow.mjs` do plugin Sites, usando uma credencial temporária na entrada padrão. Empacote `dist` e o manifesto de hospedagem, salve a versão e publique. Aguarde `succeeded` com a URL HTTPS real antes de afirmar que a atualização entrou no ar. Nenhum segredo é necessário no jogo nem deve ser incluído no ZIP.

Para hospedagem estática alternativa, o ZIP já tem `index.html` na raiz e URLs relativas compatíveis com subdiretório. A entrega atual usa Sites.

## Validação e pendências

Executados: nove grupos de testes de regras (incluindo 4096 sequências rápidas), teste do service worker em subdiretório e fluxos no Chromium com toque, teclado, pausa, reinício, preferências persistidas, sete recursos em cache e recarga/jogo offline. Viewports: 375×667, 390×844, 430×932, 844×390 e 320×568. Nos três tamanhos pedidos, todos os botões cabem no viewport e têm pelo menos 44×44 px. A página permite rolar as instruções; só o tabuleiro bloqueia os gestos de rolagem.

Não foi usado iPhone físico. O motor WebKit não estava instalado neste ambiente. Não atestamos compatibilidade real com Safari/iOS. O adaptador WebMCP opcional foi testado com registro simulado; validação em implementação nativa da API indisponível. Navegadores sem essa API continuam funcionando normalmente.

Ainda conferir em iPhone real: instalação pelo Safari, toque/swipe e áudio, bloquear/desbloquear tela, alternar aplicativos, reabrir offline em modo avião, rotação e texto ampliado. Em telas extremamente pequenas ou texto ampliado, a página continua rolável e os controles podem exigir rolagem. Não há conta de jogador, placar online, anúncios, compras ou backend de jogo.
