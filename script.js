
// ======================================
// CONFIGURAÇÕES DA LOJA
// ======================================

const whatsapp = "5544933007211";

const CHAVE_MODELOS = "loja3d_modelos";
const CHAVE_FILAMENTOS = "loja3d_filamentos";
const CHAVE_TEMA = "loja3d_tema";

// PRODUTOS INICIAIS
const modelosIniciais = [];

// FILAMENTOS INICIAIS
const filamentosIniciais = [];

// ======================================
// ARMAZENAMENTO
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

function salvarDados() {
  try {
    localStorage.setItem(
      CHAVE_MODELOS,
      JSON.stringify(modelos)
    );

    localStorage.setItem(
      CHAVE_FILAMENTOS,
      JSON.stringify(filamentos)
    );

    return true;
  } catch (erro) {
    alert("Erro ao salvar os dados.");
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
// VERIFICAR CAMINHO DA FOTO
// ======================================

// Agora aceita:
// imagens/dragao.png
// imagens/chaveiro.jpg
// ./imagens/miniatura.webp
// https://site.com/foto.png

function urlValida(valor) {
  if (typeof valor !== "string") {
    return false;
  }

  const caminho = valor.trim();

  if (!caminho) {
    return false;
  }

  // LINK DE SITE EXTERNO
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

  // ARQUIVO LOCAL NA PASTA IMAGENS
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
// INICIAR LOJA
// ======================================

function iniciarLoja() {

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

      const remover = criar(
        "button",
        "cor-remover",
        "×"
      );

      remover.type = "button";
      remover.title = "Remover filamento";

      remover.addEventListener("click", () => {

        if (!confirm("Excluir este filamento?")) {
          return;
        }

        const anteriores = filamentos;

        filamentos = filamentos.filter(
          item => item.id !== f.id
        );

        if (!salvarDados()) {
          filamentos = anteriores;
        }

        atualizarLoja();
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
  // MOSTRAR MODELOS
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
          "Nenhum modelo encontrado. Cadastre seu primeiro produto!"
        )
      );

      return;
    }

    encontrados.forEach(modelo => {

      const card = criar("article", "card");

      // ==================================
      // IMAGEM DO PRODUTO
      // ==================================

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

        // ACEITA IMAGEM LOCAL OU EXTERNA
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

      // ==================================
      // INFORMAÇÕES
      // ==================================

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

      // ==================================
      // PERSONALIZAÇÃO
      // ==================================

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

      // ==================================
      // PEDIDO PELO WHATSAPP
      // ==================================

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

      // ==================================
      // EXCLUIR MODELO
      // ==================================

      const remover = criar(
        "button",
        "btn-remover",
        "Excluir modelo"
      );

      remover.type = "button";

      remover.addEventListener("click", () => {

        if (!confirm("Excluir este modelo?")) {
          return;
        }

        const anteriores = modelos;

        modelos = modelos.filter(
          item => item.id !== modelo.id
        );

        if (!salvarDados()) {
          modelos = anteriores;
        }

        mostrarModelos();
      });

      info.appendChild(remover);

      card.appendChild(info);
      catalogo.appendChild(card);
    });
  }

  // ====================================
  // CADASTRAR MODELO 3D
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

        // VALIDAR IMAGEM LOCAL OU EXTERNA
        if (foto && !urlValida(foto)) {
          alert(
            "Caminho de imagem inválido.\n\n" +
            "Use imagens/dragao.png ou um link https://..."
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
          nome: nome,
          categoria: categoria,
          descricao: descricao,
          preco: preco,
          foto: foto
        };

        modelos.push(novoModelo);

        if (!salvarDados()) {
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
          cor: cor,
          tipo: tipo,
          marca: marca,
          hex: hex
        };

        filamentos.push(novoFilamento);

        if (!salvarDados()) {
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
  // FILTRAR CATEGORIAS
  // ====================================

  if (filtroCategoria) {
    filtroCategoria.addEventListener(
      "change",
      mostrarModelos
    );
  }

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
    console.warn("Tema salvo indisponível.");
  }

  function aplicarTema(tema) {

    temaAtual = tema;

    document.documentElement.setAttribute(
      "data-tema",
      temaAtual
    );

    if (!botaoTema) return;

    if (temaAtual === "claro") {

      botaoTema.textContent =
        "🌙 Modo escuro";

      botaoTema.setAttribute(
        "aria-pressed",
        "true"
      );

    } else {

      botaoTema.textContent =
        "☀️ Modo claro";

      botaoTema.setAttribute(
        "aria-pressed",
        "false"
      );
    }
  }

  if (botaoTema) {

    botaoTema.addEventListener(
      "click",
      function() {

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
          console.warn(
            "Não foi possível salvar o tema."
          );
        }
      }
    );
  }

  // ====================================
  // ATUALIZAR LOJA
  // ====================================

  function atualizarLoja() {
    mostrarFilamentos();
    mostrarModelos();
  }

  // INICIALIZAÇÃO
  aplicarTema(temaAtual);
  atualizarLoja();
}

// ======================================
// AGUARDAR HTML CARREGAR
// ======================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    iniciarLoja
  );

} else {

  iniciarLoja();
}

/* ======================================
   GERENCIAR E EXCLUIR ITENS
====================================== */

(function () {

  function iniciarExclusao() {

    const admin = document.querySelector(".admin");

    if (!admin) return;

    if (document.getElementById("painelExcluirItens")) {
      return;
    }

    // CRIAR PAINEL
    const painel = document.createElement("details");
    painel.className = "painel";
    painel.id = "painelExcluirItens";

    const titulo = document.createElement("summary");
    titulo.textContent =
      "🗑️ Gerenciar e excluir itens cadastrados";

    const conteudo = document.createElement("div");
    conteudo.style.paddingTop = "15px";

    painel.append(titulo, conteudo);
    admin.appendChild(painel);

    // TIPOS DE CADASTRO
    const tipos = [
      {
        chave: "loja3d_modelos",
        titulo: "Modelos 3D",
        nome: item => item.nome || "Sem nome"
      },
      {
        chave: "loja3d_filamentos",
        titulo: "Filamentos",
        nome: item =>
          `${item.tipo || "Material"} - ${item.cor || "Cor"}`
      }
    ];

    // CARREGAR CADASTROS
    function carregar(chave) {
      try {
        const dados = JSON.parse(
          localStorage.getItem(chave)
        );

        return Array.isArray(dados) ? dados : [];

      } catch {
        return [];
      }
    }

    // MOSTRAR LISTAS
    function mostrarItens() {

      conteudo.replaceChildren();

      tipos.forEach(tipo => {

        const subtitulo = document.createElement("h3");
        subtitulo.textContent = tipo.titulo;

        conteudo.appendChild(subtitulo);

        const itens = carregar(tipo.chave);

        if (itens.length === 0) {
          const vazio = document.createElement("p");
          vazio.textContent = "Nenhum item cadastrado.";
          conteudo.appendChild(vazio);
        }

        itens.forEach((item, indice) => {

          const linha = document.createElement("div");

          linha.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px;
            margin: 8px 0;
            border: 1px solid var(--borda, #888);
            border-radius: 8px;
          `;

          const nome = document.createElement("span");
          nome.textContent = tipo.nome(item);

          const botao = document.createElement("button");
          botao.type = "button";
          botao.textContent = "Excluir";

          botao.style.cssText = `
            background: #b91c1c;
            color: white;
            padding: 10px 14px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          `;

          botao.addEventListener("click", () => {

            if (!confirm(
              `Deseja excluir ${tipo.nome(item)}?`
            )) {
              return;
            }

            const atual = carregar(tipo.chave);

            const posicao = item.id == null
              ? indice
              : atual.findIndex(
                  x => String(x.id) === String(item.id)
                );

            if (
              posicao < 0 ||
              posicao >= atual.length
            ) {
              alert("Item não encontrado. Atualize a página.");
              return;
            }

            atual.splice(posicao, 1);

            try {
              localStorage.setItem(
                tipo.chave,
                JSON.stringify(atual)
              );

              location.reload();

            } catch {
              alert("Erro ao excluir o item.");
            }

          });

          linha.append(nome, botao);
          conteudo.appendChild(linha);

        });

      });
    }

    painel.addEventListener("toggle", () => {
      if (painel.open) mostrarItens();
    });

    mostrarItens();
  }

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      iniciarExclusao
    );

  } else {

    iniciarExclusao();

  }

})();
