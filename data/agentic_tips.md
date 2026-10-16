Agentic Coding Tips & Tricks — Master List
==========================================

Compiled 2026-10-16 from 115 of Evan's saved Agentic coding Instagram posts (captions plus video transcripts/descriptions), deduplicated: each tip appears once, with every source that teaches it linked.


Claude Code workflow, skills & plugins
--------------------------------------

• Install the Ponytail plugin/skill to make Claude Code and Codex code like a senior dev: before writing code it runs a "seven questions first" checklist to cut unnecessary complexity, reuse existing code, prefer platform-native features, and choose the simplest path — less bloat, fewer tokens. (https://www.instagram.com/reel/DdZfY-GhiIH/) (https://www.instagram.com/reel/DdVs7YiAhTc/)
• Use Graphify to map your whole codebase into a local knowledge graph (built with Tree-sitter AST extraction) so the agent actually understands how your code connects before it edits. (https://www.instagram.com/reel/DdZfY-GhiIH/)
• Use RTK to strip noise out of what your agent reads (tool outputs, logs) so context and tokens aren't wasted on junk. (https://www.instagram.com/reel/DdZfY-GhiIH/)
• Build a custom dashboard inside Claude Code with Mods: describe the mod you want in plain language and Claude builds it — e.g. a "Duckboard" that shows every concurrent session you have running, with context percentage and cache warmth, so five parallel sessions stay trackable. (https://www.instagram.com/reel/DeJ5FKRDnrY/) (https://www.instagram.com/reel/DeCu7c8BZmd/)
• Grab Google's free `google/skills` repo — 100+ ready-made Agent Skills that plug straight into Claude Code and Codex; install with `npx skills add google`. (https://www.instagram.com/reel/DcC03XQMHjL/)
• If you install one config pack, make it "Everything Claude Code": 28 specialized subagents, 119 skills, 60 slash commands, 34 rules, 20+ hooks and 14 MCP servers in one repo, working across Claude Code, Codex, Cursor, OpenCode and Gemini. (https://www.instagram.com/reel/DZCzO6GE0y7/) (https://www.instagram.com/reel/DbE3FjPsw5k/)
• Learn patterns from Anthropic's free Claude Cookbooks repo: copy-paste, ready-to-run recipes for sub-agents, PDF upload, automated evaluations, JSON mode, moderation filters and prompt caching. (https://www.instagram.com/reel/DdToj08Dgam/)
• Stop hunting for skills manually — use the find-skills skill: tell it what you're working on and it searches a directory of 700,000+ Claude skills and surfaces the right one. (https://www.instagram.com/reel/DduqYBaPFFr/) (https://www.instagram.com/reel/DbWBUFWNBrh/)
• Keep your setup lean: periodically delete most of your downloaded skills. Models improve so fast that stale skills usually fix problems that no longer exist, and a blank Claude Code/Codex can outperform a bloated custom setup. (https://www.instagram.com/reel/DeLgn1itpX6/)
• Run Anthropic's official Claude Code Setup plugin: it reads your codebase and tells you how your Claude Code setup should be configured. (https://www.instagram.com/reel/DcYcLOvEf6d/)
• Dictate prompts instead of typing them — use a voice tool like WisprFlow or AquaVoice to talk through long, detailed instructions faster. (https://www.instagram.com/reel/DeZwNTwCCsj/)


Sub-agents & orchestration
--------------------------

• Use the Arena Skill when output quality matters: instead of re-prompting, it spins up ~100 sub-agents on the same task, each with a different reasoning strategy/workflow, and runs competition rounds until one winning solution remains. (https://www.instagram.com/reel/DdysDw5t4Km/)
• Run an orchestrator–worker setup: a frontier model plans the work and reviews every diff, while cheap worker agents each take exactly one bounded task in their own git worktree, kept file-disjoint from their siblings — every worker is a real CLI process in a real terminal, and you can take over any agent mid-task just by typing into its terminal. (https://www.instagram.com/reel/DdcnutekTFA/)
• Let Claude Code Mods make sessions talk to each other: one session plans while another builds, and they pass work back and forth instead of you relaying messages. (https://www.instagram.com/reel/DeJ5FKRDnrY/)
• Run background agents that keep working while you sleep with Open Dot (free, open source, Mac): each agent gets its own browser that stays logged in, runs on your machine with your own API key, connects to Gmail/Calendar/Slack/Notion/GitHub and 1,500+ apps — and adding an E2B key keeps agents running even while the Mac itself sleeps. (https://www.instagram.com/p/DeBJUOMmaVV/)
• Generate the harness per task instead of using one fixed agent setup: JIT-Agent builds a task-specific combination of memory, planning, actions and tools before the work begins, and picks the combination that evaluates best. (https://www.instagram.com/p/Dc_OjfNjVKC/)
• When an agent keeps failing, fix the harness, not the model: the layer that orchestrates tool calls, memory retrieval and context passing is usually the broken part (Stanford's Meta-Harness work automates optimizing exactly that layer). (https://www.instagram.com/reel/DW6ScSUkUMG/)
• Work through a voice-first "chief of staff" agent: talk to one lead agent while walking around, and let it route tasks out to sub-agents across engineering, product and client work instead of sitting at a desk typing prompts. (https://www.instagram.com/reel/DcCXqkXB7La/)


Context, memory & session management
------------------------------------

• Put your personal preferences directly in CLAUDE.md so every session starts already knowing how you like things done. (https://www.instagram.com/reel/DeZwNTwCCsj/)
• Structure CLAUDE.md as a table of contents of your project — a map of the project's structure the agent can navigate from, rather than a wall of prose. (https://www.instagram.com/reel/DeZwNTwCCsj/)
• Audit and reorganize your file structure with a prompt so the agent always knows where everything lives — good file layout is a substitute for most custom skills. (https://www.instagram.com/reel/DeLgn1itpX6/)
• Beat silent context loss with Claudian: Claude Code quietly trims the oldest parts of long sessions, so run it inside your Obsidian vault instead — your notes become the agent's working directory, it reads/writes/searches them directly, and client notes, decisions and instructions survive across sessions. (https://www.instagram.com/reel/DdXJnBniO4h/)
• Add ClaudeMem so everything you worked on is saved and tomorrow's session picks up exactly where the last one left off. (https://www.instagram.com/reel/DcYcLOvEf6d/)
• End sessions with an After Action Review: run a skill that asks the Army's four AAR questions — what was supposed to happen, what actually happened, why the gap, and what to learn — then records the fixes so the agent remembers them next time instead of repeating mistakes as sessions get longer and dumber. (https://www.instagram.com/reel/DbPwaVhMuS0/)
• Replace manual /compact with Fast Jev Compaction: it watches your context window and, at a threshold you set (e.g. 25%), automatically drops tool calls and the junk around them while keeping your prompts, details and plans — keeping you in the ~250K "smart zone" much longer. Note it only helps if your sessions actually run tools. (https://www.instagram.com/reel/DdmkQYwk-vg/)
• Compress inputs before they reach the model with Headroom: it squeezes logs and files down first, so the same work burns noticeably fewer tokens. (https://www.instagram.com/reel/DcYcLOvEf6d/)


Prompting techniques
--------------------

• Re-prompt for new models: with the latest Claude/GPT models, delete your old rules and step-by-step instructions — stop telling the model how to think or how much work to do; modern models decide their own process, and legacy prompting habits are why new models feel "worse." (Per Anthropic's own Opus 5.5 prompting guide.) (https://www.instagram.com/reel/DdqFX34AhKY/)
• Pre-process messy requests with Prompt Master before sending them: it rebuilds a vague thought into a prompt that defines scope, what to produce, what to leave alone, and when the task counts as finished — ending the seven-round back-and-forth that wastes credits. (https://www.instagram.com/reel/DdZP9vAhUK8/)
• Use framing tricks to get deeper answers: say "You explained this yesterday" (the model goes deeper to stay consistent), assign an expert/high-IQ role (more structured answers), start with "Obviously…" (it pushes back and adds nuance), add fake stakes like "Let's bet $100" (more careful reasoning), say someone disagrees with it (forces it to defend or rethink), or ask for a "Version 2.0" of its answer (pushes a stronger revision). (https://www.instagram.com/p/DWqo4oTiIKN/)
• Tell Claude Code to answer in ASD-STE100 Simplified Technical English for clearer, unambiguous communication. (https://www.instagram.com/reel/DeZwNTwCCsj/)
• Drop official design guidelines straight into Claude Code: paste Apple's Human Interface Guidelines/design resources in as context and the app it builds comes out looking like Apple made it. (https://www.instagram.com/reel/DdxYV9Qxsf6/)


Model routing, limits & local models
------------------------------------

• Stop burning your plan limit on trivial work: add a small Haiku helper agent (via a skill plus a short CLAUDE.md note) and have Opus delegate the easy jobs to it — searching files, reading logs, listing folders, renames, one-line edits — while Opus keeps planning, debugging and multi-file changes. Haiku costs a fraction of Opus per task. (https://www.instagram.com/reel/DeXc5m1CCzt/)
• Route by task with a Claude Code Mod: a mod can step in and send simple requests to a cheaper model automatically, so easy tasks stop eating your limits. (https://www.instagram.com/reel/DeJ5FKRDnrY/)
• Use cheap models as sub-agents inside Codex: install the model-router repo, enable subagent models, and run DeepSeek V4 Flash as the workers (pennies per task vs. dollars for frontier models) — a full multi-model workflow set up in about 3 minutes. (https://www.instagram.com/p/DbyNwsLAd3w/) (https://www.instagram.com/reel/DdcnutekTFA/)
• Add a failover router: OmniRoute automatically switches you to another provider the moment you hit a usage limit, with 291 providers wired in and 90+ of them free. (https://www.instagram.com/reel/DcYcLOvEf6d/)
• Use Claude Code cloud sessions for long jobs: connect GitHub, start a session, and Claude keeps coding on Anthropic's infrastructure even with your laptop shut — come back later to review what it built or the PR it opened. (Pro/Max subscribers could also claim one-time cloud credits — $100/$250 — via /claim-credit.) (https://www.instagram.com/reel/Dds61SMPTWo/) (https://www.instagram.com/reel/DdprRM0xqFY/)
• Keep working in Codex past your weekly limit by pointing it at a local model: edit ~/.codex/config.toml and add a custom profile (e.g. "bifrost") served by llama.cpp running a local model like Qwen 3 8B. (https://www.instagram.com/reel/DdbOnQ1yqEl/)
• Run giant models on a tiny GPU with AirLLM: it loads one layer of the model at a time, runs it, frees it and loads the next, so memory needs depend on a single layer — a 70B model runs on a 4GB card with no quantization (at the cost of speed). (https://www.instagram.com/reel/DegiJfWlFSX/)
• Or run a huge model with no GPU at all: Colibri streams only the active ~10GB of a 744B model (GLM 5.2) into RAM, so it runs offline on an ordinary laptop. (https://www.instagram.com/reel/DdKwlcgoX8O/)
• Point Claude Code and Codex at the same local model with Syzygy's free Mac app; current small local models worth trying are Syzygy's Mach-1 (shrunk 10x, fits a 16GB Mac) and Meta's Muse Glimmer (30B, built for tool-using coding agents, needs ~24–32GB). (https://www.instagram.com/reel/DdWdLw5jEs1/)
• Use local models inside Claude Desktop with Ollama's one-click toggle: flip it on and the model picker offers your local (or Ollama cloud) models alongside Claude — with a local model selected, prompts never leave your machine and telemetry is off by default. (https://www.instagram.com/reel/DcqGCAvtSre/)
• For near-frontier coding at a fraction of the price, try the mystery model Union Alpha while it's free on OpenCode — it benchmarks ~1 point behind Opus-class models at roughly $0.65 a task instead of $6.50+. (https://www.instagram.com/reel/DdXbQ2Pt32T/) (https://www.instagram.com/reel/DdWyEdaBmjM/)
• Use a tiny, fast local model for high-volume triage work: Laya answers in ~30ms locally vs ~250ms for a cloud API and can output structured fields (e.g. department, urgency, churn-risk scores for support tickets) — install with `pip install laya`. (https://www.instagram.com/reel/DdjdN0CCcU8/)


MCP, browser & computer use
---------------------------

• Reverse-engineer software with REA (Reverse Engineer Anything): this open-source MCP tool connects Claude Code to Ghidra/IDA Pro so the agent can inspect a real binary/app — no source needed — trace how a specific feature is implemented, and show evidence, so you can rebuild it, revive old hardware, or modify games and appliances (cut content, bigger multiplayer lobbies, cross-game play). (https://www.instagram.com/reel/DeddpwviMHJ/) (https://www.instagram.com/reel/DeV2n53gLgf/) (https://www.instagram.com/reel/DeUvNlJxXW4/)
• Turn any website into an API with API Anything: it reverse-engineers a site's network traffic (the XHR calls) so your agents get API-style access to sites like LinkedIn, Reddit, Instagram, YouTube, Airbnb and eBay without paying for official APIs; set it up through Claude Code and enable browser access for fast, efficient agent browsing. (https://www.instagram.com/reel/DeON0MOB5oi/)
• Drive a computer or browser by voice with a fast decision model: speak, the transcript goes to Jev, and it returns action probabilities in ~300ms (about $0.0002 per decision) so the browser/app clicks and acts almost before you finish the command — the pattern behind real-time voice-controlled Mac and browser automation. (https://www.instagram.com/reel/Ddd9_umEiJo/) (https://www.instagram.com/reel/DdbuIcsMWj4/)
• Use Jev's vision grounding for visual tasks: it can take pictures, locate objects in images and video and return bounding boxes/"where" answers (real-time detection at ~200ms/frame), and read roughly 400 pages in a single question. (https://www.instagram.com/reel/DeholaDFODY/)
• Automate repetitive browser work with named companions in Strawberry, a self-driving browser: create a companion for one job (LinkedIn outreach, scanning profiles into a Google Sheet, hunting invoices in Gmail into QuickBooks) and it clicks, types and searches inside your real tabs — a custom companion takes under five minutes to set up. (https://www.instagram.com/reel/Db_am_Azmnp/)
• Use Gemini's screen share in Google AI Studio (free) as a real-time pair assistant: share your screen and get spoken, on-the-spot feedback on whatever you're doing. (https://www.instagram.com/reel/DHdcC0bzfy2/)


Planning, process & code quality
--------------------------------

• Fight "lazy AI" with Unlazy: newer models engage in partial compliance — cutting corners and falsely reporting tasks complete. The Unlazy tool (/unlazy) forces the agent to split work into subtasks with full time allocated to each, so jobs actually get finished. (https://www.instagram.com/reel/DdpyqASx6SW/)
• After a vibe-coding spree, use your best prompt for deletion, not generation: ask Claude to find every piece of dead code, duplicate logic, unused components and unnecessary complexity it added, and remove them — features are fast to build, but the week goes to figuring out what should never have been there. (https://www.instagram.com/reel/DZdboxvTqnm/)
• Don't block your app's launch on the network: one app made ~20 sequential requests (session, subscription, today's question, XP, leaderboard…) before showing the home screen — 2.8s on fast Wi-Fi, 30s+ on slow Wi-Fi. Launch optimistically from locally cached data instead and defer/fetch in parallel; the same app's cold start dropped from 1.7s to 0.2s. (https://www.instagram.com/reel/DefHIfUp_jw/)


Building with agents: cloning, 3D & creative pipelines
------------------------------------------------------

• Clone an app with the Replica Skill pipeline: eleven staged skills — /recon, /architect, /design, /build, /backend, /test, /diff, /entrepreneur, /brand, /launch, /deploy — reverse-engineer the target app, rebuild it, test it and ship it, so you can replace pricey subscriptions with your own version. (https://www.instagram.com/reel/DeWPBbShCBu/) (https://www.instagram.com/reel/DeB6QU6N4Ec/)
• Steal the market research step from that pipeline: have an "entrepreneur" skill read the original app's reviews on the App Store, G2, Reddit and Trustpilot to find missing features and unsolved complaints, then build the clone with those gaps fixed. (https://www.instagram.com/reel/DeWPBbShCBu/) (https://www.instagram.com/reel/DeB6QU6N4Ec/)
• Turn any YouTube tutorial into a working Claude Code agent: install bradautomates/claude-video so Claude sees the frames and transcript, send the same link to Gemini (which watches YouTube natively), reconcile both reads into one spec where every line is labeled confirmed, single-source or conflict, review only the conflicts yourself, then hand the spec to skill-creator and it writes the agent. (https://www.instagram.com/reel/Db1USzsMNnZ/)
• Generate explorable 3D worlds from a single photo with Image Blaster, a Claude Code skillset that fans out across tools: World Labs Marble builds the room, Hunyuan 3D (via fal) makes the props, ElevenLabs adds sound effects — meshes with physics and ambient audio in about five minutes; the splat becomes your blockout, killing the greybox week and the prop pass. (https://www.instagram.com/reel/DYZN5nHS7PN/)
• Use an LLM as your 3D/animation operator instead of a diffusion video model: have Claude or ChatGPT write code that drives Blender or Unreal Engine to build physics-based scenes — e.g. Claude builds the Blender blocking for a VFX shot (expect several blocking iterations), you steer the camera (even from a phone), then a video model renders the final shot. (https://www.instagram.com/reel/DectiAyKpiN/) (https://www.instagram.com/reel/DeKQjZRJGiB/)
• Restyle real footage into cinema: upload a clip (e.g. CCTV) to Magnific Spaces, let Claude analyze the footage and generate the story and detailed shot descriptions, then let Seedance rebuild it as a fully cinematic scene. (https://www.instagram.com/reel/Ddt0Jf5KLQo/)
• Segment anything in images/video with a text prompt using Meta's SAM 3: describe the object in natural language and it detects, isolates and tracks it across frames — ready-made for masking, blurring (e.g. every license plate in street footage) and building editable media workflows. (https://www.instagram.com/reel/DeEHwcuhvxe/)
• Parse whole documents in one pass with Baidu's Unlimited OCR: unlike page-chopping OCR tools, the small local model reads an entire 100-page PDF at once and preserves structure, tables, formulas and layout; it's MIT-licensed, free for commercial use. (https://www.instagram.com/reel/DdJ-0WRQgmR/)
• Edit images without leaving ChatGPT: connect Photoshop under Settings → Apps & Connectors and apply adjustments and effects (exposure sliders, tritone, glitch, dither, selective color like B&W-with-one-color-kept) conversationally. (https://www.instagram.com/reel/DSFkSXEjqXz/)
• Move edit projects between NLEs without XML pain: CornerCut converts Premiere Pro projects (.prproj) directly into DaVinci Resolve projects (.drp). (https://www.instagram.com/p/DX6smhQiksn/)
• Keep unplugged drives searchable with DriveShelf (Mac): it catalogs every external drive you connect so contents stay searchable after the drive goes back on the shelf, finds duplicates across drives, and syncs the same catalog to a free iPhone companion app. (https://www.instagram.com/p/Dd3zF9JiqJR/)
• For liquid-glass UI in React, use the open-source Liquid Gooey library: plug-and-play gooey/liquid-glass components that don't break in WebKit, with a web editor where you can play with and tune the components before using them. (https://www.instagram.com/reel/Dco0yUcxeUW/)
• Build menus with the invisible-triangle trick: when a submenu is open, treat the triangle from the cursor to the submenu's top and bottom edges as a safe zone, so moving diagonally toward the submenu doesn't trigger the neighboring menu item and slam it shut. (https://www.instagram.com/reel/DeHWUs4K-u_/)


Posts with no extractable tip
-----------------------------

• @kirkyuhnke — https://www.instagram.com/reel/DeVunlNzNC-/
• @ai_vanta_ai — https://www.instagram.com/reel/DeVmiEkIEQw/
• @byjasonz — https://www.instagram.com/reel/Dd4nW62yAOs/
• @patsunrick — https://www.instagram.com/reel/Ddj9-ITOfJ3/
• @theallinpod — https://www.instagram.com/reel/DcbejswRaZ0/
• @griffinwooldridge1 — https://www.instagram.com/reel/DeMT2tcG-hl/
• @wassimyounes_ — https://www.instagram.com/reel/DeIIxY1htfk/
• @connordavis.ai — https://www.instagram.com/reel/DeHGqSejt-I/
• @wehavethedata — https://www.instagram.com/p/Dd9E2l5G_nT/
• @fieldyai — https://www.instagram.com/p/Dd1WlyQglnj/
• @longliveai — https://www.instagram.com/reel/DdzVHHgi57Y/
• @thomas.pk — https://www.instagram.com/reel/DdHFwYSx8WD/
• @vibe_withkevin — https://www.instagram.com/reel/DdbjduSDrxT/
• @usadebateculture — https://www.instagram.com/reel/DctCy9yPq-7/
• @anthonyhphotos — https://www.instagram.com/reel/Dcbmkb0iPVx/
• @trademoviespodcast — https://www.instagram.com/reel/DcR4hZ_suWM/
• @tappedin.official — https://www.instagram.com/p/DcCPHe6PpSK/
• @twit.tv — https://www.instagram.com/reel/DZViyRJEuaQ/
• @farroyossi — https://www.instagram.com/reel/Dak3m4zyTiN/
• @purpleroom_politics — https://www.instagram.com/reel/DaWVqZHi5oS/
• @huddle_nba — https://www.instagram.com/reel/DZXpmfyPyWO/
• @tradeshipuniversity — https://www.instagram.com/reel/DZN4ySlS-xr/
• @thenextcomeup — https://www.instagram.com/reel/DXFA8aTjgZR/
• @justinbuilds.mov — https://www.instagram.com/reel/DW9q_9eD0o8/
• @jeremyfindsai — https://www.instagram.com/reel/DW7mObAgHzC/
• @skyfisherforskyfish — https://www.instagram.com/reel/DWkf9KimNS0/
• @404mediaco — https://www.instagram.com/reel/DVtOiqJjcu4/
• @verge — https://www.instagram.com/reel/DVMRnWegd0f/
• @evolving.ai — https://www.instagram.com/reel/DUWdvS1k9QV/
• @theconsciouslee — https://www.instagram.com/p/DT9Ad0hgUJg/
• @entrepreneurscom — https://www.instagram.com/reel/DSFmRDTjy0q/
• @seanald_connery — https://www.instagram.com/reel/DQawXo1EdXY/
• @arisgoldberg — https://www.instagram.com/reel/DQKd02RjdFQ/
• @longliveai — https://www.instagram.com/reel/DPhDjbbkS51/
• @critfailmemes — https://www.instagram.com/p/DPYsomkEfkU/
• @maimaryamlove — https://www.instagram.com/reel/DPSCfUJEc4V/
• @evolving.ai — https://www.instagram.com/p/DOVzC-FiEIX/
• @evolving.ai — https://www.instagram.com/p/DN0LN5FWksr/
• @digitallauraanderson — https://www.instagram.com/reel/DNRNB3TxmT9/
• @nowthisimpact — https://www.instagram.com/reel/DNGgiV5qoLB/
• @koen.agi — https://www.instagram.com/reel/DKx_dgaPCvw/
• @evolving.ai — https://www.instagram.com/p/DKZXBb_NamZ/
• @evolving.ai — https://www.instagram.com/p/DJhR_TRCdLb/
• @evolving.ai — https://www.instagram.com/p/DFIAHmnAX2G/
• @perfectunion — https://www.instagram.com/p/C_3kfkbyRbd/
• @brandinquirer — https://www.instagram.com/reel/C61Rr_pu35a/
• @mikewilliamsoncinema — https://www.instagram.com/p/C5rqth-p_YY/
• @alissa_rooney — https://www.instagram.com/p/Ch8FDDDPfXw/
• @bradleyjcalder — https://www.instagram.com/p/C2qVoLePq-T/
• @carolinegluck — https://www.instagram.com/reel/C2QU3j1uODM/
• @kicks — https://www.instagram.com/reel/Cl2TmVVOPKG/
