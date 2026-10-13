# ToolHub — AI-Powered, Privacy-First, All-in-One Online Utility Platform

ToolHub is a production-quality, unified online utility platform featuring **140+ utilities** across 11 major categories. It provides direct manual tool access paired with an **AI Orchestration Assistant** that converts natural language requests into verified, in-browser tool executions.

---

## 🛡️ Core Privacy Guarantee (Zero-Upload Architecture)
- **100% In-Browser Execution**: All document merging, image resizing/compression, calculations, and data formatting run directly in volatile browser RAM using HTML5 Canvas, Web Workers, and WebAssembly (`pdf-lib`, `fflate`, `qrcode`).
- **Zero Server File Uploads**: Files are never uploaded to any remote server or AI cloud endpoint.
- **AI Privacy Boundary**: The AI assistant only receives structured metadata and parameters (e.g. `{ targetSizeKb: 50 }`). Binary files are handled strictly by client-side workers.
- **CSPRNG Security**: Passwords and cryptographic UUIDs use the browser's native `crypto.getRandomValues()` API and are never transmitted over the network.

---

## 🛠️ Complete Tool Inventory (11 Categories & 140+ Tools)

1. **PDF & Document Tools** (17 tools): Merge, Split, Compress, PDF to Images, Images to PDF, Rotate, Reorder, Extract Pages, Add Page Numbers, Annotate, Sign, Password Protect, Remove Password, Metadata Editor, Organize Pages, Previewer, Batch Downloader.
2. **Image & Photo Tools** (18 tools): Image Compressor, Exact-Target-Size Compressor (< 50KB / < 100KB), Resizer, Cropper, Format Converter (JPG/PNG/WebP), Background Remover, Passport Photo Maker, Signature Resizer, Photo-to-PDF, Watermark, Inpaint Retouch, Collage Maker, Batch Image Processor, Before/After Comparator, Dimension Inspector, Quality Matrix Selector, Size Estimator, Batch ZIP Exporter.
3. **Student & Academic Tools** (18 tools): SGPA Calculator (Custom grading scales), CGPA Calculator, Percentage Converter, Marks & Aggregate Calculator, Weighted Grade Calculator, Attendance Calculator (Safe bunks & shortage formulas), Required Final Marks, Assignment Cover Generator, Project Report Templates, Citation Helper (APA, MLA, IEEE), Word Counter, Study Planner, Exam Countdown, Student Resume Builder, Exam Portal Photo Prep, Exam Signature Prep, Application Compressor, Assignment PDF Merger.
4. **Text & Writing Tools** (15 tools): Word Counter, Character Counter, UPPERCASE, lowercase, Title Case, Sentence Case, Text Cleaner, Extra Space Remover, Duplicate Line Remover, Text Diff Viewer, Find & Replace, Reading Time Calculator, Markdown Live Editor, URL Slug Generator, Readability Scoring.
5. **Everyday Calculators** (16 tools): Standard Calculator, Scientific Calculator, Discount Calculator, GST / Sales Tax Calculator, Age Calculator, Date Difference Calculator, Unit Converter, Time Duration Calculator, EMI Loan Calculator, Simple Interest, Compound Interest, Savings / SIP Growth, Salary Take-Home Estimator, Fuel Cost Calculator, Electricity Bill Estimator, Recipe Scaler.
6. **QR Code & Generators** (11 tools): QR Generator, QR Scanner, Wi-Fi QR, Contact vCard QR, Barcode Generator (Code 128, EAN-13), Secure Password Generator (CSPRNG), Random Number & Dice Roller, UUID v4/v7 Generator, Random Name Picker, Color Palette Generator, CSS Gradient Generator.
7. **Developer Tools** (16 tools): JSON Formatter & Minifier, JSON Syntax Validator, HTML Formatter, CSS Formatter, JS Formatter, SQL Query Formatter, CSV to JSON Converter, Base64 Encoder, Base64 Decoder, URL Encoder, URL Decoder, Unix Timestamp Converter, Regular Expression Playground, Code Diff Checker, Color Code Converter, SHA-256 / MD5 Checksum Hasher.
8. **Productivity Tools** (11 tools): To-Do Kanban Board, Daily Schedule Planner, Custom Checklist Generator, Markdown Scratchpad Notes, Pomodoro Focus Timer, Precision Lap Stopwatch, Multi-Countdown Timer, Daily Habit Tracker with streaks, Shopping List, Meeting Agenda Builder, Printable Monthly Calendar.
9. **Career & Job Tools** (7 tools): ATS-Friendly Resume Builder, Cover Letter Composer, Job Application Tracker, Interview Practice Flashcards, Work Experience Calculator, Job Offer Salary Comparison, Resume Formatting Checker.
10. **Audio, Video & File Tools** (11 tools): Document Format Converter, CSV Delimiter Converter, JSON Data Transformer, In-Browser ZIP Creator, In-Browser ZIP Extractor, Audio Format Converter, Audio Extractor from Video, Video Trimmer, Video Compressor, GIF Maker, Video Frame Capture.
11. **Advanced & Privacy Utilities** (12 tools): Image OCR Text Extractor, Scanned PDF OCR, AI Background Removal, Document Summarizer, Concept Flashcard Assistant, EXIF Metadata Viewer, Privacy EXIF Stripper, WCAG Contrast & A11y Analyzer, Resume Keyword Matcher, Cryptographic File Hasher, Batch Renamer, Feedback Hub.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v26)
- npm 9+

### Installation
```bash
# Clone or navigate to the directory
cd ToolHub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build & Automated Verification
```bash
# Run TypeScript compilation and Vite production bundling
npm run build

# Run Vitest automated test suite
npm test
```

---

## 🏗️ Technology Stack
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **PDF Engine**: `pdf-lib` (pure JavaScript client-side PDF manipulation)
- **Generators**: `qrcode`, `jsbarcode`, Web Crypto API (`crypto.getRandomValues`)
- **Search Engine**: `fuse.js` (fuzzy keyword + synonym index with multi-token matching)
- **Archive Engine**: `fflate`
- **Testing**: Vitest, React Testing Library
