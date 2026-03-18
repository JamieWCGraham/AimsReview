# AimsReview
A lightweight web app that allows a researcher to paste in the Specific Aims section of a grant proposal and receive structured reviewer-style feedback on likely weaknesses.

## What it does
Users paste in the Specific Aims section of a grant proposal and receive structured reviewer-style feedback focused on likely strengths, concerns, and revision opportunities.

## MVP Principles
- structured outputs
- strict schema validation
- thin API layer
- isolated AI logic
- versioned prompts
- minimal infrastructure

## Stack
- Next.js
- TypeScript
- Tailwind CSS
- OpenAI API
- Zod

## Non-goals
- no auth
- no database
- no PDF upload
- no multi-section proposal analysis
- no scientific fact-checking

## Environment
Create `.env.local`:

OPENAI_API_KEY=your_key_here

## Run locally
npm install
npm run dev