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

// Toutes les barres de compétences (NodeList = liste d'éléments)
const skillBars = document.querySelectorAll('.skill-progress');

// Tous les éléments à animer à l'apparition
const revealElements = document.querySelectorAll('.reveal');


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
   3. BARRES DE COMPÉTENCES — animation
   ══════════════════════════════════════════════════════════════

   Analogie : la barre démarre à 0%, puis "grandit" jusqu'à
   son niveau réel quand elle entre dans l'écran.

   On utilise getBoundingClientRect() pour savoir si une barre
   est visible dans l'écran (viewport).
═══════════════════════════════════════════════════════════════ */

let skillsAnimated = false; // on n'anime qu'une seule fois

function animateSkillBars() {
  // Si déjà animé, on ne fait rien
  if (skillsAnimated) return;

  skillBars.forEach(bar => {
    const rect = bar.getBoundingClientRect();
    // rect.top < window.innerHeight = la barre est visible dans l'écran
    if (rect.top < window.innerHeight - 50) {
      // data-level = l'attribut HTML data-level="75" → "75"
      const level = bar.getAttribute('data-level');
      // On change la largeur = la barre s'anime grâce à la transition CSS
      bar.style.width = level + '%';
      skillsAnimated = true;
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