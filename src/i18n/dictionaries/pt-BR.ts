export const ptBR = {
  metadata: {
    title: "Fotos do evento",
    description: "Envie, curta e veja as fotos do evento.",
  },
  home: {
    title: "Fotos do evento",
    scanQrCode: "Escaneie o QR Code do evento para entrar.",
  },
  languageSwitcher: {
    label: "Idioma",
  },
  notFound: {
    title: "Página não encontrada",
    description: "Confira o endereço ou escaneie o QR Code do evento de novo.",
  },
  join: {
    stepProgress: "Passo {step} de {total}",
    back: "Voltar",
    continue: "Continuar",
    welcome: "Boas-vindas ao evento",
    coverAlt: "Capa do evento",
    nameLabel: "Qual é o seu nome?",
    namePlaceholder: "Digite seu nome completo",
    roleGreeting: "Prazer, {name}.",
    roleTitle: "Quem é você nesse dia especial?",
    avatarEyebrow: "Último detalhe",
    avatarTitle: "Escolha seu avatar",
    avatarSets: {
      casual: "Descontraído",
      discreet: "Discreto",
    },
    chooseAvatar: "Escolher avatar {number}",
    enter: "Entrar na galeria",
    entering: "Entrando",
    errors: {
      invalid: "Confira seus dados e tente de novo.",
      closed: "Este evento não está recebendo novos convidados.",
      network: "Não foi possível entrar. Confira o Wi-Fi e tente de novo.",
    },
  },
  gallery: {
    greeting: "Olá, {name}",
    tabsLabel: "Seções da galeria",
    tabs: {
      photos: "Fotos",
      podium: "Pódio",
      mine: "Minhas fotos",
    },
    sortLabel: "Ordenar as fotos",
    sort: {
      hot: "Em alta",
      top: "Mais curtidas",
      new: "Recentes",
    },
    like: "Curtir a foto de {name}. Curtidas: {count}",
    unlike: "Tirar a curtida da foto de {name}. Curtidas: {count}",
    likeFailed:
      "Não foi possível salvar a curtida. Confira o Wi-Fi e tente de novo.",
    podium: {
      photosTitle: "Fotos mais curtidas",
      photosEmpty: "Nenhuma foto foi curtida ainda.",
      guestsTitle: "Quem mais enviou fotos",
      guestsEmpty: "Nenhuma foto foi publicada ainda.",
      place: "{place}º lugar",
      likes: "Curtidas: {count}",
      photos: "Fotos: {count}",
    },
    takePhoto: "Tirar foto",
    choosePhotos: "Galeria",
    filters: {
      title: "Escolha um filtro",
      hint: "O filtro só muda como a foto aparece; o arquivo enviado continua o original.",
      count: "O filtro vale para as {count} fotos.",
      noPreview:
        "Este navegador não mostra a prévia desta foto, mas o filtro vale do mesmo jeito.",
      send: "Enviar",
      cancel: "Cancelar",
      names: {
        none: "Original",
        mono: "P&B",
        warm: "Quente",
        cool: "Frio",
        vivid: "Vivo",
        soft: "Suave",
        vintage: "Vintage",
      },
    },
    emptyTitle: "Sua galeria começa aqui",
    emptyDescription:
      "Adicione sua primeira foto e compartilhe esse momento com todos os convidados.",
    emptyAction: "Escolher foto",
    photoBy: "Foto de {name}",
    closeViewer: "Fechar",
    status: {
      uploading: "Enviando {percent}%",
      processing: "Processando",
      pendingApproval: "Em moderação",
      failed: "Falhou",
      retry: "Tentar de novo",
    },
    uploadRefused: "Envie fotos JPEG, PNG, WebP ou HEIC de até {max} MB.",
  },
  admin: {
    panel: "Painel de eventos",
    signOut: "Sair",
    setup: {
      title: "Primeiro acesso",
      description: "Crie a conta que vai administrar os eventos.",
      code: "Código de configuração",
      codeHint: "É o valor de ADMIN_SETUP_CODE, no arquivo .env do servidor.",
      name: "Seu nome",
      email: "E-mail",
      password: "Senha",
      passwordHint: "Use pelo menos {min} caracteres.",
      confirmation: "Repita a senha",
      submit: "Criar conta",
      errors: {
        invalid: "Confira os campos e tente de novo.",
        code: "Esse código de configuração está incorreto.",
        mismatch: "As duas senhas não são iguais.",
        taken: "A conta de administrador já foi criada. Entre com ela.",
        network: "Não foi possível criar a conta. Tente de novo.",
      },
    },
    login: {
      title: "Entrar no painel",
      description: "Use o e-mail e a senha da conta de administrador.",
      email: "E-mail",
      password: "Senha",
      submit: "Entrar",
      errors: {
        invalid:
          "E-mail ou senha incorretos. Depois de várias tentativas erradas, o acesso fica bloqueado por alguns minutos.",
        network: "Não foi possível entrar. Tente de novo.",
      },
    },
    events: {
      title: "Seus eventos",
      create: "Criar evento",
      emptyTitle: "Nenhum evento ainda",
      emptyDescription:
        "Crie o primeiro evento para gerar o link dos convidados.",
      guests: "Convidados: {count}",
      photos: "Fotos: {count}",
    },
    eventForm: {
      newTitle: "Novo evento",
      name: "Nome do evento",
      namePlaceholder: "Casamento de Ana e Bruno",
      date: "Data",
      guestLocale: "Idioma dos convidados",
      guestLocaleAuto: "Automático, pelo idioma do celular",
      guestLocaleHint:
        "No automático, cada convidado vê o idioma do celular e pode trocar no rodapé. Com um idioma escolhido, todas as telas do evento ficam nele.",
      roles: "Papéis dos convidados",
      rolesHint: "Ao entrar, cada convidado escolhe um destes.",
      roleName: "Nome do papel {number}",
      addRole: "Adicionar papel",
      removeRole: "Remover o papel {number}",
      roleInUse:
        "Papéis já escolhidos por convidados podem mudar de nome, mas não ser removidos.",
      rankings: "Rankings",
      rankingsHint:
        "Cada ranking ligado aparece na aba Pódio dos convidados. Com os dois desligados, a aba some.",
      likesRanking: "Fotos mais curtidas",
      uploadsRanking: "Quem mais enviou fotos",
      // Only a starting point: the hosts edit them, and they are saved as event data.
      defaultRoles: ["Convidado", "Padrinho ou madrinha", "Família", "Amigos"],
      create: "Criar evento",
      save: "Salvar alterações",
      saved: "Alterações salvas.",
      errors: {
        invalid: "Confira o nome, a data e os papéis.",
        duplicateRole: "Cada papel precisa de um nome diferente.",
        roleInUse:
          "Um convidado acabou de escolher um dos papéis removidos. Recarregue a página.",
        network: "Não foi possível salvar. Tente de novo.",
      },
    },
    cover: {
      title: "Capa",
      hint: "Aparece nas boas-vindas dos convidados, no lugar das iniciais do evento.",
      alt: "Capa do evento",
      empty: "Sem capa",
      choose: "Escolher capa",
      change: "Trocar capa",
      remove: "Remover capa",
      errors: {
        type: "Escolha uma foto JPEG, PNG, WebP ou HEIC.",
        size: "Escolha uma foto de até {max} MB.",
        unreadable: "Não foi possível ler essa imagem. Tente outra.",
        network: "Não foi possível salvar a capa. Tente de novo.",
      },
    },
    event: {
      back: "Todos os eventos",
      settings: "Configurações",
      appearance: "Aparência",
      photos: "Fotos",
      guestLink: "Link dos convidados",
      openAsGuest: "Abrir como convidado",
    },
    appearance: {
      theme: "Tema",
      themeHint:
        "Vale para todas as telas dos convidados. O painel continua igual.",
      themes: {
        basic: {
          name: "Padrão",
          description: "Preto e branco, o visual de base do app",
        },
        essential: { name: "Essencial", description: "Neutro e contemporâneo" },
        heritage: { name: "Herança", description: "Romântico e rebuscado" },
        confetti: { name: "Confete", description: "Leve e informal" },
      },
      inUse: "Em uso",
      headingFont: "Fonte dos títulos",
      headingFontHint:
        "Vale para o nome do evento e os títulos. O texto continua com a fonte do tema.",
      headingFonts: {
        theme: "A do tema",
        newsreader: "Newsreader",
        cormorant: "Cormorant Garamond",
        fraunces: "Fraunces",
        jost: "Jost",
        nunitoSans: "Nunito Sans",
        inter: "Inter",
      },
      feedStyle: "Estilo do feed",
      feedStyleHint: "Como a aba Fotos dos convidados mostra as fotos.",
      feedStyles: {
        grid: {
          name: "Grade",
          description: "Três fotos por linha, recortadas",
        },
        list: {
          name: "Lista",
          description: "Uma foto por vez, com o autor e as curtidas",
        },
        wall: {
          name: "Mural",
          description: "Duas colunas, cada foto no seu formato",
        },
      },
      save: "Salvar aparência",
      saved:
        "Aparência salva. Os convidados veem as mudanças ao abrir ou recarregar a página.",
      errors: {
        invalid: "Confira as opções e tente de novo.",
        network: "Não foi possível salvar. Tente de novo.",
      },
    },
    photos: {
      summary: "Fotos: {count} ({size})",
      downloadAll: "Baixar todas em ZIP",
      downloadOriginal: "Baixar original",
      emptyTitle: "Nenhuma foto ainda",
      emptyDescription: "As fotos enviadas pelos convidados aparecem aqui.",
    },
  },
};

/** pt-BR is the reference dictionary: every other language must have the same keys. */
export type Dictionary = typeof ptBR;
