export class Obstacle {
    constructor(game, type = 'stone') {
        this.game = game;
        this.type = type; 


        this.initialWidth = 40;
        this.initialHeight = 70;
        this.width = this.initialWidth;
        this.height = this.initialHeight;

        switch (this.type) {
            case 'stone':
                this.image = game.assets.obstacleSprite;
                this.width = 40;
                this.height = 70;
                break;
            default:
                this.image = game.assets.obstacleSprite; 
        }

        this.x = game.canvas.width;
        this.y = game.canvas.height - game.groundHeight - this.height;
        this.speed = game.gameSpeed; 
    }
    
    update(deltaTime) {
        this.x -= this.speed;
    }
    
    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}