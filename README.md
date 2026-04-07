# SS2025_SSC_Group8 – 75 Challenge

**Hosting:** Submission is available on **Ecampus** and **Campus Cloud**.

---

## 📝 Project Description

**75 Challenge** is a dynamic fitness community platform designed to motivate users through **daily fitness challenges**, **community engagement**, and **real-time interaction**.  
Built with **Node.js**, **Express**, and **MySQL**, the platform allows users to create or join fitness communities, track daily challenge progress, and earn badges for consistent participation.

### Key Features
- JWT-based authentication & role-based access (admin/user)
- Real-time chat (global & community-based) using Socket.IO
- Badge system and challenge progress tracking
- Profile picture uploads with UUID
- Modern, responsive UI

---

## ▶️ How to Start & Test

### Option 1: Use hosted version on Ecampus or Campus Cloud

### Option 2: Run locally

```bash
npm install
node app.js
```

You can browse the **Homepage** and **Global Chat** without logging in.

After registering/logging in, you can:
- Join communities
- Chat in private community rooms
- Track daily challenges and view progress
- Earn achievement badges
- View other users' public profiles

---

## 🔑 Credentials

### Database
- `DB_USERNAME`: `ds231009`
- `DB_PASSWORD`: `Rauch1919:)`

### Test Users

| Role   | Email                 | Password |
|--------|-----------------------|----------|
| User   | ironman@avengers.com  | Tony     |
| Admin  | admin@avengers.com    | admin    |

---

## ✅ Mandatory Criteria (60 Points)

| Criteria | Status | Description |
|---------|--------|-------------|
| Users can be displayed, added, updated & deleted | ✅ | Full CRUD for users. Soft delete by users; hard delete by admins |
| Consistent, visually appealing design | ✅ | Designs created in Figma; applied consistently |
| Registration with encrypted password | ✅ | Passwords stored hashed (bcrypt) |
| JWT login/logout | ✅ | JWT used for authentication and session handling |
| Role-based access control | ✅ | Admins manage all users; users edit only their own |
| 4+ relational tables with full MVC | ✅ | Entities: Users, Communities, Challenges, Messages, Badges (+ join tables) |
| Multi-room chat | ✅ | Global and community-specific chat rooms via Socket.IO |
| No unhandled errors or blank pages | ✅ | Custom error pages and full validation |
| Project hosted on Campus Cloud | ✅ | Deployed and shared with lecturer access |

---

## ✨ Optional Criteria (50 Points)

| Criteria | Status | Description |
|---------|--------|-------------|
| User-friendly, intuitive UI | ✅ | Clear navigation and polished design |
| Well-documented code | ✅ | Comments and explanations included throughout |
| Proper error handling with 404 page | ✅ | Users get meaningful feedback on issues |
| Clean, readable, and conventionally named code | ✅ | MVP structure followed, consistent naming |
| Picture upload using UUID | ✅ | Profile pictures stored with UUIDs |
| Profile picture updates (old image deleted) | ✅ | New image replaces old, path updated in DB |
| Full name or "guest" in chat | ✅ | Guests choose a name; users use full name |
| JWT in HTTP header (not cookie) | ️ | -
| Admin-only access to user data | ✅ | Admins see all; users see public profiles |
| Soft delete for user self-deletion | ✅ | Soft deletion (`deleted = true`) for user-initiated deletion |