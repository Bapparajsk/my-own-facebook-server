import mongoose from 'mongoose';

const init = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL!);
        console.log(`mongoDB connection successful 🚀🚀🚀`)
    } catch (error) {
        console.log(`mongoDB connection error 🚨🚨🚨`)
    }
}

init().catch(e => console.error(e.message))
