// js/boss.js

import { Projectile } from "./projectile.js";
import { playSound } from './utils.js'; 

export class Boss {
    constructor(game) {
        this.game = game;
        this.width = 120;
        this.height = 120;
        this.x = this.game.canvas.width + 100; 
        this.y = 100;
        this.speedX = -0.8; 
        this.speedY = 0.5; 

        this.maxHealth = 20;
        this.health = this.maxHealth;
        this.image = game.assets.bossSprite;

        this.shotCooldown = 2500; 
        this.lastShot = 0;
        this.isEntering = true; 

       
        this.isDead = false; 
    }

    update(deltaTime) {
        
        if (this.isDead) {
            return;
        }

        if (this.isEntering) {
            this.x += this.speedX * (deltaTime / 16);
            if (this.x <= this.game.canvas.width - this.width - 50) {
                this.isEntering = false;
                this.speedX = 0; 
            }
        } else {
           
            if (this.y <= 80 || this.y >= 200) {
                this.speedY *= -1;
            }
            this.y += this.speedY * (deltaTime / 16);
        }

       
        this.lastShot += deltaTime;
        if (this.lastShot >= this.shotCooldown) {
            this.shoot();
            this.lastShot = 0;
        }
    }

    shoot() {
        
        this.game.projectiles.push(new Projectile(
            this.game,
            this.x,
            this.y + this.height / 2,
            -8,
            0,
            1,
            true, 
            this.game.assets.enemyProjectile
        ));
        
        playSound('assets/sounds/boss_shoot.wav'); 
    }

    takeDamage(amount) {
        
        if (this.isDead) return;

        console.log("Boss.takeDamage llamado. Cantidad de daño:", amount);
        this.health -= amount;
        playSound('assets/sounds/boss_hit.wav'); 

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true; 
            console.log('¡Jefe derrotado!');

        }
    }

    draw(ctx) {
        if (this.isDead) {
            return;
        }
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);

       
        if (this.health > 0) { 
            const barWidth = this.width * (this.health / this.maxHealth);
            const barY = this.y - 20;
            
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x, barY, this.width, 10);
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, barY, barWidth, 10);
        }
    }
}