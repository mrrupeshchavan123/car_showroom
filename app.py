from flask import Flask, render_template, request, redirect, url_for, flash, session
import json
import os
import logging
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secure-secret-key-987654321'
JSON_FILE = 'cars.json'

# Initialize JSON file with demo data
def init_json():
    try:
        if not os.path.exists(JSON_FILE):
            demo_cars = [
                {"id": 1, "name": "Toyota Corolla", "price": 20000, "image": "https://via.placeholder.com/300x200?text=Toyota+Corolla"},
                {"id": 2, "name": "Honda Civic", "price": 22000, "image": "https://via.placeholder.com/300x200?text=Honda+Civic"},
                {"id": 3, "name": "Ford Mustang", "price": 35000, "image": "https://via.placeholder.com/300x200?text=Ford+Mustang"},
                {"id": 4, "name": "Tesla Model 3", "price": 40000, "image": "https://via.placeholder.com/300x200?text=Tesla+Model+3"},
                {"id": 5, "name": "BMW X5", "price": 60000, "image": "https://via.placeholder.com/300x200?text=BMW+X5"},
                {"id": 6, "name": "Audi Q7", "price": 55000, "image": "https://via.placeholder.com/300x200?text=Audi+Q7"},
                {"id": 7, "name": "Mercedes C-Class", "price": 45000, "image": "https://via.placeholder.com/300x200?text=Mercedes+C-Class"},
                {"id": 8, "name": "Volkswagen Golf", "price": 25000, "image": "https://via.placeholder.com/300x200?text=Volkswagen+Golf"},
                {"id": 9, "name": "Chevrolet Camaro", "price": 38000, "image": "https://via.placeholder.com/300x200?text=Chevrolet+Camaro"},
                {"id": 10, "name": "Nissan Altima", "price": 24000, "image": "https://via.placeholder.com/300x200?text=Nissan+Altima"}
            ]
            with open(JSON_FILE, 'w') as f:
                json.dump(demo_cars, f, indent=4)
            logging.info("JSON file initialized with demo data")
    except Exception as e:
        logging.error(f"Failed to initialize JSON file: {str(e)}")

init_json()

# Helper functions for JSON operations
def read_cars():
    try:
      with open(JSON_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error reading JSON file: {str(e)}")
        return []

def write_cars(cars):
    try:
        with open(JSON_FILE, 'w') as f:
            json.dump(cars, f, indent=4)
        logging.info("JSON file updated")
    except Exception as e:
        logging.error(f"Error writing to JSON file: {str(e)}")
        raise

# Routes
@app.route('/')
def index():
    cars = read_cars()
    search_query = request.args.get('search', '').lower()
    if search_query:
        cars = [car for car in cars if search_query in car['name'].lower()]
    return render_template('index.html', cars=cars, search_query=search_query)

@app.route('/add-car', methods=['GET', 'POST'])
def add_car():
    if request.method == 'POST':
        try:
            name = request.form.get('car-name', '').strip()
            price = request.form.get('car-price', '')
            image = request.form.get('car-image', '').strip()
            
            if not name or not price or not image:  
                flash('All fields are required.', 'error')
                return redirect(url_for('add_car'))
            
            try:
                price = float(price)
                if price <= 0:
                    flash('Price must be positive.', 'error')
                    return redirect(url_for('add_car'))
            except ValueError:
                flash('Invalid price format.', 'error')
                return redirect(url_for('add_car'))
            
            if not image.startswith(('http://', 'https://')) or not image.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                flash('Please provide a valid image URL (jpg, png, gif).', 'error')
                return redirect(url_for('add_car'))
            
            cars = read_cars()
            new_id = max([car['id'] for car in cars], default=0) + 1
            new_car = {'id': new_id, 'name': name, 'price': price, 'image': image}
            cars.append(new_car)
            write_cars(cars)
            logging.info(f"Car added: {name}")
            flash(f'Car added: {name} - ${price:.2f} - {image}', 'success')
            return redirect(url_for('all_cars'))
        except Exception as e:
            logging.error(f"Error adding car: {str(e)}")
            flash(f'Error adding car: {str(e)}', 'error')
            return redirect(url_for('add_car'))
    return render_template('add-car.html')

@app.route('/all-cars')
def all_cars():
    cars = read_cars()
    return render_template('all-cars.html', cars=cars)

@app.route('/edit-car/<int:id>', methods=['GET', 'POST'])
def edit_car(id):
    cars = read_cars()
    car = next((c for c in cars if c['id'] == id), None)
    if not car:
        flash('Car not found.', 'error')
        return redirect(url_for('all_cars'))
    
    if request.method == 'POST':
        try:
            name = request.form.get('car-name', '').strip()
            price = request.form.get('car-price', '')
            image = request.form.get('car-image', '').strip()
            
            if not name or not price or not image:
                flash('All fields are required.', 'error')
                return render_template('edit-car.html', car=car)
            
            try:
                price = float(price)
                if price <= 0:
                    flash('Price must be positive.', 'error')
                    return render_template('edit-car.html', car=car)
            except ValueError:
                flash('Invalid price format.', 'error')
                return render_template('edit-car.html', car=car)
            
            if not image.startswith(('http://', 'https://')) or not image.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                flash('Please provide a valid image URL (jpg, png, gif).', 'error')
                return render_template('edit-car.html', car=car)
            
            car['name'] = name
            car['price'] = price
            car['image'] = image
            write_cars(cars)
            logging.info(f"Car updated: {name}")
            flash(f'Car updated: {name} - ${price:.2f}', 'success')
            return redirect(url_for('all_cars'))
        except Exception as e:
            logging.error(f"Error updating car: {str(e)}")
            flash(f'Error updating car: {str(e)}', 'error')
            return render_template('edit-car.html', car=car)
    
    return render_template('edit-car.html', car=car)

@app.route('/delete-car/<int:id>', methods=['POST'])
def delete_car(id):
    try:
        cars = read_cars()
        car = next((c for c in cars if c['id'] == id), None)
        if not car:
            flash('Car not found.', 'error')
            return redirect(url_for('all_cars'))
        
        cars = [c for c in cars if c['id'] != id]
        write_cars(cars)
        if 'cart' in session and id in session['cart']:
            session['cart'].remove(id)
            session.modified = True
        logging.info(f"Car deleted: {car['name']}")
        flash(f'Car deleted: {car["name"]}', 'success')
        return redirect(url_for('all_cars'))
    except Exception as e:
        logging.error(f"Error deleting car: {str(e)}")
        flash(f'Error deleting car: {str(e)}', 'error')
        return redirect(url_for('all_cars'))

@app.route('/cart', methods=['GET', 'POST'])
def cart():
    if request.method == 'POST':
        car_id = request.form.get('car_id', type=int)
        if car_id:
            cars = read_cars()
            car = next((c for c in cars if c['id'] == car_id), None)
            if not car:
                flash('Car not found.', 'error')
                return redirect(url_for('cart'))
            
            if 'cart' not in session:
                session['cart'] = []
            if car_id not in session['cart']:
                session['cart'].append(car_id)
                session.modified = True
                logging.info(f"Added to cart: {car['name']}")
                flash(f'Added to cart: {car["name"]}', 'success')
            else:
                flash('Car already in cart.', 'error')
            return redirect(url_for('cart'))
    
    cart = session.get('cart', [])
    cars = read_cars()
    cart_cars = [c for c in cars if c['id'] in cart]
    total = sum(car['price'] for car in cart_cars)
    return render_template('cart.html', cart_cars=cart_cars, total=total)

@app.route('/remove-from-cart/<int:id>', methods=['POST'])
def remove_from_cart(id):
    try:
        if 'cart' in session and id in session['cart']:
            cars = read_cars()
            car = next((c for c in cars if c['id'] == id), None)
            if not car:
                flash('Car not found.', 'error')
                return redirect(url_for('cart'))
            session['cart'].remove(id)
            session.modified = True
            logging.info(f"Removed from cart: {car['name']}")
            flash(f'Removed from cart: {car["name"]}', 'success')
        else:
            flash('Car not in cart.', 'error')
        return redirect(url_for('cart'))
    except Exception as e:
        logging.error(f"Error removing from cart: {str(e)}")
        flash(f'Error removing from cart: {str(e)}', 'error')
        return redirect(url_for('cart'))

@app.route('/contact')
def contact():
    return render_template('contact.html')

if __name__ == '__main__':
    app.run(debug=True)