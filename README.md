# Aurélie & Jean-Charles — 17 juin 2028

Site du mariage : programme, brunch, logements et formulaire de réponse.
Mobile d'abord, couleurs et fleurs reprises du faire-part.
Site statique (dossier `public/`), aucun serveur.

## Mettre en ligne sur Vercel

1. vercel.com → **Add New… → Project** → importer ce dépôt GitHub.
2. Nom du projet : `aurelieetjean-charles` → adresse `aurelieetjean-charles.vercel.app`.
3. Framework Preset : **Other**, rien d'autre à changer → **Deploy**.

## Réponses des invités

Chaque réponse du formulaire (noms, présence, adultes, nombre d'enfants présents — obligatoire —, brunch, logement…) est envoyée
via le service gratuit FormSubmit (formsubmit.co). Adresse réglée dans `public/script.js` (`ENVOI`).

Le site tente d'abord un envoi en arrière-plan ; s'il est refusé ou bloqué, il bascule sur un envoi
classique (le navigateur passe par la page FormSubmit puis revient sur le site). En dernier recours,
l'invité peut envoyer sa réponse déjà rédigée par SMS ou par e-mail.

**Activation, une seule fois** : après la mise en ligne, envoyer une réponse de test depuis le site.
FormSubmit envoie alors à cette adresse un e-mail demandant d'activer le formulaire
(regarder aussi dans les indésirables) : cliquer sur **Activate Form**. Les réponses suivantes
arrivent ensuite directement.
