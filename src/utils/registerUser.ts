import { setTimeout } from 'timers';
import {addToBlacklist} from "./blacklist";

export interface User {
    name: string;
    email: string;
    password: string;
    otp: string;
    token: string;
}

// Define the type for the user storage
interface UserStorage {
    [key: string]: Omit<User, 'token'>;
}

// Initialize the user storage with a defined type
const user: UserStorage = {};

// Function to set a user
export const addUser = ({ name, email, password, otp, token }: User): void => {
    user[token] = { name, email, password, otp };

    setTimeout(() => {
        if (user[token]) {
            delete user[token];
        }
    },  300_000);
};

export const deleteUser = (token: string): void => {
    if (!user[token]) return;

    delete user[token];
    addToBlacklist(token);
};
