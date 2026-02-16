# taskboard-by-rumon

> [Project description extracted from PROJECT_KNOWLEDGE.md]

## Features

- Feature 1 (from PROJECT_KNOWLEDGE.md Goals)
- Feature 2
- Feature 3

## Tech Stack

- **Backend**: nestjs
- **Frontend**: react
- **Database**: PostgreSQL
- **Deployment**: Docker

## Architecture

```
taskboard-by-rumon/
├── backend/              # nestjs API server
├── frontend/             # React web application
├── dashboard/                  # Admin dashboard
├── dashboard-admin/            # Admin Dashboard
├── dashboard-ops/              # Ops Dashboard
├── dashboard-organizer/        # Organizer Dashboard
├── .claude/              # Claude configuration & skills
├── .claude-project/      # Project documentation
└── docker-compose.yml    # Service orchestration
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Installation

```bash
# Clone repository with submodules
git clone --recurse-submodules <repo-url>
cd taskboard-by-rumon

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### Service URLs

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **Dashboard**: http://localhost:5174
- **Admin Dashboard**: http://localhost:5174
- **Ops Dashboard**: http://localhost:5175
- **Organizer Dashboard**: http://localhost:5176

## Development

### Backend Development

```bash
cd backend
npm install
npm run start:dev
```


### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
cd backend
npm run migration:generate -- MigrationName
npm run migration:run
```


## Documentation

- **Quick Reference**: See [CLAUDE.md](CLAUDE.md) for Claude context
- **Full Documentation**: See `.claude-project/docs/`
  - [PROJECT_KNOWLEDGE.md](.claude-project/docs/PROJECT_KNOWLEDGE.md) - Architecture
  - [PROJECT_API.md](.claude-project/docs/PROJECT_API.md) - API specs
  - [PROJECT_DATABASE.md](.claude-project/docs/PROJECT_DATABASE.md) - Database schema

## Project Structure

```
backend/
├── src/
│   ├── modules/         # Feature modules
│   ├── entities/        # TypeORM entities
│   ├── dto/             # Data transfer objects
│   └── guards/          # Auth guards
└── test/                # E2E tests
```


```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── types/           # TypeScript types
└── public/              # Static assets
```

## Testing

```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```


```bash
cd frontend
npm run test             # Vitest tests
```

## Deployment

### Production Build

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Create feature branch from `dev`
2. Make changes and commit
3. Push and create PR to `dev`
4. After review, merge to `dev`
5. `dev` → `main` for production releases

## License

[Specify license]

---

**Generated:** 2026-02-16
