# My Own Facebook Server

This project is a server implementation for a social media platform similar to Facebook. The server is built using TypeScript and includes various functionalities required to manage user accounts, posts, interactions, and more.

## Features

- **User Authentication**: Secure login and registration using bcrypt for password hashing.
- **Third-Party Authentication**: Register and login using email, GitHub, and Facebook.
- **CRUD operations for posts**: Create, read, update, and delete posts.
- **User Profile Management**: Users can manage their profiles, including updating personal information.
- **Friend System**: Add and manage friends, view friends' posts.
- **Real-Time Notifications**: Implemented using Firebase for real-time updates.
- **Real-Time Chat**: WebSocket integration for real-time messaging between friends.
- **Cloud Storage**: Use AWS S3 for storing user uploads and media files.
- **Job Queue**: Utilize Redis and BullMQ for managing background jobs and tasks.
- **Basic Security Features**: Includes input validation and secure password storage.

## Technologies Used

- **TypeScript**
- **Node.js**
- **Express.js**
- **MongoDB**
- **Redis & BullMQ**
- **Firebase**
- **WebSockets**
- **AWS S3**
- **HTML, CSS, JavaScript** (for templates)

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)
- MongoDB
- Redis
- AWS Account (for S3)
- Firebase Account

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Bapparajsk/my-own-facebook-server.git
   cd my-own-facebook-server

2. Install the dependencies:
    ```sh
   npm install
   
3. Set up serviceAccountKey 
   1. create firebase account
   2. create a new project
   3. connect your firebase to your server
   4. goto firebase project setting
   5. goto Service account, top navigation bar
   6. scroll down, click to  Generate new private key, download file
   7. rename file to `serviceAccountKey.json`
   8. move to `credentials` folder


4. Set up the environment variables: <br/> Create a .env file in the root directory and add the following:
   ```sh
   MONGODB_URI=your_mongodb_uri
   PORT=your_port
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   PASSWORD_SALT=your_password_salt
   SESSION_SECRET=your_passport_session_secret
   AWS_ACCESS_ID=your_aws_access_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=your_aws_region
   AWS_BUCKET=your_ads_bucket_name
   REDIS_HOST=your_redis_host
   REDIS_PORT=your_redis_port

5. Start the server:
   ```sh
   npm start

## Directory Structure

- **[credentials](credentials)/**: Contains firebase configuration file
- **[src](src)**: Contains the source code for the server
  - **@bin/**: Contains host file
  - **config/**: Contains all config files
  - **helper/**: helper function to fast to code
  - **interface/** types and interface Contains
  - **lib/**: Contains customs library 
  - **middleware/** Contains Authentication files
  - **models/**: Contains Mongoose schemas for MongoDB
  - **router/**: Defines the routes for the application
  - **sockets**: Handles WebSocket connections and events
  - **utils/**: Utility functions and middlewares
- **[templates](templates)**: Contains HTML templates for uee send otp file
- **[.gitignore](.gitignore)**: Specifies files to be ignored by Git
- **[eslint.config.mjs](eslint.config.mjs)**: ESLint configuration
- **[package.json](package.json)**: Project metadata and dependencies
- **[tsconfig.json](tsconfig.json)**: TypeScript configuration
