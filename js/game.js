// js/game.js
import { loadImage, checkCollision, playSound, setSoundEnabled } from './utils.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Obstacle } from './obstacle.js';
import { Level } from './level.js';
import { VoiceRecognitionSystem } from './voice-recognition.js';
import { Boss } from './boss.js';
import { Projectile } from './projectile.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1000;
        this.canvas.height = 500;

        this.groundHeight = 60;
        this.gameSpeed = 4; // Velocidad base inicial, ajustada por nivel
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.currentLevelNumber = 1; // Nivel actual, inicia en 1
        this.keys = {}; // Para el control de teclado

        this.player = null;
        this.obstacles = [];
        this.enemies = [];
        this.projectiles = []; // Incluye proyectiles del jugador y enemigos
        this.boss = null;
        this.level = null; // Instancia del nivel actual
        this.animationFrameId = null; // Para controlar el bucle requestAnimationFrame

        this.assets = {
            backgrounds: {},
            playerSprites: {},
            enemySprites: {},
            obstacleSprite: null,
            bossSprite: null,
            playerProjectile: null,
            enemyProjectile: null,
            ui: {}
        };

        this.unlockedLevels = JSON.parse(localStorage.getItem('unlockedLevels') || '[1]');

        this.soundEnabled = localStorage.getItem('soundEnabled') === 'false' ? false : true; // Cargar preferencia de sonido
        setSoundEnabled(this.soundEnabled); // Configurar la utilidad de sonido

        this.voiceSystem = null; // Se inicializa después de cargar los assets

        this.initEventListeners();
        this.loadAssets().then(() => {
            // Todos los assets cargados, ahora podemos pasar al menú principal
            this.showScreen('main-menu');
            this.voiceSystem = new VoiceRecognitionSystem(this); // Inicializar sistema de voz
        }).catch(error => {
            console.error("Fallo al cargar assets:", error);
            alert("Error al cargar los recursos del juego. Intenta recargar la página.");
        });
    }

    initEventListeners() {
        // Controles de teclado
        window.addEventListener('keydown', (e) => {
            // Solo procesar si el juego no está pausado, no ha terminado y el jugador existe y no está muerto
            if (!this.isPaused && !this.isGameOver && this.player && !this.player.isDead) {
                this.keys[e.code] = true;
                // Manejar acciones instantáneas al presionar
                if (e.code === 'ArrowUp' || e.code === 'Space') {
                    this.player.jump();
                } else if (e.code === 'KeyF') {
                    this.player.shoot();
                } else if (e.code === 'ArrowDown') {
                    this.player.duck(true);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            // Solo procesar si el juego no está pausado, no ha terminado y el jugador existe y no está muerto
            if (!this.isPaused && !this.isGameOver && this.player && !this.player.isDead) {
                this.keys[e.code] = false;
                // Si suelta la tecla de agacharse, el personaje se levanta
                if (e.code === 'ArrowDown') {
                    this.player.duck(false);
                }
            }
        });

        // Eventos de botones de UI
        document.getElementById('play-game-btn').addEventListener('click', () => this.startNewGame(this.unlockedLevels[0])); // Inicia en el primer nivel desbloqueado
        document.getElementById('levels-btn').addEventListener('click', () => this.showScreen('level-selection-menu'));
        document.getElementById('instructions-btn').addEventListener('click', () => this.showScreen('instructions-screen'));
        document.getElementById('credits-btn').addEventListener('click', () => this.showScreen('credits-screen'));

        document.getElementById('back-to-main-menu-from-levels').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('back-to-main-menu-from-instructions').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('back-to-main-menu-from-credits').addEventListener('click', () => this.showScreen('main-menu'));

        // Los botones de Game Over y Level Complete ahora usan showScreen() para consistencia
        document.getElementById('restart-btn').addEventListener('click', () => this.reset(true)); // Reinicia el nivel actual
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('back-to-menu-from-gameover').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('back-to-menu-from-level-complete').addEventListener('click', () => this.showScreen('main-menu'));


        document.querySelectorAll('.level-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const levelNum = parseInt(e.target.dataset.level);
                if (this.unlockedLevels.includes(levelNum)) {
                    this.startNewGame(levelNum);
                }
            });
        });

        // Toggle de sonido
        const soundCheckbox = document.getElementById('sound-checkbox');
        soundCheckbox.checked = this.soundEnabled;
        soundCheckbox.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            setSoundEnabled(this.soundEnabled);
            localStorage.setItem('soundEnabled', this.soundEnabled);
        });
    }

    async loadAssets() {
        // Mostrar pantalla de carga
        this.showScreen('loading-screen');

        const imagePromises = [
            loadImage('assets/images/background/kuelap.PNG').then(img => this.assets.backgrounds.kuelap = img),
            loadImage('assets/images/background/gocta.PNG').then(img => this.assets.backgrounds.gocta = img),
            loadImage('assets/images/background/karajia.PNG').then(img => this.assets.backgrounds.karajia = img),
            loadImage('assets/images/player/run-1.PNG').then(img => this.assets.playerSprites.run1 = img),
            loadImage('assets/images/player/run-2.PNG').then(img => this.assets.playerSprites.run2 = img),
            loadImage('assets/images/player/jump.PNG').then(img => this.assets.playerSprites.jump = img),
            loadImage('assets/images/player/duck.PNG').then(img => this.assets.playerSprites.duck = img),
            loadImage('assets/images/player/shoot.PNG').then(img => this.assets.playerSprites.shoot = img),
            loadImage('assets/images/player/dead.PNG').then(img => this.assets.playerSprites.dead = img),
            loadImage('assets/images/enemies/bird-2.PNG').then(img => this.assets.enemySprites.bird = img),
            loadImage('assets/images/obstacles/stone.PNG').then(img => this.assets.obstacleSprite = img),
            loadImage('assets/images/boss/boss.PNG').then(img => this.assets.bossSprite = img),
            loadImage('assets/images/ui/heart.PNG').then(img => this.assets.ui.heart = img),
            loadImage('assets/images/proyectil/proyectil_personaje.PNG').then(img => this.assets.playerProjectile = img),
            loadImage('assets/images/proyectil/proyectil_enemigo.PNG').then(img => this.assets.enemyProjectile = img)
        ];

        await Promise.all(imagePromises);
        console.log("Todos los assets cargados.");
    }

    showScreen(screenId) {
        // Oculta todas las pantallas .game-screen y .modal
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none'; // Asegura que estén ocultas
        });

        const screenToShow = document.getElementById(screenId);
        if (screenToShow) {
            screenToShow.style.display = 'flex'; // Muestra el elemento (puede ser 'block' o 'flex' según tu CSS)
            // Forzar reflow para asegurar que la transición de opacidad se aplique
            void screenToShow.offsetWidth;
            screenToShow.classList.add('active'); // Activa la transición de opacidad y pointer-events
        } else {
            console.warn(`Pantalla con ID '${screenId}' no encontrada.`);
        }

        // Actualizar estado de botones de nivel
        if (screenId === 'level-selection-menu') {
            this.updateLevelSelectionUI();
        }

        // Si estamos en una pantalla que no es de juego, pausar el juego
        if (screenId !== 'game-play-screen') {
            this.pauseGame();
            if (this.voiceSystem) {
                this.voiceSystem.stopListening();
            }
        } else {
            // Si volvemos a la pantalla de juego, reanudar
            this.resumeGame();
            // Asegúrate de que el sistema de voz no intente escuchar si el jugador ya está muerto
            if (this.voiceSystem && this.player && !this.player.isDead) {
                this.voiceSystem.startListening();
            }
        }
    }

    updateLevelSelectionUI() {
        document.querySelectorAll('.level-select-btn').forEach(btn => {
            const levelNum = parseInt(btn.dataset.level);
            if (this.unlockedLevels.includes(levelNum)) {
                btn.classList.remove('locked');
                btn.classList.add('unlocked');
                btn.disabled = false;
            } else {
                btn.classList.remove('unlocked');
                btn.classList.add('locked');
                btn.disabled = true;
            }
        });
    }

    startNewGame(levelNumber = 1) {
        this.currentLevelNumber = levelNumber;
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;

        // Crea una nueva instancia del jugador para resetearlo completamente
        this.player = new Player(this, this.assets.playerSprites);
        this.level = new Level(this, this.currentLevelNumber); // Crea una nueva instancia del nivel
        this.obstacles = [];
        this.enemies = [];
        this.projectiles = [];
        this.boss = null;

        // Oculta explícitamente los modales de Game Over y Level Complete antes de iniciar el juego
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('level-complete').style.display = 'none';

        // Establecer fondo del nivel
        const gamePlayScreen = document.getElementById('game-play-screen');
        if (gamePlayScreen) {
            gamePlayScreen.style.backgroundImage = `url(${this.level.config.background.src})`;
        } else {
            console.warn("Elemento #game-play-screen no encontrado.");
        }


        this.updateHealthUI(); // Inicializar UI de salud
        document.getElementById('level-indicator').textContent = `Nivel ${this.level.number}: ${this.level.name}`;
        document.getElementById('objective').textContent = `Objetivo: ${this.level.config.objective}`; // Actualizar objetivo

        this.showScreen('game-play-screen');

        // Asegúrate de que el game loop se inicie o reanude
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId); // Cancela cualquier bucle anterior
        }
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));

        if (this.voiceSystem) {
            this.voiceSystem.startListening(); // Asegúrate de iniciar la escucha de voz al empezar el juego
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (!this.isPaused && !this.isGameOver) {
            this.update(deltaTime || 0);
        }

        this.draw();

        // El bucle de juego debe continuar solo si NO es Game Over
        if (!this.isGameOver) {
            this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        } else {
            // Si es Game Over, el loop debe detenerse.
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    update(deltaTime) {
        this.gameSpeed = this.level.config.gameSpeed;
        if (this.player.isDead) {
            // Si el jugador está muerto, permite que se actualice una última vez (para mostrar la animación de muerte)
            // pero luego detiene el resto de la lógica del juego.
            this.player.update(deltaTime);
            return;
        }

        this.player.update(deltaTime);
        this.level.update(deltaTime);

        this.score += deltaTime * 0.01 * (this.gameSpeed / 4);
        document.getElementById('score-display').textContent = `Puntaje: ${Math.floor(this.score)}`;

        this.obstacles.forEach(obstacle => obstacle.update(deltaTime));
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.enemies = this.enemies.filter(enemy => enemy.x + enemy.width > 0);

        this.projectiles.forEach(projectile => projectile.update(deltaTime));
        this.projectiles = this.projectiles.filter(p =>
            p.x > -p.width && p.x < this.canvas.width + p.width &&
            p.y > -p.height && p.y < this.canvas.height + p.height
        );

        if (this.boss) {
            this.boss.update(deltaTime);
            // Si el jefe muere y el juego no ha terminado (para evitar llamadas duplicadas)
            if (this.boss.isDead && !this.isGameOver) {
                console.log("¡Jefe está muerto! Llamando a levelComplete().");
                this.levelComplete();
                // No hay 'return' aquí porque levelComplete() establecerá isGameOver a true,
                // lo que detendrá el bucle en la siguiente iteración.
            }
        }

        this.checkCollisions(); // Llama a una función unificada para todas las colisiones
        this.updateUI();
    }

    checkCollisions() {
        // Colisiones del jugador con obstáculos
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (checkCollision(this.player, obstacle)) {
                this.player.takeDamage();
                this.obstacles.splice(i, 1); // Eliminar obstáculo después de la colisión
                playSound('assets/sounds/player_hit.wav'); // Sonido de impacto al jugador
            }
        }

        // Colisiones del jugador con enemigos
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (checkCollision(this.player, enemy)) {
                this.player.takeDamage();
                this.enemies.splice(i, 1); // Eliminar enemigo después de la colisión
                playSound('assets/sounds/player_hit.wav'); // Sonido de impacto al jugador
            }
        }

        // Proyectiles del jugador vs. enemigos
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (!p.isEnemy) { // Si el proyectil es del jugador
                // Colisión con enemigos regulares
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (checkCollision(p, enemy)) {
                        this.enemies.splice(j, 1); // Eliminar enemigo
                        this.projectiles.splice(i, 1); // Eliminar proyectil
                        this.score += 50; // Puntos por eliminar enemigo
                        playSound('assets/sounds/hit.wav'); // Sonido de impacto
                        return; // Salir para evitar errores de índice después de eliminar
                    }
                }
                // Colisión con jefe
                if (this.boss && checkCollision(p, this.boss)) {
                    console.log("Colisión con jefe detectada.");
                    console.log("Vida actual del jefe ANTES del daño:", this.boss.health);
                    console.log("Daño del proyectil (p.damage):", p.damage);
                    this.boss.takeDamage(p.damage);
                    console.log("Vida actual del jefe DESPUÉS del daño:", this.boss.health);
                    this.projectiles.splice(i, 1); // Eliminar proyectil
                    this.score += 10; // Pequeños puntos por golpear al jefe
                    playSound('assets/sounds/hit.wav'); // Sonido de impacto
                    return; // Salir después de que un proyectil golpea al jefe
                }
            } else { // Si el proyectil es del enemigo
                if (this.player && !this.player.isDead && checkCollision(p, this.player)) {
                    this.player.takeDamage(p.damage);
                    this.projectiles.splice(i, 1); // Eliminar proyectil
                    playSound('assets/sounds/player_hit.wav'); // Sonido de impacto al jugador
                    return; // Salir después de que un proyectil enemigo golpea al jugador
                }
            }
        }

        // Colisión del jugador con el jefe (si el jefe es un objeto físico)
        // La lógica de daño al jugador si choca con el jefe debe estar aquí
        if (this.boss && this.player && !this.player.isDead && checkCollision(this.player, this.boss)) {
            // Podrías tener una colisión que haga daño continuo o empuje.
            // Para simplificar, si choca con el jefe, pierde vida.
            this.player.takeDamage(5); // Daño mayor por chocar directamente con el jefe
            // Podrías añadir un efecto de "empuje" al jugador si choca con el jefe.
            playSound('assets/sounds/player_hit.wav');
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar fondo del nivel
        if (this.level && this.level.config.background) {
            this.ctx.drawImage(this.level.config.background, 0, 0, this.canvas.width, this.canvas.height - this.groundHeight);
        } else {
            this.ctx.fillStyle = '#87CEEB'; // Fallback a cielo azul
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - this.groundHeight);
        }

        // Dibujar suelo
        this.ctx.fillStyle = '#8B4513'; // Color de tierra
        this.ctx.fillRect(0, this.canvas.height - this.groundHeight, this.canvas.width, this.groundHeight);

        // Dibujar todas las entidades
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));

        // Dibujar jugador, incluso si está muerto para mostrar el sprite de muerte
        if (this.player) {
            this.player.draw(this.ctx);
        }

        if (this.boss) {
            this.boss.draw(this.ctx);
        }

        // No llamar a updateUI desde draw. updateUI actualiza elementos DOM,
        // draw actualiza el canvas. update() ya llama a updateUI().
        // this.updateUI();
    }

    updateUI() {
        document.getElementById('score-display').textContent = `Puntaje: ${Math.floor(this.score)}`;
        this.updateHealthUI();
    }

    updateHealthUI() {
        const healthBarElement = document.getElementById('player-health');
        if (!healthBarElement) {
            console.error("Elemento 'player-health' no encontrado en el DOM.");
            return;
        }
        healthBarElement.innerHTML = ''; // Limpiar corazones existentes
        if (!this.player) return; // Si el jugador aún no se ha inicializado, no hacer nada

        for (let i = 0; i < this.player.maxHealth; i++) {
            const heartImg = document.createElement('img');
            // Asegúrate de que this.assets.ui.heart.src esté disponible
            if (this.assets.ui.heart && this.assets.ui.heart.src) {
                heartImg.src = this.assets.ui.heart.src; // Usar la imagen de corazón cargada
            } else {
                // Fallback o mensaje de error si la imagen no se cargó correctamente
                heartImg.src = 'data:image/svg+xml;base64,...'; // Un SVG base64 de un corazón o un placeholder
                console.warn("Imagen de corazón no cargada, usando fallback.");
            }
            heartImg.alt = 'Vida';
            if (i >= this.player.health) {
                heartImg.style.filter = 'grayscale(100%) brightness(50%)'; // Corazón gris si está perdido
            }
            healthBarElement.appendChild(heartImg);
        }
    }

    showBossWarning(objectiveText) {
        const warningDisplay = document.getElementById('boss-warning-display');
        if (!warningDisplay) {
            console.error("Elemento 'boss-warning-display' no encontrado en el DOM.");
            return;
        }
        warningDisplay.textContent = `¡GUARDIÁN APARECIÓ! Objetivo: ${objectiveText}`;
        warningDisplay.classList.add('active');
        playSound('assets/sounds/boss_music_intro.wav'); // Un sonido de advertencia para el jefe
        setTimeout(() => warningDisplay.classList.remove('active'), 2500);
    }

    pauseGame() {
        if (!this.isPaused && !this.isGameOver) {
            this.isPaused = true;
            // Detener el sistema de reconocimiento de voz si el juego está pausado
            if (this.voiceSystem) {
                this.voiceSystem.stopListening();
            }
            console.log("Juego Pausado");
            // Aquí podrías mostrar una pantalla de pausa si la tienes
        }
    }

    resumeGame() {
        if (this.isPaused && !this.isGameOver) {
            this.isPaused = false;
            // Reiniciar el sistema de reconocimiento de voz al reanudar
            // Solo si el jugador no está muerto
            if (this.voiceSystem && this.player && !this.player.isDead) {
                this.voiceSystem.startListening();
            }
            // Asegurarse de que el gameLoop se reanude correctamente
            // No iniciar un nuevo requestAnimationFrame si ya hay uno en curso.
            if (!this.animationFrameId) {
                this.lastTime = performance.now(); // Resetear el tiempo para evitar grandes deltaTimes
                this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
            }
            console.log("Juego Reanudado");
            // Aquí podrías ocultar la pantalla de pausa si la tienes
        }
    }

    nextLevel() {
        if (this.currentLevelNumber < 3) { // Asumiendo 3 niveles como máximo
            this.currentLevelNumber++;
            // No ocultar los modales directamente con style.display, showScreen() lo hará
            this.startNewGame(this.currentLevelNumber); // Cargar el siguiente nivel
        } else {
            // Fin del juego o ir a una pantalla de créditos finales
            alert("¡Has completado todos los niveles! ¡Felicidades!");
            this.showScreen('credits-screen'); // Podrías tener una pantalla de "Fin del Juego"
        }
    }

    reset(isRestart = true) {
        this.isGameOver = false;
        this.isPaused = false;
        if (isRestart) {
            this.score = 0;
            // Si es un reinicio completo (desde game over), el nivel se queda igual
            // Si viene de 'nextLevel', currentLevelNumber ya se actualizó
        }
        this.obstacles = [];
        this.enemies = [];
        this.projectiles = [];
        this.boss = null;

        // Siempre crear una nueva instancia del jugador para resetearlo completamente
        this.player = new Player(this, this.assets.playerSprites);

        // Oculta explícitamente los modales de Game Over y Level Complete
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('level-complete').style.display = 'none';

        // Recrear la instancia del nivel con el número actual
        this.level = new Level(this, this.currentLevelNumber);

        document.getElementById('level-indicator').textContent = `Nivel ${this.level.number}: ${this.level.name}`;
        document.getElementById('objective').textContent = `Objetivo: ${this.level.config.objective}`; // Actualizar objetivo

        const gamePlayScreen = document.getElementById('game-play-screen');
        if (gamePlayScreen) {
            gamePlayScreen.style.backgroundImage = `url(${this.level.config.background.src})`; // Actualizar fondo
        }


        // Asegurarse de que el game loop se reinicie si estaba detenido
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId); // Cancela cualquier bucle anterior
        }
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));

        this.updateHealthUI(); // Asegurarse de que la UI de salud esté correcta al reiniciar
        // Reiniciar escucha de voz solo si el jugador no está muerto
        if (this.voiceSystem && this.player && !this.player.isDead) {
            this.voiceSystem.startListening();
        }
    }

    gameOver() {
        if (this.isGameOver) return; // Evitar llamadas duplicadas

        this.isGameOver = true;
        this.pauseGame(); // Pausar el juego y detener la escucha de voz
        playSound('assets/sounds/gameover.wav'); // Asegúrate de tener este sonido

        document.getElementById('final-score').textContent = Math.floor(this.score);
        this.showScreen('game-over'); // Usa showScreen para mostrar el modal y ocultar otras pantallas
    }

    levelComplete() {
        if (this.isGameOver) return; // Evitar llamadas duplicadas

        this.isPaused = true;
        this.isGameOver = true; // Establece esto a true para que el gameLoop se detenga correctamente

        if (this.voiceSystem) {
            this.voiceSystem.stopListening();
        }

        playSound('assets/sounds/level_complete.wav');

        const nextLevelNum = this.currentLevelNumber + 1;
        // Solo desbloquear si el nivel no está ya desbloqueado y no es el último nivel (o si hay más niveles para desbloquear)
        if (nextLevelNum <= 3 && !this.unlockedLevels.includes(nextLevelNum)) {
            this.unlockedLevels.push(nextLevelNum);
            localStorage.setItem('unlockedLevels', JSON.stringify(this.unlockedLevels));
            console.log(`Nivel ${nextLevelNum} desbloqueado!`);
        }

        document.getElementById('final-score-level-complete').textContent = Math.floor(this.score);
        document.getElementById('completed-level-name').textContent = this.level.name;

        
        this.showScreen('level-complete');

        const nextLevelButton = document.getElementById('next-level-btn');
        if (this.currentLevelNumber < 3) {
            nextLevelButton.style.display = 'block';
           
            document.getElementById('final-message-level-complete').textContent = "¡Has derrotado al Guardián!";
        } else {
            nextLevelButton.style.display = 'none'; 
            document.getElementById('final-message-level-complete').textContent = "¡Has completado todos los niveles!";
        }
    }
}

