import jwt from 'jsonwebtoken'
import { UserPayload } from '../@types/types'

const init = (user: UserPayload, timeout: string) => {
    const SECRET = process.env.JWT_SECRET!;
    return jwt.sign( user, SECRET, { expiresIn: timeout })
}

export const createJWT = (user: UserPayload): string => init(user, '5m');
export const createJwtFromUser = (user: UserPayload): string => init(user, '30d');
