let debounceTimeout;
let deleteCarId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile menu
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('animate-slide-in');
        });
    }

    // Initialize page-specific functionality
    updateCartCount();
    if (document.getElementById('car-grid')) {
        fetchCars();
        document.getElementById('search-bar').addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(filterCars, 300);
        });
    }
    if (document.getElementById('add-car-form')) {
        document.getElementById('add-car-form').addEventListener('submit', addCar);
    }
    if (document.getElementById('all-cars-list')) {
        fetchAllCars();
    }
    if (document.getElementById('cart-items')) {
        fetchCart();
    }
    if (document.getElementById('edit-car-form')) {
        document.getElementById('edit-car-form').addEventListener('submit', updateCar);
    }
});

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    toastIcon.innerHTML = type === 'success' ? 
        '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : 
        '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    toastMessage.textContent = message;
    toast.className = `fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl ${type === 'success' ? 'success' : 'error'} animate-slide-in flex items-center`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 6000);
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const skeleton = document.getElementById('skeleton');
    const carGrid = document.getElementById('car-grid');
    const allCarsList = document.getElementById('all-cars-list');
    if (loading && skeleton) {
        loading.classList.toggle('hidden', !show);
        skeleton.classList.toggle('hidden', !show);
        if (carGrid) carGrid.classList.toggle('hidden', show);
        if (allCarsList) allCarsList.classList.toggle('hidden', show);
    }
}

async function updateCartCount() {
    try {
        const response = await fetch('/api/cart');
        if (!response.ok) throw new Error('Failed to fetch cart');
        const cart = await response.json();
        const cartCount = document.querySelectorAll('#cart-count, #cart-count-mobile');
        cartCount.forEach(el => el.textContent = cart.length);
    } catch (error) {
        showToast('Error fetching cart count', 'error');
    }
}

async function fetchCars() {
    try {
        showLoading(true);
        const response = await fetch('/api/cars');
        if (!response.ok) throw new Error('Failed to fetch cars');
        const cars = await response.json();
        displayCars(cars);
    } catch (error) {
        showToast('Error fetching cars', 'error');
    } finally {
        showLoading(false);
    }
}

function displayCars(carsToDisplay) {
    const carGrid = document.getElementById('car-grid');
    if (!carGrid) return;
    carGrid.innerHTML = '';
    if (carsToDisplay.length === 0) {
        carGrid.innerHTML = '<p class="text-gray-600 text-center col-span-full text-lg">No cars found.</p>';
        return;
    }
    carsToDisplay.forEach(car => {
        const carCard = document.createElement('div');
        carCard.className = 'car-card bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-md animate-fade-in';
        carCard.innerHTML = `
            <img src="${car.image}" alt="${car.name}" class="w-full h-60 object-cover rounded-lg mb-4 transform transition duration-300 hover:scale-105">
            <h3 class="text-2xl font-bold text-gray-800">${car.name}</h3>
            <p class="text-gray-600 mb-4">$${car.price.toFixed(2)}</p>
            <button onclick="addToCart(${car.id})" class="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-xl w-full transition shadow-md">Add to Cart</button>
        `;
        carGrid.appendChild(carCard);
    });
}

async function filterCars() {
    try {
        const query = document.getElementById('search-bar').value.toLowerCase();
        const response = await fetch('/api/cars');
        if (!response.ok) throw new Error('Failed to fetch cars');
        const cars = await response.json();
        const filteredCars = cars.filter(car => car.name.toLowerCase().includes(query));
        displayCars(filteredCars);
    } catch (error) {
        showToast('Error searching cars', 'error');
    }
}

async function addCar(event) {
    event.preventDefault();
    try {
        const name = document.getElementById('car-name').value.trim();
        const price = parseFloat(document.getElementById('car-price').value);
        const image = document.getElementById('car-image').value.trim();
        if (!name || isNaN(price) || price <= 0 || !image) {
            showToast('Please fill all fields correctly with a positive price', 'error');
            return;
        }
        if (!image.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/)) {
            showToast('Please provide a valid image URL (jpg, png, gif)', 'error');
            return;
        }
        const response = await fetch('/api/cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, image })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to add car');
        showToast(result.message);
        window.location.href = '/all-cars';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function addToCart(carId) {
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carId })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to add to cart');
        updateCartCount();
        showToast(result.message);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function fetchAllCars() {
    try {
        showLoading(true);
        const response = await fetch('/api/cars');
        if (!response.ok) throw new Error('Failed to fetch cars');
        const cars = await response.json();
        const carList = document.getElementById('all-cars-list');
        carList.innerHTML = '';
        if (cars.length === 0) {
            carList.innerHTML = '<p class="text-gray-600 text-center text-lg">No cars available.</p>';
            return;
        }
        cars.forEach(car => {
            const carItem = document.createElement('div');
            carItem.className = 'bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-md animate-fade-in flex justify-between items-center';
            carItem.innerHTML = `
                <div class="flex items-center">
                    <img src="${car.image}" alt="${car.name}" class="w-36 h-36 object-cover rounded-lg transform transition duration-300 hover:scale-105">
                    <div class="ml-6">
                        <h3 class="text-2xl font-bold text-gray-800">${car.name}</h3>
                        <p class="text-gray-600">$${car.price.toFixed(2)}</p>
                    </div>
                </div>
                <div class="space-x-4">
                    <button onclick="openEditModal(${car.id}, '${car.name.replace(/'/g, "\\'")}', ${car.price}, '${car.image}')" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl transition shadow-md">Edit</button>
                    <button onclick="openDeleteModal(${car.id}, '${car.name.replace(/'/g, "\\'")}')" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition shadow-md">Delete</button>
                </div>
            `;
            carList.appendChild(carItem);
        });
    } catch (error) {
        showToast('Error fetching cars', 'error');
    } finally {
        showLoading(false);
    }
}

function openEditModal(id, name, price, image) {
    document.getElementById('edit-car-id').value = id;
    document.getElementById('edit-car-name').value = name;
    document.getElementById('edit-car-price').value = price;
    document.getElementById('edit-car-image').value = image;
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

async function updateCar(event) {
    event.preventDefault();
    try {
        const id = document.getElementById('edit-car-id').value;
        const name = document.getElementById('edit-car-name').value.trim();
        const price = parseFloat(document.getElementById('edit-car-price').value);
        const image = document.getElementById('edit-car-image').value.trim();
        if (!name || isNaN(price) || price <= 0 || !image) {
            showToast('Please fill all fields correctly with a positive price', 'error');
            return;
        }
        if (!image.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/)) {
            showToast('Please provide a valid image URL (jpg, png, gif)', 'error');
            return;
        }
        const response = await fetch(`/api/cars/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, image })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update car');
        closeEditModal();
        fetchAllCars();
        showToast(result.message);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openDeleteModal(id, name) {
    deleteCarId = id;
    document.getElementById('delete-car-name').textContent = name;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    deleteCarId = null;
    document.getElementById('delete-modal').classList.add('hidden');
}

async function confirmDelete() {
    if (!deleteCarId) return;
    try {
        const response = await fetch(`/api/cars/${deleteCarId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to delete car');
        closeDeleteModal();
        fetchAllCars();
        updateCartCount();
        showToast(result.message);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function fetchCart() {
    try {
        showLoading(true);
        const response = await fetch('/api/cart');
        if (!response.ok) throw new Error('Failed to fetch cart');
        const cart = await response.json();
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        cartItems.innerHTML = '';
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="text-gray-600 text-center text-lg">Your cart is empty.</p>';
            cartTotal.textContent = '0.00';
            return;
        }
        let total = 0;
        cart.forEach(car => {
            total += car.price;
            const cartItem = document.createElement('div');
            cartItem.className = 'bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-md animate-fade-in flex justify-between items-center';
            cartItem.innerHTML = `
                <div class="flex items-center">
                    <img src="${car.image}" alt="${car.name}" class="w-36 h-36 object-cover rounded-lg transform transition duration-300 hover:scale-105">
                    <div class="ml-6">
                        <h3 class="text-2xl font-bold text-gray-800">${car.name}</h3>
                        <p class="text-gray-600">$${car.price.toFixed(2)}</p>
                    </div>
                </div>
                <button onclick="removeFromCart(${car.id})" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition shadow-md">Remove</button>
            `;
            cartItems.appendChild(cartItem);
        });
        cartTotal.textContent = total.toFixed(2);
    } catch (error) {
        showToast('Error fetching cart', 'error');
    } finally {
        showLoading(false);
    }
}

async function removeFromCart(carId) {
    try {
        const response = await fetch(`/api/cart/${carId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to remove from cart');
        fetchCart();
        updateCartCount();
        showToast(result.message);
    } catch (error) {
        showToast(error.message, 'error');
    }
}