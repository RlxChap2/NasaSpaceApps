# Crew State Health | NASA Space Apps 2026 submission draft

Team 0xE90 · Universal Event · [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)

Fill bracketed URLs after the corresponding materials are public. The short demo link below opened anonymously on November 14, 2026. Use the link after the revisions in the deck audit. The team owner should confirm the roster, permissions and SI disclosure before copying the final fields.

## Project Name

Crew State Health

## High-Level Summary

Crew State Health is a web prototype for recording and exploring health indicators during a simulated space mission. A user chooses a fictional crew member and mission day, enters a check-in, then opens the saved entry in the Crew Daily Log. The prototype shows how a reading can be flagged for review and uses NASA Human Research Program sources to explain which risks can be explored through the available measurements.

## Project Demo

[Current seven-slide Google Slides link](https://docs.google.com/presentation/d/1kHY5blXbLMT8c9li485-P2wsvXsgJ2fT/edit). Replace it if the corrected deck is published at a different URL.

## Final Project

[PUBLIC_FINAL_PROJECT_URL]

The existing [GitHub repository](https://github.com/RlxChap2/NasaSpaceApps) is private. Supply a final project URL that opens without a login. Use a public code or release link if it contains the intended version, instructions and license. A public site with a working API can also show the connected workflow.

## Project Details

> **Team editing note.** Replace the numbered notes below with your own images and keep the suggested English captions. If the form only accepts text, put the figures and captions on the public final project page.

### The problem we chose

A sleep entry tells you how long someone slept that day. To see whether their sleep changed during the mission, you need to know who entered it and what the surrounding days looked like. We built Crew State Health around that task. It puts sleep, pulse, self-reported well-being and other readings into a daily record that a user can look up by crew member and mission day.

On a long mission, that history could help a crew member pin down when a change first appeared and discuss it with the health team using specific readings. In the prototype, visitors can try the workflow with a fictional crew. They can also explore why a measurement belongs in the log and what other information a crew would need to assess a risk.

> **Image 1 | Website overview.** Use the Crew Health Overview with the main indicators and part of the trend chart visible. Caption: *Crew State Health puts daily indicators and recent history on the same dashboard.*

### Recording a daily check-in

The user selects a crew member, a mission phase and a day. The form asks for heart rate, hours slept, fatigue and mood. It also accepts blood pressure, body temperature, blood glucose and cabin carbon dioxide. These extra fields have sample values for the demo. Fatigue and mood are self-ratings on five-point scales. The prototype maps them to 0 to 10 fields in the database, with fatigue standing in for stress in the demo.

The API checks each reading and makes sure the day belongs to the chosen phase. The database keeps one record per crew member per mission day. If a record already exists, the form reports the conflict and the earlier entry stays available in the log.

> **Image 2 | Check-in form.** Capture `/dashboard/check-in` with fictional values filled in. Keep the crew selector, day and field units visible. Use an unused day, such as `FD7` on a fresh demo database. Caption: *A check-in records the crew member, mission phase and daily measurements.*

### Reviewing a saved reading

After a save, the app displays the record ID and the result of its demonstration rules. When a reading triggers a rule, the confirmation shows the indicator, the entered value, the demo severity and a source link. Those details let the user see what caused the flag and which material we referenced. The rules and follow-up text are examples for the simulation. The prototype is for education and has no clinical validation.

> **Image 3 | Save confirmation.** Capture the screen after saving the entry from Image 2. Keep its ID and mission day visible. If the entry triggers a demo rule, include the indicator and its source link. Caption: *The save confirmation identifies the stored entry and shows the result of the demo rules.*

### Monitoring changes across mission days

In the Crew Daily Log, select a crew member and choose a day from the menu, or click a bar in the sleep chart to open the full record for that day. In C001's simulated history, the log shows 7.8 hours of sleep at `L-3` before launch and 6.4 hours at `FD1` in flight. The day view shows pulse, blood pressure and the other readings alongside sleep. Making the bars clickable ties each value in the chart to the underlying record.

The dashboard's separate Health Trends view calculates period averages and changes for check-ins in the current browser. The Crew Daily Log is where a user can look up a saved API record by crew member and mission day.

> **Image 4 | Crew Daily Log.** Capture `/crew-health` with C001 and `FD1` selected. Include the day selector, the 6.4-hour reading and the sleep bars. Caption: *Selecting a bar opens the measurements recorded for that mission day.*

### How we built the simulated dataset

We created a workbook with 40 fictional observations. Each of the four crew IDs has two pre-flight records, six in-flight records and two post-flight records. Each row represents one crew member on one mission day and includes the measurements, a simulated data label and an example status. The workbook keeps reference ranges and the study-file catalog on separate tabs.

We exported the rows to CSV so anyone running the demo can start with the same records. We checked the vital records for missing fields and duplicate crew/day pairs and found neither. The study-file catalog points readers to published research. The daily readings shown in the seeded demo come from the simulated workbook. [Reference workbook](https://docs.google.com/spreadsheets/d/1Udl4Lahc4AHnlVe9jr79_ztFN5UjsfSO/edit)

> **Image 5 | Excel simulation.** Use the `Simulated_Daily_Vitals_Log` tab in Excel. Crop to the headers and the C001 rows for `L-3`, `L-1` and `FD1`. Keep the mission day, simulated label and sleep column readable so the judge can recognize the values in Image 4. Caption: *The simulated vitals workbook uses one row per fictional crew member and mission day.*

### How the research shaped the interface

NASA's Human Research Program describes hazards such as radiation and altered gravity. We used that context in the 3D Body Explorer. A visitor can open the cardiovascular section alongside readings such as pulse and blood pressure. The radiation section explains that an exposure reading would require a dosimeter. The anatomy view gives someone new to the subject a place to start with a body system and see what evidence the prototype can show. [NASA Five Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)

NASA's ARCHeR study tracks aspects of crew well-being and sleep across a mission. It informed our choice to include sleep and self-reported well-being in the daily check-in, where they can be reviewed across several days. [NASA ARCHeR](https://www.nasa.gov/reference/archer/)

> **Image 6 | 3D Body Explorer.** Capture `/dashboard/body` with the anatomy model and cardiovascular panel visible. A small crop of the radiation panel beside it can show the dosimeter note. Caption: *The Body Explorer connects recorded health indicators and spaceflight research to body systems.*

### Tools and software

We built the browser interface with Next.js, React and TypeScript. Three.js renders the anatomy model, and Recharts draws the dashboard charts. The Python backend uses FastAPI to receive check-ins, Pydantic to validate them and SQLite to store them. On a fresh local setup, the API loads the CSV seed files so the Crew Daily Log already has simulated observations. The demo uses a WebGL-capable browser and readings entered by hand.

We tested the workflow by saving a fictional check-in in a browser and reopening the saved day in the Crew Daily Log after reload.

> **Image 7 | Stack diagram.** Use boxes connected by arrows. Main flow: `Next.js / React / TypeScript → Python / FastAPI + Pydantic → SQLite`. Add a separate input labeled `Excel → CSV seed files → SQLite`, and put `Three.js` and `Recharts` under the frontend box. Caption: *The browser sends check-ins to FastAPI for validation and storage. CSV exports supply the initial simulation records.*

## Use of SI

We used ChatGPT for code quality and theme structure, Gemini for research synthesis and organization, and Cursor for dashboard styling and 3D integration assistance. We used Claude to help generate the simulated health dataset. OpenAI image generation was used for illustrative astronaut assets. Codex assisted with repository review, data and slide auditing, verification and documentation. The health-status output comes from deterministic Python rules.

[TEAM CHECK: Confirm the tool list and exact scope against the final release. Identify the generated images retained, confirm their visible watermarks and add any audio or other tools used. Remove this note before submitting.]

## NASA Data

NASA's Human Research Program Five Hazards and Human Spaceflight Risks resources informed the hazard explainer, the Body Explorer's research sections and the distinction between entered measures and topics that need dedicated instruments. ARCHeR informed the use of repeated sleep and behavioral check-ins. Spaceflight Standard Measures provided context for comparing measurements over time.

- [Five Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)

- [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/)

- [Ongoing Human Research Program Research](https://www.nasa.gov/hrp/ongoing-hrp-research/)

- [ARCHeR](https://www.nasa.gov/reference/archer/)

- [Spaceflight Standard Measures](https://www.nasa.gov/directorates/smd/space-life-physical-sciences-research-applications-division/human-research-program/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space/)

- [Cardiovascular Adaptations risk](https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=179)

We cite [NASA-STD-3001 Volume 1 Rev C](https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf) for reference context. The archive lists [OSD-569](https://osdr.nasa.gov/bio/repo/data/studies/OSD-569/), [OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575/) and [OSD-656](https://osdr.nasa.gov/bio/repo/data/studies/OSD-656) as study references. The displayed daily readings are drawn from our simulated fixture.

## Space Agency Partner Data and Other References

- [ESA EasyMotion-2](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/epsilon/EasyMotion_2_Using_electrical_stimulation_to_preserve_astronaut_muscles_in_space) provides context for the musculoskeletal research section.

- The [Inspiration4 study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11357997/) and [spaceflight sleep review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12155433/) provide background on behavioral measures and sleep. [PhysioNet MMASH](https://physionet.org/content/mmash/) appears in the reference catalog as an Earth wearable study.

- [Simulated fixture and reference workbook](https://docs.google.com/spreadsheets/d/1Udl4Lahc4AHnlVe9jr79_ztFN5UjsfSO/edit). The workbook records 40 invented crew-day observations, research links and catalog metadata.

- [PUBLIC_ASSET_AND_SOFTWARE_NOTICES_URL]. Include public attribution for NASA media, anatomy assets (CC BY-SA 4.0 and CC0), planet textures (CC BY 4.0 where applicable), star data (BSD-3-Clause), and the third-party fonts, images, packages and tools used in the submitted build. The original project code and documentation are licensed under Apache License 2.0. [PUBLIC_PROJECT_LICENSE_URL]. Verify the detailed helmet's noncommercial license before including it.

## Deck audit

The supplied Google Slides edit URL opened without login and exported as PPTX and PDF. All seven English slides, including the title, were inspected as rendered PDF pages, and PPTX text and hyperlink relationships were checked. The title matches the site, names team 0xE90 and lists all five members. It names the event but omits the exact challenge title. The live-demo image matches the Crew Daily Log and figures for C001/`L-3`. Small labels in that screenshot and most URLs on the source slide are hard to read. The deck cites the challenge-listed HRP resources. No visible AI watermark was found. Art provenance and the identities/ages of depicted people were not established by the export.

| Slides | Changes before publishing |

| --- | --- |

| 1–2 | Add the exact challenge title and verify name spellings. Credit the cover and background art and watermark generated images. Remove the hidden or off-layout template text found in the export of slide 2. Qualify the communications delay as variable and source the mission constraints. |

| 3–5 | Replace unified hazard scoring, circadian guidance, hydration entry, action checklists, recovery verification and offline-ready claims with the implemented workflow. Describe descriptive comparisons as trends. Show the connection between one specific challenge-listed HRP source and a UI choice. Describe the server logic as demo rules. Verify the NASA insignia and other logo permissions, or remove them if unsure. |

| 6 | Use the existing `L-3` example for viewing only. For save-and-view, show the form, save confirmation and Crew Daily Log for a different day, such as `FD7` on a fresh seed. Enlarge the live UI crop and show its simulated or manual-input label. Move test results to the technical docs or actually show them. |

| 7 | Use readable source names and links. Check the visible cardiovascular URL, whose text ends in `i=17` while its PPTX target is `i=179`. The QR code resolves to the Research Drive folder, which returned HTTP 404 without login. Point it at an accessible source list or remove it. Add final SI image credits, license notices and disclosure. |

## Team actions before Submit for Judging

1. **Resolve the event timing with the GO Team.** Local history starts with challenge-labeled work on November 13, before the organizer's published opening of November 14 at 9:00 AM in the Universal Event team owner's area. Preserve history and give the organizer the exact chronology, what was reused and when challenge-specific work happened. Eligibility remains unresolved. [Organizer timing guidance](https://github.com/nasa/spaceapps/discussions/1827) · [Prior-work guidance](https://github.com/nasa/spaceapps/discussions/1924).

2. **Publish a judge-accessible final project.** The repo is private and has no configured homepage or Pages deployment in the GitHub metadata checked. Verify the intended code revision, the frontend and its HTTPS API from a signed-out browser on another device. If using shared hosting, keep fictional data only and isolate or restrict writes and reset.

3. **Correct and retest the deck.** Keep all seven slides including the title, or use a 30-second-or-shorter video as the single demo. Capture the actual save and readback and keep the source use visible. Check that the final link opens without login.

4. **Resolve third-party and SI media rights.** Complete the notices and permissions in [AI usage](docs/AI_USAGE.md) and replace the public license URL placeholder with a link to the Apache 2.0 license that judges can open. Confirm SI tools, watermark generated visuals, verify rights and adult status where applicable, and drop anything unresolved from the public version.

5. **Clarify the data and rule claims.** Use “simulated demo data” in the app and deck, describe rule output as illustrative, and remove unsupported calibration and medical claims. Keep source IDs and URLs in the final form. If research materials behind Drive affect a claim, publish the relevant source or provide an export for verification.

Paste the fields into the team's NASA Project tab. Verify the form's term agreement and final URLs, then have the team owner select **Submit for Judging** and confirm the status by **November 15, 2026 at 11:59 PM in the team owner's local time**. The submission guide URL could not be fetched during the audit. Field names come from the brief and organizer guidance. [2026 event page](https://www.spaceappschallenge.org/2026/) · [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) · [Organizer submission guidance](https://github.com/nasa/spaceapps/discussions/1973).
