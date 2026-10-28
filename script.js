
// PRFUSION 3D — SUPABASE, WHATSAPP E ZOOM

// CONFIGURAÇÕES

const SUPABASE_URL =
  "https://ewcatvwkotqpjxvxtwki.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_hddmRKnrt40Tvhr8q0-eXA_1jbaZWIj";

const ADMIN_UID =
  "e8634885-a9bb-4747-9e5e-4b7e11f77366";

const WHATSAPP = "5544933007211";
const BUCKET = "produtos";

// FUNÇÕES AUXILIARES

const $ = id => document.getElementById(id);

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

function fotoValida(valor) {
  if (!valor) return true;

  if (/^https?:\/\//i.test(valor)) {
    try {
      return ["https:", "http:"].includes(
        new URL(valor).protocol
      );
    } catch {
      return false;
    }
  }

  const local = valor.replace(/^\.\//, "");

  return (
    local.startsWith("imagens/") &&
    local.length > 8 &&
    !local.includes("..") &&
    !/[\\:?#]/.test(local)
  );
}

// INICIAR LOJA

function iniciarLoja() {
  const admin = document.querySelector(".admin");
  const topo = document.querySelector(".topo");

  const catalogo = $("catalogo");
  const cores = $("listaFilamentos");

  const formModelo = $("formModelo");
  const formFilamento = $("formFilamento");

  const filtro = $("filtroCategoria");

  if (
    !admin ||
    !topo ||
    !catalogo ||
    !cores ||
    !formModelo ||
    !formFilamento
  ) {
    console.error("Faltam elementos no index.html.");
    return;
  }

  // NOTIFICAÇÕES

  const aviso = criar("div");

  aviso.style.cssText = `
    position: fixed;
    z-index: 10020;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 90vw;
    background: #15803d;
    color: white;
    padding: 12px 18px;
    border-radius: 10px;
    box-shadow: 0 8px 25px #0007;
    display: none;
  `;

  aviso.setAttribute("role", "status");

  document.body.append(aviso);

  let avisoTimer;

  function informar(msg, erro = false) {
    aviso.textContent = msg;

    aviso.style.background = erro
      ? "#b91c1c"
      : "#15803d";

    aviso.style.display = "block";

    clearTimeout(avisoTimer);

    avisoTimer = setTimeout(() => {
      aviso.style.display = "none";
    }, 5500);

    if (erro) console.error(msg);
  }

  // ========================================
  // MODO CLARO E ESCURO
  // ========================================

  let tema = "escuro";

  try {
    tema =
      localStorage.getItem("loja3d_tema") === "claro"
        ? "claro"
        : "escuro";
  } catch {}

  function aplicarTema() {
    document.documentElement.dataset.tema = tema;

    $("alternarTema").textContent =
      tema === "claro"
        ? "🌙 Modo escuro"
        : "☀️ Modo claro";
  }

  aplicarTema();

  $("alternarTema").addEventListener("click", () => {
    tema = tema === "claro" ? "escuro" : "claro";

    aplicarTema();

    try {
      localStorage.setItem("loja3d_tema", tema);
    } catch {}
  });

  // ========================================
  // ZOOM DAS FOTOS
  // ========================================

  function iniciarZoom() {
    const fundo = criar("div", "zoom-overlay");

    fundo.hidden = true;

    fundo.setAttribute("role", "dialog");
    fundo.setAttribute("aria-modal", "true");

    fundo.setAttribute(
      "aria-label",
      "Imagem ampliada do produto"
    );

    fundo.innerHTML = `
      <div class="zoom-caixa">

        <div class="zoom-barra">
          <strong class="zoom-titulo"></strong>

          <div class="zoom-controles">
            <button
              type="button"
              data-z="menos"
              aria-label="Diminuir"
            >−</button>

            <button
              type="button"
              data-z="reset"
              aria-label="Restaurar"
            >100%</button>

            <button
              type="button"
              data-z="mais"
              aria-label="Ampliar"
            >+</button>

            <button
              type="button"
              data-z="fechar"
              aria-label="Fechar"
            >✕</button>
          </div>
        </div>

        <div class="zoom-palco">
          <img
            class="zoom-imagem"
            alt=""
            draggable="false"
          >
        </div>

        <p class="zoom-dica">
          Arraste para mover • Use a roda do mouse
          ou pinça no celular • Esc para fechar
        </p>

      </div>
    `;

    document.body.append(fundo);

    const img = fundo.querySelector(
      ".zoom-imagem"
    );

    const palco = fundo.querySelector(
      ".zoom-palco"
    );

    const titulo = fundo.querySelector(
      ".zoom-titulo"
    );

    const botao = acao =>
      fundo.querySelector(`[data-z="${acao}"]`);

    const ponteiros = new Map();

    let escala = 1;
    let x = 0;
    let y = 0;

    let inicial = 0;
    let escalaInicial = 1;

    let ultimoX = 0;
    let ultimoY = 0;

    let focoAnterior = null;

    // ATUALIZAR POSIÇÃO E TAMANHO

    function atualizar() {
      const maxX =
        img.clientWidth * (escala - 1) / 2;

      const maxY =
        img.clientHeight * (escala - 1) / 2;

      x = Math.max(
        -maxX,
        Math.min(maxX, x)
      );

      y = Math.max(
        -maxY,
        Math.min(maxY, y)
      );

      img.style.transform =
        `translate(${x}px, ${y}px) scale(${escala})`;

      botao("reset").textContent =
        `${Math.round(escala * 100)}%`;

      palco.classList.toggle(
        "ampliado",
        escala > 1
      );
    }

    function zoom(valor) {
      escala = Math.max(
        1,
        Math.min(5, valor)
      );

      if (escala === 1) {
        x = 0;
        y = 0;
      }

      atualizar();
    }

    // ABRIR IMAGEM

    function abrir(foto) {
      focoAnterior = document.activeElement;

      img.src = foto.currentSrc || foto.src;
      img.alt = foto.alt;

      titulo.textContent =
        foto.alt || "Foto do produto";

      fundo.hidden = false;

      document.body.classList.add(
        "zoom-ativo"
      );

      ponteiros.clear();

      x = 0;
      y = 0;

      zoom(1);

      botao("fechar").focus();
    }

    // FECHAR IMAGEM

    function fechar() {
      if (fundo.hidden) return;

      fundo.hidden = true;

      document.body.classList.remove(
        "zoom-ativo"
      );

      ponteiros.clear();

      img.removeAttribute("src");

      if (focoAnterior?.isConnected) {
        focoAnterior.focus();
      }
    }

    // ABRIR AO CLICAR NAS FOTOS

    catalogo.addEventListener("click", e => {
      const foto = e.target.closest(
        "img.foto-produto"
      );

      if (foto) abrir(foto);
    });

    // ABRIR PELO TECLADO

    catalogo.addEventListener("keydown", e => {
      if (
        (e.key === "Enter" || e.key === " ") &&
        e.target.matches("img.foto-produto")
      ) {
        e.preventDefault();

        abrir(e.target);
      }
    });

    // CONTROLES DO ZOOM

    botao("fechar").addEventListener(
      "click",
      fechar
    );

    botao("mais").addEventListener(
      "click",
      () => zoom(escala * 1.3)
    );

    botao("menos").addEventListener(
      "click",
      () => zoom(escala / 1.3)
    );

    botao("reset").addEventListener(
      "click",
      () => zoom(1)
    );

    fundo.addEventListener("click", e => {
      if (e.target === fundo) fechar();
    });

    // ATALHOS DO TECLADO

    document.addEventListener("keydown", e => {
      if (fundo.hidden) return;

      if (e.key === "Escape") {
        fechar();
      } else if (
        e.key === "+" ||
        e.key === "="
      ) {
        zoom(escala * 1.3);
      } else if (e.key === "-") {
        zoom(escala / 1.3);
      } else if (e.key === "0") {
        zoom(1);
      } else if (e.key === "Tab") {
        const bs = [
          ...fundo.querySelectorAll("button")
        ];

        const primeiro = bs[0];
        const ultimo = bs[bs.length - 1];

        if (
          e.shiftKey &&
          document.activeElement === primeiro
        ) {
          e.preventDefault();
          ultimo.focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === ultimo
        ) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    });

    // ZOOM COM RODA DO MOUSE

    palco.addEventListener(
      "wheel",
      e => {
        e.preventDefault();

        zoom(
          escala *
          (e.deltaY < 0 ? 1.15 : 1 / 1.15)
        );
      },
      { passive: false }
    );

    // DOIS CLIQUES

    palco.addEventListener("dblclick", () => {
      zoom(escala > 1 ? 1 : 2);
    });

    // DISTÂNCIA ENTRE DOIS DEDOS

    const distancia = arr =>
      Math.hypot(
        arr[0].x - arr[1].x,
        arr[0].y - arr[1].y
      );

    // INÍCIO DO TOQUE

    palco.addEventListener("pointerdown", e => {
      if (
        e.pointerType === "mouse" &&
        (e.button !== 0 || escala === 1)
      ) {
        return;
      }

      ponteiros.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
      });

      palco.setPointerCapture(e.pointerId);

      ultimoX = e.clientX;
      ultimoY = e.clientY;

      if (ponteiros.size === 2) {
        inicial = distancia([
          ...ponteiros.values()
        ]);

        escalaInicial = escala;
      }
    });

    // ARRASTAR / PINÇA

    palco.addEventListener("pointermove", e => {
      if (!ponteiros.has(e.pointerId)) {
        return;
      }

      ponteiros.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
      });

      if (
        ponteiros.size === 2 &&
        inicial > 0
      ) {
        zoom(
          escalaInicial *
          distancia([...ponteiros.values()]) /
          inicial
        );
      } else if (
        ponteiros.size === 1 &&
        escala > 1
      ) {
        x += e.clientX - ultimoX;
        y += e.clientY - ultimoY;

        atualizar();
      }

      ultimoX = e.clientX;
      ultimoY = e.clientY;
    });

    // TERMINAR TOQUE

    function soltar(e) {
      ponteiros.delete(e.pointerId);

      if (ponteiros.size === 1) {
        const p = [
          ...ponteiros.values()
        ][0];

        ultimoX = p.x;
        ultimoY = p.y;
      }

      if (ponteiros.size < 2) {
        inicial = 0;
      }
    }

    [
      "pointerup",
      "pointercancel",
      "lostpointercapture"
    ].forEach(ev => {
      palco.addEventListener(ev, soltar);
    });
  }

  iniciarZoom();

  // ========================================
  // CONEXÃO SUPABASE
  // ========================================

  if (!window.supabase?.createClient) {
    informar(
      "Não foi possível carregar a biblioteca Supabase.",
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

  // ========================================
  // ADMINISTRAÇÃO
  // ========================================

  const abrirAdmin = criar(
    "button",
    "botao-admin",
    "⚙️ Administração"
  );

  abrirAdmin.type = "button";

  topo.append(abrirAdmin);

  admin.hidden = true;

  abrirAdmin.addEventListener("click", () => {
    admin.hidden = !admin.hidden;

    if (!admin.hidden) {
      admin.scrollIntoView({
        behavior: "smooth"
      });
    }
  });

  const login = criar("div", "painel");

  admin.prepend(login);

  const paineis = [
    ...admin.querySelectorAll("details")
  ];

  const gerenciar = criar("details", "painel");

  gerenciar.append(
    criar(
      "summary",
      "",
      "🗑️ Gerenciar e excluir itens"
    )
  );

  const listaGerenciar = criar("div");

  gerenciar.append(listaGerenciar);

  admin.append(gerenciar);

  paineis.push(gerenciar);

  // ========================================
  // LOGIN ADMINISTRATIVO
  // ========================================

  function atualizarLogin() {
    login.replaceChildren();

    paineis.forEach(p => {
      p.hidden = !administrador;
    });

    if (administrador) {
      login.append(
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
            error.message,
            true
          );
        }

        administrador = false;

        atualizarLogin();
        renderizar();
      });

      login.append(sair);

    } else {
      login.append(
        criar(
          "h3",
          "",
          "Entrar como administrador"
        )
      );

      const form = criar("form");

      const email = criar("input");
      const senha = criar("input");

      email.type = "email";
      email.placeholder = "E-mail";
      email.autocomplete = "username";
      email.required = true;

      senha.type = "password";
      senha.placeholder = "Senha";
      senha.autocomplete = "current-password";
      senha.required = true;

      const entrar = criar(
        "button",
        "btn-salvar",
        "Entrar"
      );

      entrar.type = "submit";

      form.append(email, senha, entrar);

      form.addEventListener("submit", async e => {
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

          atualizarLogin();
          renderizar();

          informar("Login realizado!");

        } catch (erro) {
          informar(
            "Erro no login: " + erro.message,
            true
          );

        } finally {
          entrar.disabled = false;
        }
      });

      login.append(form);
    }
  }

  async function verificarSessao() {
    const { data, error } =
      await db.auth.getUser();

    administrador =
      !error &&
      data?.user?.id === ADMIN_UID;

    atualizarLogin();
    renderizar();
  }

  // ========================================
  // CONFIRMAÇÃO DE EXCLUSÃO
  // ========================================

  function confirmar(nome) {
    return new Promise(resolve => {
      const fundo = criar("div");

      fundo.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10010;
        background: #000a;
        display: grid;
        place-items: center;
        padding: 18px;
      `;

      const caixa = criar("div", "painel");

      caixa.style.cssText = `
        background: var(--cartao);
        color: var(--texto);
        width: min(420px, 100%);
        padding: 24px;
        border-radius: 12px;
      `;

      caixa.setAttribute("role", "dialog");
      caixa.setAttribute("aria-modal", "true");

      caixa.append(
        criar("h3", "", "Excluir item?"),

        criar(
          "p",
          "",
          `Deseja excluir “${nome}”?`
        )
      );

      const nao = criar(
        "button",
        "",
        "Cancelar"
      );

      const sim = criar(
        "button",
        "",
        "Excluir"
      );

      nao.type = "button";
      sim.type = "button";

      nao.style.cssText = `
        padding: 11px;
        background: #64748b;
        color: white;
        border: 0;
        border-radius: 8px;
        margin-right: 8px;
      `;

      sim.style.cssText = `
        padding: 11px;
        background: #b91c1c;
        color: white;
        border: 0;
        border-radius: 8px;
      `;

      const anterior = document.activeElement;

      function concluir(valor) {
        document.removeEventListener(
          "keydown",
          teclado
        );

        fundo.remove();

        if (anterior?.isConnected) {
          anterior.focus();
        }

        resolve(valor);
      }

      function teclado(e) {
        if (e.key === "Escape") {
          concluir(false);
        }
      }

      nao.onclick = () => concluir(false);
      sim.onclick = () => concluir(true);

      fundo.onclick = e => {
        if (e.target === fundo) {
          concluir(false);
        }
      };

      caixa.append(nao, sim);
      fundo.append(caixa);

      document.body.append(fundo);

      document.addEventListener(
        "keydown",
        teclado
      );

      nao.focus();
    });
  }

  // ========================================
  // EXCLUIR PRODUTOS
  // ========================================

  async function excluirItem(tipo, item) {
    if (!administrador) {
      return informar(
        "Faça login como administrador.",
        true
      );
    }

    const tabela =
      tipo === "modelo"
        ? "modelos"
        : "filamentos";

    const nome =
      tipo === "modelo"
        ? item.nome
        : `${item.tipo} - ${item.cor}`;

    if (!await confirmar(nome)) return;

    const { data, error } = await db
      .from(tabela)
      .delete()
      .eq("id", item.id)
      .select("id");

    if (error) {
      return informar(
        "Erro ao excluir: " + error.message,
        true
      );
    }

    if (!data?.length) {
      return informar(
        "Exclusão bloqueada pelas políticas RLS.",
        true
      );
    }

    // TENTAR EXCLUIR FOTO DO STORAGE

    if (tipo === "modelo" && item.foto) {
      const prefixo =
        `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/catalogo/`;

      if (item.foto.startsWith(prefixo)) {
        const nomeFoto = decodeURIComponent(
          item.foto
            .slice(prefixo.length)
            .split("?")[0]
        );

        if (
          nomeFoto &&
          !nomeFoto.includes("..") &&
          !nomeFoto.includes("/")
        ) {
          const { error: erroFoto } =
            await db.storage
              .from(BUCKET)
              .remove([`catalogo/${nomeFoto}`]);

          if (erroFoto) {
            console.warn(
              "Não foi possível apagar a foto:",
              erroFoto.message
            );
          }
        }
      }
    }

    await carregarCatalogo();

    informar("Item excluído com sucesso!");
  }

  // ========================================
  // GERENCIAR CADASTROS
  // ========================================

  function mostrarGerenciamento() {
    listaGerenciar.replaceChildren();

    if (!administrador) return;

    for (const [tipo, lista] of [
      ["modelo", modelos],
      ["filamento", filamentos]
    ]) {
      listaGerenciar.append(
        criar(
          "h3",
          "",
          tipo === "modelo"
            ? "Modelos 3D"
            : "Filamentos"
        )
      );

      if (!lista.length) {
        listaGerenciar.append(
          criar(
            "p",
            "",
            "Nenhum item cadastrado."
          )
        );
      }

      lista.forEach(item => {
        const linha = criar("div");

        linha.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px;
          border: 1px solid var(--borda);
          border-radius: 9px;
          margin: 8px 0;
        `;

        linha.append(
          criar(
            "span",
            "",
            tipo === "modelo"
              ? item.nome
              : `${item.tipo} - ${item.cor}`
          )
        );

        const excluir = criar(
          "button",
          "",
          "🗑️ Excluir"
        );

        excluir.type = "button";

        excluir.style.cssText = `
          background: #b91c1c;
          color: white;
          border: 0;
          border-radius: 8px;
          padding: 10px;
        `;

        excluir.onclick = () =>
          excluirItem(tipo, item);

        linha.append(excluir);

        listaGerenciar.append(linha);
      });
    }
  }

  // ========================================
  // MOSTRAR FILAMENTOS
  // ========================================

  function mostrarFilamentos() {
    cores.replaceChildren();

    if (!filamentos.length) {
      return cores.append(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum filamento cadastrado."
        )
      );
    }

    filamentos.forEach(f => {
      const linha = criar(
        "div",
        "cor-item"
      );

      const bolinha = criar(
        "span",
        "cor-bolinha"
      );

      bolinha.style.backgroundColor = f.hex;

      const nome =
        `${f.tipo} - ${f.cor}` +
        (f.marca ? ` (${f.marca})` : "");

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
          "Excluir " + f.cor
        );

        excluir.onclick = () =>
          excluirItem("filamento", f);

        linha.append(excluir);
      }

      cores.append(linha);
    });
  }

  // ========================================
  // MOSTRAR MODELOS 3D
  // ========================================

  function mostrarModelos() {
    catalogo.replaceChildren();

    const categoria = filtro.value;

    const visiveis = modelos.filter(
      m =>
        categoria === "Todos" ||
        m.categoria === categoria
    );

    if (!visiveis.length) {
      return catalogo.append(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum modelo encontrado."
        )
      );
    }

    visiveis.forEach(m => {
      const card = criar(
        "article",
        "card"
      );

      // FOTO COM ZOOM

      const semFoto = () =>
        criar(
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

        img.tabIndex = 0;

        img.setAttribute(
          "role",
          "button"
        );

        img.setAttribute(
          "aria-label",
          "Ampliar foto de " + m.nome
        );

        img.title = "Clique para ampliar";

        img.onerror = () =>
          img.replaceWith(semFoto());

        card.append(img);
      } else {
        card.append(semFoto());
      }

      // INFORMAÇÕES DO PRODUTO

      const info = criar(
        "div",
        "info-produto"
      );

      info.append(
        criar("span", "tag", m.categoria),
        criar("h3", "", m.nome)
      );

      info.append(
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

      info.append(
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

      const lCor = criar(
        "label",
        "",
        "Cor e material:"
      );

      const sel = criar("select");

      if (!filamentos.length) {
        const opt = criar(
          "option",
          "",
          "A combinar"
        );

        opt.value = "";

        sel.append(opt);
      } else {
        filamentos.forEach(f => {
          const opt = criar(
            "option",
            "",
            `${f.tipo} - ${f.cor}`
          );

          opt.value = f.id;

          sel.append(opt);
        });
      }

      lCor.append(sel);

      const lQtd = criar(
        "label",
        "",
        "Quantidade:"
      );

      const qtd = criar("input");

      qtd.type = "number";
      qtd.min = "1";
      qtd.max = "999";
      qtd.step = "1";
      qtd.value = "1";

      lQtd.append(qtd);

      personalizacao.append(
        lCor,
        lQtd
      );

      info.append(personalizacao);

      // ====================================
      // PEDIDO PELO WHATSAPP
      // ====================================

      const pedir = criar(
        "a",
        "botao-whatsapp",
        "Pedir pelo WhatsApp"
      );

      pedir.target = "_blank";
      pedir.rel = "noopener noreferrer";

      function atualizarWhatsApp() {
        const f = filamentos.find(
          x => String(x.id) === sel.value
        );

        const quantidade = Math.max(
          1,
          Math.min(
            999,
            Math.floor(
              Number(qtd.value) || 1
            )
          )
        );

        let msg =
          "Olá! Gostaria de encomendar uma impressão 3D.\n\n" +

          `Modelo: ${m.nome}\n` +

          `Categoria: ${m.categoria}\n` +

          `Cor e material: ${
            f
              ? `${f.tipo} - ${f.cor}`
              : "A combinar"
          }\n` +

          `Quantidade: ${quantidade}\n`;

        if (temPreco) {
          msg +=
            `Preço unitário: ${moeda(m.preco)}\n` +

            `Total estimado: ${
              moeda(
                Number(m.preco) * quantidade
              )
            }\n`;
        }

        msg +=
          "\nGostaria de confirmar a disponibilidade e o valor final!";

        pedir.href =
          `https://wa.me/${WHATSAPP}?text=` +
          encodeURIComponent(msg);
      }

      sel.addEventListener(
        "change",
        atualizarWhatsApp
      );

      qtd.addEventListener(
        "input",
        atualizarWhatsApp
      );

      atualizarWhatsApp();

      info.append(pedir);

      // BOTÃO DE EXCLUIR

      if (administrador) {
        const excluir = criar(
          "button",
          "btn-remover",
          "🗑️ Excluir modelo"
        );

        excluir.type = "button";

        excluir.onclick = () =>
          excluirItem("modelo", m);

        info.append(excluir);
      }

      card.append(info);

      catalogo.append(card);
    });
  }

  // ========================================
  // ATUALIZAR INTERFACE
  // ========================================

  function renderizar() {
    mostrarFilamentos();
    mostrarModelos();
    mostrarGerenciamento();
  }

  // ========================================
  // BUSCAR DADOS DO SUPABASE
  // ========================================

  async function carregarCatalogo() {
    const [
      resModelos,
      resFilamentos
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

    if (resModelos.error) {
      informar(
        "Erro ao carregar modelos: " +
        resModelos.error.message,
        true
      );
    } else {
      modelos = resModelos.data || [];
    }

    if (resFilamentos.error) {
      informar(
        "Erro ao carregar filamentos: " +
        resFilamentos.error.message,
        true
      );
    } else {
      filamentos = resFilamentos.data || [];
    }

    renderizar();
  }

  // ========================================
  // UPLOAD DE IMAGENS
  // ========================================

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
        "A foto deve ter até 5 MB."
      );
    }

    const id = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${
          Math.random().toString(36).slice(2)
        }`;

    const caminho =
      `catalogo/${id}.${extensoes[arquivo.type]}`;

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
      caminho
    };
  }

  // ========================================
  // CADASTRAR MODELO
  // ========================================

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

      const nome = $("nomeModelo").value.trim();
      const categoria = $("categoriaModelo").value;

      const descricao =
        $("descricaoModelo").value.trim();

      const textoPreco =
        $("precoModelo").value;

      const preco =
        textoPreco === ""
          ? null
          : Number(textoPreco);

      const fotoDigitada =
        $("fotoModelo").value.trim();

      const arquivo =
        $("fotoArquivo").files[0];

      if (
        !nome ||
        !fotoValida(fotoDigitada) ||
        (
          preco !== null &&
          (!Number.isFinite(preco) || preco < 0)
        )
      ) {
        return informar(
          "Confira nome, preço e link da foto.",
          true
        );
      }

      const botao = formModelo.querySelector(
        '[type="submit"]'
      );

      botao.disabled = true;

      let caminhoNovo = null;

      try {
        let foto = fotoDigitada || null;

        if (arquivo) {
          const enviado = await enviarFoto(
            arquivo
          );

          foto = enviado.foto;
          caminhoNovo = enviado.caminho;
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

        filtro.value = "Todos";

        await carregarCatalogo();

        informar(
          "Modelo salvo no Supabase!"
        );

      } catch (erro) {
        if (caminhoNovo) {
          await db.storage
            .from(BUCKET)
            .remove([caminhoNovo]);
        }

        informar(
          "Erro ao cadastrar modelo: " +
          erro.message,
          true
        );

      } finally {
        botao.disabled = false;
      }
    }
  );

  // ========================================
  // CADASTRAR FILAMENTO
  // ========================================

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

      const cor =
        $("nomeCor").value.trim();

      const tipo =
        $("tipoFilamento").value;

      const marca =
        $("marcaFilamento").value.trim();

      const hex =
        $("corFilamento").value;

      if (!cor) {
        return informar(
          "Digite a cor do filamento.",
          true
        );
      }

      const botao = formFilamento.querySelector(
        '[type="submit"]'
      );

      botao.disabled = true;

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
        botao.disabled = false;
      }
    }
  );

  // ========================================
  // FILTRO E INICIALIZAÇÃO
  // ========================================

  filtro.addEventListener(
    "change",
    mostrarModelos
  );

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

// INICIAR DEPOIS DO HTML CARREGAR

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    iniciarLoja,
    { once: true }
  );
} else {
  iniciarLoja();
}
