# Аксиома — сайт

Статический сайт (HTML/CSS/JS), сборка не нужна. Подходит любой статический хостинг (GitHub Pages, Netlify, Vercel, обычный хостинг).

- `index.html` — главная: Земля (видео), проекты, услуги, как работаем, о компании, контакты с ИИ-ассистентом
- `agents.html` — страница услуги «ИИ-агенты»
- `config.js` — **настройки: номер WhatsApp и адрес API ассистента**
- `script.js` — навигация, анимации, звёздное небо, видео Земли
- `chat.js` — ИИ-ассистент на сайте
- `assets/` — логотип, видео Земли (WebM + MP4 + постер), скриншоты Mango Fruits

## Перед публикацией

1. В `config.js` укажите `whatsappNumber` — номер в международном формате, только цифры (например `77011234567`).
2. Видео Земли: NASA Scientific Visualization Studio, «Black Marble 2016 (Rotating Globe)», https://svs.gsfc.nasa.gov/30878/ — авторство указано в подвале. Правила использования материалов NASA: https://www.nasa.gov/multimedia/guidelines/index.html

## Подключение API ассистента

В `config.js` укажите `chatApiUrl`. Пока он пустой, ассистент отвечает заготовленными ответами.

Запрос:

```http
POST {chatApiUrl}
Content-Type: application/json

{ "sessionId": "uuid", "message": "текст посетителя", "history": [{"role":"user|assistant","content":"..."}] }
```

Ответ `200`:

```json
{ "reply": "текст ассистента" }
```

Если API на другом домене — нужен CORS. Ключи моделей храните только на сервере.
