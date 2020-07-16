import React, { useEffect, useState } from 'react';
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
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('')

  const handleChange = e => setText(e.target.value)
  const handleSubmit = e => e.preventDefault()

  useEffect(() => {
    let subscription = observable.subscribe(message => setMessages([...messages, message]))

    return () => subscription.unsubscribe()
  })

  useEffect(() => {
    // Observable pour l'envoi des messages au serveur via la touche Entrée (ne fonctionne pas en dehors du useEffect, #text-input pas initialisé ?)
    let inputObservable = fromEvent(document.getElementById("text-input"), 'keyup').pipe(
      filter(e => e.keyCode === 13),
      pluck('target', 'value'),
    )

    let inputSubscription = inputObservable.subscribe(value => {
      socket.emit('new-message', { author: 'Morgane', content: value });
      setText('')
    })

    return () => inputSubscription.unsubscribe();
  })

  return (
    <div className="App">
      <div className="chatbox">
        {messages.map(message => <div>{`${message.author} > ${message.content}`}</div>)}

        <form id="myForm" onSubmit={handleSubmit}>
          <input id="text-input" type="text" placeholder="Type your text here" value={text} onChange={handleChange} />
        </form>
      </div>
    </div>
  );
}

export default App;
