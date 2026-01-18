// chatgptbot.js - Versión que delega las respuestas a ChatGPT con toda la información

// Al inicio de tu archivo
const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');
const cors = require('cors');
// require('dotenv').config();




// Configuración básica
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Memoria de chat
const chats = new Map();

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Datos de aniversarios
const aniversarios = [
  {nom: "César Márquez García", mes: 4, dia: 4, telefono: "660823474"},
  {nom: "Ángela", mes: 8, dia: 5},
  {nom: "Carlos Herrero", mes: 6, dia: 13, telefono: "653754789"},
  {nom: "Fermín", mes: 10, dia: 6, telefono: "687627716"},
  {nom: "Javier Alcázar", mes: 10, dia: 11, telefono: "654775970"},
  {nom: "Josele", mes: 4, dia: 4, telefono: "610283728"},
  {nom: "MªJosé García", mes: 7, dia: 19},
  {nom: "Óscar Guardado", mes: 8, dia: 6, telefono: "639975491"},
  {nom: "Yolanda Vicente", mes: 6, dia: 11, telefono: "628822655"},
  {nom: "Yolanda Martín", mes: 7, dia: 18, telefono: "678522965"},
  {nom: "Txema", mes: 12, dia: 10, telefono: "679208956"},
  {nom: "Tito", mes: 3, dia: 26, telefono: "676123034"},
  {nom: "Rubén Claver", mes: 7, dia: 16, telefono: "677258709"},
  {nom: "Rosa Garriz", mes: 1, dia: 30, telefono: "617078769"},
  {nom: "Roberto León", mes: 12, dia: 4, telefono: "678572513"},
  {nom: "Ricardo Sirera", mes: 2, dia: 24, telefono: "692869224"},
  {nom: "Rafa Xampeny", mes: 2, dia: 19, telefono: "609085519"},
  {nom: "Pedro Cilleruelo", mes: 7, dia: 11, telefono: "693056907"},
  {nom: "Nuria Romero", mes: 2, dia: 15, telefono: "655127039"},
  {nom: "Mónica Sánchez", mes: 1, dia: 5, telefono: "619455954"},
  {nom: "Mónica Pérez", mes: 12, dia: 7, telefono: "627954101"},
  {nom: "Mónica Fernández", mes: 5, dia: 6, telefono: "686690002"},
  {nom: "Mar Gutiérrez", mes: 9, dia: 17, telefono: "629403109"},
  {nom: "Lyss Miró", mes: 11, dia: 14, telefono: "621182162"},
  {nom: "Luqui Luján", mes: 9, dia: 22, telefono: "625946641"},
  {nom: "Loli Arjona", mes: 3, dia: 20, telefono: "687460703"},
  {nom: "Juanjo Hierro", mes: 8, dia: 9, telefono: "639948864"},
  {nom: "Juan Luis López", mes: 9, dia: 13, telefono: "649144350"},
  {nom: "José Antonio Pérez", mes: 10, dia: 23, telefono: "636091794"},
  {nom: "Joel Solana", mes: 2, dia: 2, telefono: "649911518"},
  {nom: "Javier Castilla", mes: 4, dia: 19, telefono: "630575368"},
  {nom: "Ismael Sopena", mes: 8, dia: 11, telefono: "610897315"},
  {nom: "Irene Martínez", mes: 12, dia: 20, telefono: "659474612"},
  {nom: "Elena Andújar", mes: 1, dia: 21, telefono: "676785714"},
  {nom: "Carles Boldú", mes: 1, dia: 21, telefono: "647738522"},
  {nom: "Cori Cuquejo", mes: 2, dia: 26, telefono: "647619220"},
  {nom: "Salud", mes: 2, dia: 26, telefono: "646823473"},
  {nom: "Conchi Navarro", mes: 6, dia: 17, telefono: "678761063"},
  {nom: "Conchi Chueca", mes: 5, dia: 20, telefono: "616199200"},
  {nom: "Pilar Charles", mes: 4, dia: 27, telefono: "629537533"},
  {nom: "David Rosique", mes: 3, dia: 19, telefono: "660595167"}
];

// Información sobre Caterina Albert
const infoCaterinaAlbert = `Caterina Albert i Paradís (l'Escala, 11 de setembre de 1869 - l'Escala, 27 de gener de 1966), coneguda pel nom de ploma Víctor Català, fou una escriptora catalana, autora de la novel·la Solitud (1905), una de les obres literàries cabdals del modernisme. També va desenvolupar una carrera com a pintora, escultora i dibuixant.

El premi als Jocs Florals del 1898 va representar el primer reconeixement de la seva capacitat literària. No trigaria gaire temps a utilitzar el pseudònim de Víctor Català, nom del protagonista d'una novel·la seva inacabada. Malgrat l'entusiasme que va manifestar pel món del teatre i els seus inicis poètics, el gènere que va dominar millor és el narratiu. La força del seu estil i la gran riquesa lèxica són elements definitoris del conjunt de la seva obra.

Les seves obres més importants són: 
- La infanticida (1898)
- Drames rurals (1902)
- Solitud (1905), la seva obra més coneguda
- Caires vius (1907)
- Un film (3.000 metres) (1926)`;

// Información sobre la escuela Víctor Català
const infoEscuelaVictorCatala = `L'escola Víctor Català fou fundada l'any 1970, junt amb dues escoles més, en una època d'alt creixement demogràfic a la zona. El nostre centre té un arrelament molt gran al barri i, actualment, força ex-alumnes de l'escola hi porten els seus fills i filles i participen de les activitats de l'escola i de l'AFA.

El seu nom li ve donat pel pseudònim de l'escriptora Caterina Albert i Paradís, que va viure a l'Escala (Alt Empordà) tota la seva vida (11.09.1869 fins 27.01.1966). Allà desenvolupà la seva obra artística: poesia, contes i novel·la, a més a més de participar en diverses publicacions i revistes del moment.

El pseudònim de Víctor Català la va protegir de les crítiques que en aquell temps suscitava el fet de ser una dona escriptora, especialment perquè representava el món rural de la seva època de manera brutal i desagradable.

Ubicació:
Escola Víctor Català
Font d'en Canyelles 35
08016 Barcelona
Tel. 933 590 946
a8002538@xtec.cat`;

// Mensaje sobre la reunión
const infoReunion = `El Vermut i dinar Can Cuixart s'ha CANCEL·LAT! Ara tenim un Doodle per escollir quin dia va millor, si us plau escull la teva opció: https://doodle.com/group-poll/participate/avRKK4La
El creador del grup és en @Luqui!`;

// Endpoint de estado
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', time: new Date().toISOString() });
});

// Endpoint para el chat
app.post('/api/chat', async (req, res) => {
  try {
    const { chatInput, sessionId } = req.body;
    console.log('Mensaje recibido:', chatInput);
    
    // Obtener historial de chat
    let chat = chats.get(sessionId) || [];
    chat.push({ role: 'user', content: chatInput });
    
    // Crear un prompt con toda la información
    const systemPrompt = {
      role: "system",
      content: `Eres un asistente virtual que representa a Caterina Albert i Paradís (1869-1966), conocida por el pseudónimo de Víctor Català.

Respondes a preguntas sobre los siguientes temas:
1. Aniversarios y teléfonos de contacto
2. Información sobre Caterina Albert/Víctor Català
3. Información sobre la escuela Víctor Català
4. La fecha actual
5. Información sobre una reunión cancelada

DATOS DE ANIVERSARIOS Y TELÉFONOS:
${JSON.stringify(aniversarios, null, 2)}

INFORMACIÓN SOBRE CATERINA ALBERT:
${infoCaterinaAlbert}

INFORMACIÓN SOBRE LA ESCUELA VÍCTOR CATALÀ:
${infoEscuelaVictorCatala}

INFORMACIÓN IMPORTANTE SOBRE LA REUNIÓN (incluir siempre al final de cada respuesta):
${infoReunion}

FECHA ACTUAL:
${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

INSTRUCCIONES:
- Analiza la pregunta e identifica qué información se está solicitando.
- Si preguntan sobre aniversarios o teléfonos, busca en los datos proporcionados y responde con precisión.
- Si preguntan sobre Caterina Albert o la escuela, utiliza la información proporcionada.
- Si preguntan por la fecha, indica la fecha actual.
- Si preguntan sobre la reunión, proporciona la información sobre la cancelación y el Doodle.
- Si preguntan algo que no está en ninguna de estas categorías, responde que solo puedes ayudar con información sobre aniversarios, teléfonos, Caterina Albert, la escuela Víctor Català o la reunión.
- Adapta tu respuesta al idioma en que te pregunten (castellano o catalán).
- SIEMPRE incluye la información sobre la reunión cancelada al final de tu respuesta, sea cual sea la pregunta.`
    };
    
    try {
      // Obtener respuesta de ChatGPT
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [systemPrompt, ...chat.slice(-5)], // Incluimos más contexto para mejor conversación
        max_tokens: 800
      });
      
      const respuesta = completion.choices[0].message.content;
      
      // Guardar en historial
      chat.push({ role: 'assistant', content: respuesta });
      chats.set(sessionId, chat);
      
      return res.json({
        type: 'message',
        id: Date.now().toString(),
        content: respuesta
      });
    } catch (error) {
      console.error('Error de OpenAI:', error);
      
      return res.json({
        type: 'message',
        id: Date.now().toString(),
        content: "Lo siento, estoy teniendo problemas para procesar tu solicitud. ¿Podrías intentarlo de nuevo?\n\n" + infoReunion
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      type: 'error',
      content: 'Error interno del servidor'
    });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});