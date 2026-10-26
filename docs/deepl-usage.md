# Utilisation de DeepL pour la traduction

## Vue d'ensemble

L'intégration DeepL permet de traduire dynamiquement du contenu dans votre application Next.js. Le système utilise l'API DeepL pour traduire du texte et des objets entre le français et l'anglais.

## Configuration

1. Assurez-vous d'avoir configuré la variable d'environnement `DEEPL_API_KEY` dans votre fichier `.env.local` (voir `docs/env-setup.md`)

2. Le package `deepl-node` est déjà installé dans le projet.

## Utilisation

### Traduire un texte simple

```typescript
import { translateDynamicText } from '@/lib/services/deepl';

// Traduire un texte en anglais
const translatedText = await translateDynamicText(
  "Bonjour, comment allez-vous ?",
  "en"
);

// Traduire un texte en français
const translatedText = await translateDynamicText(
  "Hello, how are you?",
  "fr"
);
```

### Traduire un objet complet

```typescript
import { translateDynamicObject } from '@/lib/services/deepl';

const content = {
  title: "Découvrez nos circuits",
  description: "Explorez le Bénin avec nos guides expérimentés",
  button: "En savoir plus"
};

const translatedContent = await translateDynamicObject(content, "en");
// Résultat:
// {
//   title: "Discover our tours",
//   description: "Explore Benin with our experienced guides",
//   button: "Learn more"
// }
```

### Utilisation côté serveur uniquement

`deepl-node` est un package Node : il ne peut pas être importé dans un
composant client (`"use client"`), ni via `lib/translations.ts` qui est
partagé avec le bundle navigateur. Utilisez ces helpers uniquement depuis
le serveur (Server Component, Route Handler). Pour le navigateur, le
projet expose une route API dédiée — cf. ci-dessous.

## Intégration dashboard : `POST /api/dashboard/translate`

Route réelle du projet : `php-api/handlers/TranslateApi.php` (servie sous
`/api/dashboard/translate` — admin + éditeur uniquement, `401`/`403` sinon,
`503` si `DEEPL_API_KEY` absente). Elle s'appuie sur
`External::translateTexts` (équivalent cURL de `translateTexts`).

Requête — record `clé → texte` (1 à 20 entrées, valeurs
≤ 100 000 caractères) ; `sourceLocale` optionnel, `targetLocale` requis
(`fr`/`en`) :

```json
{
  "texts": { "title": "Circuit Ganvié", "description": "Découvrez la cité lacustre" },
  "sourceLocale": "fr",
  "targetLocale": "en"
}
```

Réponse `200` :

```json
{
  "texts": { "title": "Ganvié Tour", "description": "Discover the lake village" },
  "targetLocale": "en"
}
```

Consommée par le composant `components/dashboard/translate-button.tsx`
(bouton « Traduire en anglais (DeepL) ») branché dans trois formulaires du
dashboard : circuit (`circuit-form.tsx` : titre, sous-titre, description →
champs `*En`), article blog (`blog-post-form.tsx` : titre, résumé, contenu)
et témoignage (`testimonial-form.tsx` : texte → `textEn`). Les champs vides
sont ignorés ; la traduction pré-remplit les champs anglais, modifiables
avant enregistrement.

## Comportement de fallback

Si la clé API DeepL n'est pas configurée ou si une erreur survient lors de la traduction, les helpers (`translateDynamicText`, `translateDynamicObject`) :
- retournent le texte original ;
- affichent un avertissement dans la console ;
- laissent l'application fonctionner normalement.

La route `POST /api/dashboard/translate` a un comportement explicite : sans
`DEEPL_API_KEY`, elle répond `503`. La clé est relue à chaque appel
(`isDeepLConfigured()`), pas au chargement du module.

## Limites

- L'API DeepL a des limites de caractères par requête (selon votre plan)
- Les traductions sont asynchrones, donc assurez-vous de gérer les états de chargement
- Pour les traductions statiques de l'interface, utilisez le système de traductions existant dans `lib/translations.ts`

## Cas d'utilisation recommandés

- **Contenu dynamique** : Traduire du contenu généré par les utilisateurs ou provenant d'une base de données
- **Contenu CMS** : Traduire des articles de blog, des descriptions de circuits, etc.
- **Textes variables** : Traduire des messages personnalisés ou des notifications

Pour les éléments statiques de l'interface (navigation, boutons, etc.), continuez d'utiliser le système de traductions existant.
