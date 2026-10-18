// Safe to edit by hand
// =============================================================================
// Table views for Reid Design's longer lists (PORTS.md card 117)
// =============================================================================
// Each entry is one extra desk item ("Room stories as a table") BESIDE the
// normal list, never instead of it: a sortable table with a status pill and an
// Open button (src/sanity/workflow/DocumentTable.tsx, PORTABLE). Every column
// key must come out of its projection; src/lib/studio-table.test.ts checks.
// =============================================================================
import type { TableConfig } from '../lib/studio-table';

export const TABLES: TableConfig[] = [
  {
    id: 'project-table',
    title: 'Room stories as a table',
    type: 'project',
    projection: 'title, location, roomType, year, featured, "photos": count(gallery)',
    columns: [
      { key: 'title', label: 'Room story' },
      { key: 'location', label: 'Town' },
      { key: 'roomType', label: 'Room' },
      { key: 'year', label: 'Year' },
      { key: 'photos', label: 'Photos' },
      { key: 'featured', label: 'On Home', kind: 'bool' },
    ],
    defaultSort: { key: 'year', dir: 'desc' },
  },
  {
    id: 'service-table',
    title: 'Services as a table',
    type: 'service',
    projection: 'name, price, badge, showOnHomepage',
    columns: [
      { key: 'name', label: 'Service' },
      { key: 'price', label: 'Price shown' },
      { key: 'badge', label: 'Badge' },
      { key: 'showOnHomepage', label: 'On Home', kind: 'bool' },
    ],
    defaultSort: { key: 'name', dir: 'asc' },
  },
  {
    id: 'testimonial-table',
    title: 'Reviews as a table',
    type: 'testimonial',
    projection: 'date, attribution, source, rating, hideOnWebsite',
    columns: [
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'attribution', label: 'From' },
      { key: 'source', label: 'Where' },
      { key: 'rating', label: 'Stars' },
      { key: 'hideOnWebsite', label: 'Hidden', kind: 'bool' },
    ],
    defaultSort: { key: 'date', dir: 'desc' },
  },
];
