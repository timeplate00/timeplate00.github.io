// script.js
const workspace = document.getElementById('workspace');
const addBoxBtn = document.getElementById('add-box-btn');
const addLineBoxBtn = document.getElementById('add-line-box-btn');
const colorPicker = document.getElementById('color-picker');
const colorSpectrum = document.getElementById('color-spectrum');
const customColorInput = document.getElementById('custom-color');
const colorPreview = document.getElementById('color-preview');
const closeColorPickerBtn = document.getElementById('close-color-picker');

let currentBoxForColor = null;
let isMuted = false;


// ============================
// AUDIO
// ============================

const copySound = new Audio('audio_1.mp3');


// ============================
// SETTINGS BUTTON
// ============================

const settingsBtn = document.createElement('button');
settingsBtn.id = 'settings-btn';
settingsBtn.innerHTML = '⚙️';

addLineBoxBtn.parentNode.insertBefore(settingsBtn, addLineBoxBtn);


// ============================
// SETTINGS MENU
// ============================

const settingsMenu = document.createElement('div');
settingsMenu.id = 'settings-menu';

settingsMenu.innerHTML = `
<ul>

    <li id="toggle-mute">🔊 Mute</li>

    <li id="volume-control">
        🔈 Volumen
        <input 
            type="range"
            id="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value="1"
        >
    </li>

    <li id="background-settings">+ Background</li>

    <ul id="background-options" style="display:none; margin-left:15px;">
        <li data-bg="#0a2239">- Blue</li>
        <li data-bg="#121212">- Gray</li>
        <li data-bg="#0f3d3e">- Green</li>
        <li data-bg="linear-gradient(135deg, #1a1f36, #2d4263)">- Elegant</li>
    </ul>

</ul>
`;

settingsMenu.style.display = 'none';
document.body.appendChild(settingsMenu);


// ============================
// TOGGLE MENU
// ============================

settingsBtn.addEventListener('click', () => {

    settingsMenu.style.display =
        settingsMenu.style.display === 'block'
            ? 'none'
            : 'block';

    const rect = settingsBtn.getBoundingClientRect();

    settingsMenu.style.top = rect.bottom + 'px';
    settingsMenu.style.left = rect.left + 'px';
});


// ============================
// MUTE
// ============================

const toggleMuteOption = document.getElementById('toggle-mute');
const volumeSlider = document.getElementById('volume-slider');


toggleMuteOption.addEventListener('click', () => {

    isMuted = !isMuted;

    if (isMuted) {
        copySound.volume = 0;
        volumeSlider.value = 0;
    } else {
        copySound.volume = 1;
        volumeSlider.value = 1;
    }

    toggleMuteOption.textContent =
        isMuted ? '🔇 <Unmute>' : '🔊 Mute';

    localStorage.setItem('soundVolume', copySound.volume);

    settingsMenu.style.display = 'none';
});


// ============================
// VOLUME CONTROL
// ============================

// Load saved volume
const savedVolume = localStorage.getItem('soundVolume');

if (savedVolume !== null) {

    copySound.volume = savedVolume;
    volumeSlider.value = savedVolume;

    if (savedVolume == 0) {
        isMuted = true;
        toggleMuteOption.textContent = '🔇 <Unmute>';
    }
}


// Live change
volumeSlider.addEventListener('input', () => {

    const volume = volumeSlider.value;

    copySound.volume = volume;

    if (volume == 0) {
        isMuted = true;
        toggleMuteOption.textContent = '🔇 <Unmute>';
    } else {
        isMuted = false;
        toggleMuteOption.textContent = '🔊 Mute';
    }

    localStorage.setItem('soundVolume', volume);
});


// ============================
// BACKGROUND
// ============================

const backgroundSettings = document.getElementById('background-settings');
const backgroundOptions = document.getElementById('background-options');


backgroundSettings.addEventListener('click', () => {

    backgroundOptions.style.display =
        backgroundOptions.style.display === 'block'
            ? 'none'
            : 'block';
});


backgroundOptions.querySelectorAll('li').forEach(option => {

    option.addEventListener('click', () => {

        const bgValue = option.dataset.bg;

        const mainContainer =
            document.getElementById('main-container');

        mainContainer.style.background = bgValue;

        localStorage.setItem('selectedBackground', bgValue);

        settingsMenu.style.display = 'none';
        backgroundOptions.style.display = 'none';
    });
});


// ============================
// DOM READY
// ============================

document.addEventListener('DOMContentLoaded', () => {

    const savedBg = localStorage.getItem('selectedBackground');

    if (savedBg) {
        document.getElementById('main-container').style.background = savedBg;
    }

    loadBoxes();
    loadLineBoxes();
});


// ============================
// + BUTTONS
// ============================

addBoxBtn.addEventListener('click', () => {

    createBox({
        text: '',
        left: '50px',
        top: '50px',
        locked: 'false'
    });

    saveBoxes();
});


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


// ============================
// CREATE BOX
// ============================

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
        textarea.style.height =
            `${textarea.scrollHeight}px`;

        saveBoxes();
    });


    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('box-buttons');


    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    copyBtn.textContent = '+';

    copyBtn.addEventListener('click', () => {

        navigator.clipboard.writeText(textarea.value);

        if (!isMuted) {
            copySound.currentTime = 0;
            copySound.play();
        }

        box.classList.add('glow');

        setTimeout(() => {
            box.classList.remove('glow');
        }, 1000);
    });


    const lockBtn = document.createElement('button');
    lockBtn.classList.add('lock-btn');
    lockBtn.textContent = '🔒';


    lockBtn.addEventListener('click', (e) => {

        e.stopPropagation();

        const isLocked =
            box.dataset.locked === 'true';

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

        const confirmDelete =
            confirm('¿Eliminar este recuadro?');

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


    textarea.style.height =
        `${textarea.scrollHeight}px`;

    makeDraggable(box);
}


// ============================
// LINE BOX / DRAG / COLOR / SAVE
// (SIN CAMBIOS)
// ============================

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
        showColorPicker();
    });

    const lockBtn = document.createElement('button');
    lockBtn.classList.add('lock-btn');
    lockBtn.textContent = '🔒';

    if (data.locked === 'true') {
        lockBtn.classList.add('active');
    }

    lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        const isLocked =
            box.dataset.locked === 'true';

        box.dataset.locked = !isLocked;

        if (!isLocked) {
            box.classList.add('locked');
            lockBtn.classList.add('active');
        } else {
            box.classList.remove('locked');
            lockBtn.classList.remove('active');
        }

        saveLineBoxes();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'X';

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        const confirmDelete =
            confirm('¿Eliminar este recuadro?');

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


// ============================
// DRAG
// ============================

function makeDraggable(element) {

    let offsetX, offsetY;

    element.addEventListener('mousedown', (e) => {

        if (e.target.tagName === 'TEXTAREA' ||
            element.classList.contains('locked')) return;

        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;


        function moveAt(e) {

            element.style.left =
                `${e.clientX - offsetX}px`;

            element.style.top =
                `${e.clientY - offsetY}px`;
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


// ============================
// COLOR PICKER
// ============================

function showColorPicker() {

    colorPicker.style.display = 'block';

    const backdrop =
        document.createElement('div');

    backdrop.classList.add('color-picker-backdrop');

    document.body.appendChild(backdrop);

    backdrop.style.display = 'block';

    backdrop.addEventListener('click', closeColorPicker);
}


function closeColorPicker() {

    colorPicker.style.display = 'none';

    const backdrop =
        document.querySelector('.color-picker-backdrop');

    if (backdrop) {
        backdrop.remove();
    }
}


closeColorPickerBtn.addEventListener('click', closeColorPicker);


colorSpectrum.addEventListener('click', (e) => {

    if (!currentBoxForColor) return;

    const rect =
        colorSpectrum.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hue =
        (x / rect.width) * 360;

    const saturation = 100;

    const lightness =
        100 - (y / rect.height) * 100;

    const color =
        `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    applyColor(color);
});


customColorInput.addEventListener('input', () => {

    applyColor(customColorInput.value);
});


function applyColor(color) {

    if (!currentBoxForColor) return;

    currentBoxForColor.style.backgroundColor = color;

    currentBoxForColor
        .querySelector('textarea')
        .style.backgroundColor = color;

    colorPreview.style.backgroundColor = color;

    saveLineBoxes();
}


// ============================
// SAVE / LOAD
// ============================

function saveBoxes() {

    const boxes =
        Array.from(
            workspace.querySelectorAll('.box')
        ).map(box => ({

            text: box.querySelector('textarea').value,
            left: box.style.left,
            top: box.style.top,
            locked: box.dataset.locked
        }));

    localStorage.setItem('boxes', JSON.stringify(boxes));
}


function loadBoxes() {

    const savedBoxes =
        JSON.parse(
            localStorage.getItem('boxes') || '[]'
        );

    savedBoxes.forEach(data => createBox(data));
}


function saveLineBoxes() {

    const lineBoxes =
        Array.from(
            workspace.querySelectorAll('.line-box')
        ).map(box => ({

            text: box.querySelector('textarea').value,
            left: box.style.left,
            top: box.style.top,
            color: box.style.backgroundColor,
            locked: box.dataset.locked
        }));

    localStorage.setItem('lineBoxes', JSON.stringify(lineBoxes));
}


function loadLineBoxes() {

    const savedLineBoxes =
        JSON.parse(
            localStorage.getItem('lineBoxes') || '[]'
        );

    savedLineBoxes.forEach(data => createLineBox(data));
}
