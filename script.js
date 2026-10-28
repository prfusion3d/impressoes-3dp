
// =============================================
// LOJA 3D - SUPABASE + WHATSAPP
// =============================================

// CONFIGURAÇÕES JÁ PREENCHIDAS

const SUPABASE_URL =
  "https://ewcatvwkotqpjxvxtwki.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_hddmRKnrt40Tvhr8q0-eXA_1jbaZWIj";

const ADMIN_UID =
  "e8634885-a9bb-4747-9e5e-4b7e11f77366";

const WHATSAPP = "5544933007211";
const BUCKET = "produtos";

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

function criar(tag, classe = "", texto = "") {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  el.textContent = texto;
  return el;
}

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function fotoValida(foto) {
  if (!foto) return true;

  if (/^https?:\/\//i.test(foto)) {
    try {
      const url = new URL(foto);
      return (
        url.protocol === "http:" ||
        url.protocol === "https:"
      );
    } catch {
      return false;
    }
  }

  const local = foto.replace(/^\.\//, "");

  return (
    local.startsWith("imagens/") &&
    local.length > "imagens/".length &&
    !local.includes("..") &&
    !/[\\:?#]/.test(local)
  );
}

// =============================================
// INICIAR LOJA
// =============================================

function iniciarLoja() {

  const admin = document.querySelector(".admin");
  const topo = document.querySelector(".topo");

  const catalogo =
    document.getElementById("catalogo");

  const listaCores =
    document.getElementById("listaFilamentos");

  const formModelo =
    document.getElementById("formModelo");

  const formFilamento =
    document.getElementById("formFilamento");

  const filtro =
    document.getElementById("filtroCategoria");

  const botaoTema =
    document.getElementById("alternarTema");

  const fotoTexto =
    document.getElementById("fotoModelo");

  if (
    !admin || !topo || !catalogo ||
    !listaCores || !formModelo || !formFilamento
  ) {
    console.error(
      "Confira os IDs do index.html."
    );
    return;
  }

  // =========================================
  // MODO CLARO E ESCURO
  // =========================================

  let tema = "escuro";

  try {
    if (
      localStorage.getItem("loja3d_tema") === "claro"
    ) {
      tema = "claro";
    }
  } catch (erro) {
    console.warn("Tema indisponível", erro);
  }

  function aplicarTema() {

    document.documentElement.dataset.tema = tema;

    if (botaoTema) {
      botaoTema.textContent = tema === "claro"
        ? "🌙 Modo escuro"
        : "☀️ Modo claro";

      botaoTema.setAttribute(
        "aria-pressed",
        String(tema === "claro")
      );
    }
  }

  aplicarTema();

  botaoTema?.addEventListener("click", () => {

    tema = tema === "claro" ? "escuro" : "claro";

    aplicarTema();

    try {
      localStorage.setItem("loja3d_tema", tema);
    } catch {}
  });

  // =========================================
  // NOTIFICAÇÕES
  // =========================================

  const aviso = criar("div");

  aviso.setAttribute("role", "status");

  aviso.style.cssText = `
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    max-width: 90vw;
    padding: 12px 18px;
    border-radius: 10px;
    color: white;
    background: #15803d;
    box-shadow: 0 8px 25px #0007;
    display: none;
  `;

  document.body.appendChild(aviso);

  let timerAviso;

  function informar(mensagem, erro = false) {

    aviso.textContent = mensagem;

    aviso.style.background = erro
      ? "#b91c1c"
      : "#15803d";

    aviso.style.display = "block";

    clearTimeout(timerAviso);

    timerAviso = setTimeout(() => {
      aviso.style.display = "none";
    }, 6500);

    if (erro) console.error(mensagem);
  }

  // =========================================
  // CONECTAR AO SUPABASE
  // =========================================

  if (!window.supabase?.createClient) {

    informar(
      "Biblioteca Supabase não carregou. Confira o index.html.",
      true
    );

    return;
  }

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  let modelos = [];
  let filamentos = [];
  let administrador = false;

  // =========================================
  // BOTÃO DE ADMINISTRAÇÃO
  // =========================================

  const botaoAdmin = criar(
    "button",
    "",
    "⚙️ Administração"
  );

  botaoAdmin.type = "button";

  botaoAdmin.style.cssText = `
    padding: 10px 14px;
    border-radius: 25px;
    cursor: pointer;
    background: var(--cartao);
    color: var(--texto);
    border: 1px solid var(--borda);
  `;

  topo.appendChild(botaoAdmin);

  admin.hidden = true;

  botaoAdmin.addEventListener("click", () => {

    admin.hidden = !admin.hidden;

    if (!admin.hidden) {
      admin.scrollIntoView({
        behavior: "smooth"
      });
    }
  });

  // =========================================
  // PAINEL DE LOGIN
  // =========================================

  const painelLogin = criar("div", "painel");

  admin.prepend(painelLogin);

  const paineisCadastro = [
    ...admin.querySelectorAll("details")
  ];

  // =========================================
  // PAINEL DE EXCLUSÃO
  // =========================================

  let painelExcluir = document.getElementById(
    "painelExcluirItens"
  );

  if (!painelExcluir) {

    painelExcluir = criar("details", "painel");

    painelExcluir.id = "painelExcluirItens";

    painelExcluir.appendChild(
      criar(
        "summary",
        "",
        "🗑️ Gerenciar e excluir itens"
      )
    );

    admin.appendChild(painelExcluir);
  }

  const listaGerenciar = criar("div");

  listaGerenciar.style.paddingTop = "16px";

  painelExcluir.appendChild(listaGerenciar);

  if (!paineisCadastro.includes(painelExcluir)) {
    paineisCadastro.push(painelExcluir);
  }

  // =========================================
  // CAMPO PARA ESCOLHER FOTOS
  // =========================================

  const campoArquivo = criar("input");

  campoArquivo.type = "file";
  campoArquivo.id = "fotoArquivo";

  campoArquivo.accept =
    "image/png,image/jpeg,image/webp";

  if (fotoTexto?.parentElement) {

    const rotulo = criar(
      "label",
      "",
      "Ou escolha uma foto do computador:"
    );

    rotulo.htmlFor = "fotoArquivo";

    fotoTexto.parentElement.append(
      rotulo,
      campoArquivo
    );
  }

  // =========================================
  // CONFIRMAÇÃO DE EXCLUSÃO
  // =========================================

  function confirmarExclusao(nome) {

    return new Promise(resolve => {

      const fundo = criar("div");

      fundo.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: #0009;
        display: grid;
        place-items: center;
        padding: 20px;
      `;

      const caixa = criar("div");

      caixa.setAttribute("role", "dialog");
      caixa.setAttribute("aria-modal", "true");

      caixa.setAttribute(
        "aria-label",
        "Confirmação de exclusão"
      );

      caixa.style.cssText = `
        max-width: 420px;
        width: 100%;
        padding: 24px;
        border-radius: 14px;
        background: var(--cartao);
        color: var(--texto);
        border: 1px solid var(--borda);
      `;

      caixa.append(
        criar("h3", "", "Excluir item?"),
        criar(
          "p",
          "",
          "Deseja realmente excluir “" + nome + "”?"
        )
      );

      const botoes = criar("div");

      botoes.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
      `;

      const cancelar = criar(
        "button",
        "",
        "Cancelar"
      );

      const excluir = criar(
        "button",
        "",
        "Sim, excluir"
      );

      cancelar.type = "button";
      excluir.type = "button";

      cancelar.style.cssText = `
        padding: 11px;
        border: 0;
        border-radius: 8px;
        background: #64748b;
        color: white;
      `;

      excluir.style.cssText = `
        padding: 11px;
        border: 0;
        border-radius: 8px;
        background: #b91c1c;
        color: white;
      `;

      const anterior = document.activeElement;
      let resolvido = false;

      function finalizar(resposta) {

        if (resolvido) return;

        resolvido = true;

        document.removeEventListener(
          "keydown",
          tecla
        );

        fundo.remove();

        if (anterior?.isConnected) {
          anterior.focus();
        }

        resolve(resposta);
      }

      function tecla(e) {

        if (e.key === "Escape") {
          finalizar(false);
        }

        if (e.key === "Tab") {

          if (
            e.shiftKey &&
            document.activeElement === cancelar
          ) {
            e.preventDefault();
            excluir.focus();

          } else if (
            !e.shiftKey &&
            document.activeElement === excluir
          ) {
            e.preventDefault();
            cancelar.focus();
          }
        }
      }

      cancelar.addEventListener(
        "click",
        () => finalizar(false)
      );

      excluir.addEventListener(
        "click",
        () => finalizar(true)
      );

      fundo.addEventListener("click", e => {

        if (e.target === fundo) {
          finalizar(false);
        }
      });

      document.addEventListener(
        "keydown",
        tecla
      );

      botoes.append(cancelar, excluir);

      caixa.appendChild(botoes);
      fundo.appendChild(caixa);

      document.body.appendChild(fundo);

      cancelar.focus();
    });
  }

  // =========================================
  // LOGIN E LOGOUT
  // =========================================

  function mostrarLogin() {

    painelLogin.replaceChildren();

    paineisCadastro.forEach(p => {
      p.hidden = !administrador;
    });

    if (administrador) {

      painelLogin.appendChild(
        criar(
          "p",
          "",
          "✅ Administrador conectado"
        )
      );

      const sair = criar(
        "button",
        "btn-salvar",
        "Sair da conta"
      );

      sair.type = "button";

      sair.addEventListener("click", async () => {

        const { error } = await db.auth.signOut();

        if (error) {
          return informar(
            "Erro ao sair: " + error.message,
            true
          );
        }

        administrador = false;

        mostrarLogin();
        renderizar();

        informar("Você saiu da conta.");
      });

      painelLogin.appendChild(sair);

      return;
    }

    painelLogin.appendChild(
      criar(
        "h3",
        "",
        "Entrar como administrador"
      )
    );

    const formulario = criar("form");

    const email = criar("input");

    email.type = "email";
    email.placeholder = "Seu e-mail";
    email.autocomplete = "username";
    email.required = true;

    const senha = criar("input");

    senha.type = "password";
    senha.placeholder = "Sua senha";
    senha.autocomplete = "current-password";
    senha.required = true;

    const entrar = criar(
      "button",
      "btn-salvar",
      "Entrar"
    );

    entrar.type = "submit";

    formulario.append(email, senha, entrar);

    formulario.addEventListener(
      "submit",
      async e => {

        e.preventDefault();

        entrar.disabled = true;

        try {

          const { data, error } =
            await db.auth.signInWithPassword({
              email: email.value.trim(),
              password: senha.value
            });

          if (error) throw error;

          if (data.user?.id !== ADMIN_UID) {

            await db.auth.signOut();

            throw new Error(
              "Esta conta não é a administradora autorizada."
            );
          }

          administrador = true;

          mostrarLogin();
          renderizar();

          informar("Login realizado com sucesso!");

        } catch (erro) {

          informar(
            "Erro no login: " + erro.message,
            true
          );

        } finally {
          entrar.disabled = false;
        }
      }
    );

    painelLogin.appendChild(formulario);
  }

  // VERIFICAR SESSÃO SALVA

  async function verificarSessao() {

    const { data, error } = await db.auth.getUser();

    administrador =
      !error &&
      data?.user?.id === ADMIN_UID;

    mostrarLogin();
    renderizar();
  }

  // =========================================
  // EXCLUIR PRODUTOS DO SUPABASE
  // =========================================

  async function excluirItem(tipo, item) {

    if (!administrador) {

      informar(
        "Entre como administrador para excluir.",
        true
      );

      return;
    }

    const nome = tipo === "modelo"
      ? item.nome
      : item.tipo + " - " + item.cor;

    if (!(await confirmarExclusao(nome))) {
      return;
    }

    const tabela = tipo === "modelo"
      ? "modelos"
      : "filamentos";

    const { data, error } = await db
      .from(tabela)
      .delete()
      .eq("id", item.id)
      .select("id");

    if (error) {

      informar(
        "Erro ao excluir: " + error.message,
        true
      );

      return;
    }

    if (!data?.length) {

      informar(
        "Exclusão bloqueada. Confira as políticas RLS do Supabase.",
        true
      );

      return;
    }

    // REMOVER FOTO ENVIADA PELA LOJA

    let erroFoto = false;

    if (tipo === "modelo" && item.foto) {

      const prefixo =
        SUPABASE_URL +
        "/storage/v1/object/public/" +
        BUCKET + "/";

      if (item.foto.startsWith(prefixo)) {

        const caminho = decodeURIComponent(
          item.foto
            .slice(prefixo.length)
            .split("?")[0]
        );

        if (
          caminho.startsWith("catalogo/") &&
          !caminho.includes("..")
        ) {

          const resposta = await db.storage
            .from(BUCKET)
            .remove([caminho]);

          if (resposta.error) {

            erroFoto = true;

            console.warn(
              "Foto não excluída:",
              resposta.error.message
            );
          }
        }
      }
    }

    await carregarCatalogo();

    informar(
      erroFoto
        ? "Item excluído, mas a foto ainda precisa ser removida do Storage."
        : "Item excluído com sucesso!"
    );
  }

  // =========================================
  // GERENCIAR E EXCLUIR ITENS
  // =========================================

  function mostrarGerenciamento() {

    listaGerenciar.replaceChildren();

    if (!administrador) return;

    const grupos = [
      ["modelo", modelos],
      ["filamento", filamentos]
    ];

    for (const [tipo, itens] of grupos) {

      listaGerenciar.appendChild(
        criar(
          "h3",
          "",
          tipo === "modelo"
            ? "Modelos 3D"
            : "Filamentos"
        )
      );

      if (!itens.length) {

        listaGerenciar.appendChild(
          criar(
            "p",
            "",
            "Nenhum item cadastrado."
          )
        );
      }

      itens.forEach(item => {

        const linha = criar("div");

        linha.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px;
          margin: 8px 0;
          border-radius: 9px;
          border: 1px solid var(--borda);
        `;

        const nome = criar(
          "span",
          "",
          tipo === "modelo"
            ? item.nome
            : item.tipo + " - " + item.cor
        );

        nome.style.overflowWrap = "anywhere";

        const botao = criar(
          "button",
          "",
          "🗑️ Excluir"
        );

        botao.type = "button";

        botao.style.cssText = `
          padding: 10px;
          border: 0;
          border-radius: 8px;
          color: white;
          background: #b91c1c;
          cursor: pointer;
        `;

        botao.addEventListener("click", () => {
          excluirItem(tipo, item);
        });

        linha.append(nome, botao);

        listaGerenciar.appendChild(linha);
      });
    }
  }

  // =========================================
  // MOSTRAR FILAMENTOS
  // =========================================

  function mostrarFilamentos() {

    listaCores.replaceChildren();

    if (!filamentos.length) {

      listaCores.appendChild(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum filamento cadastrado."
        )
      );

      return;
    }

    filamentos.forEach(f => {

      const linha = criar(
        "div",
        "cor-item"
      );

      const bolinha = criar(
        "div",
        "cor-bolinha"
      );

      bolinha.style.backgroundColor = f.hex;

      const nome =
        f.tipo + " - " + f.cor +
        (f.marca ? " (" + f.marca + ")" : "");

      linha.append(
        bolinha,
        criar("span", "cor-nome", nome)
      );

      if (administrador) {

        const excluir = criar(
          "button",
          "cor-remover",
          "×"
        );

        excluir.type = "button";

        excluir.setAttribute(
          "aria-label",
          "Excluir " + nome
        );

        excluir.addEventListener("click", () => {
          excluirItem("filamento", f);
        });

        linha.appendChild(excluir);
      }

      listaCores.appendChild(linha);
    });
  }

  // =========================================
  // MOSTRAR MODELOS 3D
  // =========================================

  function mostrarModelos() {

    catalogo.replaceChildren();

    const categoria = filtro?.value || "Todos";

    const visiveis = modelos.filter(m => {
      return (
        categoria === "Todos" ||
        m.categoria === categoria
      );
    });

    if (!visiveis.length) {

      catalogo.appendChild(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum modelo encontrado."
        )
      );

      return;
    }

    visiveis.forEach(m => {

      const card = criar(
        "article",
        "card"
      );

      // FOTO DO MODELO

      const semFoto = () => criar(
        "div",
        "foto-produto sem-foto",
        "3D"
      );

      if (m.foto && fotoValida(m.foto)) {

        const img = criar(
          "img",
          "foto-produto"
        );

        img.src = m.foto;
        img.alt = m.nome;
        img.loading = "lazy";

        img.onerror = () => {
          img.replaceWith(semFoto());
        };

        card.appendChild(img);

      } else {

        card.appendChild(semFoto());
      }

      // INFORMAÇÕES

      const info = criar(
        "div",
        "info-produto"
      );

      info.append(
        criar(
          "span",
          "tag",
          m.categoria || "Outros"
        ),

        criar("h3", "", m.nome),

        criar(
          "p",
          "descricao",
          m.descricao ||
          "Modelo produzido em impressão 3D."
        )
      );

      const temPreco =
        m.preco !== null &&
        m.preco !== undefined &&
        m.preco !== "";

      info.appendChild(
        criar(
          "div",
          "preco",
          temPreco
            ? moeda(m.preco)
            : "Consultar preço"
        )
      );

      // PERSONALIZAÇÃO

      const personalizacao = criar(
        "div",
        "personalizacao"
      );

      const rotuloCor = criar(
        "label",
        "",
        "Cor e material:"
      );

      const seletor = criar("select");

      if (!filamentos.length) {

        const opt = criar(
          "option",
          "",
          "A combinar"
        );

        opt.value = "";

        seletor.appendChild(opt);

      } else {

        filamentos.forEach(f => {

          const opt = criar(
            "option",
            "",
            f.tipo + " - " + f.cor
          );

          opt.value = f.id;

          seletor.appendChild(opt);
        });
      }

      rotuloCor.appendChild(seletor);

      const rotuloQtd = criar(
        "label",
        "",
        "Quantidade:"
      );

      const quantidade = criar("input");

      quantidade.type = "number";
      quantidade.min = "1";
      quantidade.max = "999";
      quantidade.step = "1";
      quantidade.value = "1";

      rotuloQtd.appendChild(quantidade);

      personalizacao.append(
        rotuloCor,
        rotuloQtd
      );

      info.appendChild(personalizacao);

      // PEDIDO VIA WHATSAPP

      const pedir = criar(
        "a",
        "botao-whatsapp",
        "Pedir pelo WhatsApp"
      );

      pedir.target = "_blank";
      pedir.rel = "noopener noreferrer";

      function atualizarPedido() {

        const f = filamentos.find(
          x => String(x.id) === seletor.value
        );

        const qtd = Math.max(
          1,
          Math.min(
            999,
            Math.floor(
              Number(quantidade.value) || 1
            )
          )
        );

        const material = f
          ? f.tipo + " - " + f.cor
          : "A combinar";

        let mensagem =
          "Olá! Gostaria de encomendar uma impressão 3D.\n\n" +

          "Modelo: " + m.nome + "\n" +

          "Categoria: " + m.categoria + "\n" +

          "Cor e material: " + material + "\n" +

          "Quantidade: " + qtd + "\n";

        if (temPreco) {

          mensagem +=
            "Preço unitário: " +
            moeda(m.preco) + "\n" +

            "Total estimado: " +
            moeda(Number(m.preco) * qtd) + "\n";
        }

        mensagem +=
          "\nGostaria de confirmar a disponibilidade e o valor final!";

        pedir.href =
          "https://wa.me/" +
          WHATSAPP +
          "?text=" +
          encodeURIComponent(mensagem);
      }

      seletor.addEventListener(
        "change",
        atualizarPedido
      );

      quantidade.addEventListener(
        "input",
        atualizarPedido
      );

      pedir.addEventListener(
        "click",
        atualizarPedido
      );

      atualizarPedido();

      info.appendChild(pedir);

      // EXCLUIR MODELO

      if (administrador) {

        const excluir = criar(
          "button",
          "btn-remover",
          "🗑️ Excluir modelo"
        );

        excluir.type = "button";

        excluir.addEventListener("click", () => {
          excluirItem("modelo", m);
        });

        info.appendChild(excluir);
      }

      card.appendChild(info);

      catalogo.appendChild(card);
    });
  }

  // =========================================
  // ATUALIZAR CATÁLOGO
  // =========================================

  function renderizar() {

    mostrarFilamentos();

    mostrarModelos();

    mostrarGerenciamento();
  }

  // =========================================
  // CARREGAR DADOS DO SUPABASE
  // =========================================

  async function carregarCatalogo() {

    const [
      resultadoModelos,
      resultadoFilamentos
    ] = await Promise.all([

      db.from("modelos")
        .select("*")
        .order("criado_em", {
          ascending: false
        }),

      db.from("filamentos")
        .select("*")
        .order("criado_em", {
          ascending: false
        })

    ]);

    if (resultadoModelos.error) {

      informar(
        "Erro ao carregar modelos: " +
        resultadoModelos.error.message,
        true
      );

    } else {

      modelos = resultadoModelos.data || [];
    }

    if (resultadoFilamentos.error) {

      informar(
        "Erro ao carregar filamentos: " +
        resultadoFilamentos.error.message,
        true
      );

    } else {

      filamentos = resultadoFilamentos.data || [];
    }

    renderizar();
  }

  // =========================================
  // ENVIAR FOTO PARA SUPABASE STORAGE
  // =========================================

  async function enviarFoto(arquivo) {

    const extensoes = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp"
    };

    if (!extensoes[arquivo.type]) {

      throw new Error(
        "Use uma imagem PNG, JPG ou WebP."
      );
    }

    if (arquivo.size > 5 * 1024 * 1024) {

      throw new Error(
        "A imagem deve ter no máximo 5 MB."
      );
    }

    const id =
      typeof crypto !== "undefined" &&
      crypto.randomUUID

        ? crypto.randomUUID()

        : Date.now() + "-" +
          Math.random().toString(36).slice(2);

    const caminho =
      "catalogo/" +
      id +
      "." +
      extensoes[arquivo.type];

    const { error } = await db.storage
      .from(BUCKET)
      .upload(caminho, arquivo, {
        contentType: arquivo.type,
        upsert: false
      });

    if (error) throw error;

    const { data } = db.storage
      .from(BUCKET)
      .getPublicUrl(caminho);

    return {
      foto: data.publicUrl,
      caminho: caminho
    };
  }

  // =========================================
  // CADASTRAR MODELO 3D
  // =========================================

  formModelo.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      if (!administrador) {

        return informar(
          "Faça login para cadastrar.",
          true
        );
      }

      const nome = document.getElementById(
        "nomeModelo"
      ).value.trim();

      const categoria = document.getElementById(
        "categoriaModelo"
      ).value;

      const descricao = document.getElementById(
        "descricaoModelo"
      ).value.trim();

      const textoPreco = document.getElementById(
        "precoModelo"
      ).value;

      const fotoDigitada =
        (fotoTexto?.value || "").trim();

      const arquivo = campoArquivo.files?.[0];

      const preco = textoPreco === ""
        ? null
        : Number(textoPreco);

      if (!nome) {

        return informar(
          "Digite o nome do modelo.",
          true
        );
      }

      if (!fotoValida(fotoDigitada)) {

        return informar(
          "Endereço da foto inválido.",
          true
        );
      }

      if (
        preco !== null &&
        (!Number.isFinite(preco) || preco < 0)
      ) {

        return informar(
          "Digite um preço válido.",
          true
        );
      }

      const botao = formModelo.querySelector(
        '[type="submit"]'
      );

      if (botao) botao.disabled = true;

      let caminhoNovo = null;

      try {

        let foto = fotoDigitada || null;

        if (arquivo) {

          const resultado = await enviarFoto(
            arquivo
          );

          foto = resultado.foto;

          caminhoNovo = resultado.caminho;
        }

        const { error } = await db
          .from("modelos")
          .insert({
            nome,
            categoria,
            descricao,
            preco,
            foto
          });

        if (error) throw error;

        formModelo.reset();

        if (filtro) {
          filtro.value = "Todos";
        }

        await carregarCatalogo();

        informar(
          "Modelo salvo no Supabase!"
        );

      } catch (erro) {

        if (caminhoNovo) {

          const limpeza = await db.storage
            .from(BUCKET)
            .remove([caminhoNovo]);

          if (limpeza.error) {

            console.warn(
              "Foto não removida:",
              limpeza.error.message
            );
          }
        }

        informar(
          "Erro ao cadastrar modelo: " +
          erro.message,
          true
        );

      } finally {

        if (botao) botao.disabled = false;
      }
    }
  );

  // =========================================
  // CADASTRAR FILAMENTO
  // =========================================

  formFilamento.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      if (!administrador) {

        return informar(
          "Faça login para cadastrar.",
          true
        );
      }

      const cor = document.getElementById(
        "nomeCor"
      ).value.trim();

      const tipo = document.getElementById(
        "tipoFilamento"
      ).value;

      const marca = document.getElementById(
        "marcaFilamento"
      ).value.trim();

      const hex = document.getElementById(
        "corFilamento"
      ).value;

      if (!cor) {

        return informar(
          "Digite a cor do filamento.",
          true
        );
      }

      const botao = formFilamento.querySelector(
        '[type="submit"]'
      );

      if (botao) botao.disabled = true;

      try {

        const { error } = await db
          .from("filamentos")
          .insert({
            cor,
            tipo,
            marca,
            hex
          });

        if (error) throw error;

        formFilamento.reset();

        await carregarCatalogo();

        informar(
          "Filamento salvo no Supabase!"
        );

      } catch (erro) {

        informar(
          "Erro ao cadastrar filamento: " +
          erro.message,
          true
        );

      } finally {

        if (botao) botao.disabled = false;
      }
    }
  );

  // =========================================
  // FILTRAR CATEGORIAS
  // =========================================

  filtro?.addEventListener(
    "change",
    mostrarModelos
  );

  // =========================================
  // INICIAR BANCO E LOGIN
  // =========================================

  Promise.all([
    carregarCatalogo(),
    verificarSessao()
  ]).catch(erro => {

    informar(
      "Erro ao iniciar a loja: " +
      erro.message,
      true
    );
  });
}

// =============================================
// AGUARDAR CARREGAMENTO DO HTML
// =============================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    iniciarLoja,
    { once: true }
  );

} else {

  iniciarLoja();
}
