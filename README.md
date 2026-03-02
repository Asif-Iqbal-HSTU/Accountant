# Accountant & Client System

This is a complete system with a Laravel Web App (for Accountants) and an Expo Mobile App (for Clients).

## Prerequisites
- PHP 8.2+
- Composer
- Node.js & npm
- MySQL

## Setup & Run

### 0. Secrets Management (SOPS & Age)
This project uses **Mozilla SOPS** and **Age** to safely commit encrypted `.env` files to the repository.

**Prerequisites:**
You must have [sops](https://github.com/getsops/sops) and [age](https://github.com/FiloSottile/age) installed on your system.
You also need the project's Age private key (`key.txt`).

**Setup Your Key:**
Place the project's private `key.txt` in a secure location (e.g., `~/.sops/key.txt`).
Add the following to your `~/.bashrc` or `~/.zshrc`:
```bash
export SOPS_AGE_KEY_FILE=~/.sops/key.txt
```

**Common Commands:**
- **Edit Secrets:** Avoid editing the encrypted `.env` directly with `nano` or VS Code. Instead, use:
  ```bash
  sops web/.env
  ```
  This will open the decrypted file in your default terminal editor, allow you to make changes, and re-encrypt it automatically upon saving.
- **Manual Decryption** (e.g., for CI/CD):
  ```bash
  sops --decrypt web/.env.enc > web/.env
  ```
- **Manual Encryption** (e.g., if you created a new `.env.local`):
  ```bash
  sops --encrypt --in-place web/.env.local
  ```

*Note: Ensure you never commit your `key.txt` or plaintext `.env` files. The `.gitignore` is already configured to protect these.*

### 1. Database
The MySQL database `acc` has been created.
Credentials used:
- Host: `127.0.0.1`
- Port: `3306`
- Username: `root`
- Password: (empty)

### 2. Web App (Back Office / API)
The web application is built with Laravel 11.

**Run the server:**
```bash
cd web
php artisan serve
```
Access at: http://localhost:8000

**Features:**
- Register/Login (User will be assigned 'Accountant' role).
- Dashboard: View list of Clients.
- Chat: Select a client and chat in real-time.

### 3. Mobile App (Client)
The mobile application is built with Expo (React Native).

**Run the app:**
```bash
cd mobile
npx expo start
```
- Press `a` for Android Emulator.
- Press `w` for Web (might need CORS config).
- Scan QR code with Expo Go on your phone.

**Features:**
- Register/Login (User will be assigned 'Client' role).
- Home: View list of Accountants having 'Accountant' role.
- Chat: Select an accountant and chat.

## Testing the Flow
1. **Web**: Register a new user (e.g., Accountant A).
2. **Mobile**: Register a new user (e.g., Client B).
3. **Web**: You should see Client B in the Dashboard list.
4. **Mobile**: You should see Accountant A in the Home list.
5. **Chat**: Send a message from Mobile to Accountant A. Refresh Web dashboard (or wait for poll) to see the message. Reply from Web.

## Notes
- The mobile app API URL is set to `http://10.0.2.2:8000/api` for Android Emulator. Change it in `mobile/services/api.ts` if using a physical device (use your PC's IP address) or iOS Simulator (`http://localhost:8000/api`).
