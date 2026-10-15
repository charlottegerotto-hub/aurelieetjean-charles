(function () {
  "use strict";

  // ---------- compte à rebours jusqu'à la cérémonie ----------
  var ceremonie = new Date("2028-06-17T15:45:00+02:00").getTime();
  var cj = document.getElementById("cj"), ch = document.getElementById("ch"), cm = document.getElementById("cm");
  function tic() {
    var reste = Math.max(0, ceremonie - Date.now());
    var minutes = Math.floor(reste / 60000);
    pose(cj, Math.floor(minutes / 1440).toLocaleString("fr-FR"));
    pose(ch, String(Math.floor((minutes % 1440) / 60)));
    pose(cm, String(minutes % 60));
  }
  function pose(el, texte) {
    if (el.textContent === texte) return;
    var premier = el.textContent === "–";
    el.textContent = texte;
    if (!premier) { el.classList.remove("bat"); void el.offsetWidth; el.classList.add("bat"); }
  }
  tic();
  setInterval(tic, 30000);

  // ---------- copier un numéro de téléphone ----------
  var toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  var minuterie;
  function annonce(texte) {
    toast.textContent = texte;
    toast.classList.add("visible");
    clearTimeout(minuterie);
    minuterie = setTimeout(function () { toast.classList.remove("visible"); }, 2200);
  }
  document.querySelectorAll(".numero").forEach(function (el) {
    el.setAttribute("title", "Toucher pour copier");
    el.addEventListener("click", function () {
      var numero = el.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(numero).then(function () { annonce("Numéro copié : " + numero); }, function () {});
      }
    });
  });

  // ---------- formulaire de réponse ----------
  // Les réponses partent par e-mail via FormSubmit (formsubmit.co), sans serveur à nous.
  var ENVOI = "https://formsubmit.co/ajax/aurelie.haton@hotmail.com";
  var form = document.getElementById("formulaire");
  var bloc = document.getElementById("si-present");
  var erreur = document.getElementById("erreur");
  var bouton = document.getElementById("envoyer");
  var merci = document.getElementById("merci");
  var merciTexte = document.getElementById("merci-texte");

  function valeur(nom) {
    var el = form.elements[nom];
    return el ? String(el.value || "").trim() : "";
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "presence") bloc.hidden = e.target.value !== "oui";
    if (e.target.closest(".invalide-groupe")) e.target.closest(".invalide-groupe").classList.remove("invalide-groupe");
    if (e.target.classList.contains("invalide")) e.target.classList.remove("invalide");
  });
  form.addEventListener("input", function (e) {
    if (e.target.classList.contains("invalide")) e.target.classList.remove("invalide");
  });

  function montreErreur(texte, champ) {
    erreur.textContent = texte;
    erreur.hidden = false;
    if (champ) {
      champ.classList.add(champ.tagName === "FIELDSET" ? "invalide-groupe" : "invalide");
      champ.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    erreur.hidden = true;

    var donnees = {
      noms: valeur("noms"),
      presence: valeur("presence"),
      adultes: valeur("adultes"),
      enfants: valeur("enfants"),
      brunch: valeur("brunch"),
      logement: valeur("logement"),
      regime: valeur("regime"),
      telephone: valeur("telephone"),
      message: valeur("message"),
      site: valeur("site")
    };

    if (!donnees.noms) return montreErreur("Indiquez vos prénoms et noms pour que nous sachions qui répond.", form.elements.noms);
    if (!donnees.presence) return montreErreur("Dites-nous si vous serez présents ou non.", document.getElementById("groupe-presence"));
    if (donnees.presence === "oui") {
      var a = parseInt(donnees.adultes, 10), en = parseInt(donnees.enfants, 10);
      if (!(a >= 1 && a <= 20)) return montreErreur("Indiquez le nombre d'adultes (entre 1 et 20).", form.elements.adultes);
      if (donnees.enfants === "") return montreErreur("Indiquez le nombre d'enfants présents (0 s'il n'y en a pas).", form.elements.enfants);
      if (!(en >= 0 && en <= 20)) return montreErreur("Le nombre d'enfants doit être compris entre 0 et 20.", form.elements.enfants);
      if (!donnees.brunch) return montreErreur("Dites-nous si vous viendrez au brunch du dimanche.", document.getElementById("groupe-brunch"));
    } else {
      donnees.adultes = "0"; donnees.enfants = "0"; donnees.brunch = ""; donnees.logement = ""; donnees.regime = "";
    }

    bouton.disabled = true;
    bouton.textContent = "Envoi en cours…";

    // un robot a rempli le champ invisible : on fait semblant d'avoir envoyé
    if (donnees.site) return remercie(donnees);

    var oui = donnees.presence === "oui";
    var logements = { domaine: "Au domaine", ailleurs: "Ailleurs", indecis: "Ne sait pas encore" };
    var courriel = {
      _subject: "Réponse mariage : " + (oui ? "OUI" : "NON") + " - " + donnees.noms,
      _template: "table",
      _captcha: "false",
      "Noms": donnees.noms,
      "Présence": oui ? "Oui" : "Non",
      "Adultes": oui ? donnees.adultes : "0",
      "Enfants présents": oui ? donnees.enfants : "0",
      "Brunch du dimanche": oui ? (donnees.brunch === "oui" ? "Oui" : "Non") : "-",
      "Logement": oui ? (logements[donnees.logement] || "Non précisé") : "-",
      "Allergies / régime": donnees.regime || "-",
      "Téléphone": donnees.telephone || "-",
      "Message": donnees.message || "-"
    };

    fetch(ENVOI, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(courriel)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || String(res.j.success) !== "true") throw new Error("");
        remercie(donnees);
      })
      .catch(function () {
        montreErreur("L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez, ou envoyez-nous un SMS au 07 89 02 06 69.");
      })
      .finally(function () {
        bouton.disabled = false;
        bouton.textContent = "Envoyer ma réponse";
      });
  });

  function remercie(donnees) {
    form.hidden = true;
    merciTexte.textContent = donnees.presence === "oui"
      ? "Votre réponse est bien arrivée. Nous avons hâte de vous retrouver le 17 juin 2028 !"
      : "Votre réponse est bien arrivée. Vous nous manquerez, nous penserons à vous.";
    merci.hidden = false;
    merci.focus();
    if (donnees.presence === "oui") fete(window.innerWidth / 2, window.innerHeight * 0.45, 70);
  }

  // ---------- effets ----------
  var calme = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COULEURS = ["#d9346f", "#ee7939", "#fbceba", "#f29bb8", "#919d74", "#f6b58f"];

  // pluie de cœurs et de pétales qui jaillit d'un point
  var zoneFete = document.getElementById("fete");
  function fete(x, y, nombre) {
    if (calme || !zoneFete.animate) return;
    for (var i = 0; i < nombre; i++) {
      var p = document.createElement("span");
      var coeur = Math.random() < 0.55;
      var taille = coeur ? 12 + Math.random() * 16 : 8 + Math.random() * 8;
      p.textContent = coeur ? "♥" : "";
      p.style.color = COULEURS[i % COULEURS.length];
      p.style.fontSize = taille + "px";
      if (!coeur) {
        p.style.width = taille + "px"; p.style.height = taille * 0.6 + "px";
        p.style.background = COULEURS[i % COULEURS.length];
        p.style.borderRadius = "60% 0 60% 0";
      }
      zoneFete.appendChild(p);
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      var force = 160 + Math.random() * 260;
      var dx = Math.cos(angle) * force, dy = Math.sin(angle) * force;
      var tour = (Math.random() - 0.5) * 720;
      var duree = 1600 + Math.random() * 1400;
      p.animate([
        { transform: "translate(" + x + "px," + y + "px) scale(.4) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + (x + dx) + "px," + (y + dy) + "px) scale(1) rotate(" + tour / 2 + "deg)", opacity: 1, offset: 0.35 },
        { transform: "translate(" + (x + dx * 1.4) + "px," + (y + dy + 520) + "px) scale(.9) rotate(" + tour + "deg)", opacity: 0 }
      ], { duration: duree, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }
  document.getElementById("monogramme").addEventListener("click", function (e) {
    fete(e.clientX, e.clientY, 28);
  });

  // apparition des blocs au défilement : seulement ceux encore hors de l'écran au chargement
  if (!calme && "IntersectionObserver" in window) {
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("revele"); observateur.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-revele]").forEach(function (el, i) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("a-reveler");
        el.style.transitionDelay = (i % 3) * 0.08 + "s";
        observateur.observe(el);
      }
    });
  }

  // pétales qui tombent dans l'en-tête
  var toile = document.getElementById("petales");
  if (!calme && toile.getContext) {
    var ctx = toile.getContext("2d"), hero = toile.parentNode, petales = [], L = 0, H = 0, ratio = 1, actif = false;
    function dimensionne() {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      L = hero.clientWidth; H = hero.clientHeight;
      toile.width = L * ratio; toile.height = H * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function nouveau(haut) {
      return {
        x: Math.random() * L, y: haut ? -20 - Math.random() * H * 0.3 : Math.random() * H,
        t: 6 + Math.random() * 8, v: 0.35 + Math.random() * 0.55,
        a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.04,
        o: Math.random() * 6.28, c: COULEURS[Math.floor(Math.random() * 4)], al: 0.55 + Math.random() * 0.35
      };
    }
    dimensionne();
    var n = L < 640 ? 16 : 26;
    for (var k = 0; k < n; k++) petales.push(nouveau(false));
    window.addEventListener("resize", dimensionne);
    new IntersectionObserver(function (e) {
      var etait = actif;
      actif = e[0].isIntersecting;
      if (actif && !etait) requestAnimationFrame(dessine);
    }).observe(hero);
    function dessine() {
      if (!actif) return;
      ctx.clearRect(0, 0, L, H);
      for (var i = 0; i < petales.length; i++) {
        var p = petales[i];
        p.o += 0.012; p.a += p.va;
        p.y += p.v; p.x += Math.sin(p.o) * 0.6;
        if (p.y > H + 20) petales[i] = p = nouveau(true);
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.o * 2))); // le pétale tourne sur lui-même
        ctx.globalAlpha = p.al; ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.moveTo(0, -p.t / 2);
        ctx.bezierCurveTo(p.t * 0.6, -p.t / 2, p.t * 0.5, p.t / 2, 0, p.t / 2);
        ctx.bezierCurveTo(-p.t * 0.5, p.t / 2, -p.t * 0.6, -p.t / 2, 0, -p.t / 2);
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(dessine);
    }
  }

  document.getElementById("modifier").addEventListener("click", function () {
    form.reset();
    bloc.hidden = true;
    merci.hidden = true;
    form.hidden = false;
    form.elements.noms.focus();
  });
})();
