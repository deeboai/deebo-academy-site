export const ACADEMY_UPDATED_AT = "April 20, 2026";

// Keep this flag false while the testimonials page stays out of public view.
export const ACADEMY_TESTIMONIALS_ENABLED = false;

export const ACADEMY_SITE_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/subjects", label: "Subjects" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  ...(ACADEMY_TESTIMONIALS_ENABLED
    ? ([{ href: "/testimonials", label: "Testimonials" }] as const)
    : []),
  { href: "/book", label: "Book" },
] as const;

export const ACADEMY_SUPPORT_EMAIL = "support@deeboai.com";
export const ACADEMY_CONSULTATION_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2-QG9RFTSoUAau6Rh1u79xVafPpywL2B6ZxaQVrU3cx1uT6YUp3KZE18TRgSDb03jCCk0Xs32g?gv=true";
export const ACADEMY_TESTIMONIAL_BUCKET = "academy-testimonials";

// These courses are reviewed through intake rather than assumed to be standard tutoring fits.
export const ACADEMY_COLLEGE_REQUESTS = [
  "Calculus",
  "Chemistry",
  "Biology",
  "Biochemistry",
  "Computer Science",
  "Physics",
  "Psychology",
  "Sociology",
] as const;

export const ACADEMY_HIGHLIGHTS = [
  "Algebra through calculus",
  "Biology, chemistry, physics, and French",
  "Online tutoring with clear follow-through",
  "High school and college-level support by intake fit",
] as const;

export const ACADEMY_HOME_STATS = [
  {
    value: "1:1",
    label: "One student, one course load, and one plan built around what needs attention now.",
  },
  {
    value: "Middle school to college",
    label: "Support spans foundational math and science courses through select advanced undergraduate work.",
  },
  {
    value: "Clear follow-through",
    label: "Each session stays tied to the class, the next assignment, and what still needs work.",
  },
  {
    value: "Online-first",
    label:
      "Screen sharing, digital whiteboarding, and recap-friendly sessions keep the workflow consistent.",
  },
] as const;

export const ACADEMY_HOME_MEDIA = [
  {
    title: "Focused tutoring sessions",
    description:
      "Sessions are prepared around the current class, the next assignment, and the exact skill that is still slowing the student down.",
    imageSrc:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Students paying attention during a lesson.",
  },
  {
    title: "Online study workflow",
    description:
      "Remote delivery keeps tutoring consistent across homework review, digital whiteboarding, and session follow-up.",
    imageSrc:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Students gathered around a laptop in a study session.",
  },
  {
    title: "Academic environment",
    description:
      "The site keeps the DeeboAI look while shifting the focus to coursework, preparation, and steady academic support.",
    imageSrc:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A notebook and books set on a study desk.",
  },
] as const;

export const ACADEMY_SESSION_BREAKDOWN = [
  {
    title: "Concept reset",
    description:
      "Start by isolating the exact idea that is blocking progress and explain it in direct, usable language.",
  },
  {
    title: "Worked examples",
    description:
      "Walk through representative problems so the student can see the setup, the decision points, and the clean solution path.",
  },
  {
    title: "Guided reps",
    description:
      "Students work the problems live and get corrected in the moment so the session builds process, not passive familiarity.",
  },
  {
    title: "Recap and next step",
    description:
      "Each session closes with a concise summary of what improved, what still needs reinforcement, and the next task to focus on.",
  },
] as const;

export const ACADEMY_PARENT_POINTS = [
  {
    title: "Clear communication",
    description:
      "The booking contact gets a readable picture of what was covered and what should be reinforced before the next session.",
  },
  {
    title: "Structured support",
    description:
      "Sessions are built around repeatable problem types, course expectations, and the student’s current pace.",
  },
  {
    title: "Calm follow-through",
    description:
      "The goal is tutoring that feels organized, steady, and realistic for busy family schedules.",
  },
] as const;

export const ACADEMY_FAMILY_FLOW = [
  {
    title: "Intake",
    description:
      "We receive the course, class level, current challenges, and preferred format through intake.",
  },
  {
    title: "Fit review",
    description:
      "We review the coursework, support level, and schedule before confirming that the request is a strong fit.",
  },
  {
    title: "Scheduling and plan",
    description:
      "Once fit is confirmed, we send scheduling guidance, pricing details, and the recommended tutoring cadence.",
  },
] as const;

export const ACADEMY_PRICING_PRINCIPLES = [
  {
    title: "Structured support should stay accessible",
    description:
      "Pricing is meant to stay workable for families who need recurring help, not just one-off homework rescue.",
  },
  {
    title: "The plan is recommended after intake",
    description:
      "The best recommendation depends on the course level, the student’s pace, and whether support is short-term or ongoing.",
  },
  {
    title: "Format affects the recommendation",
    description:
      "Online is the standard model. In-person sessions are considered selectively based on scheduling, location, and instructional fit.",
  },
] as const;

export const ACADEMY_PRICING_FACTORS = [
  {
    title: "Subject and course level",
    description:
      "The class itself matters: Algebra I, AP Biology, general chemistry, and upper-level biochemistry do not require the same structure.",
  },
  {
    title: "Cadence",
    description:
      "One-time exam prep, weekly tutoring, and catch-up support create different time and planning demands.",
  },
  {
    title: "Format",
    description:
      "Online sessions are the default. In-person support is reviewed case by case when location and schedule make sense.",
  },
] as const;

export const ACADEMY_FORMAT_OPTIONS = [
  {
    value: "online",
    label: "Online",
    description: "Primary format for consistency, digital whiteboarding, and screen sharing.",
  },
  {
    value: "in-person",
    label: "In-person",
    description: "Available selectively when location, schedule, and fit make it practical.",
  },
] as const;

export const ACADEMY_SUBJECTS = [
  {
    value: "algebra",
    label: "Algebra",
    description:
      "Equation solving, functions, and foundational problem-solving patterns taught with clearer step-by-step structure.",
    focus: [
      "Linear equations and inequalities",
      "Functions, graphs, and systems",
      "Homework walkthroughs and test review plans",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Math notes and a calculator on a study desk.",
  },
  {
    value: "geometry",
    label: "Geometry",
    description:
      "Proofs, diagrams, and spatial reasoning broken into repeatable frameworks that make assignments easier to attack.",
    focus: [
      "Angle, triangle, and circle relationships",
      "Proof strategy and vocabulary",
      "Diagram interpretation and guided practice",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A student working through notes in a classroom.",
  },
  {
    value: "precalculus",
    label: "Precalculus",
    description:
      "Bridge-level support for trigonometry, advanced functions, and the algebraic fluency students need before calculus.",
    focus: [
      "Polynomial, exponential, and logarithmic functions",
      "Trigonometric identities and applications",
      "Preparation for honors and AP pacing",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A notebook and study materials laid out on a desk.",
  },
  {
    value: "calculus",
    label: "Calculus",
    description:
      "Limits, derivatives, and integrals taught with a systems approach that connects concepts to repeatable problem setups.",
    focus: [
      "Limits and derivative rules",
      "Optimization and related rates",
      "Integral setup, interpretation, and review",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A stack of open books and notes on a table.",
  },
  {
    value: "chemistry",
    label: "Chemistry",
    description:
      "Support for chemistry coursework from high school classes through college-level general chemistry when intake confirms the fit.",
    focus: [
      "Atomic structure and periodic trends",
      "Balancing reactions, stoichiometry, and quantitative setup",
      "High school, AP, and college-level general chemistry review",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Scientific glassware in a lab setting.",
  },
  {
    value: "biology",
    label: "Biology",
    description:
      "Support for biology coursework from foundational high school classes through select college biology courses when intake confirms the fit.",
    focus: [
      "Cell biology, genetics, and physiology",
      "Class notes, diagrams, reading load, and vocabulary review",
      "High school, AP, and college-level biology exam preparation",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A biology microscope and notebook on a lab table.",
  },
  {
    value: "physics",
    label: "Physics",
    description:
      "Mechanics and problem decomposition support for students who need equations, diagrams, and reasoning connected clearly.",
    focus: [
      "Kinematics, forces, and energy",
      "Free-body diagrams and setup discipline",
      "Step-by-step quantitative problem solving",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A science notebook with equations and study materials.",
  },
  {
    value: "psychology",
    label: "Psychology",
    description:
      "Support for psychology coursework from high school electives through college-level survey and theory courses when intake confirms the fit.",
    focus: [
      "Research methods, terminology, and core psychological frameworks",
      "Reading-heavy coursework, chapter review, and concept retention",
      "High school, AP, and college-level psychology support",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Students discussing coursework at a table with notebooks and a laptop.",
  },
  {
    value: "sociology",
    label: "Sociology",
    description:
      "Support for sociology courses that require stronger reading synthesis, theory recall, and clearer writing around social concepts.",
    focus: [
      "Foundational sociological theory and major frameworks",
      "Reading response preparation and concept organization",
      "High school and college-level sociology coursework review",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A small group of students collaborating around a table.",
  },
  {
    value: "french",
    label: "French",
    description:
      "Support for vocabulary, grammar, reading, and speaking practice with steady reinforcement and clear correction.",
    focus: [
      "Grammar, conjugation, and sentence structure",
      "Reading comprehension and vocabulary building",
      "Homework support and conversational reinforcement",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A student reading and writing in a quiet academic setting.",
  },
  {
    value: "biochemistry",
    label: "Biochemistry",
    description:
      "Case-by-case support for biochemistry coursework, including college-level classes, when intake shows a strong fit for pathway review and study structure.",
    focus: [
      "Metabolism, proteins, and pathway interpretation",
      "Diagram-heavy concept review with course context",
      "Advanced high school and college-level coursework review",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A science lab bench with biochemical glassware and notes.",
  },
  {
    value: "computer-science",
    label: "Computer Science",
    description:
      "Case-by-case help for computer science courses, including college-level classes, where students need stronger problem decomposition and debugging discipline.",
    focus: [
      "High school and college-level programming coursework",
      "Algorithmic thinking and debugging workflow",
      "Support shaped around the language and project demands from intake",
    ],
    imageSrc:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A laptop displaying code beside study notes.",
  },
] as const;

export const ACADEMY_FAQS = [
  {
    question: "Who can book tutoring services?",
    answer:
      "Students who are 18 or older may book tutoring for themselves. If the student is under 18, a parent or legal guardian must accept the legal terms and act as the contracting party.",
  },
  {
    question: "What does a typical session cover?",
    answer:
      "Most sessions combine explanation, worked examples, guided practice, and a short recap. The exact mix depends on the course, the student’s pace, and what is coming up next in class.",
  },
  {
    question: "Is tutoring online or in person?",
    answer:
      "Online sessions are the primary format. In-person sessions may be offered selectively when scheduling, location, and instructional fit make them practical.",
  },
  {
    question: "How does follow-up work?",
    answer:
      "Deebo Academy keeps follow-up practical and concise so it is clear what was covered and what should happen next.",
  },
  {
    question: "What information do you collect during intake?",
    answer:
      "The intake form asks for booking contact details, the student’s first name, grade, subject, goals or challenges, and session format preference. It intentionally avoids sensitive academic or medical records.",
  },
  {
    question: "Do you support biology and college-level coursework?",
    answer:
      "Yes. We support biology and review college-level requests in calculus, chemistry, biology, biochemistry, computer science, physics, psychology, and sociology through intake when the course level and requested help are a strong fit.",
  },
] as const;
