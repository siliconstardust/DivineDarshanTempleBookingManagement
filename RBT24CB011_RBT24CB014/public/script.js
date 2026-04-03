// State variables
let currentCategory = 'All';
let isFavoritesOnly = false;
let searchQuery = '';

// DOM Elements
const recipeGrid = document.getElementById('recipeGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const favoriteToggle = document.getElementById('favoriteToggle');
const addRecipeBtn = document.getElementById('addRecipeBtn');
const recipeModal = document.getElementById('recipeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const recipeForm = document.getElementById('recipeForm');
const modalTitle = document.getElementById('modalTitle');
const toast = document.getElementById('toast');

// API Base URL
const API_URL = '/api/recipes';

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', fetchRecipes);
addRecipeBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
recipeForm.addEventListener('submit', handleFormSubmit);
searchInput.addEventListener('input', debounce((e) => {
    searchQuery = e.target.value;
    fetchRecipes();
}, 500));
favoriteToggle.addEventListener('change', (e) => {
    isFavoritesOnly = e.target.checked;
    fetchRecipes();
});

// Category filtering
categoryFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        // Update active class
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        currentCategory = e.target.dataset.category;
        fetchRecipes();
    }
});

// Fetch Recipes from API
async function fetchRecipes() {
    try {
        let url = `${API_URL}?`;
        if (searchQuery) url += `search=${searchQuery}&`;
        if (currentCategory !== 'All') url += `category=${currentCategory}&`;
        if (isFavoritesOnly) url += `favorites=true`;

        const response = await fetch(url);
        const recipes = await response.json();

        renderRecipes(recipes);
    } catch (error) {
        showToast('Error loading recipes', 'error');
        console.error('Fetch error:', error);
    }
}

// Render Recipes to Grid
function renderRecipes(recipes) {
    if (recipes.length === 0) {
        recipeGrid.innerHTML = `
            <div class="loading">
                <ion-icon name="restaurant-outline" style="font-size: 3rem; color: #ccc"></ion-icon>
                <p>No recipes found. Try adding a new one or adjusting filters!</p>
            </div>`;
        return;
    }

    recipeGrid.innerHTML = '';

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';

        const badgeClass = recipe.category.toLowerCase().replace('-', '');
        const favIconClass = recipe.isFavorite ? 'is-favorite' : '';
        const favIconName = recipe.isFavorite ? 'heart' : 'heart-outline';

        // Format lists
        const ingredientsList = recipe.ingredients.map(ing => `<li>${ing}</li>`).join('');
        const stepsList = recipe.steps.map(step => `<li>${step}</li>`).join('');

        card.innerHTML = `
            <div class="card-header">
                <span class="badge ${badgeClass}">${recipe.category}</span>
                <button class="fav-btn ${favIconClass}" onclick="toggleFavorite('${recipe._id}')">
                    <ion-icon name="${favIconName}"></ion-icon>
                </button>
            </div>
            
            <h3 class="recipe-title">${recipe.name}</h3>
            
            <div class="recipe-meta">
                <ion-icon name="time-outline"></ion-icon> 
                ${recipe.cookingTime > 0 ? recipe.cookingTime + ' mins' : 'N/A'}
                &nbsp; | &nbsp;
                <ion-icon name="earth-outline"></ion-icon> ${recipe.cuisine || 'Other'}
                &nbsp; | &nbsp;
                <ion-icon name="speedometer-outline"></ion-icon> ${recipe.difficulty || 'Medium'}
            </div>

            <button class="accordion-btn" onclick="toggleDetails(this)">
                View Recipe <ion-icon name="chevron-down-outline"></ion-icon>
            </button>
            <div class="accordion-content">
                <div class="accordion-inner">
                    <strong>Ingredients:</strong>
                    <ul>${ingredientsList}</ul>
                    <strong>Steps:</strong>
                    <ol>${stepsList}</ol>
                </div>
            </div>

            <div class="card-actions">
                <button class="edit-btn" onclick="editRecipe('${recipe._id}')">
                    <ion-icon name="pencil-outline"></ion-icon> Edit
                </button>
                <button class="delete-btn" onclick="deleteRecipe('${recipe._id}')">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
        `;

        recipeGrid.appendChild(card);
    });
}

// UI Interaction helpers
function toggleDetails(btn) {
    const content = btn.nextElementSibling;
    const iconWrapper = btn.querySelector('ion-icon');

    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        content.style.maxHeight = null;
        iconWrapper.name = "chevron-down-outline";
    } else {
        // Expand
        content.classList.add('expanded');
        content.style.maxHeight = content.scrollHeight + "px";
        iconWrapper.name = "chevron-up-outline";
    }
}

// CRUD Operations

// Toggle Favorite
async function toggleFavorite(id) {
    try {
        const response = await fetch(`${API_URL}/${id}/favorite`, { method: 'PATCH' });
        if (response.ok) {
            fetchRecipes(); // refresh list to reflect change
        } else {
            showToast('Failed to update favorite', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
}

// Delete Recipe
async function deleteRecipe(id) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Recipe deleted successfully', 'success');
            fetchRecipes();
        } else {
            showToast('Failed to delete', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
}

// Edit Recipe Flow
async function editRecipe(id) {
    // We could either fetch details or just fetch the whole list item's data.
    // For simplicity, let's fetch from the API again to ensure fresh data
    try {
        // Find from local DOM if we could, but let's query the specific ID from search params
        // Hacky way: since our API returns all, we can just find it in the current fetch response by mapping globally
        const resp = await fetch(`${API_URL}`);
        const data = await resp.json();
        const recipe = data.find(r => r._id === id);

        if (recipe) {
            openModal(recipe);
        }
    } catch (err) {
        showToast('Failed to load recipe data', 'error');
    }
}

// Form Submission (Add or Update)
async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('recipeId').value;
    const isEdit = !!id;

    // Parse arrays correctly
    const ingredients = document.getElementById('recipeIngredients').value.split('\n').filter(i => i.trim() !== '');
    const steps = document.getElementById('recipeSteps').value.split('\n').filter(s => s.trim() !== '');

    const recipeData = {
        name: document.getElementById('recipeName').value,
        category: document.getElementById('recipeCategory').value,
        cuisine: document.getElementById('recipeCuisine').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        cookingTime: document.getElementById('cookingTime').value || 0,
        ingredients: ingredients,
        steps: steps
    };

    try {
        const url = isEdit ? `${API_URL}/${id}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeData)
        });

        if (response.ok) {
            showToast(isEdit ? 'Recipe updated!' : 'Recipe added!', 'success');
            closeModal();
            fetchRecipes();
        } else {
            const err = await response.json();
            showToast(err.error || 'Operation failed', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

// Modal management
function openModal(recipe = null) {
    if (recipe) {
        modalTitle.textContent = 'Edit Recipe';
        document.getElementById('recipeId').value = recipe._id;
        document.getElementById('recipeName').value = recipe.name;
        document.getElementById('recipeCategory').value = recipe.category;
        document.getElementById('recipeCuisine').value = recipe.cuisine || 'Other';
        document.getElementById('recipeDifficulty').value = recipe.difficulty || 'Medium';
        document.getElementById('cookingTime').value = recipe.cookingTime;
        document.getElementById('recipeIngredients').value = recipe.ingredients.join('\n');
        document.getElementById('recipeSteps').value = recipe.steps.join('\n');
    } else {
        modalTitle.textContent = 'Add New Recipe';
        recipeForm.reset();
        document.getElementById('recipeId').value = '';
    }

    recipeModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // prevent scrolling
}

function closeModal() {
    recipeModal.classList.remove('show');
    recipeForm.reset();
    document.body.style.overflow = 'auto';
}

// Toast notification
function showToast(message, type) {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility: Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


