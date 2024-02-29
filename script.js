document.addEventListener('DOMContentLoaded', function() {
    const productsContainer = document.querySelector('.products-container');
    const products = [
        { name: 'Product 1', image: 'https://via.placeholder.com/150', description: 'This is product 1.' },
        { name: 'Product 2', image: 'https://via.placeholder.com/150', description: 'This is product 2.' },
    ];

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
        `;
        productsContainer.appendChild(productElement);
    });
});
