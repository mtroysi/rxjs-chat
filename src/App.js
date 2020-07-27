import React, { useEffect, useState, useRef } from 'react'
import { Observable, fromEvent } from 'rxjs'
import { distinctUntilChanged, filter, pluck, throttleTime } from 'rxjs/operators'
import * as io from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:8080') // replce this url by the ngrok url if you want to join existing chat

// Observable pour la réception des messages envoyés par le serveur
const observable = new Observable(subscriber => {
  socket.on('new-message', (message) => {
    subscriber.next(message)
  })
})

const usersObservable = new Observable(subscriber => {
  socket.on('refresh-users', (users) => {
    console.log('here')
    subscriber.next(users)
  })
})

// Observable pour la validation du username
const usernameObservable = new Observable(subscriber => {
  socket.on('new-user', (response) => {
    if (response.ok) {
      subscriber.next(response)
    } else {
      subscriber.error('This username is already taken.')
    }
  })
})

const getHeureMinutes = () => {
  const date = new Date()
  const hour = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hour}h${minutes}`
}

const App = () => {
  const [username, setUsername] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const textInput = useRef(null)
  const usernameInput = useRef(null)

  const handleChange = e => setText(e.target.value)

  useEffect(() => {
    const subscription = observable.subscribe(message => setMessages([...messages, message]))

    return () => subscription.unsubscribe()
  }, [messages])

  useEffect(() => {
    const subscription = usersObservable.subscribe(users => {
      setUsers(users)
      console.log(users)
    })

    return () => subscription.unsubscribe()
  })

  useEffect(() => {
    // Envoi des messages au serveur via la touche Entrée (ne fonctionne pas en dehors du useEffect, #text-input pas initialisé ?)
    if (textInput.current) {
      textInput.current.focus()
      const inputSubscription = fromEvent(textInput.current, 'keyup').pipe(
        filter(e => e.keyCode === 13),
        throttleTime(1000),
        pluck('target', 'value'),
        distinctUntilChanged(),
        filter((message) => message.trim().length > 0),
      ).subscribe(value => {
        socket.emit('new-message', { author: username, content: value, time: getHeureMinutes() })
        setText('')
      })
      return () => inputSubscription.unsubscribe()
    }
  }, [username])

  useEffect(() => {
    // Envoi du username au serveur via la touche Entrée
    if (usernameInput.current) {
      usernameInput.current.focus()
      const usernameSubscription = fromEvent(usernameInput.current, 'keyup').pipe(
        filter(e => e.keyCode === 13),
        pluck('target', 'value'),
      ).subscribe(value => {
        socket.emit('new-user', { username: value })
      })
      return () => usernameSubscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const subscription = usernameObservable.subscribe({
      next (response) { setUsername(response.username) },
      error (errorMsg) { setError(errorMsg) }
    })

    return () => subscription.unsubscribe()
  })

  return (
    <div className="App">
      <div className="header"><h1>Welcome to RxJS-chat !</h1></div>
      {!username &&
      <div className="username-container">
        <h2>Choose a username</h2>
        <div>
          <input id="username-input" type="text" placeholder="Type your username here" ref={usernameInput} />
          <span className="info">Press Enter to confirm</span>
        </div>
      </div>}
      {!username && error && <p className="error">{error}</p>}

      {username &&
      <div className="screen">
        <div className="users">
        <h2>{'Who\'s online ?'}</h2>
          <ul>{users.map(user => <li key={user}>{user}</li>)}</ul>
        </div>
        <div className="chatbox">
          <div className="messages-container">
            {messages.map((message, index) =>
              <div className="message-container" key={`${username}_${index}`}>
                <div className="message">{`${message.content}`}</div>
                <div className="author">{`${message.author} · ${message.time}`}</div>
              </div>)}
          </div>
          <div className="text-container">
            <input id="text-input" type="text" placeholder="Type your text here" value={text} ref={textInput} onChange={handleChange} />
            <span className="info">Press Enter to send your message</span>
          </div>
        </div>
      </div>}
    </div>
  )
}

export default App
