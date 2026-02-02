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

    const keyboardFrequencyMap = {
        'Z': 261.63,  // C
        'S': 277.18,  // C#
        'X': 293.66,  // D
        'D': 311.13,  // D#
        'C': 329.63,  // E
        'V': 349.23,  // F
        'G': 369.99,  // F#
        'B': 391.99,  // G
        'H': 415.30,  // G#
        'N': 440.00,  // A
        'J': 466.16,  // A#
        'M': 493.88,  // B

        'Q': 523.25,  // C
        'A': 554.37,  // C#
        'W': 587.33,  // D
        'F': 622.25,  // D#
        'E': 659.26,  // E
        'R': 698.46,  // F
        'K': 739.99,  // F#
        'T': 783.99,  // G
        'L': 830.61,  // G#
        'Y': 880.00,  // A
        'O': 932.33,  // A#
        'U': 987.77,  // B
        'I': 1046.50, // C
    };

    const keyColors = {
        'Z': '#FF7F50',  // C
        'S': '#ff5c77',  // C#
        'X': '#ffb056',  // D
        'D': '#ffea4c',  // D#
        'C': '#b0e0e6',  // E
        'V': '#5f9ea0',  // F
        'G': '#63a9ff',  // F#
        'B': '#f08080',  // G
        'H': '#b44aff',  // G#
        'N': '#ff4500',  // A
        'J': '#8F00FF',  // A#
        'M': '#FF1493',  // B

        'Q': '#FFD700',  // C
        'A': '#ffa07a',  // C#
        'W': '#f0e68c',  // D
        'F': '#20b2aa',  // D#
        'E': '#ff69b4',  // E
        'R': '#d3ff4f',  // F
        'K': '#32cd32',  // F#
        'T': '#ff6347',  // G
        'L': '#9370db',  // G#
        'Y': '#be27ff',  // A
        'O': '#ff00ff',  // A#
        'U': '#FF69B4',  // B
        'I': '#ff6987', //C
    };

    // set key orders
    const whiteKeyOrder = [
        'Z', // C
        'X', // D
        'C', // E
        'V', // F
        'B', // G
        'N', // A
        'M', // B

        'Q', // C
        'W', // D
        'E', // E
        'R', // F
        'T', // G
        'Y', // A
        'U', // B
        'I', // C

    ];

    const blackKeys = [
        'S', // C#
        'D', // D#
        'G', // F#
        'H', // G#
        'J', // A#

        'A', // C# (upper)
        'F', // D#
        'K', // F#
        'L', // G#
        'O'  // A#
    ];

    const blackKeyOrder = blackKeys;

    // containers
    const whiteContainer = document.getElementById('white-keys');
    const blackContainer = document.getElementById('black-keys');
    const buttons = {};

    // posiiton black keys between the correct white keys
    const blackOffsets = {
        'S': -378,   // C#
        'D': -318,  // D#

        'G': -200,  // F#
        'H': -140,  // G#
        'J': -80,  // A#

        'A': 37,  // C# upper
        'F': 97,  // D# upper

        'K': 213,  // F# upper
        'L': 273,  // G# upper
        'O': 333   // A# upper
    };

    // create white key buttons
    for (const key of whiteKeyOrder) {
        const btn = document.createElement('button');
        btn.textContent = key;
        btn.dataset.key = key;
        btn.classList.add('white-key');
        whiteContainer.appendChild(btn);
        buttons[key] = btn;
    }

    // create black key buttons
    for (const key of blackKeyOrder) {
        const btn = document.createElement('button');
        btn.textContent = key;
        btn.dataset.key = key;
        btn.classList.add('black-key');
        btn.style.color = 'white';
        btn.style.left = (blackOffsets[key]-30) + 'px';
        blackContainer.appendChild(btn);
        buttons[key] = btn;
    }

    function keyCodeToChar(code) {
        return String.fromCharCode(code);
    }


    // create key press & release events
    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    activeOscillators = {}

    // play corresponding note when user presses a valid key 
    function keyDown(event) {
        const key = event.key.toUpperCase();
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
        const key = event.key.toUpperCase();
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
⠀⠀⠀⠀⣠⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⡇⠀⠀⠀⠘⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣼⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⣡⣇⠀⠀⠀⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢠⣿⣿⠟⢻⣿⠤⠖⠒⠚⠉⠉⠉⠉⠉⠉⢩⡟⣹⠋⣿⠉⠉⠛⠒⣺⡤⢄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢸⣿⡟⠀⢠⣿⡇⠀⢀⡄⠀⠀⠀⠀⠀⠀⣏⣼⣃⣠⣽⡤⠤⢴⠯⣭⠧⢼⣎⡳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠈⣿⡇⠀⣼⣿⡇⠀⠰⣇⣠⡤⠴⠒⠚⠉⣿⠁⣤⣾⣿⡇⢀⣈⣉⣥⡤⢼⠬⣯⣛⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀
⠀⠀⠀⢻⣧⣼⣿⣿⠧⠒⠋⣏⣄⠀⠀⠀⠀⠀⢹⣀⡿⠿⠛⠉⠉⠁⠀⣀⣴⣾⠾⠓⠲⡯⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣞⣇⠀⠀⠀⠀⠀
⠀⠀⠀⣠⣿⣿⣿⡟⠀⠀⠀⣇⡿⠃⣀⡤⠴⠚⢹⡇⠀⠀⣀⡠⠖⠚⠉⢀⣀⠤⠖⠚⣹⣋⣏⡟⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⢯⠏⢿⠀⠀⠀
⠀⠀⣴⣿⣿⣿⡟⠀⠀⠀⢀⡫⠖⠋⠁⠀⠀⣠⣤⣧⠴⠋⠁⠀⣀⡤⠚⠉⠀⠀⠀⣰⠃⡽⠣⣏⡧⢧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⠀⢸⣧⣴⣾⣀⠀
⢀⣾⣿⣿⡿⢻⣷⢀⡤⠞⠉⠀⠀⠀⠀⢀⣼⣿⡿⠏⠀⣀⡴⠛⠁⠀⠀⠀⠀⢀⡴⠁⡴⠁⡼⢸⣷⢸⠀⠀⠀⠀⠈⣧⠀⠀⠀⣀⡠⠔⠚⠉⠁⠀⠀⠀⠈⡇⠉⠁⠀
⣼⣿⣿⠟⠀⣨⣿⣿⣿⣷⣦⡀⢀⣠⠖⠋⠀⠀⢀⣤⠞⠁⠀⠀⠀⠀⠀⣦⣠⠞⢶⡞⠣⣼⢁⡼⢁⡏⠀⠀⠀⠀⠀⢘⣧⠔⠋⠁⢀⡀⣀⡠⠴⠒⠚⢩⣽⡯⠉⠉⠉
⣿⣿⡏⠀⣾⣿⣿⣿⡿⢿⣿⣿⣏⠁⠀⠀⢠⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⢰⠛⢦⠎⢉⠿⣌⡞⢀⡞⠀⠀⠀⢀⡤⠚⠉⠘⣇⣀⠤⠚⣯⠁⠀⠀⣀⣤⠼⠟⠓⠒⠒⠒⠒
⣿⣿⡇⠰⣿⣿⠁⢻⣧⠀⠹⣿⣿⠀⣠⠞⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⢠⢯⣷⡏⢰⢿⢇⠞⠀⣀⠴⠚⠁⠀⢀⣠⡶⢻⡇⠀⢀⡸⡶⠚⠉⠀⢸⡓⣦⣠⠤⠤⠒
⠘⣿⣇⠀⢻⣿⣄⠈⣿⡆⠀⣿⣿⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱⣮⣸⣋⣰⣋⣤⠾⠒⠉⠀⣠⣆⡠⠖⠋⠹⠤⣞⠴⠚⠁⠀⢻⣀⡤⠖⠊⡏⢸⠇⠀⣀⠤
⠀⠘⢿⣷⣄⡈⠛⠛⢸⣿⣾⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢾⣠⠇⢠⠋⠀⣀⣠⣾⡟⡏⠀⠀⣀⠴⠊⠁⠀⢀⡠⣶⣿⡇⠀⢀⣴⣾⠼⠚⠉⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠈⠙⠛⠿⠿⠟⢻⣯⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢾⢉⠏⠉⠉⠁⣻⢋⣤⡧⠴⠋⢷⡀⢀⡤⠚⠉⠀⠿⠿⣃⠴⠚⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣀⡀⠀⠈⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣽⠒⠠⠤⠔⣿⠛⠛⠁⠀⣀⡬⢿⠁⠀⠀⠀⣀⡴⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣰⣿⣿⣿⣆⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⠦⣀⣀⣤⣿⣀⡠⠴⠊⠁⠀⢈⣧⣀⠴⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢻⣿⣿⣿⠟⢀⣼⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢧⡀⠈⠉⠁⠀⠀⠀⠀⢀⣠⡿⣻⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠈⠛⠿⠿⠿⠿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠒⠲⠦⠶⠒⠚⠉⠁⠀⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀
    `;

        //     ⢠⡾⠲⠶⣤⣀⣠⣤⣤⣤⡿⠛⠿⡴⠾⠛⢻⡆⠀⠀⠀
        // ⠀⠀⠀⣼⠁⠀⠀⠀⠉⠁⠀⢀⣿⠐⡿⣿⠿⣶⣤⣤⣷⡀⠀⠀
        // ⠀⠀⠀⢹⡶⠀⠀⠀⠀⠀⠀⠈⢯⣡⣿⣿⣀⣸⣿⣦⢓⡟⠀⠀
        // ⠀⠀⢀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠹⣍⣭⣾⢱⡀⠀
        // ⠀⣀⣸⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣸⣆
        // ⠈⠉⢹⣉⡁⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⢀⣉⣿⣈⠁
        // ⠀⠐⠋⢯⣁⣄⢀⣀⣀⡀⠀⠯⠽⠀⢀⣀⣀⡀⠀⣤⡟⠀⠉⠀
        // ⠀⠀⠴⠛⠙⣷⠋⠉⠉⠙⣆⠀⠀⢰⡟⠉⠈⠙⢷⠟⠉⠙⠂⠀
        // ⠀⠀⠀⠀⠀⠘⣆⣠⣤⣴⠟⠛⠛⠛⢧⣤⣤⣀⡾

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
