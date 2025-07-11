export class Enemy {
    constructor(game, type = 'bird') { 
        this.game = game;
        this.type = type; 
        
        
        this.frameWidth = 60;
        this.frameHeight = 40;
        this.frameCount = 1;
        this.speedMultiplier = 1; 
        this.image = null;
        switch (this.type) {
            case 'bird':
                this.frameWidth = 60;
                this.frameHeight = 40;
                this.image = game.assets.enemySprites.bird;
                this.yOffset = Math.random() * (150 - 50) + 50;

                break;
            default:
                console.warn('Tipo de enemigo no desconocido:', this.type);
                this.image = game.assets.enemySprites.bird; // Fallback
                this.frameWidth = 60;
                this.frameHeight = 40;
                this.yOffset = 50;
        }

        this.width = this.frameWidth;
        this.height = this.frameHeight;
        
        this.x = game.canvas.width;
        this.y = game.canvas.height - game.groundHeight - this.height - this.yOffset; 
        
       
        this.speed = (game.gameSpeed + (Math.random() * 0.5 - 0.25)) * this.speedMultiplier; 
        
        
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.animationInterval = 200; 
    }

    update(deltaTime) {
        this.x -= this.speed;
        
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationInterval) {
            this.animationTimer = 0;
        }
    }

    draw(ctx) {
        if(!this.image){
            console.error("Error: la imagen del enemigo no esta cargada")
            return;
        }
        ctx.drawImage(
            this.image,
            0,0,
            this.frameWidth, 
            this.frameHeight,
            this.x, this.y,
            this.width, this.height
        );
    }
}