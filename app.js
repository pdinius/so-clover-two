const socketIO = require('socket.io')
const express = require('express')
const utils = require('./utils')

const app = express()

const _WORDS = require('./static/word-list.json')
const _PORT = process.env.PORT || 3000

let players = {}
let playerNames = []
let philID
let guessing = false
let answersSnapshot = []
let usedCards = []
let answersIdx = -1

app.use(express.static('public'))
let server = app.listen(_PORT, () => console.log(`Listening on ${_PORT}`))

const io = socketIO(server)

function newCard() {
    let n
    do {
        n = Math.floor(Math.random() * _WORDS.length)
    } while (usedCards.includes(n))
    usedCards.push(n)
    return {
        id: n,
        words: _WORDS[n],
        offset: Math.floor(Math.random() * 4)
    }
}

function getFinishedPlayerPartition() {
    return playerNames.reduce((a, b) => {
        players[b].answers ? a[0].push(b) : a[1].push(b)
        return a
    }, [[], []])
}

function nextCloverGuess() {
    ++answersIdx
    return currCloverGuess()
}

function currCloverGuess() {
    return {
        cloverData: answersSnapshot[answersIdx],
        isLast: answersIdx === answersSnapshot.length - 1
    }
}

function offsetter(arr, offset) {
    return arr.slice(offset).concat(arr.slice(0, offset))
}

io.on('connection', socket => {
    // console.log(socket.handshake.headers.referer)
    io.to(socket.id).emit('disconnected-users', Object.keys(players).filter(v => players[v].disconnected))

    socket.on('name-selection', name => {
        if (players[name]) {
            io.to(socket.id).emit('showAlert', 'That name is already in use!')
        } else {
            if (name === 'Phil') philID = socket.id
            playerNames.push(name)
            players[name] = {
                name,
                id: socket.id,
                clover: {
                    'top-left': newCard(),
                    'top-right': newCard(),
                    'bottom-left': newCard(),
                    'bottom-right': newCard(),
                    'extra': newCard()
                },
                disconnected: false
            }
            let cloverToSend = {
                'top-left': offsetter(players[name].clover['top-left'].words, players[name].clover['top-left'].offset),
                'top-right': offsetter(players[name].clover['top-right'].words, players[name].clover['top-right'].offset),
                'bottom-left': offsetter(players[name].clover['bottom-left'].words, players[name].clover['bottom-left'].offset),
                'bottom-right': offsetter(players[name].clover['bottom-right'].words, players[name].clover['bottom-right'].offset),
            }
            io.to(socket.id).emit('send-clover', cloverToSend)
        }
    })

    socket.on('reconnect-as', name => {
        players[name].id = socket.id
        players[name].disconnected = false
        playerNames.push(name)
        if (name === 'Phil') {
            philID = socket.id
            if (guessing) {
                io.to(philID).emit('lets-make-guesses', currCloverGuess())
                return
            }
        }
        if (!players[name].answers) {
            io.to(socket.id).emit('send-clover', players[name].clover)
        } else {
            io.to(socket.id).emit('unfinished-players', getFinishedPlayerPartition())
            io.emit('end-anim')
        }
    })

    socket.on('submit-clues', answerKey => {
        let name = playerNames.find(v => players[v].id === socket.id)
        players[name].answers = answerKey
        let [finishedPlayers, unfinishedPlayers] = getFinishedPlayerPartition()
        finishedPlayers.forEach(v => io.to(players[v].id).emit('unfinished-players', [finishedPlayers, unfinishedPlayers]))
        if (!unfinishedPlayers.length) {
            guessing = true
            answersSnapshot = Object.values(players).filter(v => v.answers)
            io.emit('showAlert', "Time to guess! Let's go to the google call")
            io.emit('end-anim')
            io.to(philID).emit('lets-make-guesses', nextCloverGuess())
        }
    })

    socket.on('get-next-clover', () => {
        io.to(philID).emit('lets-make-guesses', nextCloverGuess())
    })

    socket.on('start-new-round', () => {
        guessing = false
        answersSnapshot = []
        usedCards = []
        answersIdx = -1
        playerNames.forEach(name => {
            players[name].clover = {
                'top-left': newCard(),
                'top-right': newCard(),
                'bottom-left': newCard(),
                'bottom-right': newCard(),
                'extra': newCard()
            }
            let cloverToSend = {
                'top-left': offsetter(players[name].clover['top-left'].words, players[name].clover['top-left'].offset),
                'top-right': offsetter(players[name].clover['top-right'].words, players[name].clover['top-right'].offset),
                'bottom-left': offsetter(players[name].clover['bottom-left'].words, players[name].clover['bottom-left'].offset),
                'bottom-right': offsetter(players[name].clover['bottom-right'].words, players[name].clover['bottom-right'].offset),
            }
            delete players[name].answers
            io.to(players[name].id).emit('send-clover', cloverToSend)
        })
    })

    socket.on('reset-game', () => {
        players = {}
        playerNames = []
        philID = undefined
        guessing = false
        answersSnapshot = []
        usedCards = []
        answersIdx = -1
    })

    socket.on('disconnect', () => {
        // find who disconnected
        let disconnector = playerNames.find(v => players[v].id === socket.id)
        if (disconnector) {
            players[disconnector].disconnected = true
            playerNames.splice(playerNames.indexOf(disconnector), 1)
        }
        if (!playerNames.length) {
            players = {}
            playerNames = []
            philID = undefined
            guessing = false
            answersSnapshot = []
            usedCards = []
            answersIdx = -1
        }
        console.log(`${disconnector || 'someone'} disconnected`)
    })
})