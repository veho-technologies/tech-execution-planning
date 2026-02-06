# Quick Start Guide

Get your Tech Execution Planning app up and running in 5 minutes!

## Step 1: Install Dependencies (1 minute)

```bash
cd /Users/mustafa.bharmal/Documents/tech-execution-planning
npm install
```

## Step 2: Configure Linear API (2 minutes)

1. Get your Linear API key from: https://linear.app/settings/api

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Edit `.env` and add your API key:
```
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_PATH=./data/planner.db
```

## Step 3: Start the Server (30 seconds)

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 4: Initial Setup (2 minutes)

### A. Create Your First Team

1. Go to **Team Management** (navbar)
2. Click **"Add Team"**
3. Fill in:
   - Name: e.g., "Transportation Planning"
   - Total Engineers: e.g., 9
   - KTLO Engineers: e.g., 1
   - Linear Team: (Click refresh icon, then select your Linear team)
4. Click **"Create Team"**

### B. Create a Quarter

1. Go to **Capacity Planning** (navbar)
2. Click **"New Quarter"**
3. Fill in:
   - Name: e.g., "Q1 2025"
   - Start Date: 2025-01-01
   - End Date: 2025-03-31
   - PTO Days: 5
   - Meeting Time %: 0.25 (= 25%)
   - Work Days/Week: 5
4. Click **"Create Quarter"**

### C. View Your Capacity

You'll immediately see your calculated capacity:
- Working days (accounting for weekends)
- Roadmap engineers (Total - KTLO)
- Focus factor (75% if meeting time is 25%)
- Total capacity in days and weeks

## Step 5: Start Planning Execution (1 minute)

### A. Create Sprints

1. Go to **Execution Planning** (navbar)
2. Select your Quarter and Team
3. Click **"Manage Sprints"**
4. Click **"Generate Multiple Sprints"**
5. Enter number of sprints (e.g., 13 for a quarter)
6. Click **"Done"**

### B. Add Projects

**Option 1: Sync from Linear**
1. Click **"Sync Linear"**
2. Select issues to import
3. Click **"Sync X Issues"**

**Option 2: Add Manually**
1. Click **"Add Project"**
2. Fill in project details:
   - Title
   - Priority (P1-P5)
   - Engineering POC
   - Original Effort estimate
   - Health status (G/Y/R)
3. Click **"Create Project"**

### C. Allocate Effort

1. Click on any **blue "Planned"** cell in the sprint columns
2. Enter effort in days (e.g., 5 for 1 engineer-week)
3. Press Enter
4. Watch the capacity indicator update!

## What You'll See

### ✅ Capacity Planning View
- Total capacity per team per quarter
- PTO management with automatic recalculation
- Focus factor and meeting time adjustments
- Summary cards showing available capacity

### ✅ Execution Planning View
- Spreadsheet-like table with projects as rows
- Sprints as columns with Planned/Actual cells
- **Over-capacity indicator** (red warning when exceeded)
- Utilization percentage with progress bar
- Health status badges (G/Y/R)
- Priority indicators (P1-P5)

### ✅ Key Features Working
- ✓ Click cells to edit allocations
- ✓ Real-time capacity calculations
- ✓ Color-coded over-capacity warnings
- ✓ Linear sync for projects
- ✓ PTO tracking with capacity impact
- ✓ Historical data saved in database

## Example Workflow

1. **Monday Morning Planning**
   - Review quarter capacity (Capacity Planning page)
   - Check over-capacity warnings (Execution Planning page)
   - Adjust allocations as needed

2. **Mid-Sprint**
   - Update "Actual" effort spent (green cells)
   - Track progress vs. plan

3. **End of Sprint**
   - Review what was completed
   - Save sprint snapshot (future feature)
   - Adjust remaining sprint allocations

4. **Quarter Planning**
   - Add PTO for upcoming quarter
   - Create new projects or sync from Linear
   - Distribute work across sprints
   - Monitor capacity utilization

## Common Tasks

### Add PTO
1. Capacity Planning → PTO Management
2. Click "Add PTO"
3. Select team, engineer, dates
4. Capacity automatically recalculates

### View Over-Capacity
- Red indicator appears when allocated > capacity
- Shows by how many days you're over
- Displayed prominently at top of execution view

### Sync New Issues from Linear
1. Execution Planning → "Sync Linear"
2. Issues are fetched in real-time
3. Select which ones to import
4. They appear as projects in your execution table

### Edit Project Details
1. Click the edit icon (pencil) next to project
2. Update priority, health, POC, timelines, etc.
3. Changes save immediately

### Track Actual Work
1. Click on green "Actual" cells
2. Enter days actually spent
3. "Remaining" column updates automatically

## Tips

💡 **Start Simple**: Create 1 team, 1 quarter, a few sprints, and 2-3 projects to learn the flow

💡 **Use Linear Sync**: Faster than manual entry and keeps data in sync

💡 **Monitor Capacity**: The red over-capacity warning is your friend - use it to negotiate scope or add resources

💡 **Update Actuals Weekly**: Keep "Actual" columns current for accurate remaining work estimates

💡 **Add PTO Early**: Configure PTO as soon as dates are known for accurate capacity

## Troubleshooting

### Linear connection fails?
- Check API key in `.env` file
- Restart server: `npm run dev`
- Test in Settings page

### Database errors?
- Delete `data/planner.db` to reset
- Restart server

### No sprints showing?
- Click "Manage Sprints" and generate them
- Make sure you selected the right quarter

### Capacity showing as 0?
- Add engineers to your team (Team Management)
- Make sure Roadmap Engineers > 0 (Total - KTLO)

## Next Steps

Once comfortable with basics:

1. **Add Multiple Teams** - Plan capacity for all your teams
2. **Configure Holidays** - Add company holidays to adjust working days
3. **Track Multiple Quarters** - Plan ahead for Q2, Q3, etc.
4. **Historical Snapshots** - (Future) Save sprint snapshots to track decisions over time

## Need Help?

- See **README.md** for detailed documentation
- Check **IMPLEMENTATION_STATUS.md** for what's built vs. in progress
- Review the Excel templates in your Downloads/Desktop folders for reference

## You're All Set! 🎉

Your capacity and execution planner is ready to use. Start by:
1. Adding your teams
2. Creating quarters
3. Syncing projects from Linear
4. Planning your sprints

Happy planning! 📊
