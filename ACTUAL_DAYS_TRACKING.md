# Actual Days Tracking - Implementation Guide

## Overview

This feature automatically calculates actual time spent on issues by analyzing Linear state history. It requires **zero effort from engineers** - they just need to move issues to "In Progress" when working on them.

## How It Works

### Algorithm

1. **Fetch Linear State History**
   - For each issue in a sprint, get all state transitions with timestamps
   - Track when issues entered and left "In Progress" state

2. **Identify Active Work Days**
   - Count only business days (Monday-Friday)
   - Exclude holidays from the system's holiday calendar
   - Only count time when issue is in "In Progress" state
   - Exclude time in: "Blocked", "On Hold", "Todo", "Backlog"

3. **Handle Parallel Work**
   - If an engineer has 3 issues "In Progress" on the same day
   - Distribute 1.0 day evenly: each issue gets 0.33 days
   - Example:
     ```
     Day 1: VEH-123 (In Progress) → 1.0 day
     Day 2: VEH-123, VEH-124 (both In Progress) → 0.5 day each
     Day 3: VEH-123, VEH-124, VEH-125 (all In Progress) → 0.33 day each
     ```

4. **Normalize by Focus Factor**
   - Apply team's focus factor to account for meetings/KTLO time
   - Example: 0.75 focus factor (25% meetings) → 5 raw days = 3.75 actual days

5. **Multiple Assignees**
   - If issue has 2 assignees, each gets equal credit
   - Split time proportionally

### What Gets Tracked

✅ **Captured:**
- Time spent coding/working on issues
- Parallel work on multiple issues
- Individual engineer contributions
- Team capacity utilization

❌ **Not Captured:**
- Work not tracked in Linear (ad-hoc tasks, incidents)
- Code reviews (unless in Linear)
- Meetings (already accounted for in focus factor)
- Time in "Blocked" or "On Hold" states

## How to Use

### 1. Sync Actuals from Linear

In the **Execution Planning** page:

1. Select your Quarter and Team
2. Ensure sprints exist and projects are linked to Linear issues
3. Click **"Sync Actuals"** button (green button with clock icon)
4. Wait for sync to complete (processes all sprints in quarter)
5. Actual days will populate in the "Actual" columns

### 2. What Happens During Sync

```
For each sprint:
  1. Fetch all Linear issues in sprint
  2. Get state history for each issue
  3. Calculate business days in "In Progress"
  4. Distribute across parallel work
  5. Normalize by focus factor
  6. Update sprint_allocations.actual_days
```

### 3. View Results

- **Actual Days** column shows calculated time
- **Remaining** column = Original Effort - Sum(Actual Days)
- **Capacity Indicator** shows total actual vs. planned capacity

## Requirements

### Engineers Must:
- ✅ Move issues to "In Progress" when starting work
- ✅ Move issues out of "In Progress" when done/blocked
- ❌ No manual time logging required

### System Requirements:
- ✅ Projects must be linked to Linear issues
- ✅ Team must have Linear integration configured
- ✅ Sprints must be created
- ✅ Holidays configured in system

## Accuracy

### Expected Accuracy: **70-85%**

**High Accuracy (80-95%):**
- Well-defined features with clear start/end
- Single-issue focus
- Regular state updates

**Medium Accuracy (60-80%):**
- Complex issues with parallel work
- Multi-week efforts
- Issues with blocked periods

**Lower Accuracy (40-60%):**
- Ad-hoc work not in Linear
- Incidents without Linear issues
- Helping other engineers
- Code reviews

## Limitations

1. **Only tracks "In Progress" state**
   - Other states are ignored
   - Engineers must keep issues updated

2. **Assumes even distribution**
   - If engineer works on 2 issues, assumes 50/50 split
   - Reality may vary (80/20 split)

3. **Business days only**
   - Weekend work not counted
   - Assumes 5-day work week

4. **Unplanned work not captured**
   - Incidents, code reviews, ad-hoc help
   - Consider manual "Unplanned Work" entries

## Best Practices

### For Engineers:
1. ✅ Move issues to "In Progress" when you start
2. ✅ Move to "Blocked" if waiting on someone
3. ✅ Move to "Done" when complete
4. ✅ Keep issues focused (don't have 10 in progress at once)

### For Managers:
1. ✅ Run "Sync Actuals" weekly or bi-weekly
2. ✅ Review capacity utilization trends
3. ✅ Compare actual vs. estimated to improve planning
4. ✅ Account for unplanned work separately

### For Planning:
1. ✅ Use actuals from previous sprints to estimate future work
2. ✅ Track remaining work vs. capacity
3. ✅ Identify over/under capacity early

## Troubleshooting

### No Actual Days Showing

**Check:**
- ✅ Projects are linked to Linear issues (linear_issue_id set)
- ✅ Issues have state history (moved to "In Progress" at least once)
- ✅ Linear API key is valid and has permissions
- ✅ Team has linear_team_id configured

### Actual Days Seem Wrong

**Common Causes:**
- ⚠️ Engineer had many issues "In Progress" simultaneously (splits time)
- ⚠️ Issue was in "Blocked" state (time excluded)
- ⚠️ Weekend work not counted
- ⚠️ Holidays excluded from calculation

### Sync Takes Long Time

**Normal for:**
- Large number of issues (>100)
- Many sprints in quarter
- Extensive state history per issue

**Typical sync time:** 5-30 seconds per sprint

## Technical Details

### API Endpoint

```
POST /api/sprints/[sprintId]/sync-actuals
```

**Response:**
```json
{
  "success": true,
  "message": "Synced actual days for 15 projects",
  "allocations": [
    {
      "id": "proj-123",
      "title": "User Authentication",
      "actualDays": 8.5
    }
  ]
}
```

### Database Schema

```sql
-- Stores calculated actual days
sprint_allocations:
  - project_id
  - sprint_id
  - planned_days (manual entry)
  - actual_days (auto-calculated)
```

### Linear API Usage

- Queries issue history for state transitions
- Uses `issue.history()` method
- Fetches up to 200 history entries per issue
- Rate limited by Linear API (typically 1000 req/min)

## Future Enhancements

Potential improvements:
- 📊 GitHub commit analysis for more accuracy
- 🔔 Automated daily/weekly sync via cron
- 📈 Trend analysis (velocity over time)
- 🎯 Estimate vs. actual reporting
- 🚨 Alert when actual >> estimated

## Support

For issues or questions:
1. Check Linear integration is working
2. Verify issue state history exists
3. Review console logs for errors
4. Check database for actual_days values

---

**Last Updated:** 2026-02-06
