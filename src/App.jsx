import React, { useState, useEffect, useMemo, useCallback } from 'react';

const styles = {
  container: { padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  card: { border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  cartSection: { marginTop: '40px', borderTop: '2px solid #333', paddingTop: '20px' },
  filterBar: { marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' },
  badge: (stock) => ({ color: stock > 0 ? 'green' : 'red', fontWeight: 'bold' })
};

// handling unnecesary re-renders
const ProductCard = React.memo(({ product, onAddToCart }) => {
  return (
    <div style={styles.card}>
      <h3>{product.title}</h3>
      <p>Category: {product.category}</p>
      <p>Price: ${product.price}</p>
      <p style={styles.badge(product.stock)}>
        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
      </p>
      <button disabled={product.stock === 0}
        onClick={() => onAddToCart(product)}
      >
        Add to Cart
      </button>
    </div>
  );
});

const ProductList = React.memo(({ products, onAddToCart }) => {
  if (products.length === 0) return <p>No products found.</p>;
  
  return (
    <div style={styles.grid}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
});

// Main App
export default function ECommerce() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Using Filter
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('none');

  // Fetch Data
  useEffect(() => {
    fetch('https://fakestoreapi.com/products') 
      .then(res => res.json())
      .then(data => {
        const mockedData = data.map(p => ({ ...p, stock: Math.floor(Math.random() * 10) }));
        setProducts(mockedData);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);


  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
      .filter(p => category === 'All' || p.category === category)
      .sort((a, b) => {
        if (sortOrder === 'lowHigh') return a.price - b.price;
        if (sortOrder === 'highLow') return b.price - a.price;
        return 0;
      });
  }, [products, search, category, sortOrder]);

  const categories = useMemo(() => 
    ['All', ...new Set(products.map(p => p.category))], 
  [products]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
            alert("Cannot exceed available stock");
            return prev;
        }
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = (id, delta, stock) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > stock) return item;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={styles.container}>
      <h1>E-Commerce WebApp</h1>

      <div style={styles.filterBar}>
        <input 
          type="text" 
          placeholder="Search products..." 
          onChange={(e) => setSearch(e.target.value)}
        />
        <select onChange={(e) => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select onChange={(e) => setSortOrder(e.target.value)}>
          <option value="none">Sort By Price</option>
          <option value="lowHigh">Price: Low to High</option>
          <option value="highLow">Price: High to Low</option>
        </select>
        <button onClick={() => {setSearch(''); setCategory('All'); setSortOrder('none');}}>Clear Filters</button>
      </div>

      {/* Product Grid */}
      <ProductList products={filteredProducts} onAddToCart={addToCart} />

      {/* Cart Section */}
      <div style={styles.cartSection}>
        <h2>Your Cart ({cartCount} items)</h2>
        {cart.length === 0 ? (
          <p>Empty cart</p>
        ) : (
          <div>
            {cart.map(item => (
              <div key={item.id} style={{ marginBottom: '10px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span>{item.title} - ${item.price}</span>
                <button onClick={() => updateQuantity(item.id, -1, item.stock)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1, item.stock)}>+</button>
                <button onClick={() => removeFromCart(item.id)}>Remove</button>
              </div>
            ))}
            <h3>Total: ${cartTotal.toFixed(2)}</h3>
          </div>
        )}
      </div>
    </div>
  );
}