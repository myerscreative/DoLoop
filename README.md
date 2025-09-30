# DoLoop - Looping To-Do Lists

DoLoop is a modern, mobile-first web application designed for managing recurring checklists and building consistent routines. Think of it as a hybrid between a to-do list and a habit tracker, centered around "loops" - reusable task sequences that reset on a schedule.

## 🐝 Features

- **User Authentication** - Email and social sign-in via Supabase Auth
- **Create Loops** - Set up recurring checklists with custom colors and reset schedules
- **Task Management** - Add recurring and one-time tasks to your loops
- **Progress Tracking** - Visual progress bars show completion status
- **Reloop Functionality** - Reset recurring tasks while archiving completed one-time tasks
- **Shared Loops** - Collaborate with others by inviting members and assigning tasks
- **Mobile-First Design** - Clean, responsive interface with big tap targets
- **Real-time Sync** - Changes sync automatically across devices

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Database**: PostgreSQL with Row Level Security
- **Styling**: Tailwind CSS with mobile-first approach
- **Deployment**: Ready for Vercel/Netlify deployment

## 📁 Project Structure

```
DoLoop/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   └── dashboard/         # Dashboard and loop management
│   ├── contexts/              # React contexts (Auth)
│   └── lib/                   # Supabase client and utilities
├── supabase/
│   ├── config.toml            # Supabase local development config
│   └── migrations/            # Database schema migrations
└── public/                    # Static assets
```

## 🗄️ Database Schema

### Tables

- **profiles** - User profile information (extends Supabase auth.users)
- **loops** - Main loop entities with ownership, colors, and reset rules
- **tasks** - Individual tasks within loops (recurring or one-time)
- **loop_members** - Shared loop memberships with roles

### Key Features

- Row Level Security (RLS) enabled on all tables
- Automatic user profile creation on registration
- Optimized indexes for performance
- Support for real-time subscriptions

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase CLI (optional, for local development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DoLoop
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase project credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Supabase Setup

#### Option 1: Use Supabase Cloud

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run the database migration:
   ```bash
   # Upload the migration to your Supabase project
   # Use the Supabase dashboard or CLI to apply the schema
   ```

#### Option 2: Local Development

1. Install Supabase CLI
   ```bash
   npm install -g supabase
   ```

2. Start local Supabase
   ```bash
   supabase start
   ```

3. Apply migrations
   ```bash
   supabase db push
   ```

4. Use the local connection details in `.env.local`

## 🏗️ Build and Deploy

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Deploy to Netlify

1. Build the static version: `npm run build && npm run export`
2. Deploy the `out/` directory to Netlify
3. Set environment variables in Netlify dashboard

## 🧪 Code Quality

This project includes comprehensive code quality checks:

- **ESLint** - Code linting and style enforcement
- **TypeScript** - Type safety and better developer experience
- **Build Verification** - Ensures all code compiles correctly

Run quality checks:
```bash
npm run lint    # ESLint
npm run build   # TypeScript compilation + build
```

## 📱 Usage

### Creating Your First Loop

1. **Sign up** with your email or social provider
2. **Create a loop** by clicking "New Loop"
3. **Add tasks** to your loop (recurring or one-time)
4. **Set reset schedule** (daily, weekly, monthly, or custom)
5. **Start completing tasks** and watch your progress

### Managing Loops

- **View Progress** - See completion percentages at a glance
- **Reloop** - Reset recurring tasks while archiving one-time tasks
- **Share Loops** - Invite collaborators and assign tasks
- **Color Coding** - Organize loops with custom color themes

### Mobile Experience

DoLoop is designed mobile-first with:
- Large, easy-to-tap buttons
- Responsive grid layouts
- Touch-friendly interactions
- Optimized for portrait orientation

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass and code follows style guidelines
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues and Support

- Report bugs and feature requests via [GitHub Issues](../../issues)
- Check existing issues before creating new ones
- Include reproduction steps and environment details

## 🎯 Roadmap

### Upcoming Features

- [ ] Mobile app (React Native)
- [ ] Advanced scheduling options
- [ ] Team workspaces
- [ ] Integration with calendar apps
- [ ] Analytics and insights
- [ ] Custom task types and templates
- [ ] Notification system
- [ ] Dark mode toggle
- [ ] Export/import functionality

### Current Status

- ✅ MVP Core Features (Auth, Loops, Tasks, Dashboard)
- ✅ Mobile-first responsive design
- ✅ Real-time sync with Supabase
- ✅ Row Level Security
- 🚧 Task management UI
- 🚧 Shared loops functionality
- 📋 Mobile app development

---

Built with ❤️ for productivity enthusiasts who love consistent routines!