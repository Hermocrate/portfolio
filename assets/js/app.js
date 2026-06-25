const windows = document.querySelectorAll(".window");
const clickableOpeners = document.querySelectorAll("[data-window]");
const startButton = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");
const clock = document.getElementById("clock");
const browserAddress = document.getElementById("browser-address");
let highestZIndex = 10;

function openWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (!windowElement) return;
    windowElement.classList.add("active");
    windowElement.style.zIndex = ++highestZIndex;
    if (startMenu) startMenu.classList.add("hidden");
}

clickableOpeners.forEach((button) => {
    button.addEventListener("dblclick", () => openWindow(button.dataset.window));
    button.addEventListener("click", () => {
        if (button.closest("#start-menu") || button.classList.contains("folder-item")) {
            openWindow(button.dataset.window);
        }
    });
});

windows.forEach((windowElement) => {
    const header = windowElement.querySelector(".window-header");
    const closeButton = windowElement.querySelector(".close-btn");
    if (closeButton) closeButton.addEventListener("click", () => windowElement.classList.remove("active"));
    windowElement.addEventListener("mousedown", () => windowElement.style.zIndex = ++highestZIndex);
    makeWindowDraggable(windowElement, header);
});

if (startButton) startButton.addEventListener("click", () => startMenu.classList.toggle("hidden"));

function makeWindowDraggable(windowElement, header) {
    if (!header) return;
    let offsetX = 0, offsetY = 0, isDragging = false;
    header.addEventListener("mousedown", (event) => {
        isDragging = true;
        offsetX = event.clientX - windowElement.offsetLeft;
        offsetY = event.clientY - windowElement.offsetTop;
    });
    document.addEventListener("mousemove", (event) => {
        if (!isDragging) return;
        windowElement.style.left = `${event.clientX - offsetX}px`;
        windowElement.style.top = `${event.clientY - offsetY}px`;
    });
    document.addEventListener("mouseup", () => isDragging = false);
}

function updateClock() {
    const now = new Date();
    if (clock) clock.textContent = now.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
}
updateClock();
setInterval(updateClock, 1000);

// Internet Explorer tabs
const browserTabs = document.querySelectorAll(".browser-tab");
const browserPages = document.querySelectorAll(".browser-page");
const tabAddresses = {
    "tab-1": "https://github.com/Hermocrate42",
    "tab-3": "https://portfolio.local/faq-recruteur"
};

browserTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        browserTabs.forEach((item) => item.classList.remove("active"));
        browserPages.forEach((page) => page.classList.remove("active"));
        tab.classList.add("active");
        const page = document.getElementById(tab.dataset.tab);
        if (page) page.classList.add("active");
        if (browserAddress) browserAddress.value = tabAddresses[tab.dataset.tab] || "about:blank";
    });
});

// Mini-jeu rétro : Debug Panic 98
const canvas = document.getElementById("flash-game-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const scoreElement = document.getElementById("game-score");
const livesElement = document.getElementById("game-lives");
const restartGameButton = document.getElementById("restart-game");
let gameLoop = null;
let game = null;
const keys = new Set();

document.addEventListener("keydown", (event) => {
    keys.add(event.code);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
});
document.addEventListener("keyup", (event) => keys.delete(event.code));
if (restartGameButton) restartGameButton.addEventListener("click", startGame);

function startGame() {
    if (!ctx) return;
    stopGame();
    game = {
        player: { x: 85, y: 165, r: 13, trail: [] },
        bugs: [],
        code: [],
        particles: [],
        score: 0,
        lives: 3,
        frame: 0,
        speed: 2.2,
        over: false
    };
    gameLoop = setInterval(updateGame, 1000 / 60);
}
function stopGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = null;
}
function updateGame() {
    if (!game || !ctx) return;
    game.frame++;
    const p = game.player;
    if (keys.has("ArrowUp") || keys.has("KeyZ")) p.y -= 4.6;
    if (keys.has("ArrowDown") || keys.has("KeyS")) p.y += 4.6;
    if (keys.has("ArrowLeft") || keys.has("KeyQ")) p.x -= 4.2;
    if (keys.has("ArrowRight") || keys.has("KeyD")) p.x += 4.2;
    p.x = Math.max(28, Math.min(canvas.width - 28, p.x));
    p.y = Math.max(28, Math.min(canvas.height - 28, p.y));
    p.trail.unshift({ x: p.x, y: p.y });
    p.trail = p.trail.slice(0, 14);
    game.speed += 0.002;

    if (game.frame % 38 === 0) game.bugs.push({ x: canvas.width + 30, y: 30 + Math.random() * (canvas.height - 60), r: 13 + Math.random() * 8, spin: 0, vx: game.speed + Math.random() * 1.4 });
    if (game.frame % 70 === 0) game.code.push({ x: canvas.width + 25, y: 35 + Math.random() * (canvas.height - 70), w: 48, h: 22, text: ["fix();", "git", "SQL", "CSS", "Java"][Math.floor(Math.random() * 5)] });

    game.bugs.forEach((bug) => { bug.x -= bug.vx; bug.spin += 0.12; bug.y += Math.sin((game.frame + bug.x) / 24) * 0.7; });
    game.code.forEach((item) => item.x -= game.speed + 1.1);
    game.particles.forEach((particle) => { particle.x += particle.vx; particle.y += particle.vy; particle.life--; });

    for (const bug of game.bugs) {
        if (!bug.hit && distance(p, bug) < p.r + bug.r - 2) {
            bug.hit = true;
            game.lives--;
            burst(p.x, p.y, "red");
            if (game.lives <= 0) game.over = true;
        }
    }
    for (const item of game.code) {
        if (!item.hit && p.x > item.x - item.w / 2 && p.x < item.x + item.w / 2 && p.y > item.y - item.h / 2 && p.y < item.y + item.h / 2) {
            item.hit = true;
            game.score += 120;
            burst(item.x, item.y, "green");
        }
    }
    game.score += 1;
    game.bugs = game.bugs.filter((v) => v.x > -60 && !v.hit);
    game.code = game.code.filter((c) => c.x > -70 && !c.hit);
    game.particles = game.particles.filter((particle) => particle.life > 0);
    drawGame();
    if (scoreElement) scoreElement.textContent = game.score;
    if (livesElement) livesElement.textContent = game.lives;
    if (game.over) { drawGameOver(); stopGame(); }
}
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function burst(x, y, type) {
    for (let i = 0; i < 14; i++) {
        game.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 24, type });
    }
}
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#111827");
    gradient.addColorStop(0.55, "#123b63");
    gradient.addColorStop(1, "#0f766e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "12px Consolas";
    for (let x = 0; x < canvas.width; x += 44) {
        ctx.fillStyle = "rgba(190,240,255,.11)";
        ctx.fillText("0101", x, 20 + ((game.frame + x) % 280));
    }
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    for (let y = 35; y < canvas.height; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y + Math.sin((game.frame + y) / 35) * 9);
        ctx.stroke();
    }

    game.player.trail.forEach((point, index) => {
        ctx.fillStyle = `rgba(56,189,248,${0.22 - index * 0.012})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, game.player.r + index * 0.7, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(game.player.x + 16, game.player.y);
    ctx.lineTo(game.player.x - 10, game.player.y - 12);
    ctx.lineTo(game.player.x - 5, game.player.y);
    ctx.lineTo(game.player.x - 10, game.player.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(game.player.x - 3, game.player.y - 3, 6, 6);

    game.code.forEach((item) => {
        ctx.fillStyle = "rgba(34,197,94,.92)";
        ctx.fillRect(item.x - item.w / 2, item.y - item.h / 2, item.w, item.h);
        ctx.strokeStyle = "#dcfce7";
        ctx.strokeRect(item.x - item.w / 2, item.y - item.h / 2, item.w, item.h);
        ctx.fillStyle = "#052e16";
        ctx.font = "12px Consolas";
        ctx.fillText(item.text, item.x - item.w / 2 + 5, item.y + 4);
    });

    game.bugs.forEach((bug) => {
        ctx.save();
        ctx.translate(bug.x, bug.y);
        ctx.rotate(bug.spin);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(0, 0, bug.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fee2e2";
        ctx.fillRect(-5, -4, 3, 3);
        ctx.fillRect(3, -4, 3, 3);
        ctx.strokeStyle = "#fecaca";
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(bug.r - 2, 0);
            ctx.lineTo(bug.r + 9, 0);
            ctx.stroke();
        }
        ctx.restore();
    });

    game.particles.forEach((particle) => {
        ctx.fillStyle = particle.type === "green" ? "rgba(134,239,172,.8)" : "rgba(252,165,165,.8)";
        ctx.fillRect(particle.x, particle.y, 3, 3);
    });
}
function drawGameOver() {
    ctx.fillStyle = "rgba(0,0,0,.74)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Segoe UI";
    ctx.fillText("DEBUG FAILED", 205, 150);
    ctx.font = "16px Segoe UI";
    ctx.fillText("Clique sur Relancer le debug pour recommencer.", 155, 180);
}

// FAQ interactive
const faqAnswers = [
    { title: "Qui es-tu ?", text: "Je suis Hermocrate, développeur junior. Je construis des projets concrets en web, Java, C#, SQL et Flutter, avec une attention particulière à l’interface et à l’organisation du code." },
    { title: "Quels types de projets fais-tu ?", text: "Je travaille sur des applications web, des interfaces desktop, des projets SQL et des prototypes interactifs. J’aime les projets qui montrent à la fois la logique métier et l’expérience utilisateur." },
    { title: "Quelles technologies utilises-tu ?", text: "HTML, CSS, JavaScript, PHP, Java/JavaFX, C#/WPF, SQL, PostgreSQL, Oracle, Flutter/Dart, Git et GitHub." },
    { title: "Quel est ton projet le plus original ?", text: "Yo-Ji-Hu est un projet marquant : un jeu de cartes desktop avec terrain, cartes, phases de jeu et logique orientée objet en JavaFX." },
    { title: "Pourquoi ce portfolio Windows 7 ?", text: "Parce qu’un portfolio doit être mémorable. L’idée est de transformer une simple page personnelle en environnement interactif que le recruteur peut explorer." },
    { title: "Es-tu à l’aise avec GitHub ?", text: "Oui. J’utilise GitHub pour publier mes projets, rédiger des README, organiser mes dépôts et montrer l’évolution de mon travail." },
    { title: "Comment travailles-tu sur un bug ?", text: "Je reproduis le problème, je lis l’erreur, j’isole la cause, je corrige progressivement puis je reteste. Je préfère avancer étape par étape plutôt que tout modifier d’un coup." },
    { title: "Que montre Yo-Ji-Hu ?", text: "Il montre ma capacité à organiser un projet Java, créer une interface JavaFX, gérer des classes métier et construire une logique de jeu structurée." },
    { title: "Que montre Calories Tracker Pro ?", text: "Il montre mes bases en PHP, formulaires, pages web, gestion de données et structuration d’une application utile autour d’un besoin concret." },
    { title: "Que montre Audit SQL ?", text: "Il montre mon travail sur les requêtes SQL, l’optimisation, les indexes, les vues matérialisées et la vérification de données d’audit." },
    { title: "As-tu des bases réseau ?", text: "Oui, j’ai des notions sur le réseau local, l’adressage IP, les ports, le modèle client/serveur et la configuration d’environnements de développement." },
    { title: "Ton objectif actuel ?", text: "Continuer à progresser, renforcer mes projets, améliorer mes bonnes pratiques et trouver une opportunité où je peux apprendre tout en contribuant concrètement." },
    { title: "Comment te contacter ?", text: "La fenêtre Contact du bureau contient un formulaire FormSubmit. Tu peux aussi passer par GitHub depuis le premier onglet d’Internet Explorer." }
];
const faqButtons = document.querySelectorAll("[data-faq]");
const faqAnswer = document.getElementById("faq-answer");
faqButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const item = faqAnswers[Number(button.dataset.faq)];
        if (!item || !faqAnswer) return;
        faqButtons.forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        faqAnswer.innerHTML = `<h3>${item.title}</h3><p>${item.text}</p>`;
    });
});

document.querySelectorAll(".screenshot-slot img, .github-profile-photo").forEach((img) => { img.addEventListener("error", () => { img.style.display = "none"; }); });

// Agrandissement des captures
const imageModal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const closeImageModal = document.getElementById("close-image-modal");
document.querySelectorAll(".screenshot-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
        const imagePath = slot.dataset.full;
        if (!imagePath || !imageModal || !modalImage) return;
        modalImage.src = imagePath;
        imageModal.classList.remove("hidden");
        imageModal.setAttribute("aria-hidden", "false");
    });
});
function closeModalImage() {
    if (!imageModal) return;
    imageModal.classList.add("hidden");
    imageModal.setAttribute("aria-hidden", "true");
    if (modalImage) modalImage.src = "";
}
if (closeImageModal) closeImageModal.addEventListener("click", closeModalImage);
if (imageModal) imageModal.addEventListener("click", (event) => { if (event.target === imageModal) closeModalImage(); });

// Easter egg : pluie de pixels façon Matrix
const dangerIcon = document.getElementById("danger-icon");
const eggOverlay = document.getElementById("easter-egg-overlay");
const closeEgg = document.getElementById("close-egg");
const matrixCanvas = document.getElementById("matrix-canvas");
const matrixCtx = matrixCanvas ? matrixCanvas.getContext("2d") : null;
let matrixInterval = null;
let matrixDrops = [];
let matrixFontSize = 16;

function startMatrixRain() {
    if (!matrixCanvas || !matrixCtx) return;
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    matrixFontSize = Math.max(14, Math.floor(window.innerWidth / 110));
    const columns = Math.floor(matrixCanvas.width / matrixFontSize);
    matrixDrops = Array.from({ length: columns }, () => Math.random() * -80);
    const chars = "01{}[]<>/#$_HERMOCRATE_PORTFOLIO_2026_DEV";
    stopMatrixRain();
    matrixInterval = setInterval(() => {
        matrixCtx.fillStyle = "rgba(0, 0, 0, 0.07)";
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCtx.font = `${matrixFontSize}px Consolas, monospace`;
        matrixCtx.shadowBlur = 8;
        matrixCtx.shadowColor = "#00ff66";
        for (let i = 0; i < matrixDrops.length; i++) {
            const x = i * matrixFontSize;
            const y = matrixDrops[i] * matrixFontSize;
            const char = chars[Math.floor(Math.random() * chars.length)];
            matrixCtx.fillStyle = Math.random() > 0.975 ? "#ffffff" : (Math.random() > 0.78 ? "#8cffb7" : "#00ff66");
            matrixCtx.fillText(char, x, y);
            if (Math.random() > 0.992) {
                matrixCtx.fillStyle = "rgba(0,255,102,.18)";
                matrixCtx.fillRect(x - 2, y - matrixFontSize * 10, matrixFontSize + 4, matrixFontSize * 10);
            }
            if (y > matrixCanvas.height + Math.random() * 1000) matrixDrops[i] = 0;
            matrixDrops[i] += 0.55 + Math.random() * 0.95;
        }
        matrixCtx.shadowBlur = 0;
    }, 33);
}
function stopMatrixRain() {
    if (matrixInterval) clearInterval(matrixInterval);
    matrixInterval = null;
}
if (dangerIcon) dangerIcon.addEventListener("click", () => {
    eggOverlay.classList.remove("hidden");
    startMatrixRain();
});
if (closeEgg) closeEgg.addEventListener("click", () => {
    eggOverlay.classList.add("hidden");
    stopMatrixRain();
});
window.addEventListener("resize", () => {
    if (!eggOverlay || eggOverlay.classList.contains("hidden")) return;
    startMatrixRain();
});


// Jeu sur le bureau : Windows Defender 2010
const defenderIcon = document.getElementById("defender-icon");
const defenderHud = document.getElementById("defender-hud");
const defenderScore = document.getElementById("defender-score");
const defenderInfections = document.getElementById("defender-infections");
const stopDefenderButton = document.getElementById("stop-defender");
const desktop = document.getElementById("desktop");
let defenderTimer = null;
let defenderSpawnTimer = null;
let defenderRunning = false;
let defenderState = { score: 0, infections: 0, viruses: [] };
const defenderVirusNames = ["Trojan.exe", "Worm.vbs", "Malware.dll", "Spyware.tmp", "Ransom.zip", "Bug.sys", "404.exe"];

function startDefenderGame() {
    if (!desktop) return;
    stopDefenderGame(false);
    defenderRunning = true;
    defenderState = { score: 0, infections: 0, viruses: [] };
    document.querySelectorAll(".desktop-icon").forEach((icon) => icon.classList.remove("infected"));
    if (defenderHud) defenderHud.classList.remove("hidden");
    updateDefenderHud();
    defenderSpawnTimer = setInterval(spawnDesktopVirus, 850);
    defenderTimer = setInterval(updateDesktopViruses, 1000 / 45);
    for (let i = 0; i < 4; i++) setTimeout(spawnDesktopVirus, i * 220);
}

function stopDefenderGame(showSummary = true) {
    defenderRunning = false;
    if (defenderTimer) clearInterval(defenderTimer);
    if (defenderSpawnTimer) clearInterval(defenderSpawnTimer);
    defenderTimer = null;
    defenderSpawnTimer = null;
    document.querySelectorAll(".desktop-virus, .defender-pop").forEach((item) => item.remove());
    defenderState.viruses = [];
    if (defenderHud && !showSummary) defenderHud.classList.add("hidden");
}

function spawnDesktopVirus() {
    if (!defenderRunning || !desktop) return;
    const protectedIcons = Array.from(document.querySelectorAll(".desktop-icon")).filter((icon) => icon.offsetParent !== null);
    if (!protectedIcons.length) return;
    const target = protectedIcons[Math.floor(Math.random() * protectedIcons.length)];
    const targetRect = target.getBoundingClientRect();
    const desktopRect = desktop.getBoundingClientRect();
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * window.innerWidth; y = -40; }
    if (side === 1) { x = window.innerWidth + 40; y = Math.random() * window.innerHeight; }
    if (side === 2) { x = Math.random() * window.innerWidth; y = window.innerHeight + 40; }
    if (side === 3) { x = -40; y = Math.random() * window.innerHeight; }
    const element = document.createElement("button");
    element.className = "desktop-virus";
    const name = defenderVirusNames[Math.floor(Math.random() * defenderVirusNames.length)];
    element.innerHTML = `<span>🦠</span><small>${name}</small>`;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    desktop.appendChild(element);
    const speed = 0.9 + Math.random() * 1.2 + Math.min(defenderState.score / 900, 1.5);
    const virus = {
        element,
        x,
        y,
        target,
        targetX: targetRect.left - desktopRect.left + targetRect.width / 2,
        targetY: targetRect.top - desktopRect.top + targetRect.height / 2,
        speed,
        wobble: Math.random() * Math.PI * 2
    };
    element.addEventListener("click", (event) => {
        event.stopPropagation();
        destroyDesktopVirus(virus, true);
    });
    defenderState.viruses.push(virus);
}

function updateDesktopViruses() {
    if (!defenderRunning) return;
    for (const virus of [...defenderState.viruses]) {
        const dx = virus.targetX - virus.x;
        const dy = virus.targetY - virus.y;
        const dist = Math.hypot(dx, dy) || 1;
        virus.wobble += 0.12;
        virus.x += (dx / dist) * virus.speed + Math.sin(virus.wobble) * 0.5;
        virus.y += (dy / dist) * virus.speed + Math.cos(virus.wobble) * 0.5;
        virus.element.style.left = `${virus.x}px`;
        virus.element.style.top = `${virus.y}px`;
        if (dist < 28) infectDesktopIcon(virus);
    }
}

function destroyDesktopVirus(virus, clicked) {
    defenderState.viruses = defenderState.viruses.filter((item) => item !== virus);
    const pop = document.createElement("div");
    pop.className = "defender-pop";
    pop.textContent = clicked ? "+10" : "Infection";
    pop.style.left = `${virus.x}px`;
    pop.style.top = `${virus.y}px`;
    desktop.appendChild(pop);
    setTimeout(() => pop.remove(), 650);
    virus.element.remove();
    if (clicked) defenderState.score += 10;
    updateDefenderHud();
}

function infectDesktopIcon(virus) {
    virus.target.classList.add("infected");
    defenderState.infections++;
    destroyDesktopVirus(virus, false);
    updateDefenderHud();
    if (defenderState.infections >= 3) endDefenderGame(false);
}

function endDefenderGame(victory) {
    stopDefenderGame(true);
    if (!defenderHud) return;
    defenderHud.classList.remove("hidden");
    defenderHud.classList.add(victory ? "victory" : "failed");
    const title = defenderHud.querySelector("strong");
    if (title) title.textContent = victory ? "Analyse terminée" : "Alerte système";
}

function updateDefenderHud() {
    if (defenderScore) defenderScore.textContent = defenderState.score;
    if (defenderInfections) defenderInfections.textContent = defenderState.infections;
}

if (defenderIcon) {
    defenderIcon.addEventListener("dblclick", startDefenderGame);
    defenderIcon.addEventListener("click", () => {
        defenderIcon.classList.add("selected");
        setTimeout(() => defenderIcon.classList.remove("selected"), 180);
    });
}
if (stopDefenderButton) stopDefenderButton.addEventListener("click", () => stopDefenderGame(false));
