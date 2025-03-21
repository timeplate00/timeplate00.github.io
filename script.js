const workspace = document.getElementById('workspace');
const addBoxBtn = document.getElementById('add-box-btn');
const addSimpleBoxBtn = document.getElementById('add-simple-box-btn'); // Nuevo botón

// Cargar los recuadros guardados al inicio
document.addEventListener('DOMContentLoaded', loadBoxes);

addBoxBtn.addEventListener('click', () => {
    createBox({ text: '', left: '50px', top: '50px' });
    saveBoxes();
});

// Evento para el nuevo botón de recuadros simples
addSimpleBoxBtn.addEventListener('click', () => {
    createSimpleBox({ text: '', left: '50px', top: '50px' });
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
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
        saveBoxes();
    });

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('box-buttons');

    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    copyBtn.textContent = '+';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textarea.value);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
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

// Función para crear recuadros simples
function createSimpleBox(data) {
    const box = document.createElement('div');
    box.classList.add('simple-box');
    box.style.left = data.left;
    box.style.top = data.top;

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Texto...';
    textarea.value = data.text;

    // Altura fija para un solo renglón
    textarea.style.height = '30px';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('simple-box-buttons');

    // Botón para bloquear/desbloquear el movimiento
    const lockBtn = document.createElement('button');
    lockBtn.classList.add('lock-btn');
    lockBtn.textContent = '🔒'; // Símbolo de candado
    let isLocked = false; // Estado inicial: desbloqueado
    lockBtn.addEventListener('click', () => {
        isLocked = !isLocked; // Cambiar estado
        lockBtn.classList.toggle('locked', isLocked); // Aplicar estilo de bloqueado
        if (isLocked) {
            box.style.cursor = 'default'; // Cambiar cursor a normal
        } else {
            box.style.cursor = 'grab'; // Cambiar cursor a grab
        }
    });

    // Botón para cambiar el color
    const colorPickerBtn = document.createElement('button');
    colorPickerBtn.classList.add('color-picker-btn');
    colorPickerBtn.textContent = '🎨'; // Icono de paleta de colores
    colorPickerBtn.addEventListener('click', () => {
        // Crear un input de tipo color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.style.position = 'absolute';
        colorInput.style.opacity = '0'; // Ocultar el input
        colorInput.addEventListener('input', () => {
            const selectedColor = colorInput.value;
            box.style.backgroundColor = selectedColor;
            textarea.style.backgroundColor = selectedColor;
        });
        colorInput.click(); // Abrir el selector de colores
    });

    // Botón para eliminar el recuadro
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-simple-box-btn');
    deleteBtn.textContent = '🗑'; // Icono de basura
    deleteBtn.addEventListener('click', () => {
        const confirmDelete = confirm('¿Eliminar?');
        if (confirmDelete) {
            workspace.removeChild(box);
            saveBoxes();
        }
    });

    // Agregar botones al contenedor
    buttonsDiv.appendChild(lockBtn); // Botón de candado
    buttonsDiv.appendChild(colorPickerBtn);
    buttonsDiv.appendChild(deleteBtn);

    box.appendChild(textarea);
    box.appendChild(buttonsDiv);
    workspace.appendChild(box);

    // Hacer el recuadro arrastrable (si no está bloqueado)
    makeDraggable(box, () => !isLocked); // Solo arrastrable si no está bloqueado
}

// Función para hacer un elemento arrastrable (con condición de bloqueo)
function makeDraggable(element, isDraggable = () => true) {
    let offsetX, offsetY;

    element.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || !isDraggable()) return; // Evitar mover al escribir o si está bloqueado
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
    const boxes = Array.from(workspace.querySelectorAll('.box, .simple-box')).map(box => ({
        text: box.querySelector('textarea').value,
        left: box.style.left,
        top: box.style.top,
        type: box.classList.contains('simple-box') ? 'simple' : 'normal' // Guardar el tipo de recuadro
    }));

    localStorage.setItem('boxes', JSON.stringify(boxes));
}

function loadBoxes() {
    const savedBoxes = JSON.parse(localStorage.getItem('boxes') || '[]');
    savedBoxes.forEach(data => {
        if (data.type === 'simple') {
            createSimpleBox(data);
        } else {
            createBox(data);
        }
    });
}