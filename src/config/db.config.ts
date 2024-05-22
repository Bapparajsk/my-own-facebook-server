import mongoose = require('mongoose');

const init = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/testuser');
        console.log(`mongoDB connection successful 🚀🚀🚀`)
    } catch (error) {
        console.log(`mongoDB connection error 🚨🚨🚨`)
    }
}

init().catch(e => console.error(e.message))
