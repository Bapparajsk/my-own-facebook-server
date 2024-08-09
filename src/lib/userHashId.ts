function ontimaze(hash: string) {
    let result = '';
    let count = 1;

    for (let i = 1; i <= hash.length; i++) {
        if (hash[i] === hash[i - 1]) {
            count++;
        } else {
            result += (count > 1 ? count : '') + hash[i - 1];
            count = 1;
        }
    }

    return result;
}

function getHash(id1: number[], id2: number[]): string {
    let hash = '';
    

    const maxLength = Math.max(id1.length, id2.length);
    for (let i = 0; i < maxLength; i++) {
        if (i < id1.length) {
            hash += id1[i];
        }
        if (i < id2.length) {
            hash += id2[i];
        }
    }

    return hash;
}


const hashId = (user1: string, user2: string): string => {
    // Concatenate the user IDs in a consistent order
    const concatenatedIds = user1 < user2 ? `${user1}:${user2}` : `${user2}:${user1}`;

    if (user1 > user2) {
        return hashId(user2, user1);
    }


    const convertToNumbers = (id: string): number[] => {
        return id.toLowerCase().split('').map(c => {
            if (c >= '0' && c <= '9') {
                return parseInt(c, 10);
            } else {
                return c.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
            }
        });
    };

    console.log(user1, user2);
    

    const id1Array = convertToNumbers(user1);
    const id2Array = convertToNumbers(user2);

    return ontimaze(getHash(id1Array, id2Array));
};

export default hashId;
