/* ============================================================
   PARTICLE SYSTEM — Gestalt & Visual Perception Principles
   ============================================================
   
   Gestalt Principles Applied:
   1. PROXIMITY    — Nearby particles connect with lines (perceived as groups)
   2. SIMILARITY   — Particles share similar size/color families (perceived as related)
   3. CONTINUITY   — Connected lines form smooth flowing paths
   4. CONNECTEDNESS — Lines between particles create visual relationships
   5. COMMON FATE  — Particles near cursor move together (shared motion = group)
   6. FIGURE-GROUND — Particles float over the dark background, creating depth layers

   Additional:
   - Cursor interaction: particles repel from cursor (magnetic field effect)
   - Cursor trailing line: smooth bezier trail follows cursor movement
   - Custom cursor: dot + ring with lag

   ============================================================ */

(function () {
    'use strict';

    // ======================== CONFIGURATION ========================
    const CONFIG = {
        // Particle settings
        particleCount: 80,           // Number of particles
        particleMinSize: 1.2,
        particleMaxSize: 3.5,
        particleSpeed: 0.3,          // Base drift speed
        connectionDistance: 150,      // Gestalt Proximity threshold
        connectionOpacity: 0.15,

        // Cursor interaction
        cursorRadius: 180,           // Radius of influence
        cursorForce: 0.08,           // Push force strength
        cursorAttractForce: 0.02,    // Gentle pull-back after push

        // Cursor trail
        trailLength: 30,             // Number of trail points
        trailFadeSpeed: 0.92,        // How fast trail fades (0-1, higher = slower fade)

        // Colors (from hackathon palette)
        colors: {
            particle: [
                'rgba(255, 200, 1, 0.6)',     // forsythia
                'rgba(255, 153, 50, 0.5)',     // deep-saffron
                'rgba(241, 246, 244, 0.3)',    // arctic-powder
                'rgba(217, 232, 226, 0.25)',   // mystic-mint
                'rgba(255, 200, 1, 0.35)',     // forsythia dim
            ],
            connection: 'rgba(255, 200, 1, OPACITY)',  // template
            trail: 'rgba(255, 200, 1, OPACITY)',
            cursorDot: '#FFC801',
        }
    };


    // ======================== CANVAS SETUP ========================
    const particleCanvas = document.getElementById('particleCanvas');
    const trailCanvas = document.getElementById('cursorTrail');

    if (!particleCanvas || !trailCanvas) return;

    const pCtx = particleCanvas.getContext('2d');
    const tCtx = trailCanvas.getContext('2d');

    let width, height;
    let dpr = window.devicePixelRatio || 1;

    function resizeCanvases() {
        width = window.innerWidth;
        height = document.documentElement.scrollHeight;

        // Particle canvas covers full scroll height
        particleCanvas.width = width * dpr;
        particleCanvas.height = height * dpr;
        particleCanvas.style.width = width + 'px';
        particleCanvas.style.height = height + 'px';
        pCtx.scale(dpr, dpr);

        // Trail canvas covers viewport only
        trailCanvas.width = width * dpr;
        trailCanvas.height = window.innerHeight * dpr;
        trailCanvas.style.width = width + 'px';
        trailCanvas.style.height = window.innerHeight + 'px';
        tCtx.scale(dpr, dpr);
    }

    resizeCanvases();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            dpr = window.devicePixelRatio || 1;
            resizeCanvases();
            initParticles();
        }, 200);
    });


    // ======================== MOUSE TRACKING ========================
    const mouse = {
        x: -1000,
        y: -1000,         // absolute page position
        vx: 0,
        vy: 0,
        screenY: -1000,   // viewport Y for trail
        active: false
    };

    let prevMouseX = -1000, prevMouseY = -1000;

    document.addEventListener('mousemove', (e) => {
        mouse.vx = e.pageX - prevMouseX;
        mouse.vy = e.pageY - prevMouseY;
        prevMouseX = e.pageX;
        prevMouseY = e.pageY;
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        mouse.screenY = e.clientY;
        mouse.active = true;
    });

    document.addEventListener('mouseleave', () => {
        mouse.active = false;
    });


    // ======================== CUSTOM CURSOR ========================
    const cursorDot = document.getElementById('cursorDot');
    const cursorRing = document.getElementById('cursorRing');

    let cursorDotX = 0, cursorDotY = 0;
    let cursorRingX = 0, cursorRingY = 0;

    function updateCursor() {
        if (!mouse.active) {
            cursorDot.style.opacity = '0';
            cursorRing.style.opacity = '0';
            return;
        }

        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';

        // Dot follows exactly
        cursorDotX = mouse.x - window.scrollX;
        cursorDotY = mouse.screenY;
        cursorDot.style.transform = `translate(${cursorDotX}px, ${cursorDotY}px)`;

        // Ring follows with lag
        cursorRingX += (cursorDotX - cursorRingX) * 0.15;
        cursorRingY += (cursorDotY - cursorRingY) * 0.15;
        cursorRing.style.transform = `translate(${cursorRingX}px, ${cursorRingY}px)`;
    }


    // ======================== CURSOR TRAIL ========================
    const trailPoints = [];

    function updateTrail() {
        // Add current mouse position
        if (mouse.active) {
            trailPoints.push({
                x: mouse.x - window.scrollX,
                y: mouse.screenY,
                life: 1.0
            });
        }

        // Limit length
        while (trailPoints.length > CONFIG.trailLength) {
            trailPoints.shift();
        }

        // Fade trail
        for (let i = 0; i < trailPoints.length; i++) {
            trailPoints[i].life *= CONFIG.trailFadeSpeed;
        }

        // Remove dead points
        while (trailPoints.length > 0 && trailPoints[0].life < 0.01) {
            trailPoints.shift();
        }
    }

    function drawTrail() {
        tCtx.clearRect(0, 0, width, window.innerHeight);

        if (trailPoints.length < 2) return;

        tCtx.lineCap = 'round';
        tCtx.lineJoin = 'round';

        // Draw smooth bezier curve through trail points
        for (let i = 1; i < trailPoints.length; i++) {
            const p0 = trailPoints[i - 1];
            const p1 = trailPoints[i];
            const progress = i / trailPoints.length;
            const opacity = p1.life * progress * 0.6;
            const lineWidth = progress * 3 + 0.5;

            tCtx.beginPath();
            tCtx.strokeStyle = `rgba(255, 200, 1, ${opacity})`;
            tCtx.lineWidth = lineWidth;
            tCtx.moveTo(p0.x, p0.y);
            tCtx.lineTo(p1.x, p1.y);
            tCtx.stroke();
        }

        // Glow at the cursor tip
        if (trailPoints.length > 0 && mouse.active) {
            const tip = trailPoints[trailPoints.length - 1];
            const grad = tCtx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 20);
            grad.addColorStop(0, 'rgba(255, 200, 1, 0.3)');
            grad.addColorStop(1, 'rgba(255, 200, 1, 0)');
            tCtx.fillStyle = grad;
            tCtx.beginPath();
            tCtx.arc(tip.x, tip.y, 20, 0, Math.PI * 2);
            tCtx.fill();
        }
    }


    // ======================== PARTICLE CLASS ========================
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseX = this.x;
            this.baseY = this.y;

            // Gestalt: SIMILARITY — particles clustered in similar size ranges
            const sizeGroup = Math.random();
            if (sizeGroup < 0.6) {
                // Small particles (majority — background field)
                this.size = CONFIG.particleMinSize + Math.random() * 0.8;
            } else if (sizeGroup < 0.9) {
                // Medium particles
                this.size = 2 + Math.random() * 1;
            } else {
                // Large accent particles (rare)
                this.size = 2.5 + Math.random() * 1;
            }

            // Velocity (slow drift for organic feel)
            this.vx = (Math.random() - 0.5) * CONFIG.particleSpeed;
            this.vy = (Math.random() - 0.5) * CONFIG.particleSpeed;

            // Color (from palette — Gestalt: SIMILARITY)
            this.color = CONFIG.colors.particle[
                Math.floor(Math.random() * CONFIG.colors.particle.length)
            ];

            // Depth layer for parallax (FIGURE-GROUND)
            this.depth = 0.5 + Math.random() * 0.5;

            // Pulse phase
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.01 + Math.random() * 0.02;
        }

        update() {
            // Slow organic drift
            this.x += this.vx;
            this.y += this.vy;

            // Gentle pulse
            this.pulsePhase += this.pulseSpeed;
            const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
            this.currentSize = this.size * pulse;

            // Cursor interaction (Gestalt: COMMON FATE — particles near cursor move as group)
            if (mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.cursorRadius) {
                    const force = (CONFIG.cursorRadius - dist) / CONFIG.cursorRadius;
                    const angle = Math.atan2(dy, dx);

                    // Repel from cursor
                    this.vx += Math.cos(angle) * force * CONFIG.cursorForce;
                    this.vy += Math.sin(angle) * force * CONFIG.cursorForce;

                    // Boost glow near cursor
                    this.cursorProximity = force;
                } else {
                    this.cursorProximity = 0;
                }
            } else {
                this.cursorProximity = 0;
            }

            // Gentle drag / friction
            this.vx *= 0.98;
            this.vy *= 0.98;

            // Soft return to general area (prevents particles from flying off)
            this.vx += (this.baseX - this.x) * 0.0003;
            this.vy += (this.baseY - this.y) * 0.0003;

            // Boundary wrapping
            if (this.x < -50) this.x = width + 50;
            if (this.x > width + 50) this.x = -50;
            if (this.y < -50) this.y = height + 50;
            if (this.y > height + 50) this.y = -50;
        }

        draw(ctx) {
            // Main particle dot
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();

            // Cursor proximity glow (particles light up near cursor)
            if (this.cursorProximity > 0.1) {
                const glowRadius = this.currentSize + this.cursorProximity * 12;
                const grad = ctx.createRadialGradient(
                    this.x, this.y, this.currentSize,
                    this.x, this.y, glowRadius
                );
                grad.addColorStop(0, `rgba(255, 200, 1, ${this.cursorProximity * 0.4})`);
                grad.addColorStop(1, 'rgba(255, 200, 1, 0)');
                ctx.beginPath();
                ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }
    }


    // ======================== PARTICLE SYSTEM ========================
    let particles = [];

    function initParticles() {
        particles = [];
        // Scale particle count with page size but cap it
        const count = Math.min(CONFIG.particleCount, Math.floor((width * height) / 15000));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    initParticles();


    // ======================== DRAW CONNECTIONS ========================
    // Gestalt: PROXIMITY + CONNECTEDNESS + CONTINUITY
    function drawConnections(ctx) {
        const scrollY = window.scrollY;
        const viewTop = scrollY - 100;
        const viewBottom = scrollY + window.innerHeight + 100;

        for (let i = 0; i < particles.length; i++) {
            // Only process visible particles
            if (particles[i].y < viewTop || particles[i].y > viewBottom) continue;

            for (let j = i + 1; j < particles.length; j++) {
                if (particles[j].y < viewTop || particles[j].y > viewBottom) continue;

                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.connectionDistance) {
                    // Gestalt: PROXIMITY — closer = stronger connection
                    const opacity = (1 - dist / CONFIG.connectionDistance) * CONFIG.connectionOpacity;

                    // Boost opacity if both particles are near cursor (COMMON FATE visual feedback)
                    const cursorBoost = (particles[i].cursorProximity + particles[j].cursorProximity) * 0.15;
                    const finalOpacity = Math.min(opacity + cursorBoost, 0.5);

                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255, 200, 1, ${finalOpacity})`;
                    ctx.lineWidth = 0.5 + cursorBoost * 2;
                    ctx.stroke();
                }
            }
        }
    }


    // ======================== ANIMATION LOOP ========================
    let animFrame;

    function animate() {
        // Clear particle canvas
        pCtx.clearRect(0, 0, width, height);

        // Update & draw particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw(pCtx);
        }

        // Draw connection lines (Gestalt proximity/connectedness)
        drawConnections(pCtx);

        // Update cursor trail
        updateTrail();
        drawTrail();

        // Update custom cursor
        updateCursor();

        animFrame = requestAnimationFrame(animate);
    }

    animate();


    // ======================== PERFORMANCE: PAUSE WHEN HIDDEN ========================
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animFrame);
        } else {
            animate();
        }
    });


    // ======================== RECALC ON SCROLL (page height might change) ========================
    let scrollResizeTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollResizeTimer);
        scrollResizeTimer = setTimeout(() => {
            const newHeight = document.documentElement.scrollHeight;
            if (Math.abs(newHeight - height) > 200) {
                height = newHeight;
                particleCanvas.height = height * dpr;
                particleCanvas.style.height = height + 'px';
                pCtx.scale(dpr, dpr);
            }
        }, 500);
    }, { passive: true });

})();
