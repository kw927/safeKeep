import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserByEmail = async (email: string) => {
    // get the user from the database
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    return user;
};

export const getUserItemById = async (itemId: number, userId: number) => {
    // Get the items for the user
    const item = await prisma.item.findUnique({
        where: {
            item_id: itemId,
            user_id: userId,
            is_deleted: false
        },
        select: {
            item_id: true,
            name: true,
            description: true,
            data: true,
            is_favorite: true,
            created_at: true,
            updated_at: true,
            folder: {
                select: {
                    folder_id: true,
                    name: true,
                    parent_folder_id: true
                }
            },
            files: {
                select: {
                    file_id: true,
                    original_file_name: true,
                    original_file_type: true,
                    file_path: true
                }
            },
            item_tags: {
                select: {
                    tag: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    return item;
}