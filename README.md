# AgriGo - Farm Fresh Products Platform

AgriGo is a web-based platform that connects farmers directly with consumers, providing fresh, organic produce at fair prices.

## Features

- **User Authentication**

  - Farmer registration and login
  - Consumer registration and login
  - Secure password handling

- **Farmer Dashboard**

  - Product management (add, edit, delete)

- **Consumer Features**

  - Browse products
  - Place orders
  - Track deliveries
  - View order history

- **Product Management**
  - Add new products
  - Update product details

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Font Awesome

### Backend

- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Project Structure

```
AgriGo/
├── Frontend/
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   └── farmer-dashboard.html
└── Backend/
    ├── models/
    ├── routes/
    ├── middleware/
    ├── config/
    └── index.js
```

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/AgriGo.git
   cd AgriGo
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   cd Backend
   npm install

   # Install frontend dependencies (if any)
   cd ../Frontend
   npm install
   ```

3. **Configure environment variables**

   - Create a `.env` file in the Backend directory
   - Add the following variables:
     ```
     PORT=3000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     ```

4. **Start the development servers**

   ```bash
   # Start backend server
   cd Backend
   npm start

   # Start frontend server (if using a development server)
   cd Frontend
   npm start
   ```

5. **Access the application**
   - Frontend: [https://agrigo-frontend.vercel.app/](https://agrigo-frontend.vercel.app/)
   - Backend API: [https://agrigo-backend.onrender.com](https://agrigo-backend.onrender.com)

## API Endpoints

### Authentication

- POST /auth/user/register - Register a new user
- POST /auth/user/login - User login
- POST /auth/farmer/register - Register a new farmer
- POST /auth/farmer/login - Farmer login

### Products

- GET /products - Get all products
- GET /products/farmer/products - Get farmer's products
- POST /products - Create new product
- PUT /products/:id - Update product
- DELETE /products/:id - Delete product

### Orders

- GET /orders - Get all orders
- GET /orders/farmer - Get farmer's orders
- POST /orders - Create new order
- PUT /orders/:id - Update order status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
