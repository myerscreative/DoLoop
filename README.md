# 🐝 DoLoop - Build Productive Habits

DoLoop is a mobile-first productivity app that helps you create and complete recurring "loops" (habit/task cycles). Each loop is like a container for tasks that reset on a schedule (daily, weekly, monthly, or custom). The app features a friendly bee mascot and clean Apple-style design to make building productive habits fun and engaging.

## ✨ Core Features

- **🔐 Authentication** - Supabase Auth for sign up, sign in, and session management
- **🗄️ Database** - PostgreSQL via Supabase with Row Level Security
- **🔄 Loop Management** - Create recurring task containers with custom schedules
- **✅ Task Management** - Add/edit/complete tasks within loops
- **📊 Progress Tracking** - Visual progress bars and completion statistics
- **📱 Mobile-First** - Responsive design optimized for mobile devices
- **🎨 Apple-Style UI** - Clean, modern interface with the friendly bee mascot
- **⚡ Real-time Sync** - Live updates across devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 (mobile-first approach)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **Icons**: Lucide React
- **Deployment**: Ready for Vercel/Netlify

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
│   ├── AuthForm.tsx       # Authentication form
│   ├── Dashboard.tsx      # Main dashboard
│   └── LoadingSpinner.tsx # Loading components
├── contexts/               # React contexts
│   └── AuthContext.tsx    # Authentication state
├── lib/                   # Utilities and configurations
│   ├── supabase.ts        # Supabase client and types
│   └── utils.ts           # Helper functions and color themes
supabase/
└── schema.sql             # Database schema and policies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm/pnpm/yarn
- Supabase account (for backend)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/DoLoop.git
cd DoLoop
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the schema file in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase/schema.sql
```

This will create:
- `profiles` - User profile information
- `loops` - Main loop containers with colors and schedules  
- `tasks` - Individual tasks within loops
- `loop_members` - Sharing functionality (future feature)
- Row Level Security policies
- Sample data for testing

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see DoLoop in action! 🎉

### 5. Build for Production

```bash
npm run build
npm start
```

## 🎨 Design System

### Color Themes

DoLoop includes 6 beautiful color themes for loops:

- **🐝 Bee Yellow** - Primary brand color
- **🍯 Honey Orange** - Warm and energizing  
- **🌅 Morning Blue** - Calm and focused
- **🌲 Forest Green** - Natural and balanced
- **🌸 Lavender Purple** - Creative and inspiring
- **🌹 Rose Pink** - Gentle and motivating

### Mobile-First Approach

- **Big tap targets** (min 44px) for mobile usability
- **Single-column layouts** that work on all screen sizes
- **Swipe-friendly** interfaces for task management
- **Thumb-zone navigation** for one-handed use

## 📱 Core User Flow

1. **Sign Up/In** → Clean authentication with bee mascot
2. **Dashboard** → View all active loops with progress bars
3. **Create Loop** → Choose name, color, reset schedule
4. **Add Tasks** → Build your recurring task list
5. **Complete Tasks** → Check off items and see progress
6. **Auto Reset** → Tasks reset based on schedule (daily/weekly/monthly)

## 🔄 Loop Reset Logic

- **Daily**: Tasks reset every day at midnight
- **Weekly**: Reset on chosen day of week (default: Monday)  
- **Monthly**: Reset on chosen day of month (default: 1st)
- **Custom**: Future feature for advanced scheduling

## 🗃️ Database Schema

### Core Tables

- **profiles** - Extends Supabase auth.users
- **loops** - Loop containers with metadata
- **tasks** - Individual tasks within loops  
- **loop_members** - Sharing (future feature)

### Key Features

- **Row Level Security** - Users only see their own data
- **Real-time subscriptions** - Live updates
- **Automatic timestamps** - Created/updated tracking
- **Optimized indexes** - Fast queries

## 🚧 Development Status

### ✅ Completed (MVP)

- [x] Authentication system
- [x] Database schema with RLS
- [x] Mobile-first UI foundation
- [x] Dashboard with empty state
- [x] Basic loop/task types
- [x] Color theme system
- [x] Loading states
- [x] Bee mascot integration

### 🔨 In Progress

- [ ] Loop creation form
- [ ] Task management UI  
- [ ] Progress tracking
- [ ] Reset logic implementation

### 🔮 Future Features

- [ ] Shared loops (collaboration)
- [ ] Push notifications
- [ ] Calendar integration
- [ ] Analytics dashboard
- [ ] Dark mode
- [ ] React Native mobile app
- [ ] Team workspaces
- [ ] Export/import
- [ ] Advanced scheduling

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build test
npm run build
```

## 🚀 Deployment

DoLoop is ready to deploy on:

- **Vercel** (recommended for Next.js)
- **Netlify** 
- **Railway**
- Any platform supporting Node.js

### Environment Variables

Ensure these are set in production:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit issues and pull requests.

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with 🐝 and ❤️ for productive people everywhere!**
