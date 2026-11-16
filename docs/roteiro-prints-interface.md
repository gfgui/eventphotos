# Roteiro de prints das interfaces

Roteiro para percorrer o app à mão e, no caminho, capturar as telas da seção Interface do TCC. A ordem segue o uso real: o anfitrião cria o evento, três convidados entram, enviam e curtem fotos, e só então vêm as telas que precisam de conteúdo (feed, Pódio, fotos no painel).

Cada passo diz o que fazer e qual print tirar. Marque `[x]` no que já foi capturado. Os nomes de arquivo sugeridos mantêm os prints em ordem na pasta.

## 0. Preparação

### Ambiente

O Postgres do TCC usa a porta 5432, a mesma do `capag-postgres` do estágio. Se ele estiver ligado, pare-o antes e religue no fim:

```bash
docker stop capag-postgres
```

```bash
docker compose up -d
```

Rode o app em modo de produção, e não com `npm run dev`: assim o selo "N" do Next.js não aparece no canto da tela, em cima do botão "Tirar foto".

```bash
npm run build
```

```bash
npm start
```

No fim, para devolver a porta ao estágio:

```bash
docker compose stop
```

```bash
docker start capag-postgres
```

### Navegadores

- **Anfitrião:** janela normal do Chrome, larga (1280 px ou mais).
- **Convidados:** três sessões com cookies separados, como uma janela anônima do Chrome, o Edge e outro perfil do Chrome. Duas janelas anônimas do mesmo Chrome contam como o mesmo convidado.

### Prints de celular

1. Abra o DevTools (F12) e o modo de dispositivo (Ctrl+Shift+M).
2. Escolha um aparelho e use o mesmo em todos os prints, como o iPhone 12 Pro (390 × 844).
3. Para capturar, use o menu "⋮" da barra do dispositivo: "Capture screenshot" pega a tela; "Capture full size screenshot" pega a página inteira, com rolagem.

Para o painel, no tamanho da janela: Ctrl+Shift+P no DevTools e "Capture full size screenshot".

### Conteúdo

- **Fotos:** separe de 10 a 12 fotos bonitas, de preferência de uma festa, com retratos e paisagens misturados (o Mural fica melhor assim). Use fotos suas ou de bancos com licença livre. Fotos com rostos de outras pessoas só com autorização delas, porque os prints vão para o TCC.
- **Capa:** uma foto horizontal, como a do local da festa ou de um detalhe da decoração.
- **Nomes:** nomes fictícios e variados, como Maria Silva, Pedro Alves e Júlia Costa.
- **Evento:** um evento novo só para os prints, como "Casamento de Ana e Bruno". O evento do teste de carga não serve: as fotos dele são cinza e os convidados se chamam "Guest".

## 1. Painel do anfitrião

- [ ] Abrir http://localhost:3000/admin.
  Print: `painel-01-entrar.png`, a tela "Entrar no painel" (ou "Primeiro acesso", se o banco estiver vazio).
- [ ] Entrar e, na lista de eventos, tocar em "Criar evento".
- [ ] Preencher nome, "Ana" e "Bruno" em Homenageados (as iniciais dos convidados viram "AB"), data e "Idioma dos convidados" em Automático. Manter os papéis iniciais, que já trazem "Noivos". Deixar os dois rankings marcados.
  Print: `painel-02-novo-evento.png`, página inteira, antes de salvar.
- [ ] "Criar evento". Na aba Configurações, "Escolher capa" e escolher a foto da capa.
  Print: `painel-03-configuracoes.png`, página inteira: link dos convidados, abas, capa e formulário.
- [ ] Aba Aparência. Escolher o tema que vai aparecer na maioria dos prints (sugestão: Herança), "A do tema" na fonte e "Grade" no feed, e salvar.
  Print: `painel-04-aparencia.png`, página inteira: os quatro temas com prévia, as fontes e os estilos do feed.

## 2. Entrada do convidado 1 (celular)

Na janela do convidado 1, com o modo de dispositivo ligado, abra o link dos convidados mostrado no painel.

- [ ] Digitar "Maria Silva" no nome.
  Print: `convidado-01-boas-vindas.png`, com a capa, "Boas-vindas ao evento" e o nome preenchido.
- [ ] "Continuar" e escolher um papel.
  Print: `convidado-02-papel.png`, com "Passo 2 de 3" e o papel marcado.
- [ ] "Continuar", conjunto Descontraído, escolher um avatar.
  Print: `convidado-03-avatar.png`. Se quiser mostrar os dois conjuntos, troque para Discreto e tire `convidado-03b-avatar-discreto.png`.
- [ ] "Entrar na galeria".
  Print: `convidado-04-galeria-vazia.png`, com "Sua galeria começa aqui" e os botões "Tirar foto" e "Galeria".

## 3. Envio de fotos

- [ ] "Galeria", escolher uma foto e, na tela de filtros, tocar em "Quente".
  Print: `convidado-05-filtros.png`, com a foto grande e a faixa de filtros, "Quente" marcado.
- [ ] Para pegar a porcentagem do envio: no DevTools, aba Network, mudar "No throttling" para "3G". "Enviar".
  Print: `convidado-06-enviando.png`, em Minhas fotos, com "Enviando N%". Depois, volte para "No throttling".
- [ ] Enviar mais 2 ou 3 fotos pelo convidado 1, com filtros diferentes (um P&B ajuda a mostrar que o filtro aparece na galeria).

## 4. Convidados 2 e 3

- [ ] Em outra sessão, entrar como "Pedro Alves", com outro papel e outro avatar, e enviar 3 ou 4 fotos.
- [ ] Na terceira sessão, entrar como "Júlia Costa" e enviar 3 ou 4 fotos.
- [ ] (Opcional) Numa quarta sessão, entrar como "Ana" no papel "Noivos" e enviar uma foto, para mostrar que o casal também participa.
- [ ] Curtir fotos pelos três convidados, de modo que os totais fiquem diferentes: uma foto com 3 curtidas, outra com 2 e algumas com 1. Assim o Pódio e a ordem "Mais curtidas" ficam claros.

## 5. Galeria com conteúdo (convidado 1)

Recarregue a galeria do convidado 1 antes de cada print: ainda não há tempo real.

- [ ] Aba Fotos, em "Em alta".
  Print: `convidado-07-feed-grade.png`.
- [ ] Tocar em "Mais curtidas".
  Print: `convidado-08-mais-curtidas.png`.
- [ ] No painel, Aparência, trocar o feed para "Lista" e salvar. Recarregar o convidado.
  Print: `convidado-09-feed-lista.png`, com os cards de avatar, nome, papel, foto e coração.
- [ ] Trocar o feed para "Mural", salvar e recarregar.
  Print: `convidado-10-feed-mural.png`, com retratos e paisagens nas duas colunas.
- [ ] Tocar numa foto curtida.
  Print: `convidado-11-foto-aberta.png`, com a foto grande, o coração e "Fechar".
- [ ] Aba Pódio.
  Print: `convidado-12-podio.png`, com "Fotos mais curtidas" e "Quem mais enviou fotos".
- [ ] Aba Minhas fotos.
  Print: `convidado-13-minhas-fotos.png`.

## 6. Personalização: o mesmo evento em cada tema

Para uma figura que mostre a personalização, capture a mesma tela em cada tema. Sugestão: o feed em Lista, que mostra títulos, cards e botões.

- [ ] No painel, deixar o feed em "Lista". Para cada tema (Padrão, Essencial, Herança e Confete): escolher, salvar e recarregar o convidado.
  Prints: `tema-01-padrao.png`, `tema-02-essencial.png`, `tema-03-heranca.png` e `tema-04-confete.png`.
- [ ] (Opcional) Num dos temas, trocar a fonte dos títulos para outra, como Fraunces, e repetir o print.
  Print: `tema-05-fonte.png`.
- [ ] (Opcional) Boas-vindas em inglês: numa sessão que ainda não entrou no evento, tocar em English no rodapé.
  Print: `convidado-14-ingles.png`.

## 7. Painel com as fotos

- [ ] No painel, aba Fotos do evento.
  Print: `painel-05-fotos.png`, com o total, as miniaturas e "Baixar todas em ZIP".
- [ ] Tocar numa foto.
  Print: `painel-06-foto-original.png`, com "Baixar original".
- [ ] Voltar para "Todos os eventos".
  Print: `painel-07-eventos.png`, com o card do evento e os totais de convidados e fotos.

## 8. Opcional: celular de verdade

Os prints do DevTools não mostram o que o próprio celular faz. Se der, num celular na mesma rede (seção 14 do [roteiro de teste](roteiro-teste-manual.md)):

- [ ] Tocar em "Tirar foto".
  Print: `celular-01-camera.png`, com a câmera do celular aberta pelo app.
- [ ] A galeria com o tema escolhido, no navegador do celular.
  Print: `celular-02-galeria.png`.

## Onde cada print entra

| Parte da seção Interface | Prints |
| --- | --- |
| Entrada do convidado em três telas | `convidado-01` a `convidado-03` |
| Galeria e envio | `convidado-04` a `convidado-06` e `convidado-13` |
| Fotos, ordenação e estilos do feed | `convidado-07` a `convidado-11` |
| Pódio | `convidado-12` |
| Painel do anfitrião | `painel-01` a `painel-07` |
| Temas e fontes | `tema-01` a `tema-05` |
| Idiomas | `convidado-14` |

Nas legendas, siga a ABNT: "Figura N – Tela de boas-vindas do convidado", com a fonte embaixo ("Fonte: elaborado pelo autor").
