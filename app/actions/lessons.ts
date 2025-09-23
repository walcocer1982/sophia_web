export interface ChatMessage {
  id: string
  message: string
  time: string
  isUser: boolean
  image?: string
  username?: string
}

export async function getChats(): Promise<ChatMessage[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return [
    {
      id: "1",
      message: "¡Hola Bruno! Bienvenido a nuestra clase de hoy. ¿Cómo estás? ¿Estás listo para comenzar?",
      time: "11:05 AM",
      isUser: false,
      username: "Sophia",
    },
    {
      id: "2",
      message: "¡Hola Sophia! Estoy muy bien, gracias por preguntar. Sí, estoy listo para comenzar la clase.",
      time: "11:07 AM",
      isUser: true,
      username: "Bruno",
    },
    {
      id: "3",
      message:
        "Perfecto Bruno. Ahora, observa esta imagen que te voy a mostrar. ¿Qué es un peligro dentro de esta imagen?",
      time: "11:09 AM",
      isUser: false,
      username: "Sophia",
      image: "https://placehold.co/600x400",
    },
    {
      id: "4",
      message:
        "Puedo ver varios peligros en la imagen. El más evidente es que la persona no está usando equipo de protección personal adecuado.",
      time: "11:11 AM",
      isUser: true,
      username: "Bruno",
    },
  ]
}
