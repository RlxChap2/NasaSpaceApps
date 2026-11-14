# Use of SI and asset credits

The team supplied the project concept. The public slide deck reports the uses below. The file-level extent of the first three tools and the dataset generation details need team confirmation before submission. [Demo deck](https://docs.google.com/presentation/d/1kHY5blXbLMT8c9li485-P2wsvXsgJ2fT/edit).

| Tool | Use and evidence |
| --- | --- |
| ChatGPT | The deck credits help with code quality and theme structure. `full/public/images/ASTRONAUT.md` independently documents OpenAI image generation for the lunar astronaut shown by `SpaceJourney.tsx`. |
| Gemini | The deck credits research synthesis and content organization. Confirm what appeared in the final website and slides and who checked the references. |
| Cursor | The deck credits dashboard styling and 3D integration assistance. Confirm which changes contain assisted or generated code. |
| Claude | The deck credits simulated dataset generation. Model/version, prompts, seed and generation date are not recorded in the audited inputs. See [Data provenance](DATA_PROVENANCE.md). |
| Codex | Used in this review for repository inspection, data and slide auditing, local verification, and drafting the Markdown documentation and submission text. |

The [eye sprite notes](../full/public/assets/astronaut-eyes/README.md) and [v2 notes](../full/public/assets/astronaut-eyes/v2/README.md) document generated images and prompt text. The public directory includes prototype images, source material and a ZIP archive. Verify any reused or redistributed reference image permissions. The connected check-in evaluates deterministic Python rules. There is no runtime AI service in that path.

## Before sharing the final materials

Add a visible AI-generated watermark wherever generated images or video are retained, including screenshots that show them. The lunar cutout is rendered without a visible AI label in its code. The background/astronaut art on the cover needs a confirmed source and a watermark if generated. Audit each slide and public scene for generated visuals, NASA identity elements, audio and depicted individuals. State the tools and uses in the NASA form and credit any AI audio if used. Confirm adult status and permission for any identifiable people. Remove assets whose rights or provenance cannot be established. [2026 watermark and branding clarification](https://github.com/nasa/spaceapps/discussions/1947).

## Asset and dependency references

- [NASA images and video](../full/public/images/NASA-MEDIA.md), [NASA helmet attribution](../full/public/models/helmet/ATTRIBUTION.md), [planet textures](../full/public/textures/planets/ATTRIBUTION.md) and [star atlas/catalog](../full/public/textures/space/ATTRIBUTION.md). Check which media are used in the release and apply [NASA brand and media guidance](https://www.nasa.gov/nasa-brand-center/).
- [Anatomy assets](../full/public/models/anatomy/LICENSE.md) document CC BY-SA 4.0 for the body and CC0 for the torso. The [detailed helmet](../full/public/models/helmet/DETAILED-MODEL-LICENSE.md) credit includes a CC BY-NC 4.0 restriction on the original. Confirm permission for submission and redistribution or omit/replace the restricted asset.
- Planet texture notes include Solar System Scope CC BY 4.0. The [D3 Celestial catalog notice](../full/public/textures/space/CATALOG-LICENSE.txt) records BSD-3-Clause. Jersey 10 includes an [OFL notice](../full/public/fonts/OFL-jersey-10.txt). Confirm and include notice/source files for Caveat, Instrument Serif and bundled Draco assets. Verify photography and source terms for the Framer CDN/Unsplash references if they ship. Review team images and deck art independently.
- [Npm manifest](../full/package.json), [lockfile](../full/package-lock.json), [Python manifest](../api/requirements.txt) and [test manifest](../api/requirements-dev.txt) identify dependencies. Prepare release notices for all distributed dependencies, assets, tools and datasets. Manifests alone do not provide those notices or permission to reuse media.
- No repository-level license was found. The team needs to select and publish an OSI-approved license or document another permission path allowed by the terms. Keep third-party notices and restrictions intact. [2026 participant terms](https://www.spaceappschallenge.org/legal/).
