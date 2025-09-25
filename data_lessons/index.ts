import type { LessonStructure } from "@/types/lesson-types";

import { lesson01 } from "./lesson01"


export const lessons: Record<number, LessonStructure> = {
  1: lesson01,
}

export function getLessonById(lessonId: number): LessonStructure | null {
  return lessons[lessonId as keyof typeof lessons] || null
}

