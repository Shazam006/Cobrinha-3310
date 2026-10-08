# Cobrinha 3310 — aplicativo para iPhone

Jogo retrô em português, com direcional, swipe, três velocidades, recorde local, pausa, reinício e som após interação. Os arquivos do jogo ficam dentro do aplicativo: jogar não depende da hospedagem nem de login.

## Gerar e instalar

O workflow `.github/workflows/cobrinha-ios.yml` usa um Mac do GitHub Actions, executa os testes e gera `Cobrinha-3310-sem-assinatura.ipa`. Abra a execução concluída em Actions e baixe o artefato `Cobrinha-3310-iPhone-sem-assinatura`.

No Windows, abra o Sideloadly já utilizado no Open Finance, conecte o iPhone desbloqueado por USB, selecione o `.ipa`, use sua própria conta Apple e clique em Start. Senha e código de autenticação devem ser digitados pelo proprietário diretamente no programa. A instalação só é concluída quando aparecer Done, 100% e o app abrir no iPhone.

Com uma conta Apple gratuita, a assinatura requer renovação periódica (normalmente sete dias). Use a mesma conta e preserve o app instalado ao renovar. O arquivo sem assinatura não instala diretamente por um link do Safari.

Identificador próprio: `br.com.pedro.cobrinha3310`. Este app não substitui o Open Finance. Recorde e preferências ficam localmente no iPhone.

## Estrutura e desenvolvimento

- `dist/`: versão web/PWA independente.
- `tests/`: regras, colisões, 4096 sequências rápidas, temporizador e cache offline.
- `native-app/`: wrapper iOS com Capacitor 8.5.2, ícones próprios, arquivos locais e pausa ao sair do app.

Com Node.js 22.13 ou superior, entre em `native-app` e execute `npm ci`, `npm run verify`, `npm run build` e `npx cap sync ios`. A compilação do `.ipa` exige macOS/Xcode: `node scripts/build-ios-unsigned.mjs`.

O scaffold iOS segue a estrutura já compilada do Open Finance, adaptada para um app separado. Não contém interface, dados financeiros nem permissões daquele app. Esta versão não precisa de câmera, localização, contatos, arquivos compartilhados ou backend.

O resultado da instalação e o teste em iPhone físico devem ser registrados após executados; a preparação do projeto ou o sucesso da compilação não prova instalação no aparelho.
