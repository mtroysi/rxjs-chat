import React, { useEffect, useState, useRef } from 'react';
import { Observable, fromEvent } from 'rxjs'
import { filter, pluck } from "rxjs/operators";
import * as io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:8080');

// Observable pour la réception des messages envoyés par le serveur
let observable = new Observable(subscriber => {
  socket.on('new-message', (message) => {
    subscriber.next(message);
  });
})

const App = () => {
  const [username, setUsername] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const textInput = useRef(null);
  const usernameInput = useRef(null);

  const handleChange = e => setText(e.target.value)

  useEffect(() => {
    let subscription = observable.subscribe(message => setMessages([...messages, message]))

    return () => subscription.unsubscribe()
  })

  useEffect(() => {
    // Envoi des messages au serveur via la touche Entrée (ne fonctionne pas en dehors du useEffect, #text-input pas initialisé ?)
    if (document.getElementById("text-input")) {
      textInput.current.focus()
      let inputSubscription = fromEvent(document.getElementById("text-input"), 'keyup').pipe(
        filter(e => e.keyCode === 13),
        pluck('target', 'value'),
      ).subscribe(value => {
        socket.emit('new-message', { author: username, content: value });
        setText('')
      })
      return () => inputSubscription.unsubscribe();
    }
  })

  useEffect(() => {
    // Envoi du username au serveur via la touche Entrée
    if (document.getElementById("username-input")) {
      usernameInput.current.focus()
      let usernameSubscription = fromEvent(document.getElementById("username-input"), 'keyup').pipe(
        filter(e => e.keyCode === 13),
        pluck('target', 'value'),
      ).subscribe(value => {
        socket.emit('new-user', { username: value });
        setUsername(value)
      })
      return () => usernameSubscription.unsubscribe();
    }
  })

  return (
    <div className="App">
      {!username && 
      <div>
        <h1>Choose a username</h1>
        <input id="username-input" type="text" placeholder="Type your username here" ref={usernameInput} />
      </div>}

      {username &&
      <div className="chatbox">
        <h1>Welcome in RxJS-chat !</h1>
        {messages.map(message => <div>{`${message.author} > ${message.content}`}</div>)}
        <input id="text-input" type="text" placeholder="Type your text here" value={text} ref={textInput} onChange={handleChange} />
      </div>}
    </div>
  );
}

export default App;
