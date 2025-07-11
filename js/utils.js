export let soundEnabled = true;
export function loadImage(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error(`Error al cargar imagen: ${path}`);
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'purple';
            ctx.fillRect(0, 0, 50, 50);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('ERROR', 5, 30);
            const dataUrl = canvas.toDataURL();
            const errorImg = new Image();
            errorImg.src = dataUrl;
            errorImg.onload = () => resolve(errorImg);
        };
        img.src = path;
    });
}

export function playSound(path) {
    if (!soundEnabled) return;
    try {
        const audio = new Audio(path);
        audio.volume = 0.3;
        audio.play().catch(e => {
            if (e.name !== 'NotAllowedError') { 
                console.warn("Advertencia de audio:", e);
            }
        });
    } catch (e) {
        console.error("No se pudo procesar el audio:", e);
    }
}


export function checkCollision(obj1, obj2) {

    const obj1EffectiveHeight = obj1.isDucking !== undefined ? (obj1.isDucking ? obj1.duckHeight : obj1.height) : obj1.height;
    const margin = 5;

    return obj1.x < obj2.x + obj2.width - margin &&
           obj1.x + obj1.width - margin > obj2.x &&
           obj1.y < obj2.y + obj2.height - margin &&
           obj1.y + obj1EffectiveHeight - margin > obj2.y;
}

export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
}