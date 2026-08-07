import {
  BarChart3,
  Filter,
  Gauge,
  MessagesSquare,
  Mic,
  LineChart,
  Globe,
  Smartphone,
  MessageSquare,
  Star,
  Tag,
  BookOpen,
  History,
  Rocket,
  Building2,
  type LucideIcon,
} from "lucide-react";

export type InternalSource = {
  id: string;
  label: string;
  description: string;
  formats: string;
  status: "Uploaded" | "Not provided";
  records: string;
  icon: LucideIcon;
};

export const internalSources: InternalSource[] = [
  {
    id: "funnel",
    label: "Funnel Data",
    description: "Conversion steps from signup through activation.",
    formats: ".csv",
    status: "Uploaded",
    records: "12,480 sessions",
    icon: Filter,
  },
  {
    id: "events",
    label: "Event Data",
    description: "Raw product event stream with user properties.",
    formats: ".csv · .parquet · .json",
    status: "Uploaded",
    records: "1.2M events",
    icon: BarChart3,
  },
  {
    id: "analytics",
    label: "Product Analytics Export",
    description: "Amplitude / Mixpanel cohort and retention export.",
    formats: ".csv · .parquet · .json",
    status: "Uploaded",
    records: "36 cohorts",
    icon: LineChart,
  },
  {
    id: "support",
    label: "Support Conversations",
    description: "Zendesk / Intercom threads and resolution notes.",
    formats: ".csv · .json · .txt",
    status: "Uploaded",
    records: "1,204 threads",
    icon: MessagesSquare,
  },
  {
    id: "nps",
    label: "NPS Responses",
    description: "Scores with verbatim comments by segment.",
    formats: ".csv · .xlsx",
    status: "Uploaded",
    records: "486 responses",
    icon: Gauge,
  },
  {
    id: "interviews",
    label: "Customer Interviews",
    description: "Transcripts, notes, and research summaries.",
    formats: ".txt · .docx · .pdf · .md",
    status: "Not provided",
    records: "—",
    icon: Mic,
  },
];

export type ExternalSource = {
  label: string;
  detail: string;
  status: "Discovered" | "Analysed" | "Collecting";
  icon: LucideIcon;
};

export const externalSources: ExternalSource[] = [
  { label: "App Store Reviews", detail: "142 reviews", status: "Analysed", icon: Smartphone },
  { label: "Google Play Reviews", detail: "97 reviews", status: "Analysed", icon: Smartphone },
  { label: "Reddit Discussions", detail: "68 threads", status: "Analysed", icon: MessageSquare },
  { label: "G2 Reviews", detail: "212 reviews", status: "Analysed", icon: Star },
  { label: "Capterra Reviews", detail: "74 reviews", status: "Discovered", icon: Star },
  { label: "Product Hunt", detail: "3 launches", status: "Discovered", icon: Rocket },
  { label: "Official Website", detail: "41 pages", status: "Analysed", icon: Globe },
  { label: "Pricing Page", detail: "4 tiers", status: "Analysed", icon: Tag },
  { label: "Documentation / Help Center", detail: "318 articles", status: "Analysed", icon: BookOpen },
  { label: "Changelog", detail: "126 releases", status: "Discovered", icon: History },
  { label: "Competitor Websites", detail: "7 competitors", status: "Analysed", icon: Building2 },
];

export type Finding = {
  id: string;
  kind: string;
  title: string;
  body: string;
  confidence: number;
};

export const findings: Finding[] = [
  {
    id: "KF-01",
    kind: "Customer Pain Point Cluster",
    title: "Onboarding setup is too manual for small teams",
    body: "218 review and support mentions cluster around manual workspace setup, invites, and template selection during the first session.",
    confidence: 91,
  },
  {
    id: "KF-02",
    kind: "Funnel Friction",
    title: "Activation drops 38% at workspace configuration",
    body: "Uploaded funnel data shows the steepest single-step drop between account creation and first project created.",
    confidence: 88,
  },
  {
    id: "KF-03",
    kind: "Feature Requests",
    title: "Usage-based pricing is the most requested change",
    body: "118 reviews and 26 Reddit threads request seat-independent pricing, concentrated in teams under 20 people.",
    confidence: 84,
  },
  {
    id: "KF-04",
    kind: "Root Cause Analysis",
    title: "Admin permission gaps drive support volume",
    body: "41 support conversations trace back to missing granular roles rather than to documentation gaps.",
    confidence: 79,
  },
  {
    id: "KF-05",
    kind: "Competitor Gap",
    title: "Two competitors shipped guided onboarding this quarter",
    body: "Competitor changelog analysis shows templated onboarding flows with in-product checklists now standard in the category.",
    confidence: 76,
  },
  {
    id: "KF-06",
    kind: "Behavioural Pattern",
    title: "Teams that invite a second member retain 2.4x better",
    body: "Event data shows a strong retention inflection when a second collaborator joins within 48 hours.",
    confidence: 87,
  },
  {
    id: "KF-07",
    kind: "Emerging Theme",
    title: "Mobile offline expectations are rising",
    body: "Offline gaps appear 87 times in app store reviews, increasingly in 1–2 star ratings over the last two quarters.",
    confidence: 68,
  },
];

export type Quote = { text: string; source: string; date: string; confidence: string };

export type Opportunity = {
  id: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  confidence: number;
  ice: number;
  effort: string;
  status: string;
  estImpact: string;
  outcome: string;
  experimentShort: string;
  rationale: {
    problem: string;
    whyItMatters: string;
    usersAffected: string;
    metric: string;
    estImpact: string;
    objective: string;
  };
  recommendation: string;
  evidence: {
    feedback: { label: string; value: string }[];
    quotes: Quote[];
    analytics: { label: string; value: string; internal?: boolean }[];
    competitors: { label: string; value: string }[];
  };
  chips: { label: string; detail: string }[];
  experiment: {
    hypothesis: string;
    design: string;
    primaryMetric: string;
    guardrails: string;
    expected: string;
    duration: string;
    success: string;
  };
  risks: {
    assumptions: string[];
    confidenceExplanation: string;
    missingEvidence: string[];
    risks: string[];
  };
};

export const opportunities: Opportunity[] = [
  {
    id: "OPP-01",
    title: "Guided onboarding with workspace templates",
    impact: "High",
    confidence: 92,
    ice: 8.6,
    effort: "3–4 weeks · 1 squad",
    status: "Recommended",
    estImpact: "+4–6% activation",
    outcome: "More teams reach first project created within their first session.",
    experimentShort: "Templated onboarding checklist vs. current blank workspace.",
    rationale: {
      problem: "Users abandon onboarding before activation.",
      whyItMatters:
        "Activation is the strongest predictor of trial-to-paid conversion, and the largest single drop-off sits inside the first session where Atlas has both qualitative and quantitative evidence.",
      usersAffected: "New teams under 20 seats — 61% of trials",
      metric: "Activation Rate",
      estImpact: "+4–6% Activation",
      objective: "Increase Trial-to-Paid Conversion",
    },
    recommendation:
      "This recommendation is based on recurring onboarding complaints across customer reviews, significant activation drop-offs in uploaded funnel data, and competitor onboarding analysis showing guided setup is now category standard.",
    evidence: {
      feedback: [
        { label: "App Store reviews analysed", value: "142" },
        { label: "Reddit discussions", value: "68" },
        { label: "Support conversations", value: "213" },
        { label: "NPS responses", value: "486" },
      ],
      quotes: [
        {
          text: "Took our team an hour to figure out how to set up a workspace that made sense. Nearly gave up.",
          source: "App Store review",
          date: "Mar 2026",
          confidence: "High confidence",
        },
        {
          text: "Great product once configured, but the empty first screen tells you nothing about what to do.",
          source: "G2 review",
          date: "Feb 2026",
          confidence: "High confidence",
        },
        {
          text: "We churned in the trial because onboarding was on us. Competitor gave us a template in 2 minutes.",
          source: "Support conversation",
          date: "Jan 2026",
          confidence: "Medium confidence",
        },
      ],
      analytics: [
        { label: "Funnel drop-off at workspace config", value: "38%", internal: true },
        { label: "Activation bottleneck", value: "First project created", internal: true },
        { label: "Template feature adoption", value: "11% of teams", internal: true },
        { label: "Retention with 2nd invite <48h", value: "2.4x", internal: true },
      ],
      competitors: [
        { label: "Competitors analysed", value: "7" },
        { label: "Ship guided onboarding", value: "5 of 7" },
        { label: "Best practice", value: "Role-based setup checklist" },
        { label: "Pricing comparison", value: "Free tier includes templates" },
      ],
    },
    chips: [
      { label: "142 App Store Reviews", detail: "Onboarding complaints across 3.1★ average reviews." },
      { label: "68 Reddit Discussions", detail: "Threads on setup friction in r/productivity and r/startups." },
      { label: "Funnel CSV", detail: "38% drop between account creation and first project." },
      { label: "Support Conversations", detail: "213 threads tagged setup or configuration." },
      { label: "Competitor Analysis", detail: "5 of 7 competitors ship guided onboarding." },
    ],
    experiment: {
      hypothesis:
        "Offering role-based workspace templates during onboarding will increase first-session activation for teams under 20 seats.",
      design: "50/50 A/B on new signups: templated onboarding checklist vs. current blank workspace.",
      primaryMetric: "Activation rate (first project created within 24h)",
      guardrails: "Trial-to-paid conversion, 7-day retention, support ticket volume",
      expected: "+4–6% activation, +1.5–2.5% trial-to-paid",
      duration: "3 weeks to significance at current signup volume",
      success: "≥3% absolute activation lift with no guardrail regression",
    },
    risks: {
      assumptions: [
        "Setup friction, not product fit, is the primary abandonment cause.",
        "Templates can cover the top 5 team archetypes seen in event data.",
      ],
      confidenceExplanation:
        "Confidence is high because qualitative and quantitative evidence agree and the funnel signal comes from your own uploaded data.",
      missingEvidence: [
        "Customer interviews were not uploaded — motivations are inferred from reviews.",
        "No session replay evidence for the configuration step.",
      ],
      risks: [
        "Templates may push teams into structures they later have to unwind.",
        "Activation lift may not persist into paid conversion.",
      ],
    },
  },
  {
    id: "OPP-02",
    title: "Usage-based billing tier",
    impact: "High",
    confidence: 84,
    ice: 8.1,
    effort: "6–8 weeks · 2 squads",
    status: "Recommended",
    estImpact: "+3–5% expansion revenue",
    outcome: "Small teams stop hitting seat-price objections before expanding.",
    experimentShort: "Usage-based pricing page test against current seat pricing.",
    rationale: {
      problem: "Seat pricing blocks expansion for small, fast-changing teams.",
      whyItMatters:
        "Pricing objections dominate negative sentiment, and two competitors moved to usage pricing this quarter, changing category expectations.",
      usersAffected: "Teams of 5–20 seats — 44% of paid accounts",
      metric: "Net Revenue Retention",
      estImpact: "+3–5% expansion revenue",
      objective: "Improve monetization fit",
    },
    recommendation:
      "This recommendation is based on 118 pricing complaints across reviews, 26 Reddit threads discussing seat costs, and competitor pricing pages that now offer usage-based tiers.",
    evidence: {
      feedback: [
        { label: "App Store reviews analysed", value: "142" },
        { label: "Reddit discussions", value: "26" },
        { label: "Support conversations", value: "88" },
        { label: "NPS responses", value: "486" },
      ],
      quotes: [
        {
          text: "We pay for seats we barely use. Charge us for what we actually consume.",
          source: "G2 review",
          date: "Feb 2026",
          confidence: "High confidence",
        },
        {
          text: "Priced for enterprise, sold to startups. That mismatch is why we downgraded.",
          source: "Reddit discussion",
          date: "Dec 2025",
          confidence: "Medium confidence",
        },
      ],
      analytics: [
        { label: "Seats active vs. billed", value: "62% utilisation", internal: true },
        { label: "Downgrade reason: price", value: "47% of downgrades", internal: true },
        { label: "Feature adoption in small teams", value: "Below median" },
      ],
      competitors: [
        { label: "Competitors analysed", value: "7" },
        { label: "Offer usage pricing", value: "2 of 7 (new)" },
        { label: "Best practice", value: "Hybrid seat + usage floor" },
        { label: "Pricing comparison", value: "20–30% lower entry point" },
      ],
    },
    chips: [
      { label: "118 Pricing Complaints", detail: "Across App Store, G2, and Capterra reviews." },
      { label: "26 Reddit Discussions", detail: "Seat-cost threads from small teams." },
      { label: "Billing Export", detail: "62% seat utilisation across paid accounts." },
      { label: "Competitor Analysis", detail: "2 competitors launched usage pricing this quarter." },
    ],
    experiment: {
      hypothesis:
        "A usage-based tier will increase conversion and expansion among teams under 20 seats without cannibalising seat revenue.",
      design: "Pricing page split test with a usage tier, gated rollout to new accounts.",
      primaryMetric: "Paid conversion rate",
      guardrails: "ARPA, gross margin, downgrade rate",
      expected: "+3–5% expansion revenue, neutral ARPA",
      duration: "6 weeks",
      success: "Conversion lift ≥2% with ARPA within 3% of control",
    },
    risks: {
      assumptions: [
        "Usage can be metered on a dimension customers accept as fair.",
        "Existing accounts will not mass-migrate to the cheaper tier.",
      ],
      confidenceExplanation:
        "Confidence is moderate-high: sentiment evidence is strong, but revenue impact is modelled rather than observed.",
      missingEvidence: [
        "No willingness-to-pay research uploaded.",
        "Margin impact of heavy-usage accounts is unknown.",
      ],
      risks: ["Revenue cannibalisation", "Billing complexity increases support load"],
    },
  },
  {
    id: "OPP-03",
    title: "Granular workspace roles",
    impact: "Medium",
    confidence: 79,
    ice: 7.2,
    effort: "4 weeks · 1 squad",
    status: "Under review",
    estImpact: "−18% permission support volume",
    outcome: "Admins self-serve permissions without contacting support.",
    experimentShort: "Roles beta with the top 40 permission-request accounts.",
    rationale: {
      problem: "Admins cannot delegate access without over-granting permissions.",
      whyItMatters:
        "Permission requests dominate help-center searches and generate avoidable support cost while blocking larger team rollouts.",
      usersAffected: "Accounts above 15 seats — 29% of paid base",
      metric: "Support Contact Rate",
      estImpact: "−18% permission tickets",
      objective: "Reduce cost to serve and unblock team expansion",
    },
    recommendation:
      "This recommendation is based on 41 support conversations traced to missing granular roles, help-center search analysis, and competitor permission models.",
    evidence: {
      feedback: [
        { label: "Support conversations", value: "41" },
        { label: "Help-center searches", value: "612" },
        { label: "G2 reviews analysed", value: "212" },
        { label: "NPS verbatims", value: "34" },
      ],
      quotes: [
        {
          text: "Everyone is effectively an admin. That's a compliance problem for us.",
          source: "Support conversation",
          date: "Feb 2026",
          confidence: "High confidence",
        },
      ],
      analytics: [
        { label: "Accounts hitting permission errors", value: "23%", internal: true },
        { label: "Retention of >15-seat accounts", value: "Below segment median", internal: true },
      ],
      competitors: [
        { label: "Competitors analysed", value: "7" },
        { label: "Offer custom roles", value: "4 of 7" },
        { label: "Best practice", value: "Role templates + audit log" },
      ],
    },
    chips: [
      { label: "41 Support Conversations", detail: "Permission and delegation requests." },
      { label: "612 Help-Center Searches", detail: "Queries for roles and permissions." },
      { label: "Competitor Analysis", detail: "4 of 7 competitors ship custom roles." },
    ],
    experiment: {
      hypothesis: "Granular roles will reduce permission-related support contacts for larger accounts.",
      design: "Beta rollout to the 40 accounts with the most permission requests.",
      primaryMetric: "Permission-related support contacts per account",
      guardrails: "Misconfiguration rate, admin task completion time",
      expected: "−18% permission tickets",
      duration: "4 weeks",
      success: "≥15% ticket reduction with no rise in misconfiguration",
    },
    risks: {
      assumptions: ["Admins want more control rather than simpler defaults."],
      confidenceExplanation:
        "Confidence is moderate: the support signal is clear but the revenue link is indirect.",
      missingEvidence: ["No security questionnaire data uploaded."],
      risks: ["Permission complexity may confuse smaller teams."],
    },
  },
  {
    id: "OPP-04",
    title: "Mobile offline mode",
    impact: "Medium",
    confidence: 64,
    ice: 6.1,
    effort: "8+ weeks · 2 squads",
    status: "Needs more evidence",
    estImpact: "+0.4 app store rating",
    outcome: "Mobile users can review and capture work without connectivity.",
    experimentShort: "Read-only offline cache with a mobile beta cohort.",
    rationale: {
      problem: "Mobile users lose access to their work without connectivity.",
      whyItMatters:
        "Offline gaps concentrate in low-star reviews and depress store rating, which affects top-of-funnel acquisition.",
      usersAffected: "Mobile-primary users — 18% of weekly actives",
      metric: "App Store Rating",
      estImpact: "+0.4 rating",
      objective: "Protect acquisition quality",
    },
    recommendation:
      "This recommendation is based on 87 offline mentions in app store reviews concentrated in 1–2 star ratings, plus mobile session data showing frequent connectivity interruptions.",
    evidence: {
      feedback: [
        { label: "App Store reviews analysed", value: "142" },
        { label: "Google Play reviews", value: "97" },
        { label: "Offline mentions", value: "87" },
      ],
      quotes: [
        {
          text: "Useless on the train. Everything needs a connection.",
          source: "Google Play review",
          date: "Jan 2026",
          confidence: "Medium confidence",
        },
      ],
      analytics: [
        { label: "Mobile sessions with network errors", value: "14%", internal: true },
        { label: "Mobile 7-day retention", value: "Below desktop by 11pts", internal: true },
      ],
      competitors: [
        { label: "Competitors analysed", value: "7" },
        { label: "Offer offline mode", value: "3 of 7" },
        { label: "Best practice", value: "Read-only offline cache first" },
      ],
    },
    chips: [
      { label: "87 Offline Mentions", detail: "Concentrated in 1–2 star app store reviews." },
      { label: "Mobile Event Data", detail: "14% of mobile sessions hit network errors." },
      { label: "Competitor Analysis", detail: "3 of 7 competitors ship offline support." },
    ],
    experiment: {
      hypothesis: "A read-only offline cache will raise mobile satisfaction and retention.",
      design: "Mobile beta cohort with offline cache enabled.",
      primaryMetric: "Mobile 7-day retention",
      guardrails: "Crash rate, sync conflict rate, app size",
      expected: "+3–5pt mobile retention",
      duration: "6 weeks",
      success: "Retention lift ≥3pt with stable crash rate",
    },
    risks: {
      assumptions: ["Read-only offline access satisfies most of the demand."],
      confidenceExplanation:
        "Confidence is lower: evidence is mostly review-based with no direct customer research.",
      missingEvidence: ["Customer interviews not uploaded.", "No offline usage intent survey."],
      risks: ["Sync conflicts", "Large engineering cost relative to segment size"],
    },
  },
];

export const artifacts = [
  {
    title: "Executive Summary",
    body: "One-page decision brief with the strategic recommendation and evidence base.",
  },
  {
    title: "Product Requirements Document",
    body: "Problem, scope, success metrics, and open questions, ready for a squad.",
  },
  {
    title: "Stakeholder Brief",
    body: "Narrative update for leadership with impact framing and risks.",
  },
  {
    title: "Jira Tickets",
    body: "Epic and story breakdown with acceptance criteria and metric hooks.",
  },
];

export const workflowStages = [
  { label: "Evidence Sources", body: "Internal uploads and automatically discovered public evidence." },
  { label: "Key Findings", body: "Clustered pain points, friction, patterns, and competitor gaps." },
  { label: "Product Opportunities", body: "Ranked by impact, confidence, and ICE score." },
  { label: "Strategy Report", body: "Exportable summaries, PRDs, briefs, and tickets." },
];
