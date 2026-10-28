
// ==============================================
// LOJA 3D - SCRIPT COMPLETO
// Cadastro, imagens, tema, WhatsApp e exclusão
// ==============================================

const WHATSAPP = "5544933007211";
const CHAVE_MODELOS = "loja3d_modelos";
const CHAVE_FILAMENTOS = "loja3d_filamentos";
const CHAVE_TEMA = "loja3d_tema";

// Produtos iniciais
const modelosIniciais = [];
const filamentosIniciais = [];

// ==============================================
// ARMAZENAMENTO LOCAL
// ==============================================

function lerLista(chave, inicial) {
  try {
    const texto = localStorage.getItem(chave);

    if (texto === null) return [...inicial];

    const dados = JSON.parse(texto);

    return Array.isArray(dados)
      ? dados
      : [...inicial];

  } catch (erro) {
    console.error("Erro ao ler", chave, erro);
    return [...inicial];
  }
}

function gravarLista(chave, lista) {
  try {
    localStorage.setItem(
      chave,
      JSON.stringify(lista)
    );

    return true;

  } catch (erro) {
    console.error("Erro ao salvar", chave, erro);
    return false;
  }
}

let modelos = lerLista(
  CHAVE_MODELOS,
  modelosIniciais
);

let filamentos = lerLista(
  CHAVE_FILAMENTOS,
  filamentosIniciais
);

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

function elemento(tag, classe = "", texto) {
  const el = document.createElement(tag);

  if (classe) el.className = classe;

  if (texto !== undefined) {
    el.textContent = texto;
  }

  return el;
}

function criarId() {
  return typeof crypto !== "undefined" &&
    crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// ==============================================
// VALIDAR FOTOS
// ==============================================

function fotoValida(caminho) {
  if (!caminho || typeof caminho !== "string") {
    return false;
  }

  const foto = caminho.trim();

  // Imagem da internet
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

  // Imagem da pasta do projeto
  const local = foto.startsWith("./")
    ? foto.slice(2)
    : foto;

  return (
    local.startsWith("imagens/") &&
    local.length > "imagens/".length &&
    !local.includes("..") &&
    !/[\\:?#]/.test(local)
  );
}

// ==============================================
// INICIAR LOJA
// ==============================================

function iniciarLoja() {

  const catalogo = document.getElementById(
    "catalogo"
  );

  const listaCores = document.getElementById(
    "listaFilamentos"
  );

  const filtro = document.getElementById(
    "filtroCategoria"
  );

  const formModelo = document.getElementById(
    "formModelo"
  );

  const formFilamento = document.getElementById(
    "formFilamento"
  );

  const botaoTema = document.getElementById(
    "alternarTema"
  );

  const admin = document.querySelector(".admin");

  // ============================================
  // MENSAGENS DENTRO DO SITE
  // ============================================

  function avisar(mensagem, erro = false) {

    let aviso = document.getElementById(
      "aviso-loja3d"
    );

    if (!aviso) {

      aviso = elemento("div");
      aviso.id = "aviso-loja3d";

      aviso.setAttribute("role", "status");

      aviso.style.cssText = `
        position: fixed;
        bottom: 18px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10001;
        max-width: 90vw;
        padding: 13px 18px;
        border-radius: 10px;
        color: #fff;
        font-weight: bold;
        box-shadow: 0 10px 30px #0006;
      `;

      document.body.appendChild(aviso);
    }

    aviso.style.background = erro
      ? "#b91c1c"
      : "#15803d";

    aviso.textContent = mensagem;
    aviso.hidden = false;

    clearTimeout(avisar.tempo);

    avisar.tempo = setTimeout(() => {
      aviso.hidden = true;
    }, 3500);
  }

  // ============================================
  // CONFIRMAÇÃO DE EXCLUSÃO PERSONALIZADA
  // ============================================

  function pedirConfirmacao(nome) {

    return new Promise(resolve => {

      const fundo = elemento("div");

      fundo.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: #0009;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      `;

      const caixa = elemento("div");

      caixa.setAttribute("role", "dialog");
      caixa.setAttribute("aria-modal", "true");
      caixa.setAttribute(
        "aria-label",
        "Confirmar exclusão"
      );

      caixa.style.cssText = `
        width: 100%;
        max-width: 420px;
        padding: 25px;
        background: var(--cartao, #172033);
        color: var(--texto, white);
        border: 1px solid var(--borda, #334155);
        border-radius: 14px;
        box-shadow: 0 20px 50px #0008;
      `;

      caixa.appendChild(
        elemento("h3", "", "Excluir item?")
      );

      caixa.appendChild(
        elemento(
          "p",
          "",
          `Deseja excluir “${nome}”?`
        )
      );

      const botoes = elemento("div");

      botoes.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      `;

      const cancelar = elemento(
        "button",
        "",
        "Cancelar"
      );

      const excluir = elemento(
        "button",
        "",
        "Sim, excluir"
      );

      cancelar.type = "button";
      excluir.type = "button";

      cancelar.style.cssText = `
        padding: 12px;
        border: 0;
        border-radius: 8px;
        background: #64748b;
        color: white;
      `;

      excluir.style.cssText = `
        padding: 12px;
        border: 0;
        border-radius: 8px;
        background: #dc2626;
        color: white;
      `;

      const focoAnterior = document.activeElement;

      function concluir(resposta) {

        document.removeEventListener(
          "keydown",
          aoTeclar
        );

        fundo.remove();

        if (
          focoAnterior &&
          focoAnterior.isConnected
        ) {
          focoAnterior.focus();
        }

        resolve(resposta);
      }

      function aoTeclar(evento) {
        if (evento.key === "Escape") {
          concluir(false);
        }
      }

      cancelar.addEventListener(
        "click",
        () => concluir(false)
      );

      excluir.addEventListener(
        "click",
        () => concluir(true)
      );

      fundo.addEventListener("click", evento => {
        if (evento.target === fundo) {
          concluir(false);
        }
      });

      document.addEventListener(
        "keydown",
        aoTeclar
      );

      botoes.append(cancelar, excluir);
      caixa.appendChild(botoes);
      fundo.appendChild(caixa);

      document.body.appendChild(fundo);

      excluir.focus();
    });
  }

  // ============================================
  // EXCLUIR MODELOS OU FILAMENTOS
  // ============================================

  async function excluirRegistro(tipo, item) {

    const ehModelo = tipo === "modelo";

    const lista = ehModelo
      ? modelos
      : filamentos;

    const indice = lista.indexOf(item);

    if (indice < 0) {
      avisar(
        "Não encontrei este item. Atualize a página.",
        true
      );
      return;
    }

    const nome = ehModelo
      ? item.nome
      : `${item.tipo} - ${item.cor}`;

    const confirmou = await pedirConfirmacao(nome);

    if (!confirmou) return;

    // Criar lista sem o item excluído
    const novaLista = lista.filter(
      (_, i) => i !== indice
    );

    const chave = ehModelo
      ? CHAVE_MODELOS
      : CHAVE_FILAMENTOS;

    // Salvar exclusão
    if (!gravarLista(chave, novaLista)) {
      avisar(
        "Não foi possível salvar a exclusão.",
        true
      );
      return;
    }

    // Atualizar dados
    if (ehModelo) {
      modelos = novaLista;
    } else {
      filamentos = novaLista;
    }

    atualizarLoja();

    avisar(`“${nome}” excluído com sucesso!`);
  }

  // ============================================
  // CRIAR PAINEL DE GERENCIAMENTO
  // ============================================

  let areaGerenciamento = null;

  if (admin) {

    let painel = document.getElementById(
      "painelExcluirItens"
    );

    if (!painel) {

      painel = elemento(
        "details",
        "painel"
      );

      painel.id = "painelExcluirItens";

      painel.appendChild(
        elemento(
          "summary",
          "",
          "🗑️ Gerenciar e excluir itens cadastrados"
        )
      );

      admin.appendChild(painel);
    }

    areaGerenciamento = elemento("div");

    areaGerenciamento.style.paddingTop = "16px";

    painel.appendChild(areaGerenciamento);
  }

  // ============================================
  // MOSTRAR PAINEL DE GERENCIAMENTO
  // ============================================

  function mostrarGerenciamento() {

    if (!areaGerenciamento) return;

    areaGerenciamento.replaceChildren();

    const grupos = [
      {
        titulo: "Modelos 3D",
        tipo: "modelo",
        itens: modelos
      },
      {
        titulo: "Filamentos",
        tipo: "filamento",
        itens: filamentos
      }
    ];

    grupos.forEach(grupo => {

      areaGerenciamento.appendChild(
        elemento("h3", "", grupo.titulo)
      );

      if (!grupo.itens.length) {
        areaGerenciamento.appendChild(
          elemento(
            "p",
            "",
            "Nenhum item cadastrado."
          )
        );
      }

      grupo.itens.forEach(item => {

        const linha = elemento("div");

        linha.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          margin: 8px 0;
          border: 1px solid var(--borda, #334155);
          border-radius: 8px;
        `;

        const nome = grupo.tipo === "modelo"
          ? item.nome
          : `${item.tipo} - ${item.cor}`;

        const rotulo = elemento(
          "span",
          "",
          nome
        );

        rotulo.style.overflowWrap = "anywhere";

        const botao = elemento(
          "button",
          "",
          "🗑️ Excluir"
        );

        botao.type = "button";

        botao.style.cssText = `
          background: #b91c1c;
          color: white;
          padding: 10px;
          border: 0;
          border-radius: 8px;
          flex-shrink: 0;
        `;

        botao.addEventListener(
          "click",
          () => excluirRegistro(grupo.tipo, item)
        );

        linha.append(rotulo, botao);

        areaGerenciamento.appendChild(linha);
      });
    });
  }

  // ============================================
  // MOSTRAR FILAMENTOS
  // ============================================

  function mostrarFilamentos() {

    if (!listaCores) return;

    listaCores.replaceChildren();

    if (!filamentos.length) {

      listaCores.appendChild(
        elemento(
          "p",
          "mensagem-vazia",
          "Nenhum filamento cadastrado."
        )
      );

      return;
    }

    filamentos.forEach(item => {

      const linha = elemento(
        "div",
        "cor-item"
      );

      const bolinha = elemento(
        "div",
        "cor-bolinha"
      );

      bolinha.style.backgroundColor =
        item.hex || "#888888";

      const texto =
        `${item.tipo} - ${item.cor}` +
        (item.marca ? ` (${item.marca})` : "");

      const nome = elemento(
        "span",
        "cor-nome",
        texto
      );

      const excluir = elemento(
        "button",
        "cor-remover",
        "×"
      );

      excluir.type = "button";
      excluir.title = "Excluir filamento";

      excluir.setAttribute(
        "aria-label",
        `Excluir ${texto}`
      );

      excluir.addEventListener(
        "click",
        () => excluirRegistro("filamento", item)
      );

      linha.append(bolinha, nome, excluir);

      listaCores.appendChild(linha);
    });
  }

  // ============================================
  // MOSTRAR MODELOS 3D
  // ============================================

  function mostrarModelos() {

    if (!catalogo) return;

    catalogo.replaceChildren();

    const categoria = filtro
      ? filtro.value
      : "Todos";

    const visiveis = modelos.filter(
      item =>
        categoria === "Todos" ||
        item.categoria === categoria
    );

    if (!visiveis.length) {

      catalogo.appendChild(
        elemento(
          "p",
          "mensagem-vazia",
          "Nenhum modelo encontrado."
        )
      );

      return;
    }

    visiveis.forEach(item => {

      const card = elemento(
        "article",
        "card"
      );

      // ====================================
      // FOTO DO PRODUTO
      // ====================================

      const semFoto = () =>
        elemento(
          "div",
          "foto-produto sem-foto",
          "3D"
        );

      if (fotoValida(item.foto)) {

        const imagem = elemento(
          "img",
          "foto-produto"
        );

        imagem.src = item.foto.trim();
        imagem.alt = item.nome;
        imagem.loading = "lazy";

        imagem.onerror = () => {
          imagem.replaceWith(semFoto());
        };

        card.appendChild(imagem);

      } else {
        card.appendChild(semFoto());
      }

      // ====================================
      // INFORMAÇÕES DO PRODUTO
      // ====================================

      const info = elemento(
        "div",
        "info-produto"
      );

      info.appendChild(
        elemento(
          "span",
          "tag",
          item.categoria
        )
      );

      info.appendChild(
        elemento("h3", "", item.nome)
      );

      info.appendChild(
        elemento(
          "p",
          "descricao",
          item.descricao ||
          "Modelo produzido em impressão 3D."
        )
      );

      const temPreco =
        item.preco !== null &&
        item.preco !== undefined &&
        item.preco !== "" &&
        Number.isFinite(Number(item.preco));

      info.appendChild(
        elemento(
          "div",
          "preco",
          temPreco
            ? moeda(item.preco)
            : "Consultar preço"
        )
      );

      // ====================================
      // PERSONALIZAÇÃO
      // ====================================

      const personalizacao = elemento(
        "div",
        "personalizacao"
      );

      const rotuloCor = elemento(
        "label",
        "",
        "Escolha a cor e o material:"
      );

      const seletor = elemento("select");

      if (!filamentos.length) {

        const opcao = elemento(
          "option",
          "",
          "A combinar"
        );

        opcao.value = "";

        seletor.appendChild(opcao);

      } else {

        filamentos.forEach((f, i) => {

          const texto =
            `${f.tipo} - ${f.cor}` +
            (f.marca ? ` (${f.marca})` : "");

          const opcao = elemento(
            "option",
            "",
            texto
          );

          opcao.value = String(i);

          seletor.appendChild(opcao);
        });
      }

      rotuloCor.appendChild(seletor);

      // Quantidade
      const rotuloQtd = elemento(
        "label",
        "",
        "Quantidade:"
      );

      const quantidade = elemento("input");

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

      // ====================================
      // PEDIDO PELO WHATSAPP
      // ====================================

      const pedir = elemento(
        "a",
        "botao-whatsapp",
        "Pedir pelo WhatsApp"
      );

      pedir.target = "_blank";
      pedir.rel = "noopener noreferrer";

      function atualizarPedido() {

        let qtd = Math.floor(
          Number(quantidade.value)
        );

        if (!Number.isFinite(qtd) || qtd < 1) {
          qtd = 1;
        }

        qtd = Math.min(qtd, 999);

        const f = filamentos[
          Number(seletor.value)
        ];

        const material = f
          ? `${f.tipo} - ${f.cor}`
          : "A combinar";

        let mensagem =
          "Olá! Gostaria de fazer um pedido de impressão 3D.\n\n" +
          `Modelo: ${item.nome}\n` +
          `Categoria: ${item.categoria}\n` +
          `Material e cor: ${material}\n` +
          `Quantidade: ${qtd}\n`;

        if (temPreco) {

          mensagem +=
            `Preço unitário: ${moeda(item.preco)}\n` +
            `Total estimado: ${moeda(Number(item.preco) * qtd)}\n`;
        }

        mensagem +=
          "\nGostaria de confirmar a disponibilidade e o valor final!";

        pedir.href =
          `https://wa.me/${WHATSAPP}?text=` +
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

      // ====================================
      // EXCLUIR MODELO
      // ====================================

      const excluir = elemento(
        "button",
        "btn-remover",
        "🗑️ Excluir modelo"
      );

      excluir.type = "button";

      excluir.addEventListener(
        "click",
        () => excluirRegistro("modelo", item)
      );

      info.appendChild(excluir);

      card.appendChild(info);

      catalogo.appendChild(card);
    });
  }

  // ============================================
  // ATUALIZAR A LOJA
  // ============================================

  function atualizarLoja() {
    mostrarFilamentos();
    mostrarModelos();
    mostrarGerenciamento();
  }

  // ============================================
  // CADASTRAR MODELO 3D
  // ============================================

  if (formModelo) {

    formModelo.addEventListener(
      "submit",
      evento => {

        evento.preventDefault();

        const nome = document.getElementById(
          "nomeModelo"
        ).value.trim();

        const categoria = document.getElementById(
          "categoriaModelo"
        ).value;

        const descricao = document.getElementById(
          "descricaoModelo"
        ).value.trim();

        const valor = document.getElementById(
          "precoModelo"
        ).value;

        const foto = document.getElementById(
          "fotoModelo"
        ).value.trim();

        if (!nome) {
          return avisar(
            "Digite o nome do modelo.",
            true
          );
        }

        if (foto && !fotoValida(foto)) {
          return avisar(
            "Use imagens/nome.png ou um link https:// para a foto.",
            true
          );
        }

        const preco = valor === ""
          ? null
          : Number(valor);

        if (
          preco !== null &&
          (!Number.isFinite(preco) || preco < 0)
        ) {
          return avisar(
            "Digite um preço válido.",
            true
          );
        }

        const novo = {
          id: criarId(),
          nome,
          categoria,
          descricao,
          preco,
          foto
        };

        const novaLista = [
          ...modelos,
          novo
        ];

        if (!gravarLista(CHAVE_MODELOS, novaLista)) {
          return avisar(
            "Não foi possível salvar o modelo.",
            true
          );
        }

        modelos = novaLista;

        if (filtro) {
          filtro.value = "Todos";
        }

        formModelo.reset();
        atualizarLoja();

        avisar("Modelo cadastrado com sucesso!");
      }
    );
  }

  // ============================================
  // CADASTRAR FILAMENTO
  // ============================================

  if (formFilamento) {

    formFilamento.addEventListener(
      "submit",
      evento => {

        evento.preventDefault();

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
          return avisar(
            "Digite o nome da cor.",
            true
          );
        }

        const novaLista = [
          ...filamentos,
          {
            id: criarId(),
            cor,
            tipo,
            marca,
            hex
          }
        ];

        if (
          !gravarLista(
            CHAVE_FILAMENTOS,
            novaLista
          )
        ) {
          return avisar(
            "Não foi possível salvar o filamento.",
            true
          );
        }

        filamentos = novaLista;

        formFilamento.reset();
        atualizarLoja();

        avisar("Filamento cadastrado com sucesso!");
      }
    );
  }

  // ============================================
  // FILTRO DE CATEGORIAS
  // ============================================

  if (filtro) {
    filtro.addEventListener(
      "change",
      mostrarModelos
    );
  }

  // ============================================
  // MODO CLARO E ESCURO
  // ============================================

  let temaAtual = "escuro";

  try {

    const salvo = localStorage.getItem(
      CHAVE_TEMA
    );

    if (
      salvo === "claro" ||
      salvo === "escuro"
    ) {
      temaAtual = salvo;
    }

  } catch (erro) {
    console.warn(
      "Não foi possível ler o tema.",
      erro
    );
  }

  function aplicarTema(tema) {

    temaAtual = tema;

    document.documentElement.setAttribute(
      "data-tema",
      tema
    );

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

  if (botaoTema) {

    botaoTema.addEventListener(
      "click",
      () => {

        aplicarTema(
          temaAtual === "escuro"
            ? "claro"
            : "escuro"
        );

        try {
          localStorage.setItem(
            CHAVE_TEMA,
            temaAtual
          );

        } catch (erro) {
          console.warn(
            "Não foi possível salvar o tema.",
            erro
          );
        }
      }
    );
  }

  // ============================================
  // INICIAR SITE
  // ============================================

  aplicarTema(temaAtual);
  atualizarLoja();
}

// ==============================================
// AGUARDAR O HTML CARREGAR
// ==============================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    iniciarLoja,
    { once: true }
  );

} else {
  iniciarLoja();
}
