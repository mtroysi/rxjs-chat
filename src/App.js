import React, {useEffect, useState} from 'react';
import { Observable } from 'rxjs'
import * as io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:8080');

let observable = new Observable(subscriber => {
  socket.on('new-message', (message) => {
    subscriber.next(message);
  });
})

function App() {
  const [messages, setMessages] = useState([{ author: 'Morgane', content: 'Hello there' }, { author: 'Anon', content: 'General Kenobi' }]);
  const [text, setText] = useState('')

  const handleChange = e => setText(e.target.value)
  const handleSubmit = e => {
    e.preventDefault()
    socket.emit('new-message', { author: 'Morgane', content: text });
    setText('')
  }

  useEffect(() => {
    let subscription = observable.subscribe(message => setMessages([...messages, message]))

    return () => subscription.unsubscribe()
  })

  return (
    <div className="App">
      <div className="chatbox">
        {messages.map(message => <div>{`${message.author} > ${message.content}`}</div>)}

        <form id="myForm" onSubmit={handleSubmit}>
          <input id="text-input" type="text" placeholder="Type your text here" value={text} onChange={handleChange} />
          <button type="submit">Send</button> 
        </form>
      </div>
    </div>
  );
}

export default App;
