# Roteiro de teste manual: fases 1 a 3

Roteiro para conferir à mão o que já está pronto: primeiro acesso do anfitrião, criação e configuração do evento (com capa e rankings), aparência, entrada do convidado, envio de fotos pela câmera ou pela galeria, com filtros, curtidas, Pódio, download dos originais e idiomas. Moderação, QR Code e tempo real ficam fora, porque ainda não existem.

Cada passo traz o que fazer e, em seguida, o resultado esperado. Marque `[x]` no que passar e anote o que falhar.

## 0. Ambiente

Para subir do zero, num terminal na pasta do projeto:

```bash
docker compose up -d
```

```bash
npm run dev
```

O banco já deve estar migrado (`npx prisma migrate status` mostra "Database schema is up to date!"). Se não estiver, rode `npm run db:migrate`.

- [ ] Abrir http://localhost:3000/api/health.
  Esperado: `{"database":"ok","storage":"ok"}`.
- [ ] Abrir http://localhost:3000.
  Esperado: redireciona para `/pt-BR` (ou `/en`, se o navegador estiver em inglês) e mostra "Escaneie o QR Code do evento para entrar."

**Navegadores.** O anfitrião e cada convidado precisam de cookies separados. Sugestão:

- Anfitrião: janela normal do Chrome.
- Convidado 1: janela anônima do Chrome.
- Convidado 2: outro navegador (Edge ou Firefox) ou outro perfil do Chrome. Duas janelas anônimas do mesmo Chrome compartilham os cookies, então contam como o mesmo convidado.

Para simular o celular, use o modo de dispositivo do DevTools (F12, depois Ctrl+Shift+M) com um iPhone ou Pixel.

**Fotos de teste.** Qualquer foto serve, mas alguns casos pedem arquivos específicos. Os de abaixo foram gerados nesta sessão em `C:\Users\guilh\AppData\Local\Temp\claude\2045ac9d446bd801\5164f7d1-e56b-4a79-96be-ee6bd7ab7610\scratchpad\fotos-teste` (cole o caminho na barra de endereço da janela de escolher arquivo):

| Arquivo | Para quê |
| --- | --- |
| `01-paisagem-com-gps.jpg` | 12 MP com GPS e modelo da câmera no EXIF: a versão dos convidados não pode ter isso |
| `02-retrato-orientacao-exif.jpg` | Gravada deitada, com EXIF Orientation 6, como um retrato do celular: precisa aparecer em pé, com a seta para cima |
| `03-imagem.png` e `04-imagem.webp` | Outros tipos aceitos |
| `05-corrompida.jpg` | Texto com nome de .jpg: o navegador aceita, e o worker deve marcar como falha |
| `06-grande-55mb.jpg` | Passa do limite de 50 MB: recusada antes de enviar |
| `07-desenho.svg` | Tipo fora da lista: recusado |
| `08-lote-1.jpg` a `08-lote-5.jpg` | Fotos pequenas para encher a galeria e o ZIP |
| `09-pesada-progresso.jpg` | 10 MB (duas partes de 5 MB): dá tempo de ver a porcentagem e de derrubar a rede |

**Se a página ficar recarregando sozinha** logo depois de subir o `npm run dev`: é o servidor de desenvolvimento terminando a primeira compilação. Abra outra página e volte; se continuar, pare e suba o `npm run dev` de novo.

## 1. Primeiro acesso do anfitrião

O código de configuração é o valor de `ADMIN_SETUP_CODE` no arquivo `.env`.

- [ ] Abrir http://localhost:3000/admin.
  Esperado: vai para `/pt-BR/admin/setup`, com o título "Primeiro acesso".
- [ ] Abrir http://localhost:3000/pt-BR/admin/login.
  Esperado: volta para o setup, porque ainda não existe conta.
- [ ] Preencher tudo certo, mas com um código errado, e tocar em "Criar conta".
  Esperado: "Esse código de configuração está incorreto."
- [ ] Código certo e senha com menos de 12 caracteres.
  Esperado: o próprio navegador barra o envio pelo tamanho mínimo.
- [ ] Código certo e as duas senhas diferentes.
  Esperado: "As duas senhas não são iguais."
- [ ] Código certo, nome, e-mail e senha de 12 caracteres ou mais, repetida igual.
  Esperado: entra no painel ("Painel de eventos") com o estado vazio "Nenhum evento ainda".
- [ ] Abrir de novo http://localhost:3000/pt-BR/admin/setup.
  Esperado: vai direto para o painel, porque já há sessão.

### Sessão

- [ ] Tocar em "Sair".
  Esperado: vai para "Entrar no painel".
- [ ] Abrir `/pt-BR/admin/setup` sem sessão.
  Esperado: vai para o login. O código de configuração não serve mais.
- [ ] Entrar com o e-mail certo e a senha errada.
  Esperado: "E-mail ou senha incorretos..." (a mesma mensagem para um e-mail que não existe).
- [ ] Entrar com o e-mail em maiúsculas e a senha certa.
  Esperado: entra (o e-mail é comparado em minúsculas).

O bloqueio depois de 5 senhas erradas fica para o fim (seção 13), porque trava o login por 15 minutos.

## 2. Criar o evento

- [ ] Em "Criar evento", conferir o formulário.
  Esperado: nome, data, "Idioma dos convidados" em "Automático, pelo idioma do celular", quatro papéis (Convidado, Padrinho ou madrinha, Família e Amigos) e os rankings "Fotos mais curtidas" e "Quem mais enviou fotos", os dois marcados.
- [ ] Deixar dois papéis com o mesmo nome (como "Família" e "família") e salvar.
  Esperado: "Cada papel precisa de um nome diferente."
- [ ] Adicionar um papel ("Noivos"), remover outro e conferir que a lista acompanha.
- [ ] Criar o evento com nome acentuado, como "Casamento de Ana & João", e uma data.
  Esperado: abre a página do evento, com as abas Configurações, Aparência e Fotos. Em Configurações, o campo Capa está vazio.
- [ ] Conferir o "Link dos convidados".
  Esperado: `http://localhost:3000/casamento-de-ana-joao`, sem acentos e sem o "&".
- [ ] Voltar em "Todos os eventos".
  Esperado: o card mostra o nome, a data por extenso, "Convidados: 0" e "Fotos: 0".
- [ ] (Opcional) Criar outro evento com o mesmo nome.
  Esperado: o link termina em `-2`.

## 3. Aparência

- [ ] Abrir a aba Aparência.
  Esperado: os temas Padrão, Essencial, Herança e Confete, cada um com prévia, e "Em uso" no Padrão. Abaixo, "Fonte dos títulos" em "A do tema" e "Estilo do feed" em "Grade". A fonte e o feed têm a seção 11.
- [ ] Escolher Herança e tocar em "Salvar aparência".
  Esperado: a mensagem de aparência salva. O painel continua com o visual padrão.
- [ ] Depois da seção 4, voltar aqui, trocar para Confete e recarregar a página do convidado.
  Esperado: o convidado só vê o tema novo depois de recarregar (ainda não há tempo real).

## 4. Entrada do convidado (convidado 1, janela anônima)

- [ ] Na página do evento no painel, tocar em "Abrir como convidado" e copiar o endereço para a janela anônima. Ou colar o "Link dos convidados" direto.
  Esperado: o endereço sem idioma vira `/pt-BR/casamento-de-ana-joao`, já com o tema do evento.
- [ ] Passo 1: conferir a tela.
  Esperado: as iniciais do evento, porque ele ainda não tem capa, "Boas-vindas ao evento", nome e data do evento, campo "Qual é o seu nome?" e, no rodapé, Português e English.
- [ ] Com o nome vazio ou só com espaços.
  Esperado: não dá para continuar.
- [ ] Digitar um nome, como "Maria Silva", e continuar.
  Esperado: "Passo 2 de 3", "Prazer, Maria Silva." e os papéis do evento como botões grandes.
- [ ] Sem escolher papel.
  Esperado: não dá para continuar.
- [ ] "Voltar" do passo 2.
  Esperado: volta ao nome, que continua preenchido.
- [ ] Escolher um papel e continuar.
  Esperado: "Passo 3 de 3", "Escolha seu avatar", com os conjuntos Descontraído e Discreto, 16 avatares cada.
- [ ] Trocar de conjunto e escolher um avatar.
  Esperado: o avatar fica marcado e "Entrar na galeria" é liberado.
- [ ] Tocar em "Entrar na galeria".
  Esperado: vai para `/pt-BR/casamento-de-ana-joao/gallery`, com o avatar, "Olá, Maria Silva", o papel, as abas Fotos, Pódio e Minhas fotos, o estado vazio "Sua galeria começa aqui" e os botões "Tirar foto" e "Galeria".
- [ ] Abrir de novo o link do evento.
  Esperado: vai direto para a galeria, sem repetir a entrada.
- [ ] No painel (janela normal), recarregar a lista de eventos.
  Esperado: "Convidados: 1".

## 5. Envio de fotos (convidado 1)

Cada envio passa pela tela "Escolha um filtro". Nesta seção, toque em "Enviar" sem mudar o filtro (Original); os filtros têm a seção 12.

### Caminho feliz

- [ ] "Galeria" e escolher `01-paisagem-com-gps.jpg`.
  Esperado: abre a tela de filtros, com a foto grande e os sete filtros embaixo.
- [ ] "Enviar".
  Esperado: muda para a aba "Minhas fotos", com a prévia, "Enviando N%", depois "Processando" e, em poucos segundos, a miniatura sem selo, com o coração e 0.
- [ ] Aba "Fotos".
  Esperado: a foto aparece lá também.
- [ ] Tocar na foto.
  Esperado: abre a foto grande, com "Foto de Maria Silva" e o botão "Fechar".
- [ ] Enviar `02-retrato-orientacao-exif.jpg`.
  Esperado: na miniatura e na foto grande, o retrato aparece em pé, com a seta para cima.
- [ ] Enviar `03-imagem.png` e `04-imagem.webp`.
  Esperado: as duas são publicadas.
- [ ] Selecionar de uma vez os cinco `08-lote-*.jpg`.
  Esperado: a tela de filtros avisa que o filtro vale para as 5 fotos. Depois de "Enviar", as cinco sobem em paralelo (até 3 ao mesmo tempo) e são publicadas.

### Recusas e falhas

- [ ] Enviar `06-grande-55mb.jpg`.
  Esperado: "Envie fotos JPEG, PNG, WebP ou HEIC de até 50 MB.", a tela de filtros nem abre, e nada é enviado.
- [ ] Na janela de escolher arquivo, mudar o filtro para "Todos os arquivos" e enviar `07-desenho.svg`.
  Esperado: a mesma mensagem de recusa.
- [ ] Enviar `05-corrompida.jpg`.
  Esperado: sobe, fica em "Processando" e termina como "Falhou", só em "Minhas fotos". Não aparece em "Fotos" nem para os outros convidados.

### Queda da rede (RNF06)

Pelo DevTools (F12), aba Network: o seletor "No throttling" tem "Slow 4G", "3G" e "Offline".

- [ ] Com "3G", enviar `09-pesada-progresso.jpg`.
  Esperado: a porcentagem sobe aos poucos.
- [ ] No meio do envio, mudar para "Offline" por uns 10 segundos e voltar para "No throttling".
  Esperado: o envio continua sozinho, a partir da última parte concluída, e a foto é publicada.
- [ ] Repetir, mas deixando "Offline" por uns 2 minutos.
  Esperado: depois das tentativas automáticas (cerca de 1 minuto e meio), a foto mostra "Tentar de novo". Voltando a rede e tocando nela, o envio continua.

### Outro convidado (convidado 2, outro navegador)

- [ ] Entrar no evento com outro nome, outro papel e outro avatar.
  Esperado: "Fotos" mostra as fotos publicadas da Maria. "Minhas fotos" está vazia.
- [ ] Tocar numa foto da Maria.
  Esperado: "Foto de Maria Silva".
- [ ] Enviar uma foto pelo convidado 2 e recarregar a galeria do convidado 1.
  Esperado: a foto nova só aparece depois de recarregar (ainda não há tempo real).

### Metadados (RNF08)

A versão dos convidados não pode ter EXIF; o original, sim.

- [ ] Na galeria, abrir a `01-paisagem-com-gps.jpg` em tamanho grande, clicar com o botão direito, "Salvar imagem como" e guardar o `.webp` em Downloads.
- [ ] Na pasta do projeto, conferir o arquivo salvo:

```bash
node -e "require('sharp')(process.argv[1]).metadata().then(m => console.log(m.format, m.width + 'x' + m.height, m.exif ? 'TEM EXIF' : 'sem EXIF'))" "C:\Users\guilh\Downloads\NOME-DO-ARQUIVO.webp"
```

  Esperado: `webp ... sem EXIF`.

## 6. Fotos no painel (anfitrião)

- [ ] Na lista de eventos.
  Esperado: os totais de convidados e de fotos batem. A foto com falha não conta.
- [ ] Aba Fotos do evento.
  Esperado: "Fotos: N (tamanho)", as miniaturas, "Baixar original" em cada uma e "Baixar todas em ZIP".
- [ ] "Baixar original" da `01-paisagem-com-gps.jpg`.
  Esperado: baixa um `.jpg` com o nome do convidado no arquivo.
- [ ] Comparar o SHA-256 do original baixado com o do arquivo enviado (RNF04), no PowerShell:

```powershell
Get-FileHash "C:\Users\guilh\Downloads\ARQUIVO-BAIXADO.jpg", "C:\Users\guilh\AppData\Local\Temp\claude\2045ac9d446bd801\5164f7d1-e56b-4a79-96be-ee6bd7ab7610\scratchpad\fotos-teste\01-paisagem-com-gps.jpg" -Algorithm SHA256
```

  Esperado: os dois hashes são iguais.
- [ ] Rodar o comando de metadados da seção 5 no original baixado.
  Esperado: `jpeg 4000x3000 TEM EXIF`. O original fica intacto, com o GPS.
- [ ] "Baixar todas em ZIP" e abrir o arquivo.
  Esperado: pastas por papel e, dentro, por convidado, com todos os originais publicados e nenhum arquivo da foto com falha.

## 7. Editar o evento

- [ ] Na aba Configurações, mudar o nome e a data e "Salvar alterações".
  Esperado: "Alterações salvas." O link dos convidados não muda.
- [ ] Renomear um papel que um convidado já escolheu e salvar.
  Esperado: salva, e o convidado passa a mostrar o nome novo depois de recarregar.
- [ ] Tentar remover esse mesmo papel.
  Esperado: o botão de remover dele fica desabilitado, com o aviso de que papéis já escolhidos podem mudar de nome, mas não ser removidos.
- [ ] Remover um papel que ninguém escolheu e salvar.
  Esperado: salva. Na entrada de um convidado novo, o papel some.

## 8. Idiomas (RNF09)

- [ ] Na tela de entrada ou na galeria, tocar em English no rodapé.
  Esperado: tudo em inglês, com o endereço em `/en/...`. Os nomes dos papéis continuam como o anfitrião digitou.
- [ ] Abrir de novo o link sem idioma do evento.
  Esperado: vai para `/en/...`, porque a escolha fica no cookie `NEXT_LOCALE`.
- [ ] Num navegador que ainda não abriu o app (ou depois de apagar os cookies de `localhost`), com o inglês no topo dos idiomas preferidos, abrir o link sem idioma.
  Esperado: abre em inglês na primeira visita. Qualquer página com `/pt-BR` ou `/en` grava a escolha no cookie, e ela passa a valer no lugar do idioma do navegador.
- [ ] No painel, mudar "Idioma dos convidados" para Português e salvar. No convidado, abrir `/en/<slug>/gallery`.
  Esperado: redireciona para `/pt-BR/...`, e os links de idioma somem do rodapé.
- [ ] Voltar o idioma para Automático.
  Esperado: os links de idioma voltam.

## 9. Capa do evento (RF01)

- [ ] No painel, aba Configurações do evento, "Escolher capa" e escolher `01-paisagem-com-gps.jpg`.
  Esperado: a prévia mostra a foto, e os botões passam a ser "Trocar capa" e "Remover capa".
- [ ] Numa janela que ainda não entrou no evento (ou depois de apagar os cookies de `localhost`), abrir o link do evento.
  Esperado: as boas-vindas mostram a capa no lugar das iniciais.
- [ ] Clicar com o botão direito na capa, "Salvar imagem como", e rodar no arquivo o comando de metadados da seção 5.
  Esperado: `webp 1600x1200 sem EXIF`. O GPS da foto não chega aos convidados.
- [ ] Tentar `07-desenho.svg` como capa (filtro "Todos os arquivos" na janela de escolher arquivo).
  Esperado: "Escolha uma foto JPEG, PNG, WebP ou HEIC.", e a capa continua a mesma.
- [ ] "Remover capa".
  Esperado: a prévia fica vazia, e as boas-vindas voltam a mostrar as iniciais.

## 10. Curtidas, ordenação e Pódio (RF10, RF11 e RF04)

Com os dois convidados da seção 5, cada um no seu navegador.

- [ ] Convidado 1, aba Fotos: tocar no coração de uma foto do convidado 2.
  Esperado: o coração fica cheio e o número sobe para 1 na hora.
- [ ] Recarregar a página.
  Esperado: a curtida continua lá, com 1.
- [ ] Tocar duas vezes seguidas, bem rápido, no coração de outra foto, e recarregar.
  Esperado: depois de recarregar, o coração e o número batem com o que a tela mostrava antes.
- [ ] Abrir uma foto curtida em tamanho grande.
  Esperado: o botão com o coração, ao lado de "Fechar", mostra o mesmo total da grade.
- [ ] Convidado 2: recarregar e curtir a mesma foto que o convidado 1 curtiu.
  Esperado: o total dela vai para 2.
- [ ] Trocar a ordem entre "Em alta", "Mais curtidas" e "Recentes".
  Esperado: em "Mais curtidas", a foto com 2 curtidas vem primeiro; em "Recentes", a última enviada.
- [ ] Aba Pódio.
  Esperado: "Fotos mais curtidas", com a foto de 2 curtidas em primeiro, e "Quem mais enviou fotos", com o convidado 1 em primeiro.
- [ ] No painel, desmarcar "Fotos mais curtidas", salvar e recarregar o Pódio do convidado.
  Esperado: só o bloco "Quem mais enviou fotos".
- [ ] Desmarcar também "Quem mais enviou fotos", salvar e recarregar a galeria.
  Esperado: a aba Pódio some. Os corações e a ordem "Mais curtidas" continuam.
- [ ] Marcar os dois de novo e salvar.

## 11. Fonte dos títulos e estilo do feed (RF02)

- [ ] No painel, aba Aparência, escolher a fonte "Fraunces".
  Esperado: as prévias dos temas mostram o nome do evento na Fraunces.
- [ ] Escolher o estilo "Lista", "Salvar aparência" e recarregar a galeria do convidado.
  Esperado: o nome do evento na Fraunces, e cada foto num card, com avatar, nome, papel, a foto sem corte e o coração.
- [ ] Escolher "Mural", salvar e recarregar o convidado.
  Esperado: duas colunas, cada foto no seu formato: o retrato `02` fica mais alto que as paisagens.
- [ ] Voltar para "A do tema" e "Grade", e salvar.

## 12. Câmera e filtros (RF09 e RNF04)

- [ ] Convidado 1: "Galeria", escolher `03-imagem.png`, tocar no filtro "P&B" e em "Enviar".
  Esperado: a prévia em "Minhas fotos" já aparece em preto e branco, e a foto publicada continua P&B na grade, na foto grande e na aba Fotos do painel.
- [ ] "Galeria", escolher uma foto e, na tela de filtros, "Cancelar".
  Esperado: nada é enviado.
- [ ] Enviar `01-paisagem-com-gps.jpg` com o filtro "Vintage". No painel, baixar o original dessa foto e comparar o SHA-256 com o do arquivo, como na seção 6.
  Esperado: os hashes são iguais. O filtro não muda o arquivo.
- [ ] No computador, "Tirar foto".
  Esperado: abre a janela de escolher arquivo, porque o computador não tem a câmera do celular. A câmera de verdade fica para a seção 14.

## 13. Acesso e segurança

- [ ] Abrir um endereço de evento que não existe, como http://localhost:3000/nao-existe.
  Esperado: "Página não encontrada".
- [ ] Na galeria do convidado, abrir uma foto em tamanho grande, copiar o endereço da imagem (`/api/media/<id>/display`) e abrir na janela do anfitrião, que não entrou no evento como convidado. Não use outra janela anônima: ela compartilha os cookies do convidado 1.
  Esperado: erro 401, sem a foto.
- [ ] No navegador do convidado, abrir `/api/admin/media/<id>/original`, com o mesmo id.
  Esperado: erro 401. Só o anfitrião baixa o original.
- [ ] Sair do painel e abrir o endereço de um evento no painel (`/pt-BR/admin/events/<id>`).
  Esperado: vai para o login.
- [ ] Por último, errar a senha 5 vezes seguidas e depois tentar com a senha certa.
  Esperado: continua recusando por 15 minutos, com a mesma mensagem.

Para destravar antes dos 15 minutos:

```bash
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "update hosts set failed_logins = 0"'
```

## 14. Opcional: celular na mesma rede

1. Conectar o celular no mesmo Wi-Fi do computador. O IP do computador nesta rede era `10.99.59.149`; confira com `ipconfig`.
2. No `.env`, trocar `PUBLIC_URL` para `http://10.99.59.149:3000` e reiniciar o `npm run dev`.
3. No celular, abrir `http://10.99.59.149:3000/<slug>` e repetir as seções 4, 5 e 12. "Tirar foto" deve abrir direto a câmera do celular. No iPhone, testar também uma foto HEIC da galeria.
4. Se o celular não conectar, liberar as portas 3000 e 3900 no firewall do Windows.

Com `PUBLIC_URL` no IP, envios feitos de `localhost` são recusados. No computador, use o endereço com o IP também. Ao terminar, volte `PUBLIC_URL` para `http://localhost:3000`.

## Recomeçar do zero

Para testar de novo o primeiro acesso, apague o banco e as fotos. **Isso apaga todos os dados locais**, incluindo os do teste de carga.

```bash
docker compose down -v
```

```bash
docker compose up -d
```

```bash
npx prisma migrate deploy
```

Depois, reinicie o `npm run dev`, para o app recriar o CORS do bucket e a fila do worker.
