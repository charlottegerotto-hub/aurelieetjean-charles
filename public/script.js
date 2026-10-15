(function () {
  "use strict";

  // ---------- compte à rebours jusqu'à la cérémonie ----------
  var ceremonie = new Date("2028-06-17T15:45:00+02:00").getTime();
  var cj = document.getElementById("cj"), ch = document.getElementById("ch"), cm = document.getElementById("cm");
  function tic() {
    var reste = Math.max(0, ceremonie - Date.now());
    var minutes = Math.floor(reste / 60000);
    cj.textContent = Math.floor(minutes / 1440).toLocaleString("fr-FR");
    ch.textContent = Math.floor((minutes % 1440) / 60);
    cm.textContent = minutes % 60;
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
    if (!donnees.presence) return montreErreur("Dites-nous si vous serez présents ou non.", form.querySelector("fieldset"));
    if (donnees.presence === "oui") {
      var a = parseInt(donnees.adultes, 10), en = parseInt(donnees.enfants || "0", 10);
      if (!(a >= 1 && a <= 20)) return montreErreur("Le nombre d'adultes doit être compris entre 1 et 20.", form.elements.adultes);
      if (!(en >= 0 && en <= 20)) return montreErreur("Le nombre d'enfants doit être compris entre 0 et 20.", form.elements.enfants);
      if (!donnees.brunch) return montreErreur("Dites-nous si vous viendrez au brunch du dimanche.", form.elements.brunch[0].closest("fieldset"));
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
      "Enfants": oui ? (donnees.enfants || "0") : "0",
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
  }

  document.getElementById("modifier").addEventListener("click", function () {
    form.reset();
    bloc.hidden = true;
    merci.hidden = true;
    form.hidden = false;
    form.elements.noms.focus();
  });
})();
