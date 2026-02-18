export const DEMO_CV_TEXT = `JAMES MITCHELL
Software Engineer
james.mitchell@email.com | +44 7700 900123 | London, UK | github.com/jmitchell

PROFESSIONAL SUMMARY
Software engineer with 3 years of experience building web applications using JavaScript, React, and Node.js. Passionate about clean code and user experience. Looking for a challenging role at a growing tech company.

EXPERIENCE

Junior Software Engineer — TechStartup Ltd, London
June 2021 – Present
- Built and maintained internal dashboards using React and TypeScript
- Collaborated with the design team to implement responsive UI components
- Participated in code reviews and sprint planning meetings
- Helped migrate legacy jQuery codebase to React
- Wrote unit tests using Jest and React Testing Library

Intern Software Developer — WebAgency Co, Manchester
Jan 2021 – May 2021
- Assisted senior developers with bug fixes and feature implementation
- Created landing pages using HTML, CSS, and JavaScript
- Learned Git workflow and agile methodologies

EDUCATION

BSc Computer Science — University of Manchester
2018 – 2021
- 2:1 Classification
- Dissertation: "Building Accessible Web Applications"

SKILLS
Languages: JavaScript, TypeScript, Python, HTML, CSS
Frameworks: React, Node.js, Express
Tools: Git, VS Code, Jira, Figma
Databases: PostgreSQL, MongoDB
Other: REST APIs, Agile, Unit Testing

CERTIFICATIONS
- AWS Cloud Practitioner (2022)
- freeCodeCamp Responsive Web Design

INTERESTS
Open source, hiking, chess, tech meetups`;

export type DemoIntensity = "soft" | "medium" | "hard" | "nuclear";

export const DEMO_ROASTS: Record<DemoIntensity, string> = {
  nuclear: `# 🔥 Ruthless CV Review — Nuclear Mode

## Score: 3/10

Let me be blunt: this CV is an insult to the recruiter's time. It reads like a LinkedIn profile written by someone who Googled "how to make a CV" five minutes before a deadline. Three years of experience and *this* is what you have to show for it?

## Strengths (If Any)

- You… have a degree? Congratulations, so does everyone else.
- At least you know React exists. That's technically a strength in the same way knowing what a hammer is makes you a carpenter.

## Fatal Flaws

1. **Your "Professional Summary" is a professional tragedy.** "Passionate about clean code and user experience" — wow, how original. You and every other developer who copied that line from a Medium article. This tells me absolutely nothing about what makes you worth hiring over the 500 other applicants.

2. **Zero quantifiable impact.** You "built and maintained internal dashboards." Incredible. Did anyone use them? Did they improve anything? You "helped migrate" a codebase — were you the one doing the work or the one fetching coffee? Without numbers, I assume the latter.

3. **Your skills section is a laundry list of desperation.** Listing HTML and CSS as skills in 2024 is like listing "can use a keyboard" on your CV. And "Agile"? That's not a skill, that's an environment you sat in while checking your phone during standup.

4. **freeCodeCamp certification listed alongside AWS.** One of these costs money and requires study. The other one is a participation trophy. Listing both tells me you can't distinguish between meaningful credentials and time-wasters.

5. **Your internship description is padding.** "Assisted senior developers with bug fixes" = you watched someone else code. "Learned Git workflow" = you learned the absolute bare minimum to be employable. This shouldn't be on a CV with 3 years of experience.

6. **"Interests: hiking, chess, tech meetups"** — Nobody. Cares. This space could've been used for actual projects, contributions, or anything demonstrating competence.

## How to Fix It

Stop describing what you *did* and start proving what you *achieved*. Every bullet point should have a measurable outcome. Kill the filler, kill the generic summary, and for the love of everything — remove freeCodeCamp from your certifications.

## Immediate Action Checklist

- [ ] Rewrite professional summary with specific expertise, unique value prop, and target role — no buzzwords
- [ ] Add metrics to EVERY work bullet: users served, performance improvements, lines migrated, PRs reviewed
- [ ] Remove HTML/CSS/Agile from skills — they're assumed, not impressive
- [ ] Delete the internship entirely or compress to one impactful line
- [ ] Remove freeCodeCamp certification — it undermines your credibility
- [ ] Replace "Interests" section with a "Projects" section showcasing actual work
- [ ] Add 2-3 side projects with links, tech stack, and outcomes
- [ ] Get someone with hiring experience to tear this apart again after revisions`,

  hard: `# 🔥 Ruthless CV Review

## Score: 4/10

This CV does the bare minimum and it shows. You have 3 years of experience but your CV reads like someone fresh out of a bootcamp. There's no evidence of impact, no projects, and your skills section looks copy-pasted from a tutorial.

## Strengths

- You have relevant tech stack experience (React, TypeScript, Node.js)
- Degree from a reputable university with a relevant dissertation topic
- AWS Cloud Practitioner shows some initiative

## Fatal Flaws

1. **No measurable impact anywhere.** Every bullet point is a task description, not an achievement. "Built dashboards" — how many users? What was the business impact? Did you improve load times? Revenue? Anything?

2. **Generic professional summary.** "Passionate about clean code" is meaningless filler. Every developer says this. What specifically do YOU bring?

3. **Skills section needs pruning.** HTML, CSS, and "Agile" are not differentiating skills for a 3-year engineer. They're baseline expectations.

4. **No side projects or portfolio.** Your GitHub link is there but nothing highlights what's on it. Reviewers won't click — show them.

5. **Internship is dead weight.** At 3 years experience, "assisted senior developers" and "learned Git" actively hurt your credibility.

## How to Fix It

Quantify everything. Replace task descriptions with impact statements. Add a projects section. Cut the fluff.

## Immediate Action Checklist

- [ ] Add metrics to every bullet point (users, performance gains, time saved)
- [ ] Rewrite summary with specific value proposition and target role
- [ ] Remove HTML/CSS from skills section
- [ ] Add 2-3 notable projects with links and tech details
- [ ] Compress or remove internship section
- [ ] Replace interests with projects or contributions`,

  medium: `# 🔥 CV Review

## Score: 5/10

Your CV has a solid foundation but falls short of standing out. The experience is relevant, but the presentation lacks the specificity that hiring managers look for. Let's tighten this up.

## Strengths

- Relevant tech stack that matches modern frontend roles
- Clear progression from intern to junior engineer
- AWS certification shows learning initiative
- Clean, readable format

## Areas for Improvement

1. **Vague bullet points.** "Built and maintained internal dashboards" tells me what, but not how well. Add context: team size, user count, key metrics.

2. **Summary is too generic.** It could belong to any developer. Tailor it to the specific type of role you're targeting.

3. **Skills list could be more strategic.** Separate "proficient" from "familiar" — listing everything equally dilutes your strongest skills.

4. **Missing projects section.** Side projects and open-source contributions are your chance to demonstrate initiative beyond your day job.

5. **Internship takes up too much space.** At your experience level, condense it to 1-2 lines maximum.

## How to Fix It

Focus on outcomes over activities. Every bullet should answer: "What did I do, how did I do it, and what was the result?"

## Immediate Action Checklist

- [ ] Add quantifiable results to each work experience bullet
- [ ] Tailor professional summary to target role type
- [ ] Reorganize skills by proficiency level
- [ ] Add a projects section with 2-3 highlighted works
- [ ] Condense internship to one impactful line`,

  soft: `# 📝 CV Review

## Score: 6/10

You've got a decent foundation here! Your experience is relevant, your education is solid, and you're clearly on the right career path. With some targeted improvements, this CV could really shine. Here's what to focus on.

## Strengths

- Strong relevant tech stack — React, TypeScript, and Node.js are in high demand
- Good career progression from internship to junior role
- AWS certification demonstrates continuous learning
- Relevant dissertation topic shows genuine interest in the field
- Clean, well-organized layout

## Suggestions for Improvement

1. **Add impact metrics.** Your bullet points describe tasks well, but adding numbers (e.g., "served 500+ internal users" or "reduced load time by 30%") would make them much more compelling.

2. **Strengthen your summary.** Consider making it more specific to your target role. What unique perspective do you bring?

3. **Showcase projects.** Adding 2-3 side projects or open-source contributions would really strengthen your profile — especially with GitHub links.

4. **Streamline skills.** Consider highlighting your strongest skills more prominently and removing the basics that are assumed for your experience level.

5. **Evolve past the internship.** You might consider condensing the internship to make room for more impactful content like projects.

## How to Fix It

The core strategy: replace activity descriptions with achievement statements. You clearly have the skills — now prove the impact.

## Immediate Action Checklist

- [ ] Add 1-2 metrics to each work experience bullet point
- [ ] Write a targeted professional summary for your ideal role
- [ ] Create a projects section highlighting your best work
- [ ] Prioritize skills by proficiency and relevance
- [ ] Consider condensing the internship section`,
};

export const DEMO_SUITABILITY: Record<string, number> = {
  "demo-1": 72,
  "demo-2": 38,
  "demo-3": 65,
  "demo-4": 58,
  "demo-5": 45,
  "demo-6": 32,
};

export const DEMO_PROJECTED_SCORES: Record<string, number> = {
  "demo-1": 89,
  "demo-2": 61,
  "demo-3": 82,
  "demo-4": 78,
  "demo-5": 68,
  "demo-6": 55,
};
