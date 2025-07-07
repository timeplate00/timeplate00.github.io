const workspace = document.getElementById('workspace');
const addBoxBtn = document.getElementById('add-box-btn');
const addLineBoxBtn = document.getElementById('add-line-box-btn');
const colorPicker = document.getElementById('color-picker');
let currentBoxForColor = null;

// Cargar todos los recuadros guardados al inicio
document.addEventListener('DOMContentLoaded', () => {
    loadBoxes();
    loadLineBoxes();
});

// Evento para el botón original
addBoxBtn.addEventListener('click', () => {
    createBox({ text: '', left: '50px', top: '50px', locked: 'false' });
    saveBoxes();
});

// Evento para el nuevo botón de recuadros de una línea
addLineBoxBtn.addEventListener('click', () => {
    createLineBox({
        text: '',
        left: '50px',
        top: '50px',
        color: '#ffffff',
        locked: false
    });
    saveLineBoxes();
});

// Función para crear recuadros originales (modificada)
function createBox(data) {
    const box = document.createElement('div');
    box.classList.add('box');
    box.style.left = data.left;
    box.style.top = data.top;
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Texto...';
    textarea.value = data.text;
    box.dataset.locked = data.locked || 'false';

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

    const lockBtn = document.createElement('button');
    lockBtn.classList.add('lock-btn');
    lockBtn.textContent = '🔒';
    lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isLocked = box.dataset.locked === 'true';
        box.dataset.locked = !isLocked;
        if (!isLocked) {
            box.classList.add('locked');
            lockBtn.classList.add('active');
        } else {
            box.classList.remove('locked');
            lockBtn.classList.remove('active');
        }
        saveBoxes();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = '-';
    deleteBtn.addEventListener('click', () => {
        const confirmDelete = confirm('¿Eliminar este recuadro?');
        if (confirmDelete) {
            workspace.removeChild(box);
            saveBoxes();
        }
    });

    buttonsDiv.appendChild(copyBtn);
    buttonsDiv.appendChild(lockBtn);
    buttonsDiv.appendChild(deleteBtn);

    box.appendChild(textarea);
    box.appendChild(buttonsDiv);
    workspace.appendChild(box);

    if (box.dataset.locked === 'true') {
        box.classList.add('locked');
        lockBtn.classList.add('active');
    }

    textarea.style.height = `${textarea.scrollHeight}px`;
    makeDraggable(box);
}

// Función para crear recuadros de una línea
function createLineBox(data) {
    const box = document.createElement('div');
    box.classList.add('line-box');
    box.style.left = data.left;
    box.style.top = data.top;
    box.style.backgroundColor = data.color;
    box.dataset.locked = data.locked;
    if (data.locked === 'true') {
        box.classList.add('locked');
    }

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Texto...';
    textarea.value = data.text;

    textarea.addEventListener('input', () => {
        saveLineBoxes();
    });

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.marginTop = '5px';

    const colorBtn = document.createElement('button');
    colorBtn.classList.add('color-btn');
    colorBtn.textContent = '🎨';
    colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentBoxForColor = box;
        colorPicker.style.display = 'block';
        colorPicker.style.left = `${e.clientX}px`;
        colorPicker.style.top = `${e.clientY}px`;
    });

    const lockBtn = document.createElement('button');
    lockBtn.classList.add('lock-btn');
    lockBtn.textContent = '🔒';
    lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isLocked = box.dataset.locked === 'true';
        box.dataset.locked = !isLocked;
        if (!isLocked) {
            box.classList.add('locked');
            lockBtn.textContent = '🔓';
        } else {
            box.classList.remove('locked');
            lockBtn.textContent = '🔒';
        }
        saveLineBoxes();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const confirmDelete = confirm('¿Eliminar este recuadro?');
        if (confirmDelete) {
            workspace.removeChild(box);
            saveLineBoxes();
        }
    });

    buttonsDiv.appendChild(colorBtn);
    buttonsDiv.appendChild(lockBtn);
    buttonsDiv.appendChild(deleteBtn);

    box.appendChild(textarea);
    box.appendChild(buttonsDiv);
    workspace.appendChild(box);

    makeDraggable(box);
}

// Función para hacer arrastrable los recuadros
function makeDraggable(element) {
    let offsetX, offsetY;
    element.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || element.classList.contains('locked')) return;

        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;

        function moveAt(e) {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }

        document.addEventListener('mousemove', moveAt);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', moveAt);
            if (element.classList.contains('box')) {
                saveBoxes();
            } else {
                saveLineBoxes();
            }
        }, { once: true });
    });
}

// Selector de color
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        if (currentBoxForColor) {
            const color = option.getAttribute('data-color');
            currentBoxForColor.style.backgroundColor = color;
            currentBoxForColor.querySelector('textarea').style.backgroundColor = color;
            colorPicker.style.display = 'none';
            saveLineBoxes();
        }
    });
});

// Cerrar selector de color al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!colorPicker.contains(e.target) && e.target.className !== 'color-btn') {
        colorPicker.style.display = 'none';
    }
});

// Guardar recuadros originales
function saveBoxes() {
    const boxes = Array.from(workspace.querySelectorAll('.box')).map(box => ({
        text: box.querySelector('textarea').value,
        left: box.style.left,
        top: box.style.top,
        locked: box.dataset.locked
    }));
    localStorage.setItem('boxes', JSON.stringify(boxes));
}

// Cargar recuadros originales
function loadBoxes() {
    const savedBoxes = JSON.parse(localStorage.getItem('boxes') || '[]');
    savedBoxes.forEach(data => createBox(data));
}

// Guardar recuadros de una línea
function saveLineBoxes() {
    const lineBoxes = Array.from(workspace.querySelectorAll('.line-box')).map(box => ({
        text: box.querySelector('textarea').value,
        left: box.style.left,
        top: box.style.top,
        color: box.style.backgroundColor,
        locked: box.dataset.locked
    }));
    localStorage.setItem('lineBoxes', JSON.stringify(lineBoxes));
}

// Cargar recuadros de una línea
function loadLineBoxes() {
    const savedLineBoxes = JSON.parse(localStorage.getItem('lineBoxes') || '[]');
    savedLineBoxes.forEach(data => createLineBox(data));
}