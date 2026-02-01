document.addEventListener("DOMContentLoaded", function(event) {                     
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();  
    
    // global gain
    const globalGain = audioCtx.createGain(); 
    globalGain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    // default waveform
    let currentWaveform = 'sine';

    // give user option to choose wave form
    window.addEventListener('keydown', (e) => {
        if (e.key === '1') setWaveform('sine');
        if (e.key === '2') setWaveform('square');
        if (e.key === '3') setWaveform('sawtooth');
        if (e.key === '4') setWaveform('triangle');
    });

    const waveKeys = document.querySelectorAll('.wave-key');

    function setWaveform(wave) {
        currentWaveform = wave;

        waveKeys.forEach(key => {
            key.classList.toggle('active', key.dataset.wave === wave);
        });
    }

    // map notes to keys on computer keyboard
    const keyboardFrequencyMap = {
        '83': 261.63, // S - C
        '68': 293.66, // D - D
        '70': 329.63, // F - E
        '71': 349.23, // G - F
        '72': 391.99, // H - G
        '74': 440.00, // J - A   
        '75': 493.88,  // K - B 
        '76': 523.26,  // L - C
        '69': 277.18, // E - C#
        '82': 311.13, // R - D#
        '89': 369.99, // Y - F#
        '85': 415.30, // U - G#
        '73': 466.16, // I - A#
    };

    // set black and white keys to mimick piano
    const blackKeys = ['69','82','89','85','73'];   

    const whiteContainer = document.getElementById('white-keys');
    const blackContainer = document.getElementById('black-keys');

    const buttons = {};

    const whiteKeyOrder = ['83','68','70','71','72','74','75','76'];
    const blackKeyOrder = ['69','82','89','85','73'];

    for (const code of whiteKeyOrder) {
        const btn = document.createElement('button');
        btn.textContent = keyCodeToChar(code); 
        btn.dataset.key = code;
        btn.classList.add('white-key');
        whiteContainer.appendChild(btn);
        buttons[code] = btn;
    }

    // position black keys between the correct white keys
    const blackOffsets = {'69': -247,  '82': -175, '89': -25, '85': 50, '73': 122};    

    for (const code of blackKeyOrder) {
        const btn = document.createElement('button');
        btn.textContent = keyCodeToChar(code);
        btn.dataset.key = code;
        btn.classList.add('black-key');
        btn.style.color = 'white';
        blackContainer.appendChild(btn);

        btn.style.left = blackOffsets[code] + 'px';

        buttons[code] = btn;
    }

    function keyCodeToChar(code) {
        return String.fromCharCode(code);
    }

    // set colors when keys are pressed
    const keyColors = {
        '83': '#ff5c77', // S - C
        '69': '#ffb056', // E - C#
        '68': '#ffea4c', // D - D
        '82': '#d3ff4f', // R - D#
        '70': '#5cff5c', // F - E
        '71': '#63a9ff', // G - F
        '89': '#be27ff', // Y - F#
        '72': '#4B0082', // H - G
        '85': '#FF00FF', // U - G#
        '74': '#8F00FF', // J - A
        '73': '#FF69B4', // I - A#
        '75': '#FF1493', // K - B
        '76': '#FF69B4', // L - C
    };


    // create key press & release events
    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    activeOscillators = {}

    // play corresponding note when user presses a valid key 
    function keyDown(event) {
        const key = event.keyCode.toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);

            // change key color
            if (buttons[key]) {
                buttons[key].style.backgroundColor = keyColors[key];
            }
        }
    }

    // releases corresponding notes when user stops pressing a key
    function keyUp(event) {
        const key = event.keyCode.toString();
        if (activeOscillators[key]) {
            // get current oscillator
            const {osc, gainNode, release} = activeOscillators[key]; 
            const now = audioCtx.currentTime;

            // set target volume close to 0 after release time
            gainNode.gain.setTargetAtTime(0.0001, now, release);

            // schedule stop time (longer for exponential)
            osc.stop(now + release * 7); 

            // remove from active oscillators array
            setTimeout(() => {
                delete activeOscillators[key];

                // return to original color
                if (buttons[key]) {
                    buttons[key].style.backgroundColor = blackKeys.includes(key) ? 'black' : 'white';
                }
            }, release * 5000); 
        }
    }

    // create gain node + ADSR for each note (polyphonic mode)
    function playNote(key) {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();

        // gain node for each independent key
        const gainNode = audioCtx.createGain();
        const maxVolume = 0.8;
        const MAX_POLYPHONY = 8; // maximum number of simultaneous notes

        // set volume for each individual note depending on how many keys are currently pressed 
        const noteVolume = maxVolume / Math.min(MAX_POLYPHONY, Object.keys(activeOscillators).length + 1);

        // ADSR parameters
        const attack = 0.01;
        const decay = 0.01;
        const sustain = 0.5;
        const release = 0.01;

        // read the pressed key
        osc.type = currentWaveform;
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], now);

        // start at value close to 0 for exponential ramp
        gainNode.gain.setValueAtTime(0.001, now);

        // attack & decay
        gainNode.gain.linearRampToValueAtTime(noteVolume, now + attack);
        gainNode.gain.exponentialRampToValueAtTime(noteVolume * sustain, now + attack + decay);

        // connect to global gain
        osc.connect(gainNode).connect(globalGain);
        osc.start();

        // array of active oscillators
        activeOscillators[key] = {osc, gainNode, release};
    }

    // art banner on top of webpage
    const asciiStrip = document.getElementById('ascii-strip');
    const asciiArt = `

            ⢠⡾⠲⠶⣤⣀⣠⣤⣤⣤⡿⠛⠿⡴⠾⠛⢻⡆⠀⠀⠀
        ⠀⠀⠀⣼⠁⠀⠀⠀⠉⠁⠀⢀⣿⠐⡿⣿⠿⣶⣤⣤⣷⡀⠀⠀
        ⠀⠀⠀⢹⡶⠀⠀⠀⠀⠀⠀⠈⢯⣡⣿⣿⣀⣸⣿⣦⢓⡟⠀⠀
        ⠀⠀⢀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠹⣍⣭⣾⢱⡀⠀
        ⠀⣀⣸⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣸⣆
        ⠈⠉⢹⣉⡁⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⢀⣉⣿⣈⠁
        ⠀⠐⠋⢯⣁⣄⢀⣀⣀⡀⠀⠯⠽⠀⢀⣀⣀⡀⠀⣤⡟⠀⠉⠀
        ⠀⠀⠴⠛⠙⣷⠋⠉⠉⠙⣆⠀⠀⢰⡟⠉⠈⠙⢷⠟⠉⠙⠂⠀
        ⠀⠀⠀⠀⠀⠘⣆⣠⣤⣴⠟⠛⠛⠛⢧⣤⣤⣀⡾⠀⠀⠀⠀
    `;

    function createAsciiCopy() {
    const span = document.createElement('span');
    span.classList.add('ascii-art');
    span.textContent = asciiArt;
    return span;
    }

    // populate with initial copies
    for (let i = 0; i < 21; i++) {
    asciiStrip.appendChild(createAsciiCopy());
    }

    let offset = 0;
    function scrollAscii() {
    offset -= 1; // pixels per frame
    asciiStrip.style.transform = `translateX(${offset}px)`;

    const first = asciiStrip.firstElementChild;

    if (first) {
        // move the first copy to the right when it is almost out of screen
        if (first.getBoundingClientRect().right < window.innerWidth * 0.001) {
            asciiStrip.appendChild(first); 
            offset += first.offsetWidth + 50;   // margin 
        }
    }

    requestAnimationFrame(scrollAscii);
    }

    scrollAscii();
})