# Take-Home Assignment: AI Meeting Digest

Welcome, and thank you for your interest in work4u and the amazing opportunities in our startup community! This assignment is designed to give us a sense of your software engineering skills in a practical, real-world scenario. It's a small, self-contained project that reflects the kind of work we do, including problem-solving, product thinking, and leveraging modern tools.

**Time Limit:** 48 hours from the moment you clone this repository.

## The Challenge: Build an "AI Meeting Digest" Service

Your task is to build a full-stack web application that allows a user to submit a raw meeting transcript and, in return, receive a concise, AI-generated summary.

### Core User Story

As a busy professional, I want to paste the long, messy transcript of a meeting I missed into a web application. After submitting it, I want to see a well-structured summary that includes:

1. A brief, one-paragraph overview of the meeting.
2. A bulleted list of the key decisions made.
3. A bulleted list of the action items assigned, and to whom.

The application should save my past summaries so I can review them later.

### Core Features (Required)

1.  **Frontend:** A clean, simple, and responsive user interface with:
    * A large text area to paste the meeting transcript.
    * A "Generate Digest" button.
    * A section to display the structured AI-generated summary.
    * A view to list previously generated digests.

2.  **Backend:** An API service that:
    * Accepts the transcript text from the frontend.
    * Sends the transcript to a 3rd-party AI service (like Google's Gemini API) with a carefully crafted prompt to request the summary in the desired format.
    * Parses the AI's response.
    * Saves both the original transcript and the structured summary to a database.
    * Provides an endpoint to retrieve a list of all past digests.

3.  **Database:** A simple database schema to store the digests (e.g., an ID, the original transcript, the summary, and a timestamp).

### Bonus Features (Optional but Recommended)

For candidates who wish to demonstrate a deeper level of expertise, we highly encourage you to implement one or both of the following features:

**1. Shareable Digest Links:**
* **Goal:** Allow a user to share a generated digest with others via a unique, permanent URL.
* **Implementation:**
    * When a digest is created, generate a unique, hard-to-guess public ID (e.g., using `UUID`).
    * Create a new page/route on the frontend (e.g., `/digest/:publicId`) that fetches and renders a single digest.
    * The main list of digests should provide a "Share" button for each item, which copies this unique URL to the clipboard.

**2. Real-time Streaming Response:**
* **Goal:** Improve user experience by displaying the AI-generated summary word-by-word as it's being generated, rather than waiting for the entire process to complete.
* **Implementation:**
    * Modify the backend endpoint to use the AI provider's streaming API.
    * Use a technology like **Server-Sent Events (SSE)** or **WebSockets** to stream the response from the backend to the frontend in real-time.
    * Update the frontend to progressively render the text as it arrives.

### On Using AI Programming Assistants (e.g., GitHub Copilot, Gemini)

**We explicitly encourage you to use AI-powered coding assistants.** A modern engineer's skill set includes the ability to use these tools effectively. Part of this evaluation is to understand *how* you use them.

## Technical Requirements

You have the freedom to choose your stack, but we recommend using common, modern technologies.

* **Frontend:** React, Vue, or Svelte.
* **Backend:** Node.js (Express/Fastify), Python (FastAPI/Flask), or Go.
* **Database:** PostgreSQL, SQLite, or MongoDB.
* **AI Service:** We recommend the **Google Gemini API**, as it supports streaming responses and has a generous free tier. You can get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Example Project Structure (Feel Free To Define Your Own)

```
/
├── backend/
│   ├── src/
│   └── package.json (or requirements.txt, go.mod, etc.)
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
├── CANDIDATE_README.md  <-- YOU WILL FILL THIS OUT
└── README.md            <-- THIS FILE
```

## Submission Process

1.  **Fork** this repository to your own GitHub account.
2.  Create a new branch for your work (e.g., `ben/work4u-fullstack`).
3.  Implement your solution.
4.  Fill out the **`CANDIDATE_README.md`** file. This is a critical part of your submission.
5.  Create a Pull Request from your feature branch to the `main` branch **of your own forked repository**.
6.  Send us the link to the Pull Request.

## Evaluation Criteria

We will be evaluating your submission based on the following criteria:

1.  **Code Quality & Architecture:** Is the code clean, well-structured, and maintainable?
2.  **Functionality:** Does the application meet all the core feature requirements? Is it robust?
3.  **Seniority & Initiative:** Implementation of the **Challenge Features** will be considered a strong indicator of seniority. How did you approach these more complex problems?
4.  **Product Thinking:** How is the user experience? Did you consider edge cases (e.g., long transcripts, failed API calls, invalid share links)?
5.  **Testing:** While a full test suite isn't required, the presence of some unit or integration tests will be viewed very favorably.
6.  **Documentation & Communication:** The clarity and completeness of your `CANDIDATE_README.md` is as important as the code itself.

---

## Candidate Write-up Template (`CANDIDATE_README.md`)

*(Please copy the following template into the `CANDIDATE_README.md` file and fill it out as part of your submission.)*

---

### 1. Technology Choices

* **Frontend:** `[Your Choice]`
* **Backend:** `[Your Choice]`
* **Database:** `[Your Choice]`
* **AI Service:** `[Your Choice]`

Briefly explain why you chose this stack.

### 2. How to Run the Project

Provide clear, step-by-step instructions for how to get your project running locally.

### 3. Design Decisions & Trade-offs

Explain any significant architectural or design decisions you made. What were the trade-offs? If you implemented the challenge features, describe your approach. What would you do differently if you had more time?

### 4. AI Usage Log

Describe how you used AI programming assistants during this project. Be specific!
