# Tech Execution Planning

A comprehensive capacity planning and execution tracking system with Linear integration. This tool helps engineering teams plan quarterly capacity, track sprint-by-sprint execution, and maintain historical records of planning decisions.

## Features

### Capacity Planning
- **Quarterly Capacity Calculation**: Set team size, KTLO engineers, PTO days, and meeting time percentage
- **Focus Factor**: Automatically calculates development focus factor based on meeting time
- **PTO Management**: Track individual engineer PTO and adjust capacity calculations
- **Holiday Management**: Configure holidays per quarter to accurately calculate working days
- **Multi-Team Support**: Manage capacity for multiple teams independently

### Execution Planning
- **Sprint-Based Tracking**: Plan and track work across multiple sprints per quarter
- **Linear Integration**: Sync projects and issues directly from Linear
- **Planned vs Actual Effort**: Track both planned effort and actual time spent
- **Over-Capacity Indicators**: Visual warnings when team capacity is exceeded
- **Project Health Tracking**: Monitor project health (Green/Yellow/Red status)
- **Priority Management**: Organize projects by priority level

### Historical Tracking
- **Sprint Snapshots**: Save execution plan state for each sprint cycle
- **Decision History**: Track when capacity decisions were made
- **Capacity Snapshots**: Historical view of capacity utilization over time

### Team Management
- **Team Configuration**: Set up teams with Linear board integration
- **KTLO Allocation**: Define how many engineers are dedicated to KTLO work
- **Engineer Management**: Track total engineers and roadmap engineers per team

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Integrations**: Linear API SDK
- **UI Components**: Lucide Icons, Recharts

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Linear account with API access
- Linear API key (get from https://linear.app/settings/api)

### Installation

1. Clone or navigate to the project directory:
```bash
cd tech-execution-planning
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your Linear API key to `.env`:
```
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_PATH=./data/planner.db
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### 1. Set Up Quarters

1. Navigate to **Capacity Planning**
2. Click "New Quarter"
3. Enter quarter details:
   - Name (e.g., "Q1 2025")
   - Start and end dates
   - PTO days per engineer (default: 5)
   - Meeting time percentage (default: 0.25 = 25%)
   - Work days per week (default: 5)

### 2. Configure Teams

1. Go to **Team Management**
2. Create teams and link them to Linear boards
3. Set:
   - Total engineers
   - KTLO engineers (excluded from roadmap capacity)
   - Linear team ID (for syncing)

### 3. Plan Capacity

1. Select a quarter in **Capacity Planning**
2. View calculated capacity for each team:
   - Working days
   - Roadmap engineers (Total - KTLO)
   - Focus factor
   - Total capacity in days and weeks
3. Add PTO entries to adjust capacity:
   - Select team and engineer
   - Enter PTO dates and duration
   - Capacity automatically recalculates

### 4. Create Execution Plan

1. Navigate to **Execution Planning**
2. Select quarter and team
3. Create sprints for the quarter
4. Add projects:
   - Sync from Linear, or
   - Create manually
5. Allocate effort across sprints:
   - Set planned days per sprint
   - Add engineer assignments
   - Track actual days as work progresses

### 5. Monitor Capacity

- **Over-Capacity Alerts**: Projects show red indicator when quarter capacity is exceeded
- **Utilization Tracking**: See percentage of capacity allocated
- **Sprint View**: View capacity usage per sprint
- **Quarter Summary**: Total capacity vs allocated across all teams

### 6. Save Sprint Snapshots

1. At the end of each sprint cycle, save a snapshot
2. Snapshots preserve:
   - All project allocations
   - Capacity calculations
   - Team configuration
   - PTO adjustments
3. Use snapshots to track decision history and compare planning over time

## Database Schema

The application uses SQLite with the following main tables:

- **teams**: Team configuration and Linear integration
- **quarters**: Quarter definitions with capacity parameters
- **sprints**: Sprint definitions within quarters
- **projects**: Project/epic tracking with Linear sync
- **sprint_allocations**: Effort allocation per project per sprint
- **pto_entries**: Individual PTO tracking
- **holidays**: Holiday calendar per quarter
- **capacity_snapshots**: Historical capacity data
- **sprint_snapshots**: Complete execution plan snapshots

## Linear Integration

### Syncing Teams
The app can fetch teams from Linear and associate them with internal teams.

### Syncing Projects
- Fetch Linear projects and create corresponding entries
- Pull issue details including priority, estimate, status
- Link to Linear cycles (sprints)
- Sync assignees and leads

### Continuous Sync
- Manual sync button to pull latest data from Linear
- Maintains link between Linear issues and planning projects
- Updates project status and metadata

## Key Concepts

### Focus Factor
The percentage of time engineers spend on actual development work, calculated as:
```
Focus Factor = 1 - Meeting Time Percentage
```
Default is 75% (0.75) with 25% meeting time.

### Roadmap Engineers
```
Roadmap Engineers = Total Engineers - KTLO Engineers
```
Only roadmap engineers are counted for capacity planning.

### Capacity Calculation
```
Quarter Capacity (days) = (Working Days - PTO Days) × Roadmap Engineers × Focus Factor
```

### Over-Capacity Threshold
Projects exceeding 100% of quarter capacity show warning indicators. Configurable per team.

## Best Practices

1. **Update Capacity Regularly**: Adjust PTO and actual effort weekly
2. **Save Snapshots**: Create snapshots at sprint boundaries for historical tracking
3. **Sync with Linear**: Pull latest project data before planning sessions
4. **Review Utilization**: Monitor capacity indicators to avoid overcommitment
5. **Track Actuals**: Update actual effort as work progresses for better future estimates

## Development

### Project Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── capacity/          # Capacity planning pages
│   ├── execution/         # Execution planning pages
│   └── teams/             # Team management pages
├── components/            # React components
│   ├── capacity/         # Capacity planning components
│   └── execution/        # Execution planning components
├── lib/                   # Utility functions
│   ├── db.ts             # Database connection and schema
│   ├── linear.ts         # Linear API integration
│   └── capacity.ts       # Capacity calculation utilities
└── types/                 # TypeScript type definitions
```

### Adding New Features

1. **Database Changes**: Update schema in `src/lib/db.ts`
2. **API Routes**: Add new routes in `src/app/api/`
3. **Types**: Define TypeScript interfaces in `src/types/`
4. **Components**: Create reusable components in `src/components/`
5. **Pages**: Add new pages in `src/app/`

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Linear API Issues
- Verify API key is correct in `.env`
- Check Linear API rate limits
- Ensure Linear team IDs are correct

### Database Issues
- Delete `data/planner.db` to reset database
- Check file permissions on data directory
- Verify SQLite is working: `npm run dev` should create database automatically

### Capacity Calculation Issues
- Verify quarter dates are correct
- Check PTO entries don't overlap incorrectly
- Ensure team engineer counts are accurate

## Support

For issues or questions:
1. Check this README for common solutions
2. Review the example Excel files for expected data structure
3. Verify Linear integration is working correctly

## License

MIT License - feel free to use and modify for your organization's needs.
