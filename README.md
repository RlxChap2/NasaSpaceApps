# BEYOND | NASA Space Apps

BEYOND is an interactive web experience about astronaut health and life beyond Earth. Explore the Moon, examine a 3D anatomy model, and browse simulated crew health records.

## Requirements

- Node.js 20.9 or later with npm.
- Git to clone the repository. You can also download a ZIP from GitHub.
- A browser with WebGL support for the 3D scenes.

## Download and install

```bash
git clone https://github.com/RlxChap2/NasaSpaceApps.git
cd NasaSpaceApps
npm ci
```

To download without Git, choose **Code → Download ZIP** on GitHub, extract the archive, open a terminal in the extracted folder, and run `npm ci`.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3847](http://localhost:3847). The [Crew Health page](http://localhost:3847/crew-health) includes the anatomy model and daily crew records.

## Build and run for production

```bash
npm run build
npm start
```

The production server also runs on port `3847`. Run `npm run lint` to check the code.

## Asset credits

- [NASA images and video](public/images/NASA-MEDIA.md)
- [Anatomy model licenses](public/models/anatomy/LICENSE.md)
- [Helmet model attribution](public/models/helmet/ATTRIBUTION.md)
