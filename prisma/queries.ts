import { PrismaClient, type User, type Chat, type Message, type Document, type Suggestion } from '@prisma/client';
import crypto from 'crypto'

const prisma = new PrismaClient();

// Function to hash password using crypto
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// User operations
export async function createUser(email: string, password: string): Promise<User> {
  const hashedPassword = hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

export async function getUser(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

// Chat operations
export async function createChat(userId: string, title: string): Promise<Chat> {
  return prisma.chat.create({
    data: {
      userId,
      title,
      createdAt: new Date(),
    },
  });
}

export async function getChat(chatId: string): Promise<Chat | null> {
  return prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: true,
    },
  });
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  return prisma.chat.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: true,
    },
  });
}

export async function deleteChatById(id: string): Promise<Chat> {
  // First delete related votes and messages due to foreign key constraints
  await prisma.vote.deleteMany({
    where: { chatId: id }
  });
  await prisma.message.deleteMany({
    where: { chatId: id }
  });
  // Then delete the chat
  return prisma.chat.delete({
    where: { id }
  });
}

export async function getMessagesByChatId(id: string): Promise<Message[]> {
  return prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: 'asc' }
  });
}

export async function updateChatVisiblityById(
  chatId: string,
  visibility: 'private' | 'public'
): Promise<Chat> {
  return prisma.chat.update({
    where: { id: chatId },
    data: { visibility }
  });
}

// Message operations
export async function saveMessages(chatId: string, messages: { role: string; content: any }[]): Promise<Message[]> {
  const savedMessages = await Promise.all(
    messages.map((msg) =>
      prisma.message.create({
        data: {
          chatId,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(),
        },
      })
    )
  );
  return savedMessages;
}

export async function getMessageById(id: string): Promise<Message | null> {
  return prisma.message.findUnique({
    where: { id },
  });
}

export async function deleteMessagesByChatIdAfterTimestamp(
  chatId: string,
  timestamp: Date
): Promise<{ count: number }> {
  return prisma.message.deleteMany({
    where: {
      chatId,
      createdAt: {
        gte: timestamp
      }
    }
  });
}

// Document operations
export async function saveDocument(
  userId: string,
  title: string,
  content: string
): Promise<Document> {
  return prisma.document.create({
    data: {
      userId,
      title,
      content,
      createdAt: new Date(),
    },
  });
}

export async function getDocument(documentId: string): Promise<Document | null> {
  return prisma.document.findUnique({
    where: { id: documentId },
  });
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocumentsById(id: string): Promise<Document[]> {
  return prisma.document.findMany({
    where: { id },
    orderBy: { createdAt: 'asc' }
  });
}

export async function deleteDocumentsByIdAfterTimestamp(
  id: string,
  timestamp: Date
): Promise<any> {
  // First delete related suggestions
  await prisma.suggestion.deleteMany({
    where: {
      documentId: id,
      documentCreatedAt: {
        gt: timestamp
      }
    }
  });

  // Then delete documents
  return prisma.document.deleteMany({
    where: {
      id,
      createdAt: {
        gt: timestamp
      }
    }
  });
}

// Suggestion operations
export async function saveSuggestions(
  documentId: string,
  userId: string,
  suggestions: {
    originalText: string;
    suggestedText: string;
    description?: string;
  }[]
): Promise<Suggestion[]> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { createdAt: true },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const savedSuggestions = await Promise.all(
    suggestions.map((suggestion) =>
      prisma.suggestion.create({
        data: {
          documentId,
          documentCreatedAt: document.createdAt,
          userId,
          originalText: suggestion.originalText,
          suggestedText: suggestion.suggestedText,
          description: suggestion.description,
          createdAt: new Date(),
        },
      })
    )
  );

  return savedSuggestions;
}

export async function getDocumentSuggestions(documentId: string): Promise<Suggestion[]> {
  return prisma.suggestion.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSuggestionsByDocumentId(documentId: string): Promise<Suggestion[]> {
  return prisma.suggestion.findMany({
    where: { documentId }
  });
}

export async function resolveSuggestion(suggestionId: string): Promise<Suggestion> {
  return prisma.suggestion.update({
    where: { id: suggestionId },
    data: { isResolved: true },
  });
}

// Vote operations
export async function voteMessage(
  chatId: string,
  messageId: string,
  type: 'up' | 'down'
): Promise<any> {
  const existingVote = await prisma.vote.findFirst({
    where: { messageId }
  });

  if (existingVote) {
    return prisma.vote.update({
      where: {
        chatId_messageId: {
          chatId,
          messageId
        }
      },
      data: { isUpvoted: type === 'up' }
    });
  }

  return prisma.vote.create({
    data: {
      chatId,
      messageId,
      isUpvoted: type === 'up'
    }
  });
}

export async function getVotesByChatId(id: string): Promise<any[]> {
  return prisma.vote.findMany({
    where: { chatId: id }
  });
}

export async function getChatsByUserId({ id }: { id: string }): Promise<Chat[]> {
  try {
    return await prisma.chat.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }): Promise<Chat | null> {
  try {
    return await prisma.chat.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}