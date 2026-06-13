// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
   
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhmHMwhHGRSFSsptZUHbQv0CWRmckGz6OrhBsqra4wwsPZ1uweXGhq02Ba0bSeYw4cWT44q160EBEx/pub?output=csv';

// Компонент картки товару з ручним та кнопковим вводом кількості
function ProductCard({ item, onAddToCart, onOpenDetails }) {
  const [quantity, setQuantity] = useState(1);

  const title = item.title || item.Название || item.Найменування || 'Товар';
  const retailPrice = Number(item.price || item.Цена || item.Ціна || 0);
  
  const optMinCount = Number(item.Опт_Количество || item.opt_count || 0);
  const optPrice = Number(item.Опт_Цена || item.opt_price || 0);

  const isOptActive = optMinCount > 0 && optPrice > 0 && quantity >= optMinCount;
  const currentPrice = isOptActive ? optPrice : retailPrice;

  const handleInputChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
      setQuantity(''); 
    } else {
      setQuantity(num);
    }
  };

  const handleBlur = () => {
    if (quantity === '' || quantity < 1) {
      setQuantity(1);
    }
  };

  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group">
      {optMinCount > 0 && (
        <div className="absolute top-2 left-2 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm">
          Опт від {optMinCount} шт
        </div>
      )}

      <div 
        onClick={() => onOpenDetails(item)}
        className="h-40 w-full mb-4 flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden p-2 cursor-pointer relative"
      >
        <img src={item.image || item.Картинка || item.Фото || ''} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" alt={title} />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/90 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm text-gray-700">🔍 Детальніше</span>
        </div>
      </div>
      
      <h2 
        onClick={() => onOpenDetails(item)}
        className="font-bold text-gray-800 text-xs md:text-sm mb-3 line-clamp-2 h-10 cursor-pointer hover:text-blue-600 transition-colors"
      >
        {title}
      </h2>
      
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-lg md:text-xl font-black transition-colors ${isOptActive ? 'text-green-600' : 'text-blue-600'}`}>
            {currentPrice} грн
          </span>
          {isOptActive && (
            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-md animate-pulse">
              ОПТ 🔥
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between bg-gray-100 rounded-xl p-1">
          <button onClick={() => setQuantity(q => (Number(q) > 1 ? Number(q) - 1 : 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-black text-gray-600 hover:bg-gray-200 active:scale-95 transition-all">-</button>
          <input 
            type="number" 
            value={quantity}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            className="w-16 bg-transparent text-center font-bold text-sm text-gray-800 outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button onClick={() => setQuantity(q => Number(q) + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-black text-gray-600 hover:bg-gray-200 active:scale-95 transition-all">+</button>
        </div>

        <button 
          onClick={() => {
            const finalQty = quantity === '' ? 1 : Number(quantity);
            onAddToCart(item, finalQty);
            setQuantity(1);
          }}
          className={`w-full font-bold py-2 rounded-xl transition-all text-sm shadow-md ${isOptActive ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          У кошик
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  
  // Детальний перегляд та окремий стейт для кількості в модалці
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  const [visibleCount, setVisibleCount] = useState(15);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Всі');
  
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(GOOGLE_SHEET_CSV_URL);
        const parsed = Papa.parse(response.data, { header: true, skipEmptyLines: true });
        setProducts(parsed.data);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  const getItemPrice = (item) => {
    const retail = Number(item.price || item.Цена || item.Ціна || 0);
    const optMin = Number(item.Опт_Количество || item.opt_count || 0);
    const optP = Number(item.Опт_Цена || item.opt_price || 0);
    return (optMin > 0 && optP > 0 && item.count >= optMin) ? optP : retail;
  };

  const categories = ['Всі', ...new Set(products.map(p => p.category || p.Категорія || p.Категория || '').filter(Boolean))];

  const addToCart = (item, quantity) => {
    const itemTitle = item.title || item.Название || item.Найменування;
    const existingIdx = cart.findIndex(cItem => (cItem.title || cItem.Название || cItem.Найменування) === itemTitle);

    if (existingIdx > -1) {
      const newCart = [...cart];
      newCart[existingIdx].count += quantity;
      setCart(newCart);
    } else {
      setCart([...cart, { ...item, count: quantity }]);
    }
  };

  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const handleModalInputChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
      setModalQuantity('');
    } else {
      setModalQuantity(num);
    }
  };

  const handleModalBlur = () => {
    if (modalQuantity === '' || modalQuantity < 1) {
      setModalQuantity(1);
    }
  };

  const sendOrder = async () => {
    if (userName.length < 2) { return alert("Будь ласка, введіть ваше ім'я"); }
    if (phone.length < 10) { return alert("Будь ласка, введіть коректний номер телефону"); }
    if (address.length < 4) { return alert("Будь ласка, введіть адресу доставки"); }

    const token = '8731756289:AAHBep4snR4J_rxALxpW-6UK0xAc6vJQLio';
    const chatId = '-5236520700';     
    
    const itemsList = cart.map(item => {
      const title = item.title || item.Название || item.Найменування || 'Товар';
      const singlePrice = getItemPrice(item);
      const isOpt = Number(item.Опт_Количество || 0) > 0 && item.count >= Number(item.Опт_Количество || 0);
      return `- ${title} (${item.count} шт) — ${singlePrice * item.count} грн ${isOpt ? '[ОПТ] 🔥' : ''}`;
    }).join('\n');

    const total = cart.reduce((sum, item) => sum + (getItemPrice(item) * item.count), 0);
    const message = `🛒 НОВЕ ЗАМОВЛЕННЯ\n\n👤 Клієнт: ${userName}\n📞 Телефон: ${phone}\n🚚 Адреса: ${address}\n\n📦 Товари:\n${itemsList}\n\n💰 РАЗОМ: ${total} грн`;

    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: message });
      setCart([]);
      setPhone('');
      setAddress('');
      setIsCartOpen(false);
      setIsSuccessOpen(true);
    } catch (e) { alert('Помилка при відправці замовлення'); }
  };

  const filtered = products.filter(p => {
    const title = (p.title || p.Название || p.Найменування || '').toString().toLowerCase();
    const pCategory = (p.category || p.Категорія || p.Категория || '').toString();
    const matchesSearch = title.includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Всі' || pCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 p-4 border-b-2 border-blue-500">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-black text-blue-600">КАНЦТОВАРИ 🇺🇦</h1>
          <div className="flex items-center gap-3 md:gap-6">
            <button onClick={() => setIsAboutOpen(true)} className="hidden sm:block text-sm font-bold text-gray-600 hover:text-blue-600 transition">Про нас</button>
            <button onClick={() => setIsDeliveryOpen(true)} className="hidden sm:block text-sm font-bold text-gray-600 hover:text-blue-600 transition">Доставка</button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-md"
            >
              🛒 <span className="bg-white text-blue-600 px-2 rounded-full text-xs md:text-sm font-black">{cart.length}</span>
            </button>
          </div>
        </div>
      </header>

     {/* Контейнер пошуку та випадаючого списку категорій */}
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl border-2 border-gray-200 shadow-sm focus-within:border-blue-500 transition-all">
          
          {/* Випадаючий список категорій (ліворуч) */}
          <div className="relative min-w-[180px] sm:border-r-2 sm:border-gray-100 sm:pr-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setVisibleCount(15);
              }}
              className="w-full h-full p-3 bg-transparent font-bold text-sm text-gray-700 outline-none cursor-pointer appearance-none pr-8"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat} className="font-sans text-gray-800">
                  {cat === 'Всі' ? '📁 Всі категорії' : cat}
                </option>
              ))}
            </select>
            {/* Кастомна стрілочка для гарного вигляду select */}
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          {/* Поле пошуку товарів (праворуч) */}
          <input 
            className="w-full flex-1 p-3 outline-none text-md bg-transparent text-gray-800 placeholder-gray-400"
            placeholder="Пошук товарів за назвою..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
        </div>
      </div>

      {/* Сітка товарів */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 p-4">
        {filtered.slice(0, visibleCount).map((item, idx) => (
          <ProductCard 
            key={idx} 
            item={item} 
            onAddToCart={addToCart} 
            onOpenDetails={(p) => { setSelectedProduct(p); setModalQuantity(1); }} 
          />
        ))}
      </div>

      {/* Показати ще */}
      {visibleCount < filtered.length && (
        <button 
          onClick={() => setVisibleCount(v => v + 15)}
          className="block mx-auto mt-10 bg-white border-2 border-blue-600 text-blue-600 font-bold px-10 py-3 rounded-2xl hover:bg-blue-600 hover:text-white transition shadow-lg"
        >
          Показати ще
        </button>
      )}

      {/* Футер */}
      <footer className="mt-20 py-10 bg-gray-100 text-center border-t border-gray-200">
         <div className="flex justify-center gap-6 mb-4">
            <button onClick={() => setIsAboutOpen(true)} className="text-gray-500 font-bold text-sm">Про нас</button>
            <button onClick={() => setIsDeliveryOpen(true)} className="text-gray-500 font-bold text-sm">Доставка</button>
         </div>
         <p className="text-gray-400 text-xs">© 2026 Магазин Канцтоварів. Всі права захищені.</p>
      </footer>

      {/* МОДАЛКА КОРЗИНИ */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-end backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-2xl font-black">Ваше замовлення</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-3xl hover:text-red-500 transition">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-3" style={{ maxHeight: 'calc(100vh - 430px)', minHeight: '100px' }}>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center mt-10">Кошик порожній...</p>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <span className="text-sm font-bold flex-1 pr-2 line-clamp-2">{item.title || item.Название || item.Найменування}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{item.count} шт ×</span>
                      <span className="font-black text-blue-600 whitespace-nowrap text-sm">
                        {getItemPrice(item) * item.count} грн
                      </span>
                      <button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-600 transition text-sm">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-4 bg-white">
                <div className="space-y-3 text-left mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ваше ім'я:</label>
                    <input type="text" placeholder="Як до вас звертатися?" value={userName} onChange={(e) => setUserName(e.target.value)}
                      className="w-full p-3 border-2 border-blue-100 rounded-xl focus:border-blue-600 outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Номер телефону:</label>
                    <input type="tel" placeholder="+380" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 border-2 border-blue-100 rounded-xl focus:border-blue-600 outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Адреса доставки (Місто, № відділення):</label>
                    <input type="text" placeholder="Наприклад: Київ, Нова Пошта №15" value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-3 border-2 border-blue-100 rounded-xl focus:border-blue-600 outline-none transition-all text-sm" />
                  </div>
                </div>

                <div className="flex justify-between text-xl font-black mb-4 px-1 text-blue-600 border-t pt-2">
                  <span className="text-gray-800">Разом:</span>
                  <span>{cart.reduce((sum, item) => sum + (getItemPrice(item) * item.count), 0)} грн</span>
                </div>
                <button onClick={sendOrder} className="w-full bg-blue-600 text-white font-black py-3.5 rounded-2xl text-md shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                  Оформити замовлення
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* МОДАЛКА ДЕТАЛЬНОГО ПЕРЕГЛЯДУ ТОВАРА */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-red-500 transition"
            >
              &times;
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="h-56 w-full max-w-[240px] mb-6 flex items-center justify-center bg-gray-50 rounded-2xl p-4 overflow-hidden">
                <img 
                  src={selectedProduct.image || selectedProduct.Картинка || selectedProduct.Фото || ''} 
                  className="max-h-full max-w-full object-contain" 
                  alt={selectedProduct.title || selectedProduct.Название} 
                />
              </div>
              
              <h2 className="text-xl font-black text-gray-800 mb-3 px-2">
                {selectedProduct.title || selectedProduct.Название || selectedProduct.Найменування}
              </h2>
              
              <div className="text-lg font-black text-blue-600 mb-4 bg-blue-50 px-4 py-1.5 rounded-full">
                {(() => {
                  const rPrice = Number(selectedProduct.price || selectedProduct.Цена || selectedProduct.Ціна || 0);
                  const oMin = Number(selectedProduct.Опт_Количество || selectedProduct.opt_count || 0);
                  const oPrice = Number(selectedProduct.Опт_Цена || selectedProduct.opt_price || 0);
                  const activeQty = modalQuantity === '' ? 1 : Number(modalQuantity);
                  
                  return (oMin > 0 && oPrice > 0 && activeQty >= oMin) ? oPrice : rPrice;
                })()} грн
              </div>
              
              <div className="text-left w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Опис товару:</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {selectedProduct.description || selectedProduct.Описание || selectedProduct.Опис || 'Опис для цього товару поки що відсутній.'}
                </p>
              </div>
              
              {/* Зручний лічильник із вводом + Кнопка додавання */}
              <div className="w-full flex items-center gap-3">
                <div className="flex items-center justify-between bg-gray-100 rounded-2xl p-1.5 flex-1 max-w-[140px]">
                  <button 
                    onClick={() => setModalQuantity(q => (Number(q) > 1 ? Number(q) - 1 : 1))} 
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl font-black text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  
                  <input 
                    type="number" 
                    value={modalQuantity}
                    onChange={(e) => handleModalInputChange(e.target.value)}
                    onBlur={handleModalBlur}
                    className="w-12 bg-transparent text-center font-bold text-sm text-gray-800 outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  
                  <button 
                    onClick={() => setModalQuantity(q => Number(q) + 1)} 
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl font-black text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>

                <button 
                  onClick={() => {
                    const finalQty = modalQuantity === '' ? 1 : Number(modalQuantity);
                    addToCart(selectedProduct, finalQty);
                    setSelectedProduct(null);
                  }} 
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-md"
                >
                  Додати в кошик
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА УСПІХУ */}
      {isSuccessOpen && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">✓</div>
            <h2 className="text-2xl font-black mb-2">Дякуємо!</h2>
            <p className="text-gray-500 mb-6 text-sm">Ваше замовлення прийнято. Ми зв'яжемося з вами найближчим часом.</p>
            <button onClick={() => { setIsSuccessOpen(false); setUserName(''); }} className="w-full bg-green-500 text-white py-3 rounded-xl font-black shadow-lg shadow-green-100 hover:bg-green-600 transition-all">Чудово!</button>
          </div>
        </div>
      )}

      {/* МОДАЛКА ПРО НАС */}
      {isAboutOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative">
            <button onClick={() => setIsAboutOpen(false)} className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-2xl font-black mb-4 text-blue-600">Про наш магазин 📝</h2>
            <p className="text-gray-600 leading-relaxed mb-6 text-sm">Ми — ваш надійний помічник у світі канцелярії. Пропонуємо широкий асортимент товарів для школи, офісу та творчості.</p>
            <button onClick={() => setIsAboutOpen(false)} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-black">Зрозуміло</button>
          </div>
        </div>
      )}

      {/* МОДАЛКА ДОСТАВКА */}
      {isDeliveryOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative">
            <button onClick={() => setIsDeliveryOpen(false)} className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-2xl font-black mb-4 text-blue-600">Доставка та оплата 🚚</h2>
            <div className="text-gray-600 space-y-3 mb-6 text-sm">
              <p>📍 <strong>Нова Пошта:</strong> Відправка щодня.</p>
              <p>📍 <strong>Кур'єр:</strong> 1000 грн, тільки у Харкові.</p>
              <p>💳 <strong>Оплата:</strong> На рахунок або при отриманні.</p>
            </div>
            <button onClick={() => setIsDeliveryOpen(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">Окей</button>
          </div>
        </div>
      )}
    </div>
  );
}
