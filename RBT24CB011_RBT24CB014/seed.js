require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');

const recipesData = [
    // MAHARASHTRIAN RECIPES
    {
        name: "Kande Pohe",
        ingredients: ["pohe (flattened rice)", "onion", "green chilies", "peanuts", "turmeric", "mustard seeds", "curry leaves", "coriander", "lemon"],
        steps: [
            "Wash and drain pohe, keep aside.",
            "Heat oil in a pan, add mustard seeds and let them splutter.",
            "Add peanuts, curry leaves, and chopped green chilies.",
            "Add finely chopped onions and sauté until translucent.",
            "Add turmeric powder and salt, mix well.",
            "Add the soaked pohe and mix gently.",
            "Cover and cook on low heat for 2-3 minutes.",
            "Garnish with fresh coriander and a squeeze of lemon juice. Serve hot."
        ],
        category: "Veg",
        cuisine: "Maharashtrian",
        difficulty: "Easy",
        cookingTime: 20
    },
    {
        name: "Puran Poli",
        ingredients: ["chana dal (split bengal gram)", "jaggery", "cardamom powder", "nutmeg powder", "whole wheat flour", "all-purpose flour (maida)", "oil", "ghee"],
        steps: [
            "Pressure cook chana dal until soft, drain excess water.",
            "Mash the dal and cook it with jaggery until it forms a thick, sweet mixture (puran).",
            "Add cardamom and nutmeg powder to the puran and let it cool.",
            "Knead a soft dough using wheat flour, maida, oil, and water.",
            "Take a small portion of the dough, flatten it, and stuff it with a ball of puran.",
            "Seal the edges and roll it gently into a flat circle.",
            "Cook on a hot tawa (griddle) with ghee on both sides until golden brown."
        ],
        category: "Dessert",
        cuisine: "Maharashtrian",
        difficulty: "Hard",
        cookingTime: 60
    },
    {
        name: "Misal Pav",
        ingredients: ["sprouted moth beans (matki)", "onion", "tomato", "ginger-garlic paste", "misal masala", "red chili powder", "farsan (mixed namkeen)", "pav (bread rolls)", "lemon", "coriander"],
        steps: [
            "Boil the sprouted matki with turmeric and salt.",
            "Heat oil in a pot, sauté onions, ginger-garlic paste, and tomatoes until soft.",
            "Add misal masala, red chili powder, and cook until oil separates.",
            "Add the boiled matki along with the water and let it simmer into a spicy gravy (rassa).",
            "To serve, place matki in a bowl, pour the spicy rassa over it.",
            "Top generously with farsan, chopped onions, and coriander.",
            "Serve hot with fresh pav and a wedge of lemon."
        ],
        category: "Veg",
        cuisine: "Maharashtrian",
        difficulty: "Medium",
        cookingTime: 45
    },
    {
        name: "Sabudana Khichdi",
        ingredients: ["sabudana (sago pearls)", "roasted peanut powder", "potato", "green chilies", "cumin seeds", "ghee", "sugar", "salt"],
        steps: [
            "Wash sabudana and soak it overnight with just enough water to cover it.",
            "Mix the soaked sabudana with crushed roasted peanuts, sugar, and salt.",
            "Heat ghee in a pan, add cumin seeds and chopped green chilies.",
            "Add diced boiled potatoes and sauté lightly.",
            "Add the sabudana mixture and cook on low heat, stirring occasionally, until pearls turn translucent.",
            "Garnish with fresh coriander if desired and serve warm."
        ],
        category: "Veg",
        cuisine: "Maharashtrian",
        difficulty: "Medium",
        cookingTime: 25
    },
    {
        name: "Thalipeeth",
        ingredients: ["bhajani flour (mixed multigrain roasted flour)", "onion", "green chilies", "coriander", "ajwain (carom seeds)", "sesame seeds", "turmeric", "oil"],
        steps: [
            "Mix bhajani flour with finely chopped onions, chilies, coriander, ajwain, sesame seeds, turmeric, and salt.",
            "Add warm water and knead it into a dough.",
            "Take a flat pan, grease it with oil, and pat a portion of the dough directly on the pan into a flat, round shape with a hole in the center.",
            "Pour a little oil in the center hole and around the edges.",
            "Cover and roast on medium heat until crisp and brown on one side. Flip and cook the other side.",
            "Serve hot with white butter or yogurt."
        ],
        category: "Veg",
        cuisine: "Maharashtrian",
        difficulty: "Medium",
        cookingTime: 30
    },
    {
        name: "Ukadiche Modak",
        ingredients: ["rice flour", "freshly grated coconut", "jaggery", "cardamom powder", "ghee"],
        steps: [
            "Cook freshly grated coconut and jaggery together in a pan until the moisture evaporates. Add cardamom powder. This is the sweet stuffing (saran).",
            "Boil water with a pinch of salt and a tsp of ghee. Slowly add rice flour, mix well to remove lumps, cover, and steam for 5 minutes.",
            "Knead the hot dough thoroughly until smooth.",
            "Take a small ball of dough, flatten it into a cup shape using your thumbs.",
            "Place the sweet stuffing in the center and fold the edges together to form a pleated peak (modak shape).",
            "Steam the shaped modaks in a steamer for 10-12 minutes.",
            "Serve warm with a drizzle of pure ghee."
        ],
        category: "Dessert",
        cuisine: "Maharashtrian",
        difficulty: "Hard",
        cookingTime: 50
    },

    // INDIAN RECIPES
    {
        name: "Butter Chicken",
        ingredients: ["boneless chicken", "yogurt", "ginger-garlic paste", "tandoori masala", "butter", "tomato puree", "cream", "kasuri methi (dried fenugreek leaves)", "garam masala"],
        steps: [
            "Marinate chicken with yogurt, ginger-garlic paste, tandoori masala, salt, and lemon juice for 2 hours.",
            "Grill or pan-fry the marinated chicken pieces until slightly charred.",
            "In a separate pan, melt butter and sauté ginger-garlic paste until fragrant.",
            "Add tomato puree, red chili powder, and cook until it thickens.",
            "Add the cooked chicken, a splash of water, and simmer.",
            "Stir in fresh cream, garam masala, and crushed kasuri methi.",
            "Simmer for 5 minutes and serve hot with naan or rice."
        ],
        category: "Non-Veg",
        cuisine: "Indian",
        difficulty: "Medium",
        cookingTime: 60
    },
    {
        name: "Paneer Tikka",
        ingredients: ["paneer (cottage cheese)", "bell peppers", "onion", "yogurt", "besan (gram flour)", "tikka masala", "mustard oil", "lemon juice"],
        steps: [
            "Cut paneer, bell peppers, and onion into large cubes.",
            "Prepare a marinade by mixing thick yogurt, roasted besan, mustard oil, tikka masala, salt, and lemon juice.",
            "Coat the paneer and vegetables in the marinade and let it rest for 30 minutes.",
            "Thread the marinated pieces onto skewers.",
            "Grill in an oven or toast on a flat pan until nicely charred on all edges.",
            "Serve hot with mint chutney."
        ],
        category: "Veg",
        cuisine: "Indian",
        difficulty: "Easy",
        cookingTime: 40
    },
    {
        name: "Chicken Biryani",
        ingredients: ["basmati rice", "chicken (bone-in)", "onions", "tomatoes", "yogurt", "biryani masala", "whole spices (cardamom, clove, cinnamon)", "mint leaves", "coriander", "saffron milk"],
        steps: [
            "Marinate the chicken in yogurt, biryani masala, ginger-garlic paste, and half the mint/coriander leaves.",
            "Soak basmati rice for 30 minutes. Boil water with whole spices and cook rice until 70% done, then drain.",
            "Fry thinly sliced onions until golden brown and crisp (birista).",
            "In a heavy bottom pot, slightly cook the marinated chicken with some oil and a portion of fried onions.",
            "Layer the partially cooked rice evenly over the chicken.",
            "Top with remaining fried onions, fresh mint/coriander, and drizzle saffron milk over the top.",
            "Cover tightly (dum) and cook on very low heat for 20-25 minutes.",
            "Gently mix the layers before serving warm with raita."
        ],
        category: "Non-Veg",
        cuisine: "Indian",
        difficulty: "Hard",
        cookingTime: 90
    },
    {
        name: "Dal Tadka",
        ingredients: ["toor dal (pigeon pea lentils)", "moong dal (yellow lentils)", "tomato", "onion", "garlic", "cumin seeds", "dry red chilies", "turmeric", "ghee", "coriander"],
        steps: [
            "Wash and pressure cook both dals together with turmeric, salt, and water until soft and mushy.",
            "Whisk the cooked dal to a smooth consistency.",
            "For the tadka (tempering): Heat ghee in a small pan. Add cumin seeds and let them crackle.",
            "Add finely chopped garlic, chopped onions, and sauté until golden.",
            "Add dry red chilies and chopped tomatoes; cook until tomatoes break down.",
            "Pour the hot aromatic tadka over the cooked dal.",
            "Garnish with fresh coriander and serve with steamed rice or roti."
        ],
        category: "Veg",
        cuisine: "Indian",
        difficulty: "Easy",
        cookingTime: 30
    },
    {
        name: "Chole Bhature",
        ingredients: ["kabuli chana (chickpeas)", "onion", "tomato purée", "chole masala", "tea bags (for dark color)", "all-purpose flour (maida)", "yogurt", "baking powder", "oil"],
        steps: [
            "Soak chickpeas overnight. Pressure cook them with a tea bag, salt, and whole spices until soft.",
            "Prepare bhature dough: Mix maida, yogurt, a pinch of baking powder, and a little oil. Knead into a soft dough and let it rest for 2 hours.",
            "For chole: Heat oil in a pan, sauté onions until golden brown. Add ginger-garlic paste and tomato purée. Cook until oil separates.",
            "Add chole masala and the boiled chickpeas (discard the tea bag). Simmer for 15 minutes to let flavors meld.",
            "To make bhature: Pinch small balls of dough, roll them out into ovals or circles.",
            "Deep fry in hot oil until puffed and golden on both sides.",
            "Serve hot, spicy chole with inflation bhature, pickles, and onion rings."
        ],
        category: "Veg",
        cuisine: "Indian",
        difficulty: "Medium",
        cookingTime: 120
    }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Wiping existing recipes and seeding new data...');
    try {
        await Recipe.deleteMany({}); // clear existing
        const inserted = await Recipe.insertMany(recipesData);
        console.log(`Successfully seeded ${inserted.length} recipes!`);
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
