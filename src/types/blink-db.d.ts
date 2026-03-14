// Type augmentation for Blink DB dynamic tables
// The Blink SDK uses a Proxy so any property access works at runtime.
// These declarations suppress TypeScript errors.

import '@blinkdotnew/sdk';

declare module '@blinkdotnew/sdk' {
  interface BlinkDatabase {
    // Core
    companies: any;
    userRoles: any;
    organizations: any;
    memberships: any;
    invitations: any;
    auditLogs: any;
    notifications: any;
    systemNotifications: any;

    // CRM
    clients: any;
    contacts: any;
    leads: any;
    activities: any;
    tasks: any;
    notes: any;

    // Invoicing
    invoices: any;
    quotes: any;
    creditNotes: any;

    // Accounting
    expenses: any;
    tvaRates: any;
    accountingEntries: any;
    bankAccounts: any;
    bankTransactions: any;
    transactions: any;

    // E-commerce
    products: any;
    productCategories: any;
    orders: any;
    stores: any;
    storeCustomers: any;
    discounts: any;

    // CMS
    pages: any;
    mediaAssets: any;
    mediaFolders: any;

    // Marketing & Social
    campaigns: any;
    audienceSegments: any;
    socialAccounts: any;
    socialPosts: any;

    // Automation
    workflows: any;
    workflowRuns: any;

    // Delivery & B2B
    deliveries: any;
    sharedOrders: any;
    companyConnections: any;
    publicBusinessListing: any;
    companyDocuments: any;

    // Team
    teamMembers: any;

    // Billing
    subscriptions: any;

    // Index signature for any other tables
    [key: string]: any;
  }
}
