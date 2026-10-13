import { CategoryInfo, ToolCategory } from '../types/tool';

export const CATEGORIES: Record<ToolCategory, CategoryInfo> = {
  pdf: {
    id: 'pdf',
    name: 'PDF & Documents',
    description: 'Merge, split, compress, reorder, protect, and edit PDF documents 100% in your browser.',
    iconName: 'FileText',
    gradient: 'from-rose-500 to-red-600',
  },
  image: {
    id: 'image',
    name: 'Image & Photos',
    description: 'Lossless & exact-KB compression, resizing, background removal, passport photo & signature tools.',
    iconName: 'Image',
    gradient: 'from-sky-500 to-blue-600',
  },
  student: {
    id: 'student',
    name: 'Student & Academic',
    description: 'Configurable SGPA/CGPA, attendance, marks calculators, assignment covers, citations, and resume builder.',
    iconName: 'GraduationCap',
    gradient: 'from-amber-500 to-orange-600',
  },
  text: {
    id: 'text',
    name: 'Text & Writing',
    description: 'Case converters, clean duplicates/spaces, diff viewer, live Markdown editor, and word counter.',
    iconName: 'Type',
    gradient: 'from-emerald-500 to-teal-600',
  },
  calculator: {
    id: 'calculator',
    name: 'Everyday Calculators',
    description: 'Scientific, standard, EMI, GST, exact age, date differences, unit converters, and financial estimators.',
    iconName: 'Calculator',
    gradient: 'from-indigo-500 to-violet-600',
  },
  qr: {
    id: 'qr',
    name: 'QR Codes & Generators',
    description: 'Custom QR codes (WiFi, vCard, URL), barcodes, CSPRNG secure passwords, UUIDs, and color palettes.',
    iconName: 'QrCode',
    gradient: 'from-purple-500 to-fuchsia-600',
  },
  developer: {
    id: 'developer',
    name: 'Developer Utilities',
    description: 'JSON, HTML, CSS, SQL formatters, Base64/URL encoders, RegEx playground, timestamps, and checksums.',
    iconName: 'Code',
    gradient: 'from-cyan-500 to-blue-600',
  },
  productivity: {
    id: 'productivity',
    name: 'Productivity & Planning',
    description: 'Local Kanban to-do board, Pomodoro focus timer, habit tracker, markdown notes, and printable calendars.',
    iconName: 'CheckSquare',
    gradient: 'from-lime-500 to-green-600',
  },
  career: {
    id: 'career',
    name: 'Career & Jobs',
    description: 'ATS resume builder, cover letter composer, experience calculator, and job-application checklist.',
    iconName: 'Briefcase',
    gradient: 'from-blue-600 to-indigo-700',
  },
  media: {
    id: 'media',
    name: 'Audio, Video & Files',
    description: 'In-browser ZIP archives, video audio extractor, media trimmer, GIF converter, and video frame capture.',
    iconName: 'Film',
    gradient: 'from-pink-500 to-rose-600',
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced & Privacy',
    description: 'In-browser OCR for images/scans, EXIF metadata viewer & stripper, and WCAG accessibility contrast checker.',
    iconName: 'Sparkles',
    gradient: 'from-violet-600 to-purple-700',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
