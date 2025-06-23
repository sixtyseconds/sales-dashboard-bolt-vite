# Meeting Type Filter Implementation

## Overview
Added a meeting type filter to the sales dashboard that allows users to filter activities by specific meeting types (Discovery, Demo, Follow-up). This enables users to easily track how many new meetings of each type they've had.

## Changes Made

### 1. Updated Activity Filters Hook (`src/lib/hooks/useActivityFilters.ts`)
- Added `meetingType?: string` to the `ActivityFilters` interface
- Updated initial state and reset function to include `meetingType: undefined`

### 2. Enhanced SalesTable Component (`components/SalesTable.tsx`)
- Updated filtering logic to include meeting type filtering:
  ```typescript
  const matchesMeetingType = !filters.meetingType || 
    (activity.type === 'meeting' && activity.details === filters.meetingType);
  ```
- Added conditional meeting type filter dropdown in the filter panel:
  - Only shows when activity type is 'meeting' or when no type filter is applied
  - Options: All Meeting Types, Discovery, Demo, Follow-up
- Changed grid layout from 3 columns to 4 columns to accommodate new filter

### 3. Enhanced Dashboard (`src/pages/Dashboard.tsx`)
- Added "Meeting Breakdown" section displaying:
  - Discovery Calls count with trend
  - Product Demos count with trend  
  - Follow-up Meetings count with trend
- Each card is clickable and navigates to the activity log with appropriate filters applied
- Added required icon imports: `Search`, `ArrowUpRight`

### 4. Standardized Meeting Types (`lib/hooks/useActivities.ts`)
- Updated dummy data generation to use consistent meeting type values:
  - Changed from `['Discovery Call', 'Product Demo', 'Follow-up']`
  - To `['discovery', 'demo', 'follow-up']`

## Features Added

### Filter Functionality
- **Meeting Type Filter**: Dropdown that appears when filtering by meetings or when no activity type is selected
- **Conditional Display**: Filter only shows when relevant to avoid clutter
- **Integration**: Works seamlessly with existing filters (date range, sales rep, search)

### Dashboard Analytics
- **Meeting Breakdown Cards**: Visual representation of meeting types with counts
- **Trend Analysis**: Shows month-over-month change for each meeting type
- **Click-to-Filter**: Users can click cards to drill down into specific meeting types
- **Responsive Design**: Adapts to different screen sizes

### User Experience
- **Intuitive Filtering**: Meeting type filter only appears when filtering meetings
- **Clear Labeling**: User-friendly labels (Discovery Calls, Product Demos, etc.)
- **Smooth Navigation**: Clicking dashboard cards automatically applies filters and navigates to activity log

## Technical Implementation

### Data Structure
Meeting types are stored in the `details` field of activities where `type === 'meeting'`:
- `discovery` → Discovery Calls
- `demo` → Product Demos  
- `follow-up` → Follow-up Meetings

### Filter Logic
```typescript
const matchesMeetingType = !filters.meetingType || 
  (activity.type === 'meeting' && activity.details === filters.meetingType);
```

### Dashboard Calculations
```typescript
const count = selectedMonthActivities
  .filter(a => a.type === 'meeting' && a.details === type)
  .reduce((sum, a) => sum + (a.quantity || 1), 0);
```

## Benefits
1. **Better Visibility**: Users can now see breakdown of meeting types at a glance
2. **Improved Filtering**: Easy to filter and analyze specific types of meetings
3. **Enhanced Reporting**: Better understanding of sales pipeline activity
4. **User-Friendly**: Intuitive interface that only shows relevant options
5. **Performance Tracking**: Month-over-month trends for each meeting type

## Usage
1. Navigate to the sales dashboard to see the Meeting Breakdown section
2. Use the Activity Log's filter panel to filter by specific meeting types
3. Click on meeting breakdown cards to automatically filter and view details
4. Use in combination with other filters (date range, sales rep) for detailed analysis