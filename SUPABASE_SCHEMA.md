# Supabase Database Schema

## Schema Public

### Core Tables
- **profiles** - User profiles with staff roles
- **orgs** - Organizations
- **org_members** - Organization membership
- **leads** - Lead management for staff
- **transports** - Transport management
- **vehicles** - Vehicle management
- **clients** - Client management

### Staff Management
- **profiles** table has:
  - `is_staff` boolean
  - `staff_role` enum ('admin', 'marketing', 'support', 'staff')
  - `is_admin` boolean

### Lead Management
- **leads** table for marketing staff
- **assigned_to** references auth.users(id)

## Schema Auth
- **users** - Supabase auth users
- **sessions** - User sessions
- **identities** - OAuth identities

## Schema Storage
- **buckets** - File storage
- **objects** - File objects

## Key Relationships
- `profiles.id` → `auth.users.id`
- `leads.assigned_to` → `auth.users.id`
- `org_members.user_id` → `auth.users.id`
