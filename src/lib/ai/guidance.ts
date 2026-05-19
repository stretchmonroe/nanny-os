export type GuidanceSource =
  | "CDC 15–18 month milestones"
  | "CDC 18–24 month milestones"
  | "AAP early childhood guidance"
  | "WHO developmental guidance"
  | "General developmental practice"

export interface GuidanceFramework {
  label: string
  description: string
  color: "sage" | "sky" | "teal" | "stone"
  ageRange: string
  domains: string[]
  // Shown in expanded context — honest framing, not a legal disclaimer
  disclaimer: string
}

export const guidanceFrameworks: Record<GuidanceSource, GuidanceFramework> = {
  "CDC 15–18 month milestones": {
    label: "CDC · 15–18 mo.",
    description:
      "CDC developmental milestones describe motor, language, social, and cognitive patterns observed in most children aged 15–18 months.",
    color: "sage",
    ageRange: "15–18 months",
    domains: ["motor skills", "language", "social development", "cognitive patterns"],
    disclaimer:
      "This recommendation is informed by CDC milestone guidance, not prescribed by it. Every child develops at their own pace.",
  },
  "CDC 18–24 month milestones": {
    label: "CDC · 18–24 mo.",
    description:
      "CDC milestones for the 18–24 month window: expanding vocabulary, early problem-solving, growing independence, and pretend play.",
    color: "sage",
    ageRange: "18–24 months",
    domains: ["vocabulary", "problem-solving", "independence", "pretend play"],
    disclaimer:
      "This recommendation is informed by CDC milestone guidance, not prescribed by it. Every child develops at their own pace.",
  },
  "AAP early childhood guidance": {
    label: "AAP · early childhood",
    description:
      "American Academy of Pediatrics guidance on play-based learning, responsive caregiving, and healthy development in the first three years.",
    color: "sky",
    ageRange: "0–36 months",
    domains: ["nutrition", "play-based learning", "responsive caregiving", "safety"],
    disclaimer:
      "Informed by AAP early childhood guidance. Not a substitute for advice from your child's pediatrician.",
  },
  "WHO developmental guidance": {
    label: "WHO · nurturing care",
    description:
      "WHO nurturing care guidelines on responsive feeding, stimulation, safety, and supportive caregiving in early childhood.",
    color: "teal",
    ageRange: "0–36 months",
    domains: ["feeding", "early stimulation", "nurturing care", "safety"],
    disclaimer:
      "Informed by WHO nurturing care guidelines. Not a substitute for advice from your child's healthcare provider.",
  },
  "General developmental practice": {
    label: "Dev. practice",
    description:
      "Based on widely observed patterns in early childhood development across motor, language, and social domains.",
    color: "stone",
    ageRange: "All ages",
    domains: ["general development", "behaviour", "routines"],
    disclaimer:
      "Based on general early childhood development principles. Every child develops at their own pace.",
  },
}

export function isValidGuidanceSource(s: string): s is GuidanceSource {
  return s in guidanceFrameworks
}
