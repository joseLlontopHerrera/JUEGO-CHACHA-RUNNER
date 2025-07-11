// voice-recognition.js

import { playSound } from "./utils.js";

export class VoiceRecognitionSystem {
    constructor(game) {
        this.game = game;
        this.recognition = null;
        this.isListening = false;
        this.voiceFeedbackElement = document.getElementById('voice-feedback');
        this.lastDuckTime = 0;
        this.duckDuration = 500; 
        this.feedbackTimeout = null;

        this.commands = {
            'saltar': () => this.game.player.jump(),
            'brincar': () => this.game.player.jump(),
            'abajo': () => {      
                if (!this.game.player.isJumping) { 
                    this.game.player.duck(true);
                    this.lastDuckTime = performance.now();
                    setTimeout(() => {
                        if (performance.now() - this.lastDuckTime >= this.duckDuration - 50) { 
                            this.game.player.duck(false);
                        }
                    }, this.duckDuration);
                } else {
                    this.showVoiceFeedback("No puedes agacharte en el aire", true);
                }
            },
            'agacharse': () => {
                if (!this.game.player.isJumping) {
                    this.game.player.duck(true);
                    this.lastDuckTime = performance.now();
                    setTimeout(() => {
                        if (performance.now() - this.lastDuckTime >= this.duckDuration - 50) {
                            this.game.player.duck(false);
                        }
                    }, this.duckDuration);
                } else {
                    this.showVoiceFeedback("No puedes agacharte en el aire", true);
                }
            },
            'fuego': () => this.game.player.shoot(),
            'disparar': () => this.game.player.shoot(),
            'correr': () => {
                if (!this.game.player.isJumping) {
                    this.game.player.duck(false);
                } else {
                    this.showVoiceFeedback("No puedes correr en el aire", true);
                }
            },
            'pausar': () => this.game.pauseGame(),
            'reanudar': () => this.game.resumeGame(),
            'jugar': () => this.game.resumeGame()
        };
        
        this.init();
    }
    
    init() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error("Speech Recognition API not supported.");
            }
            this.recognition = new SpeechRecognition();
            
            this.recognition.lang = 'es-ES';
            this.recognition.interimResults = false; 
            this.recognition.continuous = true; 
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
                console.log(`Comando detectado: "${transcript}"`);
               
                if (this.game.player) { 
                    this.processCommand(transcript);
                } else {
                    console.log("Juego no está en estado de juego activo para procesar comandos.");
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Error en reconocimiento de voz:', event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    this.showVoiceFeedback('ERROR: Permiso de Micrófono Denegado', true);
                    alert('Por favor, permite el acceso al micrófono para usar los comandos de voz. Recarga la página si lo cambias.');
                } else if (event.error === 'no-speech') {
                    
                } else if (event.error === 'audio-capture') {
                   this.showVoiceFeedback('ERROR: Micrófono no disponible', true);
                } else {
                   this.showVoiceFeedback(`ERROR: ${event.error}`, true);
                }
                if (event.error !== 'InvalidStateError') {
                    this.isListening = false; 
                }
            };

            this.recognition.onend = () => {
                if (this.isListening && !this.game.isGameOver && !this.game.isPaused) {
                    setTimeout(() => {
                        if (this.isListening && !this.game.isGameOver && !this.game.isPaused) {
                             this.recognition.start();
                        }
                    }, 500); 
                }
            };
            
            document.body.addEventListener('click', () => {
                if (!this.isListening) {
                    this.startListening();
                }
            }, { once: true });

        } catch (e) {
            console.error("La API de Reconocimiento de Voz no es soportada en este navegador.", e);
            this.showVoiceFeedback('VOZ NO SOPORTADA', true);
        }
    }
    
    processCommand(command) {
        if (!this.game.player) return; 

        for (const [key, action] of Object.entries(this.commands)) {
            if (command.includes(key)) {
                action();
                this.showVoiceFeedback(key.toUpperCase());
                return;
            }
        }
    }
    
    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
                this.showVoiceFeedback('MICRÓFONO ON');
            } catch (e) {
                console.error("Error al iniciar el reconocimiento:", e);
                if (e.name !== 'InvalidStateError') {
                    this.showVoiceFeedback('ERROR DE INICIO DE VOZ', true);
                }
            }
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.isListening = false; 
            this.recognition.stop();
            this.showVoiceFeedback('MICRÓFONO OFF');
        }
    }
    
    showVoiceFeedback(message, isError = false) {
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }

        if (this.voiceFeedbackElement) { 
            this.voiceFeedbackElement.textContent = message;
            this.voiceFeedbackElement.classList.remove('active'); 
            void this.voiceFeedbackElement.offsetWidth; 
            this.voiceFeedbackElement.classList.add('active');

            if (isError) {
               this.voiceFeedbackElement.style.backgroundColor = 'rgba(231, 76, 60, 0.8)'; 
            } else {
               this.voiceFeedbackElement.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            }
            
            this.feedbackTimeout = setTimeout(() => {
                this.voiceFeedbackElement.classList.remove('active');
                if (isError) {
                    this.voiceFeedbackElement.style.backgroundColor = ''; 
                }
            }, 1500); 
        } else {
            console.warn("Elemento 'voice-feedback' no encontrado.");
        }
    }
}