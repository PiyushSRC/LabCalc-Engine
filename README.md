# LabCalc Engine

A professional, offline laboratory calculation tool built for scientific data analysis. Enter sample readings, compute results using standard formulas, and export polished PDF reports — all running 100% locally in your browser with zero API calls or internet dependency.

---

## Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Getting the Project](#getting-the-project)
  - [Option A — Download ZIP from GitHub](#option-a--download-zip-from-github)
  - [Option B — Clone with Git](#option-b--clone-with-git)
- [Opening in VS Code](#opening-in-vs-code)
- [Installing Dependencies](#installing-dependencies)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Production Build](#production-build)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Common Errors & Fixes](#common-errors--fixes)
- [Tech Stack](#tech-stack)

---

## Features

- Enter concentration, standard O.D., solvent, and sample readings
- Automatic calculation of Normal and SRC results
- Download a professionally formatted PDF report (A4, with SRC logo, color-coded columns)
- Print the same PDF directly from the browser
- Copy results as clean Markdown to clipboard
- Toast notifications for user feedback
- Smooth animations via Framer Motion
- Fully offline — no backend, no API keys, no internet required

---

## System Requirements

Before starting, make sure you have the following installed on your computer:

| Software    | Minimum Version         | Download Link                          |
|-------------|-------------------------|----------------------------------------|
| **Node.js** | v20.19+ or v22.12+ (LTS recommended) | https://nodejs.org/                   |
| **npm**     | v10+ (comes with Node.js)             | Included with Node.js                |
| **VS Code** | Latest stable                         | https://code.visualstudio.com/        |
| **Git**     | Any recent version (only if cloning)  | https://git-scm.com/                  |

### Verify Installation

Open a terminal (Command Prompt, PowerShell, or VS Code Terminal) and run:

```bash
node -v
```

You should see something like `v22.1.0`. If you get an error, install Node.js from the link above.

```bash
npm -v
```

You should see something like `10.7.0`.

---

## Getting the Project

### Option A — Download ZIP from GitHub

1. Go to the GitHub repository page
2. Click the green **Code** button
3. Select **Download ZIP**
4. Once downloaded, locate the ZIP file (usually in your `Downloads` folder)
5. **Right-click** the ZIP file and select **Extract All...**
6. Choose a destination folder (e.g., `C:\Users\YourName\Projects\`)
7. Click **Extract**

> **Important:** You must extract the ZIP before opening it. Do not try to run the project from inside the ZIP archive.

### Option B — Clone with Git

If you have Git installed, open a terminal and run:

```bash
git clone <repository-url>
```

Replace `<repository-url>` with the actual GitHub repository URL.

```bash
cd labcalc-engine
```

---

## Opening in VS Code

1. Open **VS Code**
2. Go to **File** > **Open Folder...**
3. Navigate to the extracted/cloned project folder (the one containing `package.json`)
4. Click **Select Folder**
5. If prompted "Do you trust the authors of the files in this folder?", click **Yes, I trust the authors**

You should now see the project files in the VS Code Explorer sidebar.

### Open the Terminal in VS Code

- Press **Ctrl + `** (backtick key, usually below `Esc`)
- Or go to **Terminal** > **New Terminal** from the menu bar

All commands below should be run in this terminal.

---

## Installing Dependencies

In the VS Code terminal, run:

```bash
npm install
```

This will:
- Read `package.json` for required packages
- Download all dependencies into the `node_modules/` folder
- Generate/update `package-lock.json`

Wait until it completes. You should see output like:

```
added 120 packages in 15s
```

> **Note:** If you see `npm warn` messages, those are usually harmless warnings and can be ignored. Only `npm ERR!` indicates a real problem.

---

## Environment Variables

**This project does not require any environment variables.**

There are no API keys, secrets, or `.env` files needed. Everything runs 100% locally in your browser. You can skip this step entirely.

---

## Running the Project

Start the development server:

```bash
npm run dev
```

You should see output like:

```
  VITE v6.x.x  ready in 500ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```

### Access the Application

Open your browser and go to:

```
http://localhost:3000
```

> **Note:** This project runs on port **3000** (not Vite's default 5173). This is pre-configured — no manual changes needed.

### Stop the Server

Press **Ctrl + C** in the terminal to stop the development server.

---

## Production Build

To create an optimized production build:

```bash
npm run build
```

This generates a `dist/` folder with static HTML, CSS, and JS files. You can serve this folder with any static file server.

To preview the production build locally:

```bash
npm run preview
```

To clean the build output:

```bash
npm run clean
```

---

## Available Scripts

| Command           | Description                                    |
|-------------------|------------------------------------------------|
| `npm run dev`     | Start the development server on port 3000      |
| `npm run build`   | Create optimized production build in `dist/`   |
| `npm run preview` | Preview the production build locally           |
| `npm run clean`   | Delete the `dist/` folder                      |
| `npm run lint`    | Run TypeScript type checking (no file output)  |

---

## Project Structure

```
labcalc-engine/
├── public/                  # Static assets (served as-is)
│   ├── src-logo.png         # SRC logo used in the app and PDF reports
│   └── src-logo.svg         # SVG version of the logo
├── src/                     # Application source code
│   ├── App.tsx              # Main application component (UI + logic)
│   ├── main.tsx             # React entry point (mounts App to DOM)
│   ├── index.css            # Global styles + Tailwind CSS imports
│   └── utils/               # Utility modules
│       ├── generateMarkdown.ts  # Markdown report generation
│       └── generatePDF.ts       # PDF report generation (jsPDF)
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build tool configuration
└── .gitignore               # Files excluded from Git
```

---

## Common Errors & Fixes

### 1. `npm install` fails

**Error:** `npm ERR! code ENOENT` or `npm ERR! could not find package.json`

**Fix:** Make sure you're in the correct folder. Run `ls` (or `dir` on Windows) — you should see `package.json` in the listing. If not, `cd` into the right directory.

---

### 2. `npm run dev` shows "port already in use"

**Error:** `Port 3000 is already in use`

**Fix:** Another application is using port 3000. Either:
- Close the other application, or
- Kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID_NUMBER> /F

  # macOS / Linux
  lsof -i :3000
  kill -9 <PID>
  ```

---

### 3. White / blank screen after starting

**Fix:** Open the browser Developer Console (`F12` > Console tab) and check for errors. Common causes:
- A syntax error in the code — check the terminal for Vite error output
- Clear browser cache: `Ctrl + Shift + R` (hard refresh)

---

### 4. `node: command not found`

**Fix:** Node.js is not installed or not in your system PATH. Download and install it from https://nodejs.org/ and restart your terminal.

---

### 5. PDF download does nothing / logo missing in PDF

**Fix:** Make sure the file `public/src-logo.png` exists. The PDF generator loads this image for the report header. If missing, the PDF will still generate but without the logo.

---

### 6. `npm warn` during install

**Info:** Warning messages during `npm install` are normal and do not prevent the project from running. Only `npm ERR!` lines indicate real problems.

---

## Tech Stack

| Technology          | Purpose                              |
|---------------------|--------------------------------------|
| React 19            | UI framework                         |
| TypeScript 5.8      | Type-safe JavaScript                 |
| Vite 6              | Build tool & dev server              |
| Tailwind CSS 4      | Utility-first CSS styling            |
| Framer Motion       | Animations and transitions           |
| Lucide React        | Icon library                         |
| jsPDF               | PDF document generation              |
| jspdf-autotable     | PDF table formatting                 |

---

**Built with care for SRC Laboratory workflows.**
