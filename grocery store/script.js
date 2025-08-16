// Cart functionality
class ShoppingCart {
    constructor() {
        this.cart = [];
        this.total = 0;
        this.cartIcon = document.querySelector('.cart-icon-container');
        this.cartDropdown = document.querySelector('.cart-dropdown');
        this.cartCount = document.querySelector('.cart-count');
        // These are for the dropdown, will be reused or adapted for cart page
        this.cartItemsDropdown = document.querySelector('.cart-items');
        this.totalAmountDropdown = document.querySelector('.total-amount');

        // Elements for the cart.html page
        this.cartItemsTable = document.querySelector('.cart-items-table');
        this.cartSubtotal = document.querySelector('.cart-subtotal');
        this.cartGrandtotal = document.querySelector('.cart-grandtotal');
        this.checkoutBtnLarge = document.querySelector('.cart-page .checkout-btn');

         // Elements for the checkout.html page
        this.checkoutItemsList = document.querySelector('.checkout-items-list');
        this.checkoutSubtotal = document.querySelector('.checkout-subtotal');
        this.checkoutGrandtotal = document.querySelector('.checkout-grandtotal');
        this.placeOrderBtn = document.querySelector('.place-order-btn');

        // Forms for checkout
        this.shippingForm = document.getElementById('shipping-form');
        this.paymentForm = document.getElementById('payment-form');

        // Forms for authentication
        this.loginForm = document.getElementById('login-form');
        this.signupForm = document.getElementById('signup-form');

        // Initialize user status
        this.loadUserStatus();
        
        // Initialize cart from localStorage
        this.loadCart();
        
        // Initialize the display
        this.updateCartDisplay();
        
        this.init();
    }

    init() {
        // Update navigation based on login status
        this.updateNavigation();

        // Toggle cart dropdown (if on a page with the dropdown)
        if (this.cartIcon) {
            this.cartIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cartDropdown.classList.toggle('active');
            });

            // Close cart when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.cartDropdown.contains(e.target) && !this.cartIcon.contains(e.target)) {
                    this.cartDropdown.classList.remove('active');
                }
            });

            // Add event listeners to dropdown cart buttons
            const viewCartBtnDropdown = this.cartDropdown.querySelector('.view-cart');
            const checkoutBtnDropdown = this.cartDropdown.querySelector('.checkout');

            if (viewCartBtnDropdown) {
                viewCartBtnDropdown.addEventListener('click', () => {
                    window.location.href = 'cart.html';
                });
            }

            if (checkoutBtnDropdown) {
                checkoutBtnDropdown.addEventListener('click', (e) => {
                    if (this.cart.length > 0) {
                        window.location.href = 'checkout.html';
                    } else {
                        this.showNotification('Your cart is empty!');
                        e.preventDefault(); // Prevent navigation if cart is empty
                    }
                });
            }
        }

        // Add event listeners to "Add to Cart" buttons (if on a page with products)
        document.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                const priceText = productCard.querySelector('.product-price').textContent;
                const price = parseFloat(priceText.replace('₵', '').trim());
                
                const product = {
                    id: productCard.dataset.id,
                    name: productCard.querySelector('.product-name').textContent,
                    price: price,
                    image: productCard.querySelector('.product-image').src,
                    quantity: 1
                };
                this.addToCart(product);
            });
        });

        // Add event listener to the large checkout button on cart page
        if(this.checkoutBtnLarge) {
            this.checkoutBtnLarge.addEventListener('click', (e) => {
                if (this.cart.length > 0) {
                    window.location.href = 'checkout.html';
                } else {
                    this.showNotification('Your cart is empty!');
                    e.preventDefault(); // Prevent navigation if cart is empty
                }
            });
        }

        // Add event listeners for payment method selection
        const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => {
                // Hide all payment details first
                document.querySelectorAll('.payment-details').forEach(details => {
                    details.style.display = 'none';
                });
                
                // Show selected payment details
                const selectedMethod = e.target.value;
                const detailsElement = document.querySelector(`.${selectedMethod}-details`);
                if (detailsElement) {
                    detailsElement.style.display = 'block';
                }
            });
        });

        // Product search functionality
        const productSearchInput = document.getElementById('product-search');
        const productSearchButton = document.getElementById('search-button');
        const productCards = document.querySelectorAll('.product-card');

        const filterProducts = () => {
            const searchTerm = productSearchInput.value.toLowerCase();
            productCards.forEach(card => {
                const productName = card.querySelector('.product-name').textContent.toLowerCase();
                if (productName.includes(searchTerm)) {
                    card.style.display = ''; // Show product
                } else {
                    card.style.display = 'none'; // Hide product
                }
            });
        };

        if (productSearchInput) {
            productSearchInput.addEventListener('keyup', filterProducts);
        }

        if (productSearchButton) {
            productSearchButton.addEventListener('click', filterProducts);
        }

        // Add event listener for place order button
        if(this.placeOrderBtn) {
            this.placeOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // Check if user is logged in
                if (!this.isLoggedIn) {
                    this.showNotification('Please log in to complete your purchase');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                    return;
                }

                if (this.cart.length === 0) {
                    this.showNotification('Your cart is empty!');
                    return;
                }

                // Basic form validation
                const shippingValid = this.shippingForm ? this.shippingForm.checkValidity() : true;
                const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
                
                if (!paymentMethod) {
                    this.showNotification('Please select a payment method');
                    return;
                }

                // Validate payment details based on selected method
                const selectedMethod = paymentMethod.value;
                const paymentDetails = document.querySelector(`.${selectedMethod}-details`);
                if (paymentDetails) {
                    const inputs = paymentDetails.querySelectorAll('input');
                    let isValid = true;
                    inputs.forEach(input => {
                        if (!input.checkValidity()) {
                            isValid = false;
                            input.reportValidity();
                        }
                    });
                    if (!isValid) return;
                }

                if (!shippingValid) {
                    this.showNotification('Please fill in all required shipping fields.');
                    if (this.shippingForm) this.shippingForm.reportValidity();
                    return;
                }

                // Gather shipping information
                const shippingInfo = {};
                if (this.shippingForm) {
                    const formData = new FormData(this.shippingForm);
                    formData.forEach((value, key) => {
                        shippingInfo[key] = value;
                    });
                }

                // Log shipping info for debugging
                console.log('Shipping Info:', shippingInfo);

                const paymentData = {
                    method: selectedMethod,
                    details: {}
                };

                // Get payment details based on selected method
                if (selectedMethod !== 'cod') {
                    const paymentInputs = paymentDetails.querySelectorAll('input');
                    paymentInputs.forEach(input => {
                        paymentData.details[input.placeholder.toLowerCase().replace(/\s+/g, '_')] = input.value;
                    });
                }

                const orderData = {
                    cartItems: this.cart,
                    shippingInfo: shippingInfo,
                    paymentInfo: paymentData,
                    totalAmount: this.total.toFixed(2),
                    userId: this.currentUser ? this.currentUser.id : null
                };

                // Log order data for debugging
                console.log('Order Data:', orderData);

                // Place the order and get the order number
                const orderNumber = this.placeOrder(orderData);

                // Clear cart after successful order
                this.cart = [];
                this.saveCart();
                this.updateCartDisplay();
                
                // Show success message with order number
                this.showNotification(`Order placed successfully! Your order number is: ${orderNumber}`);

                // Redirect to confirmation page after a short delay
                setTimeout(() => {
                    window.location.href = 'order-confirmation.html';
                }, 2000);
            });
        }

        // Add event listener to checkout button in cart dropdown
        const checkoutBtn = document.querySelector('.cart-dropdown .checkout');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (!this.isLoggedIn) {
                    this.showNotification('Please log in to proceed to checkout');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                    return;
                }
                window.location.href = 'checkout.html';
            });
        }

        // Add event listener to checkout button on cart page
        const cartCheckoutBtn = document.querySelector('.cart-actions .checkout-btn');
        if (cartCheckoutBtn) {
            cartCheckoutBtn.addEventListener('click', () => {
                if (!this.isLoggedIn) {
                    this.showNotification('Please log in to proceed to checkout');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                    return;
                }
                window.location.href = 'checkout.html';
            });
        }

        // Handle login form submission
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                this.handleLogin(email, password);
            });
        }

        // Handle signup form submission
        if (this.signupForm) {
            this.signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                this.handleSignup(name, email, password);
            });
        }

        // Logout listener
        const logoutLink = document.querySelector('.logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Check if we're on the order confirmation page
        if (window.location.pathname.includes('order-confirmation.html')) {
            this.renderOrderConfirmationPage();
        }

        // Add event listener for track order button
        const trackButton = document.getElementById('track-button');
        if (trackButton) {
            trackButton.addEventListener('click', () => {
                const orderNumber = document.getElementById('order-number').value.trim();
                if (orderNumber) {
                    this.trackOrder(orderNumber);
                } else {
                    this.showNotification('Please enter an order number');
                }
            });

            // Check if we have a stored order number from the confirmation page
            const storedOrderNumber = localStorage.getItem('trackOrderNumber');
            if (storedOrderNumber) {
                document.getElementById('order-number').value = storedOrderNumber;
                this.trackOrder(storedOrderNumber);
                localStorage.removeItem('trackOrderNumber'); // Clear the stored number
            }
        }
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push(product);
        }

        this.updateCartDisplay();
        this.saveCart();
        this.showNotification('Product added to cart!');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCartDisplay();
        this.saveCart();
        this.showNotification('Product removed from cart');
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, newQuantity); // Allow quantity to go to 0 for easier removal flow
            if (item.quantity === 0) {
                this.removeFromCart(productId);
            } else {
                 this.updateCartDisplay();
                 this.saveCart();
            }
        }
    }

    updateCartDisplay() {
        // Update cart count (visible on all pages)
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        if(this.cartCount) {
            this.cartCount.textContent = totalItems;
        }

        // Update cart items display in the dropdown
        if (this.cartItemsDropdown) {
            this.cartItemsDropdown.innerHTML = this.cart.length ? this.cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">₵${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn plus">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('') : `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="product.html" class="continue-shopping">Continue Shopping</a>
                </div>
            `;

            // Add event listeners to dropdown cart item buttons
            this.cartItemsDropdown.querySelectorAll('.cart-item').forEach(item => {
                const id = item.dataset.id;
                
                item.querySelector('.minus').addEventListener('click', () => {
                    this.updateQuantity(id, parseInt(item.querySelector('span').textContent) - 1);
                });

                item.querySelector('.plus').addEventListener('click', () => {
                    this.updateQuantity(id, parseInt(item.querySelector('span').textContent) + 1);
                });

                item.querySelector('.cart-item-remove').addEventListener('click', () => {
                    this.removeFromCart(id);
                });
            });

            // Update total in the dropdown
            this.total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if(this.totalAmountDropdown) {
                this.totalAmountDropdown.textContent = `₵${this.total.toFixed(2)}`;
            }
        }

        // Update cart items display on the cart.html page
        if (this.cartItemsTable) {
            this.renderCartPage();
        }

        // Update cart items display on the checkout.html page
        if (this.checkoutItemsList) {
            this.renderCheckoutPage();
        }
    }

    renderCartPage() {
        if (!this.cartItemsTable) return; // Ensure we are on the cart page

        if (this.cart.length === 0) {
            this.cartItemsTable.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="product.html" class="continue-shopping">Continue Shopping</a>
                </div>
            `;
             if(this.cartSubtotal) this.cartSubtotal.textContent = '$0.00';
             if(this.cartGrandtotal) this.cartGrandtotal.textContent = '$0.00';
             if(this.checkoutBtnLarge) this.checkoutBtnLarge.disabled = true;
             return;
        }

        this.cartItemsTable.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${this.cart.map(item => `
                        <tr data-id="${item.id}">
                            <td>
                                <div class="cart-item-details-table">
                                    <img src="${item.image}" alt="${item.name}" class="cart-item-image-table">
                                    <span class="cart-item-name-table">${item.name}</span>
                                </div>
                            </td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>
                                <div class="cart-item-quantity-control">
                                    <button class="quantity-btn minus">-</button>
                                    <input type="number" value="${item.quantity}" min="0" class="quantity-input">
                                    <button class="quantity-btn plus">+</button>
                                </div>
                            </td>
                            <td>$${(item.price * item.quantity).toFixed(2)}</td>
                            <td>
                                <button class="remove-item-btn"><i class="fas fa-times"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Add event listeners to cart item controls on the cart page
        this.cartItemsTable.querySelectorAll('tbody tr').forEach(row => {
            const id = row.dataset.id;
            const quantityInput = row.querySelector('.quantity-input');

            row.querySelector('.minus').addEventListener('click', () => {
                this.updateQuantity(id, parseInt(quantityInput.value) - 1);
            });

            row.querySelector('.plus').addEventListener('click', () => {
                this.updateQuantity(id, parseInt(quantityInput.value) + 1);
            });

            quantityInput.addEventListener('change', (e) => {
                 // Ensure the input value is at least 0
                let newQuantity = parseInt(e.target.value);
                if (isNaN(newQuantity) || newQuantity < 0) {
                    newQuantity = 0;
                }
                this.updateQuantity(id, newQuantity);
            });

            row.querySelector('.remove-item-btn').addEventListener('click', () => {
                this.removeFromCart(id);
            });
        });

        // Update totals on the cart page
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if(this.cartSubtotal) this.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        // For simplicity, grand total is same as subtotal for now. Shipping will be added later.
        if(this.cartGrandtotal) this.cartGrandtotal.textContent = `$${subtotal.toFixed(2)}`;
        if(this.checkoutBtnLarge) this.checkoutBtnLarge.disabled = false;
    }

    renderCheckoutPage() {
        if (!this.checkoutItemsList) return; // Ensure we are on the checkout page

        if (this.cart.length === 0) {
            this.checkoutItemsList.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p></div>';
            if(this.checkoutSubtotal) this.checkoutSubtotal.textContent = '₵0.00';
            if(this.checkoutShipping) this.checkoutShipping.textContent = '₵0.00';
            if(this.checkoutGrandtotal) this.checkoutGrandtotal.textContent = '₵0.00';
            if(this.placeOrderBtn) this.placeOrderBtn.disabled = true;
            return;
        }

        // Calculate total items
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        // Display cart items with better formatting
        this.checkoutItemsList.innerHTML = this.cart.map(item => `
            <div class="checkout-item">
                <div class="checkout-item-details">
                    <span class="checkout-item-name">${item.name}</span>
                    <span class="checkout-item-quantity">Quantity: ${item.quantity}</span>
                </div>
                <span class="checkout-item-price">₵${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        // Update items count
        const itemsCountElement = document.querySelector('.checkout-items-count');
        if (itemsCountElement) {
            itemsCountElement.textContent = totalItems;
        }

        // Update totals on the checkout page
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if(this.checkoutSubtotal) this.checkoutSubtotal.textContent = `₵${subtotal.toFixed(2)}`;
        
        // Calculate shipping (free for orders over ₵50, otherwise ₵5)
        const shipping = subtotal >= 50 ? 0 : 5;
        const grandTotal = subtotal + shipping;
        
        if(this.checkoutShipping) this.checkoutShipping.textContent = `₵${shipping.toFixed(2)}`;
        if(this.checkoutGrandtotal) this.checkoutGrandtotal.textContent = `₵${grandTotal.toFixed(2)}`;
        if(this.placeOrderBtn) this.placeOrderBtn.disabled = false;
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                this.cart = JSON.parse(savedCart);
                // Ensure cart items have a quantity property, default to 1 if missing
                this.cart = this.cart.map(item => ({ ...item, quantity: item.quantity || 1 }));
                this.updateCartDisplay();
            } catch (e) {
                console.error("Error loading cart from localStorage:", e);
                this.cart = []; // Clear cart on error
                 this.updateCartDisplay();
            }
        } else {
            this.cart = [];
             this.updateCartDisplay();
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    loadUserStatus() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (userData) {
                this.isLoggedIn = true;
                this.currentUser = userData;
                this.updateNavigation();
            } else {
                this.isLoggedIn = false;
                this.currentUser = null;
                this.updateNavigation();
            }
        } catch (error) {
            console.error('Error loading user status:', error);
            this.isLoggedIn = false;
            this.currentUser = null;
            this.updateNavigation();
        }
    }

    updateNavigation() {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        const loginLink = navLinks.querySelector('a[href="login.html"]');
        const signupLink = navLinks.querySelector('a[href="signup.html"]');
        const userProfile = document.createElement('li');
        userProfile.className = 'user-profile';
        userProfile.innerHTML = `
            <span class="user-name">${this.currentUser ? this.currentUser.name : ''}</span>
            <a href="#" class="logout-link">Logout</a>
        `;

        if (this.isLoggedIn) {
            // Remove login/signup links
            if (loginLink) loginLink.parentElement.remove();
            if (signupLink) signupLink.parentElement.remove();
            
            // Add user profile if it doesn't exist
            if (!navLinks.querySelector('.user-profile')) {
                navLinks.appendChild(userProfile);
            }
        } else {
            // Remove user profile if it exists
            const existingProfile = navLinks.querySelector('.user-profile');
            if (existingProfile) {
                existingProfile.remove();
            }
            
            // Add login/signup links if they don't exist
            if (!loginLink) {
                const loginLi = document.createElement('li');
                loginLi.innerHTML = '<a href="login.html">Login</a>';
                navLinks.appendChild(loginLi);
            }
            if (!signupLink) {
                const signupLi = document.createElement('li');
                signupLi.innerHTML = '<a href="signup.html">Sign Up</a>';
                navLinks.appendChild(signupLi);
            }
        }
    }

    handleLogin(email, password) {
        // Simulate login - in a real app, this would make an API call
        this.currentUser = {
            name: 'John Doe', // This would come from the server
            email: email
        };
        this.isLoggedIn = true;
        localStorage.setItem('userData', JSON.stringify(this.currentUser));
        this.updateNavigation();
        this.showNotification('Successfully logged in!');
        window.location.href = 'index.html';
    }

    handleSignup(name, email, password) {
        // Simulate signup - in a real app, this would make an API call
        this.currentUser = {
            name: name,
            email: email
        };
        this.isLoggedIn = true;
        localStorage.setItem('userData', JSON.stringify(this.currentUser));
        this.updateNavigation();
        this.showNotification('Account created successfully!');
        window.location.href = 'index.html';
    }

    handleLogout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('userData');
        this.updateNavigation();
        this.showNotification('Successfully logged out!');
        window.location.href = 'index.html';
    }

    renderOrderConfirmationPage() {
        // Get the last order from localStorage
        const order = JSON.parse(localStorage.getItem('lastOrder'));
        
        if (!order) {
            // If no order found, redirect to home page
            window.location.href = 'index.html';
            return;
        }

        // Log order data for debugging
        console.log('Order in confirmation page:', order);

        // Update order information
        document.getElementById('order-number').textContent = order.orderNumber;
        document.getElementById('order-date').textContent = new Date(order.orderDate).toLocaleDateString();
        document.getElementById('payment-method').textContent = order.paymentInfo.method.toUpperCase();
        document.getElementById('total-amount').textContent = `₵${order.totalAmount}`;

        // Display shipping information
        const shippingDetails = document.getElementById('shipping-details');
        if (order.shippingInfo) {
            // Log shipping info for debugging
            console.log('Shipping Info in confirmation:', order.shippingInfo);

            shippingDetails.innerHTML = `
                <div class="info-group">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${order.shippingInfo.fullName || order.shippingInfo.name || `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Address:</span>
                    <span class="info-value">
                        ${order.shippingInfo.address || ''}<br>
                        ${order.shippingInfo.city || ''}, ${order.shippingInfo.state || ''}<br>
                        ${order.shippingInfo.zipCode || ''}
                    </span>
                </div>
                <div class="info-group">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${order.shippingInfo.phone || 'Not provided'}</span>
                </div>
            `;
        }

        // Display order items
        const orderItems = document.getElementById('order-items');
        orderItems.innerHTML = order.cartItems.map(item => `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-quantity">Quantity: ${item.quantity}</div>
                    <div class="order-item-price">₵${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            </div>
        `).join('');

        // Add event listener for track order button
        const trackOrderBtn = document.querySelector('.track-order-btn');
        if (trackOrderBtn) {
            trackOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Store the order number in localStorage for the track order page
                localStorage.setItem('trackOrderNumber', order.orderNumber);
                window.location.href = 'track-order.html';
            });
        }
    }

    generateOrderNumber() {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000);
        return `PB${timestamp}${random}`;
    }

    placeOrder(orderData) {
        // Generate a unique order number
        const orderNumber = this.generateOrderNumber();
        
        // Add order number and status to order data
        const completeOrderData = {
            ...orderData,
            orderNumber: orderNumber,
            status: 'ordered',
            orderDate: new Date().toISOString()
        };

        // Save order to localStorage
        localStorage.setItem('lastOrder', JSON.stringify(completeOrderData));

        // Save to order history if user is logged in
        if (this.isLoggedIn && this.currentUser) {
            const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
            orderHistory.push(completeOrderData);
            localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        }

        return orderNumber;
    }

    trackOrder(orderNumber) {
        // First check in lastOrder
        let order = JSON.parse(localStorage.getItem('lastOrder'));
        
        // If not found in lastOrder and user is logged in, check order history
        if (!order && this.isLoggedIn && this.currentUser) {
            const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
            order = orderHistory.find(o => o.orderNumber === orderNumber);
        }

        const orderStatus = document.getElementById('order-status');
        const noOrderFound = document.getElementById('no-order-found');
        const itemsList = document.getElementById('track-order-items');
        const deliveryDetails = document.getElementById('delivery-details');

        if (order && order.orderNumber === orderNumber) {
            // Log order data for debugging
            console.log('Order in track order:', order);

            // Show order status container
            orderStatus.style.display = 'block';
            noOrderFound.style.display = 'none';

            // Update order information
            document.getElementById('display-order-number').textContent = order.orderNumber;
            document.getElementById('display-order-date').textContent = new Date(order.orderDate).toLocaleDateString();
            
            // Calculate estimated delivery (3 days from order date)
            const deliveryDate = new Date(order.orderDate);
            deliveryDate.setDate(deliveryDate.getDate() + 3);
            document.getElementById('estimated-delivery').textContent = deliveryDate.toLocaleDateString();

            // Update progress steps based on order status
            this.updateOrderProgress(order.status || 'ordered');

            // Display order items if available
            if (order.cartItems && order.cartItems.length > 0) {
                itemsList.innerHTML = order.cartItems.map(item => `
                    <div class="order-item">
                        <img src="${item.image || ''}" alt="${item.name || ''}">
                        <div class="order-item-details">
                            <div class="order-item-name">${item.name || ''}</div>
                            <div class="order-item-quantity">Quantity: ${item.quantity || 0}</div>
                            <div class="order-item-price">₵${(item.price * item.quantity).toFixed(2) || '0.00'}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                itemsList.innerHTML = '<p>No items found for this order.</p>';
            }

            // Display delivery information if available
            if (order.shippingInfo) {
                // Log shipping info for debugging
                console.log('Shipping Info in track order:', order.shippingInfo);

                // Use more robust access to shipping fields with fallbacks
                const shippingName = order.shippingInfo.fullName || order.shippingInfo.name || `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() || 'Not provided';
                const shippingAddress = order.shippingInfo.address || 'Not provided';
                const shippingCity = order.shippingInfo.city || '';
                const shippingState = order.shippingInfo.state || '';
                const shippingZip = order.shippingInfo.zipCode || '';
                const shippingPhone = order.shippingInfo.phone || 'Not provided';

                deliveryDetails.innerHTML = `
                    <div class="info-group">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${shippingName}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Address:</span>
                        <span class="info-value">
                            ${shippingAddress}<br>
                            ${shippingCity}${shippingCity && (shippingState || shippingZip) ? ', ' : ''}${shippingState}${shippingState && shippingZip ? ' ' : ''}${shippingZip}
                        </span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${shippingPhone}</span>
                    </div>
                `;
            } else {
                deliveryDetails.innerHTML = '<p>No delivery information available for this order.</p>';
            }

        } else {
            // Show order not found message
            orderStatus.style.display = 'none';
            noOrderFound.style.display = 'block';
             // Clear previous content in case it was shown for a different order
            itemsList.innerHTML = '';
            deliveryDetails.innerHTML = '';
        }
    }

    updateOrderProgress(status) {
        const steps = {
            'ordered': 1,
            'confirmed': 2,
            'processing': 3,
            'shipped': 4,
            'delivered': 5
        };

        const currentStep = steps[status] || 1;
        const progressPercentage = ((currentStep - 1) / 4) * 100;

        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        // Update step icons and labels
        const stepElements = document.querySelectorAll('.step');
        stepElements.forEach((step, index) => {
            if (index + 1 < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cart = new ShoppingCart();
}); 