const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");

const pontosTexto = document.getElementById("pontos");
const vidasTexto = document.getElementById("vidas");
const tela = document.getElementById("tela");
const titulo = document.getElementById("titulo");
const mensagem = document.getElementById("mensagem");
const botaoIniciar = document.getElementById("iniciar");

const W = canvas.width;
const H = canvas.height;

let nave;
let tiros = [];
let inimigos = [];
let estrelas = [];
let particulas = [];

let pontos = 0;
let vidas = 3;
let ativo = false;
let teclas = {};
let ultimoTiro = 0;
let ultimoInimigo = 0;
let ultimoTempo = 0;
let animacao = null;

function criarEstrelas() {
    estrelas = [];

    for (let i = 0; i < 75; i++) {
        estrelas.push({
            x: Math.random() * W,
            y: Math.random() * H,
            tamanho: Math.random() * 2 + 1,
            velocidade: Math.random() * 2 + 1
        });
    }
}

function desenharNave() {
    ctx.save();
    ctx.translate(nave.x, nave.y);

    // Asas
    ctx.fillStyle = "#1475ff";
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-23, 19);
    ctx.lineTo(-9, 14);
    ctx.lineTo(0, 21);
    ctx.lineTo(9, 14);
    ctx.lineTo(23, 19);
    ctx.closePath();
    ctx.fill();

    // Corpo
    ctx.fillStyle = "#eafaff";
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(-9, 14);
    ctx.lineTo(0, 10);
    ctx.lineTo(9, 14);
    ctx.closePath();
    ctx.fill();

    // Cabine
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.ellipse(0, -5, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Propulsores
    ctx.fillStyle = "#ff8a24";
    ctx.fillRect(-13, 15, 5, 10);
    ctx.fillRect(8, 15, 5, 10);

    ctx.fillStyle = "#fff3a1";
    ctx.fillRect(-12, 20, 3, 7);
    ctx.fillRect(9, 20, 3, 7);

    ctx.restore();
}

function desenharInimigo(inimigo) {
    ctx.save();
    ctx.translate(inimigo.x, inimigo.y);

    ctx.fillStyle = inimigo.cor;
    ctx.beginPath();
    ctx.moveTo(-20, -13);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-7, -17);
    ctx.lineTo(7, -17);
    ctx.lineTo(10, -7);
    ctx.lineTo(20, -13);
    ctx.lineTo(15, 13);
    ctx.lineTo(0, 19);
    ctx.lineTo(-15, 13);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.fillRect(-11, -5, 6, 4);
    ctx.fillRect(5, -5, 6, 4);

    ctx.fillStyle = "#16142d";
    ctx.fillRect(-5, 5, 10, 3);

    ctx.restore();
}

function desenharTiro(tiro) {
    ctx.fillStyle = "#00f6ff";
    ctx.shadowColor = "#00f6ff";
    ctx.shadowBlur = 12;

    ctx.fillRect(tiro.x - 3, tiro.y - 10, 6, 18);

    ctx.shadowBlur = 0;
}

function desenharCenario(delta) {
    ctx.fillStyle = "#070b1c";
    ctx.fillRect(0, 0, W, H);

    estrelas.forEach(estrela => {
        estrela.y += estrela.velocidade * delta;

        if (estrela.y > H) {
            estrela.y = 0;
            estrela.x = Math.random() * W;
        }

        ctx.fillStyle = "#d9f6ff";
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;

        ctx.fillRect(
            estrela.x,
            estrela.y,
            estrela.tamanho,
            estrela.tamanho
        );
    });

    ctx.globalAlpha = 1;
}

function criarInimigo() {
    inimigos.push({
        x: 25 + Math.random() * (W - 50),
        y: -25,
        velocidade: 2 + Math.random() * 1.5,
        cor: ["#ff416c", "#a855f7", "#ff8c42"][
            Math.floor(Math.random() * 3)
        ],
        vida: 1
    });
}

function atirar() {
    const agora = performance.now();

    if (agora - ultimoTiro < 230) return;

    tiros.push({
        x: nave.x,
        y: nave.y - 22,
        velocidade: 8
    });

    ultimoTiro = agora;
}

function criarExplosao(x, y, cor) {
    for (let i = 0; i < 12; i++) {
        particulas.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            vida: 25,
            cor
        });
    }
}

function desenharExplosoes(delta) {
    particulas = particulas.filter(p => p.vida > 0);

    particulas.forEach(p => {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vida -= delta;

        ctx.globalAlpha = Math.max(0, p.vida / 25);
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x, p.y, 4, 4);
    });

    ctx.globalAlpha = 1;
}

function atualizar(tempo) {
    if (!ativo) return;

    const delta = ultimoTempo
        ? Math.min((tempo - ultimoTempo) / 16.67, 2)
        : 1;

    ultimoTempo = tempo;

    desenharCenario(delta);

    if (teclas.ArrowLeft || teclas.a) {
        nave.x -= nave.velocidade * delta;
    }

    if (teclas.ArrowRight || teclas.d) {
        nave.x += nave.velocidade * delta;
    }

    if (teclas.ArrowUp || teclas.w) {
        nave.y -= nave.velocidade * delta;
    }

    if (teclas.ArrowDown || teclas.s) {
        nave.y += nave.velocidade * delta;
    }

    nave.x = Math.max(25, Math.min(W - 25, nave.x));
    nave.y = Math.max(35, Math.min(H - 35, nave.y));

    if (teclas[" "] || teclas.Atirar) {
        atirar();
    }

    const agora = performance.now();

    if (agora - ultimoInimigo > Math.max(350, 950 - pontos * 3)) {
        criarInimigo();
        ultimoInimigo = agora;
    }

    tiros.forEach(tiro => {
        tiro.y -= tiro.velocidade * delta;
    });

    tiros = tiros.filter(tiro => tiro.y > -20);

    for (let i = inimigos.length - 1; i >= 0; i--) {
        const inimigo = inimigos[i];

        inimigo.y += inimigo.velocidade * delta;

        let destruido = false;

        for (let j = tiros.length - 1; j >= 0; j--) {
            const tiro = tiros[j];

            const acertou =
                Math.abs(tiro.x - inimigo.x) < 22 &&
                Math.abs(tiro.y - inimigo.y) < 23;

            if (acertou) {
                tiros.splice(j, 1);
                inimigos.splice(i, 1);

                criarExplosao(inimigo.x, inimigo.y, inimigo.cor);

                pontos += 10;
                pontosTexto.textContent = pontos;

                destruido = true;
                break;
            }
        }

        if (destruido) continue;

        // Inimigo chegou ao fim da tela
        if (inimigo.y > H + 20) {
            inimigos.splice(i, 1);
            vidas--;
            vidasTexto.textContent = vidas;

            if (vidas <= 0) {
                fimDeJogo();
                return;
            }

            continue;
        }

        // Colisão com a nave
        const bateu =
            Math.abs(nave.x - inimigo.x) < 30 &&
            Math.abs(nave.y - inimigo.y) < 30;

        if (bateu) {
            inimigos.splice(i, 1);
            criarExplosao(nave.x, nave.y, "#00e5ff");

            vidas--;
            vidasTexto.textContent = vidas;

            if (vidas <= 0) {
                fimDeJogo();
                return;
            }
        }
    }

    tiros.forEach(desenharTiro);
    inimigos.forEach(desenharInimigo);
    desenharExplosoes(delta);
    desenharNave();

    animacao = requestAnimationFrame(atualizar);
}

function iniciarJogo() {
    if (animacao !== null) {
        cancelAnimationFrame(animacao);
    }

    nave = {
        x: W / 2,
        y: H - 70,
        velocidade: 5
    };

    tiros = [];
    inimigos = [];
    particulas = [];
    pontos = 0;
    vidas = 3;

    pontosTexto.textContent = pontos;
    vidasTexto.textContent = vidas;

    teclas = {};
    ultimoTempo = 0;
    ultimoTiro = 0;
    ultimoInimigo = performance.now();

    criarEstrelas();

    ativo = true;
    tela.style.display = "none";

    animacao = requestAnimationFrame(atualizar);
}

function fimDeJogo() {
    ativo = false;

    if (animacao !== null) {
        cancelAnimationFrame(animacao);
        animacao = null;
    }

    titulo.textContent = "FIM DE JOGO!";
    mensagem.textContent = `Você fez ${pontos} pontos!`;
    botaoIniciar.textContent = "JOGAR NOVAMENTE";

    tela.style.display = "flex";
    teclas = {};
}

document.addEventListener("keydown", evento => {
    if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "]
            .includes(evento.key)
    ) {
        evento.preventDefault();
    }

    teclas[evento.key] = true;
});

document.addEventListener("keyup", evento => {
    teclas[evento.key] = false;
});

function configurarBotao(id, tecla) {
    const botao = document.getElementById(id);

    botao.addEventListener("pointerdown", evento => {
        evento.preventDefault();
        teclas[tecla] = true;
        botao.setPointerCapture(evento.pointerId);
    });

    function soltar() {
        teclas[tecla] = false;
    }

    botao.addEventListener("pointerup", soltar);
    botao.addEventListener("pointercancel", soltar);
    botao.addEventListener("lostpointercapture", soltar);
}

configurarBotao("esquerda", "ArrowLeft");
configurarBotao("direita", "ArrowRight");
configurarBotao("atirar", "Atirar");

botaoIniciar.addEventListener("click", iniciarJogo);

criarEstrelas();

nave = {
    x: W / 2,
    y: H - 70,
    velocidade: 5
};

desenharCenario(0);
desenharNave();
