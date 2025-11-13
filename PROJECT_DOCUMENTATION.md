# Project Documentation: Multi-Package Chatbot

## 1. Project Overview

This project is an advanced web-based chatbot designed for collecting detailed information about multiple packages. It features a conversational interface powered by natural language processing (NLP) for data entry, real-time validation, and session management. The application supports importing package data from various file formats (CSV, JSON, PDF) and exporting the collected data. A key feature is its ability to handle partially complete data from PDF imports by prompting the user to fill in the missing required fields.

### Core Features:
- **Conversational Data Entry**: Users can add package details through a natural chat conversation.
- **Multi-Package Support**: The system can handle multiple packages within a single session.
- **File Import**: Import package data from CSV, JSON, and PDF files.
- **Incomplete Data Handling**: If an imported PDF lacks required information, the UI presents a form to the user to complete the data.
- **Data Export**: Export collected package data to JSON, CSV, or a printable PDF summary.
- **Real-time UI**: The user interface updates in real-time, showing a summary of collected packages.
- **Session Management**: User sessions are maintained, allowing for persistence and context retention.
- **Responsive Design**: The web interface is designed to work on both desktop and mobile devices.

## 2. Project Structure

The project is organized into a `public` directory for frontend assets and a `src` directory for backend TypeScript source code.

```
e:/project/iitb-P1/
├── public/
│   ├── app.js              # Frontend JavaScript logic
│   ├── index.html          # Main HTML file for the web interface
│   └── styles.css          # CSS for styling the application
├── src/
│   ├── models/
│   │   └── types.ts        # TypeScript interfaces for data structures (Package, Session, etc.)
│   ├── services/
│   │   ├── conversationManager.ts # Core chatbot logic and dialogue flow
│   │   ├── importService.ts       # Handles file import from CSV, JSON, PDF
│   │   └── sessionManager.ts      # Manages user session state
│   ├── server.ts             # Main backend server file (Express, Socket.IO, API routes)
│   └── tsconfig.json         # TypeScript compiler configuration
├── .gitignore
├── package.json            # Project dependencies and scripts
└── README.md
```

---

## 3. Backend (Server-side)

The backend is built with Node.js, Express, and TypeScript. It handles the core business logic, API requests, and real-time communication with the client via Socket.IO.

### `src/server.ts`
This is the main entry point for the backend application.

- **Responsibilities**:
    - Initializes an Express server.
    - Sets up an HTTP server and integrates it with Socket.IO.
    - Configures middleware: `cors` for cross-origin requests, `express.json` for parsing JSON bodies, and `express.static` to serve the `public` directory.
    - Implements `multer` for handling file uploads in memory.
    - Manages active user sessions in a `Map`.
- **Socket.IO Events**:
    - `connection`: Handles new client connections.
    - `init-session`: Creates a new session or resumes an existing one.
    - `user-message`: Receives a message from the user, processes it via `ConversationManager`, and sends a response.
    - `export-data`: Triggers the data export process.
    - `calculate-costs`: Calculates and returns shipping costs for the packages in the session.
- **API Endpoints**:
    - `GET /api/health`: A health check endpoint.
    - `POST /api/import`: Handles file uploads. It determines the file type, uses `ImportService` to process the file, adds packages to the session, and handles incomplete packages.
    - `POST /api/import/complete`: Receives user-submitted data for an incomplete package and uses `ImportService` to finalize it.
    - `GET /api/import/template`: Allows users to download a sample CSV template.

### `src/services/conversationManager.ts`
This class is the "brain" of the chatbot. It manages the conversation flow based on a state machine.

- **State Machine**: Uses the `ConversationState` enum to track the dialogue's current context (e.g., `ASKING_WEIGHT`, `EDITING`, `PACKAGE_SUMMARY`).
- **`processInput(userInput)`**: The main method that takes user input, processes it with an NLP utility (though `nlpService.ts` was not found, its structure is implied), and determines the appropriate response based on the current state.
- **State Handlers**: Contains various `handle...State` methods (e.g., `handleWelcomeState`, `handleDimensionsInput`, `handleEditingState`) that define the bot's behavior and responses for each state in the conversation.
- **Editing Logic**: The `handleEditingState` method allows users to modify specific fields of a package they are currently adding.

### `src/services/sessionManager.ts`
This class is responsible for creating, managing, and persisting user session data.

- **Responsibilities**:
    - Creates and manages a `Session` object which holds all packages, conversation history, and metadata.
    - Provides methods to `startNewPackage`, `updateCurrentPackage`, and `completeCurrentPackage`.
    - Manages the current `ConversationState`.
    - Can save and load sessions to/from the file system (in a `sessions` directory), although this seems to be a planned or partially implemented feature.

### `src/services/importService.ts`
This service contains all logic related to importing data from files.

- **`importFromFile(...)`**: The primary method that routes the file buffer to the correct parsing method based on its format (CSV, JSON, or PDF).
- **`importFromCSV(...)`**: Uses the `papaparse` library to parse CSV files into package objects.
- **`importFromJSON(...)`**: Parses JSON files, expecting an array of package objects.
- **`importFromPDF(...)`**: Uses the `pdf-parse` library to extract text from a PDF. It then uses pattern matching (`extractPackagesFromText`) to find package information.
- **`validatePackage(...)`**: A crucial method that checks if an extracted package has all the required fields (like destination, dimensions, weight). If not, it generates a list of `missingFields`.
- **`completePackage(...)`**: This method takes an incomplete package and user-provided data from the frontend modal and merges them to create a complete `Package` object.

### `src/models/types.ts`
This file defines all the core data structures and types used throughout the application, ensuring type safety.

- **Key Interfaces**:
    - `Package`: The complete data structure for a single package.
    - `Session`: Represents a user's entire session, including all packages and conversation history.
    - `Dimensions`, `Weight`, `Address`: Component interfaces used within the `Package` type.
    - `IncompletePackage` (in `importService.ts`): Defines the structure for a package with missing data, which is sent to the frontend for completion.

---

## 4. Frontend (Client-side)

The frontend is a single-page application (SPA) built with vanilla HTML, CSS, and JavaScript.

### `public/index.html`
This file defines the HTML structure of the web application.

- **Main Components**:
    - **Header**: Contains the application title and theme/summary toggle buttons.
    - **Sidebar**: Displays the list of packages added so far and the total estimated cost. Also contains buttons for importing and exporting data.
    - **Chat Container**: The main area for the conversation, including the message display, typing indicator, suggestions, and user input textarea.
- **Modals**:
    - **Export Modal**: Appears when the user clicks "Export Data", offering choices like JSON, CSV, and PDF.
    - **Import Modal**: Provides a drag-and-drop area for file uploads.
    - **Complete Package Modal**: This is a dynamic modal that appears after a PDF import with missing data. It contains a form with fields for the user to fill in.

### `public/styles.css`
This file contains all the styling for the application.

- **Features**:
    - **CSS Variables**: Used for theming (light and dark modes).
    - **Responsive Design**: Uses media queries to adapt the layout for mobile devices, including collapsing the sidebar.
    - **Modern Look**: Implements a clean, modern design with smooth transitions and animations.
    - **Component Styling**: Contains specific styles for all UI components like message bubbles, modals, buttons, and forms.

### `public/app.js`
This is the core of the frontend logic, encapsulated in a `ChatApp` class.

- **Responsibilities**:
    - **Socket.IO Connection**: Establishes and manages the real-time connection to the backend server.
    - **Event Handling**: Listens for user actions like sending a message, clicking buttons, and uploading files.
    - **DOM Manipulation**:
        - Dynamically adds user and bot messages to the chat window.
        - Updates the package list in the sidebar.
        - Shows and hides modals.
    - **File Upload Logic**: Handles file selection, validation (type and size), and uploading to the `/api/import` endpoint.
    - **Incomplete Package Handling**:
        - `showCompletePackageModal()`: When the import API returns `incompletePackages`, this function is called. It dynamically builds and displays a form within the modal for each incomplete package.
        - `submitCompletePackages()`: Collects the data from the completion form and sends it to the `/api/import/complete` endpoint.

---

## 5. How to Set Up and Run

1.  **Prerequisites**:
    - Node.js (v16 or later)
    - npm (comes with Node.js)

2.  **Install Dependencies**:
    Open a terminal in the project root and run:
    ```bash
    npm install
    ```

3.  **Build the Project**:
    The backend is written in TypeScript and needs to be compiled into JavaScript.
    ```bash
    npm run build
    ```
    This command runs the TypeScript compiler (`tsc`), which reads `tsconfig.json` and outputs the compiled JavaScript files into the `dist` directory.

4.  **Run the Server**:
    Once the project is built, you can start the server.
    ```bash
    npm start
    ```
    This will start the Node.js server, and you should see a confirmation message in the terminal indicating that the server is running on `http://localhost:5000`.

5.  **Access the Application**:
    Open your web browser and navigate to `http://localhost:5000`.

### Development Mode
For development, you can use `ts-node` to run the TypeScript files directly without a separate build step.
```bash
npm run dev:web
```
This will start the server and automatically restart it when you make changes to the source files.
