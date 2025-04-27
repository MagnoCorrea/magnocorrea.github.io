document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const imageInput = document.getElementById('imageInput');
    const scaleInput = document.getElementById('scaleInput');
    const distanceDisplay = document.getElementById('distanceDisplay');
    const rulerBtn = document.getElementById('rulerBtn');
    const protractorBtn = document.getElementById('protractorBtn');

    let img = new Image();
    let isRulerActive = false;
    let isProtractorActive = false;
    let startX, startY, endX, endY;

    // Carregar a imagem no canvas
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            img.src = event.target.result;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
        };
        reader.readAsDataURL(file);
    });

    // Ativar/desativar régua
    rulerBtn.addEventListener('click', () => {
        isRulerActive = !isRulerActive;
        isProtractorActive = false;
        rulerBtn.style.backgroundColor = isRulerActive ? '#ccc' : '';
        protractorBtn.style.backgroundColor = '';
        distanceDisplay.textContent = 'Distância: 0 cm';
    });

    // Ativar/desativar transferidor (sem funcionalidade completa por enquanto)
    protractorBtn.addEventListener('click', () => {
        isProtractorActive = !isProtractorActive;
        isRulerActive = false;
        protractorBtn.style.backgroundColor = isProtractorActive ? '#ccc' : '';
        rulerBtn.style.backgroundColor = '';
        distanceDisplay.textContent = 'Distância: 0 cm';
        alert('Funcionalidade do transferidor ainda não implementada.');
    });

    // Iniciar medição com a régua
    canvas.addEventListener('mousedown', (e) => {
        if (isRulerActive) {
            startX = e.offsetX;
            startY = e.offsetY;
        }
    });

    // Finalizar medição e calcular distância
    canvas.addEventListener('mouseup', (e) => {
        if (isRulerActive) {
            endX = e.offsetX;
            endY = e.offsetY;

            // Calcular distância em pixels
            const distancePx = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            
            // Converter para centímetros usando a proporção
            const scale = parseFloat(scaleInput.value) || 1; // Evita divisão por zero
            const distanceCm = distancePx / scale;

            // Exibir resultado
            distanceDisplay.textContent = `Distância: ${distanceCm.toFixed(2)} cm`;

            // Desenhar linha no canvas (visualização opcional)
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
});