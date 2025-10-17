
# Project Blueprint

## Overview

This project is a Next.js application with Firebase integration. It is designed to be a platform for healthcare providers, including doctors and ASHA workers, to manage patient information and updates. It includes offline support to ensure data can be captured even with intermittent internet connectivity.

## Implemented Features

### Styling and Theme
- **Modern UI:** A visually appealing and intuitive user interface with a modern design aesthetic.
- **Color Palette:** A professional and clean color palette is used throughout the application, with gradients and soft shadows to create a sense of depth.
- **Typography:** Clear and readable fonts are used for a better user experience.
- **Iconography:** The application uses `react-icons` to provide intuitive visual cues and enhance user interaction.
- **Responsive Design:** The application is designed to be mobile-friendly.

### Authentication
- **Role-Based Access:** The application supports two user roles: "Doctor" and "ASHA Worker".
- **Registration Page (`/register`):**
    - A form for users to register by providing their name, email, and password.
    - Users must select their role (Doctor or ASHA Worker).
    - User data is saved to the corresponding collection (`doctors` or `ASHA_workers`) in Firebase Realtime Database.
- **Login Page (`/login`):**
    - A form for users to log in with their email, password, and role.
    - The system authenticates the user and checks if they are registered under the selected role.
    - Upon successful login, users are redirected to their respective dashboards.

### Doctor Features
- **Doctor Dashboard (`/doctor-dashboard`):**
    - A dedicated dashboard for doctors.

### ASHA Worker Features
- **ASHA Worker Dashboard (`/asha-worker-dashboard`):**
    - **Modern & Interactive Navbar:** A clean, modern navbar with a "SehatSathi" title featuring a gradient text effect. It includes a welcome message with the user's name, and interactive "Add Patient" and "Logout" buttons with icons and hover effects.
    - **Visually Appealing Dashboard:** The dashboard features a clean, card-based layout on a light background. Patient update cards have a "lifted" feel with soft shadows and a hover effect for interactivity.
    - **Informative Patient Cards:** Each card displays the patient's name, the assigned doctor's name, and the status of the update, with icons for each piece of information to improve scannability.
    - **"View Details" Button:** A styled button on each card for future implementation of a details view.
- **Add Patient Page (`/add-patient`):**
    - **Modern & Intuitive Form:** A visually appealing form with a centered, card-style layout that enhances focus and usability.
    - **Consistent Navigation:** Includes the `AshaNavbar` for a consistent user experience across the ASHA worker section of the application.
    - **Enhanced Form Fields:** All form fields are styled with a modern aesthetic and include icons (`FaUser`, `FaUserMd`, etc.) to visually guide the user, improving clarity and data entry speed.
    - **Interactive File Upload:** A user-friendly, dashed-border file upload area that displays the selected file's name and a clear upload icon.
    - **Styled Submit Button:** A prominent "Add Patient" button with the application's signature gradient and interactive hover effects.
- **Offline Support (`IndexedDB` with `dexie.js`):**
    - Implemented offline storage for the "Add Patient" form.
    - Uses `dexie.js` to manage a local `IndexedDB` database (`sehatsathi`).
    - When an ASHA worker submits the form, the patient data (including the prescription photo as a base64 string) is first saved to a local `asha_updates` table.
    - A background `SyncService` automatically detects when the user is online and syncs the locally stored data to the Firebase Realtime Database. 
    - After a successful sync, the data is removed from the local database.

## Current Plan

- **ASHA Update Details Page:**
    - Create a dynamic route `pages/asha-updates/[id].js` to display the full details of a specific ASHA update, including the prescription photo (rendered from the base64 string), when a "View Details" button is clicked on the dashboard.
- **Doctor Dashboard Enhancements:**
    - A clean **navbar** with icons and options: Dashboard, Appointments, My Patients, Analytics, Open Kiosk Interface, and a user profile dropdown.
    - Show overview cards at the top for:
        - Total Patients
        - Today’s Appointments
        - Completed Appointments
        - Completion Rate
    - Include a **“Today’s Schedule”** section showing upcoming appointments.
    - A **“Critical Alerts”** panel with patient name, issue, and “Review” button.
    - A **“Recent Patients”** table.
- **Patient Management (for Doctors):**
    - An “Add New Patient” button.
    - A search bar to find patients.
    - Display patient information in a grid of cards.
