export class Projectile {
    constructor(game, x, y, speedX, speedY = 0, damage = 1, isEnemy=false, image = null) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.damage = damage; 
        this.isEnemy = isEnemy; 
        this.image = image; 

        this.width = (image && image.width) ? image.width *0.5 : 10; 
        this.height = (image && image.height) ? image.height *0.5 : 10;    
    }

    update(deltaTime) {
        this.x += this.speedX * (deltaTime / 16); 
    }

    draw(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.isEnemy ? 'red' : 'yellow';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}