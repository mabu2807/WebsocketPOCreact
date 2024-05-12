import React, { useState, useEffect } from 'react';
import './App.css';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export const App = () => {
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    setStompClient(client);

    client.connect({}, () => {
      console.log('Connected to WS!');
      setConnected(true);
      client.subscribe('/topic/message', (message) => {
        const receivedMessage = JSON.parse(message.body);
        console.log("Received message:", receivedMessage); // Loggen der empfangenen Nachricht
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg.id === receivedMessage.id);
          console.log("Message exists:", messageExists); // Überprüfen, ob die Nachricht bereits existiert
          if (!messageExists) {
            return [...prevMessages, receivedMessage];
          }
          return prevMessages;
        });
      });
    }, error => {
      console.error('Failed to connect:', error);
      setConnected(false);
    });

    return () => {
      if (connected && client) {
        client.disconnect(() => {
          console.log('Disconnected');
          setConnected(false);
        });
      }
    };
  }, []); // Achten Sie darauf, dass keine ungewollten Abhängigkeiten hier eingeführt werden

  const sendMessage = () => {
    if (message.trim() && connected && stompClient) {
      const chatMessage = { nickname, message };
      console.log("Sending message:", chatMessage);
      stompClient.send("/app/chat", {}, JSON.stringify(chatMessage));
      setMessage(""); // Nachrichtenfeld leeren nach dem Senden
    } else {
      console.log("Connection not established or message empty.");
    }
  };

  return (
    <div className="App">
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}> {/* Stellen Sie sicher, dass msg.id eindeutig ist */}
            <h3>{msg.nickname}</h3>
            <p>{msg.message}</p>
          </li>
        ))}
      </ul>
      <input type="text" placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      <input type="text" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default App;
