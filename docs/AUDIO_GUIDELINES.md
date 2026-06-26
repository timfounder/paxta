# AUDIO GUIDELINES

> Owner of: audio channels, mixing defaults, playback rules, asset formats and
> budgets. Mirrors `src/systems/audio/`.

## 1. Philosophy

- **Silence is the loudest tool.** PAXTA is mostly quiet. Sound *events* land
  because the floor is near-silent. Budget restraint over density.
- **Sound deepens, never gatekeeps.** Audio is atmosphere and reward, but no win
  condition or story beat depends on it (P3, STORY R-NAR-4, GAMEPLAY R-ANO-4).
- **Diegetic and institutional.** Fluorescent hum, ventilation, distant doors,
  the report terminal's beep. The world sounds like a building at 3 a.m.
- **Dread, not stingers.** Jump-scare stingers are rationed; over-use trains
  players to tune them out and violates Pillar 1.

## 2. Channels (authoritative — mirror of `AudioChannel`)

`AudioManager` mixes four channels; each volume folds into master.

| Channel | Default volume | Contents |
| --- | --- | --- |
| `master` | `1.0` | Global gain. |
| `music` | `0.7` | Sparse score / drones (rare in PAXTA). |
| `sfx` | `0.9` | Reports, UI, anomaly cues, one-shots. |
| `ambience` | `0.6` | Room tone, hum, ventilation, loops. |

Defaults live in `AudioManager` / `settingsStore`. **R-AUD-1** Any new sound is
assigned to exactly one non-master channel at registration.

## 3. Playback rules

- **R-AUD-2 Mobile unlock.** Browsers block audio until a user gesture. Nothing
  plays before `AudioManager.unlock()` (called on the first interaction, e.g.
  Enter). Never assume autoplay.
- **R-AUD-3 Register, then play by id.** All tracks are registered with an
  `AudioTrackId`, channel, loop flag, and per-track volume; gameplay triggers by
  id. No ad-hoc `new Audio()` outside `AudioManager`.
- **R-AUD-4 Respect the mixer.** Effective volume = `master × channel × track ×
  (muted ? 0 : 1)`. Never set element volume directly; go through the manager.
- **R-AUD-5 Mute is absolute.** When muted, output is silent but state/loops keep
  their logical position; unmuting restores the mix.
- **R-AUD-6 Clean up.** Ambience loops started by a scene are stopped on scene
  unload (TECH_ARCHITECTURE lifecycle). No track outlives its scene.

## 4. The anomaly audio language

Sound is a *channel of perception*, parallel to sight (GAMEPLAY §3).

- **Audio anomalies** (`AnomalyKind.audio`): a sound that should not exist, or a
  known sound subtly wrong (pitch, direction, repetition). They must be
  noticeable on phone speakers, better on headphones (R-NAR-4).
- **R-AUD-7** An audio anomaly has a clear "correct" silence/sound it deviates
  from (GAMEPLAY R-ANO-2). Random noise is not an anomaly.
- **False cues** at low Sanity (GAMEPLAY R-DBT-1) may be audio, but are cosmetic:
  they never drain Sanity and never score (R-DBT-2).
- **Report feedback:** a short institutional confirmation on a correct catch; a
  duller, wrong tone on a false alarm — paired with haptics (UI R-INT-4).

## 5. Mixing & dynamics

- **R-MIX-1 Loudness target:** integrated ≈ **−16 LUFS** for ambience/music beds;
  one-shots peak ≤ **−1 dBTP**. Consistency matters more than loudness; the floor
  must stay quiet enough that an event reads.
- **R-MIX-2 Headroom:** master mix never clips; leave ≥ 3 dB headroom with all
  channels at default.
- **R-MIX-3 Ducking (roadmap):** when a critical cue plays, ambience may duck
  slightly; never duck so hard the world goes silent (that itself becomes a tell).
- **R-MIX-4 No fatigue loops.** Ambience loops are ≥ 20 s and seamless; short
  repetitive loops read as fake and break immersion.

## 5a. Procedural ambience (the atmosphere)

The environmental bed is **synthesised**, not sampled. `ProceduralAmbience`
(`engine/atmosphere/`) builds the night out of Web-Audio primitives — filtered
noise for wind layers and the insect shimmer, oscillators for the power-line hum,
short enveloped voices for one-shots (distant dog, metal creak, electrical buzz,
thunder). This sidesteps the loop-fatigue and asset-budget problems entirely and
makes the whole bed **data-driven** from `shared/constants/atmosphere.ts`.

- **R-AMB-1 No assets for ambience.** The atmosphere bed ships no audio files; it
  is generated. Sampled `.ogg` (R-AUD-8) is for *authored* cues (music, anomaly
  voices), not the procedural night.
- **R-AMB-2 Same mixer, same mute.** Procedural output is folded into the
  **Ambience** channel: effective gain = `master × ambience`, and **mute is
  absolute** (R-AUD-5). It also suspends with the engine and on tab-hide.
- **R-AMB-3 Unlock like everything else.** The audio graph is created suspended and
  resumes only on a user gesture (R-AUD-2); it self-installs a one-time gesture
  listener and degrades to a silent no-op where Web Audio is unavailable.
- **R-AMB-4 Silence is a tool, used sparingly.** Unlike R-MIX-3, the atmosphere may
  duck to near-silence for brief, randomly-timed beats — the dead-air *is* the
  effect. Keep them rare and short (see `ATMOSPHERE.AMBIENCE`).

## 6. Asset format & budget

PAXTA runs in a webview on low-end phones over mobile data (PERFORMANCE).

| Asset type | Format | Target size |
| --- | --- | --- |
| Ambience loops | `.ogg` (Opus/Vorbis), mono or stereo | ≤ 300 KB each |
| One-shot SFX | `.ogg` / `.mp3` fallback | ≤ 60 KB each |
| Music beds (if any) | `.ogg` | ≤ 500 KB each |

- **R-AUD-8 Format:** ship `.ogg` as primary (smaller); provide `.mp3` only where
  a target webview lacks Ogg support. Decide per-track, document it.
- **R-AUD-9 Total audio budget per chapter ≤ 4 MB** compressed, lazy-loaded with
  its chapter (never in the initial bundle — PERFORMANCE R-PERF-2).
- **R-AUD-10 Sample rate** 44.1 kHz; mono for non-spatial sources to halve size.

## 7. Naming & organisation

- Track ids are kebab-case, channel-prefixed: `amb-hallway-hum`, `sfx-report-ok`,
  `sfx-report-bad`, `sfx-anomaly-whisper`, `mus-ch1-drone`.
- Files live under `public/audio/<chapter>/` and are registered in the
  chapter's content module (parallel to quests/anchors).
- **R-AUD-11** One id = one file = one channel. No reusing an id across chapters.

## 8. Spatial audio (roadmap, not v1)

- v1 uses non-spatial `HTMLAudioElement` mixing (simple, broad webview support).
- Positional audio for anomalies (a sound *from over there*) is a Chapter-2+
  upgrade via Babylon's audio engine, behind the same `AudioManager` API so
  callers don't change (Open/Closed). Track in ROADMAP.

## 9. Adding a sound (checklist)

1. One channel assigned (R-AUD-1)? Within size/format budget (R-AUD-8/9)?
2. Registered with an id; triggered by id only (R-AUD-3)?
3. Won't play before unlock (R-AUD-2)? Stops on scene unload if a loop (R-AUD-6)?
4. If an anomaly cue: has a knowable "correct" state, scores only via the anomaly
   entity (R-AUD-7, GAMEPLAY R-DBT-2), and is winnable on phone speakers (R-NAR-4)?
5. Mix sits at target loudness without clipping (R-MIX-1/2)?
