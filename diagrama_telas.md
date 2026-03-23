# Diagrama de Telas e Fluxo do Usuário - Palavra na Testa

Este documento mapeia a jornada do jogador através das telas (screens) do aplicativo, desde a autenticação até o fim do jogo.
É útil para planejar alterações de UI/UX e entender como a classe `app.to('id')` interliga as diferentes fases do jogo.

## Fluxograma Principal

```mermaid
stateDiagram-v2
    direction TB
    
    %% Telas principais
    Home: Tela Inicial (screen-home)
    Auth: Secão de Login (Dentro da Home)
    Menu: Secão de Menu (Dentro da Home)
    Options: Configurações & Categorias (screen-options)
    Teams: Definição de Equipes (screen-teams)
    Intro: Preparação da Rodada (screen-intro)
    Wheel: Roleta de Categorias (screen-wheel)
    Game: Jogo Ativo / Palavras (screen-game)
    Result: Modal de Fim de Jogo (modal-overlay)

    %% Inicio
    [*] --> Home : Abre o App
    
    %% Lógica de Home / Auth
    Home --> Auth : Web (Não autenticado)
    Auth --> Menu : Login Google c/ Sucesso
    Home --> Menu : App Nativo (APK) ou Web Autenticado

    %% Ações do Menu
    Menu --> Options : Clique em Configurações/Categorias
    Options --> Menu : Clique em Voltar
    
    Menu --> Teams : Clique em Iniciar Jogo
    
    %% Fluxo de Partida
    Teams --> Intro : Clique em Jogar Agora
    Intro --> Wheel : Modo Roleta
    Intro --> Game : Modo Automático (Sorteio Direto)
    Wheel --> Game : Após girar a roleta
    
    %% Loop do Jogo
    Game --> Intro : Fim do Tempo (Próximo Time/Rodada)
    
    %% Fim de Partida
    Game --> Result : Fim de todas as rodadas
    Result --> Menu : Fechar Modal (Volta para Home)

    %% Retorno Global Subentendido
    note right of Home
        O botão flutuante de "Início" 
        (🏠) presente em quase todas as 
        telas força o retorno para o Menu (Home),
        zerando o estado da partida atual.
    end note
```

## Descrição das Telas no Código (`index.html`)

- **`#screen-home`**: A tela principal unificada. Carrega a logo, exibe `#home-auth-section` se necessitar de verificação de permissão no YouTube (Brotherzaço), ou `#home-menu-section` se o acesso estiver liberado.
- **`#screen-options`**: Tela com abas (Tabs) para controlar as Regras do Jogo, Áudio, e gerenciar/importar Categorias.
- **`#screen-teams`**: Onde o usuário define o nome dos times (ou apenas um time no modo Solo) antes de começar oficialmente.
- **`#screen-intro`**: Tela de transição (`prepara!`) que anuncia qual time vai jogar agora e em qual rodada estamos.
- **`#screen-wheel`**: Animação em canvas da roleta sorteando a categoria.
- **`#screen-game`**: A tela principal de gameplay contendo a carta com a palavra, o temporizador e detectores de movimento (acertou/pulou).
- **`#modal-overlay`**: Modal genérico usado para avisos, mas principalmente usado para mostrar o placar final quando as rodadas acabam.
