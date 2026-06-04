// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhmHMwhHGRSFSsptZUHbQv0CWRmckGz6OrhBsqra4wwsPZ1uweXGhq02Ba0bSeYw4cWT44q160EBEx/pub?output=csv';

// Компонент картки товару з власним лічильником
function ProductCard({ item, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  const title = item.title || item.Название || item.Найменування || 'Товар';
  const retailPrice = Number(item.price || item.Цена || item.Ціна || 0);
  
  // Читаем оптовые данные из таблицы
  const optMinCount = Number(item.Опт_Количество || item.opt_count || 0);
  const optPrice = Number(item.Опт_Цена || item.opt_price || 0);

  // Проверяем, действует ли сейчас опт на основе выбранного количества
  const isOptActive = optMinCount > 0 && optPrice > 0 && quantity >= optMinCount;
  const currentPrice = isOptActive ? optPrice : retailPrice;

  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden">
      {/* Метка опта на карточке */}
      {optMinCount > 0 && (
        <div className="absolute top-2 left-2 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm">
          Опт від {optMinCount} шт
        </div>
      )}

      <div className="h-40 w-full mb-4 flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden p-2">
        <img src={item.image || item.Картинка || item.Фото || ''} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform" alt={title} />
      </div>
      
      <h2 className="font-bold text-gray-800 text-xs md:text-sm mb-3 line-clamp-2 h-10">{title}</h2>
      
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
        
        {/* Кнопки количества */}
        <div className="flex items-center justify-between bg-gray-100 rounded-xl p-1">
          <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-black text-gray-600 hover:bg-gray-200 active:scale-95 transition-all">-</button>
          <span className="font-bold text-sm text-gray-800">{quantity} шт</span>
          <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-black text-gray-600 hover:bg-gray-200 active:scale-95 transition-all">+</button>
        </div>

        <button 
          onClick={() => {
            onAddToCart(item, quantity);
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
  const [visibleCount, setVisibleCount] = useState(15);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Всі');
  
  // Поля оформлення
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

  const getItemPrice = (item) => {
  const retail = Number(item.price || item.Цена || item.Ціна || 0);
  const optMin = Number(item.Опт_Количество || item.opt_count || 0);
  const optP = Number(item.Опт_Цена || item.opt_price || 0);
  
  return (optMin > 0 && optP > 0 && item.count >= optMin) ? optP : retail;
};

  const sendOrder = async () => {
    if (userName.length < 2) { return alert("Будь ласка, введіть ваше ім'я"); }
    if (phone.length < 10) { return alert("Будь ласка, введіть коректний номер телефону"); }
    if (address.length < 4) { return alert("Будь ласка, введіть адресу доставки"); }

    const token = '8731756289:AAHBep4snR4J_rxALxpW-6UK0xAc6vJQLio'; // Встав сюди свій токен
    const chatId = '-5236520700';     // Встав сюди свій ID чату/групи
    
    const itemsList = cart.map(item => {
  const title = item.title || item.Название || item.Найменування || 'Товар';
  const singlePrice = getItemPrice(item);
  const isOpt = Number(item.Опт_Количество || 0) > 0 && item.count >= Number(item.Опт_Количество || 0);

  return `- ${title} (${item.count} шт) — ${singlePrice * item.count} грн ${isOpt ? '[ОПТ] 🔥' : ''}`;
}).join('\n');

const total = cart.reduce((sum, item) => sum + (getItemPrice(item) * item.count), 0);

    const total = cart.reduce((sum, item) => sum + (Number(item.price || item.Цена || item.Ціна || 0) * item.count), 0);
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

  // Отримуємо унікальний список категорій із нашої таблиці
const categories = ['Всі', ...new Set(products.map(p => p.category || p.Категорія || p.Категория || '').filter(Boolean))];
  
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

      {/* Пошук */}
      <div className="p-6 max-w-xl mx-auto">
        <input 
          className="w-full p-4 rounded-2xl border-2 border-gray-200 shadow-sm outline-none focus:border-blue-500 transition-all text-lg"
          placeholder="Пошук товарів за назвою..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {/* Кнопки категорій */}
<div className="flex gap-2 overflow-x-auto pb-3 pt-2 scrollbar-none justify-start sm:justify-center mask-inline shadow-sm px-1">
  {categories.map((cat, idx) => (
    <button
      key={idx}
      onClick={() => {
        setSelectedCategory(cat);
        setVisibleCount(15); // Скидаємо лічильник товарів до 15 при зміні категорії
      }}
      className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
        selectedCategory === cat
          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 scale-105'
          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
      }`}
    >
      {cat}
    </button>
  ))}
</div>

      {/* Сітка товарів */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 p-4">
        {filtered.slice(0, visibleCount).map((item, idx) => (
          <ProductCard key={idx} item={item} onAddToCart={addToCart} />
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
            
            {/* Список товарів */}
            <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-3" style={{ maxHeight: 'calc(100vh - 430px)', minHeight: '100px' }}>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center mt-10">Кошик порожній...</p>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <span className="text-sm font-bold flex-1 pr-2 line-clamp-2">{item.title || item.Название || item.Найменування}</span>
                    <div className="flex items-center gap-3">
  <span className="text-xs text-gray-400 whitespace-nowrap">{item.count} шт ×</span>
  <span className="font-black text-sm whitespace-nowrap text-blue-600">
    {(() => {
      const retail = Number(item.price || item.Цена || item.Ціна || 0);
      const optMin = Number(item.Опт_Количество || item.opt_count || 0);
      const optP = Number(item.Опт_Цена || item.opt_price || 0);
      
      // Считаем цену за 1 шт с учетом опта
      const finalPricePerOne = (optMin > 0 && optP > 0 && item.count >= optMin) ? optP : retail;
      return `${finalPricePerOne * item.count} грн`;
    })()}
  </span>
  <button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-600 transition text-sm">✕</button>
</div>
                  </div>
                ))
              )}
            </div>

            {/* Анкета замовлення */}
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
              <p>📍 <strong>Укрпошта:</strong> Відправка Пн, Ср, Пт.</p>
              <p>💳 <strong>Оплата:</strong> На картку або при отриманні.</p>
            </div>
            <button onClick={() => setIsDeliveryOpen(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">Окей</button>
          </div>
        </div>
      )}
    </div>
  );
}
