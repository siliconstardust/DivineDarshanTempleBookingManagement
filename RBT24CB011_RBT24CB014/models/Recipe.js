const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Recipe name is required'],
        trim: true
    },
    ingredients: {
        type: [String],
        required: [true, 'Ingredients are required']
    },
    steps: {
        type: [String],
        required: [true, 'Cooking steps are required']
    },
    category: {
        type: String,
        enum: ['Veg', 'Non-Veg', 'Dessert'],
        required: [true, 'Category is required']
    },
    cuisine: {
        type: String,
        enum: ['Maharashtrian', 'Indian', 'Other'],
        default: 'Other'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    cookingTime: {
        type: Number,
        default: 0
    },
    isFavorite: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', RecipeSchema);
