document.addEventListener("DOMContentLoaded", function(event) {                     
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();  
    
    // global gain
    const globalGain = audioCtx.createGain(); 
    globalGain.gain.setValueAtTime(0.7, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    // Synthesis parameters with defaults
    const synthParams = {
        mode: 'none',
        
        // Additive synthesis
        additive: {
            partials: [
                { harmonic: 1, amplitude: 0.4 },
                { harmonic: 2, amplitude: 0.3 },
                { harmonic: 3, amplitude: 0.2 },
                { harmonic: 4, amplitude: 0.1 }
            ],
            numPartials: 4,
            spread: 0.5,
            waveform: 'sine'
        },
        
        // AM synthesis
        am: {
            modulationFreq: 5,
            modulationDepth: 0.5,
            carrierWaveform: 'sine',  
            modulatorWaveform: 'sine'
        },
        
        // FM synthesis
        fm: {
            modulationFreq: 200,
            modulationIndex: 10,
            carrierWaveform: 'sine',  
            modulatorWaveform: 'sine'
        },

        // Simple oscillator settings
        simple: {
            waveform: 'sine'
        },

        // LFO settings
        lfo: {
            rate: 5,
            depth: 0,
            target: 'pitch'
        }
    };

    // Mode switching function
    window.setSynthMode = function(mode) {
        synthParams.mode = mode;
        
        // Update LCD display
        const display = document.getElementById('mode-display');
        if (display) {
            display.textContent = `MODE: ${mode.toUpperCase()}`;
        }
        
        // Update mode buttons
        const modeButtons = document.querySelectorAll('.synth-mode');

        modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide parameter sections
        const additiveParams = document.getElementById('additive-params');
        const amParams = document.getElementById('am-params');
        const fmParams = document.getElementById('fm-params');
        
        if (additiveParams) additiveParams.classList.toggle('hidden', mode !== 'additive');
        if (amParams) amParams.classList.toggle('hidden', mode !== 'am');
        if (fmParams) fmParams.classList.toggle('hidden', mode !== 'fm');
    };

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
        'Z': '#ffb3e6',  'S': '#e6b3ff',  'X': '#ffd4e5',  'D': '#d4f4dd',
        'C': '#d4f1f4',  'V': '#e5ccff',  'G': '#c9f0ff',  'B': '#ffe5f1',
        'H': '#f0d4ff',  'N': '#ffd9e8',  'J': '#e0ccff',  'M': '#ffc9e3',
        'Q': '#d9b3ff',  'A': '#ffccf2',  'W': '#ffffcc',  'F': '#ccf2ff',
        'E': '#ffd6f0',  'R': '#f0ffcc',  'K': '#ccffdd',  'T': '#ffd4cc',
        'L': '#e6d9ff',  'Y': '#f2ccff',  'O': '#ffc9ff',  'U': '#ffd9f2',
        'I': '#ffb3d9',
    };

    const whiteKeyOrder = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I'];
    const blackKeys = ['S', 'D', 'G', 'H', 'J', 'A', 'F', 'K', 'L', 'O'];
    const blackKeyOrder = blackKeys;

    const whiteContainer = document.getElementById('white-keys');
    const blackContainer = document.getElementById('black-keys');
    const buttons = {};

    const blackOffsets = {
        'S': -340, 'D': -284, 'G': -177, 'H': -123, 'J': -68,
        'A': 39, 'F': 94, 'K': 201, 'L': 256, 'O': 310
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

    const waveKeys = document.querySelectorAll('.wave-key');
    
    function setWaveform(wave) {
        synthParams.simple.waveform = wave;
        synthParams.additive.waveform = wave;
        synthParams.am.carrierWaveform = wave;
        synthParams.fm.carrierWaveform = wave;
        
        waveKeys.forEach(key => {
            key.classList.toggle('active', key.dataset.wave === wave);
        });
        console.log(`Waveform set to ${wave}`);
    }

    // Add click listeners to wave keys
    waveKeys.forEach(key => {
        key.addEventListener('click', () => {
            setWaveform(key.dataset.wave);
        });
    });

    // Keyboard shortcuts for waveforms & synth mode
    window.addEventListener('keydown', (e) => {

        if (e.key === '1') setWaveform('sine');
        if (e.key === '2') setWaveform('square');
        if (e.key === '3') setWaveform('sawtooth');
        if (e.key === '4') setWaveform('triangle');

        if (e.key === '5') setSynthMode('none');
        if (e.key === '6') setSynthMode('additive');
        if (e.key === '7') setSynthMode('am');
        if (e.key === '8') setSynthMode('fm');
    });


    // Helper function to update additive partials
    function updateAdditivePartials(num, spread) {
        synthParams.additive.partials = [];
        for (let i = 0; i < num; i++) {
            const harmonic = i + 1;
            const amplitude = (0.5 / harmonic) * (1 - spread * 0.5);
            synthParams.additive.partials.push({ harmonic, amplitude });
        }
    }

    // Setup parameter controls
    function setupParameterControls() {
        // Additive controls
        const addPartials = document.getElementById('additive-partials');
        const addSpread = document.getElementById('additive-spread');
        
        if (addPartials) {
            addPartials.addEventListener('input', (e) => {
                const num = parseInt(e.target.value);
                synthParams.additive.numPartials = num;
                document.getElementById('additive-partials-val').textContent = num;
                updateAdditivePartials(num, synthParams.additive.spread);
            });
        }

        if (addSpread) {
            addSpread.addEventListener('input', (e) => {
                const spread = parseInt(e.target.value) / 100;
                synthParams.additive.spread = spread;
                document.getElementById('additive-spread-val').textContent = e.target.value;
                updateAdditivePartials(synthParams.additive.numPartials, spread);
            });
        }

        // AM controls
        const amModFreq = document.getElementById('am-mod-freq');
        const amDepth = document.getElementById('am-depth');
        
        if (amModFreq) {
            amModFreq.addEventListener('input', (e) => {
                synthParams.am.modulationFreq = parseFloat(e.target.value);
                document.getElementById('am-mod-freq-val').textContent = parseFloat(e.target.value).toFixed(1) + ' Hz';
            });
        }

        if (amDepth) {
            amDepth.addEventListener('input', (e) => {
                synthParams.am.modulationDepth = parseInt(e.target.value) / 100;
                document.getElementById('am-depth-val').textContent = e.target.value + '%';
            });
        }

        // FM controls
        const fmModFreq = document.getElementById('fm-mod-freq');
        const fmIndex = document.getElementById('fm-index');
        
        if (fmModFreq) {
            fmModFreq.addEventListener('input', (e) => {
                synthParams.fm.modulationFreq = parseInt(e.target.value);
                document.getElementById('fm-mod-freq-val').textContent = e.target.value + ' Hz';
            });
        }

        if (fmIndex) {
            fmIndex.addEventListener('input', (e) => {
                synthParams.fm.modulationIndex = parseFloat(e.target.value);
                document.getElementById('fm-index-val').textContent = parseFloat(e.target.value).toFixed(1);
            });
        }

        // LFO controls
        const lfoRate = document.getElementById('lfo-rate');
        const lfoDepth = document.getElementById('lfo-depth');
        const lfoTarget = document.getElementById('lfo-target');
        
        if (lfoRate) {
            lfoRate.addEventListener('input', (e) => {
                synthParams.lfo.rate = parseFloat(e.target.value);
                document.getElementById('lfo-rate-val').textContent = parseFloat(e.target.value).toFixed(1) + ' Hz';
            });
        }

        if (lfoDepth) {
            lfoDepth.addEventListener('input', (e) => {
                synthParams.lfo.depth = parseInt(e.target.value) / 100;
                document.getElementById('lfo-depth-val').textContent = e.target.value + '%';
            });
        }

        if (lfoTarget) {
            lfoTarget.addEventListener('change', (e) => {
                synthParams.lfo.target = e.target.value;
            });
        }
    }

    // Initialize parameter controls
    setupParameterControls();

    // Synthesizer class
    class Synth {
        constructor(frequency, params) {
            this.frequency = frequency;
            this.params = params;
            this.nodes = [];
            this.gainNode = audioCtx.createGain();
            this.gainNode.connect(globalGain);
            this.gainNode.gain.value = 0;
        }
        
        start() {
            const now = audioCtx.currentTime;
            const attack = 0.01;
            const decay = 0.01;
            const sustain = 0.5;
            
            // Create synthesis based on mode
            switch(this.params.mode) {
                case 'none':
                    this.createSimple();
                    break;
                case 'additive':
                    this.createAdditive();
                    break;
                case 'am':
                    this.createAM();
                    break;
                case 'fm':
                    this.createFM();
                    break;
            }

            // Apply LFO if depth > 0
            if (this.params.lfo.depth > 0) {
                this.applyLFO();
            }
            
            // Apply envelope (attack + decay to sustain level)
            this.gainNode.gain.setValueAtTime(0.001, now);
            this.gainNode.gain.linearRampToValueAtTime(0.3, now + attack);
            this.gainNode.gain.exponentialRampToValueAtTime(0.3 * sustain, now + attack + decay);
        }

        stop() {
            const now = audioCtx.currentTime;
            const release = 0.3;
            
            // Apply release
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
            this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + release);
            
            // Clean up nodes after release
            setTimeout(() => {
                this.nodes.forEach(node => {
                    if (node.stop) node.stop();
                    if (node.disconnect) node.disconnect();
                });
                this.gainNode.disconnect();
            }, release * 1000 + 100);
        }

        applyLFO() {
            const lfo = audioCtx.createOscillator();
            lfo.frequency.value = this.params.lfo.rate;
            lfo.type = 'sine';
            
            const lfoGain = audioCtx.createGain();
            
            if (this.params.lfo.target === 'pitch') {
                // Vibrato - modulate frequency
                lfoGain.gain.value = this.frequency * 0.02 * this.params.lfo.depth;
                
                this.nodes.forEach(node => {
                    if (node.frequency) {
                        lfo.connect(lfoGain);
                        lfoGain.connect(node.frequency);
                    }
                });
            } else if (this.params.lfo.target === 'volume') {
                // Tremolo - modulate volume
                lfoGain.gain.value = this.params.lfo.depth * 0.3;
                lfo.connect(lfoGain);
                lfoGain.connect(this.gainNode.gain);
            }
            
            lfo.start();
            this.nodes.push(lfo, lfoGain);
        }
        
        createSimple() {
            const osc = audioCtx.createOscillator();
            osc.frequency.value = this.frequency;
            osc.type = this.params.simple.waveform;
            
            osc.connect(this.gainNode);
            osc.start();
            
            this.nodes.push(osc);
        }

        createAdditive() {
            this.params.additive.partials.forEach(partial => {
                const osc = audioCtx.createOscillator();
                osc.frequency.value = this.frequency * partial.harmonic;
                osc.type = this.params.additive.waveform;
                
                const partialGain = audioCtx.createGain();
                partialGain.gain.value = partial.amplitude;
                
                osc.connect(partialGain);
                partialGain.connect(this.gainNode);
                osc.start();
                
                this.nodes.push(osc, partialGain);
            });
        }
        
        createAM() {
            // Carrier
            const carrier = audioCtx.createOscillator();
            carrier.frequency.value = this.frequency;
            carrier.type = this.params.am.carrierWaveform;;
            
            // Modulator
            const modulator = audioCtx.createOscillator();
            modulator.frequency.value = this.params.am.modulationFreq;
            modulator.type = this.params.am.modulatorWaveform;
            
            // Modulation gain (controls depth)
            const modGain = audioCtx.createGain();
            modGain.gain.value = this.params.am.modulationDepth;
            
            // DC offset (so modulation ranges from 0 to 1)
            const dcOffset = audioCtx.createGain();
            dcOffset.gain.value = 1 - this.params.am.modulationDepth;
            
            // Connect AM chain
            modulator.connect(modGain);
            modGain.connect(dcOffset.gain);
            
            carrier.connect(dcOffset);
            dcOffset.connect(this.gainNode);
            
            carrier.start();
            modulator.start();
            
            this.nodes.push(carrier, modulator, modGain, dcOffset);
        }
        
        createFM() {
            // Carrier
            const carrier = audioCtx.createOscillator();
            carrier.frequency.value = this.frequency;
            carrier.type = this.params.fm.carrierWaveform;
            
            // Modulator
            const modulator = audioCtx.createOscillator();
            modulator.frequency.value = this.params.fm.modulationFreq;
            modulator.type = this.params.fm.modulatorWaveform;
            
            // Modulation gain (controls index)
            const modGain = audioCtx.createGain();
            modGain.gain.value = this.params.fm.modulationIndex * this.params.fm.modulationFreq;
            
            // Connect FM chain
            modulator.connect(modGain);
            modGain.connect(carrier.frequency);
            
            carrier.connect(this.gainNode);
            
            carrier.start();
            modulator.start();
            
            this.nodes.push(carrier, modulator, modGain);
        }
    }

    // Active synths
    const activeSynths = {};

    // create key press & release events
    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    // play corresponding note when user presses a valid key 
    function keyDown(event) {
        const key = event.key.toUpperCase();
        if (keyboardFrequencyMap[key] && !activeSynths[key]) {
            const synth = new Synth(keyboardFrequencyMap[key], synthParams);
            synth.start();
            activeSynths[key] = synth;

            // change key color
            if (buttons[key]) {
                buttons[key].style.backgroundColor = keyColors[key];
            }

            triggerGlow();
        }
    }

    // releases corresponding notes when user stops pressing a key
    function keyUp(event) {
        const key = event.key.toUpperCase();
        if (activeSynths[key]) {
            activeSynths[key].stop();
            delete activeSynths[key];

            // return to original color
            if (buttons[key]) {
                buttons[key].style.backgroundColor = blackKeys.includes(key) ? 'black' : 'white';
            }
        }
    }

    // glow in background
    function triggerGlow() {
        const ambient = document.getElementById('ambient-glow');
        const glow = document.createElement('div');
        glow.classList.add('glow');

        const glowSize = 300;
        const padding = 100;

        const x = padding + Math.random() * (window.innerWidth - glowSize - 2 * padding);
        const y = padding + Math.random() * (window.innerHeight - glowSize - 2 * padding);

        glow.style.left = `${x}px`;
        glow.style.top = `${y}px`;

        ambient.appendChild(glow);

        glow.addEventListener('animationend', () => {
            glow.remove();
        });
    }
})
