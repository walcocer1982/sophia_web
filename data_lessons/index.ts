import { lesson01 } from "./lesson01"

export default function getLessonById(lesson_id: string) {
  const lessons = {
    SSO001_lesson_01: lesson01,
  }

  return lessons[lesson_id as keyof typeof lessons] || null
}

export { lesson01 }
