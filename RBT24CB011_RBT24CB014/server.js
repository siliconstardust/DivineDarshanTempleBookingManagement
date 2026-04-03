require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const Recipe = require('./models/Recipe');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// --- API ROUTES ---

// GET /api/recipes - Fetch all recipes
// Supports optional query parameters: search, category, favorites
app.get('/api/recipes', async (req, res) => {
    try {
        let query = {};

        // Search by name (case-insensitive)
        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' };
        }

        // Filter by category
        if (req.query.category && req.query.category !== 'All') {
            query.category = req.query.category;
        }

        // Filter by favorites only
        if (req.query.favorites === 'true') {
            query.isFavorite = true;
        }

        const recipes = await Recipe.find(query).sort({ createdAt: -1 });
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// POST /api/recipes - Create a new recipe
app.post('/api/recipes', async (req, res) => {
    try {
        const recipe = new Recipe(req.body);
        const savedRecipe = await recipe.save();
        res.status(201).json(savedRecipe);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create recipe. Please check your inputs.', details: err.message });
    }
});

// PUT /api/recipes/:id - Update an existing recipe
app.put('/api/recipes/:id', async (req, res) => {
    try {
        const updatedRecipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedRecipe) return res.status(404).json({ error: 'Recipe not found' });
        res.json(updatedRecipe);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update recipe', details: err.message });
    }
});

// PATCH /api/recipes/:id/favorite - Toggle favorite status
app.patch('/api/recipes/:id/favorite', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

        recipe.isFavorite = !recipe.isFavorite;
        await recipe.save();

        res.json(recipe);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update favorite status', details: err.message });
    }
});

// DELETE /api/recipes/:id - Delete a recipe
app.delete('/api/recipes/:id', async (req, res) => {
    try {
        const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!deletedRecipe) return res.status(404).json({ error: 'Recipe not found' });
        res.json({ message: 'Recipe deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete recipe', details: err.message });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
