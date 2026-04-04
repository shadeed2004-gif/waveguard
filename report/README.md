# WaveGuard V4 – LaTeX Mini Project Report

This directory contains the complete LaTeX source for the WaveGuard V4 mini project report
to be submitted to **APJ Abdul Kalam Technological University** via Overleaf.

## Directory Structure

```
report/
├── main.tex              ← Master document (compile this file)
├── coverpage.tex         ← Cover page
├── abstract.tex          ← Abstract (~180 words)
├── Abbreviations.tex     ← List of abbreviations
├── chapter1.tex          ← Chapter 1: Introduction
├── chapter2.tex          ← Chapter 2: Literature Survey
├── chapter3.tex          ← Chapter 3: Background
├── chapter4.tex          ← Chapter 4: Requirement Specification
├── chapter5.tex          ← Chapter 5: Design and Implementation
├── chapter6.tex          ← Chapter 6: Performance Evaluation
├── chapter7.tex          ← Chapter 7: Results
├── chapter8.tex          ← Chapter 8: Future Scope
├── chapter9.tex          ← Chapter 9: Conclusion
├── references.bib        ← BibTeX bibliography
└── figures/              ← Place all images here
    ├── logo.png          ← College logo (MACE Kothamangalam)
    ├── system_arch.png   ← System architecture diagram
    ├── data_flow.png     ← Data flow diagram
    └── ...               ← Screenshots, hardware photos, charts
```

## How to Use in Overleaf

1. Create a new blank Overleaf project.
2. Upload **all `.tex` files** and the **`references.bib`** file to the project root.
3. Create a `figures/` folder inside Overleaf and upload:
   - `logo.png` – MACE college logo (required for cover page)
   - All screenshot images referenced in `chapter7.tex`
   - System architecture and data flow diagrams for `chapter5.tex`
4. Set **`main.tex`** as the main document (Project Settings → Main document).
5. Set the compiler to **pdfLaTeX**.
6. Click **Recompile**.

> **Note:** The first compile may require running BibTeX/Biber.  
> In Overleaf this happens automatically. Locally, run:  
> `pdflatex main && bibtex main && pdflatex main && pdflatex main`

## Placeholders to Fill In

Before final submission, replace the following placeholders in `coverpage.tex`:

| Placeholder | Replace with |
|---|---|
| `Member 1` … `Member 4` | Actual group member names |
| `XXXXXXXXXX` | APJ KTU registration numbers |
| `[Project Guide Name]` | Guide's full name and designation |
| `[Coordinator Name]` | Coordinator's full name and designation |

## Figure Placeholders

Chapters 5, 7, and the cover page use `\fbox{…}` placeholder boxes where images should be inserted.
Replace each `\fbox{…}` block with `\includegraphics[width=\linewidth]{figures/your_image.png}` once
the actual screenshots and diagrams are available.

## Compilation Requirements

| Package | Purpose |
|---|---|
| `mathptmx` | Times New Roman font |
| `biblatex` + `bibtex` | Bibliography management |
| `listings` | Code syntax highlighting |
| `acronym` | Abbreviations list |
| `booktabs` | Professional tables |
| `hyperref` | Hyperlinked PDF |

All packages are available in the default Overleaf TeX Live distribution.
