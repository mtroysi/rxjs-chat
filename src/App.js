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

// Observable pour la validation du username
let usernameObservable = new Observable(subscriber => {
  socket.on('new-user', (response) => {
    if (response.ok) {
     subscriber.next(response)
    } else {
      subscriber.error('Username already taken')
    }
  });
})

const App = () => {
  const [username, setUsername] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
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
      })
      return () => usernameSubscription.unsubscribe();
    }
  })

  useEffect(() => {
    let subscription = usernameObservable.subscribe({
      next(response) { setUsername(response.username) },
      error(errorMsg) { setError(errorMsg) }
    })

    return () => subscription.unsubscribe()
  })

  return (
    <div className="App">
      <div className="header"><h1>Welcome to RxJS-chat !</h1></div>
      {!username && 
      <div class="username-container">
        <h2>Choose a username</h2>
        <div>
          <input id="username-input" type="text" placeholder="Type your username here" ref={usernameInput} />
          <span class="info">Press Enter to confirm</span>
        </div>
      </div>}
      {!username && error && <p class="error">{error}</p>}

      {username &&
      <div className="chatbox">
        {messages.map(message => <div>{`${message.author} > ${message.content}`}</div>)}
        <input id="text-input" type="text" placeholder="Type your text here" value={text} ref={textInput} onChange={handleChange} />
      </div>}
    </div>
  );
}

export default App;
