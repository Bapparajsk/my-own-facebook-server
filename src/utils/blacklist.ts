const blacklist = new Set<string | string[]>();
import { setTimeout } from 'timers';

export const addToBlacklist = (token: string | string[]) => {

    blacklist.add(token);
    setTimeout(() => {
        blacklist.delete(token);
    },  300_000)
};

export const isBlacklisted = (token: string | string[]): boolean => {
    return blacklist.has(token);
};
