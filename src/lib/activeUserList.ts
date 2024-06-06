import {User} from "../utils/registerUser";

const userListBySocketId: Map<string, string> = new Map();
const userListByUserId: Map<string, string> = new Map();

export default { userListBySocketId, userListByUserId };
