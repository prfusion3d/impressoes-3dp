
// ======================================
// MINHA LOJA 3D
// JAVASCRIPT COMPLETO
// ======================================

// WHATSAPP DA LOJA
const whatsapp = "5544933007211";

// CHAVES DO ARMAZENAMENTO
const CHAVE_MODELOS = "loja3d_modelos";
const CHAVE_FILAMENTOS = "loja3d_filamentos";
const CHAVE_TEMA = "loja3d_tema";

// PRODUTOS INICIAIS
const modelosIniciais = [];
const filamentosIniciais = [];

// ======================================
// ARMAZENAMENTO LOCAL
// ======================================

function carregarLista(chave, padrao) {
  try {
    const dados = JSON.parse(
      localStorage.getItem(chave)
    );

    if (Array.isArray(dados)) {
      return dados;
    }
  } catch (erro) {
    console.warn("Erro ao carregar:", chave);
  }

  return [...padrao];
}

let modelos = carregarLista(
  CHAVE_MODELOS,
  modelosIniciais
);

let filamentos = carregarLista(
  CHAVE_FILAMENTOS,
  filamentosIniciais
);

function salvarLista(chave, lista) {
  try {
    localStorage.setItem(
      chave,
      JSON.stringify(lista)
    );

    return true;
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível salvar as alterações.");
    return false;
  }
}

// ======================================
// FUNÇÕES AUXILIARES
// ======================================

function criar(tag, classe = "", texto) {
  const elemento = document.createElement(tag);

  if (classe) {
    elemento.className = classe;
  }

  if (texto !== undefined) {
    elemento.textContent = texto;
  }

  return elemento;
}

function gerarId() {
  return (
    Date.now().toString() +
    "-" +
    Math.random().toString(36).slice(2)
  );
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}

// ======================================
// VALIDAR IMAGENS
// ======================================

// Aceita:
// imagens/dragao.png
// imagens/chaveiro.jpg
// ./imagens/produto.webp
// https://site.com/foto.png

function urlValida(valor) {
  if (typeof valor !== "string") {
    return false;
  }

  const caminho = valor.trim();

  if (!caminho) {
    return false;
  }

  // IMAGEM DA INTERNET
  if (/^https?:\/\//i.test(caminho)) {
    try {
      const url = new URL(caminho);

      return (
        url.protocol === "https:" ||
        url.protocol === "http:"
      );
    } catch (erro) {
      return false;
    }
  }

  // IMAGEM LOCAL
  const local = caminho.startsWith("./")
    ? caminho.slice(2)
    : caminho;

  return (
    local.startsWith("imagens/") &&
    local.length > "imagens/".length &&
    !local.includes("..") &&
    !local.includes("\\") &&
    !local.includes(":") &&
    !local.includes("?") &&
    !local.includes("#")
  );
}

// ======================================
// INICIALIZAÇÃO DA LOJA
// ======================================

function iniciarLoja() {

  // ELEMENTOS DO HTML
  const catalogo = document.getElementById(
    "catalogo"
  );

  const listaFilamentos = document.getElementById(
    "listaFilamentos"
  );

  const filtroCategoria = document.getElementById(
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

  // ====================================
  // MODO CLARO E ESCURO
  // ====================================

  let temaAtual = "escuro";

  try {
    const temaSalvo = localStorage.getItem(
      CHAVE_TEMA
    );

    if (
      temaSalvo === "claro" ||
      temaSalvo === "escuro"
    ) {
      temaAtual = temaSalvo;
    }
  } catch (erro) {
    console.warn("Não foi possível carregar o tema.");
  }

  function aplicarTema(tema) {
    temaAtual = tema;

    document.documentElement.setAttribute(
      "data-tema",
      temaAtual
    );

    if (!botaoTema) return;

    if (temaAtual === "claro") {
      botaoTema.textContent = "🌙 Modo escuro";
      botaoTema.setAttribute("aria-pressed", "true");
    } else {
      botaoTema.textContent = "☀️ Modo claro";
      botaoTema.setAttribute("aria-pressed", "false");
    }
  }

  if (botaoTema) {
    botaoTema.addEventListener("click", () => {

      const novoTema = temaAtual === "escuro"
        ? "claro"
        : "escuro";

      aplicarTema(novoTema);

      try {
        localStorage.setItem(
          CHAVE_TEMA,
          temaAtual
        );
      } catch (erro) {
        console.warn("Não foi possível salvar o tema.");
      }
    });
  }

  aplicarTema(temaAtual);

  // ====================================
  // EXCLUIR REGISTROS
  // ====================================

  function excluirRegistro(tipo, id) {

    const ehModelo = tipo === "modelo";

    const lista = ehModelo
      ? modelos
      : filamentos;

    const chave = ehModelo
      ? CHAVE_MODELOS
      : CHAVE_FILAMENTOS;

    const indice = lista.findIndex(
      item => String(item.id) === String(id)
    );

    if (indice === -1) {
      alert("Item não encontrado.");
      return;
    }

    const item = lista[indice];

    const nome = ehModelo
      ? item.nome
      : item.tipo + " - " + item.cor;

    const confirmar = confirm(
      "Deseja realmente excluir " + nome + "?"
    );

    if (!confirmar) return;

    // REMOVER DA LISTA
    const removido = lista.splice(indice, 1)[0];

    // SALVAR ALTERAÇÃO
    if (!salvarLista(chave, lista)) {
      lista.splice(indice, 0, removido);
      atualizarLoja();
      return;
    }

    // ATUALIZAR TODA A LOJA
    atualizarLoja();

    alert("Item excluído com sucesso!");
  }

  // ====================================
  // MOSTRAR FILAMENTOS
  // ====================================

  function mostrarFilamentos() {

    if (!listaFilamentos) return;

    listaFilamentos.replaceChildren();

    if (filamentos.length === 0) {

      listaFilamentos.appendChild(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum filamento cadastrado."
        )
      );

      return;
    }

    filamentos.forEach(f => {

      const item = criar("div", "cor-item");

      // COR DO FILAMENTO
      const bolinha = criar(
        "div",
        "cor-bolinha"
      );

      bolinha.style.backgroundColor = f.hex;

      let nomeCompleto = f.tipo + " - " + f.cor;

      if (f.marca) {
        nomeCompleto += " (" + f.marca + ")";
      }

      const nome = criar(
        "span",
        "cor-nome",
        nomeCompleto
      );

      // BOTÃO EXCLUIR
      const remover = criar(
        "button",
        "cor-remover",
        "×"
      );

      remover.type = "button";
      remover.title = "Excluir filamento";

      remover.setAttribute(
        "aria-label",
        "Excluir " + nomeCompleto
      );

      remover.addEventListener("click", () => {
        excluirRegistro("filamento", f.id);
      });

      item.append(
        bolinha,
        nome,
        remover
      );

      listaFilamentos.appendChild(item);
    });
  }

  // ====================================
  // MOSTRAR MODELOS 3D
  // ====================================

  function mostrarModelos() {

    if (!catalogo) return;

    catalogo.replaceChildren();

    const categoria = filtroCategoria
      ? filtroCategoria.value
      : "Todos";

    const encontrados = modelos.filter(m => {
      return (
        categoria === "Todos" ||
        m.categoria === categoria
      );
    });

    if (encontrados.length === 0) {

      catalogo.appendChild(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum modelo encontrado."
        )
      );

      return;
    }

    encontrados.forEach(modelo => {

      const card = criar("article", "card");

      // ================================
      // FOTO DO PRODUTO
      // ================================

      function semFoto() {
        return criar(
          "div",
          "foto-produto sem-foto",
          "3D"
        );
      }

      if (modelo.foto && urlValida(modelo.foto)) {

        const imagem = criar(
          "img",
          "foto-produto"
        );

        imagem.src = modelo.foto.trim();
        imagem.alt = modelo.nome;
        imagem.loading = "lazy";

        imagem.onerror = () => {
          imagem.replaceWith(semFoto());
        };

        card.appendChild(imagem);

      } else {
        card.appendChild(semFoto());
      }

      // ================================
      // INFORMAÇÕES DO PRODUTO
      // ================================

      const info = criar(
        "div",
        "info-produto"
      );

      const tag = criar(
        "span",
        "tag",
        modelo.categoria
      );

      const titulo = criar(
        "h3",
        "",
        modelo.nome
      );

      const descricao = criar(
        "p",
        "descricao",
        modelo.descricao ||
        "Modelo produzido em impressão 3D."
      );

      const possuiPreco =
        modelo.preco !== null &&
        modelo.preco !== undefined &&
        modelo.preco !== "" &&
        Number.isFinite(Number(modelo.preco));

      const preco = criar(
        "div",
        "preco",
        possuiPreco
          ? formatarPreco(modelo.preco)
          : "Consultar preço"
      );

      info.append(
        tag,
        titulo,
        descricao,
        preco
      );

      // ================================
      // PERSONALIZAÇÃO
      // ================================

      const personalizacao = criar(
        "div",
        "personalizacao"
      );

      const labelCor = criar(
        "label",
        "",
        "Escolha a cor e o material:"
      );

      const selectCor = criar("select");

      if (filamentos.length === 0) {

        const opcao = criar(
          "option",
          "",
          "A combinar"
        );

        opcao.value = "";
        selectCor.appendChild(opcao);

      } else {

        filamentos.forEach(f => {

          let texto = f.tipo + " - " + f.cor;

          if (f.marca) {
            texto += " (" + f.marca + ")";
          }

          const opcao = criar(
            "option",
            "",
            texto
          );

          opcao.value = String(f.id);

          selectCor.appendChild(opcao);
        });
      }

      labelCor.appendChild(selectCor);

      // QUANTIDADE
      const labelQuantidade = criar(
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

      labelQuantidade.appendChild(quantidade);

      personalizacao.append(
        labelCor,
        labelQuantidade
      );

      info.appendChild(personalizacao);

      // ================================
      // WHATSAPP
      // ================================

      const botao = criar(
        "a",
        "botao-whatsapp",
        "Pedir pelo WhatsApp"
      );

      botao.target = "_blank";
      botao.rel = "noopener noreferrer";

      function atualizarPedido() {

        const escolhido = filamentos.find(
          f => String(f.id) === selectCor.value
        );

        const material = escolhido
          ? escolhido.tipo + " - " + escolhido.cor
          : "A combinar";

        let qtd = Math.floor(
          Number(quantidade.value)
        );

        if (!Number.isFinite(qtd) || qtd < 1) {
          qtd = 1;
        }

        qtd = Math.min(qtd, 999);

        let mensagem =
          "Olá! Gostaria de fazer um pedido de impressão 3D.\n\n" +
          "Modelo: " + modelo.nome + "\n" +
          "Categoria: " + modelo.categoria + "\n" +
          "Material e cor: " + material + "\n" +
          "Quantidade: " + qtd + "\n";

        if (possuiPreco) {

          mensagem +=
            "Preço unitário: " +
            formatarPreco(modelo.preco) + "\n";

          mensagem +=
            "Total estimado: " +
            formatarPreco(
              Number(modelo.preco) * qtd
            ) + "\n";
        }

        mensagem +=
          "\nGostaria de confirmar a disponibilidade e o valor final!";

        botao.href =
          "https://wa.me/" +
          whatsapp +
          "?text=" +
          encodeURIComponent(mensagem);
      }

      selectCor.addEventListener(
        "change",
        atualizarPedido
      );

      quantidade.addEventListener(
        "input",
        atualizarPedido
      );

      botao.addEventListener(
        "click",
        atualizarPedido
      );

      atualizarPedido();

      info.appendChild(botao);

      // ================================
      // EXCLUIR MODELO
      // ================================

      const remover = criar(
        "button",
        "btn-remover",
        "🗑️ Excluir modelo"
      );

      remover.type = "button";

      remover.addEventListener("click", () => {
        excluirRegistro("modelo", modelo.id);
      });

      info.appendChild(remover);

      card.appendChild(info);

      catalogo.appendChild(card);
    });
  }

  // ====================================
  // CADASTRAR MODELO
  // ====================================

  if (formModelo) {

    formModelo.addEventListener(
      "submit",
      function(evento) {

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
          alert("Digite o nome do modelo.");
          return;
        }

        if (foto && !urlValida(foto)) {
          alert(
            "Imagem inválida.\n\n" +
            "Use imagens/dragao.png ou um link https://"
          );
          return;
        }

        const preco = valor === ""
          ? null
          : Number(valor);

        if (
          preco !== null &&
          (!Number.isFinite(preco) || preco < 0)
        ) {
          alert("Digite um preço válido.");
          return;
        }

        const novoModelo = {
          id: gerarId(),
          nome,
          categoria,
          descricao,
          preco,
          foto
        };

        modelos.push(novoModelo);

        if (!salvarLista(CHAVE_MODELOS, modelos)) {
          modelos.pop();
          return;
        }

        if (filtroCategoria) {
          filtroCategoria.value = "Todos";
        }

        atualizarLoja();
        formModelo.reset();

        alert("Modelo cadastrado com sucesso!");
      }
    );
  }

  // ====================================
  // CADASTRAR FILAMENTO
  // ====================================

  if (formFilamento) {

    formFilamento.addEventListener(
      "submit",
      function(evento) {

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
          alert("Digite o nome da cor.");
          return;
        }

        const novoFilamento = {
          id: gerarId(),
          cor,
          tipo,
          marca,
          hex
        };

        filamentos.push(novoFilamento);

        if (!salvarLista(CHAVE_FILAMENTOS, filamentos)) {
          filamentos.pop();
          return;
        }

        atualizarLoja();
        formFilamento.reset();

        alert("Filamento cadastrado com sucesso!");
      }
    );
  }

  // ====================================
  // FILTRO DE CATEGORIAS
  // ====================================

  if (filtroCategoria) {
    filtroCategoria.addEventListener(
      "change",
      mostrarModelos
    );
  }

  // ====================================
  // NOVA ÁREA DE GERENCIAMENTO
  // ====================================

  let areaGerenciamento = null;

  if (admin) {

    // CRIAR PAINEL AUTOMATICAMENTE
    const painel = criar(
      "details",
      "painel"
    );

    painel.id = "painelExcluirItens";

    const tituloPainel = criar(
      "summary",
      "",
      "🗑️ Gerenciar e excluir itens cadastrados"
    );

    areaGerenciamento = criar("div");

    areaGerenciamento.style.paddingTop = "18px";

    painel.append(
      tituloPainel,
      areaGerenciamento
    );

    admin.appendChild(painel);
  }

  // ====================================
  // EXIBIR ITENS NO GERENCIAMENTO
  // ====================================

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
        titulo: "Filamentos disponíveis",
        tipo: "filamento",
        itens: filamentos
      }
    ];

    grupos.forEach(grupo => {

      const subtitulo = criar(
        "h3",
        "",
        grupo.titulo
      );

      subtitulo.style.margin = "20px 0 12px";

      areaGerenciamento.appendChild(subtitulo);

      if (grupo.itens.length === 0) {

        const vazio = criar(
          "p",
          "",
          "Nenhum item cadastrado."
        );

        vazio.style.color = "var(--secundario)";

        areaGerenciamento.appendChild(vazio);

        return;
      }

      grupo.itens.forEach(item => {

        // LINHA DO ITEM
        const linha = criar("div");

        linha.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          margin-bottom: 10px;
          border: 1px solid var(--borda);
          border-radius: 9px;
          background: var(--cartao);
        `;

        // NOME
        const nomeItem = grupo.tipo === "modelo"
          ? item.nome
          : item.tipo + " - " + item.cor;

        const nome = criar(
          "span",
          "",
          nomeItem
        );

        nome.style.cssText = `
          color: var(--texto);
          font-size: 14px;
          overflow-wrap: anywhere;
          min-width: 0;
        `;

        // BOTÃO EXCLUIR
        const botaoExcluir = criar(
          "button",
          "",
          "🗑️ Excluir"
        );

        botaoExcluir.type = "button";

        botaoExcluir.style.cssText = `
          background: #b91c1c;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          flex-shrink: 0;
        `;

        botaoExcluir.addEventListener(
          "click",
          () => {
            excluirRegistro(
              grupo.tipo,
              item.id
            );
          }
        );

        linha.append(
          nome,
          botaoExcluir
        );

        areaGerenciamento.appendChild(linha);
      });
    });
  }

  // ====================================
  // ATUALIZAR A LOJA
  // ====================================

  function atualizarLoja() {
    mostrarFilamentos();
    mostrarModelos();
    mostrarGerenciamento();
  }

  // INICIAR CATÁLOGO
  atualizarLoja();
}

// ======================================
// AGUARDAR O HTML CARREGAR
// ======================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    iniciarLoja
  );

} else {

  iniciarLoja();
}
