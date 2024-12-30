
import { PrismaClient, type User, type Chat, type Message, type Document, type Suggestion, Prisma } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt-ts';

const prisma = new PrismaClient();

export async function getUser(email: string): Promise<User | null> {

  const data =  await prisma.user.findUnique({
    where: { email }
  });

  return data
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  return await prisma.user.create({
      data: { email, password: hash }
    });
  
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await prisma.chat.create({
      data: {
        id,
        createdAt: new Date(),
        userId,
        title,
      }
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    // Delete related records first due to foreign key constraints
    await prisma.vote.deleteMany({
      where: { chatId: id }
    });
    await prisma.message.deleteMany({
      where: { chatId: id }
    });
    return await prisma.chat.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
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

export async function getChatById({ id }: { id: string }) {
  try {
    return await prisma.chat.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<{
  id: string;
  chatId: string;
  role: string;
  content: Prisma.InputJsonValue;
  createdAt: Date;
}> }) {
  try {
    return await prisma.message.createMany({
      data: messages
    });
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const existingVote = await prisma.vote.findFirst({
      where: { messageId }
    });

    if (existingVote) {
      return await prisma.vote.update({
        where: {
          chatId_messageId: {
            chatId,
            messageId
          }
        },
        data: { isUpvoted: type === 'up' }
      });
    }
    return await prisma.vote.create({
      data: {
        chatId,
        messageId,
        isUpvoted: type === 'up',
      }
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await prisma.vote.findMany({
      where: { chatId: id }
    });
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: 'text' | 'code';
  content: string;
  userId: string;
}) {
  try {
    return await prisma.document.create({
      data: {
        id,
        title,
        content,
        userId,
        kind,
        createdAt: new Date(),
      }
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await prisma.document.findMany({
      where: { id },
      orderBy: { createdAt: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    return await prisma.document.findFirst({
      where: { id },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await prisma.suggestion.deleteMany({
      where: {
        documentId: id,
        documentCreatedAt: { gt: timestamp }
      }
    });

    return await prisma.document.deleteMany({
      where: {
        id,
        createdAt: { gt: timestamp }
      }
    });
  } catch (error) {
    console.error('Failed to delete documents by id after timestamp from database');
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await prisma.suggestion.createMany({
      data: suggestions
    });
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await prisma.suggestion.findMany({
      where: { documentId }
    });
  } catch (error) {
    console.error('Failed to get suggestions by document version from database');
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await prisma.message.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await prisma.message.deleteMany({
      where: {
        chatId,
        createdAt: { gte: timestamp }
      }
    });
  } catch (error) {
    console.error('Failed to delete messages by id after timestamp from database');
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await prisma.chat.update({
      where: { id: chatId },
      data: { visibility }
    });
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}