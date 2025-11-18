
# 🚛 TruckGPS - Professional Truck Route Planning

A professional-grade GPS routing application designed specifically for commercial truck drivers. Features compliance-based routing, hazmat handling, and real-time navigation with truck-specific restrictions.

## 🎯 Project Overview

TruckGPS provides commercial truck drivers with intelligent routing that accounts for:
- Vehicle dimensions (height, weight, length)
- Hazmat cargo classifications
- Bridge clearances and weight restrictions
- Prohibited routes and zones
- Turn-by-turn navigation optimized for trucks

## ✨ Features (Phase 1A - Current)

- ✅ **Truck-Specific Routing**: Input precise vehicle specifications
- ✅ **Hazmat Compliance**: Automatic routing for 13+ hazmat classes
- ✅ **Turn-by-Turn Navigation**: Detailed instructions with distance/time
- ✅ **Interactive Maps**: Visual route display with Leaflet
- ✅ **Professional UI**: Calm, industry-focused design
- ✅ **HERE Maps Integration**: Enterprise-grade routing API

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Maps**: Leaflet + HERE Maps API
- **UI Components**: Shadcn/ui + Radix UI
- **Icons**: Lucide React

## 📋 Upcoming Features

### Phase 1B - Database & Restrictions
- PostgreSQL database with Prisma ORM
- Persistent truck profiles
- Route history tracking
- Advanced restriction database (bridges, weight limits, hazmat zones)

### Phase 1C - Truck Stop Finder
- Truck stop locations with amenities
- Fuel price comparison
- Parking availability
- Rest area information

### Phase 2 - Advanced Features
- Real-time traffic integration
- Weather overlays
- Multi-stop route optimization
- Driver preference profiles

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- HERE Maps API key ([Get one here](https://developer.here.com/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jeeper89/truck-gps.git
cd truck-gps
```

2. Install dependencies:
```bash
cd nextjs_space
yarn install
```

3. Set up environment variables:
```bash
# Create .env file in the root directory
echo "HERE_MAPS_API_KEY=your_api_key_here" > .env
```

4. Run the development server:
```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
truck-gps/
├── nextjs_space/
│   ├── app/
│   │   ├── api/
│   │   │   └── route-truck/     # Routing API endpoint
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main page
│   ├── components/
│   │   ├── truck-routing-form.tsx
│   │   ├── route-results.tsx
│   │   ├── route-map.tsx
│   │   └── ui/                   # Shadcn components
│   ├── lib/
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── utils.ts              # Utility functions
│   └── public/                   # Static assets
├── .env                          # Environment variables (not tracked)
└── README.md
```

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HERE_MAPS_API_KEY` | HERE Maps API key for routing | Yes |
| `DATABASE_URL` | PostgreSQL connection string (Phase 1B+) | No |

## 🎨 Design Philosophy

The UI follows a **professional trucking industry** aesthetic:
- **Slate gray** backgrounds (asphalt/road feel)
- **Deep blue** accents (highway signage)
- **Highway yellow** secondary colors (caution/alerts)
- Clean, bold typography with uppercase tracking
- Data-focused layouts with clear hierarchy

## 🤝 Contributing

This is currently a personal project in active development. Contributions will be welcomed after Phase 2.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- HERE Maps for enterprise routing API
- Shadcn/ui for component library
- Trucking community for feature inspiration

---

**Current Phase**: 1A - Core Routing  
**Next Milestone**: Phase 1B - Database & Restrictions  
**Timeline**: 3-week development cycle
