# Talent Pool Goldmining Feature

## Overview
This feature automatically identifies high-potential candidates already in the Recruitee database when a high-priority (Red) job is identified. It finds "Silver Medalists": candidates who previously reached late stages (e.g., 'Hiring Manager Interview' or 'Offer') but were not hired.

## Implementation Summary

### 1. Service Layer (`lib/recruitee.ts`)
- **`fetchSilverMedalistCandidates()`**: Fetches all candidates who are disqualified but reached late stages
- **`matchCandidatesToJob()`**: Matches Silver Medalist candidates to a job based on title keywords and tags
- **`SilverMedalistCandidate` interface**: Extended candidate type with furthest stage information

### 2. API Route (`app/api/recruitee/silver-medalists/route.ts`)
- GET endpoint that accepts `jobId`, `jobTitle`, and optional `jobTags`
- Returns matched Silver Medalist candidates for a specific job

### 3. Types (`types/recruitee.ts`, `types/dashboard.ts`)
- Added `SilverMedalistCandidate` interface
- Updated `VacancyWithPriority` to include optional `suggestedCandidates` field

### 4. React Hook (`hooks/use-silver-medalists.ts`)
- TanStack Query hook for fetching and caching Silver Medalist candidates
- Only fetches when enabled (typically for Red priority jobs)
- Includes proper caching and error handling

### 5. UI Component (`components/talent-pool-goldmine.tsx`)
- Displays "Potential Goldmine" section with matched candidates
- Shows candidate name, furthest stage, date, and previous offer information
- Includes link to Recruitee candidate profile
- Handles loading and error states

### 6. Integration (`components/priority-modal.tsx`)
- Integrated into the Priority Modal (job detail view)
- Only displays for Red priority jobs (10-12 points)
- Shows below the notes section

## Key Features

### Late Stage Detection
The system identifies late stages using keywords:
- "Hiring Manager Interview"
- "Final Interview"
- "Offer"
- "Aanbod"
- "Eindgesprek"
- "Laatste ronde"
- "Beslissing"

### Matching Logic
- Extracts keywords from job title (words > 3 characters)
- Matches against candidate's previous offer title
- Considers job tags if provided
- Sorts by most recent late stage date

### Performance
- Uses TanStack Query for efficient caching (10 min stale time)
- Batch processing when fetching candidates
- Only fetches for Red priority jobs

## Usage

The feature automatically activates when:
1. A job has Red priority (10-12 points)
2. User opens the Priority Modal for that job
3. The "Potential Goldmine" section appears below the notes

## Files Modified/Created

### Created:
- `app/api/recruitee/silver-medalists/route.ts`
- `hooks/use-silver-medalists.ts`
- `components/talent-pool-goldmine.tsx`

### Modified:
- `lib/recruitee.ts` - Added Silver Medalist fetching and matching functions
- `types/recruitee.ts` - Added `SilverMedalistCandidate` interface
- `types/dashboard.ts` - Added `suggestedCandidates` field
- `components/priority-modal.tsx` - Integrated TalentPoolGoldmine component

## Testing Recommendations

1. **Test with Red Priority Job**: Open a job with Red priority and verify the component appears
2. **Test Matching**: Verify candidates are matched based on job title keywords
3. **Test Edge Cases**: 
   - Jobs with no matches
   - Jobs with Orange/Green priority (should not show)
   - Loading states
   - Error states

## Future Enhancements

- Add "Re-engage" action button to flag candidates for outreach
- Improve matching algorithm (fuzzy matching, skill-based matching)
- Add filters (date range, stage type)
- Add candidate notes/history
- Export matched candidates

