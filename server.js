const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// constant
const PORT = 8100
const msgType = {
  unknown: 'UNKNOWN',
  error: 'ERROR',
  register: 'REGISTER',
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
    success: success,
    users: Object.keys(users)
  }
}

function getErrorResult() {
  return { type: msgType.error }
}

io.on('connection', function(connection) {
  console.log('user connected')

  connection.on('message', function(message) {
    let data
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
        break;
      }
    
      default:
        sendTo(connection, getErrorResult())
        break;
    }
  })

  connection.on('close', function() {
    if (connection.name) {
      delete users[connection.name]
    }
  })

})

http.listen(PORT, function() {
  console.log(`> listen on *:${PORT}`)
})