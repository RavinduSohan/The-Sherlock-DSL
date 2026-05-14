<div align="center">

# ✦ Sherlock

### A Declarative Domain-Specific Language for Mathematical and STEM Animation

*Describe a scene. Get a video.*

[![Watch on YouTube](https://img.shields.io/badge/Watch_Demo-YouTube-red?style=flat-square&logo=youtube)](https://www.youtube.com/@blackboxbureauhq/shorts)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=flat-square)]()
[![Language](https://img.shields.io/badge/Language-.sherlock-blueviolet?style=flat-square)]()
[![Built With](https://img.shields.io/badge/Built_With-TypeScript-3178C6?style=flat-square&logo=typescript)]()

</div>

---

> **Note on Repository Structure**
>
> This repository contains the DSL specifications, scene examples, CLI/TUI interfaces, grammar documentation, and system evidence for Sherlock. Following the advice of university supervision and due to the commercial potential of the core rendering engine, the Parser, Runtime, and Export Pipeline remain in a private repository. Full source code and a comprehensive technical report have been submitted to the University of Plymouth Faculty of Computing for academic evaluation. Evidence of the complete working system is provided below through video demonstration, screenshots, and scene files.

---

## What is Sherlock?

Sherlock is a domain-specific language (DSL) and complete toolchain for producing declarative mathematical and STEM animations. You write a plain-text `.sherlock` file describing what a scene should contain and how it should transform. The system compiles it, renders it, and exports a production-quality MP4. You never touch a timeline. You never write a class.

The gap Sherlock fills is specific: no existing tool is simultaneously mathematically precise, text-based, version-control-native, and accessible without programming expertise. Programmatic libraries like Manim require Python fluency and have no live preview. Graphical tools like After Effects store binary files and have no mathematical precision. Sherlock is built around a third model — you describe, the system produces.

```yaml
# This is a complete Sherlock scene. No boilerplate. No classes.

concept: "Gradient Descent"
total_duration: 8
background: "#080c14"

phases:
  intro:
    duration: 8
    elements:
      loss_surface:
        type: primitive
        shape: functionGraph[fn:"0.5*x^2 + 0.3*sin(3*x)" xStart:-4 xEnd:4
                 segments:120 stroke:#4fc3f7/0.8 strokeWidth:2 at:(0,1)]
                 -> fadeIn(1.2s, 0s)

      descent_ball:
        type: morph
        shape: circle[r:0.18 fill:#ff6b9d at:(-3.5, 2.45)]
                 -> fadeIn(0.5s, 1s)
                 ~> circle[r:0.18 fill:#ffd54f at:(0, 0.1)] (2.5s, ease.out, 2s)
                 ~> circle[r:0.18 fill:#69f0ae at:(0.4, 0.08)] (1.2s, spring, 4.8s)
```

---

## Demo

<div align="center">

▶ **[Watch full scenes on YouTube →](https://www.youtube.com/@blackboxbureauhq/shorts)**

</div>

---

## System Screenshots

> The following section contains screenshots of the live system — CLI commands, TUI workflow, live preview, scene exports, and terminal output during rendering. All output shown was produced directly by Sherlock from `.sherlock` scene files.

<!-- Add your screenshots here freely — CLI, TUI, live preview, exported frames, terminal output, scene side-by-sides -->

---

## The Language

### Core Concept

A `.sherlock` file is a YAML document with three blocks: a scene header, a phase timeline, and element declarations. Each element is a single self-contained declaration — shape type, visual properties, and full animation chain in one line.

### Two Operators

Everything in Sherlock composes through two operators:

| Operator | Name | What it does |
|----------|------|-------------|
| `->` | Chain | Sequences an animation on a primitive: `-> fadeIn(1s) -> moveTo((2,0), 2s)` |
| `~>` | Morph | Transitions between two primitive states through interpolation: `~> square[size:1.6 ...] (1.8s, ease.inOut)` |

### Primitives

Sherlock supports 13 atomic shape types:

| Primitive | Use |
|-----------|-----|
| `circle` | Nodes, points, orbits |
| `square` | Grids, structures |
| `rectangle` | Bars, containers |
| `triangle` | Arrows, directions |
| `star` | Highlights, annotations |
| `ellipse` | Ovals, elliptical paths |
| `regularPolygon` | Hexagons, n-gons |
| `text` | Labels, equations |
| `line` | Axes, connectors |
| `arc` | Angular transitions |
| `polygon` | Custom closed shapes |
| `functionGraph` | Plot any f(x) over a domain |
| `parametric` | Render x(t), y(t) parametric curves |

### Easing Functions

All animations and morphs accept an easing parameter:

`linear` · `ease.in` · `ease.out` · `ease.inOut` · `spring` · `bounce` · `elastic`

### Property Syntax

Every primitive uses the same compact inline bracket notation:

```
circle[r:0.8 fill:#4fc3f7/0.6 stroke:#4fc3f7 strokeWidth:1.5 at:(0,0)]
         │    │              │   │                           │    │
         │    fill colour    │   stroke colour               │    position
         radius              opacity (0–1)                   stroke width
```

---

## The Pipeline

```
.sherlock file
      │
      ▼
 Parser Layer          — YAML structure + inline expression lexer → SceneAST
      │
      ▼
 Runtime Layer         — Browser (live preview) or Headless Node.js (export)
      │
      ▼
 Export Layer          — PNG frame sequence → FFmpeg H.264 → MP4
```

The browser preview and the exported video share the same rendering core. What you see in the preview is what the export produces.

---

## CLI

Sherlock exposes a full command-line interface covering the complete authoring lifecycle:

| Command | Description |
|---------|-------------|
| `sherlock init <project>` | Scaffold a new project with starter scene |
| `sherlock create <scene>` | Create a new scene file |
| `sherlock preview [scene]` | Launch live preview server (sub-second feedback on save) |
| `sherlock render <scene>` | Export scene to MP4 (1080p / 4K, 24/30/60 FPS) |
| `sherlock code <scene>` | Start preview + file watcher for live coding workflow |
| `sherlock guide [topic]` | Inline DSL documentation |
| `sherlock examples` | Browse and copy example scene templates |
| `sherlock interactive` | Guided TUI workflow — no CLI arguments needed |
| `sherlock config` | Manage project configuration |
| `sherlock doctor` | Environment diagnostics (Node.js, FFmpeg, directories) |

---

## TUI — Interactive Mode

For authors who prefer not to construct CLI arguments directly, `sherlock interactive` launches a guided terminal workflow covering scene creation, live preview, and video export through a menu-driven interface.

---

## Scene Examples

The `/examples` directory contains `.sherlock` scene files covering a range of use cases — mathematical curves, morphing sequences, physics visualisations, and multi-phase educational animations. These files demonstrate the full expressive range of the language and can be loaded directly into the live preview.

---

## Grammar Reference

The formal grammar of the Sherlock DSL is documented in [`/docs/grammar.md`](./docs/grammar.md). It covers the complete syntax — scene structure, phase definitions, primitive expressions, animation chains, morph sequences, and timing notation.

---

## Research

This system was developed as part of a final year BSc Computer Science project at the University of Plymouth (PUSL3190), in partnership with NSBM Green University, Sri Lanka.

A research paper — *Sherlock: A Declarative Domain-Specific Language for Mathematical and STEM Animation* — was produced as part of this work, documenting the language design, architecture, and evaluation findings.

**Author:** K.W.A.R.S. Dananjaya
**Supervisors:** Ms. T. A. H. Dilpriya · Ms. Chathurma Wijesinghe
**Institution:** NSBM Green University / University of Plymouth

---

## Intellectual Property

The Sherlock DSL specification, scene format, and interface layer are available in this repository. The core rendering engine — comprising the parser, runtime, morphing engine, and export pipeline — remains proprietary and is not included here. This follows an open-core model adopted under supervisor guidance, reflecting the commercial development stage of the project.

Full source code has been submitted to the University of Plymouth Faculty of Computing for academic evaluation purposes.

---

<div align="center">

*Built with TypeScript · Node.js · FFmpeg · Next.js*

**[YouTube →](https://www.youtube.com/@blackboxbureauhq/)**

</div>
