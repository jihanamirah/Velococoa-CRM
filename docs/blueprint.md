# **App Name**: VeloCocoa CRM

## Core Features:

- Odoo 18 XML-RPC Sync: Seamlessly sync Qualified leads to the Odoo ERP (ptrfserp.com) database as CRM Opportunities, managing authentication and status updates for 'Won' and 'Lost' records.
- Visual Kanban Pipeline: A dynamic board to manage the sales funnel stages (New, Contacted, Qualified, Won/Lost) using drag-and-drop cards to visualize PT VeloCocoa's lead movement.
- AI Lead Priority Tool: A feature that uses reasoning as a tool to analyze incoming lead notes and segment business types (Cafe, Bakery, Corporate) to determine follow-up urgency.
- Automated Lead Capture: A dedicated Firestore webhook to instantly capture partner registrations from the VeloCocoa website and route them to the specific business category.
- Metric Tracking Dashboard: A summary view showing real-time counters for new leads, monthly closures, and visual graphs for pipeline velocity.
- Real-time Alerting System: Push notifications triggered via Firebase when a lead has been stale for over 24 hours or requires an urgent follow-up decision.
- Interactive History Timeline: A dedicated view for each lead that logs a complete audit trail of status changes, internal notes, and team interactions.

## Style Guidelines:

- Primary color: A sophisticated rich chocolate brown (#C17B3A) representing PT VeloCocoa's premium artisanal identity.
- Background: A deep, moody Espresso Black (#1F140F) to provide a high-end dark mode aesthetic that makes leads and statuses pop.
- Accent: A contrasting Earthy Terracotta (#D65A31) for Call-to-Actions and sync indicators, roughly 30 degrees from the primary hue.
- Primary font: 'Poppins', a geometric sans-serif that lends a contemporary, high-fashion editorial look to the lead records.
- A structured layout with high-contrast borders and card radius of 12px, mirroring professional executive dashboard systems.
- Fluid transitions for status changes and subtle pulse effects on overdue lead cards.
- Elegant thin-line icons for business categories (Café, Bakery, Hotel) with custom status color coding: blue (info), amber (warning), green (success), red (lost).