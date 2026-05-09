import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhmHMwhHGRSFSsptZUHbQv0CWRmckGz6OrhBsqra4wwsPZ1uweXGhq02Ba0bSeYw4cWT44q160EBEx/pub?output=csv';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(GOOGLE_SHEET_CSV_URL);
        const parsed = Papa.parse(response.data, {
          header: true,
          skipEmptyLines: true,
        });
        setProducts(parsed.data);
      } catch (e) {
        console.error(e);
      }
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

    const itemsList = cart
      .map(
        (item) =>
          `- ${item.title || item.Название || item.Найменування}: ${
            item.price || item.Цена || item.Ціна
          }грн`
      )
      .join('\n');
    const total = cart.reduce(
      (sum, item) => sum + Number(item.price || item.Цена || item.Ціна || 0),
      0
    );

    const message = `🛒 НОВЕ ЗАМОВЛЕННЯ\n\n👤 Телефон: ${phone}\n\n📦 Товари:\n${itemsList}\n\n💰 РАЗОМ: ${total} грн`;

    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message,
      });
      alert("Замовлення надіслано! Ми зв'яжемося з вами найближчим часом.");
      setCart([]);
      setPhone('');
      setIsCartOpen(false);
    } catch (e) {
      alert('Помилка при відправці');
    }
  };

  const filtered = products.filter((p) =>
    (p.title || p.Название || p.Найменування || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b-2 border-blue-500">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">
            КАНЦТОВАРИ 🇺🇦
          </h1>
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition"
          >
            Кошик 🛒{' '}
            <span className="bg-white text-blue-600 px-2 rounded-full text-sm">
              {cart.length}
            </span>
          </button>
        </div>
      </header>

      <div className="p-6 max-w-xl mx-auto">
        <input
          className="w-full p-4 rounded-2xl border-2 border-gray-200 shadow-sm outline-none focus:border-blue-500 transition-all text-lg"
          placeholder="Пошук товарів..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 p-4">
        {filtered.slice(0, visibleCount).map((item, idx) => {
          const title =
            item.title || item.Название || item.Найменування || 'Товар';
          const price = item.price || item.Цена || item.Ціна || '0';
          const image = item.image || item.Картинка || item.Фото || '';

          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-shadow"
            >
              <div className="h-40 w-full mb-4 flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden">
                <img
                  src={image}
                  className="max-h-full max-w-full object-contain"
                  alt={title}
                />
              </div>
              <h2 className="font-bold text-gray-800 text-sm mb-3 line-clamp-2 h-10">
                {title}
              </h2>
              <div className="flex flex-col gap-3">
                <span className="text-xl font-black text-blue-600">
                  {price} грн
                </span>
                <button
                  onClick={() => addToCart(item)}
                  className="w-full bg-blue-50 text-blue-600 font-bold py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                >
                  У кошик
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount < filtered.length && (
        <button
          onClick={() => setVisibleCount((v) => v + 15)}
          className="block mx-auto mt-10 bg-white border-2 border-blue-600 text-blue-600 font-bold px-10 py-3 rounded-2xl hover:bg-blue-600 hover:text-white transition"
        >
          Показати ще
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Ваше замовлення</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-3xl hover:text-red-500"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center mt-10">
                  Кошик порожній...
                </p>
              ) : (
                cart.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100"
                  >
                    <span className="text-sm font-semibold flex-1">
                      {item.title || item.Название || item.Найменування}
                    </span>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="font-bold text-blue-600 whitespace-nowrap">
                        {item.price || item.Цена || item.Ціна} грн
                      </span>
                      <button
                        onClick={() => removeFromCart(i)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-6 mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Номер телефону:
                  </label>
                  <input
                    type="tel"
                    placeholder="+380"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-4 border-2 border-blue-100 rounded-2xl focus:border-blue-600 outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="flex justify-between text-2xl font-black mb-6 px-1">
                  <span>Разом:</span>
                  <span className="text-blue-600">
                    {cart.reduce(
                      (sum, item) =>
                        sum + Number(item.price || item.Цена || item.Ціна || 0),
                      0
                    )}{' '}
                    грн
                  </span>
                </div>
                <button
                  onClick={sendOrder}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Оформити замовлення
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
