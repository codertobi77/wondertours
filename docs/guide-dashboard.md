# Guide d'utilisation du tableau de bord — Wonder Tours and Services

> Document destiné à l'équipe de **Wonder Tours and Services** — manuel d'utilisation du back-office du site [wondertoursandservices.com](https://wondertoursandservices.com).
> Version 1.0 — Novembre 2026.

---

## Sommaire

1. [Accéder au tableau de bord](#1-accéder-au-tableau-de-bord)
2. [Découvrir l'écran d'accueil](#2-découvrir-lécran-daccueil)
3. [Comprendre les rôles d'utilisateur](#3-comprendre-les-rôles-dutilisateur)
4. [Gérer les circuits](#4-gérer-les-circuits)
5. [Gérer les destinations et catégories](#5-gérer-les-destinations-et-catégories)
6. [Gérer les services](#6-gérer-les-services)
7. [Gérer les témoignages](#7-gérer-les-témoignages)
8. [Gérer le blog](#8-gérer-le-blog)
9. [Suivre les réservations](#9-suivre-les-réservations)
10. [Traiter les demandes de contact](#10-traiter-les-demandes-de-contact)
11. [Utiliser la médiathèque](#11-utiliser-la-médiathèque)
12. [Gérer les comptes utilisateurs (admin)](#12-gérer-les-comptes-utilisateurs-admin)
13. [Configurer les paramètres du site](#13-configurer-les-paramètres-du-site)
14. [Publier les modifications sur le site](#14-publier-les-modifications-sur-le-site)
15. [Récapitulatif des emails automatiques](#15-récapitulatif-des-emails-automatiques)
16. [Bonnes pratiques et dépannage](#16-bonnes-pratiques-et-dépannage)

---

## 1. Accéder au tableau de bord

### Se connecter

1. Ouvrez **https://wondertoursandservices.com/dashboard** dans votre navigateur.
2. Saisissez votre **email** et votre **mot de passe**, puis cliquez sur **« Se connecter »**.
3. L'icône en forme d'œil à droite du champ mot de passe permet d'afficher ou masquer ce que vous tapez.

Après la connexion, vous arrivez sur la page d'accueil du tableau de bord. Votre session reste active pendant **7 jours** sur le même navigateur : vous n'avez pas besoin de vous reconnecter à chaque visite.

> 💡 Mettez la page en favori : `wondertoursandservices.com/dashboard`.

### Mot de passe oublié

1. Sur la page de connexion, cliquez sur **« Mot de passe oublié ? »**.
2. Saisissez votre email et cliquez sur **« Envoyer le lien »**.
3. Vous recevez un email contenant un lien de réinitialisation. **Ce lien expire au bout d'une heure (60 minutes) et ne peut être utilisé qu'une seule fois.**
4. Suivez le lien, saisissez un **nouveau mot de passe (8 caractères minimum)**, confirmez-le, puis cliquez sur **« Modifier le mot de passe »**.

> 💡 Si l'email n'arrive pas dans les minutes qui suivent, vérifiez votre dossier **spam / indésirables**. Si l'erreur persiste, demandez un nouveau lien.

### Se déconnecter

En haut à droite de l'écran, ouvrez le menu utilisateur (votre avatar) puis cliquez sur **« Déconnexion »**. À faire notamment sur un ordinateur partagé.

### Le menu latéral

Le menu à gauche (vous pouvez l'ouvrir avec le bouton ☰ en haut à gauche sur mobile) donne accès à :

| Menu | Contenu |
|------|---------|
| Tableau de bord | Vue d'ensemble et statistiques |
| Circuits | Catalogue des circuits touristiques |
| Destinations | Pays et régions proposés |
| Catégories | Catégories des circuits |
| Témoignages | Avis des voyageurs |
| Blog | Articles du blog |
| Catégories blog | Catégories des articles |
| Services | Services présentés sur le site |
| Réservations | Réservations reçues du site |
| Contact | Demandes de devis reçues |
| Médiathèque | Images du site |
| Utilisateurs | Comptes de l'équipe (**admin uniquement**) |
| Paramètres | Coordonnées et informations du site |

En bas du menu, le lien **« ← Retour au site »** ouvre la partie publique du site.

---

## 2. Découvrir l'écran d'accueil

La page d'accueil affiche un aperçu de l'activité de l'agence :

**Quatre indicateurs en haut :**

| Indicateur | Signification |
|------------|---------------|
| **Circuits actifs** | Nombre de circuits visibles sur le site, avec le total et le nombre « à la une » |
| **Réservations ce mois** | Réservations reçues ce mois-ci, avec les compteurs « en attente » et « confirmées » |
| **Demandes de contact** | Demandes de devis reçues, avec les « nouvelles » et celles « en cours » |
| **Revenus ce mois** | Montant total (FCFA) des réservations du mois |

**Deux listes d'activité récente** : les 5 dernières **réservations** et les 5 dernières **demandes de contact**, avec leur statut. Le bouton **« Voir toutes les réservations »** / **« Voir toutes les demandes »** ouvre la liste complète.

**Actions rapides** : raccourcis vers les tâches les plus courantes — **« + Nouveau circuit »**, **« + Nouvel article »**, **« + Nouvelle destination »**, **« Paramètres »**.

---

## 3. Comprendre les rôles d'utilisateur

Chaque membre de l'équipe dispose d'un compte avec un rôle précis :

| Rôle | Ce qu'il peut faire |
|------|---------------------|
| **Administrateur** | Tout : contenus, réservations, médiathèque, paramètres, **gestion des comptes utilisateurs** |
| **Éditeur** | Gérer les contenus, les réservations, les contacts, la médiathèque et les paramètres — **mais pas les comptes utilisateurs** |
| **Lecteur** | **Consultation uniquement** : il voit tout le contenu mais ne peut rien créer, modifier ni supprimer |

Ce que vous pouvez faire se reflète dans l'interface : le menu « Utilisateurs » n'apparaît que pour les administrateurs, le bouton « Publier le site » n'apparaît pas pour les lecteurs, et les boutons de modification sont masqués ou refusés si votre rôle ne le permet pas.

Votre rôle est affiché dans le menu utilisateur en haut à droite : **Administrateur**, **Éditeur** ou **Lecteur**.

---

## 4. Gérer les circuits

Le menu **Circuits** ouvre le catalogue affiché dans la partie publique du site.

### La liste des circuits

- Le champ **« Rechercher un circuit… »** filtre la liste en temps réel.
- Chaque ligne affiche : le titre, la destination, la catégorie, la durée, le prix, le statut et les actions.
- Le badge ambre **« À la une »** signale les circuits mis en avant sur la page d'accueil du site.
- Le statut **« actif » / « inactif »** indique si le circuit est visible sur le site public.

**Actions sur chaque circuit :**

| Icône | Action | Effet |
|-------|--------|-------|
| 👁 | **Activer / Désactiver** | Rend le circuit visible ou invisible sur le site, sans le supprimer |
| ✏️ | **Modifier** | Ouvre le formulaire d'édition |
| 🗑 | **Supprimer** | Supprime définitivement le circuit (une confirmation est demandée) |

> ⚠️ La suppression est définitive. Pour retirer temporairement un circuit du site, préférez **Désactiver**.

### Créer ou modifier un circuit

Cliquez sur **« Nouveau circuit »** (ou l'icône crayon), remplissez le formulaire puis cliquez sur **« Enregistrer »**.

**Informations de base** *(les champs marqués \* sont obligatoires)* :
- **Titre (FR) \*** — obligatoire. Le titre affiché sur le site en français.
- Titre (EN) — la version anglaise ; voir « Traduction automatique » ci-dessous.
- Sous-titre (FR / EN) et Description (FR / EN).

**Itinéraire** :
- **Durée (jours)** et **Durée (nuits)** — laissées vides pour un circuit sur mesure.
- **Programme détaillé FR** — écrivez **une ligne par jour**, au format `Titre : description`, par exemple :
  ```
  Jour 1 : Arrivée à Cotonou et transfert à Ouidah
  Jour 2 : Visite de la Porte du Non-Retour et des temples vodoun
  ```

**Points forts** et **Inclus / Non inclus** : **un élément par ligne** (un point fort par ligne, un service inclus par ligne, etc.).

**Détails** :
- **Destination** — à choisir dans la liste déroulante (créez d'abord la destination si elle n'existe pas).
- **Prix (FCFA) \*** — obligatoire.
- **Difficulté** — Facile / Modéré / Difficile (par défaut « Modéré »).
- **Min. / Max. participants**.
- **URL de l'image principale** — copiez l'URL d'une image de la médiathèque (voir §11).

**Catégories** : cochez toutes les catégories qui s'appliquent (plusieurs possibles).

**Statut** :
- **Actif** (coché par défaut) — circuit visible sur le site.
- **À la une** — le circuit apparaît en avant sur la page d'accueil.

### Traduction automatique en anglais

Chaque formulaire de contenu propose le bouton **« Traduire en anglais (DeepL) »** : il remplit automatiquement tous les champs anglais (titre, sous-titre, description, points forts, programme, inclus / non inclus) à partir des champs français.

1. Rédigez d'abord **tous les champs français**.
2. Cliquez sur **« Traduire en anglais (DeepL) »** et patientez (mention « Traduction… »).
3. Relisez les champs anglais générés, ajustez si besoin, puis **« Enregistrer »**.

> 💡 La traduction nécessite le service DeepL. Si elle échoue, vous pouvez toujours saisir les textes anglais à la main.

---

## 5. Gérer les destinations et catégories

### Destinations

Les destinations (Bénin, Togo, Ghana…) structurent le catalogue du site.

**Formulaire** : **Nom (FR) \*** obligatoire, Nom (EN), Description (FR / EN), **Pays**, **Région**, **URL de l'image**, et la case **« Actif »** (cochée par défaut). Bouton **« Traduire en anglais (DeepL) »** disponible.

Sur la liste, chaque carte affiche le nom, la région / pays et le badge « active » / « inactive », avec les mêmes actions Activer-Désactiver / Modifier / Supprimer.

### Catégories de circuits

Elles organisent le catalogue (Histoire, Nature, Littoral, Aventure…) et apparaissent comme filtres sur le site public.

**Formulaire** :
- **Nom (FR) \*** obligatoire, Nom (EN), Description (FR / EN) + bouton Traduire.
- **Icône** — à choisir dans la liste (Monument, Histoire, Nature, Littoral, Vodoun, Expérience locale, Aventure, Photographie, Gastronomie, Musique).
- **Couleur** — le sélecteur de couleur identifie visuellement la catégorie sur le site.
- **Ordre d'affichage** — plus le nombre est petit, plus la catégorie apparaît tôt dans les listes.
- Case **« Actif »**.

> 💡 Créez d'abord vos catégories et destinations, puis vos circuits : le formulaire de circuit les proposera dans leurs listes déroulantes.

---

## 6. Gérer les services

Les services (transport, hébergement, guide…) sont présentés sur la page d'accueil du site.

**Formulaire** : **Titre (FR) \*** obligatoire, Titre (EN), Description (FR / EN) + bouton Traduire, **Lien (URL)** — la page vers laquelle le service pointe (ex. `/circuits`), une **Icône** (Carte, Calendrier, Hôtel, Guide, Transport, Vol, Restauration, Photographie, Divertissement, Bien-être, Premium), l'**Ordre d'affichage** et la case **« Actif »**.

---

## 7. Gérer les témoignages

Les témoignages sont les avis des voyageurs, affichés sur le site public. **Les visiteurs peuvent en laisser eux-mêmes** depuis la page Témoignages du site (« Laissez-nous votre avis ») : l'avis est **publié immédiatement** et l'équipe reçoit un email de notification. Dans le dashboard, chaque avis reçu peut être **masqué** (décocher « Actif ») ou **supprimé** s'il est inapproprié ; la case « Vérifié » sert à confirmer qu'un avis a été relu par l'équipe.

> 💡 Un avis publié par un visiteur porte le badge « masqué / visible » mais pas « vérifié » : relisez-le dans le dashboard et cochez « Vérifié » s'il est authentique. En cas de contenu illégal ou offensant, supprimez-le ou décochez « Actif » pour le retirer du site.

### Le formulaire (dashboard)

- **Informations client** : **Nom complet \*** (obligatoire), **Pays**, et **« Circuit / Service concerné »** (liste déroulante des circuits).
- **Contenu** : **Note \*** — cliquez sur les étoiles (de 1 à 5) ; **Témoignage (FR) \*** — 10 caractères minimum ; Témoignage (EN) + bouton Traduire ; **Date du voyage**.
- **Photo du client** : URL de la photo (copiée depuis la médiathèque).
- **Statut** :
  - **Vérifié** — l'avis a été contrôlé par l'équipe (badge « vérifié » sur le site) ;
  - **À la une** — l'avis apparaît en avant sur la page d'accueil ;
  - **Actif** — l'avis est visible sur le site.

> ⚠️ Seuls les témoignages **actifs** apparaissent sur le site public : relisez chaque avis avant de le rendre visible.

---

## 8. Gérer le blog

### La liste des articles

Colonnes : Article, Catégorie, Publié le, Vues, Statut, Actions. Le statut est **« publié »** ou **« brouillon »** : seul un article **publié** est visible sur le site.

**Actions** : **« Dépublier » / « Publier »** (masque ou affiche l'article), **Modifier**, **Supprimer** (avec confirmation).

### Rédiger un article

Cliquez sur **« Nouvel article »**. Le formulaire propose **deux boutons d'enregistrement** :

- **« Brouillon »** — enregistre l'article sans le publier : vous pourrez le reprendre plus tard ;
- **« Publier »** — enregistre l'article et le rend immédiatement visible sur le site.

Champs :
- **Informations de base** : **Titre (FR) \*** (3 caractères min.), Titre (EN), Extrait (FR / EN) — le petit texte d'accroche affiché dans les listes d'articles.
- **Contenu** : **Contenu (FR) \*** (10 caractères min.) — le corps de l'article ; Contenu (EN) + bouton Traduire.
- **Détails** : **Catégorie** (liste déroulante), **URL de l'image de couverture**, **Tags** séparés par des virgules (ex. `voyage, bénin, culture`), **Temps de lecture (minutes)**.
- **Statut** : case **« À la une »** pour mettre l'article en avant.

> 💡 Publiez la version française d'abord, puis utilisez « Traduire en anglais (DeepL) » et complétez les champs anglais avant un second enregistrement.

### Catégories de blog

Même logique que les catégories de circuits : **Nom (FR) \***, Nom (EN), Description (FR / EN) + Traduire, **Couleur**, **Ordre d'affichage** et case **« Actif »**.

---

## 9. Suivre les réservations

Quand un visiteur réserve un circuit sur le site, la réservation apparaît ici avec une **référence unique de la forme `WT-XXXXXX`** (ex. `WT-482913`). Cette référence est utilisée dans tous les emails du client : citez-la dans vos échanges.

### La liste

Colonnes : **Référence, Client, Circuit, Date, Participants, Prix, Statut, Actions**. La recherche accepte le nom du client, son email ou la référence.

### Les statuts et leur signification

| Statut | Quand l'utiliser |
|--------|------------------|
| **En attente** (jaune) | Statut initial : la réservation attend votre traitement |
| **Confirmée** (vert) | Vous avez validé la réservation avec le client |
| **Annulée** (rouge) | La réservation n'aura pas lieu |
| **Terminée** (bleu) | Le voyage a eu lieu |

### Changer le statut

Sur chaque ligne, trois boutons :

- ✓ **« Confirmer »** → passe la réservation en *Confirmée* ;
- ✗ **« Annuler »** → passe en *Annulée* ;
- 📦 **« Marquer terminé »** → passe en *Terminée*.

> 📧 **Important** : à chaque changement de statut, **un email est envoyé automatiquement au client** (ex. « Votre réservation WT-482913 est confirmée »). Le client est donc informé sans action de votre part — pensez-y avant de cliquer.

> ⚠️ Il n'est pas possible de créer une réservation manuellement dans le dashboard : les réservations viennent uniquement du site public. Pour une réservation prise par téléphone, utilisez votre processus habituel.

---

## 10. Traiter les demandes de contact

Chaque formulaire de devis rempli sur le site arrive ici.

### La liste

Colonnes : **Contact, Sujet, Type, Reçue le, Statut, Actions**. Le **Type** indique l'objet de la demande : circuit, séjour, hôtel, information ou autre. La recherche accepte le nom, l'email ou le sujet.

### Les statuts

| Statut | Signification |
|--------|---------------|
| **Nouvelle** (bleu) | Demande reçue, pas encore traitée |
| **En cours** (jaune) | Vous êtes en train de traiter la demande |
| **Répondue** (vert) | Vous avez répondu au visiteur |
| **Clôturée** (gris) | Dossier terminé |

### Traiter une demande

Sur chaque ligne : 🕐 **« En cours »**, ✓ **« Répondre »** (passe en Répondue) et 📦 **« Clôturer »**.

> 📧 Contrairement aux réservations, **aucun email automatique n'est envoyé** au changement de statut : c'est à vous de répondre au visiteur par email ou téléphone avec l'adresse affichée dans la demande. Le statut sert de suivi interne.

> 💡 À la réception d'une demande, le visiteur reçoit automatiquement un **accusé de réception** lui promettant une réponse sous 24 à 48 h — pensez à respecter ce délai.

---

## 11. Utiliser la médiathèque

La médiathèque centralise les **images du site**. C'est d'elle que vous copiez les URL à coller dans les formulaires (circuits, destinations, articles, témoignages).

### Uploader une image

1. Dans le bloc **« Ajouter un fichier »**, sélectionnez votre image : **JPEG, PNG, WebP, GIF ou SVG — 5 Mo maximum**.
2. Renseignez le **texte alternatif FR** (et EN) : c'est la description de l'image pour l'accessibilité et Google (ex. « Plage d'Ouidah au coucher du soleil »). Fortement recommandé.
3. Cliquez sur **« Uploader »**.

> 💡 Les images sont **automatiquement compressées** par le navigateur avant l'envoi (redimensionnées à 1920 px de large au maximum) : inutile de les optimiser à la main.

### Utiliser une image dans un formulaire

1. Ouvrez la **Médiathèque**.
2. Sur la miniature, cliquez sur le bouton **copier l'URL** (une coche verte confirme la copie).
3. Collez l'URL dans le champ « URL de l'image » du formulaire concerné.

### Gérer les fichiers existants

- **Rechercher** un fichier par nom ou texte alternatif avec le champ de recherche.
- **« Modifier les textes alternatifs »** — corrige les descriptions FR / EN après coup.
- 🗑 **Supprimer** — retire le fichier de la médiathèque (avec confirmation).

> ⚠️ Avant de supprimer une image, vérifiez qu'elle n'est pas encore utilisée par un circuit, un article ou un témoignage : son URL cessera d'afficher l'image.

---

## 12. Gérer les comptes utilisateurs (admin)

Le menu **Utilisateurs** est réservé aux **administrateurs** : il liste les comptes de l'équipe (Nom, Email, Rôle, Statut, Créé le).

### Créer un compte

1. Cliquez sur **« Nouvel utilisateur »**.
2. Renseignez **Prénom \***, **Nom \***, **Email \***.
3. Choisissez le **Rôle \*** : **Administrateur**, **Éditeur** ou **Lecteur** (défaut : Éditeur).
4. Saisissez un **mot de passe** (8 caractères minimum) et confirmez-le.
5. Laissez la case **« Actif »** cochée, puis cliquez sur **« Créer »**.

Le nouvel utilisateur reçoit automatiquement un **email de bienvenue** (« Votre compte Wonder Tours est prêt ») avec le lien du dashboard et la procédure de mot de passe. **Le mot de passe n'est jamais envoyé par email** : transmettez-le à votre collègue par un canal sûr (de vive voix, par exemple), ou invitez-le à utiliser « Mot de passe oublié ».

### Gérer un compte

- ✏️ **Modifier** — changer le nom, l'email, le rôle ou le mot de passe (champ « Nouveau mot de passe » : laissez vide pour conserver l'actuel).
- 🗑 **Supprimer** — supprime définitivement le compte.
- **Désactiver** un compte (décocher « Actif ») : la personne ne pourra **plus se connecter**, sans supprimer son historique.

> ⚠️ Gardez le compte **Administrateur** pour les seules personnes qui en ont réellement besoin, et ne créez des comptes « Éditeur » et « Lecteur » que si nécessaire.

---

## 13. Configurer les paramètres du site

Le menu **Paramètres** regroupe les informations générales affichées sur le site public (pied de page, page « À propos », coordonnées) :

| Groupe | Champs |
|--------|--------|
| **Informations du site** | Nom du site, Description |
| **Informations de contact** | Email, Téléphone, Adresse |
| **Réseaux sociaux** | Facebook, Instagram, YouTube, WhatsApp |
| **Biographie du fondateur** | Biographie — français, Biographie — anglais |
| **SEO** | URL du site |

Modifiez les champs, puis cliquez sur **« Enregistrer les modifications »**. La confirmation « Paramètres enregistrés. » s'affiche.

> 💡 Renseignez de vrais comptes de réseaux sociaux (URL complètes, ex. `https://www.facebook.com/wondertours`) : ils apparaissent dans le pied de page du site.

---

## 14. Publier les modifications sur le site

En haut de l'écran, le bouton **« Publier le site »** (visible pour les administrateurs et éditeurs) **régénère la partie publique du site** pour refléter vos derniers changements.

- Cliquez dessus après une série de modifications importantes.
- Un message confirme : « Rebuild déclenché — le site sera mis à jour dans ~3 min. »
- Patientez environ **3 minutes**, puis vérifiez le résultat sur le site public (actualisez la page avec `Ctrl + F5` si nécessaire).

> 💡 À retenir : **enregistrer ≠ publier**. L'enregistrement sauvegarde en base ; le bouton « Publier le site » rend les changements visibles sur le site public.

---

## 15. Récapitulatif des emails automatiques

Le site envoie automatiquement les emails suivants :

| Événement | Destinataire | Email |
|-----------|--------------|-------|
| Demande de contact (site public) | Visiteur | Accusé de réception (réponse promise sous 24–48 h) |
| Demande de contact (site public) | L'équipe | Notification interne avec le détail de la demande |
| Réservation (site public) | Client | Confirmation avec la référence `WT-XXXXXX` |
| Réservation (site public) | L'équipe | Notification interne |
| Témoignage laissé par un visiteur (site public) | L'équipe | « [Témoignage] {nom} — {note}/5 » (avis publié immédiatement sur le site) |
| **Changement de statut d'une réservation (dashboard)** | Client | « Votre réservation WT-XXXXXX est confirmée / annulée / terminée / en attente » |
| Changement de statut d'une demande de contact | — | Aucun email |
| Création d'un compte (dashboard) | Nouvel utilisateur | « Votre compte Wonder Tours est prêt » |
| Mot de passe oublié | Utilisateur | Lien de réinitialisation (60 min, usage unique) |
| Réinitialisation réussie | Utilisateur | Confirmation du changement |

Les emails portent la signature « Wonder Tours and Services — Ouidah, Bénin ». Si un email n'arrive pas, vérifiez le dossier spam du destinataire.

---

## 16. Bonnes pratiques et dépannage

### Bonnes pratiques

1. **Testez toujours sur un brouillon** : rédigez un article en « Brouillon », désactivez un circuit plutôt que de le supprimer.
2. **Renseignez les textes alternatifs** de chaque image (accessibilité + référencement Google).
3. **Complétez les champs anglais** avec le bouton « Traduire en anglais (DeepL) » puis relisez-les : la moitié de vos visiteurs potentiels parle anglais.
4. **Publiez le site** après chaque session de mise à jour du contenu.
5. **Traitez les demandes sous 24–48 h** : l'accusé de réception promet ce délai aux visiteurs.
6. **Utilisez les statuts rigoureusement** : ils sont la mémoire de l'équipe et, pour les réservations, déclenchent l'information du client.

### Problèmes fréquents

| Problème | Solution |
|----------|----------|
| Je suis renvoyé vers la page de connexion | Votre session a expiré (7 jours) ou le compte a été désactivé : reconnectez-vous |
| « Email ou mot de passe incorrect » | Vérifiez la saisie ; en cas d'oubli, utilisez « Mot de passe oublié ? » |
| Je ne vois pas le menu « Utilisateurs » | Normal : ce menu est réservé aux administrateurs |
| Les boutons de modification n'apparaissent pas / une action est refusée | Votre rôle est « Lecteur » (lecture seule) ; demandez à un admin de passer votre compte en « Éditeur » |
| Le bouton « Traduire en anglais » échoue | Le service DeepL est momentanément indisponible ou non configuré ; réessayez plus tard ou saisissez les textes anglais à la main |
| Mes changements n'apparaissent pas sur le site | Cliquez sur « Publier le site », patientez ~3 minutes, puis actualisez le site (Ctrl + F5) |
| L'image refuse de s'uploader | Vérifiez le format (JPEG, PNG, WebP, GIF, SVG) et la taille (5 Mo max) |
| Le lien de réinitialisation est refusé | Il a expiré (1 h) ou a déjà été utilisé : demandez-en un nouveau |
| L'email de réinitialisation n'arrive pas | Vérifiez les spams ; le message de confirmation s'affiche même si l'adresse est inconnue — vérifiez l'orthographe de l'email |

### Besoin d'aide ?

Pour toute question ou anomalie, contactez l'équipe technique qui a réalisé le site en décrivant : la page où vous étiez, l'action effectuée et le message d'erreur éventuel (une capture d'écran aide beaucoup).

---

*Document fourni avec la livraison du site wondertoursandservices.com — Wonder Tours and Services, Ouidah, Bénin.*
