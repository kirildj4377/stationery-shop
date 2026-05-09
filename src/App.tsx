// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhmHMwhHGRSFSsptZUHbQv0CWRmckGz6OrhBsqra4wwsPZ1uweXGhq02Ba0bSeYw4cWT44q160EBEx/pub?output=csv';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState('');

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

  const addToCart = (item) => setCart([...cart, item]);
  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const sendOrder = async () => {
    if (phone.length < 10) {
      alert('Будь ласка, введіть коректний номер телефону');
      return;
    }

    const token = '8731756289:AAHBep4snR4J_rxALxpW-6UK0xAc6vJQLio';
    const chatId = '327225760';
    
    const itemsList = cart.map(item => {
      const title = item.title || item.Название || item.Найменування || 'Товар';
      const p = item.price || item.Цена || item.Ціна || '0';
      return `- ${title}: ${p} грн`;
    }).join('\n');

    const total = cart.reduce((sum, item) => sum + Number(item.price || item.Цена || item.Ціна || 0), 0);
    const message = `🛒 НОВЕ ЗАМОВЛЕННЯ\n\n👤 Телефон: ${phone}\n\n📦 Товари:\n${itemsList}\n\n💰 РАЗОМ: ${total} грн`;

    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: message });
      alert('Замовлення надіслано! Ми зв\'яжемося з вами.');
      setCart([]);
      setPhone('');
      setIsCartOpen(false);
    } catch (e) { alert('Помилка при відправці'); }
  };

  const filtered = products.filter(p => {
    const title = (p.title || p.Название || p.Найменування || '').toString();
    return title.toLowerCase().includes(search.toLowerCase());
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

      {/* Сітка товарів */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 p-4">
        {filtered.slice(0, visibleCount).map((item, idx) => {
          const title = item.title || item.Название || item.Найменування || 'Товар';
          const price = item.price || item.Цена || item.Ціна || '0';
          const image = item.image || item.Картинка || item.Фото || '';
          
          return (
            <div key={idx} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="h-40 w-full mb-4 flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden p-2">
                <img src={image} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform" alt={title} />
              </div>
              <h2 className="font-bold text-gray-800 text-xs md:text-sm mb-3 line-clamp-2 h-10">{title}</h2>
              <div className="flex flex-col gap-3">
                <span className="text-lg md:text-xl font-black text-blue-600">{price} грн</span>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full bg-blue-50 text-blue-600 font-bold py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm"
                >
                  У кошик
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Кнопка "Показати ще" */}
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
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Ваше замовлення</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-3xl hover:text-red-500 transition">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {cart.length === 0 ? <p className="text-gray-400 text-center mt-10">Кошик порожній...</p> : 
                cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-sm font-bold flex-1">{item.title || item.Название || item.Найменування}</span>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="font-black text-blue-600 whitespace-nowrap">{item.price || item.Цена || item.Ціна} грн</span>
                      <button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-600 transition">✕</button>
                    </div>
                  </div>
                ))
              }
            </div>
            {cart.length > 0 && (
              <div className="border-t pt-6 mt-4">
                <div className="mb-4 text-left">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Номер телефону для зв'язку:</label>
                  <input type="tel" placeholder="+380" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-4 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none transition-all shadow-inner" />
                </div>
                <div className="flex justify-between text-2xl font-black mb-6 px-1 text-blue-600">
                  <span className="text-gray-800">Разом:</span>
                  <span>{cart.reduce((sum, item) => sum + Number(item.price || item.Цена || item.Ціна || 0), 0)} грн</span>
                </div>
                <button onClick={sendOrder} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                  Оформити замовлення
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* МОДАЛКА ПРО НАС */}
      {isAboutOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative">
            <button onClick={() => setIsAboutOpen(false)} className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-2xl font-black mb-4 text-blue-600">Про наш магазин 📝</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Ми — ваш надійний помічник у світі канцелярії. Пропонуємо широкий асортимент товарів для школи, офісу та творчості. Наша мета — забезпечити вас найкращими інструментами за доступними цінами.
            </p>
            <button onClick={() => setIsAboutOpen(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">Зрозуміло</button>
          </div>
        </div>
      )}

      {/* МОДАЛКА ДОСТАВКА */}
      {isDeliveryOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative">
            <button onClick={() => setIsDeliveryOpen(false)} className="absolute top-4 right-6 text-3xl text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-2xl font-black mb-4 text-blue-600">Доставка та оплата 🚚</h2>
            <div className="text-gray-600 space-y-4 mb-6">
              <p>📍 <strong>Нова Пошта:</strong> Відправка щодня.</p>
              <p>📍 <strong>Укрпошта:</strong> Відправка Пн, Ср, Пт.</p>
              <p>💳 <strong>Оплата:</strong> На картку Monobank/ПриватБанк або при отриманні.</p>
            </div>
            <button onClick={() => setIsDeliveryOpen(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">Окей</button>
          </div>
        </div>
      )}
    </div>
  );
}
