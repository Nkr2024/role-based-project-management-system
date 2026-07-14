# Role-Based Project Management System

A full-stack MERN project management application with authentication, role-based authorization, project assignment, task tracking, request management, and activity logging.

## Features

- User registration and login
- JWT-based authentication
- Role-based access control
- Admin, Manager, and Employee roles
- User activation and deactivation
- User role management
- Create and manage projects
- Assign members to projects
- Create and manage tasks
- Update task status
- Role-based project and task permissions
- Request management
- Activity logs
- Protected frontend routes
- Responsive React interface

## User Roles

### Admin

- View all users
- Change user roles
- Activate or deactivate user accounts
- View all projects
- View system activities

### Manager

- Create projects
- Add or remove project members
- Create and assign tasks
- Update project and task information
- Manage projects assigned to them

### Employee

- View assigned projects
- View assigned tasks
- Update the status of assigned tasks
- Submit requests

## Tech Stack

### Frontend

- React
- React Router
- JavaScript
- CSS
- Vite

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token
- bcrypt

## Project Structure

```text
Project_Mangement/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
└── README.md