# Legacy Capsule - Digital Memory & PDF Time Capsule Creator

A full-stack web application for creating, customizing, and downloading fillable interactive PDF templates. Users can preserve memories, stories, and moments for their loved ones through beautifully designed digital time capsules.

## 🌟 Features

### Main Features
- **Beautiful Landing Page** with Legacy Capsule branding
- **Premium PDF Templates** - Memory letters, birthday cards, wedding memories, family recipe books, baby journals, memorial tributes, digital wills, and time capsule letters
- **Bundle Deals** - Family Legacy, Milestone, and Personal Growth bundles with discounted pricing
- **Custom PDF Requests** - Users can request personalized templates
- **Reseller Program** - Multi-tier program for selling templates with commission structure

### Advanced Functionality
- **AI Dictation Tool** - Speech-to-text integration using Web Speech API
- **File Upload System** - Support for images, audio, video, and documents
- **Interactive PDF Generation** - Using PDF-LIB for creating fillable PDFs
- **Stripe Payment Integration** - Secure checkout and payment processing
- **Shopping Cart System** - Full cart functionality with local storage persistence
- **Responsive Design** - Mobile-friendly interface with modern UI/UX

### Technical Features
- **Full-Stack Architecture** - Node.js/Express backend with MongoDB
- **File Upload Handling** - Multer for handling multimedia files
- **PDF Customization** - Dynamic PDF generation with user content
- **Payment Processing** - Stripe integration for secure transactions
- **Admin Panel** - CMS functionality for managing templates and prices

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript** - Modern vanilla web technologies
- **Responsive Design** - Mobile-first approach with CSS Grid and Flexbox
- **Web Speech API** - For AI dictation functionality
- **Stripe.js** - Client-side payment processing

### Backend
- **Node.js & Express** - Server-side runtime and web framework
- **MongoDB** - Database for storing user data and templates
- **Multer** - File upload middleware
- **PDF-LIB** - PDF generation and manipulation
- **Stripe API** - Payment processing
- **CORS** - Cross-origin resource sharing

### Key Libraries
- **pdf-lib** - PDF creation and form field generation
- **multer** - File upload handling
- **stripe** - Payment processing
- **mongodb** - Database operations
- **cors** - Cross-origin requests
- **dotenv** - Environment variable management

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Stripe account for payment processing

### 1. Clone and Install Dependencies
```bash
# Install main dependencies
npm install

# Install server dependencies
cd server
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/legacy-capsule

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Server
PORT=3001
NODE_ENV=development

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Update Stripe Configuration
In `script.js`, replace the Stripe publishable key:
```javascript
const stripe = Stripe('pk_test_your_actual_stripe_publishable_key_here');
```

### 4. Start the Application
```bash
# Start both frontend and backend
npm start

# Or start separately:
# Backend only
npm run server

# Frontend only (with Vite)
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## 📁 Project Structure

```
legacy-capsule/
├── server/
│   ├── index.js              # Express server and API routes
│   └── package.json          # Server dependencies
├── uploads/                  # File upload directory
├── index.html               # Main HTML file
├── style.css                # Styles and responsive design
├── script.js                # Frontend JavaScript and API calls
├── package.json             # Main project dependencies
├── .env.example             # Environment variables template
└── README.md                # Project documentation
```

## 🎯 API Endpoints

### Templates & Bundles
- `GET /api/templates` - Get all available templates
- `GET /api/bundles` - Get all bundle deals

### File Operations
- `POST /api/upload` - Upload files (images, audio, video, documents)
- `GET /api/download/:filename` - Download generated PDFs

### Payment & PDF Generation
- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/generate-pdf` - Generate customized PDF after payment

### Custom Requests
- `POST /api/custom-quote` - Submit custom template request
- `POST /api/reseller-signup` - Apply for reseller program

### Admin (CMS)
- `GET /api/admin/templates` - Get templates for admin panel
- `POST /api/admin/templates` - Add new template (admin only)

## 💳 Payment Integration

The application uses Stripe for secure payment processing:

1. **Checkout Flow**: Users add items to cart and proceed to checkout
2. **Stripe Session**: Backend creates a Stripe checkout session
3. **Payment Processing**: Users are redirected to Stripe's secure checkout
4. **PDF Generation**: After successful payment, PDFs are generated with user customizations
5. **Download Delivery**: Users receive download links for their customized PDFs

## 🎨 Template Categories

### Available Templates
1. **Memory Letter** ($12.99) - Personal memory sharing
2. **Birthday Memory Card** ($9.99) - Birthday celebrations
3. **Wedding Memory Book** ($24.99) - Wedding documentation
4. **Family Recipe Collection** ($15.99) - Recipe preservation
5. **Baby's First Year Journal** ($18.99) - Baby milestones
6. **Memorial Tribute** ($19.99) - Memorial services
7. **Digital Will Template** ($29.99) - Legal documentation
8. **Time Capsule Letter** ($14.99) - Future correspondence

### Bundle Deals
- **Family Legacy Bundle** - $49.99 (Save $40)
- **Milestone Bundle** - $39.99 (Save $25)
- **Personal Growth Bundle** - $34.99 (Save $20)

## 🔧 Customization Features

### PDF Customization Options
- **Text Fields** - Add personal messages and content
- **Image Upload** - Include photos and visual memories
- **Audio Integration** - Embed voice recordings and music
- **Video Support** - Add video content to PDFs
- **AI Dictation** - Speech-to-text for easy content creation
- **Form Fields** - Interactive fillable PDF elements

### File Support
- **Images**: JPG, PNG, GIF
- **Audio**: MP3, WAV, AAC
- **Video**: MP4, MOV
- **Documents**: PDF, DOC, DOCX
- **Size Limit**: 50MB per file

## 👥 Reseller Program

### Commission Structure
- **Basic Package**: Free - 30% commission
- **Pro Package**: $49/month - 40% commission + premium features
- **Partner Package**: $99/month - 50% commission + custom branding

### Benefits
- White-label branding options
- Marketing materials provided
- Instant delivery system
- Dedicated support team
- No minimum sales requirements

## 🔒 Security Features

- **Stripe Integration** - PCI-compliant payment processing
- **File Validation** - Type and size restrictions on uploads
- **CORS Protection** - Cross-origin request security
- **Input Sanitization** - Protection against malicious input
- **Secure File Storage** - Organized upload directory structure

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile-First Design** - Optimized for mobile devices
- **Tablet Support** - Adapted layouts for tablet screens
- **Desktop Experience** - Full-featured desktop interface
- **Touch-Friendly** - Optimized for touch interactions
- **Accessibility** - WCAG compliant design elements

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to:
- **Netlify** - Static site hosting
- **Vercel** - Serverless deployment
- **GitHub Pages** - Free static hosting
- **AWS S3** - Cloud storage with CloudFront

### Backend Deployment
The backend can be deployed to:
- **Heroku** - Platform as a Service
- **AWS EC2** - Virtual private servers
- **DigitalOcean** - Cloud infrastructure
- **Railway** - Modern deployment platform

### Database Options
- **MongoDB Atlas** - Cloud MongoDB service
- **Local MongoDB** - Self-hosted database
- **AWS DocumentDB** - MongoDB-compatible service

## 🔄 Future Enhancements

### Planned Features
- **User Authentication** - Account creation and login
- **Template Preview** - Interactive template previews
- **Advanced PDF Editor** - In-browser PDF editing
- **Social Sharing** - Share templates on social media
- **Template Marketplace** - User-generated templates
- **Mobile App** - Native iOS and Android apps

### Technical Improvements
- **Caching System** - Redis for improved performance
- **CDN Integration** - Faster file delivery
- **Advanced Analytics** - User behavior tracking
- **A/B Testing** - Conversion optimization
- **Automated Testing** - Unit and integration tests

## 📞 Support & Contact

For technical support or business inquiries:
- **Email**: support@legacycapsule.com
- **Phone**: (555) 123-4567
- **Documentation**: Available in the `/docs` directory
- **Issues**: Report bugs via GitHub Issues

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Legacy Capsule** - Preserving moments that matter through beautifully designed PDF templates. 💝