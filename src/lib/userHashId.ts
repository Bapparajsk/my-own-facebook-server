import crypto from 'crypto';

const hashId = async (user1: string, user2: string): Promise<string> => {
    // Concatenate the user IDs in a consistent order
    const concatenatedIds = user1 < user2 ? `${user1}:${user2}` : `${user2}:${user1}`;

    // Create a SHA-256 hash of the concatenated string
    return crypto.createHash('sha256').update(concatenatedIds).digest('hex');
};

export default hashId;
