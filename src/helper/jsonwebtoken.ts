import jwt from 'jsonwebtoken'


export interface User {
    userId?: string
    userName: string
    email: string
    password?: string
    otp?: string
}

export const createJWT = (user: User): string => {
    const SECRET = process.env.JWT_SECRET || "your-secret";
    return jwt.sign(user, SECRET, {expiresIn: '5m'});
}

export const createJwtFromUser = (user: User): string => {
    const SECRET = process.env.JWT_SECRET || "your-secret";
    return jwt.sign(user, SECRET, {expiresIn: '30d'});
}
