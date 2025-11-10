

import React from 'react';

export type IconComponent = React.ElementType;

export interface NavItem {
    icon: IconComponent;
    label: string;
    active?: boolean;
    href?: string;
}

export interface StatCardProps {
    icon: IconComponent;
    title: string;
    value: string;
}

export interface InfoCardProps {
    title: string;
    badge?: string;
    children: React.ReactNode;
    icon?: IconComponent;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    isClosable?: boolean;
}

export interface WorkloadStatusItem {
    title: string;
    icon: IconComponent;
    text: string;
    progress: string;
}

export interface AirtableRecord<T> {
    id: string;
    createdTime: string;
    fields: T;
}

export interface Client {
    'Client Name': string;
    'Matters'?: string[]; // Linked record IDs
    'Client type'?: 'Business' | 'Individual';
    'Last name'?: string;
    'Sex'?: 'Male' | 'Female' | 'Other';
    'Marital status'?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
    'Spouse name'?: string;
    'Spouse contacts'?: string[];
    'Date of birth'?: string; // YYYY-MM-DD
    'National ID'?: string;
    'Phone Number'?: string;
    'Email'?: string;
    'Postal address'?: string;
    'Physical address'?: string;
    'Related property'?: string;
    'Date of instruction'?: string; // YYYY-MM-DD
    'Client status'?: 'Active' | 'Inactive' | 'Prospect';
    'Brief Assistant'?: string[]; // Linked to Users table
    'Assigned Attorney'?: string[]; // Linked to Users table
    'Notes'?: string;
    'Occupation'?: string;
    'Employer'?: string;
}

export interface Matter {
    'File Number': string;
    'Case Status': 'In-progress' | 'Closed' | string;
    'Case Type'?: string;
    'Matter Name'?: string;
    'Case No'?: string;
    'Date Opened'?: string;
    'Description'?: string;
    'Case Notes'?: string;
    'Tasks'?: string[]; // Linked record IDs
    'Task Name (from Tasks)'?: string[] | string;
    'Client'?: string[]; // Linked Client record IDs
    'Client Name (from Client)'?: string[] | string; // Lookup field for client names
    'Events'?: string[]; // Linked Event record IDs
    'Brief Assistant'?: string[]; // Link to Users table
}

export interface Task {
    'Task Name': string;
    'Status'?: 'To-Do' | 'In-Progress' | 'Done';
    'Due Date'?: string;
    'Matter'?: string[]; // Linked Matter record ID
    'Priority'?: 'High' | 'Medium' | 'Low';
    'Description'?: string;
    'Matter Name (from Matter)'?: string[];
    'Assignee'?: string[]; // Link to Users table (for display)
    'Brief Assistant'?: string[]; // Link to Users table (for filtering)
    'Brief Assistant (from Matter)'?: string[]; // Lookup from Matter
}

export interface AirtableAttachment {
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string; // e.g., 'image/jpeg'
}

export interface Document {
    'Title': string;
    'Description'?: string;
    'File'?: AirtableAttachment[];
    'Link'?: string;
    'Matter'?: string[]; // Linked Matter record ID
    'Category'?: 'Pleadings' | 'Correspondence' | 'Discovery' | 'Orders' | 'Registry Docs' | 'Client Docs' | 'Misc' | 'Authorities';
    'Status'?: 'Draft' | 'Final' | 'For Review' | 'Archived';
    'Tags'?: string[]; // Multiple select
    'Document Date'?: string; // Date field
    'Brief Assistant'?: string[]; // Link to Users table
    'Uploaded By'?: string[]; // Link to Users table
    // Lookup fields from Matter, for display and filtering
    'Matter Name (from Matter)'?: string[];
    'File Number (from Matter)'?: string[];
    'Client Name (from Matter)'?: string[];
    'Brief Assistant (from Matter)'?: string[];
}

export interface DocumentFilters {
    categories: string[];
    statuses: string[];
    tags: string[];
    startDate: string | null;
    endDate: string | null;
}

export interface Note {
    'Subject': string;
    'Description'?: string; // Will now contain HTML
    'Tags'?: string[];
    'Pin'?: boolean;
    'Matter'?: string[]; // Linked Matter record ID
    'Color'?: string;
    'Brief Assistant'?: string[]; // Link to Users table
    // Lookup fields from Matter
    'Matter Name (from Matter)'?: string[];
    'File Number (from Matter)'?: string[];
    'Brief Assistant (from Matter)'?: string[];
}

export interface Invoice { // This represents a 'Fee Note' record
    'Invoice #': string;
    'Matter'?: string[]; // Linked Matter
    'Line Items'?: string[]; // Link to Fee Note Line Items
    'Matter Name (from Matter)'?: string[];
    'Client Name (from Matter)'?: string[];
    'Status': 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Void';
    'Total Amount'?: number; // Rollup field from Line Items
    'Amount Paid'?: number;
    'Issue Date'?: string;
    'Due Date'?: string;
    'Date Paid'?: string;
    'Billed By'?: string;
    'Brief Assistant'?: string[]; // Changed to a Link to Users table
    'Brief Assistant (from Matter)'?: string[]; // Lookup from Matter table
}

export interface FeeNoteLineItem {
    'Description': string; // The description of the service
    'Fee Note'?: string[]; // Link back to the parent Invoice/Fee Note
    'Amount': number; // The currency amount for this line item
    'Matter'?: string[]; // Typically a lookup from Fee Note
}

export interface Contact {
    'Name'?: string; // This is a formula field in Airtable
    'Type'?: 'Person' | 'Company';
    'Category'?: string;
    'Client Status'?: 'Active' | 'Inactive' | 'Prospect';

    // Person fields
    'First Name'?: string;
    'Last Name'?: string;
    'Middle Name'?: string;
    'Date of Birth'?: string;
    'National ID'?: string;
    'Sex'?: 'Male' | 'Female' | 'Other';
    'Marital Status'?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
    'Spouse Name'?: string;
    'Occupation'?: string;
    'Employer'?: string;

    // Company fields
    'Company Name'?: string;
    'Contact Person Name'?: string;
    'Contact Person Position'?: string;
    'Contact Person Phone'?: string;
    'Contact Person Email'?: string;

    // Common fields
    'Email'?: string;
    'Primary Phone'?: string;
    'Secondary Phone'?: string;
    'Website'?: string;
    'Physical Address'?: string;
    'Postal address'?: string;
    'Description'?: string; // Notes/Description
    
    // Linking fields
    'Matter'?: string[]; // Link to Matter
    'Matter Names (from Matter)'?: string[]; // Lookup from Matter
    'Date of instruction'?: string;
}


export type ReminderOption = '15 mins before' | '1 hour before' | '1 day before' | '2 days before';

export interface CalendarEvent {
    'Subject': string;
    'Start Time': string; // ISO string for datetime-local input
    'End Time'?: string; // ISO string
    'Location'?: string;
    'Description'?: string;
    'Type': 'Court Hearing' | 'Client Meeting' | 'Deposition' | 'Filing Deadline' | 'Misc';
    'Matter'?: string[]; // Linked Matter record ID
    'Attendees'?: string[]; // Linked Client record IDs
    'All Day'?: boolean;
    'Reminders'?: ReminderOption[];
    'Assignee'?: string[]; // Link to Users table (for display)
    'Brief Assistant'?: string[]; // Link to Users table (for filtering)
    'Matter Name (from Matter)'?: string[]; // Lookup field
    'Brief Assistant (from Matter)'?: string[]; // Lookup from Matter
    'Google Calendar Event ID'?: string;

    // Court Hearing Specific
    'Court Name'?: string;
    'Judge'?: string;
    'Room Number'?: string;
    
    // Client Meeting Specific
    'Video Conference Link'?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
  tension: number;
}

export interface RevenueChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface User {
    Name: string;
    Email: string;
    Role?: 'Admin' | 'User';
    Avatar?: AirtableAttachment[];
    Matters?: string[];
}

export interface Notification {
    Message: string;
    User: string[]; // Linked User record IDs
    Read?: boolean;
    Type?: 'New Matter' | 'Task Assigned' | 'Mention' | 'Event Reminder' | 'New Document' | 'Fee Note Due' | 'System Alert';
    Link?: string; // URL to navigate to (can be a relative path for in-app nav)
    'User Name (from User)'?: string[]; // Lookup field
}

export interface ChatAction {
    id: string;
    label: string;
    style?: 'confirm' | 'cancel';
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string | React.ReactNode;
    isTyping?: boolean;
    actions?: ChatAction[];
    actionContext?: any;
}