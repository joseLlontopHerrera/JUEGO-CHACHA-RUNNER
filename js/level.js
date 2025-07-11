// js/level.js
import { Obstacle } from './obstacle.js';
import { Boss } from './boss.js';
import { Enemy } from './enemy.js';
// La importación de playSound ya no es necesaria aquí si Game.js es el único que reproduce sonidos de victoria
// import { playSound } from './utils.js';

export class Level {
    constructor(game, number) {
        this.game = game;
        this.number = number;
        this.name = this.getLevelName();
        // this.completed = false; // Eliminado: la lógica de completado se maneja en Game.js
        // this.bossDefeated = false; // Eliminado: la lógica de jefe derrotado se maneja en Game.js

        this.levelDuration = 0;
        this.spawnTimer = 0;
        this.bossSpawned = false;

        this.config = this.getLevelConfig(number);
        this.game.gameSpeed = this.config.gameSpeed; // Asegúrate de que la velocidad del juego se actualice aquí

        console.log(`Cargando Nivel ${this.number}: ${this.name} con velocidad ${this.game.gameSpeed}`);
    }

    getLevelName() {
        const names = {
            1: "Fortaleza de Kuélap",
            2: "Catarata de Gocta",
            3: "Sarcófagos de Karajía"
        };
        return names[this.number] || `Nivel ${this.number}`;
    }

    getLevelConfig(levelNumber) {
        switch (levelNumber) {
            case 1:
                return {
                    gameSpeed: 2,
                    durationUntilBoss: 30000,
                    spawnIntervalMin: 1500,
                    spawnIntervalMax: 3000,
                    obstacleSpawnChance: 0.7,
                    enemySpawnChance: 0.3,
                    background: this.game.assets.backgrounds.kuelap, // Asegúrate de que los assets estén cargados
                    objective: "Derrota al Guardián de Kuélap",
                    hasBoss: true
                };
            case 2:
                return {
                    gameSpeed: 4,
                    durationUntilBoss: 45000,
                    spawnIntervalMin: 1000,
                    spawnIntervalMax: 2000,
                    obstacleSpawnChance: 0.6,
                    enemySpawnChance: 0.4,
                    background: this.game.assets.backgrounds.gocta,
                    objective: "Derrota al Guardián de Gocta",
                    hasBoss: true
                };
            case 3:
                return {
                    gameSpeed: 6,
                    durationUntilBoss: 60000,
                    spawnIntervalMin: 800,
                    spawnIntervalMax: 1500,
                    obstacleSpawnChance: 0.5,
                    enemySpawnChance: 0.5,
                    background: this.game.assets.backgrounds.karajia,
                    objective: "Derrota al Guardián de Karajía",
                    hasBoss: true
                };
            default:
                // Fallback para niveles no definidos o errores
                return {
                    gameSpeed: 5,
                    durationUntilBoss: 30000,
                    spawnIntervalMin: 1500,
                    spawnIntervalMax: 3000,
                    obstacleSpawnChance: 0.7,
                    enemySpawnChance: 0.3,
                    background: this.game.assets.backgrounds.kuelap, // Fallback a Kuélap
                    objective: "Derrota al Guardián",
                    hasBoss: true
                };
        }
    }

    update(deltaTime) {
        // La lógica de completado se gestiona en Game.js (cuando el jefe muere)
        if (this.game.isGameOver || this.game.isPaused) return;

        this.levelDuration += deltaTime;
        this.spawnTimer += deltaTime;

        // Lógica de spawn regular de obstáculos y enemigos
        // Solo spawnea si no hay jefe (o no se ha cumplido el tiempo para que aparezca)
        if (!this.bossSpawned && this.levelDuration < this.config.durationUntilBoss) {
            if (this.spawnTimer >= Math.random() * (this.config.spawnIntervalMax - this.config.spawnIntervalMin) + this.config.spawnIntervalMin) {
                this.spawnTimer = 0;
                if (Math.random() < this.config.obstacleSpawnChance) {
                    this.game.obstacles.push(new Obstacle(this.game, 'stone'));
                } else {
                    this.game.enemies.push(new Enemy(this.game, 'bird'));
                }
            }
        }



        if (this.config.hasBoss && !this.bossSpawned && this.levelDuration >= this.config.durationUntilBoss) {
            this.spawnBoss();
            this.bossSpawned = true;
            console.log("Jefe generado en Level.update");
        }
    }

    spawnBoss() {
        if (!this.game.boss) { 
            this.game.boss = new Boss(this.game);
            this.game.showBossWarning(this.config.objective);
        }
    }
}