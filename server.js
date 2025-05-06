require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const Image = require('./models/Image'); // Modèle Mongoose

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connexion MongoDB réussie'))
  .catch((err) => console.error('❌ Erreur MongoDB :', err));

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Accès public aux fichiers

// Configuration de Multer (stockage + filtrage type MIME)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers .jpg, .jpeg et .png sont autorisés.'));
  }
};

const upload = multer({ storage, fileFilter });

// Route POST /upload — Envoi d'une image
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;

    // Vérification des champs
    if (!title || !description || !req.file) {
      return res.status(400).json({ error: 'Titre, description et image sont requis.' });
    }

    const image = new Image({
      title,
      description,
      filename: req.file.filename,
    });

    await image.save();
    res.status(200).json({ message: '✅ Image enregistrée avec succès' });

  } catch (error) {
    console.error('Erreur POST /upload :', error);
    res.status(500).json({ error: '❌ Erreur lors de l\'enregistrement de l\'image' });
  }
});

// Route GET /images — Liste toutes les images
app.get('/images', async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 }); // Tri décroissant
    res.status(200).json(images);
  } catch (error) {
    console.error('Erreur GET /images :', error);
    res.status(500).json({ error: '❌ Erreur lors de la récupération des images' });
  }
});

// Route GET /image/:id — Récupère une image spécifique par ID
app.get('/image/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }
    res.sendFile(path.resolve(__dirname, 'uploads', image.filename));
  } catch (error) {
    console.error('Erreur GET /image/:id :', error);
    res.status(500).json({ error: '❌ Erreur lors de la récupération de l\'image' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 API opérationnelle sur http://localhost:${PORT}`);
});
