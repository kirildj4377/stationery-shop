import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhmHMwhHGRSFSsptZUHbQv0CWRmckGz6OrhBsqra4wwsPZ1uweXGhq02Ba0bSeYw4cWT44q160EBEx/pub?output=csv';

export default function App() {
  // Вказуємо <any[]>, щоб TS не лаявся на порожній масив
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const [search, setSearch] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(GOOGLE_SHEET_CSV_URL);
        const parsed = Papa.parse(response.data, { header: true, skipEmptyLines: true });
        setProducts(parsed.data as any[]);
      } catch (e) { 
        console.error(e); 
      }
    };
    fetchData();
  }, []);

  const addToCart = (item: any) => setCart([...cart, item]);
  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index));

  const sendOrder = async () => {
    if (phone.length < 10) {
      alert('Будь ласка, введіть коректний номер телефону');
      return;
    }

    const token = '8731756289:AAHBep4snR4J_rxALxpW-6UK0xAc6vJQLio';
    const chatId = '327225760';
    
    // Додаємо перевірку типів для кожного поля
    const itemsList = cart.map(item => {
      const name = item.title || item.Название || item.Найменування || 'Товар';
      const p = item.price || item.Цена || item.Ціна || '0';
      return `- ${name}: ${p} грн`;
    }).join('\n');

    const total = cart.reduce((sum, item) => {
      const val = item.price || item.Цена || item.Ціна || 0;
      return sum + Number(val);
    }, 0);
    
    const message = `🛒 НОВЕ ЗАМОВЛЕННЯ\n\n👤 Телефон: ${phone}\n\n📦 Товари:\n${itemsList}\n\n💰 РАЗОМ: ${total} грн`;

    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: message });
      alert('Замовлення надіслано!');
      setCart([]);
      setPhone('');
      setIsCartOpen(false);
    } catch (e) { 
      alert('Помилка при відправці'); 
    }
  };

  // Тут теж додаємо перевірку на існування поля перед toLowerCase
  const filtered = products.filter(p => {
    const title = (p.title || p.Название || p.Найменування || '').toString();
    return title.toLowerCase().includes(search.toLowerCase());
  });

  // Далі йде твій return (...) без змін
