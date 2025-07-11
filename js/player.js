// player.js

import { checkCollision, playSound } from './utils.js';
import { Projectile } from './projectile.js';

export class Player {
    constructor(game, sprites) {
        this.game = game;
        this.sprites = sprites;
        this.initialWidth = 60; 
        this.initialHeight = 80; 
        this.duckHeight = 50; 
        this.x = 100;
        this.width = this.initialWidth;
        this.height = this.initialHeight; 
        this.y = this.game.canvas.height - this.game.groundHeight - this.height;

        this.velocityY = -5; 
        this.gravity = 0.4; 
        this.jumpPower = -14;

        this.isJumping = false;
        this.isDucking = false;
        this.isShooting = false;
        this.isDead = false;
        
        this.maxHealth = 3;
        this.health = this.maxHealth;
        this.invulnerable = false;
        this.visible = true; 

        // Animación de correr
        this.currentRunFrame = 0;
        this.runAnimationTimer = 0;
        this.frameInterval = 100; 

        // Cooldown de disparo
        this.shootCooldown = 300; 
        this.lastShootTime = 0;
    }

    update(deltaTime) {
        if (this.isDead) {
            return; 
        }

        // --- Lógica de Salto y Gravedad ---
        if (this.isJumping) {
            this.y += this.velocityY;
            this.velocityY += this.gravity;
            const groundLevel = this.game.canvas.height - this.game.groundHeight - this.height;
            
     
            if (this.y >= groundLevel) {
                this.y = groundLevel; 
                this.isJumping = false; 
                this.velocityY = 0; 
               
                if (!this.isDucking) {
                    this.height = this.initialHeight; 
                }
            }
        }
        
        // --- Lógica de Agacharse (Altura y Posición Y cuando NO está saltando) ---
    
        if (!this.isJumping) {
            const targetHeight = this.isDucking ? this.duckHeight : this.initialHeight;
            
            
            if (this.height !== targetHeight) {
                this.height = targetHeight;
               
                this.y = this.game.canvas.height - this.game.groundHeight - this.height;
            }
        }

        // --- Lógica de Animación de Correr ---
      
        if (!this.isJumping && !this.isDucking && !this.isShooting) {
            this.runAnimationTimer += deltaTime;
            if (this.runAnimationTimer > this.frameInterval) {
                this.runAnimationTimer = 0;
                this.currentRunFrame = (this.currentRunFrame + 1) % 2; 
            }
        }

        // --- Lógica del Cooldown de Disparo ---
        if (this.isShooting) {
            if ((performance.now() - this.lastShootTime) > 100) { 
                this.isShooting = false; 
            }
        }
        
     
        this.checkCollisions();
    }

    draw(ctx) {
        if (!this.visible && !this.isDead) return; 
        
        let currentSprite;
        if (this.isDead) { 
            currentSprite = this.sprites.dead;
        } else if (this.isJumping) {
            currentSprite = this.sprites.jump;
        } else if (this.isDucking) {
            currentSprite = this.sprites.duck;
        } else if (this.isShooting) {
            currentSprite = this.sprites.shoot;
        } else {
            currentSprite = this.currentRunFrame === 0 ? this.sprites.run1 : this.sprites.run2;
        }
        
        ctx.drawImage(currentSprite, this.x, this.y, this.width, this.height);
    }
    
    // --- Métodos de Acción del Jugador ---

    jump() {
        if (!this.isJumping && !this.isDucking && !this.isDead) {
            this.isJumping = true;
            this.velocityY = this.jumpPower; 
            playSound('assets/sounds/jump.wav'); 
        }
    }
    
    duck(enable) {
        if (!this.isJumping && !this.isDead) {
            this.isDucking = enable;
        }
    }
    
    shoot() {
        if ((performance.now() - this.lastShootTime) > this.shootCooldown && !this.isDead) {
            this.isShooting = true; 
            this.lastShootTime = performance.now(); 
            playSound('assets/sounds/shoot.wav'); 
            
            const projectileY = this.y + (this.height / 2) - 4; 
            
            this.game.projectiles.push(new Projectile(
                this.game,
                this.x + this.width, 
                projectileY,
                12,
                0,
                1,
                false,
                this.game.assets.playerProjectile
            ));
            console.log("Proyectil del jugador creado con daño:",1)
        }
    }
    
    takeDamage(amount = 1) {
        if (this.invulnerable || this.isDead) return; 

        this.health -= amount; 
        playSound('assets/sounds/hit.wav'); 
        this.game.updateHealthUI(); 

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true; 
            this.game.gameOver(); 
            return; 
        }

        this.invulnerable = true;
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            this.visible = !this.visible; 
            blinkCount++;
            if (blinkCount >= 10) { 
                clearInterval(blinkInterval); 
                this.visible = true; 
                this.invulnerable = false; 
            }
        }, 100);


    }
    
    checkCollisions() {
        if (this.isDead) return; 


        for (let i = this.game.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.game.obstacles[i];
            if (checkCollision(this, obstacle)) {
                this.takeDamage();
                return; 
            }
        }


        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            if (checkCollision(this, enemy)) {
                this.takeDamage();
                this.game.enemies.splice(i, 1); 
                return;
            }
        }

    
        for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.game.projectiles[i];
            if (projectile.isEnemy && checkCollision(this, projectile)) {
                this.takeDamage(projectile.damage); 
                this.game.projectiles.splice(i, 1); 
                return;
            }
        }

        if (this.game.boss && checkCollision(this, this.game.boss)) {
            this.takeDamage();
        }
    }
    
    reset() {
        this.health = this.maxHealth;
        this.width = this.initialWidth;
        this.height = this.initialHeight; 
        this.y = this.game.canvas.height - this.game.groundHeight - this.height; 
        this.velocityY = 0; 
        this.isJumping = false;
        this.isDucking = false;
        this.isShooting = false;
        this.isDead = false; 
        this.invulnerable = false;
        this.visible = true;
        this.currentRunFrame = 0;
        this.runAnimationTimer = 0;
        this.lastShootTime = 0;
    }
}