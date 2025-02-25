const workspace = document.getElementById('workspace');
const addBoxBtn = document.getElementById('add-box-btn');

// Cargar los recuadros guardados al inicio
document.addEventListener('DOMContentLoaded', loadBoxes);

addBoxBtn.addEventListener('click', () => {
    createBox({ text: '', left: '50px', top: '50px' });
    saveBoxes();
});

function createBox(data) {
    const box = document.createElement('div');
    box.classList.add('box');
    box.style.left = data.left;
    box.style.top = data.top;

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Texto...';
    textarea.value = data.text;

    // Ajustar altura dinámica
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto'; // Reinicia la altura
        textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta según el contenido
        saveBoxes();
    });

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('box-buttons');

    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    //copyBtn.textContent = '⎘ ';
    copyBtn.textContent = '+';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textarea.value);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    //deleteBtn.textContent = '🗑';
    deleteBtn.textContent = '-';
    deleteBtn.addEventListener('click', () => {
        const confirmDelete = confirm('¿Eliminar?');
        if (confirmDelete) {
            workspace.removeChild(box);
            saveBoxes();
        }
    });

    buttonsDiv.appendChild(copyBtn);
    buttonsDiv.appendChild(deleteBtn);

    box.appendChild(textarea);
    box.appendChild(buttonsDiv);
    workspace.appendChild(box);

    // Ajustar altura inicial
    textarea.style.height = `${textarea.scrollHeight}px`;

    makeDraggable(box);
}

function makeDraggable(element) {
    let offsetX, offsetY;

    element.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TEXTAREA') return; // Evitar mover al escribir
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;

        function moveAt(e) {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }

        document.addEventListener('mousemove', moveAt);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', moveAt);
            saveBoxes();
        }, { once: true });
    });
}

function saveBoxes() {
    const boxes = Array.from(workspace.querySelectorAll('.box')).map(box => ({
        text: box.querySelector('textarea').value,
        left: box.style.left,
        top: box.style.top,
    }));

    localStorage.setItem('boxes', JSON.stringify(boxes));
}

function loadBoxes() {
    const savedBoxes = JSON.parse(localStorage.getItem('boxes') || '[]');
    savedBoxes.forEach(data => createBox(data));
}
