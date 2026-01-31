const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.notifyNewOrder = functions.firestore
    .document("orders/{orderId}")
    .onCreate(async (snap, context) => {
      const order = snap.data();
      const orderId = context.params.orderId;

      try {
        // Get bot credentials from settings
        const settingsSnap = await admin.firestore()
            .doc("settings/config")
            .get();
        
        if (!settingsSnap.exists()) {
          console.error("Settings not found");
          return null;
        }

        const { telegramBotToken, telegramChatId } = settingsSnap.data();

        if (!telegramBotToken || !telegramChatId) {
          console.error("Telegram credentials missing in settings");
          return null;
        }

        // Format message
        const itemsList = order.items
            .map((item) => `• ${item.name} x ${item.quantity} (${item.price} ₽)`)
            .join("\n");

        const message = `
🚀 *Новый заказ!*
№: \`${orderId.slice(-6).toUpperCase()}\`
Дата: ${new Date().toLocaleString("ru-RU")}

👤 *Клиент:*
Имя: ${order.name || "Не указано"}
Тел: ${order.phone || "Не указано"}
Email: ${order.userEmail || "Не указано"}
TG: ${order.telegram || "Не указано"}

📦 *Состав заказа:*
${itemsList}

💰 *Итого:* ${order.totalPrice} ₽
📍 *Способ доставки:* ${order.delivery || order.deliveryMethod || "Не указано"}
💬 *Комментарий:* ${order.comment || "Нет"}
        `.trim();

        // Send to Telegram
        await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          chat_id: telegramChatId,
          text: message,
          parse_mode: "Markdown",
        });

        console.log("Telegram notification sent successfully");
      } catch (error) {
        console.error("Error sending telegram notification:", error);
      }
      return null;
    });
