# Merge Instructions: AI Chatbot + Enhanced Roadmap Features

**For your teammates using Cursor.** Open your UpSkillHK project in Cursor, then follow each step below. You can paste each step's instructions into Cursor's chat and it will apply the changes for you.

---

## STEP 1: Create new files

Tell Cursor: **"Create these 3 new files with the exact content below."**

### File: `lib/sounds.ts`

```ts
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  rampDown = true,
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported
  }
}

export function playClick() {
  playTone(800, 0.06, 'sine', 0.12);
}

export function playSelect() {
  playTone(600, 0.05, 'sine', 0.1);
  setTimeout(() => playTone(900, 0.07, 'sine', 0.1), 40);
}

export function playSuccess() {
  playTone(523, 0.12, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 100);
  setTimeout(() => playTone(784, 0.18, 'sine', 0.14), 200);
}

export function playError() {
  playTone(330, 0.15, 'triangle', 0.12);
  setTimeout(() => playTone(260, 0.2, 'triangle', 0.1), 120);
}

export function playNavigate() {
  playTone(440, 0.08, 'sine', 0.08);
  setTimeout(() => playTone(660, 0.06, 'sine', 0.06), 50);
}

export function playToggle(on: boolean) {
  playTone(on ? 700 : 500, 0.06, 'sine', 0.1);
}

export function playExpand() {
  playTone(400, 0.05, 'sine', 0.08);
  setTimeout(() => playTone(550, 0.06, 'sine', 0.08), 40);
}

export function playCollapse() {
  playTone(550, 0.05, 'sine', 0.08);
  setTimeout(() => playTone(400, 0.06, 'sine', 0.08), 40);
}
```

### File: `app/api/chat/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';

const SYSTEM_PROMPT = `You are a friendly, knowledgeable career coach assistant embedded in a career roadmap tool for Hong Kong professionals.

Your role:
- Help users understand their roadmap tasks and how to approach them
- Explain concepts, skills, and topics that appear in their learning plan
- Guide users to find answers themselves — suggest specific search terms, YouTube channels, documentation, and courses
- Provide actionable, step-by-step advice when users feel stuck

When answering:
1. Be concise but helpful (2-4 short paragraphs max)
2. ALWAYS include 1-3 concrete sources at the end of your response in this exact format:
   📹 [Video title] - Channel/Creator (search: "suggested YouTube search query")
   📄 [Article/Doc title] - Source (search: "suggested Google search query")
   📚 [Course title] - Platform (e.g. Coursera, edX, HKU SPACE)
3. Prefer real, well-known resources (YouTube channels like Fireship, freeCodeCamp, Khan Academy, CrashCourse, The Plain Bagel, etc.)
4. For HK-specific topics, suggest local resources (HKU SPACE, CUHK, HKICPA, SFC website, etc.)
5. Encourage the user — remind them that roadmap tasks are suggestions and they can explore beyond them

IMPORTANT: You have context about the user's current roadmap. Use it to give targeted advice. If the user asks something unrelated to career development, gently redirect them.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, roadmapContext } = (await request.json()) as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      roadmapContext?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'No message provided' }, { status: 400 });
    }

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json(
        { success: false, error: 'No API key configured.' },
        { status: 503 }
      );
    }

    const systemContent = roadmapContext
      ? `${SYSTEM_PROMPT}\n\nCURRENT ROADMAP CONTEXT:\n${roadmapContext}`
      : SYSTEM_PROMPT;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemContent },
        ...messages,
      ],
      temperature: 0.6,
      max_tokens: 800,
      ...(IS_POE ? {} : {}),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return NextResponse.json({ success: true, reply: content.trim() });
  } catch (err) {
    console.error('chat error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
```

### File: `components/roadmap/RoadmapChat.tsx`

This file is very long. Tell Cursor:

**"Create `components/roadmap/RoadmapChat.tsx`. It's a floating AI chatbot component with a custom waffle SVG button that appears on the roadmap page. It accepts `roadmaps: CareerRoadmap[]` and optional `selectedPath?: string` as props. It sends messages to `/api/chat` with roadmap context and displays responses with formatted source links (video/article/course). The button has steam particles, a warm glow, and bouncy click animations using framer-motion. Import sounds from `@/lib/sounds`."**

Then paste the full content from the file I'll include at the bottom of this document (Appendix A).

---

## STEP 2: Update `lib/types.ts`

Tell Cursor: **"Add these new types to `lib/types.ts`."**

Add this interface BEFORE the `WeekPlan` interface:

```ts
export interface WeekVideo {
  title: string;
  channel?: string;
  description: string;
  url?: string;
  duration?: string;
  whyWatch: string;
}
```

Add this field to the `WeekPlan` interface:

```ts
recommendedVideos?: WeekVideo[];
```

Add this interface BEFORE the `LearningTask` interface (if it doesn't already exist):

```ts
export interface LearningResource {
  type: 'video' | 'article' | 'course' | 'tool';
  title: string;
  description?: string;
  url?: string;
}
```

Add these fields to the `LearningTask` interface:

```ts
learningGuide?: string;
resources?: LearningResource[];
```

---

## STEP 3: Update `lib/prompts.ts` (roadmap prompt)

Tell Cursor: **"In `lib/prompts.ts`, add these two additions to the `ROADMAP_GENERATION_PROMPT`."**

**Addition 1:** After the line about resources (the `Do NOT skip resources` line), add:

```
4b. For EVERY week, include a "recommendedVideos" array of 2-3 video objects. These are the best videos for that week's theme. Each video object has:
   - title: the video title (use REAL YouTube video titles when possible)
   - channel: the YouTube channel or creator name (e.g. "Fireship", "freeCodeCamp", "CFA Institute", "HKICPA Official")
   - description: 1 sentence about what the video covers
   - url: a YouTube search URL like "https://www.youtube.com/results?search_query=<topic>" so the user can find it. Use a real video URL if you know it exists.
   - duration: estimated video length (e.g. "12 min", "45 min")
   - whyWatch: 1 sentence explaining why this video is useful for this week's learning goals
   Prioritise REAL, well-known YouTube channels and educational creators relevant to the topic (e.g. 3Blue1Brown for math, Fireship for tech, Khan Academy, CrashCourse, The Plain Bagel for finance, etc.). If no well-known video exists for a niche HK-specific topic, suggest a search query the user can look up.
```

**Addition 2:** At the very end of the prompt (the return format section), add this line:

```
Each week in weeklyPlan[] must have: weekNumber, theme, tasks, estimatedHours, recommendedVideos (array of 2-3 objects with: title, channel, description, url, duration, whyWatch).
```

---

## STEP 4: Update `app/api/roadmap/route.ts`

Tell Cursor: **"In the roadmap API route, update the normalizer to handle video recommendations, learning guides, and learning resources."**

The key changes:
1. Import `WeekVideo` and `LearningResource` from `@/lib/types`
2. Inside `normalizeRoadmaps`, for each task, normalize `resources` (array of `LearningResource` objects with type, title, description, url) and `learningGuide` (string)
3. For each week, normalize `recommendedVideos` (array of `WeekVideo` objects with title, channel, description, url, duration, whyWatch)
4. Add fallback resources when none are provided

The full updated `normalizeRoadmaps` function and imports are in Appendix B at the bottom.

---

## STEP 5: Replace roadmap UI components

Tell Cursor: **"Replace these 3 roadmap components with updated versions that display video recommendations, learning resources, and sound effects."**

### Replace `components/roadmap/LearningItem.tsx`

The updated version adds:
- A `ResourceBlock` sub-component that displays suggested resources (videos, articles, courses, tools) with icons and optional links
- A "How to do this" expandable section showing `learningGuide` and `resources`
- Sound effects on expand/collapse

Full content in Appendix C.

### Replace `components/roadmap/WeeklyPlan.tsx`

The updated version adds:
- A `VideoCard` component that displays recommended YouTube videos with channel, duration, and "why watch" text
- A "Recommended Videos for This Week" section at the bottom of each expanded week
- An encouraging message at the bottom of the plan
- Sound effects on expand/collapse

Full content in Appendix D.

### Update `components/roadmap/PathSelector.tsx`

Add an `onPathChange` callback prop:
- Add `onPathChange?: (pathType: string | null) => void` to the props interface
- Call `onPathChange?.(next?.pathType ?? null)` when a path is selected/deselected

Full content in Appendix E.

---

## STEP 6: Add chatbot to roadmap page

Tell Cursor: **"In `app/roadmap/page.tsx`, add the AI chatbot."**

1. Add these imports:
```ts
import { RoadmapChat } from '@/components/roadmap/RoadmapChat';
import { playSuccess, playError } from '@/lib/sounds';
```

2. Add state: `const [activePath, setActivePath] = useState<string | null>(null);`

3. Update PathSelector: `<PathSelector roadmaps={roadmaps} onPathChange={setActivePath} />`

4. Add chatbot after the closing `</div>` of the main content wrapper:
```tsx
<RoadmapChat roadmaps={roadmaps} selectedPath={activePath ?? undefined} />
```

5. Optionally add `playSuccess()` after successful roadmap fetch and `playError()` after failures.

---

## That's it!

After applying all steps, run `npm run dev` and go to the roadmap page. You should see:
- Video recommendations in each week's expanded view
- Learning resources with "How to do this" buttons on each task
- A floating waffle chatbot button in the bottom-right corner
- Sound effects on interactions

---

## Appendix A: `components/roadmap/RoadmapChat.tsx`

(Paste this entire file to Cursor when creating the component)

See the file directly at: `components/roadmap/RoadmapChat.tsx` in the sender's project.
Your friend should send you this file separately (it's ~410 lines).

## Appendix B: Updated `app/api/roadmap/route.ts`

See the file directly at: `app/api/roadmap/route.ts` in the sender's project.
Your friend should send you this file separately (it's ~133 lines).

## Appendix C: Updated `components/roadmap/LearningItem.tsx`

See the file directly at: `components/roadmap/LearningItem.tsx` in the sender's project.
Your friend should send you this file separately (it's ~128 lines).

## Appendix D: Updated `components/roadmap/WeeklyPlan.tsx`

See the file directly at: `components/roadmap/WeeklyPlan.tsx` in the sender's project.
Your friend should send you this file separately (it's ~160 lines).

## Appendix E: Updated `components/roadmap/PathSelector.tsx`

See the file directly at: `components/roadmap/PathSelector.tsx` in the sender's project.
Your friend should send you this file separately (it's ~58 lines).
