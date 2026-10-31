
// ========================================
// LOJA 3D
// SUPABASE + WHATSAPP + TOTAL + ZOOM
// ========================================

// CONFIGURAÇÕES

const SUPABASE_URL =
  "https://ewcatvwkotqpjxvxtwki.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_hddmRKnrt40Tvhr8q0-eXA_1jbaZWIj";

const ADMIN_UID =
  "e8634885-a9bb-4747-9e5e-4b7e11f77366";

const WHATSAPP = "5544933007211";
const BUCKET = "produtos";

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

const $ = id => document.getElementById(id);

function criar(tag, classe = "", texto = "") {
  const el = document.createElement(tag);

  if (classe) {
    el.className = classe;
  }

  el.textContent = texto;

  return el;
}

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function fotoValida(texto) {
  if (!texto) return true;

  if (/^https?:\/\//i.test(texto)) {
    try {
      return ["https:", "http:"].includes(
        new URL(texto).protocol
      );
    } catch {
      return false;
    }
  }

  const caminho = texto.replace(/^\.\//, "");

  return (
    caminho.startsWith("imagens/") &&
    caminho.length > 8 &&
    !caminho.includes("..") &&
    !/[\\:?#]/.test(caminho)
  );
}

// ========================================
// INICIAR LOJA
// ========================================

function iniciarLoja() {

  const catalogo = $("catalogo");
  const listaCores = $("listaFilamentos");

  if (!catalogo || !listaCores) {
    console.error("Confira os IDs do index.html.");
    return;
  }

  // ======================================
  // AVISOS
  // ======================================

  const aviso = criar("div");

  aviso.setAttribute("role", "status");

  aviso.style.cssText = `
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 11000;
    max-width: 90vw;
    padding: 12px 18px;
    border-radius: 10px;
    color: white;
    background: #15803d;
    box-shadow: 0 6px 20px #0007;
    display: none;
  `;

  document.body.append(aviso);

  let avisoTimer;

  function informar(texto, erro = false) {
    aviso.textContent = texto;

    aviso.style.background = erro
      ? "#b91c1c"
      : "#15803d";

    aviso.style.display = "block";

    clearTimeout(avisoTimer);

    avisoTimer = setTimeout(() => {
      aviso.style.display = "none";
    }, 6000);

    if (erro) console.error(texto);
  }

  // ======================================
  // MODO CLARO E ESCURO
  // ======================================

  let tema = "escuro";

  try {
    tema = localStorage.getItem("loja3d_tema") === "claro"
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

  // ======================================
  // ZOOM DAS FOTOS
  // ======================================

  const modal = $("zoomModal");
  const palco = $("zoomPalco");
  const imagem = $("zoomImagem");

  const apontadores = new Map();

  let escala = 1;
  let deslocX = 0;
  let deslocY = 0;

  let distanciaInicial = 0;
  let escalaInicial = 1;

  let focoAnterior = null;

  function atualizarZoom() {

    const maxX = Math.max(
      0,
      (imagem.clientWidth * escala - palco.clientWidth) / 2
    );

    const maxY = Math.max(
      0,
      (imagem.clientHeight * escala - palco.clientHeight) / 2
    );

    deslocX = Math.max(
      -maxX,
      Math.min(maxX, deslocX)
    );

    deslocY = Math.max(
      -maxY,
      Math.min(maxY, deslocY)
    );

    imagem.style.transform =
      `translate(${deslocX}px, ${deslocY}px) scale(${escala})`;

    $("zoomReset").textContent =
      `${Math.round(escala * 100)}%`;

    palco.classList.toggle(
      "ampliado",
      escala > 1
    );
  }

  function mudarZoom(valor) {

    escala = Math.max(
      1,
      Math.min(5, valor)
    );

    if (escala === 1) {
      deslocX = 0;
      deslocY = 0;
    }

    atualizarZoom();
  }

  function abrirZoom(foto) {

    focoAnterior = document.activeElement;

    imagem.src = foto.currentSrc || foto.src;
    imagem.alt = foto.alt;

    $("zoomTitulo").textContent =
      foto.alt || "Foto do produto";

    modal.hidden = false;

    document.body.classList.add("zoom-ativo");

    apontadores.clear();

    deslocX = 0;
    deslocY = 0;

    mudarZoom(1);

    $("zoomFechar").focus();
  }

  function fecharZoom() {

    if (modal.hidden) return;

    modal.hidden = true;

    document.body.classList.remove("zoom-ativo");

    apontadores.clear();

    imagem.removeAttribute("src");

    if (focoAnterior?.isConnected) {
      focoAnterior.focus();
    }
  }

  imagem.addEventListener(
    "load",
    atualizarZoom
  );

  $("zoomFechar").addEventListener(
    "click",
    fecharZoom
  );

  $("zoomMais").addEventListener("click", () => {
    mudarZoom(escala * 1.25);
  });

  $("zoomMenos").addEventListener("click", () => {
    mudarZoom(escala / 1.25);
  });

  $("zoomReset").addEventListener("click", () => {
    mudarZoom(1);
  });

  modal.addEventListener("click", e => {
    if (e.target === modal) fecharZoom();
  });

  // ABRIR FOTO AO CLICAR

  catalogo.addEventListener("click", e => {

    const foto = e.target.closest(
      "img.foto-produto"
    );

    if (foto) abrirZoom(foto);
  });

  // ABRIR FOTO PELO TECLADO

  catalogo.addEventListener("keydown", e => {

    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.matches("img.foto-produto")
    ) {
      e.preventDefault();

      abrirZoom(e.target);
    }
  });

  // ATALHOS DO ZOOM

  document.addEventListener("keydown", e => {

    if (modal.hidden) return;

    if (e.key === "Escape") {
      fecharZoom();
    }

    if (e.key === "+" || e.key === "=") {
      mudarZoom(escala * 1.25);
    }

    if (e.key === "-") {
      mudarZoom(escala / 1.25);
    }

    if (e.key === "0") {
      mudarZoom(1);
    }

    if (e.key === "Tab") {

      const botoes = [
        ...modal.querySelectorAll("button")
      ];

      if (
        e.shiftKey &&
        document.activeElement === botoes[0]
      ) {
        e.preventDefault();
        botoes.at(-1).focus();

      } else if (
        !e.shiftKey &&
        document.activeElement === botoes.at(-1)
      ) {
        e.preventDefault();
        botoes[0].focus();
      }
    }
  });

  // ZOOM COM RODA DO MOUSE

  palco.addEventListener(
    "wheel",
    e => {

      e.preventDefault();

      mudarZoom(
        escala *
        (e.deltaY < 0 ? 1.12 : 1 / 1.12)
      );
    },
    { passive: false }
  );

  // DOIS CLIQUES

  palco.addEventListener("dblclick", () => {
    mudarZoom(escala > 1 ? 1 : 2);
  });

  // ZOOM COM PINÇA OU ARRASTAR

  const distancia = (a, b) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  palco.addEventListener("pointerdown", e => {

    if (
      e.pointerType === "mouse" &&
      e.button !== 0
    ) {
      return;
    }

    apontadores.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });

    palco.setPointerCapture(e.pointerId);

    if (apontadores.size === 2) {

      const [a, b] = [
        ...apontadores.values()
      ];

      distanciaInicial = distancia(a, b);
      escalaInicial = escala;
    }
  });

  palco.addEventListener("pointermove", e => {

    const anterior = apontadores.get(e.pointerId);

    if (!anterior) return;

    apontadores.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    });

    if (
      apontadores.size === 2 &&
      distanciaInicial > 0
    ) {

      const [a, b] = [
        ...apontadores.values()
      ];

      mudarZoom(
        escalaInicial *
        distancia(a, b) /
        distanciaInicial
      );

    } else if (
      apontadores.size === 1 &&
      escala > 1
    ) {

      deslocX += e.clientX - anterior.x;
      deslocY += e.clientY - anterior.y;

      atualizarZoom();
    }
  });

  function soltarPonteiro(e) {

    apontadores.delete(e.pointerId);

    if (apontadores.size < 2) {
      distanciaInicial = 0;
    }
  }

  [
    "pointerup",
    "pointercancel",
    "lostpointercapture"
  ].forEach(tipo => {

    palco.addEventListener(
      tipo,
      soltarPonteiro
    );
  });

  // ======================================
  // CONECTAR AO SUPABASE
  // ======================================

  if (!window.supabase?.createClient) {

    informar(
      "Não foi possível carregar o Supabase. Verifique a conexão e o HTML.",
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

  // ======================================
  // PAINEL ADMINISTRATIVO
  // ======================================

  function atualizarAdmin() {

    $("painelLogin").hidden = administrador;
    $("adminDados").hidden = !administrador;

    mostrarModelos();
    mostrarFilamentos();
    mostrarGerenciamento();
  }

  $("abrirAdmin").addEventListener("click", () => {

    $("areaAdmin").hidden = !$("areaAdmin").hidden;

    if (!$("areaAdmin").hidden) {

      $("areaAdmin").scrollIntoView({
        behavior: "smooth"
      });
    }
  });

  // ======================================
  // LOGIN
  // ======================================

  $("formLogin").addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const botao = e.currentTarget.querySelector(
        'button[type="submit"]'
      );

      botao.disabled = true;

      try {

        const { data, error } =
          await db.auth.signInWithPassword({

            email: $("emailAdmin").value.trim(),

            password: $("senhaAdmin").value
          });

        if (error) throw error;

        if (data.user?.id !== ADMIN_UID) {

          await db.auth.signOut();

          throw new Error(
            "Esta conta não é a administradora autorizada."
          );
        }

        administrador = true;

        $("formLogin").reset();

        atualizarAdmin();

        informar("Login realizado!");

      } catch (erro) {

        informar(
          "Erro no login: " + erro.message,
          true
        );

      } finally {

        botao.disabled = false;
      }
    }
  );

  // SAIR DA CONTA

  $("sairAdmin").addEventListener(
    "click",
    async () => {

      const { error } = await db.auth.signOut();

      if (error) {

        return informar(
          "Erro ao sair: " + error.message,
          true
        );
      }

      administrador = false;

      atualizarAdmin();

      informar("Você saiu da conta.");
    }
  );

  // VERIFICAR SESSÃO SALVA

  async function verificarSessao() {

    const { data, error } =
      await db.auth.getUser();

    administrador =
      !error &&
      data?.user?.id === ADMIN_UID;

    atualizarAdmin();
  }

  // ======================================
  // CONFIRMAR EXCLUSÃO
  // ======================================

  function confirmarExclusao(nome) {

    return new Promise(resolve => {

      const fundo = criar("div");

      fundo.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10050;
        background: #000a;
        display: grid;
        place-items: center;
        padding: 20px;
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
        background: #64748b;
        color: white;
        border: 0;
        border-radius: 8px;
        padding: 10px;
        margin-right: 8px;
      `;

      excluir.style.cssText = `
        background: #b91c1c;
        color: white;
        border: 0;
        border-radius: 8px;
        padding: 10px;
      `;

      const foco = document.activeElement;

      function fechar(valor) {

        document.removeEventListener(
          "keydown",
          teclado
        );

        fundo.remove();

        if (foco?.isConnected) {
          foco.focus();
        }

        resolve(valor);
      }

      function teclado(e) {

        if (e.key === "Escape") {
          fechar(false);
        }
      }

      cancelar.onclick = () => fechar(false);
      excluir.onclick = () => fechar(true);

      fundo.addEventListener("click", e => {

        if (e.target === fundo) {
          fechar(false);
        }
      });

      caixa.append(cancelar, excluir);
      fundo.append(caixa);

      document.body.append(fundo);

      document.addEventListener(
        "keydown",
        teclado
      );

      cancelar.focus();
    });
  }

  // ======================================
  // CARREGAR DADOS DO SUPABASE
  // ======================================

  async function carregarCatalogo() {

    const [rm, rf] = await Promise.all([

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

    if (rm.error) {

      informar(
        "Erro ao carregar modelos: " +
        rm.error.message,
        true
      );

    } else {

      modelos = rm.data || [];
    }

    if (rf.error) {

      informar(
        "Erro ao carregar filamentos: " +
        rf.error.message,
        true
      );

    } else {

      filamentos = rf.data || [];
    }

    mostrarModelos();
    mostrarFilamentos();
    mostrarGerenciamento();
  }

  // ======================================
  // MOSTRAR FILAMENTOS
  // ======================================

  function mostrarFilamentos() {

    listaCores.replaceChildren();

    if (!filamentos.length) {

      listaCores.append(
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
        "span",
        "cor-bolinha"
      );

      bolinha.style.background = f.hex;

      linha.append(
        bolinha,
        criar(
          "span",
          "cor-nome",
          `${f.tipo} - ${f.cor}` +
          (f.marca ? ` (${f.marca})` : "")
        )
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
          `Excluir ${f.tipo} ${f.cor}`
        );

        excluir.onclick = () => {
          excluirItem("filamento", f);
        };

        linha.append(excluir);
      }

      listaCores.append(linha);
    });
  }

  // ======================================
  // MOSTRAR MODELOS 3D
  // COM TOTAL AUTOMÁTICO
  // ======================================

  function mostrarModelos() {

    catalogo.replaceChildren();

    const categoria = $("filtroCategoria").value;

    const lista = modelos.filter(
      m =>
        categoria === "Todos" ||
        m.categoria === categoria
    );

    if (!lista.length) {

      catalogo.append(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum modelo encontrado."
        )
      );

      return;
    }

    lista.forEach(m => {

      const card = criar(
        "article",
        "card"
      );

      // FOTO DO PRODUTO

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

        img.onerror = () => {
          img.replaceWith(semFoto());
        };

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
        criar(
          "span",
          "tag",
          m.categoria || "Outros"
        ),

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

      // PREÇO UNITÁRIO

      const preco = Number(m.preco);

      const temPreco =
        m.preco !== null &&
        m.preco !== undefined &&
        m.preco !== "" &&
        Number.isFinite(preco);

      info.append(
        criar(
          "div",
          "preco",
          temPreco
            ? `Preço unitário: ${moeda(preco)}`
            : "Consultar preço"
        )
      );

      // PERSONALIZAÇÃO

      const personalizacao = criar(
        "div",
        "personalizacao"
      );

      const labelCor = criar(
        "label",
        "",
        "Cor e material:"
      );

      const selectCor = criar("select");

      if (!filamentos.length) {

        const opt = criar(
          "option",
          "",
          "A combinar"
        );

        opt.value = "";

        selectCor.append(opt);

      } else {

        filamentos.forEach(f => {

          const opt = criar(
            "option",
            "",
            `${f.tipo} - ${f.cor}`
          );

          opt.value = f.id;

          selectCor.append(opt);
        });
      }

      labelCor.append(selectCor);

      // QUANTIDADE

      const labelQtd = criar(
        "label",
        "",
        "Quantidade:"
      );

      const inputQtd = criar("input");

      inputQtd.type = "number";
      inputQtd.min = "1";
      inputQtd.max = "999";
      inputQtd.step = "1";
      inputQtd.value = "1";

      labelQtd.append(inputQtd);

      personalizacao.append(
        labelCor,
        labelQtd
      );

      info.append(personalizacao);

      // ==================================
      // VALOR TOTAL AUTOMÁTICO
      // ==================================

      const total = criar(
        "div",
        "total-pedido"
      );

      total.setAttribute(
        "aria-live",
        "polite"
      );

      info.append(total);

      // ==================================
      // WHATSAPP
      // ==================================

      const pedir = criar(
        "a",
        "botao-whatsapp",
        "Pedir pelo WhatsApp"
      );

      pedir.target = "_blank";
      pedir.rel = "noopener noreferrer";

      // VALIDAR QUANTIDADE

      function quantidadeValida() {

        return Math.max(
          1,
          Math.min(
            999,
            Math.floor(
              Number(inputQtd.value) || 1
            )
          )
        );
      }

      // ==================================
      // ATUALIZAR PREÇO E WHATSAPP
      // ==================================

      function atualizarPedido() {

        const quantidade = quantidadeValida();

        // CÁLCULO DO TOTAL

        const valorTotal =
          preco * quantidade;

        const f = filamentos.find(
          x => String(x.id) === selectCor.value
        );

        const material = f
          ? `${f.tipo} - ${f.cor}`
          : "A combinar";

        // EXIBIR VALOR TOTAL NO SITE

        total.textContent = temPreco
          ? `Total (${quantidade} ${
              quantidade === 1
                ? "peça"
                : "peças"
            }): ${moeda(valorTotal)}`
          : "Total: consultar preço";

        // MENSAGEM DO WHATSAPP

        let mensagem =
          "Olá! Gostaria de encomendar uma impressão 3D.\n\n" +

          `Modelo: ${m.nome}\n` +

          `Categoria: ${m.categoria}\n` +

          `Cor e material: ${material}\n` +

          `Quantidade: ${quantidade}\n`;

        if (temPreco) {

          mensagem +=
            `Preço unitário: ${moeda(preco)}\n` +

            `Valor total: ${moeda(valorTotal)}\n`;
        }

        mensagem +=
          "\nGostaria de confirmar a disponibilidade e o valor final!";

        pedir.href =
          `https://wa.me/${WHATSAPP}?text=` +
          encodeURIComponent(mensagem);
      }

      // QUANDO O CLIENTE ALTERAR A QUANTIDADE

      inputQtd.addEventListener(
        "input",
        atualizarPedido
      );

      inputQtd.addEventListener(
        "change",
        () => {

          inputQtd.value = quantidadeValida();

          atualizarPedido();
        }
      );

      // QUANDO ALTERAR O FILAMENTO

      selectCor.addEventListener(
        "change",
        atualizarPedido
      );

      // MOSTRAR O VALOR INICIAL

      atualizarPedido();

      info.append(pedir);

      // EXCLUIR MODELO

      if (administrador) {

        const excluir = criar(
          "button",
          "btn-remover",
          "🗑️ Excluir modelo"
        );

        excluir.type = "button";

        excluir.onclick = () => {
          excluirItem("modelo", m);
        };

        info.append(excluir);
      }

      card.append(info);

      catalogo.append(card);
    });
  }

  // ======================================
  // GERENCIAR ITENS
  // ======================================

  function mostrarGerenciamento() {

    const area = $("listaGerenciar");

    area.replaceChildren();

    if (!administrador) return;

    for (const [tipo, itens] of [

      ["modelo", modelos],

      ["filamento", filamentos]

    ]) {

      area.append(
        criar(
          "h3",
          "",
          tipo === "modelo"
            ? "Modelos 3D"
            : "Filamentos"
        )
      );

      if (!itens.length) {

        area.append(
          criar(
            "p",
            "",
            "Nenhum item cadastrado."
          )
        );
      }

      itens.forEach(item => {

        const linha = criar(
          "div",
          "linha-gerenciar"
        );

        linha.append(
          criar(
            "span",
            "",
            tipo === "modelo"
              ? item.nome
              : `${item.tipo} - ${item.cor}`
          )
        );

        const botao = criar(
          "button",
          "",
          "🗑️ Excluir"
        );

        botao.type = "button";

        botao.onclick = () => {
          excluirItem(tipo, item);
        };

        linha.append(botao);

        area.append(linha);
      });
    }
  }

  // ======================================
  // EXCLUIR ITENS
  // ======================================

  async function excluirItem(tipo, item) {

    if (!administrador) {

      return informar(
        "Faça login como administrador.",
        true
      );
    }

    const nome = tipo === "modelo"
      ? item.nome
      : `${item.tipo} - ${item.cor}`;

    if (!await confirmarExclusao(nome)) {
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

      return informar(
        "Erro ao excluir: " + error.message,
        true
      );
    }

    if (!data?.length) {

      return informar(
        "Exclusão bloqueada. Verifique as regras RLS.",
        true
      );
    }

    // EXCLUIR FOTO DO STORAGE

    if (tipo === "modelo" && item.foto) {

      const prefixo =
        `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/catalogo/`;

      if (item.foto.startsWith(prefixo)) {

        const nomeArquivo = decodeURIComponent(
          item.foto
            .slice(prefixo.length)
            .split("?")[0]
        );

        if (
          nomeArquivo &&
          !nomeArquivo.includes("/") &&
          !nomeArquivo.includes("..")
        ) {

          const { error: erroFoto } =
            await db.storage
              .from(BUCKET)
              .remove([
                `catalogo/${nomeArquivo}`
              ]);

          if (erroFoto) {

            console.warn(
              "Foto não removida:",
              erroFoto.message
            );
          }
        }
      }
    }

    await carregarCatalogo();

    informar("Item excluído com sucesso!");
  }

  // ======================================
  // ENVIAR FOTO AO STORAGE
  // ======================================

  async function enviarFoto(arquivo) {

    const ext = {

      "image/png": "png",

      "image/jpeg": "jpg",

      "image/webp": "webp"

    }[arquivo.type];

    if (!ext) {

      throw new Error(
        "Use PNG, JPG ou WebP."
      );
    }

    if (arquivo.size > 5 * 1024 * 1024) {

      throw new Error(
        "A imagem deve ter até 5 MB."
      );
    }

    const id = (
      typeof crypto !== "undefined" &&
      crypto.randomUUID
    )
      ? crypto.randomUUID()
      : `${Date.now()}-${
          Math.random().toString(36).slice(2)
        }`;

    const caminho = `catalogo/${id}.${ext}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(
        caminho,
        arquivo,
        {
          contentType: arquivo.type,
          upsert: false
        }
      );

    if (error) throw error;

    const { data } = db.storage
      .from(BUCKET)
      .getPublicUrl(caminho);

    return {
      foto: data.publicUrl,
      caminho
    };
  }

  // ======================================
  // CADASTRAR MODELO 3D
  // ======================================

  $("formModelo").addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      if (!administrador) {

        return informar(
          "Faça login para cadastrar.",
          true
        );
      }

      const nome =
        $("nomeModelo").value.trim();

      const categoria =
        $("categoriaModelo").value;

      const descricao =
        $("descricaoModelo").value.trim();

      const textoPreco =
        $("precoModelo").value;

      const preco = textoPreco === ""
        ? null
        : Number(textoPreco);

      const fotoDigitada =
        $("fotoModelo").value.trim();

      const arquivo =
        $("fotoArquivo").files?.[0];

      if (
        !nome ||
        !fotoValida(fotoDigitada) ||
        (
          preco !== null &&
          (
            !Number.isFinite(preco) ||
            preco < 0
          )
        )
      ) {

        return informar(
          "Confira nome, preço e link da foto.",
          true
        );
      }

      const botao = e.currentTarget.querySelector(
        'button[type="submit"]'
      );

      botao.disabled = true;

      let caminhoNovo = null;

      try {

        let foto = fotoDigitada || null;

        if (arquivo) {

          const resposta = await enviarFoto(
            arquivo
          );

          foto = resposta.foto;
          caminhoNovo = resposta.caminho;
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

        $("formModelo").reset();

        $("filtroCategoria").value = "Todos";

        await carregarCatalogo();

        informar(
          "Modelo cadastrado com sucesso!"
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

  // ======================================
  // CADASTRAR FILAMENTO
  // ======================================

  $("formFilamento").addEventListener(
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

      const botao = e.currentTarget.querySelector(
        'button[type="submit"]'
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

        $("formFilamento").reset();

        $("corFilamento").value = "#2563eb";

        await carregarCatalogo();

        informar(
          "Filamento cadastrado!"
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

  // ======================================
  // FILTRO E INICIALIZAÇÃO
  // ======================================

  $("filtroCategoria").addEventListener(
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

// ========================================
// AGUARDAR HTML
// ========================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    iniciarLoja,
    { once: true }
  );

} else {

  iniciarLoja();
}
