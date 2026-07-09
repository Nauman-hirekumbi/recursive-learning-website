# RUE — Recursive Understanding Engine

A concept-map canvas for deep learning. Ask any question and recursively
explore its key terms until you truly understand them.

## Stack
- **Next.js 14** (App Router)
- **React 18** (no ReactFlow dependency — fully custom canvas)
- **Groq** via `groq-sdk` (Llama 3.3 70B)
- Zero other UI dependencies

## Setup

```bash
# 1. Install dependencies
npm install groq-sdk

# 2. Add your API key
# Create .env.local and add:
# NEXT_PUBLIC_GROQ_API_KEY=your_key_here
# GROQ_API_KEY=your_key_here    

## File Structure

```
app/
  layout.tsx        ← root layout
  page.tsx          ← mounts FlowCanvas
  globals.css       ← resets + animations

components/
  FlowCanvas.tsx    ← entire canvas + chat + notes + toolbar

lib/
  gemini.ts         ← Gemini model singleton
  ai.ts             ← generateMainConcept + explainKeyword
```

## Controls

| Key | Action |
|-----|--------|
| V | Select tool |
| H | Pan tool |
| R | Draw rectangle |
| E | Draw ellipse |
| D | Draw diamond |
| A | Arrow tool (click node → click node) |
| T | Text tool |
| N | Note tool |
| F | Fit view |
| + / - | Zoom |
| Del | Delete selected node |
| Esc | Cancel / select tool |

Right-click any node for context menu: explore, add to notes, duplicate, delete.
Click keyword chips to recursively explore sub-concepts.