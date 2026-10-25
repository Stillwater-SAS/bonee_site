// Page de traitement des liens Firebase (vérification d'e-mail, réinitialisation du mot de passe).
// Appelle l'API REST Firebase Authentication : aucune bibliothèque tierce, compatible avec la CSP.
(function () {
  'use strict';

  var API = 'https://identitytoolkit.googleapis.com/v1/accounts:';
  var params = new URLSearchParams(window.location.search);
  var mode = params.get('mode');
  var code = params.get('oobCode');

  var titre = document.getElementById('titre');
  var message = document.getElementById('message');
  var formulaire = document.getElementById('formulaire');
  var suite = document.getElementById('suite');

  var ERREURS = {
    EXPIRED_OOB_CODE: 'Ce lien a expiré. Redemande-en un depuis l\'application.',
    INVALID_OOB_CODE: 'Ce lien est invalide ou a déjà été utilisé. Redemande-en un depuis l\'application.',
    USER_DISABLED: 'Ce compte est désactivé.',
    WEAK_PASSWORD: 'Le mot de passe est trop faible (8 caractères minimum).'
  };

  function afficher(t, m, fini) {
    titre.textContent = t;
    message.textContent = m;
    formulaire.hidden = true;
    suite.hidden = !fini;
  }

  function echec(erreur) {
    var cle = String(erreur && erreur.message || '').split(' ')[0];
    afficher('Lien inutilisable', ERREURS[cle] || 'Une erreur est survenue. Réessaie depuis l\'application.', false);
  }

  function appeler(methode, corps) {
    return fetch(API + methode + '?key=' + encodeURIComponent(window.BONEE_FIREBASE_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps)
    }).then(function (reponse) {
      return reponse.json().then(function (donnees) {
        if (!reponse.ok) throw new Error(donnees && donnees.error && donnees.error.message);
        return donnees;
      });
    });
  }

  function verifierEmail() {
    appeler('update', { oobCode: code }).then(function () {
      afficher('Adresse e-mail validée', 'Merci ! Ton adresse est confirmée.', true);
    }).catch(echec);
  }

  function reinitialiser() {
    appeler('resetPassword', { oobCode: code }).then(function (donnees) {
      afficher('Nouveau mot de passe', 'Choisis un nouveau mot de passe pour ' + donnees.email + '.', false);
      formulaire.hidden = false;
    }).catch(echec);

    formulaire.addEventListener('submit', function (evenement) {
      evenement.preventDefault();
      var mdp = document.getElementById('mdp').value;
      if (mdp !== document.getElementById('mdp2').value) {
        message.textContent = 'Les deux mots de passe sont différents.';
        return;
      }
      appeler('resetPassword', { oobCode: code, newPassword: mdp }).then(function () {
        afficher('Mot de passe modifié', 'Tu peux te connecter avec ton nouveau mot de passe.', true);
      }).catch(echec);
    });
  }

  if (!code || !window.BONEE_FIREBASE_API_KEY) {
    afficher('Lien incomplet', 'Ce lien est incomplet. Redemande-en un depuis l\'application.', false);
  } else if (mode === 'verifyEmail') {
    verifierEmail();
  } else if (mode === 'resetPassword') {
    reinitialiser();
  } else {
    afficher('Action non prise en charge', 'Cette action n\'est pas disponible sur cette page.', false);
  }
})();
