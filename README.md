Drone Asset & Project Management System – Backend

## 📌 Overview

The **Backend Service** powers the Drone Asset & Project Management System.
It is responsible for managing projects, drones, parts inventory, assignments, stock levels, and maintaining a complete **audit log of every event** performed in the system.

Built using **Node.js, TypeScript, and PostgreSQL**, this backend follows a scalable and modular REST API architecture.

---

## ✨ Core Features

### 📁 Project & Team Management

* Create and manage projects
* Assign members to projects
* Link drones and parts to projects

### 🚁 Drone Management

* CRUD operations for drones
* Associate drones with projects
* Track drone allocation

### 🔩 Parts & Inventory Management

* Category-based parts management
* Add, update, and delete parts
* Track:

  * Total quantity
  * Used quantity
  * Available stock
* Low-stock and out-of-stock detection
* Store invoice and purchase details for parts

### 👥 Assignment Tracking

* Assign parts to members
* Track which member is using which part
* Maintain usage history

### 🧾 Logs & Audit System

* Automatically logs **every important action**, including:

  * Inventory changes
  * Assignments
  * Updates and deletions
* Filter logs by:

  * Event type
  * Date range
  * Project
  * User or member

---

## 🛠 Tech Stack

* Runtime: Node.js
* Language: TypeScript
* Framework: Express.js
* Database: PostgreSQL
* ORM / DB Tool: Prisma
* Environment Config: dotenv
* API Style: REST

---

## 📡 API Modules

* `/projects`
* `/parts`
* `/categories`
* `/activities`
* `/templates`
* `/users`
* `/products`
* `/auth`

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/drone_management
```

---

## 🗄 Database Setup

1. Create PostgreSQL database
2. Update `DATABASE_URL`
3. Run migrations

```bash
npm run migrate
npx prisma generate

```

---

## ▶️ Run Locally

```bash
npm install
npm run dev
```

Server runs at:

```
http://localhost:5000
```

---

## 📂 Project Structure

```
src/
 ├── controllers/
 ├── middleware/
 ├── routes/
 ├── services/
 ├── utils/
 └── server.ts
```

---

## 🔐 Notes

* CORS enabled for frontend integration
* Logging middleware ensures full audit tracking
* Designed for scalability and future auth integration

---

## 📄 License

This project is intended for learning, internal tools, and portfolio use.

---
