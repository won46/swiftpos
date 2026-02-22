
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateBarcode = async (length: number = 6): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  let isUnique = false;

  while (!isUnique) {
    result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    // Check uniqueness
    const existing = await prisma.product.findUnique({
      where: { barcode: result },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return result;
};
