/**
 * Single structured source of truth for the /cv page (issue #13). Edit this
 * file to update the CV — no layout code needs to change for a content-only
 * update. The eventual PDF export (issue #14) is expected to render from
 * this same object, so it stays free of any web-specific formatting.
 */

export interface CvContact {
  phone: string
  email: string
  linkedin: string
  github: string
}

export interface CvExperience {
  role: string
  company: string
  companyUrl?: string
  location: string
  start: string
  end: string
  highlights: string[]
  tech: string[]
}

export interface CvProject {
  name: string
  role: string
  teamSize?: string
  start: string
  end: string
  tech: string[]
  highlights: string[]
}

export interface CvEducation {
  degree: string
  school: string
  end: string
}

export interface CvData {
  name: string
  title: string
  contact: CvContact
  summary: string
  experience: CvExperience[]
  projects: CvProject[]
  skills: Record<string, string[]>
  education: CvEducation[]
}

export const cv: CvData = {
  name: 'Phan Quoc Bao',
  title: 'Software Engineer',
  contact: {
    phone: '+84 355 414 870',
    email: 'barox.dev@gmail.com',
    linkedin: 'https://linkedin.com/in/phan-quoc-bao',
    github: 'https://github.com/baroxdev',
  },
  summary:
    'Software Engineer with over 3 years of experience building web applications in B2B e-commerce, education, and marketing campaigns using React, React Native, Next.js, TypeScript, Node.js and NestJS. Worked end to end on features such as RFQ and contract flows, real-time chat, and a multi-tenant IELTS practice platform. Recent work focuses on building maintainable and performant web applications and integrating AI into workflows where it brings clear business value.',
  experience: [
    {
      role: 'Software Engineer',
      company: 'EPOS Vietnam (Floating Cube Studios)',
      location: 'Ho Chi Minh City',
      start: 'Apr 2026',
      end: 'Present',
      highlights: [],
      tech: [
        'React (Ant Group internal fork)',
        'Tailwind CSS',
        'Micro-frontend',
        'WebView / H5 (cross-platform)',
      ],
    },
    {
      role: 'Software Engineer',
      company: 'Arobid',
      companyUrl: 'https://arobid.com',
      location: 'District 7, HCMC',
      start: 'Mar 2024',
      end: 'Apr 2026',
      highlights: [
        'Implemented and refactored real-time chat for buyers and suppliers using SignalR and React Query, improving perceived message delivery time by about 20% for active users.',
        'Spearheaded core B2B flows (RFQ, quotation, contracts) in a Turbo micro-frontend stack, designing a React/Zustand state architecture that reduced form re-rendering by 30%.',
        'Led the design system team in architecting a scalable UI library with 60+ base components, using a decoupled styling architecture for reusability and theme flexibility.',
        'Streamlined the development lifecycle by configuring GitHub Actions and Changesets to automate versioning and npm package releases.',
        'Integrated Payload CMS into the content workflow, cutting marketing/product content update time from days to hours.',
        'Designed and developed an internal AI chatbot system to automate operational workflows for OPS and Customer Support teams.',
        'Developed and deployed a cross-platform mobile app with React Native, navigating the Apple App Store review process for a seamless production launch.',
      ],
      tech: [
        'React',
        'Next.js',
        'React Native',
        'Zustand',
        'React Query',
        'Tailwind CSS',
        '.NET',
        'MongoDB',
      ],
    },
    {
      role: 'Software Engineer (Part-time, Remote)',
      company: 'ClassMate',
      companyUrl: 'https://classmate-vuive.com',
      location: 'Remote',
      start: 'Aug 2023',
      end: 'Dec 2024',
      highlights: [
        'Developed a multi-tenant IELTS practice platform using Next.js, Firebase and the OpenAI API, supporting more than 10 instructors, with tenant-aware Firestore data structures keeping data isolated per instructor and class.',
        'Led end-to-end delivery for Elanglab and a confidential edtech client, working with instructors to clarify requirements, plan releases, and prioritize features while keeping defect rates low.',
        'Optimized Firebase and OpenAI usage by refactoring data schema/prompts and adding Zod validation, reducing combined AI and database cost by 43% while maintaining performance.',
      ],
      tech: [
        'React (Vite)',
        'TypeScript',
        'Express.js',
        'Socket.io',
        'GraphQL',
        'Firebase',
      ],
    },
    {
      role: 'Frontend Engineer',
      company: 'MangoAds',
      companyUrl: 'https://mangoads.vn',
      location: 'District 10, HCMC',
      start: 'Dec 2022',
      end: 'Mar 2024',
      highlights: [
        'Developed and optimized marketing/landing websites for clients such as ACB, Eximbank, and VAS using React and Next.js, improving page load time and Core Web Vitals for SEO and campaign performance.',
        'Collaborated with designers and marketing teams in an agile process to deliver and update landing pages within campaign timelines.',
        'Integrated RESTful APIs with a CMS for dynamic data rendering across banking and education platforms.',
        'Optimized SEO and static rendering in Next.js, boosting page load speed and search visibility.',
      ],
      tech: ['React', 'Next.js'],
    },
  ],
  projects: [
    {
      name: 'Software Development for "KBank Thuong Vang" Campaign — KBank Vietnam',
      role: 'Frontend Developer',
      teamSize: '4 (PM/BA, BE, FE, UI/UX)',
      start: 'Sep 2024',
      end: 'Jan 2025',
      tech: ['Next.js', 'Tailwind CSS', 'Firebase'],
      highlights: [
        'Designed and built a high-performance lucky draw system that supported a major national campaign, processing 15M+ data points with fast, reliable interaction under high load.',
        'Optimized data processing to execute in seconds, improving cost efficiency and user engagement.',
      ],
    },
    {
      name: 'Seconds — Capstone Project',
      role: 'Leader & Full-Stack Developer',
      teamSize: '4 (1 FS, 1 FE, 2 BE)',
      start: 'Aug 2024',
      end: 'Dec 2024',
      tech: [
        'Next.js',
        'Tailwind CSS',
        'NestJS',
        'TypeORM',
        'ElasticSearch',
        'GraphQL',
        'PostgreSQL',
      ],
      highlights: [
        'Designed and implemented a full-stack second-hand marketplace with listing, bidding, and order flows for buyers and sellers.',
        'Implemented GraphQL APIs and optimized search with ElasticSearch and proper indexing to improve listing retrieval time and prepare the system for future personalization and scale.',
      ],
    },
  ],
  skills: {
    Frontend: [
      'React',
      'Next.js',
      'TypeScript',
      'JavaScript (ES6+)',
      'Tailwind CSS',
      'React Query',
      'Shadcn UI',
    ],
    'Backend / Full-Stack': [
      'Express.js',
      'NestJS',
      '.NET (Basic)',
      'Socket.io',
      'GraphQL',
    ],
    Databases: ['MongoDB', 'MySQL', 'PostgreSQL', 'Firebase'],
    Other: [
      'AI Integration (GPT-4, GPT-4 Nano)',
      'SEO Optimization',
      'Responsive Design',
      'API Integration',
      'TypeORM',
      'ElasticSearch',
      'Agile/Scrum',
    ],
  },
  education: [
    {
      degree: 'Bachelor of Software Engineering',
      school: 'FPT University, Ho Chi Minh City',
      end: 'Dec 2024',
    },
  ],
}
