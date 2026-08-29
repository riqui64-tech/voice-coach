# Voice Coach — Clean Build

Clean-slate Vercel site with one purpose: microphone input -> interviewer question -> simple professional answer first.

## Deploy
1. Put these files in a GitHub repository or deploy the folder with Vercel CLI.
2. In Vercel Project Settings -> Environment Variables, add `AI_GATEWAY_API_KEY`.
3. Optional: set `VOICE_COACH_MODEL` to a valid Vercel AI Gateway model ID.
4. Deploy.

## Behavior
- Chrome/Edge SpeechRecognition for fast browser transcription.
- Each finalized speech segment replaces the previous question instead of accumulating the entire interview.
- Automatically requests an answer shortly after a final speech segment.
- Primary output: Say This.
- Secondary: thought process, what they are testing, technical depth, likely follow-up.
- Off-script questions are allowed by the prompt.

## Practice note
Designed for interview practice and preparation. Keep answers truthful and use it to build your own response ability.
