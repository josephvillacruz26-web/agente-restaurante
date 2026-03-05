import { useState, useRef, useEffect } from "react";

// ⚠️ Reemplaza con tu API key de Google Gemini
const GEMINI_API_KEY ="AIzaSyDbOXrmZHWQnS_2zH2xTUIHfYUNf5voVu0";

const RESTAURANT = {
  name: "La Buena Mesa",
  emoji: "🍽️",
  description: "Restaurante criollo peruano en Miraflores, Lima",
  info: {
    horario: "Lunes a Domingo de 12:00pm a 10:00pm",
    direccion: "Av. Larco 345, Miraflores, Lima",
    telefono: "01-445-6789",
    delivery: "Sí, via Rappi y PedidosYa. También delivery propio para pedidos mayores a S/50.",
    reservas: "Sí aceptamos reservas. Llama al 01-445-6789 o escríbenos aquí.",
    pagos: "Efectivo, Yape, Plin, tarjetas Visa y Mastercard.",
    estacionamiento: "Sí, tenemos playa de estacionamiento gratuita para clientes.",
    menu: [
      { nombre: "Lomo Saltado", precio: "S/38", descripcion: "Clásico peruano con lomo fino, tomate, cebolla y papas fritas" },
      { nombre: "Ceviche Clásico", precio: "S/42", descripcion: "Pescado fresco del día, limón, ají limo y choclo" },
      { nombre: "Arroz con Leche", precio: "S/15", descripcion: "Postre tradicional con canela y coco rallado" },
      { nombre: "Aji de Gallina", precio: "S/32", descripcion: "Pollo desmenuzado en salsa de ají amarillo con arroz" },
      { nombre: "Chicharrón de Cerdo", precio: "S/35", descripcion: "Cerdo crocante con camote y sarza criolla" },
      { nombre: "Causa Limeña", precio: "S/28", descripcion: "Papa amarilla con atún, palta y mayonesa" },
    ]
  }
};

const SYSTEM_PROMPT = `Eres el asistente virtual de "${RESTAURANT.name}", un ${RESTAURANT.description}. 
Tu trabajo es atender a los clientes de forma amable, cálida y eficiente.

INFORMACIÓN DEL RESTAURANTE:
- Horario: ${RESTAURANT.info.horario}
- Dirección: ${RESTAURANT.info.direccion}
- Teléfono: ${RESTAURANT.info.telefono}
- Delivery: ${RESTAURANT.info.delivery}
- Reservas: ${RESTAURANT.info.reservas}
- Métodos de pago: ${RESTAURANT.info.pagos}
- Estacionamiento: ${RESTAURANT.info.estacionamiento}

MENÚ PRINCIPAL:
${RESTAURANT.info.menu.map(p => `- ${p.nombre} (${p.precio}): ${p.descripcion}`).join("\n")}

INSTRUCCIONES:
- Responde SIEMPRE en español
- Sé amable, cálido y usa emojis ocasionalmente
- Si preguntan algo que no sabes, di que los comunicas con el equipo
- Respuestas cortas y directas (máximo 3-4 líneas)
- Si quieren hacer un pedido o reserva, pide sus datos y confirma
- Nunca inventes precios ni información que no tienes`;

const QUICK_QUESTIONS = [
  "¿Cuál es el horario?",
  "¿Tienen delivery?",
  "¿Cómo puedo reservar?",
  "¿Cuáles son los precios?",
  "¿Dónde están ubicados?",
  "¿Qué métodos de pago aceptan?",
];

export default function RestaurantAgent() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `¡Hola! 👋 Bienvenido a **${RESTAURANT.name}** 🍽️\n\nSoy tu asistente virtual. ¿En qué te puedo ayudar hoy?\n\nPuedes preguntarme sobre nuestro menú, horarios, reservas, delivery y más.`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(1, -1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [
              ...history,
              { role: "user", parts: [{ text: userText }] }
            ],
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
          })
        }
      );

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, hubo un error. Por favor intenta de nuevo.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un problema de conexión. 😔 Por favor intenta de nuevo." }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      return <div key={i} dangerouslySetInnerHTML={{ __html: formatted || "&nbsp;" }} />;
    });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#1a0a00", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "1rem",
      fontFamily: "'Crimson Pro', Georgia, serif",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(200,100,0,0.15) 0%, transparent 70%)"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .msg-bubble { animation: fadeUp 0.3s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .quick-btn { transition: all 0.15s; cursor: pointer; background: rgba(200,100,0,0.1); border: 1px solid rgba(200,100,0,0.3); color: #d4845a; border-radius: 20px; padding: 0.4rem 0.9rem; font-family: 'DM Mono', monospace; font-size: 0.72rem; white-space: nowrap; }
        .quick-btn:hover { background: rgba(200,100,0,0.2); border-color: #d4845a; color: #f0a070; }
        .send-btn { transition: all 0.2s; cursor: pointer; background: linear-gradient(135deg, #c85a00, #e07030); color: white; border: none; border-radius: 10px; padding: 0.7rem 1.2rem; font-family: 'DM Mono', monospace; font-size: 0.85rem; }
        .send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(200,90,0,0.4); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .chat-input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(200,100,0,0.2); border-radius: 10px; padding: 0.7rem 1rem; color: #f0d0b0; font-family: 'Crimson Pro', serif; font-size: 1rem; outline: none; }
        .chat-input:focus { border-color: rgba(200,100,0,0.5); }
        .chat-input::placeholder { color: #6a3a20; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(200,100,0,0.3); border-radius: 2px; }
        .typing-dot { animation: blink 1.2s infinite; display: inline-block; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,100%{opacity:0.2} 50%{opacity:1} }
      `}</style>

      <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", height: "90vh", maxHeight: "700px" }}>
        <div style={{ background: "linear-gradient(135deg, #2a1000, #3a1800)", border: "1px solid rgba(200,100,0,0.3)", borderRadius: "16px 16px 0 0", padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem", borderBottom: "1px solid rgba(200,100,0,0.2)" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #c85a00, #e07030)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>🍽️</div>
          <div>
            <div style={{ color: "#f0a060", fontWeight: "600", fontSize: "1rem" }}>{RESTAURANT.name}</div>
            <div style={{ color: "#8a5030", fontSize: "0.75rem", fontFamily: "'DM Mono', monospace" }}>
              <span style={{ color: "#4a9a4a", marginRight: "4px" }}>●</span> Asistente en línea
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#6a3a20", textAlign: "right" }}>DEMO<br/>Agente IA</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "rgba(10,4,0,0.8)", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {messages.map((msg, i) => (
            <div key={i} className="msg-bubble" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "0.5rem", alignItems: "flex-end" }}>
              {msg.role === "assistant" && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #c85a00, #e07030)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>🍽️</div>
              )}
              <div style={{ maxWidth: "78%", padding: "0.7rem 1rem", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #c85a00, #e07030)" : "rgba(255,255,255,0.06)", border: msg.role === "user" ? "none" : "1px solid rgba(200,100,0,0.15)", color: msg.role === "user" ? "white" : "#e0c0a0", fontSize: "0.95rem", lineHeight: "1.5" }}>
                {formatText(msg.content)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg-bubble" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #c85a00, #e07030)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>🍽️</div>
              <div style={{ padding: "0.7rem 1rem", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,100,0,0.15)" }}>
                <span className="typing-dot" style={{ color: "#d4845a" }}>●</span>
                <span className="typing-dot" style={{ color: "#d4845a" }}> ●</span>
                <span className="typing-dot" style={{ color: "#d4845a" }}> ●</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ background: "rgba(10,4,0,0.9)", padding: "0.6rem 1rem", borderTop: "1px solid rgba(200,100,0,0.1)", overflowX: "auto", display: "flex", gap: "0.5rem", scrollbarWidth: "none" }}>
          {QUICK_QUESTIONS.map((q, i) => (
            <button key={i} className="quick-btn" onClick={() => sendMessage(q)}>{q}</button>
          ))}
        </div>

        <div style={{ background: "rgba(15,6,0,0.95)", padding: "0.8rem 1rem", borderRadius: "0 0 16px 16px", border: "1px solid rgba(200,100,0,0.3)", borderTop: "none", display: "flex", gap: "0.6rem" }}>
          <input ref={inputRef} className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Escribe tu pregunta..." disabled={loading} />
          <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>Enviar</button>
        </div>
      </div>

      <div style={{ marginTop: "0.8rem", fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#4a2a10", textAlign: "center" }}>
        Este es un demo — personalizable para cualquier negocio
      </div>
    </div>
  );
}

