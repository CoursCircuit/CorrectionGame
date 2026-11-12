# CorrectionGame

CorrectionGame transforme un corrigé PDF en activité de classe sur Mac. Projetez le document, cachez les réponses et révélez-les au fur et à mesure des interventions.

[**Voir la page de présentation**](https://courscircuit.github.io/CorrectionGame/) · [**Télécharger CorrectionGame 2.2.1 pour Mac**](https://github.com/CoursCircuit/CorrectionGame/releases/tag/v2.2.1)

## En classe

1. Créez une classe et ouvrez le corrigé PDF.
2. Placez des masques sur les réponses. CorrectionGame peut les répartir entre les élèves présents.
3. Cliquez sur un masque pour valider une bonne réponse. Utilisez **⌘ + clic** pour une réponse fausse, ou **⌥ + clic** pour passer la question à un autre élève en laissant la réponse cachée.
4. Enregistrez la séance pour reprendre les masques, les annotations et les scores. Les fichiers `.cg.json` peuvent contenir des prénoms et des données de classe : gardez-les avec vos documents de travail.

L’application permet aussi de surligner, souligner, ajouter du texte, passer d’un PDF à l’autre et consulter le classement. Elle fonctionne hors ligne.

## Installation et développement

Ouvrez le DMG universel et glissez CorrectionGame dans **Applications**. Le DMG contient des binaires Apple Silicon et Intel. La signature ad hoc a été vérifiée ; l’application n’est pas notarisée par Apple.

```sh
npm ci
npm start
npm run dist:universal
```

La compilation du DMG se fait sur macOS. Les dépendances de la version 2.2.1 sont celles de l’application d’origine. Electron 30 et l’outillage de compilation comportent des vulnérabilités connues. Utilisez des PDF de confiance en attendant une mise à jour du runtime.

Le code de CorrectionGame est sous [licence MIT](LICENSE). Voir les [licences des composants et la note sur les visuels](THIRD-PARTY.md).

Cette application a été vibe codée par un non-développeur, à l’origine pour ses propres besoins.

Créé par S. Bovat
