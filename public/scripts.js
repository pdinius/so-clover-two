const mockData = {
    "name": "NotPhil",
    "id": "8OZvbT9m0hYiD1n-AAAJ",
    "clover": {
        "top-left": {
            "id": 108,
            "words": [
                "Camera",
                "Bench",
                "Patron",
                "Stud"
            ],
            "offset": 1
        },
        "top-right": {
            "id": 161,
            "words": [
                "Ground",
                "Asia",
                "Glove",
                "Shape"
            ],
            "offset": 2
        },
        "bottom-left": {
            "id": 116,
            "words": [
                "Union",
                "Axe",
                "Board",
                "Button"
            ],
            "offset": 3
        },
        "bottom-right": {
            "id": 155,
            "words": [
                "Loop",
                "Stylist",
                "Pyramid",
                "Club"
            ],
            "offset": 2
        },
        "extra": {
            "id": 107,
            "words": [
                "Mother",
                "Match",
                "Rope",
                "Paradise"
            ],
            "offset": 0
        }
    },
    "disconnected": false,
    "answers": {
        clueKey: {
            'top': "poiu",
            'bottom': "lkjh",
            'right': ",nmb",
            'left': "hgfd",
        },
        "poiu": "Bench-Glove",
        "lkjh": "Loop-Axe",
        ",nmb": "Shape-Club",
        "hgfd": "Board-Camera"
    }
}


$(function () {
    const socket = io()
    const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left']    
    const shuffle = arr => {
        var m = arr.length, t, i;
        while (m) {
            i = Math.floor(Math.random() * m--);
            t = arr[m];
            arr[m] = arr[i];
            arr[i] = t;
        }
        return arr;
    }
    let cards = {}
    let clues  = {
        right: '',
        left: '',
        bottom: '',
        top: '',
    }
    let guessData
    let isLastGuess
    let animInterval

    function showAlert(str) {
        $('.alert-bar').html(str).css('opacity', '1')
        setTimeout(() => $('.alert-bar').css('opacity', '0'), 3000)
    }

    function updateButtons(redrawFunc) {
        $('.card-rotate-button').on('click', () => {
            $('.card-rotate-button').off()
            $('.clover-container').css('transform', `rotate(90deg)`)

            // update cards object
            let newCards = {
                'top-left': cards['bottom-left'],
                'top-right': cards['top-left'],
                'bottom-left': cards['bottom-right'],
                'bottom-right': cards['top-right'],
            }
            if (cards.unplaced) newCards.unplaced = cards.unplaced
            cards = newCards
            // update clues object
            if (guessData) {
                let temp = clues.right
                clues.right = clues.top
                clues.top = clues.left
                clues.left = clues.bottom
                clues.bottom = temp
            } else {
                let currClues = $('.clue-input').toArray().map(v => $(v).val())
                clues  = {
                    right: currClues[0],
                    left: currClues[1],
                    bottom: currClues[2],
                    top: currClues[3],
                }
            }
            corners.forEach(v => cards[v].length ? cards[v].unshift(cards[v].pop()) : null)
            setTimeout(redrawFunc, 200)
        })

        $('.submit-clues').on('click', submitClues)
    }

    function updateCardArrows() {
        
    }

    function submitClues() {
        let currClues = $('.clue-input').removeClass('error-input').toArray().map(v => $(v).val().trim())
        let cloverWords = [].concat(...Object.values(cards)).map(v => v.toLowerCase())
        let checks = [
            // empty clue check
            {
                check: () => currClues.reduce((a,b,i) => b ? a : [...a, i], []),
                message: 'You must fill in all the clues.'
            },
            // multiple word clue check
            {
                check: () => currClues.reduce((a,b,i) => b.match(/\s/) ? [...a, i] : a, []),
                message: 'You cannot have spaces in your clues.'
            },
            // illegal clue check (using a clover word)
            {
                check: () => currClues.reduce((a,b,i) => cloverWords.includes(b.toLowerCase()) ? [...a, i] : a, []),
                message: 'You cannot use one of the clover words.'
            },
            // duplicate clue check
            {
                check: () => currClues.reduce((a,b,i,v) => v.indexOf(b) !== v.lastIndexOf(b) ? [...a, i] : a, []),
                message: 'Your clues must all be unique.'
            },
        ]
        for (let check of checks) {
            err = check.check()
            if (err.length) {
                showAlert(check.message)
                err.forEach(n => $($('.clue-input').toArray()[n]).addClass('error-input'))
                return
            }
        }

        // submit clues
        answerKey = {
            clueKey: {
                'top': currClues[0],
                'bottom': currClues[1],
                'right': currClues[2],
                'left': currClues[3],
            },
            [currClues[0]]: `${cards['top-left'][0]}-${cards['top-right'][0]}`,
            [currClues[1]]: `${cards['bottom-right'][2]}-${cards['bottom-left'][2]}`,
            [currClues[2]]: `${cards['top-right'][1]}-${cards['bottom-right'][1]}`,
            [currClues[3]]: `${cards['bottom-left'][3]}-${cards['top-left'][3]}`,
        }
        socket.emit('submit-clues', answerKey)
    }

    function philGuessing () {
        $('.card').draggable({
            revert: true,
            revertDuration: 200,
            zIndex: 999,
        })
    }

    function redrawClover() {
        $('.lower-container').html(makeCard(cards, clues))
        updateButtons(makeCard)
        animateInputs(redrawClover)
    }

    function redrawGuess() {
        $('.lower-container').html(makeGuessCard(cards, clues))
        updateButtons(redrawGuess)
        updateCardArrows()
    }

    function redrawWaitingRoom([fin, unfin]) {
        const waitingString = (p, classes) => {
            return p.map(v => `<span class="${classes.join(' ')}">${v}</span>`).join('')
        }
        if ($('.waiting').length) {
            // just update list of people we're waiting on
            $('.waiting-on')
                .toArray()
                .filter(v => fin.includes($(v).html()))
                .forEach(v => $(v).addClass('not-waiting-on'))
        } else {
            // create everything
            $('.lower-container').html(() => {
                return `<div class="waiting">${waitingString(fin, ['not-waiting-on', 'waiting-on']) + waitingString(unfin, ['waiting-on'])}</div>
                <div class="loading-anim">
                    <div class="loading-bar" id="loading-bar-A"></div>
                    <div class="loading-bar" id="loading-bar-B"></div>
                    <div class="loading-bar" id="loading-bar-C"></div>
                    <div class="loading-bar" id="loading-bar-D"></div>
                    <div class="loading-bar" id="loading-bar-E"></div>
                </div>`
            })
            const anim = () => {
                $('#loading-bar-A').css('height', '2.5em')
                setTimeout(() => {
                    $('#loading-bar-B').css('height', '2.5em')
                }, 200)
                setTimeout(() => {
                    $('#loading-bar-A').css('height', '1.5em')
                    $('#loading-bar-C').css('height', '2.5em')
                }, 400)
                setTimeout(() => {
                    $('#loading-bar-B').css('height', '1.5em')
                    $('#loading-bar-D').css('height', '2.5em')
                }, 600)
                setTimeout(() => {
                    $('#loading-bar-C').css('height', '1.5em')
                    $('#loading-bar-E').css('height', '2.5em')
                }, 800)
                setTimeout(() => {
                    $('#loading-bar-D').css('height', '1.5em')
                }, 1000)
                setTimeout(() => {
                    $('#loading-bar-E').css('height', '1.5em')
                }, 1200)
            }
            anim()
            animInterval = setInterval(anim, 2000)
        }
    }

    function animateInputs() {
        $('.bottom-line > input').off().on('focus', function() {
            $(this).removeClass('error-input').parent().addClass('bottom-line-full')
        }).on('blur', function() {
            $(this).parent().removeClass('bottom-line-full')
        })
    }

    $('.join-game-button').on('click', () => {
        let name = $('.name-input').val().trim()
        if (!name) {
            showAlert('Name cannot be blank.')
        } else {
            socket.emit('name-selection', name)
        }
    })

    socket.on('showAlert', str => showAlert(str))

    socket.on('disconnected-users', userList => {
        if (userList.length) {
            $('.lower-container').append(`<div class="reconnect-buttons">
                <span class="small-title">Or reconnect as...</span>
                ${userList.map(v => `<button class="reconnect-as-button">${v}</button>`).join('')}
            </div>`)
            $('.reconnect-as-button').on('click', function() {
                socket.emit('reconnect-as', $(this).html())
            })
        }
    })

    socket.on('send-clover', clover => {
        cards = clover
        redrawClover()
    })

    socket.on('unfinished-players', players => {
        redrawWaitingRoom(players)
    })

    socket.on('lets-make-guesses', ({ cloverData, isLast }) => {
        guessData = cloverData
        isLastGuess = isLast
        clues = cloverData.answers.clueKey
        cards = {
            'top-left': [],
            'top-right': [],
            'bottom-left': [],
            'bottom-right': [],
            unplaced: []
        }
        for (let key of Object.keys(cards)) {
            if (key === 'unplaced') continue
            cards.unplaced.push(guessData.clover[key].words)
        }
        cards.unplaced.push(guessData.clover.extra.words)
        cards.unplaced = shuffle(cards.unplaced)
        clues = guessData.answers.clueKey
        redrawGuess()
    })

    socket.on('end-anim', () => animInterval.clearInterval())

    animateInputs()
    guessData = mockData
    cards = {
        'top-left': [],
        'top-right': [],
        'bottom-left': [],
        'bottom-right': [],
        unplaced: []
    }
    for (let key of Object.keys(cards)) {
        if (key === 'unplaced') continue
        cards.unplaced.push(guessData.clover[key].words)
    }
    cards.unplaced.push(guessData.clover.extra.words)
    cards.unplaced = shuffle(cards.unplaced)
    clues = guessData.answers.clueKey
    redrawGuess()
})