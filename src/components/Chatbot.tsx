import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { MessageCircle, Send, Loader2, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Define the structure of a message
interface Message {
  role: 'user' | 'model' | 'system'; // 'system' can be included for clarity
  parts: { text: string }[];
}

// AMÉLIORATION: Définir la constante en dehors du composant
// pour éviter de la recréer à chaque rendu.
const systemPrompt: Message = {
  role: 'system',
  parts: [{ text: 'You are WeatherBot, a friendly and helpful weather assistant. Your goal is to answer user questions about weather, climate, and related activities. Respond in English by default, unless the user asks for a different language. Keep your answers concise and easy to understand. You can use emojis to make the conversation more engaging.' }],
};


export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialise avec un message de bienvenue du bot si la conversation est vide.
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        parts: [{ text: "👋 Hi! I'm WeatherBot. Ask me anything about weather, climate, or planning activities!" }]
      }]);
    }
  }, []); // Note: ce hook ne se déclenchera qu'une seule fois au montage initial.

  useEffect(() => {
    // Défilement automatique vers le bas lors de l'ajout de nouveaux messages
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    
    // Utilisation d'une fonction de mise à jour pour garantir l'accès à l'état le plus récent
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // L'historique envoyé au backend doit inclure le message système et la conversation la plus récente
    const conversationHistory = [systemPrompt, ...newMessages];

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chatbot', {
        body: { messages: conversationHistory },
      });

      if (error) {
        throw error; // Cette erreur est celle que vous voyez (FunctionsHttpError)
      }

      if (data instanceof ReadableStream) {
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        // Ajoute un placeholder pour la réponse du bot
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                if (json.text) {
                  fullResponse += json.text;
                  // Met à jour le dernier message (le placeholder du bot) avec le texte reçu
                  setMessages(prev => {
                    const updatedMessages = [...prev];
                    updatedMessages[updatedMessages.length - 1].parts[0].text = fullResponse;
                    return updatedMessages;
                  });
                }
              } catch (error) {
                console.error('Failed to parse stream chunk:', error);
              }
            }
          }
        }
      } else {
        // Ce cas se produit si la fonction backend renvoie quelque chose qui n'est pas un flux
        throw new Error('Response was not a stream.');
      }

    } catch (error) {
      // Le code arrive ici lorsque la fonction Edge renvoie une erreur (status 500)
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: 'Désolé, une erreur est survenue. Veuillez réessayer.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg">
          <MessageCircle size={28} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Bot /> WeatherBot Assistant
          </DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              // On filtre le message système pour ne pas l'afficher dans l'UI
              msg.role !== 'system' && (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'model' && <Bot className="w-6 h-6 text-blue-500 flex-shrink-0" />}
                  <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                  </div>
                  {msg.role === 'user' && <User className="w-6 h-6 text-gray-500 flex-shrink-0" />}
                </div>
              )
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Bot className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div className="p-3 rounded-lg bg-gray-100">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DrawerFooter>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez une question..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Send size={18} />
            </Button>
          </form>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}