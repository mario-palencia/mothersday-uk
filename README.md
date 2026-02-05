# Celebrate Valentine's - Landing Page

A beautiful, responsive Valentine's Day landing page for multiple cities. Discover romantic experiences, unique gifts, and unforgettable date ideas for Valentine's Day.

## Features

- 🎬 Hero section with video background
- 💕 Top 3 romantic picks showcase
- 📱 Responsive carousel for categorized experiences
- 🎨 Pink gradient Galentines theme with decorative SVG elements
- 📊 Data fetched from Google Sheets

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Data Source**: Google Sheets (CSV export)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/fever-valentines-landing.git
cd fever-valentines-landing
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Add a hero video:
   - Place your video file at `public/valentines-hero.mp4`
   - Or update the video source in `src/components/valentines/hero-section.tsx`

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
fever-valentines-landing/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles & CSS variables
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Root redirect to Madrid
│   │   └── [lang]/[city]/valentines-day/
│   │       ├── page.tsx         # Valentine's page (server component)
│   │       └── valentines-landing-view.tsx  # Main view (client component)
│   ├── components/
│   │   ├── ui/
│   │   │   └── card.tsx         # Shadcn-style Card component
│   │   └── valentines/
│   │       ├── hero-section.tsx # Hero with video background
│   │       ├── plan-card.tsx    # Experience card component
│   │       └── plan-carousel.tsx # Horizontal scrolling carousel
│   └── lib/
│       ├── utils.ts             # Utility functions (cn helper)
│       └── valentines/
│           └── service.ts       # Data fetching from Google Sheets
├── public/                      # Static assets (add your video here)
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## Data Configuration

The page fetches data from two Google Sheets:

1. **Plans Data** (`VALENTINES_CSV_URL` in `service.ts`):
   - Contains experience details (title, venue, price, image, rank, etc.)
   - Filtered for Madrid (id_city = 5)

2. **Category Translations** (`CATEGORY_TRANSLATIONS_CSV_URL` in `service.ts`):
   - Maps category tags to translated display names

### Valid Categories

- `concerts-musicals-theater`
- `valentines-related-events`
- `food`
- `workshops-and-activities`
- `wellness-and-relaxation`

## Customization

### Adding More Cities

1. Update the filter in `service.ts` to allow other city IDs
2. Modify `page.tsx` to handle different city slugs
3. Update the hero section to show dynamic city names

### Changing the Theme

- Colors are defined in `globals.css` (CSS variables)
- Pink gradient: `from-[#FF1493] via-[#FF3366] to-[#FF6B9D]`
- Decorative SVGs are in `valentines-landing-view.tsx`

### Hero Video

Replace `/valentines-hero.mp4` in `public/` folder or update the video source path in `hero-section.tsx`.

## Deployment

### Google Cloud Platform (Current)

This project is deployed on Google Cloud Platform using Docker and Nginx.

#### Build and Deploy

1. Build the Docker image:
```bash
docker build -t celebrate-valentines .
```

2. Deploy to Google Cloud Run:
```bash
gcloud run deploy celebrate-valentines \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

See `GOOGLE-CLOUD-DEPLOY.md` for detailed deployment instructions.

### Other Platforms

```bash
npm run build
npm run start
```

## License

Proprietary

## Support

For questions or issues, please open an issue on GitHub.

