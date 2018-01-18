const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// constant
const PORT = 8100
const msgType = {
  unknown: 'UNKNOWN',
  error: 'ERROR',
  register: 'REGISTER',
  candidate: 'CANDIDATE',
  offer: 'OFFER',
  anwser: 'ANSWER',
  leave: 'LEAVE',
  reject: 'REJECT',
}

// in-memory table
const users = {}

function sendTo(connection, message) {
  connection.send(JSON.stringify(message))
}

// action creater
function getRegisterResult(success) {
  return {
    type: msgType.register,
    success,
  }
}

function getErrorResult() {
  return { type: msgType.error }
}

function makeOffer(offer, name) {
  return {
    type: msgType.offer,
    offer,
    name,
  }
}

function makeAnwser(answer) {
  return {
    type: msgType.anwser,
    answer,
  }
}

function getCandidate(candidate) {
  return {
    type: msgType.candidate,
    candidate,
  }
}

function makeLeave() {
  return {
    type: msgType.leave,
  }
}

function makeReject() {
  return {
    type: msgType.reject,
  }
}

// end action creator

io.on('connection', function(connection) {
  console.log('user connected')

  connection.on('message', function(message) {
    let data
    console.log('got message', message)
    try {
      data = JSON.parse(message)
    } catch (error) {
      console.log('Invalid JSON')
      data = { type: msgType.unknown }
    }

    switch (data.type) {
      case msgType.register: {
        console.log('user register:', data.name)
        if (users[data.name]) {
          sendTo(connection, getRegisterResult(false))
        } else {
          users[data.name] = connection
          connection.name = data.name

          sendTo(connection, getRegisterResult(true))
        }
        break
      }

      case msgType.offer: {
        console.log("Sending offer to: ", data.name)
        const conn = users[data.name]

        if (conn) {
          connection.otherName = data.name
          sendTo(conn, makeOffer(data.offer, connection.name))
        }

        break
      }
      
      case msgType.anwser: {
        console.log("Sending answer to: ", data.name)
        const conn = users[data.name]

        if (conn) {
          connection.otherName = data.name
          sendTo(conn, makeAnwser(data.answer))
        }

        break
      }

      case msgType.candidate: {
        console.log("Sending candidate to:", data.name)
        const conn = users[data.name]

        if (conn) {
          sendTo(conn, getCandidate(data.candidate))
        }

        break;
      }

      case msgType.reject: {
        console.log("sending reject to:", data.name)
        const conn = users[data.name]

        if (conn) {
          sendTo(conn, makeReject())
        }

        break;
      }

      case msgType.leave: {
        console.log("Disconnecting from", data.name)
        const conn = users[data.name]
        conn.otherName = null

        // notify user to disconnect this peer
        if(conn) {
          sendTo(conn, makeLeave())
        }

        break;
      }
    
      default:
        sendTo(connection, getErrorResult())
        break
    }
  })

  connection.on('disconnect', function() {
    console.log('user left')
    if (connection.name) {
      delete users[connection.name]

      if (connection.otherName) {
        console.log("Disconnecting from ", connection.otherName)
        const conn = users[connection.otherName]
        conn.otherName = null

        if (conn) {
          sendTo(conn, makeLeave())
        }
      }
    }
  })

})

http.listen(PORT, function() {
  console.log(`> listen on *:${PORT}`)
})