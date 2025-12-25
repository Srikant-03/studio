# HearthLink Collaborative Reader

This is a Next.js-based collaborative PDF reader application built inside Firebase Studio. It allows users to create reading rooms, invite others, and interact with documents through shared annotations, highlights, and real-time chat.

## Running This Project Locally

To run this project on your own computer, you will need to follow these steps.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine. Installing Node.js will also install `npm` (Node Package Manager), which is required to manage the project's dependencies.

You can verify the installation by opening your terminal and running:
```bash
node -v
npm -v
```

### 2. Install Project Dependencies

Navigate to the project's root directory in your terminal and run the following command to install all the required packages listed in `package.json`:

```bash
npm install
```

### 3. Set Up Environment Variables

The application uses the Google Gemini API for its "Smart Annotations" feature. To enable this, you need to provide an API key.

1.  Create a new file in the root directory of the project named `.env.local`.
2.  Add the following line to the `.env.local` file, replacing `YOUR_GEMINI_API_KEY` with your actual key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

**Note**: The Firebase configuration is already included in the source code, but for a production application, you would typically move this to environment variables as well.

### 4. Run the Development Server

Once the dependencies are installed and the environment variables are set, you can start the local development server by running:

```bash
npm run dev
```

This command starts the Next.js application in development mode with Turbopack for faster performance.

### 5. View Your Application

After the server has started successfully, you will see a message in your terminal indicating that it's running. You can view your application by opening a web browser and navigating to:

[http://localhost:9002](http://localhost:9002)

Any changes you make to the source code will automatically be reflected in the browser.
