/*
══════════════════════════════════════════════════════════════════
TP MODULE 5 — script.js
Portfolio personnel — JavaScript
══════════════════════════════════════════════════════════════════

Ce fichier gère tous les comportements interactifs du portfolio.
Chaque section est expliquée avec l'analogie et la logique.

PLAN :
  1. Sélection des éléments HTML (les "acteurs" du script)
  2. Navigation — burger menu + scroll actif
  3. Barres de compétences — animation au scroll
  4. Scroll reveal — apparition des sections
  5. Formulaire de contact — validation
  6. Bouton retour en haut
  7. Démarrage — on lance tout
══════════════════════════════════════════════════════════════════
*/


/* ═══════════════════════════════════════════════════════════════
   1. SÉLECTION DES ÉLÉMENTS HTML
   document.querySelector() = "trouve-moi cet élément dans la page"
   On les sélectionne une seule fois et on les stocke en variables.

   Analogie : c'est comme avoir les numéros de téléphone
   de chaque acteur avant de commencer le tournage.
═══════════════════════════════════════════════════════════════ */

const navbar = document.getElementById('navbar');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');
const backToTop = document.getElementById('back-to-top');
const contactForm = document.getElementById('contact-form');
const successMsg = document.getElementById('success-message');
const particleCanvas = document.getElementById('particle-canvas');
const heroTitle = document.querySelector('.hero-title-reveal');

// Toutes les barres de compétences (NodeList = liste d'éléments)
const skillBars = document.querySelectorAll('.skill-progress');

// Tous les éléments à animer à l'apparition
const revealElements = document.querySelectorAll('.reveal');
const heroRevealElements = document.querySelectorAll('.hero-reveal');

// Fond animé
const particleState = {
  ctx: null,
  canvas: null,
  width: 0,
  height: 0,
  dpr: 1,
  pointerX: 0,
  pointerY: 0,
  targetX: 0,
  targetY: 0,
  particles: [],
  rafId: 0,
};

const heroTitleState = {
  timerId: null,
};

function animateHeroTitle() {
  if (!heroTitle) return;

  const finalText = heroTitle.dataset.final || heroTitle.textContent.trim();
  const seedText = heroTitle.dataset.seed || finalText;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  heroTitle.textContent = '';

  const seedChars = Array.from(seedText);
  const finalChars = Array.from(finalText);
  const maxLength = Math.max(seedChars.length, finalChars.length);
  const charSpans = [];

  for (let index = 0; index < maxLength; index += 1) {
    const span = document.createElement('span');
    span.className = 'hero-title-char';
    span.setAttribute('aria-hidden', 'true');
    span.classList.add('seed');
    span.textContent = seedChars[index] ?? finalChars[index] ?? ' ';
    heroTitle.appendChild(span);
    charSpans.push(span);
  }

  if (prefersReducedMotion) {
    charSpans.forEach((span, index) => {
      span.textContent = finalChars[index] ?? ' ';
      span.classList.add('visible');
    });
    return;
  }

  const revealChar = index => {
    if (index >= charSpans.length) return;

    const nextValue = finalChars[index] ?? ' ';
    charSpans[index].classList.remove('seed');
    charSpans[index].textContent = nextValue;
    charSpans[index].classList.add('visible');

    heroTitleState.timerId = window.setTimeout(() => revealChar(index + 1), 120);
  };

  heroTitleState.timerId = window.setTimeout(() => revealChar(0), 280);
}

/* ═══════════════════════════════════════════════════════════════
   2. NAVIGATION
═══════════════════════════════════════════════════════════════ */

/* ── 2a. Menu burger (mobile) ──────────────────────────────── */
/*
   Au clic sur le bouton burger :
   - la classe "open" est ajoutée/retirée du bouton (=> animation en X)
   - la classe "open" est ajoutée/retirée du menu (=> il glisse depuis le haut)

   classList.toggle() = si la classe est là, on l'enlève ; sinon on l'ajoute
   C'est l'équivalent d'un interrupteur lumière.
*/
if (burger) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
}

/* Fermer le menu quand on clique un lien (sur mobile) */
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});




/* ── 2b. Navbar qui change d'apparence au scroll ───────────── */
/*
   window.addEventListener('scroll', ...) = "fais ça à chaque fois
   que l'utilisateur fait défiler la page"

   window.scrollY = combien de pixels on a scrollé depuis le haut
*/
window.addEventListener('scroll', () => {

  // ── Navbar : devient plus opaque après 50px de scroll
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // ── Bouton retour en haut : visible après 400px
  if (window.scrollY > 400) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }

  // ── Déclencher les animations au scroll (voir section 4)
  revealOnScroll();

  // ── Déclencher les barres de compétences (voir section 3)
  animateSkillBars();
});


/* ── 2c. Bouton retour en haut ─────────────────────────────── */
if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // défilement fluide
    });
  });
}


/* ═══════════════════════════════════════════════════════════════
   2d. FOND ANIMÉ — particules légères + réaction au pointeur
═══════════════════════════════════════════════════════════════ */

function initAnimatedBackground() {
  if (!particleCanvas) return;

  const ctx = particleCanvas.getContext('2d');
  if (!ctx) return;

  particleState.ctx = ctx;
  particleState.canvas = particleCanvas;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particleCount = prefersReducedMotion ? 30 : 72;

  function resizeCanvas() {
    const { innerWidth, innerHeight, devicePixelRatio } = window;
    particleState.dpr = Math.min(devicePixelRatio || 1, 2);
    particleState.width = innerWidth;
    particleState.height = innerHeight;
    particleCanvas.width = Math.floor(innerWidth * particleState.dpr);
    particleCanvas.height = Math.floor(innerHeight * particleState.dpr);
    particleCanvas.style.width = `${innerWidth}px`;
    particleCanvas.style.height = `${innerHeight}px`;
    ctx.setTransform(particleState.dpr, 0, 0, particleState.dpr, 0, 0);
  }

  function createParticles() {
    particleState.particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * particleState.width,
      y: Math.random() * particleState.height,
      radius: 0.8 + Math.random() * 2.2,
      baseRadius: 0.8 + Math.random() * 2.2,
      speedX: -0.14 + Math.random() * 0.28,
      speedY: -0.16 + Math.random() * 0.32,
      alpha: 0.18 + Math.random() * 0.45,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  function draw() {
    const { ctx, width, height, particles } = particleState;
    ctx.clearRect(0, 0, width, height);

    const pointerInfluence = 0.0062;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      const dx = particle.x - particleState.targetX;
      const dy = particle.y - particleState.targetY;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const repulse = Math.max(0, 1 - distance / 380);

      particle.x += particle.speedX + dx * repulse * pointerInfluence;
      particle.y += particle.speedY + dy * repulse * pointerInfluence;
      particle.pulse += 0.01;
      particle.radius = particle.baseRadius + Math.sin(particle.pulse) * 0.35;

      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;

      ctx.beginPath();
      ctx.fillStyle = `rgba(231, 222, 214, ${particle.alpha})`;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const linkDistance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (linkDistance < 130) {
          const lineAlpha = (1 - linkDistance / 140) * 0.24;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(143, 111, 90, ${lineAlpha})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    }

    particleState.targetX += (particleState.pointerX - particleState.targetX) * 0.18;
    particleState.targetY += (particleState.pointerY - particleState.targetY) * 0.18;

    const pointerGlow = ctx.createRadialGradient(
      particleState.targetX,
      particleState.targetY,
      0,
      particleState.targetX,
      particleState.targetY,
      120,
    );
    pointerGlow.addColorStop(0, 'rgba(159, 130, 111, 0.28)');
    pointerGlow.addColorStop(0.32, 'rgba(143, 111, 90, 0.12)');
    pointerGlow.addColorStop(1, 'rgba(143, 111, 90, 0)');

    ctx.beginPath();
    ctx.fillStyle = pointerGlow;
    ctx.arc(particleState.targetX, particleState.targetY, 120, 0, Math.PI * 2);
    ctx.fill();

    particleState.rafId = window.requestAnimationFrame(draw);
  }

  resizeCanvas();
  createParticles();
  particleState.pointerX = particleState.targetX = particleState.width / 2;
  particleState.pointerY = particleState.targetY = particleState.height / 2;

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });

  window.addEventListener('pointermove', (event) => {
    particleState.pointerX = event.clientX;
    particleState.pointerY = event.clientY;
  });

  window.addEventListener('pointerleave', () => {
    particleState.pointerX = particleState.width / 2;
    particleState.pointerY = particleState.height / 2;
  });

  if (!prefersReducedMotion) {
    draw();
  } else {
    draw();
    window.cancelAnimationFrame(particleState.rafId);
  }
}


/* ═══════════════════════════════════════════════════════════════
   3. BARRES DE COMPÉTENCES — animation
   ══════════════════════════════════════════════════════════════

   Analogie : la barre démarre à 0%, puis "grandit" jusqu'à
   son niveau réel quand elle entre dans l'écran.

   On utilise getBoundingClientRect() pour savoir si une barre
   est visible dans l'écran (viewport).
═══════════════════════════════════════════════════════════════ */

function animateSkillBars() {
  skillBars.forEach(bar => {
    // Si cette barre a déjà été animée, on passe à la suivante
    if (bar.classList.contains('animated')) return;

    const rect = bar.getBoundingClientRect();
    // rect.top < window.innerHeight = la barre est visible dans l'écran
    if (rect.top < window.innerHeight - 50) {
      // data-level = l'attribut HTML data-level="75" → "75"
      const level = bar.getAttribute('data-level');
      // On change la largeur = la barre s'anime grâce à la transition CSS
      bar.style.width = level + '%';
      // Marquer CETTE barre comme animée (pas toutes les barres !)
      bar.classList.add('animated');
    }
  });
}


/* ═══════════════════════════════════════════════════════════════
   4. SCROLL REVEAL — apparition des éléments
   ══════════════════════════════════════════════════════════════

   IntersectionObserver = "surveille cet élément et dis-moi
   quand il entre dans le viewport (l'écran visible)"

   C'est plus performant que d'écouter l'événement scroll manuellement
   car le navigateur optimise lui-même la détection.
═══════════════════════════════════════════════════════════════ */

// On crée un observateur qui surveille chaque élément .reveal
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      // entry.isIntersecting = l'élément est-il visible ?
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Une fois visible, on arrête de surveiller cet élément
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.1,    // déclenche quand 10% de l'élément est visible
    rootMargin: '0px 0px -50px 0px' // déclenche 50px avant le bas de l'écran
  }
);

// On dit à l'observateur de surveiller chaque élément .reveal
revealElements.forEach(el => observer.observe(el));

// Fallback pour les navigateurs qui ne supportent pas IntersectionObserver
function revealOnScroll() {
  revealElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add('visible');
    }
  });
}


/* ═══════════════════════════════════════════════════════════════
   5. FORMULAIRE DE CONTACT — validation
   ══════════════════════════════════════════════════════════════

   On vérifie les champs AVANT d'envoyer.
   Si un champ est vide ou invalide, on affiche un message d'erreur.
   Si tout est bon, on simule l'envoi et on affiche le succès.

   En production, on enverrait les données à un serveur (fetch/AJAX)
   ou à un service comme Formspree.io.
═══════════════════════════════════════════════════════════════ */

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {

    // Empêche le rechargement de la page (comportement HTML par défaut)
    event.preventDefault();

    // On récupère les valeurs des champs
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');

    // On valide chaque champ — isValid sera false si un champ échoue
    let isValid = true;

    isValid = validateField(name, 'name-error', 'Votre nom est requis') && isValid;
    isValid = validateEmail(email, 'email-error') && isValid;
    isValid = validateField(subject, 'subject-error', 'Le sujet est requis') && isValid;
    isValid = validateField(message, 'message-error', 'Votre message est requis') && isValid;

    // Si tout est valide : simuler l'envoi
    if (isValid) {
      // Dans un vrai projet, ici on ferait :
      // fetch('https://formspree.io/f/XXXXX', { method: 'POST', body: new FormData(contactForm) })

      // On désactive le bouton pendant "l'envoi"
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Envoi en cours...';
      submitBtn.disabled = true;

      // Simuler un délai réseau (1.5 secondes)
      setTimeout(() => {
        contactForm.reset();             // vider le formulaire
        submitBtn.textContent = 'Envoyer le message';
        submitBtn.disabled = false;
        successMsg.style.display = 'block'; // afficher le message de succès

        // Cacher le message après 5 secondes
        setTimeout(() => {
          successMsg.style.display = 'none';
        }, 5000);
      }, 1500);
    }
  });
}

/*
   validateField : vérifie qu'un champ n'est pas vide
   - field     = l'élément <input> ou <textarea>
   - errorId   = l'id du <span> où afficher l'erreur
   - errorText = le message à afficher si vide
   Retourne true si valide, false si invalide
*/
function validateField(field, errorId, errorText) {
  const errorSpan = document.getElementById(errorId);

  if (!field.value.trim()) { // .trim() enlève les espaces au début et fin
    field.classList.add('invalid');
    errorSpan.textContent = errorText;
    return false;
  } else {
    field.classList.remove('invalid');
    errorSpan.textContent = '';
    return true;
  }
}

/*
   validateEmail : vérifie le format de l'email avec une regex
   Une regex (expression régulière) est un motif de texte à reconnaître.
   /^[^\s@]+@[^\s@]+\.[^\s@]+$/ = "quelquechose @ quelquechose . quelquechose"
*/
function validateEmail(field, errorId) {
  const errorSpan = document.getElementById(errorId);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!field.value.trim()) {
    field.classList.add('invalid');
    errorSpan.textContent = 'Votre email est requis';
    return false;
  } else if (!emailRegex.test(field.value)) {
    field.classList.add('invalid');
    errorSpan.textContent = 'Format email invalide (exemple@domaine.fr)';
    return false;
  } else {
    field.classList.remove('invalid');
    errorSpan.textContent = '';
    return true;
  }
}

/* Effacer les erreurs quand l'utilisateur retape dans un champ */
document.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('input', () => {
    field.classList.remove('invalid');
    const errorId = field.id + '-error';
    const errorSpan = document.getElementById(errorId);
    if (errorSpan) errorSpan.textContent = '';
  });
});


/* ═══════════════════════════════════════════════════════════════
   6. DÉMARRAGE
   On déclenche les animations au chargement initial de la page
   (pour les éléments déjà visibles sans scroll)
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  revealOnScroll();
  animateSkillBars();
  initAnimatedBackground();
  animateHeroTitle();
  heroRevealElements.forEach((el, index) => {
    el.style.setProperty('--hero-delay', `${index * 0.12}s`);
  });
});

/*
══════════════════════════════════════════════════════════════════
POUR ALLER PLUS LOIN — idées de fonctionnalités à ajouter :

• Thème clair/sombre : localStorage + classList.toggle('dark')
• Compteur animé pour les stats (0 → 100% au scroll)
• Filtre des projets par technologie (boutons + display:none)
• Typewriter effect pour le titre hero
• Particles.js pour un fond animé
══════════════════════════════════════════════════════════════════
*/
