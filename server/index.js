const express = require('express');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

// MongoDB connection
let db;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/legacy-capsule';

MongoClient.connect(MONGODB_URI)
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db('legacy-capsule');
    })
    .catch(error => console.error('MongoDB connection error:', error));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = `uploads/${req.body.userId || 'temp'}`;
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|mp4|mov|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Template data
const templates = [
    {
        id: 'memory-letter',
        name: 'Memory Letter',
        price: 12.99,
        description: 'A heartfelt letter template to share memories and thoughts with loved ones.',
        category: 'personal',
        fields: ['title', 'message', 'images', 'audio', 'signature']
    },
    {
        id: 'birthday-card',
        name: 'Birthday Memory Card',
        price: 9.99,
        description: 'Celebrate special birthdays with a personalized memory card.',
        category: 'celebration',
        fields: ['name', 'age', 'message', 'images', 'wishes']
    },
    {
        id: 'wedding-memory',
        name: 'Wedding Memory Book',
        price: 24.99,
        description: 'Capture the magic of your wedding day with this elegant template.',
        category: 'celebration',
        fields: ['couple_names', 'date', 'venue', 'story', 'images', 'vows']
    },
    {
        id: 'family-recipe',
        name: 'Family Recipe Collection',
        price: 15.99,
        description: 'Preserve family recipes and cooking traditions for future generations.',
        category: 'family',
        fields: ['recipe_name', 'ingredients', 'instructions', 'story', 'images']
    },
    {
        id: 'baby-journal',
        name: 'Baby\'s First Year Journal',
        price: 18.99,
        description: 'Document every precious moment of your baby\'s first year.',
        category: 'family',
        fields: ['baby_name', 'birth_date', 'milestones', 'images', 'audio', 'growth_chart']
    },
    {
        id: 'memorial-tribute',
        name: 'Memorial Tribute',
        price: 19.99,
        description: 'Honor and remember loved ones with a beautiful memorial tribute.',
        category: 'memorial',
        fields: ['name', 'dates', 'biography', 'memories', 'images', 'tributes']
    },
    {
        id: 'will-template',
        name: 'Digital Will Template',
        price: 29.99,
        description: 'A comprehensive digital will template for important documents.',
        category: 'legal',
        fields: ['testator_name', 'beneficiaries', 'assets', 'wishes', 'signature']
    },
    {
        id: 'time-capsule',
        name: 'Time Capsule Letter',
        price: 14.99,
        description: 'Write a letter to your future self or loved ones.',
        category: 'personal',
        fields: ['recipient', 'open_date', 'message', 'predictions', 'images', 'audio']
    }
];

const bundles = [
    {
        id: 'family-legacy',
        name: 'Family Legacy Bundle',
        originalPrice: 89.99,
        salePrice: 49.99,
        templates: ['memory-letter', 'family-recipe', 'baby-journal', 'memorial-tribute'],
        description: 'Complete family memory preservation package'
    },
    {
        id: 'milestone',
        name: 'Milestone Bundle',
        originalPrice: 64.99,
        salePrice: 39.99,
        templates: ['birthday-card', 'wedding-memory', 'baby-journal'],
        description: 'Perfect for life\'s special moments'
    },
    {
        id: 'personal-growth',
        name: 'Personal Growth Bundle',
        originalPrice: 54.99,
        salePrice: 34.99,
        templates: ['memory-letter', 'time-capsule', 'will-template'],
        description: 'Document your personal journey'
    }
];

// API Routes

// Get all templates
app.get('/api/templates', (req, res) => {
    res.json(templates);
});

// Get all bundles
app.get('/api/bundles', (req, res) => {
    res.json(bundles);
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), (req, res) => {
    try {
        const files = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path
        }));
        
        res.json({ success: true, files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { items, customization } = req.body;
        
        const line_items = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    description: item.description,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/cancel`,
            metadata: {
                customization: JSON.stringify(customization)
            }
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate PDF after successful payment
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { templateId, customization, sessionId } = req.body;
        
        // Verify payment session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Payment not completed' });
        }

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Letter size
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Add content based on template and customization
        const template = templates.find(t => t.id === templateId);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Title
        page.drawText(template.name, {
            x: 50,
            y: 750,
            size: 24,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2)
        });

        // Add customized content
        let yPosition = 700;
        
        if (customization.title) {
            page.drawText(customization.title, {
                x: 50,
                y: yPosition,
                size: 18,
                font: boldFont,
                color: rgb(0.3, 0.3, 0.3)
            });
            yPosition -= 40;
        }

        if (customization.message) {
            const lines = customization.message.split('\n');
            lines.forEach(line => {
                if (yPosition > 50) {
                    page.drawText(line, {
                        x: 50,
                        y: yPosition,
                        size: 12,
                        font: font,
                        color: rgb(0.2, 0.2, 0.2)
                    });
                    yPosition -= 20;
                }
            });
        }

        // Add form fields for interactivity
        const form = pdfDoc.getForm();
        
        if (template.fields.includes('signature')) {
            const signatureField = form.createTextField('signature');
            signatureField.addToPage(page, {
                x: 50,
                y: yPosition - 30,
                width: 200,
                height: 20,
                borderColor: rgb(0.5, 0.5, 0.5),
                backgroundColor: rgb(0.95, 0.95, 0.95)
            });
        }

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const filename = `${templateId}-${Date.now()}.pdf`;
        const filepath = path.join('uploads', filename);
        
        fs.writeFileSync(filepath, pdfBytes);

        // Store in database
        if (db) {
            await db.collection('generated_pdfs').insertOne({
                sessionId,
                templateId,
                filename,
                filepath,
                customization,
                createdAt: new Date()
            });
        }

        res.json({ 
            success: true, 
            downloadUrl: `/api/download/${filename}`,
            filename 
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download generated PDF
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join('uploads', filename);
    
    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Custom quote request
app.post('/api/custom-quote', async (req, res) => {
    try {
        const { name, email, templateType, notes, files } = req.body;
        
        if (db) {
            await db.collection('custom_quotes').insertOne({
                name,
                email,
                templateType,
                notes,
                files: files || [],
                status: 'pending',
                createdAt: new Date()
            });
        }

        res.json({ success: true, message: 'Quote request submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reseller program signup
app.post('/api/reseller-signup', async (req, res) => {
    try {
        const { name, email, package, experience } = req.body;
        
        if (db) {
            await db.collection('reseller_applications').insertOne({
                name,
                email,
                package,
                experience,
                status: 'pending',
                createdAt: new Date()
            });
        }

        res.json({ success: true, message: 'Reseller application submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin routes (basic CMS functionality)
app.get('/api/admin/templates', (req, res) => {
    // In a real app, add authentication middleware
    res.json(templates);
});

app.post('/api/admin/templates', (req, res) => {
    // In a real app, add authentication middleware
    const newTemplate = req.body;
    newTemplate.id = newTemplate.name.toLowerCase().replace(/\s+/g, '-');
    templates.push(newTemplate);
    res.json({ success: true, template: newTemplate });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;