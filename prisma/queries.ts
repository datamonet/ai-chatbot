import { PrismaClient, type User, type Chat, type Message, type Document, type Suggestion } from '@prisma/client';
import { hash } from 'bcrypt-ts';

const prisma = new PrismaClient();

// Function to hash password using bcrypt
async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// User operations
export async function getUser(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(email: string, password: string): Promise<User> {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

// Chat operations
export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}): Promise<Chat> {
  return prisma.chat.create({
    data: {
      id,
      userId,
      title,
      createdAt: new Date(),
    },
  });
}

export async function deleteChatById({ id }: { id: string }): Promise<Chat> {
  // Delete related records first
  await prisma.vote.deleteMany({
    where: { chatId: id },
  });
  await prisma.message.deleteMany({
    where: { chatId: id },
  });
  
  return prisma.chat.delete({
    where: { id },
  });
}

export async function getChatsByUserId({ id }: { id: string }): Promise<Chat[]> {
  return prisma.chat.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getChatById({ id }: { id: string }): Promise<Chat | null> {
  return prisma.chat.findUnique({
    where: { id },
  });
}

// Message operations
export async function saveMessages({ messages }: { messages: Array<Message> }): Promise<Message[]> {
  return prisma.message.createMany({
    data: messages,
  });
}

export async function getMessagesByChatId({ id }: { id: string }): Promise<Message[]> {
  return prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getMessageById({ id }: { id: string }): Promise<Message | null> {
  return prisma.message.findUnique({
    where: { id },
  });
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}): Promise<{ count: number }> {
  const result = await prisma.message.deleteMany({
    where: {
      chatId,
      createdAt: { gte: timestamp },
    },
  });
  return { count: result.count };
}

// Vote operations
export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}): Promise<any> {
  const existingVote = await prisma.vote.findFirst({
    where: { messageId },
  });

  if (existingVote) {
    return prisma.vote.update({
      where: {
        chatId_messageId: {
          chatId,
          messageId,
        },
      },
      data: { isUpvoted: type === 'up' },
    });
  }

  return prisma.vote.create({
    data: {
      chatId,
      messageId,
      isUpvoted: type === 'up',
    },
  });
}

export async function getVotesByChatId({ id }: { id: string }) {
  return prisma.vote.findMany({
    where: { chatId: id },
  });
}

// Document operations
export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  userId: string;
}): Promise<Document> {
  return prisma.document.create({
    data: {
      id,
      title,
      content,
      userId,
      createdAt: new Date(),
    },
  });
}

export async function getDocumentsById({ id }: { id: string }): Promise<Document[]> {
  return prisma.document.findMany({
    where: { id },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getDocumentById({ id }: { id: string }): Promise<Document | null> {
  return prisma.document.findUnique({
    where: { id },
  });
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}): Promise<{ count: number }> {
  const result = await prisma.document.deleteMany({
    where: {
      id,
      createdAt: { gte: timestamp },
    },
  });
  return { count: result.count };
}

// Suggestion operations
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}): Promise<Suggestion[]> {
  return prisma.suggestion.createMany({
    data: suggestions,
  });
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<Suggestion[]> {
  return prisma.suggestion.findMany({
    where: { documentId },
  });
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}): Promise<Chat> {
  return prisma.chat.update({
    where: { id: chatId },
    data: { visibility },
  });
}